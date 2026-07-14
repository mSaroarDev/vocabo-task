interface AccountSettingsTabProps {
  confirmDelete: boolean;
  deleteInput: string;
  onDeleteClick: () => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
  onDeleteInputChange: (value: string) => void;
}

export default function AccountSettingsTab({
  confirmDelete,
  deleteInput,
  onDeleteClick,
  onDeleteConfirm,
  onDeleteCancel,
  onDeleteInputChange,
}: AccountSettingsTabProps) {
  return (
    <div className="rounded-lg border border-red-500/20 bg-red-500/[0.03] p-5">
      {!confirmDelete ? (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Delete Account</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Permanently delete your account and all associated data.
            </p>
          </div>
          <button
            onClick={onDeleteClick}
            className="rounded-md bg-red-500/10 px-4 py-1.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20 cursor-pointer"
          >
            Delete
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-foreground">
            This action is irreversible. Type <strong>DELETE</strong> to confirm.
          </p>
          <input
            value={deleteInput}
            onChange={(e) => onDeleteInputChange(e.target.value)}
            placeholder="Type DELETE to confirm"
            className="w-full rounded-md border border-red-500/30 bg-transparent px-3 py-2 text-sm text-foreground outline-none focus:border-red-500/50"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={onDeleteConfirm}
              disabled={deleteInput !== "DELETE"}
              className="rounded-md bg-red-500/10 px-4 py-1.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-30 cursor-pointer"
            >
              Delete My Account
            </button>
            <button
              onClick={onDeleteCancel}
              className="rounded-md px-4 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
