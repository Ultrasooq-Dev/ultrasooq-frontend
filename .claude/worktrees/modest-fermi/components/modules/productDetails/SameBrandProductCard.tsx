import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
// import Link from "next/link";
import React, { useMemo } from "react";
import { FaStar } from "react-icons/fa";
import { FaRegStar } from "react-icons/fa";
import validator from "validator";
// import ShoppingIcon from "@/public/images/shopping-icon.svg";
// import EyeIcon from "@/public/images/eye-icon.svg";
// import CompareIcon from "@/public/images/compare-icon.svg";
import PlaceholderImage from "@/public/images/product-placeholder.png";
import { FaHeart } from "react-icons/fa";
import { FaRegHeart } from "react-icons/fa";
import { FiEye } from "react-icons/fi";
import ShoppingIcon from "@/components/icons/ShoppingIcon";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { useVendorBusinessCategories } from "@/hooks/useVendorBusinessCategories";
import { checkCategoryConnection } from "@/utils/categoryConnection";
import { useCategory } from "@/apis/queries/category.queries";
import { useCurrentAccount } from "@/apis/queries/auth.queries";

type SameBrandProductCardProps = {
  id: number;
  productName: string;
  productImages: { id: number; image: string }[];
  shortDescription: string;
  productProductPrice?: string;
  productPrice: string;
  offerPrice: string;
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

const SameBrandProductCard: React.FC<SameBrandProductCardProps> = ({
  id,
  productName,
  productImages,
  shortDescription,
  productPrice,
  offerPrice,
  productProductPrice,
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
    <div className="product-list-s1-col">
      <div className="product-list-s1-box">
        <Link href={`/trending/${id}`}>
          <div className="image-container relative mb-4">
            {(() => {
              const { discount, discountType } = getApplicableDiscount();
              return askForPrice !== "true" && discount > 0 && discountType ? (
                <span className="discount">
                  {discountType === "PERCENTAGE" 
                    ? `${discount}%` 
                    : `${currency.symbol}${discount}`
                  }
                </span>
              ) : null;
            })()}
            <Image
              src={
                productImages?.[0]?.image &&
                  validator.isURL(productImages[0].image)
                  ? productImages[0].image
                  : PlaceholderImage
              }
              alt="preview"
              className="object-contain"
              fill
            />
          </div>
        </Link>

        <div className="mb-3 flex flex-row items-center justify-center gap-x-3">
          {askForPrice !== "true" ? (
            <Button
              variant="ghost"
              className="relative h-8 w-8 rounded-full p-0 shadow-md"
              onClick={onAdd}
            >
              <ShoppingIcon />
            </Button>
          ) : null}

          <Link
            href={`/trending/${id}`}
            className="relative flex h-8 w-8 items-center justify-center rounded-full shadow-md!"
          >
            <FiEye size={18} />
          </Link>
          {haveAccessToken ? (
            <Button
              variant="ghost"
              className="relative h-8 w-8 rounded-full p-0 shadow-md"
              onClick={onWishlist}
            >
              {inWishlist ? (
                <FaHeart color="red" size={16} />
              ) : (
                <FaRegHeart size={16} />
              )}
            </Button>
          ) : null}
          {/* <Button
            variant="ghost"
            className="relative h-8 w-8 rounded-full p-0 shadow-md"
            onClick={copyToClipboard}
          >
            <ShareIcon />
          </Button> */}
        </div>

        <Link href={`/trending/${id}`}>
          <div className="text-container">
            <h4>{productName}</h4>
            <p title={shortDescription} className="truncate">
              {shortDescription}
            </p>
            <div className="rating_stars">
              {calculateRatings(calculateAvgRating)}
              <span>{productReview?.length}</span>
            </div>
          </div>
        </Link>

        <div className="mt-2">
          {askForPrice === "true" ? (
            <Link href={`/seller-rfq-request?product_id=${id}`}>
              <button
                type="button"
                className="inline-block w-full rounded-sm bg-color-yellow px-3 py-1 text-sm font-bold text-white"
                dir={langDir}
                translate="no"
              >
                {t("ask_vendor_for_price")}
              </button>
            </Link>
          ) : (
            <h5 className="py-1 text-[#1D77D1]">
              {currency.symbol}{calculateDiscountedPrice()}{" "}
              {(() => {
                const { discount } = getApplicableDiscount();
                return discount > 0 && productProductPrice && Number(productProductPrice) > calculateDiscountedPrice() && (
                  <span className="text-muted-foreground line-through!">
                    {currency.symbol}{productProductPrice}
                  </span>
                );
              })()}
            </h5>
          )}
        </div>
      </div>
    </div>
  );
};

export default SameBrandProductCard;
