export default function LoginLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center animate-pulse px-4">
      <div className="w-full max-w-md rounded-lg border border-gray-100 bg-white p-8 shadow-sm">
        {/* Logo / Title */}
        <div className="mb-6 flex justify-center">
          <div className="h-10 w-32 rounded bg-gray-200" />
        </div>

        <div className="mb-6 h-7 w-24 rounded bg-gray-200" />

        {/* Form Fields */}
        <div className="space-y-4">
          <div>
            <div className="mb-2 h-4 w-16 rounded bg-gray-200" />
            <div className="h-10 w-full rounded bg-gray-200" />
          </div>
          <div>
            <div className="mb-2 h-4 w-20 rounded bg-gray-200" />
            <div className="h-10 w-full rounded bg-gray-200" />
          </div>
        </div>

        {/* Forgot Password */}
        <div className="mt-3 flex justify-end">
          <div className="h-4 w-32 rounded bg-gray-200" />
        </div>

        {/* Submit Button */}
        <div className="mt-6 h-12 w-full rounded bg-gray-200" />

        {/* Sign Up Link */}
        <div className="mt-4 flex justify-center">
          <div className="h-4 w-48 rounded bg-gray-200" />
        </div>
      </div>
    </div>
  );
}
