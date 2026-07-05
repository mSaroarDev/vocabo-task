import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface ImagePreviewProps {
  url: string;
  open: boolean;
  onClose: () => void;
}

export default function ImagePreview({ url, open, onClose }: ImagePreviewProps) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      onClick={onClose}
    >
      <div className="relative max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>
        <img
          src={url}
          alt="Preview"
          className="max-h-[85vh] w-auto mx-auto rounded-lg"
        />
      </div>
    </div>,
    document.body
  );
}
