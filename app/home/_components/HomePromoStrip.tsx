"use client";

import { Headphones, RotateCcw, Truck } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * Slim promo strip at the very top of the homepage.
 * Cycles three trust messages on mobile (only first shows), all three on desktop.
 */
export function HomePromoStrip() {
  const t = useTranslations();

  const items = [
    {
      icon: Truck,
      label: t("free_shipping"),
      detail: t("on_orders_over_50_omr"),
    },
    {
      icon: RotateCcw,
      label: t("easy_returns"),
      detail: t("day_return_policy_30"),
    },
    {
      icon: Headphones,
      label: t("home_feature_support_title"),
      detail: t("dedicated_customer_care"),
    },
  ];

  return (
    <div className="bg-foreground text-background w-full">
      <div className="mx-auto flex w-full max-w-[1400px] flex-wrap items-center justify-center gap-x-8 gap-y-1 px-4 py-2 text-xs sm:gap-x-12 sm:px-8 sm:text-sm lg:px-12">
        {items.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className={`flex items-center gap-2 ${idx > 0 ? "hidden md:flex" : "flex"}`}
            >
              <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="font-medium">{item.label}</span>
              <span className="text-background/70 hidden lg:inline">
                · {item.detail}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
