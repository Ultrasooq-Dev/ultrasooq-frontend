import Image from "next/image";
import Link from "next/link";
import React, { useMemo } from "react";
import { FaStar } from "react-icons/fa";
import { FaRegStar } from "react-icons/fa";
import validator from "validator";
import PlaceholderImage from "@/public/images/product-placeholder.png";
import { Button } from "@/components/ui/button";
// import ShoppingIcon from "@/public/images/shopping-icon.svg";
// import EyeIcon from "@/public/images/eye-icon.svg";
// import CompareIcon from "@/public/images/compare-icon.svg";
import { FaHeart } from "react-icons/fa";
import { FaRegHeart } from "react-icons/fa";
import { FiEye } from "react-icons/fi";
import ShoppingIcon from "@/components/icons/ShoppingIcon";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { useDynamicTranslation } from "@/hooks/useDynamicTranslation";
import { useVendorBusinessCategories } from "@/hooks/useVendorBusinessCategories";
import { checkCategoryConnection } from "@/utils/categoryConnection";
import { useCategory } from "@/apis/queries/category.queries";
import { useCurrentAccount } from "@/apis/queries/auth.queries";

type ProductCardProps = {
  id: number;
  productName: string;
  productImages: { id: number; image: string }[];
  shortDescription: string;
  productProductPrice?: string;
  offerPrice: number;
  productPrice: number;
  productReview: { rating: number }[];
  onAdd?: () => void;
  onWishlist: () => void;
  inWishlist?: boolean;
  haveAccessToken: boolean;
  consumerDiscount?: number;
  consumerDiscountType?: string;
  vendorDiscount?: number;
  vendorDiscountType?: string;
  askForPrice?: string;
  categoryId?: number;
  categoryLocation?: string;
  consumerType?: "CONSUMER" | "VENDORS" | "EVERYONE";
};

