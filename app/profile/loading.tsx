export default function ProfileLoading() {
  return (
    <div className="mx-auto w-full animate-pulse px-4 py-8 md:w-9/12 lg:w-7/12">
      <div className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
        {/* Page Title */}
        <div className="mb-6 h-7 w-32 rounded bg-gray-200" />

        {/* Profile Image */}
        <div className="mb-6 flex justify-center">
          <div className="h-28 w-28 rounded-full bg-gray-200" />
        </div>

        {/* Form Fields */}
        <div className="space-y-5">
          {/* Name Row */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <div className="mb-2 h-4 w-20 rounded bg-gray-200" />
              <div className="h-10 w-full rounded bg-gray-200" />
            </div>
            <div>
              <div className="mb-2 h-4 w-20 rounded bg-gray-200" />
              <div className="h-10 w-full rounded bg-gray-200" />
            </div>
          </div>

          {/* Email */}
          <div>
            <div className="mb-2 h-4 w-16 rounded bg-gray-200" />
            <div className="h-10 w-full rounded bg-gray-200" />
          </div>

          {/* Phone */}
          <div>
            <div className="mb-2 h-4 w-24 rounded bg-gray-200" />
            <div className="h-10 w-full rounded bg-gray-200" />
          </div>

          {/* Bio / About */}
          <div>
            <div className="mb-2 h-4 w-12 rounded bg-gray-200" />
            <div className="h-24 w-full rounded bg-gray-200" />
          </div>

          {/* Social Links */}
          <div>
            <div className="mb-3 h-5 w-28 rounded bg-gray-200" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded bg-gray-200" />
                  <div className="h-10 flex-1 rounded bg-gray-200" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="mt-6 flex justify-end">
          <div className="h-10 w-32 rounded bg-gray-200" />
        </div>
      </div>
    </div>
  );
}
