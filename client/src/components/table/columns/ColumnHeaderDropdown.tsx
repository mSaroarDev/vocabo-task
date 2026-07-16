import { useState } from "react";
import { ArrowUpDown, Pencil, Trash2, Plus } from "lucide-react";
import type { ColumnDef } from "../types";

export function ColumnHeaderDropdown({
  column,
  sortKey,
  sortDir,
  onToggleSort,
  onRename,
  onRemove,
  onAddColumn,
  onClose,
}: {
  column: ColumnDef;
  sortKey: string | null;
  sortDir: "asc" | "desc";
  onToggleSort: (key: string) => void;
  onRename: (key: string, newLabel: string) => void;
  onRemove?: (key: string) => void;
  onAddColumn?: () => void;
  onClose: () => void;
}) {
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(column.label);

  return (
    <>
      <div className="fixed inset-0 z-20" onClick={onClose} />
      <div className="absolute left-0 top-full mt-1 z-30 bg-[#252525] border border-border rounded-lg shadow-xl py-1 min-w-[200px]">
        {!renaming ? (
          <>
            <button
              className="flex w-full items-center gap-2 px-3 py-1.5 text-xs hover:bg-white/10 text-left cursor-pointer"
              onClick={() => {
                onToggleSort(column.key);
                onClose();
              }}
            >
              <ArrowUpDown size={12} />
              {sortKey === column.key && sortDir === "asc" ? "Sort descending" : "Sort ascending"}
            </button>
            <div className="border-t border-border/50 my-1" />
            <button
              className="flex w-full items-center gap-2 px-3 py-1.5 text-xs hover:bg-white/10 text-left cursor-pointer"
              onClick={() => setRenaming(true)}
            >
              <Pencil size={12} />
              Rename
            </button>
            {onRemove && (
              <button
                className="flex w-full items-center gap-2 px-3 py-1.5 text-xs hover:bg-white/10 text-left cursor-pointer text-red-300"
                onClick={() => {
                  onRemove(column.key);
                  onClose();
                }}
              >
                <Trash2 size={12} />
                Delete
              </button>
            )}
            {onAddColumn && (
              <>
                <div className="border-t border-border/50 my-1" />
                <button
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-xs hover:bg-white/10 text-left cursor-pointer"
                  onClick={() => {
                    onAddColumn();
                    onClose();
                  }}
                >
                  <Plus size={12} />
                  Add column
                </button>
              </>
            )}
          </>
        ) : (
          <div className="px-3 py-2">
            <input
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={() => {
                if (renameValue.trim()) onRename(column.key, renameValue.trim());
                onClose();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (renameValue.trim()) onRename(column.key, renameValue.trim());
                  onClose();
                }
                if (e.key === "Escape") onClose();
              }}
              className="w-full bg-transparent border border-border rounded px-2 py-1 text-xs text-foreground outline-none focus:border-foreground/50"
              placeholder="Column name"
            />
          </div>
        )}
      </div>
    </>
  );
}
