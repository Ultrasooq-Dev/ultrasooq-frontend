export default function ShareLinksLoading() {
  return (
    <div className="mx-auto max-w-4xl animate-pulse px-4 py-8">
      {/* Page Title */}
      <div className="mb-6 h-8 w-36 rounded bg-muted" />

      {/* Action Button */}
      <div className="mb-6 flex justify-end">
        <div className="h-10 w-36 rounded bg-muted" />
      </div>

      {/* Links List */}
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-lg border border-border bg-card p-4 shadow-sm"
          >
            <div className="flex-1 space-y-1">
              <div className="h-4 w-48 rounded bg-muted" />
              <div className="h-3 w-64 rounded bg-muted" />
            </div>
            <div className="flex items-center gap-3">
              <div className="h-4 w-16 rounded bg-muted" />
              <div className="h-8 w-8 rounded bg-muted" />
              <div className="h-8 w-8 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
