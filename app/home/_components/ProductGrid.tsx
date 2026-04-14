"use client";

import ProductCard from "@/components/modules/trending/ProductCard";
import { ProductGridSectionProps } from "./homeTypes";

export function ProductGrid({
  products,
  cartList,
  haveAccessToken,
  onWishlist,
  showSold = false,
  limit = 8,
  gridClass = "grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4 lg:gap-7",
}: ProductGridSectionProps) {
  const displayProducts = products.slice(0, limit);

  return (
    <div className={gridClass}>
      {displayProducts.map((item: any) => {
        const cartItem = cartList?.find(
          (el: any) => el.productId == item.id,
        );
        let relatedCart: any = null;
        if (cartItem) {
          relatedCart = cartList
            ?.filter(
              (c: any) => c.serviceId && c.cartProductServices?.length,
            )
            .find((c: any) => {
              return !!c.cartProductServices.find(
                (r: any) =>
                  r.relatedCartType == "PRODUCT" && r.productId == item.id,
              );
            });
        }
        return (
          <ProductCard
            key={item.id}
            item={item}
            onWishlist={() => onWishlist(item.id, item?.productWishlist)}
            inWishlist={item?.inWishlist}
            haveAccessToken={haveAccessToken}
            isInteractive
            cartId={cartItem?.id}
            productQuantity={cartItem?.quantity}
            productVariant={cartItem?.object}
            isAddedToCart={cartItem ? true : false}
            relatedCart={relatedCart}
            sold={showSold ? item.sold : undefined}
          />
        );
      })}
    </div>
  );
}
