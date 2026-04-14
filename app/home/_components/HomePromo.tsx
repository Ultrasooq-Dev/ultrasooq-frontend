"use client";

import { useAuth } from "@/context/AuthContext";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

export function HomePromo() {
  const t = useTranslations();
  const { currency, langDir } = useAuth();

  return (
    <section className="bg-muted w-full px-4 py-12 sm:px-8 sm:py-16 lg:px-12 lg:py-20">
      <div className="mx-auto w-full max-w-[1400px]">
        <div className="border-info bg-info relative overflow-hidden rounded-3xl border">
          <div className="absolute inset-0 bg-black/5" />

          <div className="relative grid grid-cols-1 items-center gap-8 p-8 sm:p-12 md:grid-cols-12 lg:p-16">
            {/* Text Content */}
            <div className="z-10 md:col-span-6 lg:col-span-6">
              <div className="space-y-5 sm:space-y-7" dir={langDir}>
                <span className="bg-card text-info inline-block rounded-full px-5 py-2 text-xs font-bold tracking-wide sm:text-sm">
                  {t("special_offer")}
                </span>
                <h3 className="text-3xl leading-tight font-bold text-white sm:text-4xl lg:text-5xl xl:text-6xl">
                  {t("promo_heading")}
                </h3>
                <p className="max-w-lg text-lg leading-relaxed text-white/80 sm:text-xl">
                  {t("promo_description")}
                </p>
              </div>
            </div>

            {/* Price & CTA Section */}
            <div className="z-10 md:col-span-6 lg:col-span-6" dir={langDir}>
              <div className="bg-card rounded-3xl p-8 sm:p-10">
                <div className="mb-6">
                  <p className="text-muted-foreground mb-2 text-sm font-medium">
                    {t("original_price")}
                  </p>
                  <p
                    className="text-muted-foreground mb-4 text-2xl font-semibold line-through"
                    translate="no"
                  >
                    332.38 {currency.symbol}
                  </p>
                  <p className="text-foreground mb-2 text-base font-bold">
                    {t("special_price")}
                  </p>
                  <h4
                    className="text-info mb-8 text-5xl font-bold sm:text-6xl lg:text-7xl"
                    translate="no"
                  >
                    219.05 {currency.symbol}
                  </h4>
                </div>
                <a
                  href="#"
                  className="bg-info inline-flex w-full items-center justify-center gap-3 rounded-2xl px-8 py-5 text-base font-bold text-white sm:text-lg"
                >
                  {t("shop_now")}
                  <ArrowRight className="h-5 w-5" />
                </a>
                <div className="text-muted-foreground mt-6 flex items-center justify-center gap-2 text-sm">
                  <svg
                    className="text-success h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {t("limited_time_offer_hurry")}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
