import { useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface ImagePreviewProps {
  urls: string[];
  index: number;
  open: boolean;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}

export default function ImagePreview({ urls, index, open, onClose, onIndexChange }: ImagePreviewProps) {
  const hasMultiple = urls.length > 1;

  const showPrev = useCallback(() => {
    if (urls.length === 0) return;
    onIndexChange((index - 1 + urls.length) % urls.length);
  }, [index, urls.length, onIndexChange]);

  const showNext = useCallback(() => {
    if (urls.length === 0) return;
    onIndexChange((index + 1) % urls.length);
  }, [index, urls.length, onIndexChange]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") showPrev();
      if (e.key === "ArrowRight") showNext();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose, showPrev, showNext]);

  if (!open || urls.length === 0) return null;

  const url = urls[index];

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      onClick={onClose}
    >
      <div
        className="relative flex max-w-[90vw] max-h-[90vh] items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="fixed right-4 top-4 z-[60] flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>
        {hasMultiple && (
          <button
            onClick={showPrev}
            className="fixed left-4 top-1/2 z-[60] flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors cursor-pointer"
            aria-label="Previous image"
          >
            <ChevronLeft size={22} />
          </button>
        )}
        <img
          src={url}
          alt="Preview"
          className="max-h-[85vh] w-auto mx-auto rounded-lg"
        />
        {hasMultiple && (
          <button
            onClick={showNext}
            className="fixed right-4 top-1/2 z-[60] flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors cursor-pointer"
            aria-label="Next image"
          >
            <ChevronRight size={22} />
          </button>
        )}
        {hasMultiple && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs text-white">
            {index + 1} / {urls.length}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
