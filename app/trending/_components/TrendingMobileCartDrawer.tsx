"use client";
import React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { Package, ShoppingCart, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface TrendingMobileCartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cartList: any[];
  memoizedProductList: any[];
  getCartPricing: (productData: any, cartItem: any) => {
    unitPrice: number;
    totalPrice: number;
    originalUnitPrice: number;
    originalTotalPrice: number;
  };
  onRemoveItem: (cartId: number) => void;
  deleteCartItemPending: boolean;
}

export default function TrendingMobileCartDrawer({
  open,
  onOpenChange,
  cartList,
  memoizedProductList,
  getCartPricing,
  onRemoveItem,
  deleteCartItemPending,
}: TrendingMobileCartDrawerProps) {
  const t = useTranslations();
  const { langDir, currency } = useAuth();
  const isRTL = langDir === "rtl";
  const cartSheetSide: "left" | "right" = isRTL ? "left" : "right";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={cartSheetSide}
        className="w-full overflow-y-auto sm:w-[400px] lg:hidden"
      >
        <SheetHeader className="mb-4 border-b border-border pb-4">
          <SheetTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              <span className="text-lg font-bold">{t("my_cart")}</span>
            </div>
            <span className="rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
              {cartList.length} {cartList.length === 1 ? t("item") : t("items")}
            </span>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6">
          {cartList.length === 0 ? (
            <div className="py-12 text-center">
              <Package className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
              <p className="text-base font-medium text-muted-foreground">
                {t("your_cart_is_empty")}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("add_some_products_to_get_started")}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {cartList.map((cartItem: any) => {
                const productData = memoizedProductList.find(
                  (product: any) => product.id === cartItem.productId,
                );
                const productImage =
                  productData?.productImage ||
                  cartItem.productPriceDetails?.productPrice_product?.productImages?.[0]?.image ||
                  null;
                const productName =
                  productData?.productName ||
                  cartItem.productPriceDetails?.productPrice_product?.productName ||
                  t("product");
                const pricing = getCartPricing(productData, cartItem);

                return (
                  <div
                    key={cartItem.id}
                    className="group flex items-center space-x-4 rounded-lg border border-border p-3 transition-colors hover:bg-muted"
                  >
                    <Link
                      href={`/trending/${cartItem.productId}`}
                      className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-muted transition-opacity hover:opacity-80"
                      onClick={() => onOpenChange(false)}
                    >
                      {productImage ? (
                        <img src={productImage} alt={productName} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Package className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </Link>

                    <div className="min-w-0 flex-1">
                      <h4 className="mb-1 truncate text-sm font-semibold text-foreground">
                        {productName}
                      </h4>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          {t("quantity")}: {cartItem.quantity || 1}
                        </p>
                        <div className="text-right">
                          <p className="text-sm font-bold text-success">
                            {currency.symbol}{pricing.totalPrice.toFixed(2)}
                          </p>
                          {pricing.originalTotalPrice > pricing.totalPrice && (
                            <p className="text-xs text-muted-foreground line-through">
                              {currency.symbol}{pricing.originalTotalPrice.toFixed(2)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onRemoveItem(cartItem.id)}
                      disabled={deleteCartItemPending}
                      className="flex-shrink-0 rounded-lg p-2 text-muted-foreground opacity-0 transition-all duration-200 group-hover:opacity-100 hover:bg-destructive/5 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label={t("remove_from_cart")}
                      title={t("remove_from_cart")}
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {cartList.length > 0 && (
          <div className="sticky bottom-0 mt-6 border-t border-border bg-card pt-4">
            <button
              onClick={() => {
                onOpenChange(false);
                window.location.href = "/cart";
              }}
              className="flex w-full items-center justify-center space-x-2 rounded-lg bg-primary px-4 py-3 font-semibold text-white shadow-lg transition-colors duration-200 hover:bg-primary/90"
            >
              <Package className="h-5 w-5" />
              <span>{t("go_to_cart")}</span>
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
