"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

export function HomePromo() {
  const t = useTranslations();

  return (
    <section className="bg-background w-full px-4 py-10 sm:px-8 sm:py-12 lg:px-12">
      <div className="mx-auto w-full max-w-[1400px]">
        <div className="bg-card border-border flex flex-col items-center gap-6 rounded-2xl border px-6 py-10 text-center sm:px-10 sm:py-12 md:flex-row md:justify-between md:gap-8 md:text-start">
          <div className="flex items-start gap-4 md:items-center">
            <div className="bg-primary/10 text-primary hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl sm:flex">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <p className="text-primary mb-1 text-xs font-bold tracking-wider uppercase">
                {t("special_offer")}
              </p>
              <h3 className="text-foreground text-xl font-bold sm:text-2xl lg:text-3xl">
                {t("promo_heading")}
              </h3>
              <p className="text-muted-foreground mt-1.5 max-w-xl text-sm sm:text-base">
                {t("promo_description")}
              </p>
            </div>
          </div>

          <Link
            href="/trending"
            className="bg-primary text-primary-foreground hover:bg-primary/90 group inline-flex shrink-0 items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-colors sm:text-base"
          >
            {t("shop_now")}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}
