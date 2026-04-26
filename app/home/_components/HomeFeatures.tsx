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
      gradient: "from-primary/20 to-primary/5",
      iconColor: "text-primary",
    },
    {
      icon: ShieldCheck,
      title: t("secure_payment"),
      description: t("protected_checkout_100"),
      gradient: "from-success/20 to-success/5",
      iconColor: "text-success",
    },
    {
      icon: RotateCcw,
      title: t("easy_returns"),
      description: t("day_return_policy_30"),
      gradient: "from-warning/20 to-warning/5",
      iconColor: "text-warning",
    },
    {
      icon: Headphones,
      title: t("home_feature_support_title"),
      description: t("dedicated_customer_care"),
      gradient: "from-info/20 to-info/5",
      iconColor: "text-info",
    },
  ];

  return (
    <section className="bg-card w-full border-y border-border px-4 py-10 sm:px-8 sm:py-12 lg:px-12 lg:py-14">
      <div className="mx-auto w-full max-w-[1400px]">
        <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-4 lg:gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className={`group bg-linear-to-br ${feature.gradient} border-border/50 hover:border-primary/30 hover:shadow-md flex flex-col items-center gap-3 rounded-2xl border p-4 text-center transition-all sm:flex-row sm:items-center sm:p-5 sm:text-start`}
              >
                <div
                  className={`bg-card ${feature.iconColor} ring-1 ring-border/60 group-hover:ring-primary/30 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-sm transition-all sm:h-14 sm:w-14`}
                >
                  <Icon className="h-6 w-6 sm:h-7 sm:w-7" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-foreground text-sm font-bold sm:text-base">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground mt-0.5 text-xs sm:text-sm">
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
