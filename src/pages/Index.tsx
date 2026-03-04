import { useState, useCallback, useRef, useEffect } from "react";
import ScriptEditor from "@/components/ScriptEditor";
import IMessageSimulator from "@/components/IMessageSimulator";
import { useChatPlayback, parseScript } from "@/hooks/useChatPlayback";
import { useRecorder } from "@/hooks/useRecorder";
import { X } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const Index = () => {
  const [contactName, setContactName] = useState("John");
  const [images, setImages] = useState<Record<string, string>>({});
  const [contactAvatar, setContactAvatar] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [pendingScript, setPendingScript] = useState("");
  const [pendingSpeed, setPendingSpeed] = useState(1);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [isGroup, setIsGroup] = useState(false);
  const [participants, setParticipants] = useState<string[]>([]);
  const playback = useChatPlayback();
  const recorder = useRecorder();
  const simulatorRef = useRef<HTMLDivElement>(null);

  const handlePlay = useCallback(
    (script: string, speed: number) => {
      const parsed = parseScript(script, images, isGroup);
      if (parsed.contact !== "Contact") setContactName(parsed.contact);
      if (parsed.participants) setParticipants(parsed.participants);
      playback.play(parsed.messages, speed);
    },
    [playback, images, isGroup]
  );

  const handleExport = useCallback(
    (script: string, speed: number) => {
      if (!simulatorRef.current) return;
      const parsed = parseScript(script, images, isGroup);
      if (parsed.contact !== "Contact") setContactName(parsed.contact);
      if (parsed.participants) setParticipants(parsed.participants);
      playback.reset();
      recorder.startExport(simulatorRef.current, parsed.messages, speed);
    },
    [playback, recorder, images, isGroup]
  );

  const handleStartPreview = useCallback(
    (script: string, speed: number) => {
      const parsed = parseScript(script, images, isGroup);
      if (parsed.contact !== "Contact") setContactName(parsed.contact);
      if (parsed.participants) setParticipants(parsed.participants);
      setPendingScript(script);
      setPendingSpeed(speed);
      playback.reset();
      setPreviewMode(true);
    },
    [playback, images, isGroup]
  );

  useEffect(() => {
    if (previewMode && pendingScript) {
      const parsed = parseScript(pendingScript, images, isGroup);
      const timer = setTimeout(() => {
        playback.play(parsed.messages, pendingSpeed);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [previewMode]);

  const handleExitPreview = useCallback(() => {
    setPreviewMode(false);
    playback.reset();
    setPendingScript("");
  }, [playback]);

  const handleReset = useCallback(() => {
    playback.reset();
    if (recorder.isExporting) recorder.cancelExport();
  }, [playback, recorder]);

  const displayState = recorder.isExporting && recorder.chatState
    ? recorder.chatState
    : {
        visibleMessages: playback.visibleMessages,
        isTyping: playback.isTyping,
        typingSender: playback.typingSender,
        currentTypingText: playback.currentTypingText,
      };

  if (previewMode) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <button
          onClick={handleExitPreview}
          className="absolute top-4 right-4 z-50 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <div ref={simulatorRef}>
          <IMessageSimulator
            contactName={contactName}
            contactAvatar={contactAvatar}
            messages={displayState.visibleMessages}
            isTyping={displayState.isTyping}
            typingSender={displayState.typingSender}
            currentTypingText={displayState.currentTypingText}
            showKeyboard={showKeyboard}
            isGroup={isGroup}
            participants={participants}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row items-center justify-center gap-8 p-6">
      <ScriptEditor
        onPlay={handlePlay}
        onReset={handleReset}
        onExport={handleExport}
        onStartPreview={handleStartPreview}
        isPlaying={playback.isPlaying}
        isExporting={recorder.isExporting}
        exportProgress={recorder.progress}
        contactName={contactName}
        onContactNameChange={setContactName}
        contactAvatar={contactAvatar}
        onContactAvatarChange={setContactAvatar}
        images={images}
        onImagesChange={setImages}
        showKeyboard={showKeyboard}
        onShowKeyboardChange={setShowKeyboard}
        isGroup={isGroup}
        onIsGroupChange={setIsGroup}
      />

      <div className="shrink-0" ref={simulatorRef}>
        <IMessageSimulator
          contactName={contactName}
          contactAvatar={contactAvatar}
          messages={displayState.visibleMessages}
          isTyping={displayState.isTyping}
          typingSender={displayState.typingSender}
          currentTypingText={displayState.currentTypingText}
          showKeyboard={showKeyboard}
          isGroup={isGroup}
          participants={participants}
        />
      </div>

      {/* Export progress overlay */}
      {recorder.isExporting && recorder.progress && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-background rounded-2xl p-6 max-w-sm w-full mx-4 space-y-4 shadow-xl">
            <h3 className="text-foreground font-semibold text-center">Rendering video...</h3>
            <Progress value={(recorder.progress.current / recorder.progress.total) * 100} className="h-2" />
            <p className="text-sm text-muted-foreground text-center">
              Frame {recorder.progress.current} / {recorder.progress.total}
            </p>
            <button
              onClick={recorder.cancelExport}
              className="w-full py-2 rounded-lg bg-muted text-muted-foreground text-sm hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
