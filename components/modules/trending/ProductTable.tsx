import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Image from "next/image";
import validator from "validator";
import { TrendingProduct } from "@/utils/types/common.types";
import Link from "next/link";
import PlaceholderImage from "@/public/images/product-placeholder.png";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { useDynamicTranslation } from "@/hooks/useDynamicTranslation";
import { useVendorBusinessCategories } from "@/hooks/useVendorBusinessCategories";
import { useCurrentAccount } from "@/apis/queries/auth.queries";
import { Button } from "@/components/ui/button";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { FiEye } from "react-icons/fi";
import ShoppingIcon from "@/components/icons/ShoppingIcon";
import { FaStar, FaRegStar } from "react-icons/fa";

type ProductTableProps = {
  list: TrendingProduct[];
  onWishlist?: (productId: number, wishlist: any) => void;
  onAddToCart?: (item: TrendingProduct, quantity: number, action: "add" | "remove", variant?: any, cartId?: number) => void;
  wishlistMap?: Map<number, boolean>;
  cartMap?: Map<number, { quantity: number; cartId?: number }>;
  haveAccessToken?: boolean;
  productVariants?: any[];
};

const ProductTable: React.FC<ProductTableProps> = ({ 
  list,
  onWishlist,
  onAddToCart,
  wishlistMap,
  cartMap,
  haveAccessToken = false,
  productVariants = [],
}) => {
  const t = useTranslations();
  const { user, langDir, currency } = useAuth();
  const { translate } = useDynamicTranslation();
  const currentAccount = useCurrentAccount();
  const vendorBusinessCategoryIds = useVendorBusinessCategories();

  const currentTradeRole = currentAccount?.data?.data?.account?.tradeRole || user?.tradeRole;

  const calculateDiscountedPrice = ({ item }: { item: TrendingProduct }) => {
    const price = item.productProductPrice ? Number(item.productProductPrice) : 0;
    
    const rawConsumerType = item.consumerType || "CONSUMER";
    const consumerType = typeof rawConsumerType === "string" 
      ? rawConsumerType.toUpperCase().trim() 
      : "CONSUMER";
    
    const isVendorType = consumerType === "VENDOR" || consumerType === "VENDORS";
    const isConsumerType = consumerType === "CONSUMER";
    const isEveryoneType = consumerType === "EVERYONE";
    
    const isCategoryMatch = item.categoryId && vendorBusinessCategoryIds.includes(item.categoryId);
    
    let discount = 0;
    let discountType: string | undefined;
    
    if (currentTradeRole && currentTradeRole !== "BUYER") {
      if (isCategoryMatch) {
        if (item.vendorDiscount && item.vendorDiscount > 0) {
          discount = item.vendorDiscount;
          discountType = item.vendorDiscountType;
        }
      } else {
        if (isEveryoneType) {
          discount = item.consumerDiscount || 0;
          discountType = item.consumerDiscountType;
        }
      }
    } else {
      if (isConsumerType || isEveryoneType) {
        discount = item.consumerDiscount || 0;
        discountType = item.consumerDiscountType;
      }
    }
    
    if (discount > 0 && discountType) {
      if (discountType === "PERCENTAGE") {
        return {
          finalPrice: Number((price - (price * discount) / 100).toFixed(2)),
          originalPrice: price,
          discount,
          discountType,
        };
      } else if (discountType === "FLAT") {
        return {
          finalPrice: Number((price - discount).toFixed(2)),
          originalPrice: price,
          discount,
          discountType,
        };
      }
    }
    
    return {
      finalPrice: price,
      originalPrice: price,
      discount: 0,
      discountType: undefined,
    };
  };

  const calculateRating = (item: TrendingProduct) => {
    if (!item.productReview || item.productReview.length === 0) return 0;
    const totalRating = item.productReview.reduce((sum: number, review: any) => sum + (review.rating || 0), 0);
    return totalRating / item.productReview.length;
  };

  // Helper function to get local timestamp from date and time strings
  const getLocalTimestamp = (dateStr?: string, timeStr?: string) => {
    if (!dateStr) return 0;
    try {
      const date = new Date(dateStr);
      if (timeStr) {
        const [hours, minutes] = timeStr.split(":").map(Number);
        if (!Number.isNaN(hours)) {
          date.setHours(hours || 0, Number.isNaN(minutes) ? 0 : minutes, 0, 0);
        }
      }
      return date.getTime();
    } catch {
      return 0;
    }
  };

  // Format time for countdown display
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = String(Math.floor((totalSeconds % 86400) / 3600)).padStart(2, "0");
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    return `${days} Days; ${hours}:${minutes}:${seconds}`;
  };

  // Component for Buygroup Timing Display
  const BuygroupTimingDisplay: React.FC<{ item: TrendingProduct }> = ({ item }) => {
    const [timeLeft, setTimeLeft] = useState<string | null>(null);

    useEffect(() => {
      if (
        !item?.productPrices?.length ||
        item?.productPrices?.[0]?.sellType !== "BUYGROUP"
      ) {
        setTimeLeft(null);
        return;
      }

      const product = item.productPrices[0];
      const startTimestamp = getLocalTimestamp(product.dateOpen, product.startTime);
      const endTimestamp = getLocalTimestamp(product.dateClose, product.endTime);

      const updateCountdown = () => {
        const now = Date.now();

        if (now < startTimestamp) {
          setTimeLeft(t("not_started") || "Not Started");
          return;
        }

        const ms = endTimestamp - now;
        if (ms <= 0) {
          setTimeLeft(t("expired") || "Expired");
          return;
        }

        setTimeLeft(formatTime(ms));
      };

      updateCountdown();
      const interval = setInterval(updateCountdown, 1000);

      return () => clearInterval(interval);
    }, [item?.productPrices]);

    if (!timeLeft) return null;

    const isExpired = timeLeft === (t("expired") || "Expired");
    const isNotStarted = timeLeft === (t("not_started") || "Not Started");

    return (
      <div className="mt-1">
        <span className={`text-xs font-medium px-2 py-1 rounded inline-block ${
          isExpired 
            ? "bg-destructive/10 text-destructive" 
            : isNotStarted
            ? "bg-warning/10 text-warning"
            : "bg-destructive text-white"
        }`}>
          {timeLeft}
        </span>
      </div>
    );
  };

  return (
    <CardContent className="main-content w-full p-0">
      <Card className="main-content-card shadow-sm border-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted hover:bg-muted">
                <TableHead className="min-w-[300px]" dir={langDir} translate="no">
                  {t("product")}
                </TableHead>
                <TableHead className="min-w-[120px]" dir={langDir} translate="no">
                  {t("category")}
                </TableHead>
                <TableHead className="min-w-[120px]" dir={langDir} translate="no">
                  {t("brand")}
                </TableHead>
                <TableHead className="min-w-[120px]" dir={langDir} translate="no">
                  {t("price")}
                </TableHead>
                <TableHead className="min-w-[150px] text-center" dir={langDir} translate="no">
                  {t("actions") || "Actions"}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list?.map((item: TrendingProduct) => {
                const priceData = calculateDiscountedPrice({ item });
                const rating = calculateRating(item);
                const inWishlist = wishlistMap?.get(item.id) || item?.inWishlist || false;
                const cartItem = cartMap?.get(item.id);
                const isInCart = !!cartItem;
                const cartQuantity = cartItem?.quantity || 0;
                
                // Get stock from productPrices array if productQuantity is not available
                const stock = item.productQuantity !== null && item.productQuantity !== undefined
                  ? item.productQuantity
                  : (item.productPrices?.[0]?.stock !== null && item.productPrices?.[0]?.stock !== undefined
                    ? Number(item.productPrices[0].stock)
                    : null);
                const isInStock = stock === null || stock > 0;

                return (
                  <TableRow 
                    key={item.id} 
                    className="hover:bg-muted transition-colors group"
                  >
                    {/* Product Column */}
                    <TableCell className="py-4">
                      <Link href={`/trending/${item.id}`} className="flex items-center gap-4 group/link">
                        <div className="relative flex-shrink-0">
                          <div className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-lg overflow-hidden border border-border bg-muted">
                            <Image
                              src={
                                item?.productImage &&
                                validator.isURL(item.productImage)
                                  ? item.productImage
                                  : PlaceholderImage
                              }
                              alt={item?.productName || "product"}
                              fill
                              className="object-cover group-hover/link:scale-105 transition-transform duration-200"
                              sizes="(max-width: 640px) 80px, 96px"
                            />
                          </div>
                          {/* Discount Badge */}
                          {priceData.discount > 0 && (
                            <span className="absolute -top-2 -right-2 bg-destructive text-white text-xs font-bold px-2 py-0.5 rounded-full">
                              {priceData.discountType === "PERCENTAGE" 
                                ? `-${priceData.discount}%`
                                : `-${currency.symbol}${priceData.discount}`}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground text-sm sm:text-base mb-1 line-clamp-2 group-hover/link:text-primary transition-colors">
                            {translate(item?.productName)}
                          </h3>
                          {/* Rating */}
                          {rating > 0 && (
                            <div className="flex items-center gap-1 mb-1">
                              {[...Array(5)].map((_, i) => (
                                <span key={i} className="text-warning">
                                  {i < Math.floor(rating) ? (
                                    <FaStar size={12} />
                                  ) : (
                                    <FaRegStar size={12} />
                                  )}
                                </span>
                              ))}
                              <span className="text-xs text-muted-foreground ml-1">
                                ({item.productReview?.length || 0})
                              </span>
                            </div>
                          )}
                          {/* Stock Status */}
                          {item.askForPrice !== "true" && stock !== null && (
                            <span className={`text-xs font-medium ${
                              isInStock 
                                ? "text-success" 
                                : "text-destructive"
                            }`}>
                              {isInStock 
                                ? `${t("in_stock") || "In Stock"}` 
                                : `${t("out_of_stock") || "Out of Stock"}`}
                            </span>
                          )}
                          {/* Buygroup Timing */}
                          <BuygroupTimingDisplay item={item} />
                        </div>
                      </Link>
                    </TableCell>

                    {/* Category Column */}
                    <TableCell className="py-4">
                      <span className="text-sm text-muted-foreground">{item?.categoryName || "-"}</span>
                    </TableCell>

                    {/* Brand Column */}
                    <TableCell className="py-4">
                      <span className="text-sm text-muted-foreground font-medium">
                        {item?.brandName || "-"}
                      </span>
                    </TableCell>

                    {/* Price Column */}
                    <TableCell className="py-4">
                      {item?.askForPrice === "true" ? (
                        <Link href={`/seller-rfq-request?product_id=${item?.id}`}>
                          <Button
                            size="sm"
                            className="bg-warning hover:bg-warning text-white text-xs px-3 py-1"
                            dir={langDir}
                            translate="no"
                          >
                            {t("ask_vendor_for_price")}
                          </Button>
                        </Link>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-foreground">
                              {currency.symbol}{priceData.finalPrice}
                            </span>
                            {priceData.discount > 0 && priceData.originalPrice !== priceData.finalPrice && (
                              <span className="text-sm text-muted-foreground line-through">
                                {currency.symbol}{priceData.originalPrice}
                              </span>
                            )}
                          </div>
                          {priceData.discount > 0 && (
                            <span className="text-xs text-success font-medium">
                              {t("save") || "Save"} {priceData.discountType === "PERCENTAGE" 
                                ? `${priceData.discount}%`
                                : `${currency.symbol}${priceData.discount}`}
                            </span>
                          )}
                        </div>
                      )}
                    </TableCell>

                    {/* Actions Column */}
                    <TableCell className="py-4">
                      <div className="flex items-center justify-center gap-2">
                        {/* Add to Cart */}
                        {haveAccessToken && 
                         item?.askForPrice !== "true" && 
                         isInStock && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 w-9 p-0 border-border hover:bg-primary/5 hover:border-primary hover:text-primary transition-colors"
                            onClick={() => onAddToCart?.(item, 1, "add", undefined, cartItem?.cartId)}
                            title={t("add_to_cart")}
                          >
                            <ShoppingIcon />
                          </Button>
                        )}

                        {/* View Button */}
                        <Link href={`/trending/${item.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 w-9 p-0 border-border hover:bg-muted transition-colors"
                            title={t("view") || "View"}
                          >
                            <FiEye size={16} className="text-muted-foreground" />
                          </Button>
                        </Link>

                        {/* Wishlist Button */}
                        {haveAccessToken && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 w-9 p-0 border-border hover:bg-destructive/5 hover:border-destructive transition-colors"
                            onClick={() => onWishlist?.(item.id, item?.productWishlist)}
                            title={t("wishlist") || "Wishlist"}
                          >
                            {inWishlist ? (
                              <FaHeart size={16} className="text-destructive" />
                            ) : (
                              <FaRegHeart size={16} className="text-muted-foreground" />
                            )}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>
    </CardContent>
  );
};

export default ProductTable;
