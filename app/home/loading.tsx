export default function HomeLoading() {
  return (
    <div className="w-full animate-pulse">
      {/* Hero Banner Skeleton */}
      <div className="h-[300px] w-full bg-gray-200 sm:h-[400px] lg:h-[500px]" />

      {/* Category + Products Section */}
      <div className="mx-auto max-w-[1400px] px-4 py-8">
        {/* Section Title */}
        <div className="mb-6 h-8 w-48 rounded bg-gray-200" />

        {/* Product Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm"
            >
              <div className="h-48 w-full bg-gray-200" />
              <div className="space-y-2 p-4">
                <div className="h-4 w-3/4 rounded bg-gray-200" />
                <div className="h-4 w-1/2 rounded bg-gray-200" />
                <div className="h-5 w-1/3 rounded bg-gray-200" />
              </div>
            </div>
          ))}
        </div>

        {/* Second Section */}
        <div className="mb-6 mt-10 h-8 w-56 rounded bg-gray-200" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm"
            >
              <div className="h-48 w-full bg-gray-200" />
              <div className="space-y-2 p-4">
                <div className="h-4 w-3/4 rounded bg-gray-200" />
                <div className="h-4 w-1/2 rounded bg-gray-200" />
                <div className="h-5 w-1/3 rounded bg-gray-200" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
