import { useState, useRef } from "react";
import { Play, RotateCcw, Zap, ImagePlus, X, Maximize, UserCircle, Keyboard, Pencil, Check } from "lucide-react";

interface Props {
  onPlay: (script: string, speed: number) => void;
  onReset: () => void;
  onExport: (script: string, speed: number) => void;
  onStartPreview: (script: string, speed: number) => void;
  isPlaying: boolean;
  isExporting: boolean;
  exportProgress: { current: number; total: number } | null;
  contactName: string;
  onContactNameChange: (name: string) => void;
  contactAvatar: string | null;
  onContactAvatarChange: (avatar: string | null) => void;
  images: Record<string, string>;
  onImagesChange: (images: Record<string, string>) => void;
  showKeyboard: boolean;
  onShowKeyboardChange: (v: boolean) => void;
}

const EXAMPLE_SCRIPT = `me: Hey, what's up?
them: Not much, you?
me: All good, listen
me: Did you see that video I sent you?
them: Which video?
me: The one of the guy falling off the bike lol
them: LMAOOO yeah, that was hilarious
me: I died laughing
them: Send me more of those`;

export default function ScriptEditor({
  onPlay,
  onReset,
  onExport,
  onStartPreview,
  isPlaying,
  isExporting,
  contactName,
  onContactNameChange,
  contactAvatar,
  onContactAvatarChange,
  images,
  onImagesChange,
  showKeyboard,
  onShowKeyboardChange,
}: Props) {
  const [script, setScript] = useState(EXAMPLE_SCRIPT);
  const [speed, setSpeed] = useState(1);
  const [editingImageName, setEditingImageName] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const imageCounter = useRef(Object.keys(images).length + 1);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newImages = { ...images };
    Array.from(files).forEach((file) => {
      const name = `photo${imageCounter.current++}`;
      const url = URL.createObjectURL(file);
      newImages[name] = url;
    });
    onImagesChange(newImages);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (name: string) => {
    const newImages = { ...images };
    URL.revokeObjectURL(newImages[name]);
    delete newImages[name];
    onImagesChange(newImages);
  };

  const startRename = (name: string) => {
    setEditingImageName(name);
    setEditingValue(name);
  };

  const confirmRename = (oldName: string) => {
    const newName = editingValue.trim();
    if (!newName || newName === oldName || images[newName]) {
      setEditingImageName(null);
      return;
    }
    const newImages: Record<string, string> = {};
    Object.entries(images).forEach(([k, v]) => {
      newImages[k === oldName ? newName : k] = v;
    });
    onImagesChange(newImages);
    setEditingImageName(null);
  };

  const busy = isPlaying || isExporting;

  return (
    <div className="w-full max-w-md space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-1">FakeChat</h1>
        <p className="text-sm text-muted-foreground">
          Simulate realistic conversations for your videos
        </p>
      </div>

      {/* Contact name + avatar */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">
          Contact name
        </label>
        <div className="flex gap-2 items-center">
          <input
            type="text"
            value={contactName}
            onChange={(e) => onContactNameChange(e.target.value)}
            className="flex-1 bg-muted border-none rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="Contact name"
          />
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                if (contactAvatar) URL.revokeObjectURL(contactAvatar);
                onContactAvatarChange(URL.createObjectURL(file));
              }
              if (avatarInputRef.current) avatarInputRef.current.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            className="relative w-[36px] h-[36px] rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden hover:ring-2 hover:ring-primary/50 transition-all group"
            title="Profile photo"
          >
            {contactAvatar ? (
              <>
                <img src={contactAvatar} alt="Avatar" className="w-full h-full object-cover" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    URL.revokeObjectURL(contactAvatar);
                    onContactAvatarChange(null);
                  }}
                  className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3.5 h-3.5 text-white" />
                </button>
              </>
            ) : (
              <UserCircle className="w-5 h-5 text-muted-foreground" />
            )}
          </button>
        </div>
      </div>

      {/* Script textarea */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">
          Conversation script
        </label>
        <textarea
          value={script}
          onChange={(e) => setScript(e.target.value)}
          rows={10}
          className="w-full bg-muted border-none rounded-lg px-3 py-2.5 text-sm text-foreground font-mono leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
          placeholder={`me: Your message\nthem: Contact's message`}
        />
        <p className="text-[11px] text-muted-foreground mt-1">
          Use <code className="bg-muted-foreground/20 px-1 rounded">me:</code> and{" "}
          <code className="bg-muted-foreground/20 px-1 rounded">them:</code> for each message.
          To send an image: <code className="bg-muted-foreground/20 px-1 rounded">me: photo1</code>
        </p>
      </div>

      {/* Image uploads */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-2 block">
          Images
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageUpload}
          className="hidden"
        />
        {Object.keys(images).length > 0 && (
          <div className="flex flex-wrap gap-3 mb-3">
            {Object.entries(images).map(([name, url]) => (
              <div key={name} className="flex flex-col items-center gap-1 group">
                <div className="relative">
                  <img src={url} alt={name} className="w-16 h-16 object-cover rounded-lg border border-border/40" />
                  <button
                    onClick={() => removeImage(name)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                {editingImageName === name ? (
                  <div className="flex items-center gap-1">
                    <input
                      autoFocus
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") confirmRename(name);
                        if (e.key === "Escape") setEditingImageName(null);
                      }}
                      className="w-16 text-[10px] text-center bg-muted border border-primary/50 rounded px-1 py-0.5 text-foreground focus:outline-none"
                    />
                    <button onClick={() => confirmRename(name)} className="text-primary">
                      <Check className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => startRename(name)}
                    className="flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                    title="Rename"
                  >
                    <span>{name}</span>
                    <Pencil className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100" />
                  </button>
                )}
              </div>
            ))}
            {/* Add more button inside the grid */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-16 h-16 rounded-lg border-2 border-dashed border-border/60 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
            >
              <ImagePlus className="w-5 h-5" />
              <span className="text-[9px]">Add</span>
            </button>
          </div>
        )}
        {Object.keys(images).length === 0 && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 bg-muted text-muted-foreground px-3 py-2 rounded-lg text-sm hover:text-foreground transition-colors"
          >
            <ImagePlus className="w-4 h-4" />
            Add image
          </button>
        )}
      </div>

      {/* Speed control */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
          <Zap className="w-3 h-3" />
          Speed: {speed}x
        </label>
        <input
          type="range"
          min={0.5}
          max={3}
          step={0.5}
          value={speed}
          onChange={(e) => setSpeed(parseFloat(e.target.value))}
          className="w-full accent-primary h-1"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>0.5x</span>
          <span>3x</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => onPlay(script, speed)}
          disabled={busy || !script.trim()}
          className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2.5 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          <Play className="w-4 h-4" />
          {isPlaying ? "Playing..." : "Play"}
        </button>
        <button
          onClick={onReset}
          className="flex items-center justify-center gap-1.5 bg-muted text-muted-foreground px-3 py-2.5 rounded-lg text-sm hover:text-foreground transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Keyboard toggle */}
      <button
        onClick={() => onShowKeyboardChange(!showKeyboard)}
        className={`w-full flex items-center justify-between gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-colors border ${
          showKeyboard
            ? "bg-primary/10 text-primary border-primary/30"
            : "bg-muted text-muted-foreground border-border/50 hover:text-foreground"
        }`}
      >
        <span className="flex items-center gap-2">
          <Keyboard className="w-4 h-4" />
          Show keyboard throughout conversation
        </span>
        <span className={`w-8 h-4 rounded-full transition-colors relative flex items-center px-0.5 shrink-0 ${showKeyboard ? "bg-primary" : "bg-muted-foreground/30"}`} style={{ height: 18 }}>
          <span className={`w-3.5 h-3.5 rounded-full bg-white shadow transition-transform ${showKeyboard ? "translate-x-[14px]" : "translate-x-0"}`} style={{ width: 14, height: 14 }} />
        </span>
      </button>

      {/* Preview button */}
      <button
        onClick={() => onStartPreview(script, speed)}
        disabled={busy || !script.trim()}
        className="w-full flex items-center justify-center gap-2 bg-muted text-foreground py-2.5 rounded-lg font-medium text-sm hover:bg-muted/80 transition-colors disabled:opacity-40 border border-border/50"
      >
        <Maximize className="w-4 h-4" />
        Start Preview
      </button>
    </div>
  );
}
