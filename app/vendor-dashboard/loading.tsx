export default function VendorDashboardLoading() {
  return (
    <div className="w-full animate-pulse px-6 py-8 lg:px-12">
      {/* Page Title */}
      <div className="mb-6 h-8 w-44 rounded bg-muted" />

      {/* Stats Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-border bg-card p-5 shadow-sm"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="h-4 w-20 rounded bg-muted" />
              <div className="h-8 w-8 rounded bg-muted" />
            </div>
            <div className="h-8 w-24 rounded bg-muted" />
            <div className="mt-2 h-3 w-32 rounded bg-muted" />
          </div>
        ))}
      </div>

      {/* Filters Card */}
      <div className="mb-6 rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div className="h-10 w-40 rounded bg-muted" />
          <div className="h-10 w-40 rounded bg-muted" />
          <div className="h-10 w-32 rounded bg-muted" />
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-lg border border-border bg-card shadow-sm">
        {/* Table Header */}
        <div className="border-b border-border px-6 py-4">
          <div className="grid grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-4 w-full rounded bg-muted" />
            ))}
          </div>
        </div>
        {/* Table Rows */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="border-b border-border px-6 py-4 last:border-0"
          >
            <div className="grid grid-cols-6 gap-4">
              <div className="h-4 w-full rounded bg-muted" />
              <div className="h-4 w-full rounded bg-muted" />
              <div className="h-4 w-3/4 rounded bg-muted" />
              <div className="h-4 w-1/2 rounded bg-muted" />
              <div className="h-6 w-20 rounded-full bg-muted" />
              <div className="h-4 w-2/3 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
