import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState, useMemo } from "react";
import validator from "validator";
import PlaceholderImage from "@/public/images/product-placeholder.png";
import { FaCircleCheck } from "react-icons/fa6";
import ShoppingIcon from "@/components/icons/ShoppingIcon";
import { FaHeart, FaRegHeart, FaStar, FaRegStar } from "react-icons/fa";
import { FiEye } from "react-icons/fi";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { useDynamicTranslation } from "@/hooks/useDynamicTranslation";

type RfqProductCardProps = {
  id: number;
  productType: "R" | "P";
  productName: string;
  productNote: string;
  productStatus: string;
  productImages: {
    image: string;
  }[];
  productQuantity: number;
  onAdd: (
    args0: number,
    args1: number,
    args2: "add" | "remove",
    args3?: number,
    args4?: number,
    args5?: string,
  ) => void;
  onToCart: () => void;
  onEdit: (args0: number) => void;
  onWishlist: () => void;
  isCreatedByMe: boolean;
  isAddedToCart: boolean;
  inWishlist?: boolean;
  haveAccessToken: boolean;
  productPrice: any;
  offerPriceFrom?: number;
  offerPriceTo?: number;
  productReview?: any[];
  shortDescription?: string;
};

const RfqProductCard: React.FC<RfqProductCardProps> = ({
  id,
  productType,
  productName,
  productNote,
  productStatus,
  productImages,
  productQuantity,
  onAdd,
  onToCart,
  onEdit,
  onWishlist,
  isCreatedByMe,
  isAddedToCart,
  inWishlist,
  haveAccessToken,
  productPrice,
  offerPriceFrom,
  offerPriceTo,
  productReview = [],
  shortDescription = "",
}) => {
  const t = useTranslations();
  const { langDir, currency } = useAuth();
  const { translate } = useDynamicTranslation();
  const [quantity, setQuantity] = useState(0);

  useEffect(() => {
    setQuantity(productQuantity || 0);
  }, [productQuantity]);

  const calculateAvgRating = useMemo(() => {
    const totalRating = productReview?.reduce(
      (acc: number, item: { rating: number }) => acc + item.rating,
      0,
    );
    const result = totalRating / productReview?.length;
    return !isNaN(result) ? Math.floor(result) : 0;
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
    [productReview?.length],
  );

  return (
    <div className="group relative bg-card rounded-lg sm:rounded-xl shadow-sm sm:shadow-lg border border-border hover:shadow-xl hover:border-border transition-all duration-300 overflow-hidden h-full flex flex-row sm:flex-col items-stretch">
      {/* Product Image Container */}
      <Link href={`/rfq/${id}`} className="block w-32 sm:w-full flex-shrink-0">
        <div className="relative w-full h-40 sm:h-56 bg-muted overflow-hidden">
          <Image
            src={
              productImages?.[0]?.image &&
              (validator.isURL(productImages?.[0]?.image) || productImages?.[0]?.image.startsWith('data:image/'))
                ? productImages[0].image
                : PlaceholderImage
            }
            alt="product-image"
            fill
            sizes="(max-width: 640px) 128px, (max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-contain group-hover:scale-105 transition-transform duration-300"
            blurDataURL="/images/product-placeholder.png"
            placeholder="blur"
          />
        </div>
      </Link>

      {/* Action Buttons */}
      <div className="absolute top-1 sm:top-3 left-1/2 sm:left-1/2 transform -translate-x-1/2 opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 flex gap-1 sm:gap-2 scale-75 sm:scale-100">
        <Button
          variant="secondary"
          size="sm"
          className="h-8 w-8 rounded-full bg-card/90 backdrop-blur-xs shadow-lg hover:bg-card hover:scale-110 transition-all duration-200"
          onClick={() => onAdd(quantity + 1, id, "add", offerPriceFrom, offerPriceTo, productNote || "")}
        >
          <ShoppingIcon />
        </Button>
        <Link
          href={`/rfq/${id}`}
          className="h-8 w-8 rounded-full bg-card/90 backdrop-blur-xs shadow-lg hover:bg-card hover:scale-110 transition-all duration-200 flex items-center justify-center"
        >
          <FiEye size={16} className="text-muted-foreground" />
        </Link>
        {haveAccessToken ? (
          <Button
            variant="secondary"
            size="sm"
            className="h-8 w-8 rounded-full bg-card/90 backdrop-blur-xs shadow-lg hover:bg-card hover:scale-110 transition-all duration-200"
            onClick={onWishlist}
          >
            {inWishlist ? (
              <FaHeart color="#ef4444" size={14} />
            ) : (
              <FaRegHeart size={14} className="text-muted-foreground" />
            )}
          </Button>
        ) : null}
      </div>

      {/* Product Information */}
      <div className="p-2 sm:p-4 space-y-1 sm:space-y-3 flex-1 flex flex-col">
        <Link href={`/rfq/${id}`} className="block group flex-1">
          <h3 className="font-semibold text-foreground text-xs sm:text-base leading-tight line-clamp-2 group-hover:text-primary transition-colors duration-200 mb-1 sm:mb-2" dir={langDir}>
            {translate(productName)}
          </h3>
          <p className="text-muted-foreground text-xs sm:text-sm line-clamp-1 mb-1 sm:mb-2" title={shortDescription}>
            {shortDescription}
          </p>
          
          {/* Rating */}
          <div className="flex items-center gap-1 mb-1 sm:mb-2">
            <div className="flex scale-75 sm:scale-100 origin-left">
              {calculateRatings(calculateAvgRating)}
            </div>
            <span className="text-xs sm:text-sm text-muted-foreground ml-1">
              ({productReview?.length || 0})
            </span>
          </div>
        </Link>

        {/* Price Section */}
        <div className="space-y-1 sm:space-y-2 mb-2 sm:mb-3">
          <div className="space-y-1" suppressHydrationWarning>
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-lg font-bold text-primary" dir={langDir}>
                {t("ask_for_price")}
              </span>
            </div>
          </div>
        </div>

        {/* Quantity Section */}
        <div className="space-y-1 sm:space-y-2 mb-2 sm:mb-3">
          <label className="block text-xs sm:text-sm font-medium text-muted-foreground" dir={langDir} translate="no">
            {t("quantity")}
          </label>
          <div className="flex items-center justify-center gap-1 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-6 w-6 sm:h-8 sm:w-8 rounded-full border-border hover:bg-muted hover:border-border disabled:opacity-50 p-0"
              onClick={() => {
                const newQuantity = Math.max(quantity - 1, 0);
                setQuantity(newQuantity);
                // If quantity becomes 0 and item is in cart, remove it
                if (newQuantity === 0 && isAddedToCart) {
                  onAdd(0, id, "remove", offerPriceFrom, offerPriceTo, productNote || "");
                }
              }}
              disabled={quantity === 0}
            >
              <Image
                src="/images/upDownBtn-minus.svg"
                alt="minus-icon"
                width={12}
                height={12}
                className="opacity-70 sm:w-4 sm:h-4"
              />
            </Button>
            <input
              type="text"
              value={quantity}
              className="h-6 w-12 sm:h-8 sm:w-16 text-center text-xs sm:text-sm font-medium border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              onChange={(e) => {
                const value = Number(e.target.value);
                const newQuantity = isNaN(value) || value < 0 ? 0 : value;
                setQuantity(newQuantity);
                // If quantity becomes 0 and item is in cart, remove it
                if (newQuantity === 0 && isAddedToCart) {
                  onAdd(0, id, "remove", offerPriceFrom, offerPriceTo, productNote || "");
                }
              }}
              onBlur={(e) => {
                // Handle empty input - treat as 0
                if (e.target.value === "" || Number(e.target.value) === 0) {
                  setQuantity(0);
                  if (isAddedToCart) {
                    onAdd(0, id, "remove", offerPriceFrom, offerPriceTo, productNote || "");
                  }
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-6 w-6 sm:h-8 sm:w-8 rounded-full border-border hover:bg-muted hover:border-border disabled:opacity-50 p-0"
              onClick={() => {
                setQuantity(quantity + 1);
              }}
            >
              <Image
                src="/images/upDownBtn-plus.svg"
                alt="plus-icon"
                width={12}
                height={12}
                className="opacity-70 sm:w-4 sm:h-4"
              />
            </Button>
          </div>
        </div>

        {/* Edit Button - Show for all authenticated users */}
        {haveAccessToken ? (
          <div className="mb-2 sm:mb-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onEdit(id)}
              className="w-full text-xs sm:text-sm h-7 sm:h-9"
              dir={langDir}
              translate="no"
            >
              {isCreatedByMe ? t("edit") : t("edit_and_add_as_my_rfq")}
            </Button>
          </div>
        ) : null}

        {/* Cart Button */}
        <div className="mt-auto pt-2 sm:pt-3">
          {isAddedToCart ? (
            <button
              type="button"
              className="w-full flex items-center justify-center gap-1 sm:gap-2 py-1.5 sm:py-2 px-2 sm:px-4 rounded-lg border-2 border-success/20 bg-success/5 text-success font-semibold text-xs sm:text-sm transition-all duration-200"
              disabled={false}
              dir={langDir}
              translate="no"
            >
              <FaCircleCheck color="#10b981" size={14} className="sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">{t("added_to_rfq_cart")}</span>
              <span className="sm:hidden">{t("added")}</span>
            </button>
          ) : (
            <button
              type="button"
              className="w-full bg-linear-to-r from-warning to-warning/90 hover:from-warning hover:to-warning/80 text-white font-semibold py-1.5 sm:py-2 px-2 sm:px-4 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-xs sm:text-sm"
              onClick={() => onAdd(quantity || 1, id, "add", offerPriceFrom, offerPriceTo, productNote || "")}
              disabled={quantity == 0}
              dir={langDir}
              translate="no"
            >
              <span className="hidden sm:inline">{t("add_to_rfq_cart")}</span>
              <span className="sm:hidden">{t("add_to_cart")}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RfqProductCard;
