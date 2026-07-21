import { Pin, PinOff, Trash2, Palette } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { StickyNote } from "@/store/slices/stickyNotesSlice";
import { NOTE_COLORS } from "@/store/slices/stickyNotesSlice";

interface StickyNoteCardProps {
  note: StickyNote;
  onClick: (id: string) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
  onChangeColor: (id: string, color: string) => void;
}

export default function StickyNoteCard({
  note,
  onClick,
  onDelete,
  onTogglePin,
  onChangeColor,
}: StickyNoteCardProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);

  const isWhite = note.color === "#ffffff";

  return (
    <div
      className={cn(
        "group relative flex w-[200px] h-[270px] flex-col rounded-xl border border-border/40 shadow-sm transition-all hover:shadow-md cursor-pointer",
        isWhite ? "bg-card" : ""
      )}
      style={{ backgroundColor: isWhite ? undefined : note.color }}
      onClick={() => onClick(note.id)}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onTogglePin(note.id);
        }}
        className={cn(
          "absolute -left-[10px] -top-[10px] z-10 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-white shadow-sm opacity-0 transition-opacity dark:bg-neutral-700",
          "group-hover:opacity-100",
          note.isPinned && "opacity-100"
        )}
      >
        {note.isPinned ? <PinOff size={11} className="text-gray-600 dark:text-gray-300" /> : <Pin size={11} className="text-gray-500 dark:text-gray-400" />}
      </button>

      <div className="px-3 pb-2 pt-3">
        {note.title && (
          <h3 className="mb-1.5 text-sm font-semibold leading-snug text-foreground break-words pr-6">
            {note.title}
          </h3>
        )}
        {note.content && (
          <div className="text-xs leading-relaxed text-foreground/80 break-words line-clamp-4 [&>*]:m-0 [&_ul]:pl-4 [&_ol]:pl-4" dangerouslySetInnerHTML={{ __html: note.content }} />
        )}
      </div>

      <div
        className="mt-auto flex items-center gap-0.5 px-2 py-1.5 opacity-0 transition-opacity group-hover:opacity-100"
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setShowColorPicker(!showColorPicker);
          }}
          className="flex h-7 w-7 items-center justify-center rounded hover:bg-black/10"
        >
          <Palette size={14} />
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(note.id);
          }}
          className="flex h-7 w-7 items-center justify-center rounded hover:bg-black/10 text-muted-foreground hover:text-red-400 ml-auto"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {showColorPicker && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={(e) => {
              e.stopPropagation();
              setShowColorPicker(false);
            }}
          />
          <div
            className="absolute bottom-full left-2 z-40 mb-1 flex flex-wrap gap-1 rounded-lg border border-border bg-popover p-2 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {NOTE_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => {
                  onChangeColor(note.id, color);
                  setShowColorPicker(false);
                }}
                className={cn(
                  "h-6 w-6 rounded-full border border-border/50 transition-transform hover:scale-110",
                  note.color === color && "ring-2 ring-ring ring-offset-1"
                )}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
