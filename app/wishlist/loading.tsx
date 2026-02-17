export default function WishlistLoading() {
  return (
    <div className="mx-auto max-w-[1400px] animate-pulse px-4 py-8">
      {/* Page Title */}
      <div className="mb-6 h-8 w-36 rounded bg-gray-200" />

      {/* Wishlist Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm"
          >
            <div className="relative h-48 w-full bg-gray-200">
              {/* Heart icon placeholder */}
              <div className="absolute right-3 top-3 h-8 w-8 rounded-full bg-gray-300" />
            </div>
            <div className="space-y-2 p-4">
              <div className="h-4 w-3/4 rounded bg-gray-200" />
              <div className="h-4 w-1/2 rounded bg-gray-200" />
              <div className="flex items-center justify-between pt-1">
                <div className="h-5 w-20 rounded bg-gray-200" />
                <div className="h-8 w-24 rounded bg-gray-200" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
