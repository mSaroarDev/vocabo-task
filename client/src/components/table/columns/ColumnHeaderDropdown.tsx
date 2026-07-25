import { useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowUpDown, Pencil, Trash2, Plus, ArrowLeft, GripVertical } from "lucide-react";
import type { ColumnDef, StatusOption } from "../types";
import { cn } from "@/lib/utils";

const STATUS_COLORS = [
  "bg-blue-600/20 text-blue-300",
  "bg-amber-500/20 text-amber-300",
  "bg-green-600/20 text-green-300",
  "bg-zinc-600/30 text-zinc-300",
  "bg-red-600/20 text-red-300",
  "bg-purple-500/20 text-purple-300",
  "bg-pink-500/20 text-pink-300",
  "bg-cyan-500/20 text-cyan-300",
];

function SortableStatusOption({
  option,
  onRenameStart,
  onDelete,
}: {
  option: StatusOption;
  onRenameStart: (option: StatusOption) => void;
  onDelete: (option: StatusOption) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: option._id || option.label,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-1 px-3 py-1.5 group hover:bg-white/5",
        isDragging && "opacity-40"
      )}
    >
      <span
        {...attributes}
        {...listeners}
        className="inline-flex cursor-grab active:cursor-grabbing text-muted-foreground/30 hover:text-muted-foreground transition-colors shrink-0"
      >
        <GripVertical size={12} />
      </span>
      <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs font-medium shrink-0", option.color)}>
        {option.label}
      </span>
      <div className="flex-1" />
      <button
        onClick={() => onRenameStart(option)}
        className="text-muted-foreground/40 hover:text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
      >
        <Pencil size={10} />
      </button>
      <button
        onClick={() => onDelete(option)}
        className="text-muted-foreground/40 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
      >
        <Trash2 size={10} />
      </button>
    </div>
  );
}

export function ColumnHeaderDropdown({
  column,
  sortKey,
  sortDir,
  onToggleSort,
  onRename,
  onRemove,
  onAddColumn,
  onClose,
  statusOptions,
  onCreateStatusOption,
  onUpdateStatusOption,
  onDeleteStatusOption,
  onReorderStatusOption,
}: {
  column: ColumnDef;
  sortKey: string | null;
  sortDir: "asc" | "desc";
  onToggleSort: (key: string) => void;
  onRename: (key: string, newLabel: string) => void;
  onRemove?: (key: string) => void;
  onAddColumn?: () => void;
  onClose: () => void;
  statusOptions?: StatusOption[];
  onCreateStatusOption?: (label: string, color: string) => void;
  onUpdateStatusOption?: (optionId: string, label: string, color: string) => void;
  onDeleteStatusOption?: (optionId: string) => void;
  onReorderStatusOption?: (optionIds: string[]) => void;
}) {
  const options = statusOptions || [];
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(column.label);
  const [editingStatuses, setEditingStatuses] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  const handleAdd = () => {
    if (!newLabel.trim() || !onCreateStatusOption) return;
    const usedColors = options.map((s) => s.color);
    const available = STATUS_COLORS.find((c) => !usedColors.includes(c));
    const color = available || STATUS_COLORS[options.length % STATUS_COLORS.length];
    onCreateStatusOption(newLabel.trim(), color);
    setNewLabel("");
    setAdding(false);
  };

  const handleRenameStart = (option: StatusOption) => {
    setEditingId(option._id || null);
    setEditingLabel(option.label);
  };

  const handleRenameSave = () => {
    if (!editingId || !editingLabel.trim() || !onUpdateStatusOption) return;
    const option = options.find((s) => s._id === editingId);
    if (option && editingLabel.trim() !== option.label) {
      onUpdateStatusOption(editingId, editingLabel.trim(), option.color);
    }
    setEditingId(null);
    setEditingLabel("");
  };

  const handleDelete = (option: StatusOption) => {
    if (option._id && onDeleteStatusOption) {
      onDeleteStatusOption(option._id);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !onReorderStatusOption) return;

    const oldIndex = options.findIndex((s) => (s._id || s.label) === active.id);
    const newIndex = options.findIndex((s) => (s._id || s.label) === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(options, oldIndex, newIndex);
    onReorderStatusOption(reordered.map((s) => s._id!));
  };

  const isStatusColumn = column.key === "status";

  return (
    <>
      <div className="fixed inset-0 z-20" onClick={onClose} />
      <div className="absolute left-0 top-full mt-1 z-30 bg-[#252525] border border-border rounded-lg shadow-xl py-1 min-w-[200px]">
        {editingStatuses ? (
          <>
            <div className="px-3 py-2 border-b border-border/50">
              <button
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                onClick={() => {
                  setEditingStatuses(false);
                  setAdding(false);
                  setEditingId(null);
                }}
              >
                <ArrowLeft size={12} />
                Back
              </button>
            </div>

            {adding && (
              <div className="flex items-center gap-2 px-3 py-2 border-b border-border/50">
                <input
                  autoFocus
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAdd();
                    if (e.key === "Escape") { setAdding(false); setNewLabel(""); }
                  }}
                  onBlur={() => {
                    if (newLabel.trim()) handleAdd();
                    else setAdding(false);
                  }}
                  className="flex-1 bg-transparent border border-border rounded px-2 py-1 text-xs text-foreground outline-none focus:border-foreground/50"
                  placeholder="Status name"
                />
                <button
                  onClick={handleAdd}
                  className="text-xs text-blue-400 hover:text-blue-300 cursor-pointer"
                >
                  Add
                </button>
              </div>
            )}

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={options.map((s) => s._id || s.label)}
                strategy={verticalListSortingStrategy}
              >
                <div className="max-h-[200px] overflow-y-auto">
                  {options.map((s) => (
                    <SortableStatusOption
                      key={s._id || s.label}
                      option={s}
                      onRenameStart={handleRenameStart}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            {!adding && (
              <div className="border-t border-border/50 mt-1">
                <button
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-xs hover:bg-white/10 text-left cursor-pointer text-muted-foreground"
                  onClick={() => setAdding(true)}
                >
                  <Plus size={12} />
                  Add status
                </button>
              </div>
            )}

            {editingId && (
              <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40" onClick={() => { setEditingId(null); setEditingLabel(""); }}>
                <div className="bg-[#252525] border border-border rounded-lg p-4 min-w-[280px]" onClick={(e) => e.stopPropagation()}>
                  <p className="text-xs text-muted-foreground mb-2">Rename status</p>
                  <input
                    autoFocus
                    value={editingLabel}
                    onChange={(e) => setEditingLabel(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRenameSave();
                      if (e.key === "Escape") { setEditingId(null); setEditingLabel(""); }
                    }}
                    className="w-full bg-transparent border border-border rounded px-2 py-1.5 text-sm text-foreground outline-none focus:border-foreground/50"
                  />
                  <div className="flex justify-end gap-2 mt-3">
                    <button
                      onClick={() => { setEditingId(null); setEditingLabel(""); }}
                      className="px-3 py-1 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleRenameSave}
                      className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-500 cursor-pointer"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : !renaming ? (
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
            {isStatusColumn && onCreateStatusOption && (
              <>
                <div className="border-t border-border/50 my-1" />
                <button
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-xs hover:bg-white/10 text-left cursor-pointer"
                  onClick={() => setEditingStatuses(true)}
                >
                  <Pencil size={12} />
                  Edit Options
                </button>
              </>
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
