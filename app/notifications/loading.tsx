export default function NotificationsLoading() {
  return (
    <div className="mx-auto max-w-3xl animate-pulse px-4 py-8">
      {/* Page Title */}
      <div className="mb-6 h-8 w-40 rounded bg-muted" />

      {/* Notification List */}
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex gap-4 rounded-lg border border-border bg-card p-4 shadow-sm"
          >
            {/* Icon */}
            <div className="h-10 w-10 flex-shrink-0 rounded-full bg-muted" />
            {/* Content */}
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 rounded bg-muted" />
              <div className="h-3 w-1/2 rounded bg-muted" />
              <div className="h-3 w-24 rounded bg-muted" />
            </div>
            {/* Timestamp */}
            <div className="h-3 w-16 flex-shrink-0 rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
