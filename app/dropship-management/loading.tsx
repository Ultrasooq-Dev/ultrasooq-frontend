export default function DropshipManagementLoading() {
  return (
    <div className="w-full animate-pulse px-4 py-8">
      {/* Page Title */}
      <div className="mb-6 h-8 w-52 rounded bg-muted" />

      {/* Filter / Search Bar */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="h-10 w-64 rounded bg-muted" />
        <div className="h-10 w-36 rounded bg-muted" />
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-lg border border-border bg-card shadow-sm"
          >
            <div className="h-40 w-full bg-muted" />
            <div className="space-y-2 p-4">
              <div className="h-4 w-3/4 rounded bg-muted" />
              <div className="h-4 w-1/2 rounded bg-muted" />
              <div className="flex items-center justify-between pt-2">
                <div className="h-5 w-20 rounded bg-muted" />
                <div className="h-6 w-16 rounded-full bg-muted" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
