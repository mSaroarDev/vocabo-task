import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { WorkspaceIcon, workspaceIconOptions } from "@/lib/workspace-icons";

interface WorkspaceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  initialName?: string;
  initialIcon?: string;
  onSave: (value: { name: string; icon: string }) => void;
}

export default function WorkspaceModal({
  open,
  onOpenChange,
  title = "Add workspace",
  initialName = "",
  initialIcon = "briefcase",
  onSave,
}: WorkspaceModalProps) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("briefcase");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName(initialName);
      setIcon(initialIcon);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 100);
    }
  }, [initialIcon, initialName, open]);

  const handleSave = () => {
    const cleanName = name.trim();
    if (!cleanName) return;

    onSave({ name: cleanName, icon });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[#3b3b3b] bg-[#2b2b2b] text-[#e5e5e5]">
              <WorkspaceIcon name={icon} size={18} />
            </div>
            <input
              ref={inputRef}
              value={name}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") handleSave();
                if (event.key === "Escape") onOpenChange(false);
              }}
              placeholder="Workspace name"
              className="h-10 min-w-0 flex-1 rounded-lg border border-[#3b3b3b] bg-[#2b2b2b] px-3 text-sm text-[#e5e5e5] placeholder:text-[#666] outline-none transition-colors focus:border-[#5b5b5b]"
            />
          </div>

          <div className="grid grid-cols-5 gap-2">
            {workspaceIconOptions.map((option) => (
              <button
                key={option.name}
                type="button"
                title={option.label}
                onClick={() => setIcon(option.name)}
                className={cn(
                  "flex h-10 cursor-pointer items-center justify-center rounded-md border border-[#3b3b3b] text-[#a1a1a1] transition-colors hover:border-[#5b5b5b] hover:bg-[#2b2b2b] hover:text-[#e5e5e5]",
                  icon === option.name &&
                    "border-[#e5e5e5] bg-[#e5e5e5] text-[#1e1e1e] hover:bg-white hover:text-[#1e1e1e]"
                )}
              >
                <option.Icon size={17} />
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            onClick={() => onOpenChange(false)}
            className="cursor-pointer rounded-lg px-4 py-1.5 text-sm font-medium text-[#a1a1a1] transition-colors hover:bg-[#2b2b2b] hover:text-[#e5e5e5]"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="cursor-pointer rounded-lg bg-[#e5e5e5] px-4 py-1.5 text-sm font-medium text-[#1e1e1e] transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
