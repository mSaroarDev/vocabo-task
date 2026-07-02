import { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StatusOption } from "./notion-table";

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  wrapTaskName: boolean;
  onToggleWrap: () => void;
  statusOptions: StatusOption[];
  onStatusOptionsChange: (options: StatusOption[]) => void;
}

const statusBgColors = [
  "bg-blue-600/20 text-blue-300",
  "bg-amber-500/20 text-amber-300",
  "bg-green-600/20 text-green-300",
  "bg-zinc-600/30 text-zinc-300",
  "bg-red-600/20 text-red-300",
  "bg-purple-500/20 text-purple-300",
  "bg-pink-500/20 text-pink-300",
  "bg-cyan-500/20 text-cyan-300",
];

export default function SettingsModal({
  open,
  onClose,
  wrapTaskName,
  onToggleWrap,
  statusOptions,
  onStatusOptionsChange,
}: SettingsModalProps) {
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");

  if (!open) return null;

  const addStatus = () => {
    if (!newLabel.trim()) return;
    const usedColors = statusOptions.map((s) => s.color);
    const available = statusBgColors.find((c) => !usedColors.includes(c));
    onStatusOptionsChange([
      ...statusOptions,
      { label: newLabel.trim(), color: available || statusBgColors[statusOptions.length % statusBgColors.length] },
    ]);
    setNewLabel("");
    setAdding(false);
  };

  const removeStatus = (label: string) => {
    onStatusOptionsChange(statusOptions.filter((s) => s.label !== label));
  };

  const renameStatus = (oldLabel: string, newLabel: string) => {
    if (!newLabel.trim()) return;
    onStatusOptionsChange(
      statusOptions.map((s) => (s.label === oldLabel ? { ...s, label: newLabel.trim() } : s))
    );
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[460px] bg-[#1a1a1a] border border-border rounded-xl shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
          <h2 className="text-sm font-medium text-foreground">Table Settings</h2>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
          {/* Wrap task name */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground">Wrap task name</p>
              <p className="text-xs text-muted-foreground mt-0.5">Allow long task names to wrap to multiple lines</p>
            </div>
            <button
              onClick={onToggleWrap}
              className={cn(
                "relative h-6 w-11 rounded-full transition-colors cursor-pointer shrink-0",
                wrapTaskName ? "bg-blue-600" : "bg-zinc-600"
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform",
                  wrapTaskName && "translate-x-5"
                )}
              />
            </button>
          </div>

          {/* Status options */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-foreground">Status Options</p>
              <button
                onClick={() => setAdding(true)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <Plus size={12} />
                Add status
              </button>
            </div>

            {adding && (
              <div className="flex items-center gap-2 mb-2">
                <input
                  autoFocus
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addStatus()}
                  className="flex-1 bg-transparent border border-border rounded px-2 py-1 text-xs text-foreground outline-none focus:border-foreground/50"
                  placeholder="Status name"
                />
                <button
                  onClick={addStatus}
                  className="text-xs text-blue-400 hover:text-blue-300 cursor-pointer"
                >
                  Add
                </button>
                <button
                  onClick={() => setAdding(false)}
                  className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}

            <div className="space-y-1.5">
              {statusOptions.map((s) => (
                <StatusRow key={s.label} option={s} onRename={renameStatus} onRemove={removeStatus} />
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-5 py-3 border-t border-border/50 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-sm font-medium text-foreground bg-accent hover:bg-accent/80 rounded-md transition-colors cursor-pointer"
          >
            Save
          </button>
        </div>
      </div>
    </>
  );
}

function StatusRow({
  option,
  onRename,
  onRemove,
}: {
  option: StatusOption;
  onRename: (oldLabel: string, newLabel: string) => void;
  onRemove: (label: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(option.label);

  return (
    <div className="flex items-center gap-2 group">
      {editing ? (
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => {
            onRename(option.label, value);
            setEditing(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onRename(option.label, value);
              setEditing(false);
            }
            if (e.key === "Escape") setEditing(false);
          }}
          className="flex-1 bg-transparent border border-border rounded px-2 py-1 text-xs text-foreground outline-none focus:border-foreground/50"
        />
      ) : (
        <div className="flex-1 flex items-center gap-2">
          <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", option.color)}>
            {option.label}
          </span>
          <button
            onClick={() => {
              setValue(option.label);
              setEditing(true);
            }}
            className="text-[10px] text-muted-foreground/50 hover:text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          >
            edit
          </button>
        </div>
      )}
      <button
        onClick={() => onRemove(option.label)}
        className="text-muted-foreground/30 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shrink-0"
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
}
