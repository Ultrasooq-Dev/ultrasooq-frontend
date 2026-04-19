"use client";
import React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { Package, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrendingCartSidebarProps {
  cartList: any[];
  cartSubtotal: number;
  memoizedProductList: any[];
  getCartPricing: (productData: any, cartItem: any) => {
    unitPrice: number;
    totalPrice: number;
    originalUnitPrice: number;
    originalTotalPrice: number;
  };
  onUpdateQuantity: (cartItem: any, qty: number, action: "add" | "remove") => void;
  onRemoveItem: (cartId: number) => void;
  deleteCartItemPending: boolean;
  updateCartWithLoginPending: boolean;
  updateCartByDevicePending: boolean;
}

export default function TrendingCartSidebar({
  cartList,
  cartSubtotal,
  memoizedProductList,
  getCartPricing,
  onUpdateQuantity,
  onRemoveItem,
  deleteCartItemPending,
  updateCartWithLoginPending,
  updateCartByDevicePending,
}: TrendingCartSidebarProps) {
  const t = useTranslations();
  const { langDir, currency } = useAuth();
  const isRTL = langDir === "rtl";

  if (cartList.length === 0) return null;

  return (
    <div className="hidden lg:block">
      <div
        className={cn(
          "fixed top-0 z-[60] h-screen w-36 bg-card shadow-lg",
          isRTL ? "left-0 border-r border-border" : "right-0 border-l border-border",
        )}
      >
        <div className="flex h-full flex-col">
          {/* Subtotal + Go To Cart */}
          <div className="sticky top-0 z-10 border-b border-border bg-card px-4 pt-4 pb-3 text-center">
            <div className="flex flex-col items-center">
              <span className="mb-0.5 text-[11px] font-medium text-muted-foreground" dir={langDir} translate="no">
                {t("subtotal")}
              </span>
              <span className="text-sm font-bold text-destructive">
                {currency.symbol}{cartSubtotal.toFixed(2)}
              </span>
            </div>
            <button
              onClick={() => { window.location.href = "/cart"; }}
              className="mt-3 flex w-full items-center justify-center space-x-1.5 rounded-lg bg-warning px-3 py-2 text-xs font-medium text-foreground shadow-sm transition-colors duration-200 hover:bg-warning"
            >
              <Package className="h-3 w-3" />
              <span>{t("go_to_cart")}</span>
            </button>
          </div>

          {/* Scrollable product list */}
          <div className="scrollbar-hide flex-1 overflow-y-auto px-4 pt-3 pb-4">
            <div className="space-y-3">
              {cartList.map((cartItem: any) => {
                const productData = memoizedProductList.find(
                  (product: any) => product.id === cartItem.productId,
                );
                const pricing = getCartPricing(productData, cartItem);
                const quantity = cartItem.quantity || 1;

                const productImage =
                  productData?.productImage ||
                  cartItem.productPriceDetails?.productPrice_product?.productImages?.[0]?.image ||
                  null;

                const productName =
                  productData?.productName ||
                  cartItem.productPriceDetails?.productPrice_product?.productName ||
                  t("product");

                return (
                  <div key={cartItem.id} className="space-y-2 text-center">
                    <div className="flex justify-center">
                      <Link
                        href={`/trending/${cartItem.productId}`}
                        className="h-20 w-20 overflow-hidden rounded-lg bg-muted transition-opacity hover:opacity-80"
                      >
                        {productImage ? (
                          <img src={productImage} alt={productName} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Package className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </Link>
                    </div>

                    <div className="mb-2 text-center">
                      <p className="text-sm font-semibold text-foreground">
                        {currency.symbol}{pricing.totalPrice.toFixed(2)}
                      </p>
                    </div>

                    {/* Quantity Selector */}
                    <div className="mb-2 flex items-center justify-center">
                      <div className="flex items-center overflow-hidden rounded-md border-2 border-yellow-400">
                        <button
                          onClick={() => {
                            if (quantity > 1) {
                              onUpdateQuantity(cartItem, quantity - 1, "remove");
                            } else {
                              onRemoveItem(cartItem.id);
                            }
                          }}
                          disabled={deleteCartItemPending || updateCartWithLoginPending || updateCartByDevicePending}
                          className="px-1.5 py-1 transition-colors hover:bg-warning/5 disabled:cursor-not-allowed disabled:opacity-50"
                          aria-label={t("decrease_quantity")}
                        >
                          <Trash2 className="h-3 w-3 text-muted-foreground" />
                        </button>
                        <span className="min-w-[2rem] border-x border-yellow-400 bg-card px-2 py-1 text-center text-xs font-medium text-foreground">
                          {quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(cartItem, quantity + 1, "add")}
                          disabled={updateCartWithLoginPending || updateCartByDevicePending}
                          className="px-1.5 py-1 transition-colors hover:bg-warning/5 disabled:cursor-not-allowed disabled:opacity-50"
                          aria-label={t("increase_quantity")}
                        >
                          <span className="text-sm font-semibold text-muted-foreground">+</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-center">
                      <button
                        onClick={() => onRemoveItem(cartItem.id)}
                        disabled={deleteCartItemPending}
                        className="text-xs text-primary underline hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label={t("remove_from_cart")}
                      >
                        {t("remove")}
                      </button>
                    </div>

                    <div className="mt-3 border-t border-border" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
