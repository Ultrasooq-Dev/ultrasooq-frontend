"use client";

import { ProductGrid } from "./ProductGrid";
import { CartItem, ProductGridItem } from "./homeTypes";

interface HomeProductSectionProps {
  title: string;
  subtitle?: string;
  products: ProductGridItem[];
  cartList: CartItem[] | undefined;
  haveAccessToken: boolean;
  onWishlist: (productId: number, wishlistArr?: any[]) => void;
  showSold?: boolean;
  sectionClass: string;
}

export function HomeProductSection({
  title,
  subtitle,
  products,
  cartList,
  haveAccessToken,
  onWishlist,
  showSold = false,
  sectionClass,
}: HomeProductSectionProps) {
  if (!products?.length) return null;

  return (
    <section className={`${sectionClass} w-full px-4 py-12 sm:px-8 sm:py-16 lg:px-12 lg:py-20`}>
      <div className="mx-auto w-full max-w-[1400px]">
        <div className="mb-8 sm:mb-12">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center sm:gap-6">
            <div className="flex-1">
              <h2
                className="text-foreground mb-3 text-2xl font-bold sm:text-3xl lg:text-4xl"
                translate="no"
              >
                {title}
              </h2>
              {subtitle && (
                <p
                  className="text-muted-foreground max-w-2xl text-sm sm:text-base"
                  translate="no"
                >
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        </div>
        <ProductGrid
          products={products}
          cartList={cartList}
          haveAccessToken={haveAccessToken}
          onWishlist={onWishlist}
          showSold={showSold}
          limit={8}
        />
      </div>
    </section>
  );
}
