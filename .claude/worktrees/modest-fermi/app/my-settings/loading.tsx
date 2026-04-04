export default function MySettingsLoading() {
  return (
    <div className="mx-auto max-w-3xl animate-pulse px-4 py-8">
      {/* Page Title */}
      <div className="mb-6 h-8 w-32 rounded bg-muted" />

      {/* Settings Navigation */}
      <div className="mb-6 flex gap-3 border-b border-border pb-3">
        <div className="h-6 w-20 rounded bg-muted" />
        <div className="h-6 w-28 rounded bg-muted" />
        <div className="h-6 w-32 rounded bg-muted" />
        <div className="h-6 w-36 rounded bg-muted" />
      </div>

      {/* Settings Form */}
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="space-y-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i}>
              <div className="mb-2 h-4 w-28 rounded bg-muted" />
              <div className="h-10 w-full rounded bg-muted" />
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <div className="h-10 w-32 rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}
