export default function VendorDashboardLoading() {
  return (
    <div className="w-full animate-pulse px-6 py-8 lg:px-12">
      {/* Page Title */}
      <div className="mb-6 h-8 w-44 rounded bg-gray-200" />

      {/* Stats Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="h-4 w-20 rounded bg-gray-200" />
              <div className="h-8 w-8 rounded bg-gray-200" />
            </div>
            <div className="h-8 w-24 rounded bg-gray-200" />
            <div className="mt-2 h-3 w-32 rounded bg-gray-200" />
          </div>
        ))}
      </div>

      {/* Filters Card */}
      <div className="mb-6 rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div className="h-10 w-40 rounded bg-gray-200" />
          <div className="h-10 w-40 rounded bg-gray-200" />
          <div className="h-10 w-32 rounded bg-gray-200" />
        </div>
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
              <div className="h-4 w-full rounded bg-gray-200" />
              <div className="h-4 w-3/4 rounded bg-gray-200" />
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
