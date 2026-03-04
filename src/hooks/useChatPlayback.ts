import { useState, useCallback, useRef } from "react";

export interface ChatMessage {
  id: number;
  sender: "me" | "them";
  senderName?: string;
  text: string;
  image?: string;
}

export interface ParsedScript {
  contact: string;
  messages: ChatMessage[];
  isGroup?: boolean;
  participants?: string[];
}

// Predefined colors for group chat participants
const GROUP_COLORS = [
  "#0A84FF", // blue
  "#30D158", // green
  "#FF453A", // red
  "#FF9F0A", // orange
  "#BF5AF2", // purple
  "#64D2FF", // cyan
  "#FFD60A", // yellow
  "#FF375F", // pink
];

export function getParticipantColor(name: string, participants: string[]): string {
  const idx = participants.indexOf(name);
  return GROUP_COLORS[idx % GROUP_COLORS.length];
}

export function parseScript(script: string, images?: Record<string, string>, isGroup?: boolean): ParsedScript {
  const lines = script.trim().split("\n").filter((l) => l.trim());
  if (lines.length === 0) return { contact: "Contact", messages: [], isGroup };

  let contact = "Contact";
  let startIdx = 0;

  if (lines[0].toLowerCase().startsWith("name:")) {
    contact = lines[0].substring(5).trim();
    startIdx = 1;
  }

  const messages: ChatMessage[] = [];
  const participantSet = new Set<string>();
  let id = 0;

  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (isGroup) {
      // Group mode: "Name: message" format
      const colonIdx = line.indexOf(":");
      if (colonIdx > 0) {
        const name = line.substring(0, colonIdx).trim();
        const text = line.substring(colonIdx + 1).trim();
        const isMe = name.toLowerCase() === "me";
        const sender: "me" | "them" = isMe ? "me" : "them";
        const senderName = isMe ? undefined : name;
        
        if (senderName) participantSet.add(name);

        if (text) {
          const imageUrl = images?.[text.toLowerCase()];
          if (imageUrl && isMe) {
            messages.push({ id: id++, sender, senderName, text: "", image: imageUrl });
          } else {
            messages.push({ id: id++, sender, senderName, text });
          }
        }
      }
    } else {
      // Normal mode
      let sender: "me" | "them" = "me";
      let text = line;

      if (line.startsWith("me:") || line.startsWith("Me:") || line.startsWith("ME:")) {
        sender = "me";
        text = line.substring(3).trim();
      } else if (line.startsWith("them:") || line.startsWith("Them:") || line.startsWith("THEM:")) {
        sender = "them";
        text = line.substring(5).trim();
      } else if (line.startsWith("1:")) {
        sender = "me";
        text = line.substring(2).trim();
      } else if (line.startsWith("2:")) {
        sender = "them";
        text = line.substring(2).trim();
      }

      if (text) {
        const imageUrl = images?.[text.toLowerCase()];
        if (imageUrl && sender === "me") {
          messages.push({ id: id++, sender, text: "", image: imageUrl });
        } else {
          messages.push({ id: id++, sender, text });
        }
      }
    }
  }

  return { contact, messages, isGroup, participants: Array.from(participantSet) };
}

export function useChatPlayback() {
  const [visibleMessages, setVisibleMessages] = useState<ChatMessage[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [currentTypingText, setCurrentTypingText] = useState("");
  const [typingSender, setTypingSender] = useState<"me" | "them">("me");
  const [typingProgress, setTypingProgress] = useState(0);
  const cancelRef = useRef(false);

  const reset = useCallback(() => {
    setVisibleMessages([]);
    setIsPlaying(false);
    setIsTyping(false);
    setCurrentTypingText("");
    setTypingProgress(0);
    cancelRef.current = true;
  }, []);

  const play = useCallback(async (messages: ChatMessage[], speed: number = 1) => {
    cancelRef.current = false;
    setIsPlaying(true);
    setVisibleMessages([]);

    const charDelay = 45 / speed;
    const pauseBetween = 600 / speed;

    for (let i = 0; i < messages.length; i++) {
      if (cancelRef.current) break;

      const msg = messages[i];

      if (msg.image) {
        await new Promise((r) => setTimeout(r, 400 / speed));
        setVisibleMessages((prev) => [...prev, msg]);
      } else {
        setTypingSender(msg.sender);
        setIsTyping(true);
        setCurrentTypingText("");
        setTypingProgress(0);

        for (let c = 0; c <= msg.text.length; c++) {
          if (cancelRef.current) break;
          setCurrentTypingText(msg.text.substring(0, c));
          setTypingProgress(c / msg.text.length);
          await new Promise((r) => setTimeout(r, charDelay));
        }

        if (cancelRef.current) break;

        await new Promise((r) => setTimeout(r, 200 / speed));

        setIsTyping(false);
        setCurrentTypingText("");
        setVisibleMessages((prev) => [...prev, msg]);
      }

      if (i < messages.length - 1) {
        await new Promise((r) => setTimeout(r, pauseBetween));
      }
    }

    setIsPlaying(false);
    setIsTyping(false);
  }, []);

  return {
    visibleMessages,
    isPlaying,
    isTyping,
    currentTypingText,
    typingSender,
    typingProgress,
    play,
    reset,
  };
}
