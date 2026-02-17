export default function EditProductLoading() {
  return (
    <div className="w-full animate-pulse py-7">
      <div className="mx-auto max-w-[950px] px-3">
        {/* Basic Information Card */}
        <div className="mb-4 rounded-lg border border-gray-300 bg-white p-6 shadow-sm">
          <div className="mb-6 h-7 w-40 rounded bg-gray-200" />

          {/* Image Upload Area */}
          <div className="mb-6 flex gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-24 w-24 rounded-lg bg-gray-200"
              />
            ))}
          </div>

          {/* Product Name (read-only) */}
          <div className="mb-4">
            <div className="mb-2 h-4 w-28 rounded bg-gray-200" />
            <div className="h-10 w-full rounded bg-gray-100" />
          </div>
        </div>

        {/* Description & Specification Card */}
        <div className="rounded-lg border border-gray-300 bg-white p-6 shadow-sm">
          {/* Short Description */}
          <div className="mb-5">
            <div className="mb-2 h-4 w-32 rounded bg-gray-200" />
            <div className="h-10 w-full rounded bg-gray-200" />
          </div>

          {/* Specifications */}
          <div className="mb-5">
            <div className="mb-2 h-4 w-28 rounded bg-gray-200" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-10 w-full rounded bg-gray-200" />
              <div className="h-10 w-full rounded bg-gray-200" />
            </div>
          </div>

          {/* Description Editor */}
          <div className="mb-5">
            <div className="mb-2 h-4 w-24 rounded bg-gray-200" />
            <div className="h-40 w-full rounded bg-gray-200" />
          </div>

          {/* Action Buttons */}
          <div className="mt-4 flex items-center justify-end gap-3">
            <div className="h-10 w-28 rounded bg-gray-200" />
            <div className="h-12 w-32 rounded bg-gray-200" />
          </div>
        </div>
      </div>
    </div>
  );
}
