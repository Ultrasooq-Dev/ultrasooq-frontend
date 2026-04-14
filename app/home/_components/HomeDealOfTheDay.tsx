"use client";

import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { TrendingProduct } from "@/utils/types/common.types";
import { ProductGrid } from "./ProductGrid";
import { CartItem } from "./homeTypes";

interface HomeDealOfTheDayProps {
  products: TrendingProduct[];
  cartList: CartItem[] | undefined;
  haveAccessToken: boolean;
  onWishlist: (productId: number, wishlistArr?: any[]) => void;
}

export function HomeDealOfTheDay({
  products,
  cartList,
  haveAccessToken,
  onWishlist,
}: HomeDealOfTheDayProps) {
  const t = useTranslations();

  if (!products?.length) return null;

  return (
    <section className="from-warning/5 to-card w-full bg-gradient-to-b px-4 py-12 sm:px-8 sm:py-16 lg:px-12 lg:py-20">
      <div className="mx-auto w-full max-w-[1400px]">
        <div className="mb-8 sm:mb-12">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center sm:gap-6">
            <div className="flex-1">
              <h2
                className="text-foreground mb-3 text-2xl font-bold sm:text-3xl lg:text-4xl"
                translate="no"
              >
                {t("deal_of_the_day")}
              </h2>
              <p
                className="text-muted-foreground max-w-2xl text-sm sm:text-base"
                translate="no"
              >
                {t("explore_all_best_deals_for_limited_time")}
              </p>
            </div>
            <Link
              href="/buygroup"
              className="group border-warning bg-warning inline-flex items-center gap-2 rounded-xl border px-6 py-3.5 text-sm font-semibold text-white sm:px-8 sm:py-4 sm:text-base"
              translate="no"
            >
              {t("view_all")}
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
        <ProductGrid
          products={products}
          cartList={cartList}
          haveAccessToken={haveAccessToken}
          onWishlist={onWishlist}
          showSold
          limit={4}
          gridClass="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4"
        />
      </div>
    </section>
  );
}
