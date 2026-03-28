import { useState, useRef } from "react";
import { User } from "@/lib/api";
import { X, Upload, Trash2 } from "lucide-react";

// Fallback preset avatars based on simple abstract SVGs or DiceBear URLs
const PRESETS = [
  "https://api.dicebear.com/9.x/notionists/svg?seed=Felix&backgroundColor=f5f5f5",
  "https://api.dicebear.com/9.x/notionists/svg?seed=Aneka&backgroundColor=f5f5f5",
  "https://api.dicebear.com/9.x/notionists/svg?seed=Leo&backgroundColor=f5f5f5",
  "https://api.dicebear.com/9.x/notionists/svg?seed=Mia&backgroundColor=f5f5f5",
  "https://api.dicebear.com/9.x/notionists/svg?seed=Jack&backgroundColor=f5f5f5",
  "https://api.dicebear.com/9.x/notionists/svg?seed=Zoe&backgroundColor=f5f5f5",
  "https://api.dicebear.com/9.x/notionists/svg?seed=Lily&backgroundColor=f5f5f5",
  "https://api.dicebear.com/9.x/notionists/svg?seed=Sam&backgroundColor=f5f5f5",
];

interface Props {
  user: User;
  onClose: () => void;
  onSave: (pic: string | null) => Promise<void>;
}

export default function ProfileModal({ user, onClose, onSave }: Props) {
  const [selectedPic, setSelectedPic] = useState<string | null>(user.profile_pic || null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    setLoading(true);
    try {
      await onSave(selectedPic);
    } finally {
      setLoading(false);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Create canvas to resize and compress the image
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Target size (small max 100x100 to keep DB light)
        const size = 150;
        canvas.width = size;
        canvas.height = size;

        // Cover crop centering
        const scale = Math.max(size / img.width, size / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        const x = (size - w) / 2;
        const y = (size - h) / 2;

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, size, size);
        ctx.drawImage(img, x, y, w, h);

        // Convert to aggressive JPEG
        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        setSelectedPic(dataUrl);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md animate-scale-in rounded-2xl border border-border bg-gradient-card shadow-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display text-2xl text-gradient-gold">PROFILE PICTURE</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-muted-foreground hover:bg-muted transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Current Avatar preview */}
        <div className="flex flex-col items-center justify-center mb-6">
          <div className="relative h-24 w-24 mb-3 border border-border shadow-sm rounded-full overflow-hidden flex items-center justify-center bg-muted text-foreground font-display text-3xl shrink-0">
            {selectedPic ? (
              <img src={selectedPic} alt="Selected" className="h-full w-full object-cover" />
            ) : (
              <span>{user.username.slice(0, 2).toUpperCase()}</span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors shrink-0"
            >
              <Upload size={12} /> UPLOAD
            </button>
            {(selectedPic !== null) && (
              <button
                onClick={() => setSelectedPic(null)}
                className="flex items-center gap-1.5 rounded-lg border border-transparent px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors shrink-0"
              >
                <Trash2 size={12} /> REMOVE
              </button>
            )}
          </div>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                processFile(e.target.files[0]);
                e.target.value = ""; // reset
              }
            }}
          />
        </div>

        {/* Presets Grid */}
        <div className="mb-6">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3 text-center">Or Pick an Avatar</p>
          <div className="grid grid-cols-4 gap-3">
            {PRESETS.map((url, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setSelectedPic(url)}
                className={`group relative aspect-square overflow-hidden rounded-xl border border-border transition-all hover:scale-105 ${
                  selectedPic === url ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "hover:border-primary/50"
                }`}
              >
                <img src={url} alt={`Avatar ${i + 1}`} className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-border py-3 text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors"
          >
            CANCEL
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 rounded-xl bg-primary py-3 font-display text-lg tracking-wider text-primary-foreground hover:brightness-110 disabled:opacity-50 transition-all glow-gold"
          >
            {loading ? "SAVING..." : "SAVE"}
          </button>
        </div>
      </div>
    </div>
  );
}
