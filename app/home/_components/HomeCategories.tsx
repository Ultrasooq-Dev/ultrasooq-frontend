"use client";

import TrendingCategories from "@/components/modules/home/TrendingCategories";
import { ArrowRight, TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

export function HomeCategories() {
  const t = useTranslations();

  return (
    <section className="bg-muted/50 w-full px-4 py-12 sm:px-8 sm:py-16 lg:px-12 lg:py-20">
      <div className="mx-auto w-full max-w-[1400px]">
        <div className="mb-8 sm:mb-12">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center sm:gap-6">
            <div className="flex-1">
              <h2
                className="text-foreground mb-3 text-2xl font-bold sm:text-3xl lg:text-4xl"
                translate="no"
              >
                {t("explore_categories")}
              </h2>
              <p
                className="text-muted-foreground max-w-2xl text-sm sm:text-base"
                translate="no"
              >
                {t("browse_categories_to_find_trending_products")}
              </p>
            </div>
            <Link
              href="/trending"
              className="group border-primary bg-primary inline-flex items-center gap-2 rounded-xl border px-6 py-3.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors sm:px-8 sm:py-4 sm:text-base"
              translate="no"
            >
              <TrendingUp className="h-5 w-5" />
              <span className="hidden sm:inline">
                {t("view_trending_products")}
              </span>
              <span className="sm:hidden">{t("trending")}</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
        <div className="w-full">
          <TrendingCategories />
        </div>
      </div>
    </section>
  );
}
