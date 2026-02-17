export default function SearchLoading() {
  return (
    <div className="mx-auto max-w-[1400px] animate-pulse px-4 py-8">
      {/* Search Bar */}
      <div className="mb-6 h-12 w-full max-w-2xl rounded-lg bg-gray-200" />

      {/* Results Count */}
      <div className="mb-4 h-5 w-40 rounded bg-gray-200" />

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Filters Sidebar */}
        <div className="w-full space-y-4 lg:w-1/4">
          <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
            <div className="mb-3 h-5 w-20 rounded bg-gray-200" />
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded bg-gray-200" />
                  <div className="h-4 w-24 rounded bg-gray-200" />
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
            <div className="mb-3 h-5 w-16 rounded bg-gray-200" />
            <div className="h-8 w-full rounded bg-gray-200" />
          </div>
        </div>

        {/* Search Results Grid */}
        <div className="w-full lg:w-3/4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
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
    </div>
  );
}
