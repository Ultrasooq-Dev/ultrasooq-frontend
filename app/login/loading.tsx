export default function LoginLoading() {
  return (
    <section className="relative flex min-h-screen w-full animate-pulse bg-card">
      {/* Left Panel Skeleton (Desktop Only) */}
      <div className="bg-primary relative hidden overflow-hidden lg:flex lg:w-[48%] xl:w-[50%]">
        <div className="bg-primary-foreground/15 absolute -top-32 -start-32 h-96 w-96 rounded-full blur-3xl" />
        <div className="bg-primary-foreground/10 absolute -end-32 bottom-0 h-[28rem] w-[28rem] rounded-full blur-3xl" />

        <div className="relative z-10 flex w-full flex-col justify-between p-10 xl:p-14">
          {/* Logo skeleton */}
          <div className="flex items-center gap-3">
            <div className="bg-primary-foreground/15 border-primary-foreground/20 h-12 w-12 rounded-xl border" />
            <div className="bg-primary-foreground/20 h-7 w-32 rounded" />
          </div>

          {/* Title & features skeleton */}
          <div className="flex flex-1 flex-col justify-center py-10">
            <div className="bg-primary-foreground/20 mb-3 h-10 w-64 rounded" />
            <div className="bg-primary-foreground/20 mb-4 h-10 w-48 rounded" />
            <div className="bg-primary-foreground/15 mb-10 h-5 w-72 rounded" />

            <div className="space-y-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="bg-primary-foreground/15 border-primary-foreground/20 h-11 w-11 flex-shrink-0 rounded-xl border" />
                  <div className="flex-1">
                    <div className="bg-primary-foreground/20 mb-2 h-4 w-32 rounded" />
                    <div className="bg-primary-foreground/15 h-3 w-48 rounded" />
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
                  <div className="bg-primary-foreground/25 mb-1 h-7 w-14 rounded" />
                  <div className="bg-primary-foreground/15 h-3 w-20 rounded" />
                </div>
                {i < 3 && <div className="bg-primary-foreground/20 h-10 w-px" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel Skeleton */}
      <div className="flex min-h-screen flex-1 flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-4 sm:px-8">
          <div className="flex items-center gap-2 lg:hidden">
            <div className="bg-muted h-9 w-9 rounded-lg" />
            <div className="bg-muted h-5 w-24 rounded" />
          </div>
          <div className="hidden lg:block" />
          <div className="bg-muted h-9 w-28 rounded-lg" />
        </div>

        {/* Form skeleton */}
        <div className="flex flex-1 items-center justify-center px-4 pb-8 sm:px-8">
          <div className="w-full max-w-md">
            <div className="mb-6">
              <div className="bg-muted mb-2 h-8 w-24 rounded" />
              <div className="bg-muted h-4 w-48 rounded" />
            </div>

            <div className="border-border bg-card rounded-2xl border p-6 sm:p-8">
              <div className="space-y-4">
                <div>
                  <div className="bg-muted mb-2 h-4 w-28 rounded" />
                  <div className="bg-muted h-10 w-full rounded" />
                </div>
                <div>
                  <div className="bg-muted mb-2 h-4 w-20 rounded" />
                  <div className="bg-muted h-10 w-full rounded" />
                </div>
              </div>

              <div className="mt-4 flex justify-between">
                <div className="bg-muted h-4 w-24 rounded" />
                <div className="bg-muted h-4 w-32 rounded" />
              </div>

              <div className="bg-primary/70 mt-5 h-12 w-full rounded-lg" />

              <div className="bg-muted my-5 h-px w-full" />

              <div className="bg-muted h-11 w-full rounded-lg" />

              <div className="mt-5 flex justify-center">
                <div className="bg-muted h-4 w-48 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
