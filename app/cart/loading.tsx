export default function CartLoading() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse px-4 py-8">
      {/* Page Title */}
      <div className="mb-6 h-8 w-40 rounded bg-gray-200" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Cart Items */}
        <div className="space-y-4 lg:col-span-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex gap-4 rounded-lg border border-gray-100 bg-white p-4 shadow-sm"
            >
              {/* Product Image */}
              <div className="h-24 w-24 flex-shrink-0 rounded-lg bg-gray-200" />
              {/* Product Details */}
              <div className="flex flex-1 flex-col justify-between">
                <div className="space-y-2">
                  <div className="h-5 w-3/4 rounded bg-gray-200" />
                  <div className="h-4 w-1/2 rounded bg-gray-200" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="h-8 w-24 rounded bg-gray-200" />
                  <div className="h-5 w-20 rounded bg-gray-200" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-4">
          <div className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-4 h-6 w-32 rounded bg-gray-200" />
            <div className="space-y-3">
              <div className="flex justify-between">
                <div className="h-4 w-20 rounded bg-gray-200" />
                <div className="h-4 w-16 rounded bg-gray-200" />
              </div>
              <div className="flex justify-between">
                <div className="h-4 w-24 rounded bg-gray-200" />
                <div className="h-4 w-16 rounded bg-gray-200" />
              </div>
              <div className="flex justify-between">
                <div className="h-4 w-16 rounded bg-gray-200" />
                <div className="h-4 w-16 rounded bg-gray-200" />
              </div>
              <hr className="my-2" />
              <div className="flex justify-between">
                <div className="h-5 w-16 rounded bg-gray-200" />
                <div className="h-5 w-20 rounded bg-gray-200" />
              </div>
            </div>
            <div className="mt-6 h-12 w-full rounded bg-gray-200" />
          </div>
        </div>
      </div>
    </div>
  );
}
