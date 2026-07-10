export default function NotificationSkeleton() {
  return (
    <div className="space-y-1 px-4 py-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex animate-pulse items-start gap-3 rounded-md p-3">
          <div className="h-8 w-8 flex-shrink-0 rounded-full bg-accent" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-3/4 rounded bg-accent" />
            <div className="h-3 w-1/2 rounded bg-accent" />
            <div className="h-2 w-1/4 rounded bg-accent/60" />
          </div>
        </div>
      ))}
    </div>
  );
}
