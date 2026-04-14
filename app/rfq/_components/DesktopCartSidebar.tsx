"use client";
import React from "react";
import Link from "next/link";
import { Package, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CartItem {
  id: number;
  productId: number;
  quantity: number;
  offerPriceFrom?: number;
  offerPriceTo?: number;
  note?: string;
}

interface ProductData {
  id: number;
  productName?: string;
  productImages?: { image: string }[];
}

interface DesktopCartSidebarProps {
  t: (key: string) => string;
  isRTL: boolean;
  cartList: CartItem[];
  memoizedRfqProducts: ProductData[];
  updateRfqCartIsPending: boolean;
  deleteRfqCartIsPending: boolean;
  onAddToCart: (
    quantity: number,
    productId: number,
    actionType: "add" | "remove",
    offerPriceFrom?: number,
    offerPriceTo?: number,
    note?: string,
  ) => Promise<void>;
  onRemoveItemFromCart: (rfqCartId: number) => Promise<void>;
}

const DesktopCartSidebar: React.FC<DesktopCartSidebarProps> = ({
  t,
  isRTL,
  cartList,
  memoizedRfqProducts,
  updateRfqCartIsPending,
  deleteRfqCartIsPending,
  onAddToCart,
  onRemoveItemFromCart,
}) => {
  if (cartList.length === 0) return null;

  return (
    <div className="hidden lg:block">
      <div
        className={cn(
          "fixed top-0 z-[60] h-screen w-36 bg-card shadow-lg",
          isRTL
            ? "left-0 border-r border-border"
            : "right-0 border-l border-border",
        )}
      >
        <div className="flex h-full flex-col">
          {/* Top sticky header + Go To Cart */}
          <div className="sticky top-0 z-10 border-b border-border bg-card px-4 pt-4 pb-3 text-center">
            <div className="flex flex-col items-center">
              <span
                className="mb-0.5 text-[11px] font-medium text-muted-foreground"
                dir={isRTL ? "rtl" : "ltr"}
                translate="no"
              >
                {t("rfq_cart") || t("my_cart")}
              </span>
              <span className="text-sm font-bold text-destructive">
                {cartList.length}
              </span>
            </div>
            <button
              onClick={() => {
                window.location.href = "/rfq-cart";
              }}
              className="mt-3 flex w-full items-center justify-center space-x-1.5 rounded-lg bg-warning px-3 py-2 text-xs font-medium text-foreground shadow-sm transition-colors duration-200 hover:bg-warning"
            >
              <Package className="h-3 w-3" />
              <span>{t("go_to_cart")}</span>
            </button>
          </div>

          {/* Scrollable product list */}
          <div className="scrollbar-hide flex-1 overflow-y-auto px-4 pt-3 pb-4">
            <div className="space-y-3">
              {cartList.map((cartItem: CartItem) => {
                const productData = memoizedRfqProducts.find(
                  (product: ProductData) => product.id === cartItem.productId,
                );
                const quantity = cartItem.quantity || 1;
                const productImage =
                  productData?.productImages?.[0]?.image || null;
                const productName = productData?.productName || t("product");

                return (
                  <div key={cartItem.id} className="space-y-2 text-center">
                    {/* Product Image */}
                    <div className="flex justify-center">
                      <Link
                        href={`/rfq/${cartItem.productId}`}
                        className="h-20 w-20 overflow-hidden rounded-lg bg-muted transition-opacity hover:opacity-80"
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
                    </div>

                    {/* Quantity Selector */}
                    <div className="mb-2 flex items-center justify-center">
                      <div className="flex items-center overflow-hidden rounded-md border-2 border-yellow-400">
                        <button
                          onClick={() => {
                            if (quantity > 1) {
                              onAddToCart(
                                quantity - 1,
                                cartItem.productId,
                                "remove",
                                cartItem.offerPriceFrom,
                                cartItem.offerPriceTo,
                                cartItem.note,
                              );
                            } else {
                              onRemoveItemFromCart(cartItem.id);
                            }
                          }}
                          disabled={updateRfqCartIsPending || deleteRfqCartIsPending}
                          className="px-1.5 py-1 transition-colors hover:bg-warning/5 disabled:cursor-not-allowed disabled:opacity-50"
                          aria-label={t("decrease_quantity")}
                        >
                          <Trash2 className="h-3 w-3 text-muted-foreground" />
                        </button>

                        <span className="min-w-[2rem] border-x border-yellow-400 bg-card px-2 py-1 text-center text-xs font-medium text-foreground">
                          {quantity}
                        </span>

                        <button
                          onClick={() => {
                            onAddToCart(
                              quantity + 1,
                              cartItem.productId,
                              "add",
                              cartItem.offerPriceFrom,
                              cartItem.offerPriceTo,
                              cartItem.note,
                            );
                          }}
                          disabled={updateRfqCartIsPending}
                          className="px-1.5 py-1 transition-colors hover:bg-warning/5 disabled:cursor-not-allowed disabled:opacity-50"
                          aria-label={t("increase_quantity")}
                        >
                          <span className="text-sm font-semibold text-muted-foreground">
                            +
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Remove Button */}
                    <div className="flex justify-center">
                      <button
                        onClick={() => onRemoveItemFromCart(cartItem.id)}
                        disabled={deleteRfqCartIsPending}
                        className="text-xs text-primary underline hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label={t("remove_from_cart")}
                      >
                        {t("remove")}
                      </button>
                    </div>

                    {/* Note if exists */}
                    {cartItem.note && (
                      <div className="mb-2">
                        <span className="inline-block max-w-full truncate rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                          {cartItem.note}
                        </span>
                      </div>
                    )}

                    {/* Divider */}
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
};

export default DesktopCartSidebar;
