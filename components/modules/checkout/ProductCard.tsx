import { Button } from "@/components/ui/button";
import Image from "next/image";
import React, { useEffect, useMemo, useState } from "react";
import MinusIcon from "@/public/images/upDownBtn-minus.svg";
import PlusIcon from "@/public/images/upDownBtn-plus.svg";
import PlaceholderImage from "@/public/images/product-placeholder.png";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { Trash2, Heart } from "lucide-react";
import { useCurrentAccount } from "@/apis/queries/auth.queries";
import { useVendorBusinessCategories } from "@/hooks/useVendorBusinessCategories";
import { checkCategoryConnection } from "@/utils/categoryConnection";

type ProductCardProps = {
  cartId: number;
  productId: number;
  productPriceId: number;
  productName: string;
  offerPrice: string;
  productQuantity: number;
  productVariant: any;
  productImages: { id: number; image: string }[];
  onAdd: (quantity: number, action: "add" | "remove", productPriceId: number, variant?: any) => void;
  onRemove: (args0: number) => void;
  onWishlist: (args0: number) => void;
  haveAccessToken: boolean;
  consumerDiscount: number;
  consumerDiscountType?: string;
  vendorDiscount: number;
  vendorDiscountType?: string;
  consumerType?: string;
  categoryId?: number;
  categoryLocation?: string;
  categoryConnections?: any[];
  invalidProduct?: boolean;
  cannotBuy?: boolean;
};

