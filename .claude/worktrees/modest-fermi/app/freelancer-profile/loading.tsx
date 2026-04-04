export default function FreelancerProfileLoading() {
  return (
    <div className="mx-auto max-w-4xl animate-pulse px-4 py-8">
      {/* Cover / Header */}
      <div className="mb-6 h-40 w-full rounded-lg bg-muted" />

      {/* Profile Info */}
      <div className="mb-8 flex items-center gap-5">
        <div className="h-24 w-24 flex-shrink-0 rounded-full bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-7 w-48 rounded bg-muted" />
          <div className="h-4 w-64 rounded bg-muted" />
          <div className="h-4 w-36 rounded bg-muted" />
        </div>
        <div className="h-10 w-28 rounded bg-muted" />
      </div>

      {/* About Section */}
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="mb-4 h-5 w-20 rounded bg-muted" />
        <div className="space-y-2">
          <div className="h-4 w-full rounded bg-muted" />
          <div className="h-4 w-full rounded bg-muted" />
          <div className="h-4 w-3/4 rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}
