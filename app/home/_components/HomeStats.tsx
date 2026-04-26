"use client";

import { Globe2, Package, Store, Users } from "lucide-react";
import { useTranslations } from "next-intl";

export function HomeStats() {
  const t = useTranslations();

  const stats = [
    { value: "10K+", label: t("products"), icon: Package },
    { value: "5K+", label: t("happy_customers"), icon: Users },
    { value: "500+", label: t("trusted_sellers"), icon: Store },
    { value: "20+", label: t("countries"), icon: Globe2 },
  ];

  return (
    <section className="from-primary via-primary to-primary/85 relative w-full overflow-hidden bg-linear-to-br px-4 py-12 sm:px-8 sm:py-16 lg:px-12 lg:py-20">
      {/* Decorative blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 -end-20 h-72 w-72 rounded-full bg-white/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -start-12 h-72 w-72 rounded-full bg-white/5 blur-3xl"
      />

      <div className="relative mx-auto w-full max-w-[1400px]">
        <div className="grid grid-cols-2 gap-5 md:grid-cols-4 md:gap-7">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="flex flex-col items-center text-center"
              >
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/30 backdrop-blur-xs sm:h-14 sm:w-14">
                  <Icon className="h-6 w-6 text-white sm:h-7 sm:w-7" />
                </div>
                <p
                  className="mb-1 text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl"
                  translate="no"
                >
                  {stat.value}
                </p>
                <p className="text-xs font-medium text-white/85 sm:text-sm">
                  {stat.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
