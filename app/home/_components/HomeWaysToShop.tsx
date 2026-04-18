"use client";

import { ArrowRight, Factory, FileText, Store, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

export function HomeWaysToShop() {
  const t = useTranslations();

  const ways = [
    {
      icon: Store,
      title: t("shop_the_store"),
      description: t("shop_the_store_description"),
      href: "/trending",
      accent: "bg-primary/10 text-primary",
    },
    {
      icon: Users,
      title: t("buy_together"),
      description: t("buy_together_description"),
      href: "/buygroup",
      accent: "bg-info/10 text-info",
    },
    {
      icon: FileText,
      title: t("request_a_quote"),
      description: t("request_a_quote_description"),
      href: "/rfq-request",
      accent: "bg-warning/10 text-warning",
    },
    {
      icon: Factory,
      title: t("factory_direct"),
      description: t("factory_direct_description"),
      href: "/factories",
      accent: "bg-success/10 text-success",
    },
  ];

  return (
    <section className="bg-muted/40 w-full px-4 py-12 sm:px-8 sm:py-16 lg:px-12 lg:py-20">
      <div className="mx-auto w-full max-w-[1400px]">
        <div className="mb-8 text-center sm:mb-12">
          <h2 className="text-foreground mb-3 text-2xl font-bold sm:text-3xl lg:text-4xl">
            {t("four_ways_to_shop")}
          </h2>
          <p className="text-muted-foreground mx-auto max-w-2xl text-sm sm:text-base">
            {t("four_ways_to_shop_subtitle")}
          </p>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {ways.map((way) => {
            const Icon = way.icon;
            return (
              <Link
                key={way.title}
                href={way.href}
                className="group bg-card border-border hover:border-primary/40 flex flex-col rounded-2xl border p-6 transition-all hover:shadow-lg sm:p-7"
              >
                <div
                  className={`${way.accent} mb-5 flex h-14 w-14 items-center justify-center rounded-xl`}
                >
                  <Icon className="h-7 w-7" />
                </div>
                <h3 className="text-foreground mb-2 text-lg font-bold sm:text-xl">
                  {way.title}
                </h3>
                <p className="text-muted-foreground mb-5 flex-1 text-sm sm:text-base">
                  {way.description}
                </p>
                <span className="text-primary inline-flex items-center gap-1.5 text-sm font-semibold">
                  {t("explore")}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
