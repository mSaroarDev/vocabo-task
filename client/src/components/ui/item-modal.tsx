import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  initialValue?: string;
  onSave: (value: string) => void;
}

export default function ItemModal({ open, onOpenChange, title, initialValue = "", onSave }: ItemModalProps) {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setValue(initialValue);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 100);
    }
  }, [open, initialValue]);

  const handleSave = () => {
    if (value.trim()) {
      onSave(value.trim());
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
              if (e.key === "Escape") onOpenChange(false);
            }}
            placeholder="Untitled"
            className="w-full rounded-lg border border-[#3b3b3b] bg-[#2b2b2b] px-3 py-2 text-sm text-[#e5e5e5] placeholder:text-[#666] outline-none transition-colors focus:border-[#5b5b5b]"
          />
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
            className="cursor-pointer rounded-lg bg-[#e5e5e5] px-4 py-1.5 text-sm font-medium text-[#1e1e1e] transition-colors hover:bg-white"
          >
            Save
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
