export default function WalletLoading() {
  return (
    <div className="mx-auto max-w-4xl animate-pulse px-4 py-8">
      {/* Page Title */}
      <div className="mb-6 h-8 w-28 rounded bg-muted" />

      {/* Balance Card */}
      <div className="mb-8 rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="mb-2 h-4 w-28 rounded bg-muted" />
        <div className="mb-4 h-10 w-40 rounded bg-muted" />
        <div className="flex gap-3">
          <div className="h-10 w-28 rounded bg-muted" />
          <div className="h-10 w-28 rounded bg-muted" />
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="mb-4 h-6 w-44 rounded bg-muted" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-lg border border-border bg-card p-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-muted" />
              <div className="space-y-1">
                <div className="h-4 w-32 rounded bg-muted" />
                <div className="h-3 w-24 rounded bg-muted" />
              </div>
            </div>
            <div className="text-right">
              <div className="h-5 w-20 rounded bg-muted" />
              <div className="mt-1 h-3 w-16 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
