export default function SellerRewardsLoading() {
  return (
    <div className="w-full animate-pulse px-4 py-8 lg:px-12">
      {/* Page Title */}
      <div className="mb-6 h-8 w-40 rounded bg-muted" />

      {/* Summary Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-border bg-card p-5 shadow-sm"
          >
            <div className="mb-2 h-4 w-24 rounded bg-muted" />
            <div className="h-8 w-20 rounded bg-muted" />
          </div>
        ))}
      </div>

      {/* Rewards List */}
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-lg border border-border bg-card p-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-muted" />
              <div className="space-y-1">
                <div className="h-4 w-40 rounded bg-muted" />
                <div className="h-3 w-24 rounded bg-muted" />
              </div>
            </div>
            <div className="h-5 w-20 rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
