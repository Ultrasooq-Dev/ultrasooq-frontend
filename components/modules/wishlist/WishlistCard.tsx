import Image from "next/image";
import Link from "next/link";
import React, { useMemo } from "react";
import validator from "validator";
import { FaStar } from "react-icons/fa";
import { FaRegStar } from "react-icons/fa";
import PlaceholderImage from "@/public/images/product-placeholder.png";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { Trash2 } from "lucide-react";
import { useVendorBusinessCategories } from "@/hooks/useVendorBusinessCategories";
import { checkCategoryConnection } from "@/utils/categoryConnection";
import { useCategory } from "@/apis/queries/category.queries";
import { useCurrentAccount } from "@/apis/queries/auth.queries";

type WishlistCardProps = {
  productId: number;
  wishlistData: any;
  onDeleteFromWishlist: (wishListId: number) => void;
  id: number;
};

const WishlistCard: React.FC<WishlistCardProps> = ({
  productId,
  wishlistData,
  onDeleteFromWishlist,
  id,
}) => {
  const t = useTranslations();
  const { user, langDir, currency } = useAuth();
  const currentAccount = useCurrentAccount();
  const vendorBusinessCategoryIds = useVendorBusinessCategories();

  // Get the current account's trade role (for multi-account system)
  const currentTradeRole = currentAccount?.data?.data?.account?.tradeRole || user?.tradeRole;
  
  // Get category data from wishlistData
  const categoryId = wishlistData?.categoryId || wishlistData?.category?.id;
  const categoryLocation = wishlistData?.categoryLocation;
  const consumerType = wishlistData?.product_productPrice?.[0]?.consumerType || "CONSUMER";
  
  // Fetch product category data to get connections (only if vendor and categoryId exists)
  const productCategoryQuery = useCategory(
    categoryId?.toString(),
    !!(currentTradeRole && currentTradeRole !== "BUYER" && categoryId)
  );
  
  const categoryConnections = productCategoryQuery?.data?.data?.category_categoryIdDetail || [];
  
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

  // Check if buygroup sale has started
  const isBuygroup = wishlistData?.product_productPrice?.[0]?.sellType === "BUYGROUP";
  const buygroupStartTime = getLocalTimestamp(
    wishlistData?.product_productPrice?.[0]?.dateOpen,
    wishlistData?.product_productPrice?.[0]?.startTime
  );
  const buygroupEndTime = getLocalTimestamp(
    wishlistData?.product_productPrice?.[0]?.dateClose,
    wishlistData?.product_productPrice?.[0]?.endTime
  );
  const now = Date.now();
  const saleNotStarted = isBuygroup && buygroupStartTime > 0 && now < buygroupStartTime;
  const saleExpired = isBuygroup && buygroupEndTime > 0 && now > buygroupEndTime;
  
  // Helper function to format sale start date
  const getSaleStartLabel = () => {
    try {
      if (!isBuygroup || !wishlistData?.product_productPrice?.[0]) return "";
      const p = wishlistData.product_productPrice[0];
      if (!p?.dateOpen) return "";
      const date = new Date(p.dateOpen);
      // Apply startTime if present (HH:mm)
      if (p?.startTime) {
        const [h, m] = String(p.startTime).split(":").map(Number);
        if (!Number.isNaN(h)) date.setHours(h || 0, Number.isNaN(m) ? 0 : m, 0, 0);
      }
      return date.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return "";
    }
  };
  
  const calculateDiscountedPrice = () => {
    const price = wishlistData?.product_productPrice?.[0]?.offerPrice
      ? Number(wishlistData.product_productPrice?.[0]?.offerPrice)
      : 0;
    
    // Normalize consumerType to uppercase and handle both "VENDOR" and "VENDORS"
    const rawConsumerType = consumerType || wishlistData?.product_productPrice?.[0]?.consumerType || "CONSUMER";
    const productConsumerType = typeof rawConsumerType === "string" 
      ? rawConsumerType.toUpperCase().trim() 
      : "CONSUMER";
    
    // Check if it's a vendor type (VENDOR or VENDORS)
    const isVendorType = productConsumerType === "VENDOR" || productConsumerType === "VENDORS";
    const isConsumerType = productConsumerType === "CONSUMER";
    const isEveryoneType = productConsumerType === "EVERYONE";
    
    // Check if vendor business category matches product category
    const isCategoryMatch = checkCategoryConnection(
      vendorBusinessCategoryIds,
      categoryId || 0,
      categoryLocation,
      categoryConnections
    );
    
    let discount = 0;
    let discountType: string | undefined;
    
    // Apply discount logic based on your table
    if (currentTradeRole && currentTradeRole !== "BUYER") {
      // VENDOR (V) or EVERYONE (E) as vendor
      if (isCategoryMatch) {
        // Same relation - Vendor gets vendor discount
        if (wishlistData?.product_productPrice?.[0]?.vendorDiscount && wishlistData?.product_productPrice?.[0]?.vendorDiscount > 0) {
          discount = wishlistData?.product_productPrice?.[0]?.vendorDiscount;
          discountType = wishlistData?.product_productPrice?.[0]?.vendorDiscountType;
        } else {
          // No vendor discount available, no discount
          discount = 0;
        }
      } else {
        // Not same relation
        if (isEveryoneType) {
          // E + Not Same relation → Consumer Discount
          discount = wishlistData?.product_productPrice?.[0]?.consumerDiscount || 0;
          discountType = wishlistData?.product_productPrice?.[0]?.consumerDiscountType;
        } else {
          // V + Not Same relation → No Discount
          discount = 0;
        }
      }
    } else {
      // CONSUMER (BUYER) - Gets consumer discount if consumerType is CONSUMER or EVERYONE
      // NO discount if consumerType is VENDOR or VENDORS
      if (isConsumerType || isEveryoneType) {
        discount = wishlistData?.product_productPrice?.[0]?.consumerDiscount || 0;
        discountType = wishlistData?.product_productPrice?.[0]?.consumerDiscountType;
      } else {
        // consumerType is VENDOR/VENDORS - no discount for buyers
        discount = 0;
      }
    }
    
    // Calculate final price
    if (discount > 0 && discountType) {
      if (discountType === "PERCENTAGE") {
        return Number((price - (price * discount) / 100).toFixed(2));
      } else if (discountType === "FLAT") {
        return Number((price - discount).toFixed(2));
      }
    }
    
    return price;
  };

  const calculateAvgRating = useMemo(() => {
    const totalRating = wishlistData?.productReview?.reduce(
      (acc: number, wishlistData: { rating: number }) => {
        return acc + wishlistData.rating;
      },
      0,
    );

    const result = totalRating / wishlistData?.productReview?.length;
    return !isNaN(result) ? Math.floor(result) : 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wishlistData?.productReview?.length]);

  const calculateRatings = useMemo(
    () => (rating: number) => {
      const stars: Array<React.ReactNode> = [];
      for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
          stars.push(<FaStar key={i} color="#FFC107" size={14} />);
        } else {
          stars.push(<FaRegStar key={i} color="#FFC107" size={14} />);
        }
      }
      return stars;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [wishlistData?.productReview?.length],
  );

  const discountedPrice = calculateDiscountedPrice();
  const originalPrice = wishlistData?.product_productPrice?.[0]?.offerPrice
    ? Number(wishlistData.product_productPrice[0].offerPrice)
    : 0;
  const hasDiscount = originalPrice > 0 && discountedPrice < originalPrice;
  const discountPercentage = hasDiscount && originalPrice > 0
    ? Math.round(((originalPrice - discountedPrice) / originalPrice) * 100)
    : 0;

  return (
    <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:border-gray-300 hover:shadow-md">
      {/* Delete Button */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2 z-10 h-8 w-8 rounded-full bg-white/90 text-gray-400 shadow-sm opacity-0 backdrop-blur-sm transition-all hover:bg-destructive/5 hover:text-destructive group-hover:opacity-100"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDeleteFromWishlist(productId);
        }}
        aria-label="Remove from wishlist"
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      {/* Product Image */}
      <Link href={`/trending/${wishlistData?.id}`} className="block">
        <div className="relative aspect-square w-full overflow-hidden bg-gray-50">
          <Image
            src={
              wishlistData?.productImages?.[0]?.image &&
                validator.isURL(wishlistData.productImages[0].image)
                ? wishlistData.productImages[0].image
                : PlaceholderImage
            }
            alt={wishlistData?.productName || "Product image"}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-contain transition-transform duration-300 group-hover:scale-105"
            blurDataURL="/images/product-placeholder.png"
            placeholder="blur"
          />
          {/* Not Started Badge for Buygroup */}
          {saleNotStarted && (
            <div className="absolute left-2 top-2 rounded-md bg-warning px-2 py-1 text-xs font-semibold text-white shadow-sm">
              {t("not_started")}
            </div>
          )}
          {/* Discount Badge - Only show if sale has started */}
          {!saleNotStarted && hasDiscount && discountPercentage > 0 && (
            <div className="absolute left-2 top-2 rounded-md bg-destructive px-2 py-1 text-xs font-semibold text-white shadow-sm">
              -{discountPercentage}%
            </div>
          )}
        </div>
      </Link>

      {/* Product Info */}
      <div className="p-4">
        <Link href={`/trending/${wishlistData?.id}`}>
          <h3 className="mb-2 line-clamp-2 min-h-[2.5rem] text-sm font-semibold text-gray-900 transition-colors hover:text-primary">
            {wishlistData?.productName}
          </h3>
        </Link>

        {/* Description */}
        {wishlistData?.product_productShortDescription?.[0]?.shortDescription && (
          <p
            className="mb-3 line-clamp-2 text-xs text-gray-600"
            title={
              wishlistData?.product_productShortDescription?.[0]
                ?.shortDescription
            }
          >
            {wishlistData?.product_productShortDescription?.[0]
              ?.shortDescription}
          </p>
        )}

        {/* Rating */}
        {wishlistData?.productReview?.length > 0 && (
          <div className="mb-3 flex items-center gap-1.5">
            <div className="flex items-center gap-0.5">
              {calculateRatings(calculateAvgRating).map((star, index) => (
                <span key={index}>{star}</span>
              ))}
            </div>
            <span className="text-xs text-gray-500">
              ({wishlistData?.productReview?.length})
            </span>
          </div>
        )}

        {/* Price or Ask for Price or Coming Soon */}
        <div className="mt-auto">
          {wishlistData?.product_productPrice?.[0]?.askForPrice === "true" ? (
            <Link
              href={`/seller-rfq-request?product_id=${wishlistData?.product_productPrice?.[0]?.id}`}
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                type="button"
                className="w-full rounded-lg bg-amber-500 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-amber-600"
                dir={langDir}
                translate="no"
              >
                {t("ask_vendor_for_price")}
              </Button>
            </Link>
          ) : saleNotStarted ? (
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                disabled
                className="w-full rounded-lg bg-warning text-xs font-semibold text-white shadow-sm cursor-not-allowed"
                dir={langDir}
                translate="no"
              >
                {t("coming_soon")}
              </Button>
              {getSaleStartLabel() && (
                <p className="text-xs text-center text-gray-600" dir={langDir} translate="no">
                  {t("sale_starts_on")}: {getSaleStartLabel()}
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-primary">
                  {currency.symbol}
                  {discountedPrice.toFixed(2)}
                </span>
                {hasDiscount && originalPrice > 0 && (
                  <span className="text-xs text-gray-500 line-through">
                    {currency.symbol}
                    {originalPrice.toFixed(2)}
                  </span>
                )}
              </div>
              {hasDiscount && originalPrice > 0 && (
                <span className="text-xs font-medium text-destructive">
                  {t("save")} {currency.symbol}
                  {(originalPrice - discountedPrice).toFixed(2)}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Hover Effect Border */}
      <div className="absolute inset-0 rounded-xl border-2 border-primary opacity-0 transition-opacity group-hover:opacity-5" />
    </div>
  );
};

export default WishlistCard;
