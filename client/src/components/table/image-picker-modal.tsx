import { useState, useRef, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Clipboard, Upload, Camera, Loader2 } from "lucide-react";
import type { Attachment } from "./notion-table";

interface ImagePickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attachments: Attachment[];
  onSelect?: (attachment: Attachment) => void;
  onFileSelect?: (file: File) => void;
  onPaste?: (file: File) => void;
}

export default function ImagePickerModal({
  open,
  onOpenChange,
  attachments,
  onSelect,
  onFileSelect,
  onPaste,
}: ImagePickerModalProps) {
  const [pasteActive, setPasteActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const pasteAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  const imageAttachments = attachments.filter((a) => a.mimeType.startsWith("image/"));

  useEffect(() => {
    if (open && pasteAreaRef.current) {
      pasteAreaRef.current.focus();
    }
  }, [open]);

  const handlePasteEvent = useCallback(
    async (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (!file) continue;
          setUploading(true);
          onPaste?.(file);
          onOpenChange(false);
          return;
        }
      }
    },
    [onPaste, onOpenChange]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files) {
        for (let i = 0; i < files.length; i++) {
          onFileSelect?.(files[i]);
        }
      }
      e.target.value = "";
      onOpenChange(false);
    },
    [onFileSelect, onOpenChange]
  );

  const handleScreenshot = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      setCameraStream(stream);
      setShowCamera(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {
      // User cancelled or API not supported
    }
  }, []);

  const captureScreenshot = useCallback(() => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `screenshot-${Date.now()}.png`, { type: "image/png" });
          onFileSelect?.(file);
          onOpenChange(false);
        }
      }, "image/png");
    }
    stopCamera();
  }, [onFileSelect, onOpenChange]);

  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
  }, [cameraStream]);

  useEffect(() => {
    if (!open) {
      stopCamera();
      setPasteActive(false);
      setUploading(false);
    }
  }, [open, stopCamera]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-4 py-3 border-b border-border/50">
          <DialogTitle>Add Image</DialogTitle>
        </DialogHeader>

        <div className="p-4">
          {showCamera ? (
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full rounded-lg bg-black"
              />
              <div className="flex items-center justify-center gap-3 mt-3">
                <button
                  onClick={captureScreenshot}
                  className="flex items-center gap-2 rounded-lg bg-foreground text-background px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
                >
                  <Camera size={14} />
                  Capture
                </button>
                <button
                  onClick={stopCamera}
                  className="flex items-center gap-2 rounded-lg border border-border/50 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Paste area - main focus */}
              <div
                ref={pasteAreaRef}
                tabIndex={0}
                onClick={() => fileInputRef.current?.click()}
                onPaste={handlePasteEvent}
                onFocus={() => setPasteActive(true)}
                onBlur={() => setPasteActive(false)}
                className={cn(
                  "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition-colors cursor-pointer",
                  pasteActive
                    ? "border-blue-500/50 bg-blue-500/10"
                    : "border-border/50 hover:border-foreground/50 hover:bg-accent/30"
                )}
              >
                {uploading ? (
                  <Loader2 size={24} className="text-muted-foreground animate-spin" />
                ) : (
                  <Clipboard size={24} className={cn("transition-colors", pasteActive ? "text-blue-400" : "text-muted-foreground")} />
                )}
                <div>
                  <p className={cn("text-sm font-medium", pasteActive ? "text-blue-400" : "text-foreground")}>
                    {uploading ? "Uploading..." : "Paste image here"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {uploading ? "Please wait" : "Click to upload or press Ctrl+V / Cmd+V to paste"}
                  </p>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />

              {/* Other options */}
              <div className="flex items-center justify-center gap-4 mt-4">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <Upload size={12} />
                  Upload file
                </button>
                <span className="text-muted-foreground/30">|</span>
                <button
                  onClick={handleScreenshot}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <Camera size={12} />
                  Screenshot
                </button>
              </div>

              {/* Existing images */}
              {imageAttachments.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Existing Images
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {imageAttachments.map((attachment) => (
                      <button
                        key={attachment.id}
                        onClick={() => {
                          onSelect?.(attachment);
                          onOpenChange(false);
                        }}
                        className="relative group rounded-lg overflow-hidden border border-border/50 hover:border-foreground/50 transition-colors cursor-pointer"
                      >
                        <img
                          src={attachment.url}
                          alt={attachment.originalName}
                          className="w-[50px] h-[80px] object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-[10px] text-white font-medium">Select</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
