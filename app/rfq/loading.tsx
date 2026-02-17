export default function RfqLoading() {
  return (
    <div className="mx-auto max-w-5xl animate-pulse px-4 py-8">
      {/* Page Title */}
      <div className="mb-6 h-8 w-56 rounded bg-gray-200" />

      {/* Action Button */}
      <div className="mb-6 flex justify-end">
        <div className="h-10 w-36 rounded bg-gray-200" />
      </div>

      {/* RFQ List */}
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="h-5 w-40 rounded bg-gray-200" />
              <div className="h-6 w-24 rounded-full bg-gray-200" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-full rounded bg-gray-200" />
              <div className="h-4 w-3/4 rounded bg-gray-200" />
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className="h-4 w-28 rounded bg-gray-200" />
              <div className="h-4 w-24 rounded bg-gray-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
