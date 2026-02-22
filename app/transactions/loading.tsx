export default function TransactionsLoading() {
  return (
    <div className="mx-auto max-w-5xl animate-pulse px-4 py-8">
      {/* Page Title */}
      <div className="mb-6 h-8 w-40 rounded bg-muted" />

      {/* Filter Bar */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="h-10 w-40 rounded bg-muted" />
        <div className="h-10 w-36 rounded bg-muted" />
        <div className="h-10 w-32 rounded bg-muted" />
      </div>

      {/* Transactions Table */}
      <div className="rounded-lg border border-border bg-card shadow-sm">
        {/* Table Header */}
        <div className="border-b border-border px-6 py-4">
          <div className="grid grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-4 w-full rounded bg-muted" />
            ))}
          </div>
        </div>
        {/* Table Rows */}
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="border-b border-border px-6 py-4 last:border-0"
          >
            <div className="grid grid-cols-5 gap-4">
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
