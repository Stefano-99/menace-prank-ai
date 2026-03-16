import { useState, useCallback, useRef } from "react";
import { toCanvas } from "html-to-image";
import { Muxer, ArrayBufferTarget } from "webm-muxer";
import type { ChatMessage } from "./useChatPlayback";

export interface ExportChatState {
  visibleMessages: ChatMessage[];
  isTyping: boolean;
  typingSender: "me" | "them";
  currentTypingText: string;
}

interface ExportProgress {
  current: number;
  total: number;
}

function computeTotalDuration(messages: ChatMessage[], speed: number): number {
  const charDelay = 45 / speed;
  const pauseBetween = 600 / speed;
  const imagePause = 400 / speed;
  const sendPause = 200 / speed;

  let total = 1000;

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];

    if (msg.image) {
      total += imagePause;
    } else {
      total += charDelay * (msg.text.length + 1);
      total += sendPause;
    }

    if (i < messages.length - 1) {
      total += pauseBetween;
    }
  }

  return total;
}

function wait(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function waitForPaint() {
  return new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  );
}

async function playExportState(
  messages: ChatMessage[],
  speed: number,
  onState: (state: ExportChatState) => void,
  shouldCancel: () => boolean
) {
  const charDelay = 45 / speed;
  const pauseBetween = 600 / speed;
  const imagePause = 400 / speed;
  const sendPause = 200 / speed;
  const visibleMessages: ChatMessage[] = [];

  for (let i = 0; i < messages.length; i++) {
    if (shouldCancel()) return;

    const msg = messages[i];

    if (msg.image) {
      await wait(imagePause);
      if (shouldCancel()) return;

      visibleMessages.push(msg);
      onState({
        visibleMessages: [...visibleMessages],
        isTyping: false,
        typingSender: msg.sender,
        currentTypingText: "",
      });
    } else {
      onState({
        visibleMessages: [...visibleMessages],
        isTyping: true,
        typingSender: msg.sender,
        currentTypingText: "",
      });

      for (let c = 0; c <= msg.text.length; c++) {
        if (shouldCancel()) return;

        onState({
          visibleMessages: [...visibleMessages],
          isTyping: true,
          typingSender: msg.sender,
          currentTypingText: msg.text.substring(0, c),
        });

        await wait(charDelay);
      }

      if (shouldCancel()) return;
      await wait(sendPause);
      if (shouldCancel()) return;

      visibleMessages.push(msg);
      onState({
        visibleMessages: [...visibleMessages],
        isTyping: false,
        typingSender: msg.sender,
        currentTypingText: "",
      });
    }

    if (i < messages.length - 1) {
      await wait(pauseBetween);
    }
  }

  await wait(1000);
}

export function useRecorder() {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [chatState, setChatState] = useState<ExportChatState | null>(null);
  const cancelRef = useRef(false);

  const startExport = useCallback(
    async (element: HTMLElement, messages: ChatMessage[], speed: number) => {
      if (messages.length === 0) return;
      cancelRef.current = false;
      setIsExporting(true);

      const FPS = 60;
      const frameIntervalMs = 1000 / FPS;
      const totalDuration = computeTotalDuration(messages, speed);
      const totalFrames = Math.ceil(totalDuration / frameIntervalMs);

      setProgress({ current: 0, total: totalFrames });
      setChatState({
        visibleMessages: [],
        isTyping: false,
        typingSender: "me",
        currentTypingText: "",
      });

      try {
        const rect = element.getBoundingClientRect();
        const pixelRatio = 1080 / rect.width;
        const width = 1080;
        const height = Math.round(rect.height * pixelRatio) & ~1;

        const target = new ArrayBufferTarget();
        const muxer = new Muxer({
          target,
          video: { codec: "V_VP9", width, height },
        });

        const encoder = new VideoEncoder({
          output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
          error: (err) => console.error("VideoEncoder error:", err),
        });

        encoder.configure({
          codec: "vp09.00.10.08",
          width,
          height,
          bitrate: 8_000_000,
          framerate: FPS,
        });

        const renderCanvas = () =>
          toCanvas(element, {
            width: rect.width,
            height: rect.height,
            pixelRatio,
            cacheBust: false,
            skipAutoScale: true,
          });

        let exportFinished = false;
        const startedAt = performance.now();

        const playbackPromise = playExportState(
          messages,
          speed,
          (state) => setChatState(state),
          () => cancelRef.current
        ).finally(() => {
          exportFinished = true;
        });

        await waitForPaint();

        let previousCanvas = await renderCanvas();
        let previousTimestampUs = 0;
        let encodedFrames = 0;

        while (!exportFinished && !cancelRef.current) {
          await waitForPaint();
          const currentCanvas = await renderCanvas();
          const currentTimestampUs = Math.max(
            Math.round((performance.now() - startedAt) * 1000),
            previousTimestampUs + 1
          );

          const frame = new VideoFrame(previousCanvas, {
            timestamp: previousTimestampUs,
            duration: currentTimestampUs - previousTimestampUs,
          });
          encoder.encode(frame, { keyFrame: encodedFrames % 60 === 0 });
          frame.close();

          previousCanvas = currentCanvas;
          previousTimestampUs = currentTimestampUs;
          encodedFrames += 1;

          setProgress({
            current: Math.min(Math.ceil(currentTimestampUs / 1000 / frameIntervalMs), totalFrames),
            total: totalFrames,
          });
        }

        await playbackPromise;

        if (!cancelRef.current) {
          const finalTimestampUs = Math.max(
            Math.round((performance.now() - startedAt) * 1000),
            previousTimestampUs + 1
          );

          const finalFrame = new VideoFrame(previousCanvas, {
            timestamp: previousTimestampUs,
            duration: finalTimestampUs - previousTimestampUs,
          });
          encoder.encode(finalFrame, { keyFrame: encodedFrames % 60 === 0 });
          finalFrame.close();

          setProgress({ current: totalFrames, total: totalFrames });
        }

        await encoder.flush();
        encoder.close();
        muxer.finalize();

        if (!cancelRef.current) {
          const blob = new Blob([target.buffer], { type: "video/webm" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `fakechat-${Date.now()}.webm`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(url), 2000);
        }
      } catch (err) {
        console.error("Frame-by-frame export failed:", err);
      }

      setChatState(null);
      setProgress(null);
      setIsExporting(false);
    },
    []
  );

  const cancelExport = useCallback(() => {
    cancelRef.current = true;
  }, []);

  return { isExporting, progress, chatState, startExport, cancelExport };
}
