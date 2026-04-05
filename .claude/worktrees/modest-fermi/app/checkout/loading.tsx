export default function CheckoutLoading() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse px-4 py-8">
      {/* Page Title */}
      <div className="mb-6 h-8 w-36 rounded bg-muted" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Cart Items Column */}
        <div className="space-y-4 lg:col-span-2">
          {/* Cart Items Card */}
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 h-6 w-28 rounded bg-muted" />
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="mb-4 flex gap-4 border-b border-border pb-4 last:border-0"
              >
                <div className="h-20 w-20 flex-shrink-0 rounded bg-muted" />
                <div className="flex flex-1 flex-col justify-between">
                  <div className="h-4 w-3/4 rounded bg-muted" />
                  <div className="flex justify-between">
                    <div className="h-4 w-16 rounded bg-muted" />
                    <div className="h-4 w-20 rounded bg-muted" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Shipping Address Card */}
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 h-6 w-40 rounded bg-muted" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-border p-4"
                >
                  <div className="mb-2 h-4 w-32 rounded bg-muted" />
                  <div className="mb-1 h-3 w-full rounded bg-muted" />
                  <div className="h-3 w-2/3 rounded bg-muted" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Order Summary Column */}
        <div className="lg:col-span-1">
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 h-6 w-32 rounded bg-muted" />
            <div className="space-y-3">
              <div className="flex justify-between">
                <div className="h-4 w-20 rounded bg-muted" />
                <div className="h-4 w-16 rounded bg-muted" />
              </div>
              <div className="flex justify-between">
                <div className="h-4 w-24 rounded bg-muted" />
                <div className="h-4 w-16 rounded bg-muted" />
              </div>
              <div className="flex justify-between">
                <div className="h-4 w-16 rounded bg-muted" />
                <div className="h-4 w-16 rounded bg-muted" />
              </div>
              <hr className="my-2" />
              <div className="flex justify-between">
                <div className="h-5 w-16 rounded bg-muted" />
                <div className="h-5 w-20 rounded bg-muted" />
              </div>
            </div>
            <div className="mt-6 h-12 w-full rounded bg-muted" />
          </div>
        </div>
      </div>
    </div>
  );
}
