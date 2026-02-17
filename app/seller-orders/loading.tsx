export default function SellerOrdersLoading() {
  return (
    <div className="w-full animate-pulse px-4 py-8 lg:px-12">
      {/* Page Title */}
      <div className="mb-6 h-8 w-40 rounded bg-gray-200" />

      {/* Filter Bar */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="h-10 w-40 rounded bg-gray-200" />
        <div className="h-10 w-36 rounded bg-gray-200" />
        <div className="h-10 w-32 rounded bg-gray-200" />
      </div>

      {/* Orders Table */}
      <div className="rounded-lg border border-gray-100 bg-white shadow-sm">
        {/* Table Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="grid grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-4 w-full rounded bg-gray-200" />
            ))}
          </div>
        </div>
        {/* Table Rows */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="border-b border-gray-100 px-6 py-4 last:border-0"
          >
            <div className="grid grid-cols-6 gap-4">
              <div className="h-4 w-full rounded bg-gray-200" />
              <div className="h-4 w-3/4 rounded bg-gray-200" />
              <div className="h-4 w-full rounded bg-gray-200" />
              <div className="h-4 w-1/2 rounded bg-gray-200" />
              <div className="h-6 w-20 rounded-full bg-gray-200" />
              <div className="h-4 w-2/3 rounded bg-gray-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
