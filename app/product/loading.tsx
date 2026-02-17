export default function ProductLoading() {
  return (
    <div className="w-full animate-pulse py-7">
      <div className="mx-auto max-w-[950px] px-3">
        {/* Form Card */}
        <div className="rounded-lg border border-gray-300 bg-white p-6 shadow-sm">
          {/* Title */}
          <div className="mb-6 h-7 w-48 rounded bg-gray-200" />

          {/* Image Upload Area */}
          <div className="mb-6 flex gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-24 w-24 rounded-lg bg-gray-200"
              />
            ))}
            <div className="flex h-24 w-24 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
              <div className="h-8 w-8 rounded bg-gray-200" />
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-5">
            {/* Product Name */}
            <div>
              <div className="mb-2 h-4 w-28 rounded bg-gray-200" />
              <div className="h-10 w-full rounded bg-gray-200" />
            </div>

            {/* Category + Subcategory Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="mb-2 h-4 w-20 rounded bg-gray-200" />
                <div className="h-10 w-full rounded bg-gray-200" />
              </div>
              <div>
                <div className="mb-2 h-4 w-24 rounded bg-gray-200" />
                <div className="h-10 w-full rounded bg-gray-200" />
              </div>
            </div>

            {/* Short Description */}
            <div>
              <div className="mb-2 h-4 w-32 rounded bg-gray-200" />
              <div className="h-10 w-full rounded bg-gray-200" />
            </div>

            {/* Specifications */}
            <div>
              <div className="mb-2 h-4 w-28 rounded bg-gray-200" />
              <div className="grid grid-cols-2 gap-4">
                <div className="h-10 w-full rounded bg-gray-200" />
                <div className="h-10 w-full rounded bg-gray-200" />
              </div>
            </div>

            {/* Description Editor */}
            <div>
              <div className="mb-2 h-4 w-24 rounded bg-gray-200" />
              <div className="h-40 w-full rounded bg-gray-200" />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex items-center justify-end gap-3">
            <div className="h-10 w-28 rounded bg-gray-200" />
            <div className="h-10 w-28 rounded bg-gray-200" />
          </div>
        </div>
      </div>
    </div>
  );
}
