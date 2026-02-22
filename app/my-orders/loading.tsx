export default function MyOrdersLoading() {
  return (
    <div className="w-full animate-pulse px-4 py-8 lg:px-12">
      {/* Page Title */}
      <div className="mb-6 h-8 w-36 rounded bg-muted" />

      {/* Filter Tabs */}
      <div className="mb-6 flex gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-9 w-24 rounded-full bg-muted" />
        ))}
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-border bg-card p-5 shadow-sm"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="h-5 w-32 rounded bg-muted" />
              <div className="h-6 w-20 rounded-full bg-muted" />
            </div>
            <div className="flex gap-4">
              <div className="h-16 w-16 flex-shrink-0 rounded bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 rounded bg-muted" />
                <div className="h-4 w-1/2 rounded bg-muted" />
              </div>
              <div className="text-right">
                <div className="h-5 w-20 rounded bg-muted" />
                <div className="mt-1 h-3 w-24 rounded bg-muted" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
