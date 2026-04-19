"use client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Image from "next/image";
import PlaceholderImage from "@/public/images/product-placeholder.png";
import { FaStar } from "react-icons/fa";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useDynamicTranslation } from "@/hooks/useDynamicTranslation";
import { getPromotionalProductPrice } from "./cartUtils";

interface CartRecommendedProductsProps {
  langDir: string;
  currency: { symbol: string };
  recommendedProducts: any[];
  isLoading: boolean;
  currentTradeRole: string | undefined;
  vendorBusinessCategoryIds: number[];
  onAddToCart: (quantity: number, productPriceId?: number) => void;
}

const CartRecommendedProducts = ({
  langDir,
  currency,
  recommendedProducts,
  isLoading,
  currentTradeRole,
  vendorBusinessCategoryIds,
  onAddToCart,
}: CartRecommendedProductsProps) => {
  const t = useTranslations();
  const router = useRouter();
  const { translate } = useDynamicTranslation();

  return (
    <div className="w-full bg-card p-4">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between border-b border-border pb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2
              className="text-lg font-semibold text-foreground"
              dir={langDir}
              translate="no"
            >
              {t("recommended_products")}
            </h2>
          </div>
          <div className="mt-1 flex items-center gap-1">
            <span className="text-xs text-muted-foreground" translate="no">
              {t("sponsored")}
            </span>
            <svg
              className="h-3 w-3 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Loading skeletons */}
      {isLoading ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="w-[180px] flex-shrink-0 rounded border border-border bg-card p-3"
            >
              <Skeleton className="mb-3 h-40 w-full rounded" />
              <Skeleton className="mb-2 h-4 w-full" />
              <Skeleton className="mb-2 h-3 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : recommendedProducts.length > 0 ? (
        <div className="group relative">
          <Carousel
            opts={{ align: "start", loop: false, dragFree: true }}
            className="w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {recommendedProducts.slice(0, 12).map((product: any) => {
                const avgRating =
                  product.productReview?.length > 0
                    ? (
                        product.productReview.reduce(
                          (sum: number, r: any) => sum + (r.rating || 0),
                          0,
                        ) / product.productReview.length
                      ).toFixed(1)
                    : null;

                const priceInfo = getPromotionalProductPrice(
                  product,
                  currentTradeRole,
                  vendorBusinessCategoryIds,
                );
                const hasListPrice =
                  priceInfo.hasDiscount &&
                  priceInfo.originalPrice > priceInfo.discountedPrice;

                return (
                  <CarouselItem
                    key={product.id}
                    className="basis-auto pl-2 md:pl-4"
                  >
                    <div className="w-[180px] flex-shrink-0">
                      <div className="group/product relative flex h-full min-h-[380px] flex-col rounded border border-border bg-card p-3 transition-shadow hover:shadow-md">
                        {/* Image */}
                        <div className="relative mb-3 aspect-square w-full overflow-hidden rounded bg-muted">
                          <Image
                            src={
                              product.productImages?.[0]?.image ||
                              PlaceholderImage
                            }
                            alt={product.productName}
                            fill
                            className="object-contain transition-transform group-hover/product:scale-105"
                          />
                        </div>

                        {/* Info */}
                        <div className="flex flex-1 flex-col space-y-2">
                          <h3
                            className="line-clamp-2 cursor-pointer text-sm leading-tight text-foreground group-hover/product:text-primary"
                            dir={langDir}
                            onClick={() =>
                              router.push(`/trending/${product.id}`)
                            }
                          >
                            {translate(product.productName)}
                          </h3>

                          {/* Rating */}
                          <div className="min-h-[20px]">
                            {avgRating && product.productReview?.length > 0 && (
                              <div className="flex items-center gap-1">
                                <div className="flex items-center">
                                  {Array.from({ length: 5 }).map((_, i) => {
                                    const rating = parseFloat(avgRating);
                                    const starValue = i + 1;
                                    return (
                                      <FaStar
                                        key={i}
                                        className={`h-3 w-3 ${
                                          starValue <= Math.round(rating)
                                            ? "text-warning/70"
                                            : "text-muted-foreground"
                                        }`}
                                      />
                                    );
                                  })}
                                  <span className="ml-1 text-xs text-muted-foreground">
                                    {avgRating}
                                  </span>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  ({product.productReview.length})
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Price */}
                          <div className="space-y-0.5">
                            <div className="flex items-baseline gap-1">
                              <span className="text-base font-semibold text-foreground">
                                {currency.symbol}
                                {Number(priceInfo.discountedPrice || 0).toFixed(2)}
                              </span>
                            </div>
                            {hasListPrice && (
                              <div className="text-xs text-muted-foreground">
                                <span translate="no">List Price: </span>
                                <span className="line-through">
                                  {currency.symbol}
                                  {Number(priceInfo.originalPrice || 0).toFixed(2)}
                                </span>
                              </div>
                            )}
                            {!hasListPrice &&
                              Number(product.productPrice || 0) >
                                Number(product.offerPrice || 0) && (
                                <div className="text-xs text-muted-foreground">
                                  <span translate="no">List Price: </span>
                                  <span className="line-through">
                                    {currency.symbol}
                                    {Number(product.productPrice || 0).toFixed(2)}
                                  </span>
                                </div>
                              )}
                          </div>

                          {/* Add to Cart */}
                          <div className="mt-auto pt-2">
                            <Button
                              onClick={() =>
                                onAddToCart(1, product.productProductPriceId)
                              }
                              className="w-full rounded-md bg-warning px-3 py-1.5 text-xs font-medium text-foreground shadow-sm transition-colors hover:bg-warning"
                              translate="no"
                            >
                              Add to Cart
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CarouselItem>
                );
              })}
            </CarouselContent>
            <CarouselPrevious className="-left-4 h-8 w-8 border border-border bg-card shadow-md hover:bg-muted" />
            <CarouselNext className="-right-4 h-8 w-8 border border-border bg-card shadow-md hover:bg-muted" />
          </Carousel>
        </div>
      ) : (
        <div className="py-8 text-center text-muted-foreground">
          <p>
            {t("no_recommended_products") || "No recommended products found"}
          </p>
        </div>
      )}
    </div>
  );
};

export default CartRecommendedProducts;
