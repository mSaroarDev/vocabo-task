import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileHeaderProps {
  name: string;
  email: string;
  initials: string;
  avatar?: string;
  onAvatarUpload: (file: File) => Promise<void>;
}

export default function ProfileHeader({ name, email, initials, avatar, onAvatarUpload }: ProfileHeaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await onAvatarUpload(file);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="flex items-center gap-4 mb-10">
      <div className="relative group">
        <div
          className={cn(
            "flex h-14 w-14 items-center justify-center rounded-full text-lg font-semibold text-foreground overflow-hidden",
            !avatar && "bg-[#2b2b2b]"
          )}
        >
          {avatar ? (
            <img src={avatar} alt={name} className="h-full w-full object-contain" />
          ) : (
            initials
          )}
        </div>
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:opacity-100"
        >
          {uploading ? (
            <Loader2 size={16} className="animate-spin text-white" />
          ) : (
            <Camera size={16} className="text-white" />
          )}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="hidden"
          onChange={handleFile}
        />
      </div>
      <div>
        <h1 className="text-xl font-semibold text-foreground">{name}</h1>
        <p className="text-sm text-muted-foreground">{email}</p>
      </div>
    </div>
  );
}
