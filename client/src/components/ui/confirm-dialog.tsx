import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
}

export default function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Delete",
  onConfirm,
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <p className="mt-2 text-sm text-[#a1a1a1]">{description}</p>
        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            onClick={() => onOpenChange(false)}
            className="cursor-pointer rounded-lg px-4 py-1.5 text-sm font-medium text-[#a1a1a1] transition-colors hover:bg-[#2b2b2b] hover:text-[#e5e5e5]"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="cursor-pointer rounded-lg bg-[#ef4444] px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#dc2626]"
          >
            {confirmLabel}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
