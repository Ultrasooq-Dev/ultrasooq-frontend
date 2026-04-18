"use client";

import { useTranslations } from "next-intl";

export function HomeStats() {
  const t = useTranslations();

  const stats = [
    { value: "10K+", label: t("products") },
    { value: "5K+", label: t("happy_customers") },
    { value: "500+", label: t("trusted_sellers") },
    { value: "20+", label: t("countries") },
  ];

  return (
    <section className="bg-primary w-full px-4 py-12 sm:px-8 sm:py-14 lg:px-12 lg:py-16">
      <div className="mx-auto w-full max-w-[1400px]">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p
                className="mb-2 text-3xl font-bold text-white sm:text-4xl lg:text-5xl"
                translate="no"
              >
                {stat.value}
              </p>
              <p className="text-sm font-medium text-white/80 sm:text-base">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
