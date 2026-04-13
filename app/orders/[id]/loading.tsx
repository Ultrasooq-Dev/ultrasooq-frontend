export default function OrderDetailLoading() {
  return (
    <div className="mx-auto max-w-4xl animate-pulse px-4 py-8">
      {/* Back Link */}
      <div className="mb-4 h-5 w-24 rounded bg-muted" />

      {/* Page Title + Status */}
      <div className="mb-6 flex items-center justify-between">
        <div className="h-8 w-40 rounded bg-muted" />
        <div className="h-7 w-24 rounded-full bg-muted" />
      </div>

      {/* Order Items */}
      <div className="mb-6 rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="mb-4 h-5 w-28 rounded bg-muted" />
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="mb-4 flex gap-4 border-b border-border pb-4 last:mb-0 last:border-0 last:pb-0"
          >
            <div className="h-20 w-20 flex-shrink-0 rounded bg-muted" />
            <div className="flex flex-1 flex-col justify-between">
              <div className="space-y-1">
                <div className="h-4 w-3/4 rounded bg-muted" />
                <div className="h-3 w-1/2 rounded bg-muted" />
              </div>
              <div className="flex justify-between">
                <div className="h-4 w-16 rounded bg-muted" />
                <div className="h-4 w-20 rounded bg-muted" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Order Summary + Shipping Info */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <div className="mb-4 h-5 w-32 rounded bg-muted" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <div className="h-4 w-24 rounded bg-muted" />
                <div className="h-4 w-20 rounded bg-muted" />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <div className="mb-4 h-5 w-36 rounded bg-muted" />
          <div className="space-y-2">
            <div className="h-4 w-full rounded bg-muted" />
            <div className="h-4 w-3/4 rounded bg-muted" />
            <div className="h-4 w-1/2 rounded bg-muted" />
          </div>
        </div>
      </div>
    </div>
  );
}