const ProductCard: React.FC<ProductCardProps> = ({
  cartId,
  productId,
  productPriceId,
  productName,
  offerPrice,
  productQuantity,
  productVariant,
  productImages,
  onAdd,
  onRemove,
  onWishlist,
  haveAccessToken,
  consumerDiscount,
  consumerDiscountType,
  vendorDiscount,
  vendorDiscountType,
  consumerType,
  categoryId,
  categoryLocation,
  categoryConnections,
  invalidProduct,
  cannotBuy
}) => {
  const t = useTranslations();
  const { user, langDir, currency } = useAuth();
  const currentAccount = useCurrentAccount();
  const vendorBusinessCategoryIds = useVendorBusinessCategories() ?? [];
  const currentTradeRole = currentAccount?.data?.data?.account?.tradeRole || user?.tradeRole;
  const [quantity, setQuantity] = useState(1);

  const applicablePrice = useMemo(() => {
    const price = offerPrice ? Number(offerPrice) : 0;
    if (!price) return 0;

    const normalizedConsumerType =
      typeof consumerType === "string" ? consumerType.toUpperCase().trim() : "";
    const isVendorType = normalizedConsumerType === "VENDOR" || normalizedConsumerType === "VENDORS";
    const isConsumerType = normalizedConsumerType === "CONSUMER";
    const isEveryoneType = normalizedConsumerType === "EVERYONE";

    const isCategoryMatch = checkCategoryConnection(
      vendorBusinessCategoryIds,
      Number(categoryId || 0),
      categoryLocation,
      categoryConnections,
    );

    const vendorDiscountValue = Number(vendorDiscount || 0);
    const normalizedVendorDiscountType = vendorDiscountType
      ? vendorDiscountType.toString().toUpperCase().trim()
      : undefined;

    const consumerDiscountValue = Number(consumerDiscount || 0);
    const normalizedConsumerDiscountType = consumerDiscountType
      ? consumerDiscountType.toString().toUpperCase().trim()
      : undefined;

    let discount = 0;
    let discountType: string | undefined;

    if (currentTradeRole && currentTradeRole !== "BUYER") {
      // VENDOR user
      if (isVendorType || isEveryoneType) {
        // consumerType is VENDOR/VENDORS or EVERYONE - vendor can get vendor discount
        // BUT category match is REQUIRED for vendor discounts
        if (isCategoryMatch) {
          // Same relation - Vendor gets vendor discount if available
          if (vendorDiscountValue > 0 && normalizedVendorDiscountType) {
            discount = vendorDiscountValue;
            discountType = normalizedVendorDiscountType;
          } else {
            // No vendor discount available, no discount
            discount = 0;
          }
        } else {
          // Not same relation - No vendor discount
          // If consumerType is EVERYONE, fallback to consumer discount
          if (isEveryoneType) {
            if (consumerDiscountValue > 0 && normalizedConsumerDiscountType) {
              discount = consumerDiscountValue;
              discountType = normalizedConsumerDiscountType;
            } else {
              discount = 0;
            }
          } else {
            // consumerType is VENDOR/VENDORS but no category match - no discount
            discount = 0;
          }
        }
      } else {
        // consumerType is CONSUMER - vendors get no discount
        discount = 0;
      }
    } else {
      // CONSUMER (BUYER) - Gets consumer discount if consumerType is CONSUMER or EVERYONE
      if (isConsumerType || isEveryoneType) {
        if (consumerDiscountValue > 0 && normalizedConsumerDiscountType) {
          discount = consumerDiscountValue;
          discountType = normalizedConsumerDiscountType;
        }
      } else {
        // consumerType is VENDOR/VENDORS - no discount for buyers
        discount = 0;
      }
    }

    if (discount > 0 && discountType) {
      if (discountType === "PERCENTAGE") {
        return Number((price - (price * discount) / 100).toFixed(2));
      }
      if (discountType === "FLAT" || discountType === "FIXED" || discountType === "AMOUNT") {
        return Number((price - discount).toFixed(2));
      }
    }

    return price;
  }, [
    offerPrice,
    consumerDiscount,
    consumerDiscountType,
    vendorDiscount,
    vendorDiscountType,
    consumerType,
    categoryId,
    categoryLocation,
    categoryConnections,
    currentTradeRole,
    vendorBusinessCategoryIds,
  ]);

  useEffect(() => {
    setQuantity(productQuantity);
  }, [productQuantity]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
      {/* Error Messages */}
      {(invalidProduct || cannotBuy) && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-3">
          <p className="text-sm text-red-600 font-medium" translate="no">
            {invalidProduct ? t("you_cant_buy_this_product") : t("product_not_available_for_your_location")}
          </p>
        </div>
      )}
      
      <div className="p-4">
        <div className="flex items-start space-x-4">
          {/* Product Image */}
          <div className="flex-shrink-0">
            <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-gray-100">
              <Image
                src={productImages?.[0]?.image || PlaceholderImage}
                alt="product-image"
                fill
                className="object-cover"
              />
            </div>
          </div>

          {/* Product Details */}
          <div className="flex-1 min-w-0">
            {/* Product Name */}
            <div className="mb-3">
              <h3 className="text-lg font-semibold text-gray-900 line-clamp-2" dir={langDir}>
                {productName}
              </h3>
            </div>

            {/* Quantity Controls */}
            <div className="mb-4">
              <div className="flex items-center space-x-3">
                <label className="text-sm font-medium text-gray-700" dir={langDir} translate="no">
                  {t("quantity")}:
                </label>
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-gray-100"
                    onClick={() => {
                      setQuantity(quantity - 1);
                      onAdd(quantity - 1, "remove", productPriceId, productVariant);
                    }}
                    disabled={quantity === 0}
                  >
                    <Image
                      src={MinusIcon}
                      alt="minus-icon"
                      width={16}
                      height={16}
                    />
                  </Button>
                  <input
                    type="text"
                    value={quantity}
                    className="w-12 h-8 text-center border-0 bg-transparent focus:outline-none focus:ring-0 text-sm font-medium"
                    readOnly
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-gray-100"
                    onClick={() => {
                      setQuantity(quantity + 1);
                      onAdd(quantity + 1, "add", productPriceId, productQuantity);
                    }}
                  >
                    <Image 
                      src={PlusIcon} 
                      alt="plus-icon" 
                      width={16}
                      height={16}
                    />
                  </Button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 px-2 flex items-center space-x-1"
                onClick={() => onRemove(cartId)}
                dir={langDir}
                translate="no"
              >
                <Trash2 className="w-4 h-4" />
                <span>{t("remove")}</span>
              </Button>
              {haveAccessToken && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 flex items-center space-x-1"
                  onClick={() => onWishlist(productId)}
                  dir={langDir}
                  translate="no"
                >
                  <Heart className="w-4 h-4" />
                  <span>{t("move_to_wishlist")}</span>
                </Button>
              )}
            </div>
          </div>

          {/* Price Section */}
          <div className="flex-shrink-0 text-right">
            <div className="text-sm text-gray-500 mb-1" dir={langDir} translate="no">
              {t("price")}
            </div>
            <div className="text-xl font-bold text-gray-900" dir={langDir}>
              {invalidProduct || cannotBuy ? (
                <span className="line-through text-gray-500">
                  {currency.symbol}{quantity * applicablePrice}
                </span>
              ) : (
                `${currency.symbol}${quantity * applicablePrice}`
              )}
            </div>
            {invalidProduct || cannotBuy ? (
              <div className="text-sm text-red-600 font-medium mt-1" dir={langDir} translate="no">
                Not Available
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
