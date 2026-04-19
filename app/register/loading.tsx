export default function RegisterLoading() {
  return (
    <section className="flex min-h-screen w-full animate-pulse">
      {/* Left Branding Panel Skeleton (Desktop Only) */}
      <div className="bg-primary relative hidden w-[45%] overflow-hidden lg:block xl:w-[42%]">
        <div className="bg-primary-foreground/15 absolute left-[8%] top-[10%] h-36 w-36 rounded-full blur-2xl" />
        <div className="bg-primary-foreground/10 absolute bottom-[15%] left-[12%] h-32 w-32 rounded-full blur-2xl" />
        <div className="bg-primary-foreground/10 absolute right-[15%] top-[25%] h-16 w-16 rotate-12 rounded-2xl" />

        <div className="relative z-10 flex h-full flex-col items-center justify-center px-10 xl:px-14">
          {/* Logo */}
          <div className="bg-primary-foreground/15 border-primary-foreground/20 mb-6 h-20 w-20 rounded-2xl border" />

          {/* Title */}
          <div className="bg-primary-foreground/20 mb-3 h-9 w-48 rounded" />
          <div className="bg-primary-foreground/20 mb-3 h-9 w-40 rounded" />
          <div className="bg-primary-foreground/15 mb-8 h-4 w-64 rounded" />

          {/* Tags */}
          <div className="mb-10 flex flex-wrap justify-center gap-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-primary-foreground/15 border-primary-foreground/20 h-8 w-24 rounded-full border"
              />
            ))}
          </div>

          {/* Stats card */}
          <div className="border-primary-foreground/15 bg-primary-foreground/10 flex items-center gap-6 rounded-2xl border p-5 xl:gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-6 xl:gap-8">
                <div className="flex flex-col items-center">
                  <div className="bg-primary-foreground/25 mb-1 h-8 w-12 rounded" />
                  <div className="bg-primary-foreground/15 h-3 w-16 rounded" />
                </div>
                {i < 3 && <div className="bg-primary-foreground/20 h-10 w-px" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Form Panel Skeleton */}
      <div className="bg-card flex flex-1 flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-4 sm:px-8">
          <div className="flex items-center gap-2 lg:hidden">
            <div className="bg-muted h-9 w-9 rounded-lg" />
            <div className="bg-muted h-5 w-24 rounded" />
          </div>
          <div className="hidden lg:block" />
          <div className="bg-muted h-9 w-28 rounded-lg" />
        </div>

        {/* Form */}
        <div className="flex flex-1 items-center justify-center px-4 pb-8 sm:px-8">
          <div className="w-full max-w-md">
            <div className="mb-6">
              <div className="bg-muted mb-2 h-8 w-32 rounded" />
              <div className="bg-muted h-4 w-56 rounded" />
            </div>

            <div className="border-border bg-card rounded-2xl border p-6 sm:p-8">
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i}>
                    <div className="bg-muted mb-2 h-4 w-28 rounded" />
                    <div className="bg-muted h-10 w-full rounded" />
                  </div>
                ))}
              </div>

              <div className="mt-4">
                <div className="bg-muted h-4 w-full rounded" />
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