const ProductCard: React.FC<ProductCardProps> = ({
  id,
  productName,
  productImages,
  shortDescription,
  productProductPrice,
  offerPrice,
  productPrice,
  productReview,
  onAdd,
  onWishlist,
  inWishlist,
  haveAccessToken,
  consumerDiscount,
  consumerDiscountType,
  vendorDiscount,
  vendorDiscountType,
  askForPrice,
  categoryId,
  categoryLocation,
  consumerType,
}) => {
  const t = useTranslations();
  const { user, langDir, currency } = useAuth();
  const { translate } = useDynamicTranslation();
  const currentAccount = useCurrentAccount();
  const vendorBusinessCategoryIds = useVendorBusinessCategories();

  // Get the current account's trade role (for multi-account system)
  const currentTradeRole = currentAccount?.data?.data?.account?.tradeRole || user?.tradeRole;
  
  // Fetch product category data to get connections (only if vendor and categoryId exists)
  const productCategoryQuery = useCategory(
    categoryId?.toString(),
    !!(currentTradeRole && currentTradeRole !== "BUYER" && categoryId)
  );
  
  const categoryConnections = productCategoryQuery?.data?.data?.category_categoryIdDetail || [];

  // Helper function to get the applicable discount for the current user
  const getApplicableDiscount = () => {
    // Normalize consumerType to uppercase and handle both "VENDOR" and "VENDORS"
    const rawConsumerType = consumerType || "CONSUMER";
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
        if (vendorDiscount && vendorDiscount > 0) {
          discount = vendorDiscount;
          discountType = vendorDiscountType;
        } else {
          // No vendor discount available, no discount
          discount = 0;
        }
      } else {
        // Not same relation
        if (isEveryoneType) {
          // E + Not Same relation → Consumer Discount
          discount = consumerDiscount || 0;
          discountType = consumerDiscountType;
        } else {
          // VENDORS or CONSUMER + Not Same relation → No Discount
          discount = 0;
        }
      }
    } else {
      // CONSUMER (BUYER) - Gets consumer discount if consumerType is CONSUMER or EVERYONE
      // NO discount if consumerType is VENDOR or VENDORS
      if (isConsumerType || isEveryoneType) {
        discount = consumerDiscount || 0;
        discountType = consumerDiscountType;
      } else {
        // consumerType is VENDOR/VENDORS - no discount for buyers
        discount = 0;
      }
    }
    
    return { discount, discountType };
  };

  const calculateDiscountedPrice = () => {
    const price = productProductPrice ? Number(productProductPrice) : 0;
    
    const { discount, discountType } = getApplicableDiscount();
    
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
    const totalRating = productReview?.reduce(
      (acc: number, item: { rating: number }) => {
        return acc + item.rating;
      },
      0,
    );

    const result = totalRating / productReview?.length;
    return !isNaN(result) ? Math.floor(result) : 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productReview?.length]);

  const calculateRatings = useMemo(
    () => (rating: number) => {
      const stars: Array<React.ReactNode> = [];
      for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
          stars.push(<FaStar key={i} color="#FFC107" size={20} />);
        } else {
          stars.push(<FaRegStar key={i} color="#FFC107" size={20} />);
        }
      }
      return stars;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [productReview?.length],
  );

  return (
    <div className="relative h-full w-full bg-white p-4">
      <Link href={`/trending/${id}`}>
        {(() => {
          const { discount, discountType } = getApplicableDiscount();
          return askForPrice !== "true" && discount > 0 && discountType ? (
            <div className="absolute left-2 top-2 z-10 inline-flex items-center bg-red-600 px-2 py-0.5 text-xs font-medium text-white">
              <span>
                {discountType === "PERCENTAGE" 
                  ? `-${discount}%` 
                  : `-${currency.symbol}${discount}`
                }
              </span>
            </div>
          ) : null;
        })()}
        
        {/* Product Image */}
        <div className="relative mx-auto mb-3 h-48 w-full bg-white flex items-center justify-center">
          <Image
            src={
              productImages?.[0]?.image &&
              validator.isURL(productImages[0].image)
                ? productImages[0].image
                : PlaceholderImage
            }
            alt={productName}
            className="object-contain"
            fill
          />
        </div>
      </Link>

      {/* Product Info */}
      <div className="flex flex-col">
        <Link href={`/trending/${id}`}>
          <div>
            <h4 className="mb-2 line-clamp-2 text-sm text-gray-900" title={productName}>
              {translate(productName)}
            </h4>
            
            {/* Rating */}
            <div className="mb-2 flex items-center gap-1">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <span key={i}>
                    {i < calculateAvgRating ? (
                      <FaStar size={14} color="#FFA41C" />
                    ) : (
                      <FaRegStar size={14} color="#FFA41C" />
                    )}
                  </span>
                ))}
              </div>
              <span className="text-xs text-blue-600">({productReview?.length})</span>
            </div>
            
            {/* Price */}
            <div className="mb-2">
              {askForPrice === "true" ? (
                <span className="text-sm font-medium text-gray-700">
                  {t("ask_for_price")}
                </span>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xl font-medium text-gray-900">
                    {currency.symbol}{calculateDiscountedPrice()}
                  </span>
                  {productProductPrice && calculateDiscountedPrice() < Number(productProductPrice) && (
                    <span className="text-sm text-gray-500 line-through">
                      {currency.symbol}{productProductPrice}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Short Description */}
            {shortDescription && shortDescription !== "-" && (
              <p className="mb-2 line-clamp-2 text-xs text-gray-600" title={shortDescription}>
                {shortDescription}
              </p>
            )}

            {/* Discount Badge */}
            {(() => {
              const { discount, discountType } = getApplicableDiscount();
              return askForPrice !== "true" && discount > 0 && discountType && (
                <div className="mb-2 flex items-center gap-1">
                  <span className="text-xs font-medium text-red-600">
                    Save {discountType === "PERCENTAGE" 
                      ? `${discount}%` 
                      : `${currency.symbol}${discount}`
                    }
                  </span>
                </div>
              );
            })()}
          </div>
        </Link>

        {/* Action Buttons */}
        <div className="mt-3 flex items-center gap-2">
          {askForPrice !== "true" ? (
            <Button
              onClick={onAdd}
              className="flex-1 bg-yellow-400 px-4 py-2 text-xs font-medium text-gray-900 hover:bg-yellow-500"
            >
              {t("add_to_cart")}
            </Button>
          ) : (
            <Link href={`/seller-rfq-request?product_id=${id}`} className="flex-1">
              <button
                type="button"
                className="w-full bg-blue-500 px-4 py-2 text-xs font-medium text-white hover:bg-blue-600"
                dir={langDir}
                translate="no"
              >
                {t("ask_vendor_for_price")}
              </button>
            </Link>
          )}

          {haveAccessToken ? (
            <Button
              variant="outline"
              onClick={onWishlist}
              className="h-9 w-9 border-0 bg-gray-100 p-0 hover:bg-gray-200"
            >
              {inWishlist ? (
                <FaHeart className="h-4 w-4 text-red-500" />
              ) : (
                <FaRegHeart className="h-4 w-4 text-gray-600" />
              )}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
