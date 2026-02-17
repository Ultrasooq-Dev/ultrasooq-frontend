"use client";

/**
 * @component VendorPricingCard
 * @description Displays vendor-specific pricing, stock, delivery, and discount info.
 *   Separated from product details to cleanly distinguish product data from vendor data.
 * @props vendorPricing - ProductPrice data from API
 * @props onAddToCart - callback for add to cart action
 * @uses shadcn/Card, shadcn/Button, shadcn/Badge
 */
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ShoppingCart,
  Truck,
  Package,
  Store,
  ChevronDown,
  ChevronUp,
  User,
  Shield,
} from "lucide-react";

interface VendorPricing {
  id: number;
  productPrice: number;
  offerPrice: number;
  stock?: number | null;
  minQuantity?: number | null;
  maxQuantity?: number | null;
  deliveryAfter?: number | null;
  sellType?: string | null;
  consumerDiscount?: number | null;
  vendorDiscount?: number | null;
  consumerDiscountType?: string | null;
  vendorDiscountType?: string | null;
  productCondition?: string | null;
  adminDetail?: {
    id: number;
    firstName?: string | null;
    lastName?: string | null;
    accountName?: string | null;
    profilePicture?: string | null;
    tradeRole?: string;
    userProfile?: Array<{
      profileType?: string;
      logo?: string | null;
      companyName?: string | null;
    }>;
  } | null;
}

interface VendorPricingCardProps {
  vendorPricing: VendorPricing;
  otherSellers?: VendorPricing[];
  onAddToCart?: (vendorPriceId: number, quantity: number) => void;
  currency?: string;
}

