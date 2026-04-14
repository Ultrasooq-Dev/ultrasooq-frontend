"use client";
import React from "react";
import { useTranslations } from "next-intl";
import ProductCard from "@/components/modules/trending/ProductCard";
import ProductTable from "@/components/modules/trending/ProductTable";
import SkeletonProductCardLoader from "@/components/shared/SkeletonProductCardLoader";
import Pagination from "@/components/shared/Pagination";
import { TrendingProduct } from "@/utils/types/common.types";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import BuygroupProductHeader from "./BuygroupProductHeader";

interface BuygroupProductListProps {
  langDir: string;
  isRTL: boolean;
  cartListLength: number;
  viewType: "grid" | "list";
  setViewType: (v: "grid" | "list") => void;
  sortBy: string;
  setSortBy: (v: string) => void;
  isLoading: boolean;
  memoizedProductList: any[];
  cartList: any[];
  productVariants: any[];
  haveAccessToken: boolean;
  deviceId: string;
  page: number;
  setPage: (p: number) => void;
  limit: number;
  totalCount: number;
  onOpenFilter: () => void;
  onOpenCart: () => void;
  onWishlist: (productId: number, wishlistArr?: any[]) => void;
  onAddToCartLogin: (productPriceId: number, quantity: number, productVariant: any) => Promise<any>;
  onAddToCartDevice: (productPriceId: number, quantity: number, deviceId: string, productVariant: any) => Promise<any>;
}

const BuygroupProductList: React.FC<BuygroupProductListProps> = ({
  langDir,
  isRTL,
  cartListLength,
  viewType,
  setViewType,
  sortBy,
  setSortBy,
  isLoading,
  memoizedProductList,
  cartList,
  productVariants,
  haveAccessToken,
  deviceId,
  page,
  setPage,
  limit,
  totalCount,
  onOpenFilter,
  onOpenCart,
  onWishlist,
  onAddToCartLogin,
  onAddToCartDevice,
}) => {
  const t = useTranslations();
  const { toast } = useToast();

  return (
    <div
      className={cn(
        "w-full flex-1 overflow-y-auto bg-card lg:w-auto",
        cartListLength > 0
          ? isRTL
            ? "lg:pl-36"
            : "lg:pr-36"
          : isRTL
            ? "lg:pl-0"
            : "lg:pr-0",
      )}
    >
      <div className="p-2 sm:p-4 lg:p-6">
        <BuygroupProductHeader
          langDir={langDir}
          viewType={viewType}
          setViewType={setViewType}
          sortBy={sortBy}
          setSortBy={setSortBy}
          cartListLength={cartListLength}
          onOpenFilter={onOpenFilter}
          onOpenCart={onOpenCart}
        />

        {/* Loading State */}
        {isLoading && viewType === "grid" ? (
          <div className="flex flex-col gap-3 sm:grid sm:grid-cols-2 sm:items-stretch sm:gap-4 lg:grid-cols-3 lg:gap-5 xl:grid-cols-4">
            {Array.from({ length: 10 }).map((_, index) => (
              <SkeletonProductCardLoader key={index} />
            ))}
          </div>
        ) : null}

        {/* No Data State */}
        {!memoizedProductList.length && !isLoading ? (
          <div className="py-12 text-center">
            <p className="text-lg text-muted-foreground" dir={langDir} translate="no">
              {t("no_data_found")}
            </p>
          </div>
        ) : null}

        {/* Grid View */}
        {viewType === "grid" && !isLoading ? (
          <div className="flex flex-col gap-3 sm:grid sm:grid-cols-2 sm:items-stretch sm:gap-4 lg:grid-cols-3 lg:gap-5 xl:grid-cols-4">
            {memoizedProductList.map((item: TrendingProduct) => {
              const cartItem = cartList?.find(
                (el: any) => el.productId == item.id,
              );
              let relatedCart: any = null;
              if (cartItem) {
                relatedCart = cartList
                  ?.filter((c: any) => c.serviceId && c.cartProductServices?.length)
                  .find((c: any) =>
                    !!c.cartProductServices.find(
                      (r: any) =>
                        r.relatedCartType == "PRODUCT" && r.productId == item.id,
                    ),
                  );
              }
              return (
                <ProductCard
                  key={item.id}
                  productVariants={
                    productVariants.find(
                      (variant: any) => variant.productId == item.id,
                    )?.object || []
                  }
                  item={item}
                  onWishlist={() => onWishlist(item.id, item?.productWishlist)}
                  inWishlist={item?.inWishlist}
                  haveAccessToken={haveAccessToken}
                  isInteractive
                  productQuantity={cartItem?.quantity}
                  productVariant={cartItem?.object}
                  cartId={cartItem?.id}
                  isAddedToCart={cartItem ? true : false}
                  relatedCart={relatedCart}
                  sold={item.sold}
                />
              );
            })}
          </div>
        ) : null}

        {/* List View */}
        {viewType === "list" && memoizedProductList.length ? (
          <div className="product-list-s1 overflow-x-auto p-2 sm:p-4">
            <ProductTable
              list={memoizedProductList}
              onWishlist={onWishlist}
              onAddToCart={async (item, quantity, action, variant) => {
                if (!item?.productProductPriceId) {
                  toast({
                    title: t("something_went_wrong"),
                    description: t("product_price_id_not_found"),
                    variant: "danger",
                  });
                  return;
                }
                if (haveAccessToken) {
                  const response = await onAddToCartLogin(
                    item.productProductPriceId,
                    action === "add" ? quantity : 0,
                    variant,
                  );
                  if (response?.status) {
                    toast({
                      title: action === "add" ? t("item_added_to_cart") : t("item_removed_from_cart"),
                      description: t("check_your_cart_for_more_details"),
                      variant: "success",
                    });
                  }
                } else {
                  const response = await onAddToCartDevice(
                    item.productProductPriceId,
                    action === "add" ? quantity : 0,
                    deviceId,
                    variant,
                  );
                  if (response?.status) {
                    toast({
                      title: action === "add" ? t("item_added_to_cart") : t("item_removed_from_cart"),
                      description: t("check_your_cart_for_more_details"),
                      variant: "success",
                    });
                  }
                }
              }}
              wishlistMap={new Map(
                memoizedProductList.map((item: any) => [item.id, item?.inWishlist || false])
              )}
              cartMap={new Map(
                cartList?.map((item: any) => [
                  item.productId,
                  { quantity: item.quantity, cartId: item.id },
                ]) || []
              )}
              haveAccessToken={haveAccessToken}
              productVariants={productVariants}
            />
          </div>
        ) : null}

        {/* Pagination */}
        {totalCount > 10 ? (
          <div className="mt-8">
            <Pagination
              page={page}
              setPage={setPage}
              totalCount={totalCount}
              limit={limit}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default BuygroupProductList;
