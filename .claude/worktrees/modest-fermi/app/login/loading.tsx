export default function LoginLoading() {
  return (
    <div className="flex min-h-screen w-full animate-pulse bg-card">
      {/* Left Panel Skeleton (Desktop Only) */}
      <div className="hidden lg:flex lg:w-[48%] xl:w-[50%] bg-gradient-to-br from-warning via-warning/70 to-warning/60">
        <div className="flex flex-col justify-between w-full p-10 xl:p-14">
          {/* Logo skeleton */}
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-card/30" />
            <div className="h-7 w-32 rounded bg-card/30" />
          </div>

          {/* Title & features skeleton */}
          <div className="flex-1 flex flex-col justify-center py-10">
            <div className="h-10 w-64 rounded bg-card/20 mb-3" />
            <div className="h-10 w-48 rounded bg-card/20 mb-4" />
            <div className="h-5 w-72 rounded bg-card/15 mb-10" />

            <div className="space-y-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-lg bg-card/20 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="h-4 w-32 rounded bg-card/20 mb-2" />
                    <div className="h-3 w-48 rounded bg-card/15" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats skeleton */}
          <div className="flex items-center gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-6">
                <div>
                  <div className="h-7 w-14 rounded bg-card/25 mb-1" />
                  <div className="h-3 w-20 rounded bg-card/15" />
                </div>
                {i < 3 && <div className="w-px h-10 bg-card/20" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel Skeleton */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 sm:px-8 py-4">
          <div className="lg:hidden flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-muted" />
            <div className="h-5 w-24 rounded bg-muted" />
          </div>
          <div className="hidden lg:block" />
          <div className="h-9 w-28 rounded-lg bg-muted" />
        </div>

        {/* Form skeleton */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-8 pb-8">
          <div className="w-full max-w-md">
            <div className="mb-6">
              <div className="h-8 w-24 rounded bg-muted mb-2" />
              <div className="h-4 w-48 rounded bg-muted" />
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
              <div className="space-y-4">
                <div>
                  <div className="mb-2 h-4 w-28 rounded bg-muted" />
                  <div className="h-10 w-full rounded bg-muted" />
                </div>
                <div>
                  <div className="mb-2 h-4 w-20 rounded bg-muted" />
                  <div className="h-10 w-full rounded bg-muted" />
                </div>
              </div>

              <div className="mt-4 flex justify-between">
                <div className="h-4 w-24 rounded bg-muted" />
                <div className="h-4 w-32 rounded bg-muted" />
              </div>

              <div className="mt-5 h-12 w-full rounded-lg bg-muted" />

              <div className="my-5 h-px w-full bg-muted" />

              <div className="h-11 w-full rounded-lg bg-muted" />

              <div className="mt-5 flex justify-center">
                <div className="h-4 w-48 rounded bg-muted" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
