export default function ManageProductsLoading() {
  return (
    <div className="w-full animate-pulse px-4 py-8">
      {/* Page Title */}
      <div className="mb-6 h-8 w-48 rounded bg-muted" />

      {/* Tabs */}
      <div className="mb-6 flex gap-4 border-b border-border pb-3">
        <div className="h-6 w-28 rounded bg-muted" />
        <div className="h-6 w-36 rounded bg-muted" />
        <div className="h-6 w-36 rounded bg-muted" />
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Sidebar Filters */}
        <div className="w-full space-y-4 lg:w-1/4">
          <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <div className="mb-4 h-5 w-20 rounded bg-muted" />
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded bg-muted" />
                  <div className="h-4 w-24 rounded bg-muted" />
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <div className="mb-4 h-5 w-16 rounded bg-muted" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded bg-muted" />
                  <div className="h-4 w-20 rounded bg-muted" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className="w-full lg:w-3/4">
          {/* Search & Sort Bar */}
          <div className="mb-4 flex items-center justify-between">
            <div className="h-10 w-64 rounded bg-muted" />
            <div className="h-10 w-36 rounded bg-muted" />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-lg border border-border bg-card shadow-sm"
              >
                <div className="h-44 w-full bg-muted" />
                <div className="space-y-2 p-4">
                  <div className="h-4 w-3/4 rounded bg-muted" />
                  <div className="h-4 w-1/2 rounded bg-muted" />
                  <div className="flex items-center justify-between">
                    <div className="h-5 w-20 rounded bg-muted" />
                    <div className="h-6 w-16 rounded-full bg-muted" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
