export default function QueriesLoading() {
  return (
    <div className="mx-auto max-w-4xl animate-pulse px-4 py-8">
      {/* Page Title */}
      <div className="mb-6 h-8 w-32 rounded bg-muted" />

      {/* Query List */}
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-border bg-card p-4 shadow-sm"
          >
            <div className="mb-2 flex items-center justify-between">
              <div className="h-5 w-48 rounded bg-muted" />
              <div className="h-3 w-20 rounded bg-muted" />
            </div>
            <div className="space-y-1">
              <div className="h-4 w-full rounded bg-muted" />
              <div className="h-4 w-3/4 rounded bg-muted" />
            </div>
            <div className="mt-3 flex items-center gap-2">
              <div className="h-6 w-16 rounded-full bg-muted" />
              <div className="h-4 w-24 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
