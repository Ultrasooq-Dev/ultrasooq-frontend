"use client";

import { Headphones, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { useTranslations } from "next-intl";

export function HomeFeatures() {
  const t = useTranslations();

  const features = [
    {
      icon: Truck,
      title: t("free_shipping"),
      description: t("on_orders_over_50_omr"),
    },
    {
      icon: ShieldCheck,
      title: t("secure_payment"),
      description: t("protected_checkout_100"),
    },
    {
      icon: RotateCcw,
      title: t("easy_returns"),
      description: t("day_return_policy_30"),
    },
    {
      icon: Headphones,
      title: t("home_feature_support_title"),
      description: t("dedicated_customer_care"),
    },
  ];

  return (
    <section className="bg-card w-full border-y border-border px-4 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12">
      <div className="mx-auto w-full max-w-[1400px]">
        <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4 lg:gap-8">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="flex items-center gap-3 sm:gap-4"
              >
                <div className="bg-primary/10 text-primary flex h-12 w-12 shrink-0 items-center justify-center rounded-full sm:h-14 sm:w-14">
                  <Icon className="h-6 w-6 sm:h-7 sm:w-7" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-foreground text-sm font-semibold sm:text-base">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground truncate text-xs sm:text-sm">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