export function VendorPricingCard({
  vendorPricing,
  otherSellers = [],
  onAddToCart,
  currency = "$",
}: VendorPricingCardProps) {
  const [quantity, setQuantity] = useState(vendorPricing.minQuantity || 1);
  const [showOtherSellers, setShowOtherSellers] = useState(false);

  const hasDiscount =
    vendorPricing.offerPrice > 0 &&
    vendorPricing.offerPrice < vendorPricing.productPrice;

  const discountPercent = hasDiscount
    ? Math.round(
        ((vendorPricing.productPrice - vendorPricing.offerPrice) /
          vendorPricing.productPrice) *
          100
      )
    : 0;

  const displayPrice = hasDiscount
    ? vendorPricing.offerPrice
    : vendorPricing.productPrice;

  const sellerName =
    vendorPricing.adminDetail?.accountName ||
    vendorPricing.adminDetail?.userProfile?.[0]?.companyName ||
    [vendorPricing.adminDetail?.firstName, vendorPricing.adminDetail?.lastName]
      .filter(Boolean)
      .join(" ") ||
    "Seller";

  return (
    <div className="space-y-3">
      {/* Main pricing card */}
      <Card>
        <CardContent className="p-4 space-y-4">
          {/* Seller info */}
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Store className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">{sellerName}</p>
              {vendorPricing.adminDetail?.tradeRole === "COMPANY" && (
                <Badge variant="outline" className="text-[10px] h-4 gap-0.5">
                  <Shield className="h-2.5 w-2.5" /> Verified
                </Badge>
              )}
            </div>
          </div>

          {/* Price display */}
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">
                {currency}{Number(displayPrice).toFixed(2)}
              </span>
              {hasDiscount && (
                <>
                  <span className="text-sm text-muted-foreground line-through">
                    {currency}{Number(vendorPricing.productPrice).toFixed(2)}
                  </span>
                  <Badge variant="destructive" className="text-xs">
                    -{discountPercent}%
                  </Badge>
                </>
              )}
            </div>
            {vendorPricing.consumerDiscount && (
              <p className="text-xs text-green-600">
                Extra {vendorPricing.consumerDiscount}
                {vendorPricing.consumerDiscountType === "PERCENTAGE" ? "%" : currency} off for consumers
              </p>
            )}
          </div>

          {/* Stock & Delivery */}
          <div className="flex flex-wrap gap-3 text-sm">
            {vendorPricing.stock !== null && vendorPricing.stock !== undefined && (
              <div className="flex items-center gap-1.5">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className={vendorPricing.stock > 0 ? "text-green-600" : "text-destructive"}>
                  {vendorPricing.stock > 0 ? `${vendorPricing.stock} in stock` : "Out of stock"}
                </span>
              </div>
            )}
            {vendorPricing.deliveryAfter && (
              <div className="flex items-center gap-1.5">
                <Truck className="h-4 w-4 text-muted-foreground" />
                <span>Ships in {vendorPricing.deliveryAfter} day{vendorPricing.deliveryAfter > 1 ? "s" : ""}</span>
              </div>
            )}
          </div>

          {/* Condition badge */}
          {vendorPricing.productCondition && (
            <Badge variant="outline" className="text-xs">
              {vendorPricing.productCondition}
            </Badge>
          )}

          {/* Quantity selector */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Qty:</span>
            <div className="flex items-center">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-r-none"
                onClick={() => setQuantity(Math.max(vendorPricing.minQuantity || 1, quantity - 1))}
              >
                -
              </Button>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 1;
                  setQuantity(
                    Math.max(
                      vendorPricing.minQuantity || 1,
                      Math.min(vendorPricing.maxQuantity || 9999, val)
                    )
                  );
                }}
                className="h-8 w-16 rounded-none text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-l-none"
                onClick={() => setQuantity(Math.min(vendorPricing.maxQuantity || 9999, quantity + 1))}
              >
                +
              </Button>
            </div>
            {vendorPricing.minQuantity && vendorPricing.minQuantity > 1 && (
              <span className="text-xs text-muted-foreground">
                Min: {vendorPricing.minQuantity}
              </span>
            )}
          </div>

          {/* Add to Cart button */}
          <Button
            className="w-full gap-2"
            onClick={() => onAddToCart?.(vendorPricing.id, quantity)}
            disabled={vendorPricing.stock !== null && vendorPricing.stock !== undefined && vendorPricing.stock <= 0}
          >
            <ShoppingCart className="h-4 w-4" />
            Add to Cart
          </Button>

          {/* Sell type badge */}
          {vendorPricing.sellType && vendorPricing.sellType !== "NORMALSELL" && (
            <Badge variant="secondary" className="w-full justify-center text-xs">
              {vendorPricing.sellType === "BUYGROUP" && "Buy Group"}
              {vendorPricing.sellType === "WHOLESALE_PRODUCT" && "Wholesale"}
              {vendorPricing.sellType === "TRIAL_PRODUCT" && "Trial Product"}
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* Other sellers toggle */}
      {otherSellers.length > 0 && (
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs gap-1"
            onClick={() => setShowOtherSellers(!showOtherSellers)}
          >
            <User className="h-3.5 w-3.5" />
            {otherSellers.length} other seller{otherSellers.length > 1 ? "s" : ""}
            {showOtherSellers ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </Button>
          {showOtherSellers && (
            <div className="space-y-2 mt-2">
              {otherSellers.map((seller) => {
                const name =
                  seller.adminDetail?.accountName ||
                  [seller.adminDetail?.firstName, seller.adminDetail?.lastName]
                    .filter(Boolean)
                    .join(" ") ||
                  "Seller";
                const price =
                  seller.offerPrice > 0 && seller.offerPrice < seller.productPrice
                    ? seller.offerPrice
                    : seller.productPrice;
                return (
                  <Card key={seller.id} className="border-dashed">
                    <CardContent className="p-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{name}</p>
                        <p className="text-xs text-muted-foreground">
                          {seller.stock && seller.stock > 0
                            ? `${seller.stock} in stock`
                            : "Check availability"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">
                          {currency}{Number(price).toFixed(2)}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs mt-1"
                          onClick={() => onAddToCart?.(seller.id, 1)}
                        >
                          Add
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
