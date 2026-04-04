export default function RegisterLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center animate-pulse px-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 shadow-sm">
        {/* Title */}
        <div className="mb-6 flex justify-center">
          <div className="h-10 w-32 rounded bg-muted" />
        </div>
        <div className="mb-6 h-7 w-36 rounded bg-muted" />

        {/* Form Fields */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="mb-2 h-4 w-20 rounded bg-muted" />
              <div className="h-10 w-full rounded bg-muted" />
            </div>
            <div>
              <div className="mb-2 h-4 w-20 rounded bg-muted" />
              <div className="h-10 w-full rounded bg-muted" />
            </div>
          </div>
          <div>
            <div className="mb-2 h-4 w-16 rounded bg-muted" />
            <div className="h-10 w-full rounded bg-muted" />
          </div>
          <div>
            <div className="mb-2 h-4 w-20 rounded bg-muted" />
            <div className="h-10 w-full rounded bg-muted" />
          </div>
          <div>
            <div className="mb-2 h-4 w-32 rounded bg-muted" />
            <div className="h-10 w-full rounded bg-muted" />
          </div>
        </div>

        {/* Submit Button */}
        <div className="mt-6 h-12 w-full rounded bg-muted" />

        {/* Login Link */}
        <div className="mt-4 flex justify-center">
          <div className="h-4 w-44 rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}
