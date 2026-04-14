"use client";
import React from "react";
import { TrendingProduct } from "@/utils/types/common.types";
import ProductCard from "@/components/modules/trending/ProductCard";

interface ProductGridItemsProps {
  memoizedProductList: TrendingProduct[];
  cartList: any[];
  productVariants: any[];
  haveAccessToken: boolean;
  onWishlist: (productId: number, wishlistArr?: any[]) => void;
  onTrackClick: (productId: number) => void;
}

export default function ProductGridItems({
  memoizedProductList,
  cartList,
  productVariants,
  haveAccessToken,
  onWishlist,
  onTrackClick,
}: ProductGridItemsProps) {
  return (
    <div className="flex flex-col gap-3 sm:grid sm:grid-cols-2 sm:items-stretch sm:gap-4 lg:grid-cols-3 lg:gap-5 xl:grid-cols-4">
      {memoizedProductList.map((item: TrendingProduct) => {
        const cartItem = cartList?.find((el: any) => el.productId == item.id);
        let relatedCart: any = null;
        if (cartItem) {
          relatedCart = cartList
            ?.filter((c: any) => c.serviceId && c.cartProductServices?.length)
            .find((c: any) =>
              c.cartProductServices.find(
                (r: any) =>
                  r.relatedCartType == "PRODUCT" && r.productId == item.id,
              ),
            );
        }
        return (
          <div key={item.id} onClick={() => onTrackClick(item.id)}>
            <ProductCard
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
              productQuantity={cartItem?.quantity || 0}
              productVariant={cartItem?.object}
              cartId={cartItem?.id}
              relatedCart={relatedCart}
              isAddedToCart={cartItem ? true : false}
            />
          </div>
        );
      })}
    </div>
  );
}
