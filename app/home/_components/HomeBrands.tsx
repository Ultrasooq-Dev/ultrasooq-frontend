"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";

/**
 * "Shop by Brand" tile grid. Links to the trending page filtered by brand name.
 * Pure visual component — no API call, brand list is curated.
 */
export function HomeBrands() {
  const t = useTranslations();

  const brands = [
    { name: "Apple", initials: "" },
    { name: "Samsung", initials: "" },
    { name: "Sony", initials: "" },
    { name: "LG", initials: "LG" },
    { name: "Dell", initials: "" },
    { name: "HP", initials: "HP" },
    { name: "Lenovo", initials: "" },
    { name: "Nike", initials: "" },
    { name: "Adidas", initials: "" },
    { name: "Zara", initials: "" },
    { name: "Bosch", initials: "" },
    { name: "Huawei", initials: "" },
  ];

  return (
    <section className="bg-card w-full px-4 py-12 sm:px-8 sm:py-16 lg:px-12 lg:py-20">
      <div className="mx-auto w-full max-w-[1400px]">
        <div className="mb-8 text-center sm:mb-10">
          <h2
            className="text-foreground mb-3 text-2xl font-bold sm:text-3xl lg:text-4xl"
            translate="no"
          >
            {t.has("shop_by_brand") ? t("shop_by_brand") : "Shop by Brand"}
          </h2>
          <p className="text-muted-foreground mx-auto max-w-2xl text-sm sm:text-base">
            {t.has("shop_by_brand_subtitle")
              ? t("shop_by_brand_subtitle")
              : "Discover products from the world's most loved brands"}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4 md:grid-cols-6 lg:gap-5">
          {brands.map((brand) => (
            <Link
              key={brand.name}
              href={`/trending?brand=${encodeURIComponent(brand.name)}`}
              className="group bg-card border-border hover:border-primary/40 hover:shadow-lg flex aspect-square flex-col items-center justify-center gap-1 rounded-2xl border p-3 transition-all"
            >
              <span
                className="text-foreground group-hover:text-primary text-base font-bold tracking-tight transition-colors sm:text-lg lg:text-xl"
                translate="no"
              >
                {brand.initials || brand.name}
              </span>
              <span className="text-muted-foreground text-[10px] uppercase tracking-wider sm:text-xs">
                {t.has("shop_now") ? t("shop_now") : "Shop"}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
