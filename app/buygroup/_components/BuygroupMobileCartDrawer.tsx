"use client";
import React from "react";
import { useTranslations } from "next-intl";
import { useDynamicTranslation } from "@/hooks/useDynamicTranslation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Package, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface BuygroupMobileCartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  side: "left" | "right";
  cartList: any[];
  currency: { symbol: string };
  memoizedProductList: any[];
  getCartPricing: (productData: any, cartItem: any) => any;
}

const BuygroupMobileCartDrawer: React.FC<BuygroupMobileCartDrawerProps> = ({
  open,
  onOpenChange,
  side,
  cartList,
  currency,
  memoizedProductList,
  getCartPricing,
}) => {
  const t = useTranslations();
  const { translate } = useDynamicTranslation();
  const router = useRouter();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={side}
        className="w-[300px] overflow-y-auto sm:w-[400px]"
      >
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            <span>{t("my_cart")}</span>
          </SheetTitle>
        </SheetHeader>
        <div className="mt-6">
          <div className="mb-4 border-b border-border pb-4">
            <span className="rounded-full bg-muted px-2 py-1 text-sm text-muted-foreground">
              {cartList.length}{" "}
              {cartList.length === 1 ? t("item") : t("items")}
            </span>
          </div>

          <div className="max-h-[calc(100vh-250px)] overflow-y-auto">
            {cartList.length === 0 ? (
              <div className="py-6 text-center">
                <Package className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {t("your_cart_is_empty")}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("add_some_products_to_get_started")}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {cartList.slice(0, 10).map((cartItem: any) => {
                  const productData = memoizedProductList.find(
                    (product: any) => product.id === cartItem.productId,
                  );
                  const pricing = getCartPricing(productData, cartItem);
                  const quantity = cartItem.quantity || 1;
                  const totalPrice = pricing.totalPrice;

                  const productImage =
                    productData?.productImage ||
                    cartItem.productPriceDetails?.productPrice_product
                      ?.productImages?.[0]?.image ||
                    null;

                  const productNameRaw =
                    productData?.productName ||
                    cartItem.productPriceDetails?.productPrice_product
                      ?.productName ||
                    t("product");
                  const productName = translate(productNameRaw);

                  return (
                    <div
                      key={cartItem.id}
                      className="flex items-center space-x-3 rounded-lg p-2 transition-colors hover:bg-muted"
                    >
                      <Link
                        href={`/product-view/${cartItem.productId}`}
                        className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-muted transition-opacity hover:opacity-80"
                        onClick={() => onOpenChange(false)}
                      >
                        {productImage ? (
                          <img
                            src={productImage}
                            alt={productName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Package className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </Link>

                      <div className="min-w-0 flex-1">
                        <h4 className="truncate text-sm font-medium text-foreground">
                          {translate(productName)}
                        </h4>
                        <div className="mt-1 flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">
                            Qty: {quantity}
                          </p>
                          <p className="text-sm font-semibold text-success">
                            {currency.symbol}
                            {totalPrice.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {cartList.length > 10 && (
                  <div className="py-2 text-center">
                    <p className="text-xs text-muted-foreground">
                      {t("and_n_more_items", { n: cartList.length - 10 })}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Go to Cart Button */}
          {cartList.length > 0 && (
            <div className="border-t border-border bg-muted p-4">
              <button
                onClick={() => router.push("/cart")}
                className="flex w-full items-center justify-center space-x-2 rounded-lg bg-primary px-4 py-2 font-medium text-white transition-colors duration-200 hover:bg-primary/90"
              >
                <Package className="h-4 w-4" />
                <span>{t("go_to_cart")}</span>
              </button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default BuygroupMobileCartDrawer;
