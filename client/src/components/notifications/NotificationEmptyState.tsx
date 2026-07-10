import { Bell } from "lucide-react";

export default function NotificationEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent">
        <Bell size={24} className="text-muted-foreground" />
      </div>
      <h3 className="text-sm font-medium text-foreground">No activity yet</h3>
      <p className="mt-1 text-xs text-muted-foreground max-w-[240px]">
        Actions from your team will appear here
      </p>
    </div>
  );
}
