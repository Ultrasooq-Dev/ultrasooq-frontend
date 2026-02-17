export default function SellerOrderDetailLoading() {
  return (
    <div className="mx-auto max-w-4xl animate-pulse px-4 py-8">
      {/* Back Link */}
      <div className="mb-4 h-5 w-28 rounded bg-gray-200" />

      {/* Page Title + Status */}
      <div className="mb-6 flex items-center justify-between">
        <div className="h-8 w-44 rounded bg-gray-200" />
        <div className="h-7 w-24 rounded-full bg-gray-200" />
      </div>

      {/* Order Items */}
      <div className="mb-6 rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-4 h-5 w-28 rounded bg-gray-200" />
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="mb-4 flex gap-4 border-b border-gray-100 pb-4 last:mb-0 last:border-0 last:pb-0"
          >
            <div className="h-20 w-20 flex-shrink-0 rounded bg-gray-200" />
            <div className="flex flex-1 flex-col justify-between">
              <div className="space-y-1">
                <div className="h-4 w-3/4 rounded bg-gray-200" />
                <div className="h-3 w-1/2 rounded bg-gray-200" />
              </div>
              <div className="flex justify-between">
                <div className="h-4 w-16 rounded bg-gray-200" />
                <div className="h-4 w-20 rounded bg-gray-200" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Customer + Summary */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-4 h-5 w-36 rounded bg-gray-200" />
          <div className="space-y-2">
            <div className="h-4 w-full rounded bg-gray-200" />
            <div className="h-4 w-3/4 rounded bg-gray-200" />
            <div className="h-4 w-1/2 rounded bg-gray-200" />
          </div>
        </div>
        <div className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-4 h-5 w-32 rounded bg-gray-200" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <div className="h-4 w-24 rounded bg-gray-200" />
                <div className="h-4 w-20 rounded bg-gray-200" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
