import { useState, useRef, useEffect, useCallback } from "react";
import { Paperclip, ImagePlus, Loader2 } from "lucide-react";
import type { Task } from "../types";
import { cn } from "@/lib/utils";
import { useAppDispatch } from "@/store/hooks";
import { addTaskAttachment } from "@/store/slices/tasksSlice";

export function AttachmentCell({
  task,
  teamId,
  workspaceId,
  onImagePreview,
}: {
  task: Task;
  teamId?: string;
  workspaceId?: string;
  onImagePreview?: (urls: string[], index: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const pasteRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (editing && pasteRef.current) {
      pasteRef.current.focus();
    }
  }, [editing]);

  const uploadFile = useCallback(
    async (file: File) => {
      if (!teamId || !workspaceId) return;
      setUploading(true);
      try {
        await dispatch(addTaskAttachment({ teamId, workspaceId, taskId: task.id, file })).unwrap();
      } catch {
        // upload failed
      } finally {
        setUploading(false);
        setEditing(false);
      }
    },
    [dispatch, teamId, workspaceId, task.id]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          e.preventDefault();
          const file = items[i].getAsFile();
          if (file) uploadFile(file);
          return;
        }
      }
    },
    [uploadFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) uploadFile(file);
      e.target.value = "";
    },
    [uploadFile]
  );

  const imageAttachments = task.attachments.filter((a) => a.mimeType.startsWith("image/"));

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        {imageAttachments.slice(0, 3).map((att) => (
          <img
            key={att.id}
            src={att.url}
            alt={att.originalName}
            className="h-7 w-7 rounded object-cover border border-white/[0.06]"
          />
        ))}
        <div
          ref={pasteRef}
          tabIndex={0}
          onClick={() => fileRef.current?.click()}
          onPaste={handlePaste}
          className={cn(
            "flex h-7 items-center gap-1 rounded border border-dashed px-2 text-xs cursor-pointer transition-colors",
            "border-blue-500/50 bg-blue-500/10 text-blue-400"
          )}
        >
          {uploading ? (
            <Loader2 size={10} className="animate-spin" />
          ) : (
            <ImagePlus size={10} />
          )}
          <span className="whitespace-nowrap">{uploading ? "Uploading..." : "Paste here"}</span>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileInput}
        />
      </div>
    );
  }

  if (task.attachments.length === 0) {
    return (
      <div className="relative inline-flex items-center">
        <button
          onClick={() => setEditing(true)}
          className="flex h-7 items-center gap-1 rounded border border-dashed border-border/50 px-2 text-xs text-muted-foreground/40 hover:text-muted-foreground hover:border-border transition-colors cursor-pointer"
        >
          <ImagePlus size={10} />
          <span>Add</span>
        </button>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileInput}
        />
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1">
      {task.attachments.slice(0, 3).map((att) =>
        att.mimeType?.startsWith("image/") && att.url ? (
          <img
            key={att.id}
            src={att.url}
            alt={att.originalName}
            className="h-7 w-7 rounded object-cover border border-white/[0.06] cursor-pointer hover:ring-2 hover:ring-blue-500/50 transition-all"
            onClick={() =>
              onImagePreview?.(
                imageAttachments.filter((a) => a.url).map((a) => a.url),
                imageAttachments.findIndex((a) => a.id === att.id)
              )
            }
          />
        ) : (
          <span
            key={att.id}
            className="flex h-7 w-7 items-center justify-center rounded border border-white/[0.06] bg-white/[0.03]"
          >
            <Paperclip size={12} className="text-muted-foreground" />
          </span>
        )
      )}
      {task.attachments.length > 3 && (
        <span className="text-xs text-muted-foreground ml-0.5">
          +{task.attachments.length - 3}
        </span>
      )}
      <button
        onClick={() => setEditing(true)}
        className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground/30 hover:text-muted-foreground hover:bg-accent/50 transition-colors cursor-pointer"
      >
        <ImagePlus size={12} />
      </button>
    </div>
  );
}
