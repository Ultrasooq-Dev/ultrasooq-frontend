export default function ShareLinksLoading() {
  return (
    <div className="mx-auto max-w-4xl animate-pulse px-4 py-8">
      {/* Page Title */}
      <div className="mb-6 h-8 w-36 rounded bg-gray-200" />

      {/* Action Button */}
      <div className="mb-6 flex justify-end">
        <div className="h-10 w-36 rounded bg-gray-200" />
      </div>

      {/* Links List */}
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-lg border border-gray-100 bg-white p-4 shadow-sm"
          >
            <div className="flex-1 space-y-1">
              <div className="h-4 w-48 rounded bg-gray-200" />
              <div className="h-3 w-64 rounded bg-gray-200" />
            </div>
            <div className="flex items-center gap-3">
              <div className="h-4 w-16 rounded bg-gray-200" />
              <div className="h-8 w-8 rounded bg-gray-200" />
              <div className="h-8 w-8 rounded bg-gray-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
