import { TrendingProduct } from "@/utils/types/common.types";
import Image from "next/image";
import Link from "next/link";
import React, { useMemo, useEffect, useState, useRef } from "react";
import validator from "validator";
import { Checkbox } from "@/components/ui/checkbox";
import { FaStar, FaRegStar, FaHeart, FaRegHeart } from "react-icons/fa";
import { FiEye } from "react-icons/fi";
import { FaCircleCheck } from "react-icons/fa6";
import PlaceholderImage from "@/public/images/product-placeholder.png";
import { Button } from "@/components/ui/button";
import ShoppingIcon from "@/components/icons/ShoppingIcon";
import { useCartStore } from "@/lib/rfqStore";
import { toast } from "@/components/ui/use-toast";
import {
  useDeleteCartItem,
  useUpdateCartByDevice,
  useUpdateCartWithLogin,
  useUpdateCartWithService,
} from "@/apis/queries/cart.queries";
import { getOrCreateDeviceId } from "@/utils/helper";
import { useTranslations, useLocale } from "next-intl"; // Import useLocale
import { useAuth } from "@/context/AuthContext";
import { useDynamicTranslation } from "@/hooks/useDynamicTranslation";
import { useClickOutside } from "use-events";
import { Dialog, DialogContent, DialogTitle, DialogHeader } from "@/components/ui/dialog";
import { IoCloseSharp } from "react-icons/io5";
import { useVendorBusinessCategories } from "@/hooks/useVendorBusinessCategories";
import { checkCategoryConnection } from "@/utils/categoryConnection";
import { useCategory } from "@/apis/queries/category.queries";
import { useCurrentAccount } from "@/apis/queries/auth.queries";
import { useMe } from "@/apis/queries/user.queries";

type ProductCardProps = {
  item: TrendingProduct;
  productVariants?: any[];
  onWishlist: () => void;
  inWishlist?: boolean;
  haveAccessToken: boolean;
  isInteractive?: boolean;
  isSelectable?: boolean;
  selectedIds?: number[];
  onSelectedId?: (args0: boolean | string, args1: number) => void;
  productQuantity?: number;
  productVariant?: any;
  cartId?: number;
  isAddedToCart?: boolean;
  serviceId?: number;
  serviceCartId?: number;
  relatedCart?: any;
  sold?: number;
};

const ProductCard: React.FC<ProductCardProps> = ({
  item,
  productVariants = [],
  onWishlist,
  inWishlist,
  haveAccessToken,
  isInteractive,
  isSelectable,
  selectedIds,
  onSelectedId,
  productQuantity = 0,
  productVariant,
  cartId,
  serviceId,
  serviceCartId,
  relatedCart,
  isAddedToCart,
  sold,
}) => {
  const t = useTranslations();
  const { user, langDir, currency } = useAuth();
  const { translate } = useDynamicTranslation();
  const language = useLocale(); // Get the current locale (e.g., "en" or "ar")
  const currentAccount = useCurrentAccount();
  const vendorBusinessCategoryIds = useVendorBusinessCategories();
  const me = useMe();

  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  const deviceId = getOrCreateDeviceId() || "";

  // Get the current account's trade role (for multi-account system)
  const currentTradeRole = currentAccount?.data?.data?.account?.tradeRole || user?.tradeRole;

  // Check if this product belongs to the current user
  // For subaccounts (MEMBER), check against their adminId (addedBy)
  // For regular accounts, check against their userId
  const isOwnProduct = useMemo(() => {
    if (!me?.data?.data?.id) return false;
    
    const currentUserId = me.data.data.id;
    const currentAdminId = me.data.data.tradeRole === 'MEMBER' 
      ? me.data.data.addedBy 
      : currentUserId;
    
    // Check product's seller/adminId from productPrices
    const productAdminId = item?.productPrices?.[0]?.adminId;
    // Also check vendorId if available (from trending page mapping)
    const productVendorId = (item as any)?.vendorId;
    
    // Product belongs to user if adminId or vendorId matches current user's ID or adminId
    return productAdminId === currentUserId || 
           productAdminId === currentAdminId ||
           productVendorId === currentUserId ||
           productVendorId === currentAdminId;
  }, [me?.data?.data, item?.productPrices, (item as any)?.vendorId]);

  // Fetch product category data to get connections (only if vendor and categoryId exists)
  const productCategoryQuery = useCategory(
    item.categoryId?.toString(),
    !!(currentTradeRole && currentTradeRole !== "BUYER" && item.categoryId)
  );
  
  const categoryConnections = productCategoryQuery?.data?.data?.category_categoryIdDetail || [];

  // Helper function to get the applicable discount for the current user
  const getApplicableDiscount = () => {
    // Normalize consumerType to uppercase and handle both "VENDOR" and "VENDORS"
    const rawConsumerType = item.consumerType || "CONSUMER";
    const consumerType = typeof rawConsumerType === "string" 
      ? rawConsumerType.toUpperCase().trim() 
      : "CONSUMER";
    
    // Check if it's a vendor type (VENDOR or VENDORS)
    const isVendorType = consumerType === "VENDOR" || consumerType === "VENDORS";
    const isConsumerType = consumerType === "CONSUMER";
    const isEveryoneType = consumerType === "EVERYONE";
    
    // Check if vendor business category matches product category
    const isCategoryMatch = checkCategoryConnection(
      vendorBusinessCategoryIds,
      item.categoryId || 0,
      item.categoryLocation,
      categoryConnections
    );

    let discount = 0;
    let discountType: string | undefined;
    
    // Apply discount logic based on your table
    // IMPORTANT: Category match is ALWAYS required for vendor discounts, regardless of consumerType
    if (currentTradeRole && currentTradeRole !== "BUYER") {
      // VENDOR user
      if (isVendorType || isEveryoneType) {
        // consumerType is VENDOR/VENDORS or EVERYONE - vendor can get vendor discount
        // BUT category match is REQUIRED for vendor discounts
        if (isCategoryMatch) {
          // Same relation - Vendor gets vendor discount if available
          if (item.vendorDiscount && item.vendorDiscount > 0) {
            discount = item.vendorDiscount;
            discountType = item.vendorDiscountType;
          } else {
            // No vendor discount available, no discount
            discount = 0;
          }
        } else {
          // Not same relation - No vendor discount
          // If consumerType is EVERYONE, fallback to consumer discount
          if (isEveryoneType) {
            discount = item.consumerDiscount || 0;
            discountType = item.consumerDiscountType;
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
      // NO discount if consumerType is VENDOR or VENDORS
      if (isConsumerType || isEveryoneType) {
        discount = item.consumerDiscount || 0;
        discountType = item.consumerDiscountType;
      } else {
        // consumerType is VENDOR/VENDORS - no discount for buyers
        discount = 0;
      }
    }
    
    return { discount, discountType };
  };

  const calculateDiscountedPrice = () => {
    const price = item.productProductPrice
      ? Number(item.productProductPrice)
      : 0;
    
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
    const totalRating = item.productReview?.reduce(
      (acc: number, item: { rating: number }) => acc + item.rating,
      0,
    );
    const result = totalRating / item.productReview?.length;
    return !isNaN(result) ? Math.floor(result) : 0;
  }, [item.productReview?.length]);

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
    [item.productReview?.length],
  );

  const [productVariantTypes, setProductVariantTypes] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(0);
  const [selectedProductVariant, setSelectedProductVariant] = useState<any>(productVariant);

  const [isConfirmDialogOpen, setIsConfirmDialogOpen] =
    useState<boolean>(false);
  const handleConfirmDialog = () =>
    setIsConfirmDialogOpen(!isConfirmDialogOpen);
  const confirmDialogRef = useRef(null);
  const [isClickedOutsideConfirmDialog] = useClickOutside(
    [confirmDialogRef],
    () => onCancelRemove(),
  );
  const [isBuygroupDisclaimerOpen, setIsBuygroupDisclaimerOpen] = useState(false);
  const [hasSeenBuygroupDisclaimer, setHasSeenBuygroupDisclaimer] = useState(false);

  useEffect(() => {
    setQuantity(productQuantity || 0);
  }, [productQuantity]);

  useEffect(() => {
    if (productVariants.length > 0) {
      // @ts-ignore
      const variantTypes: string[] = [...new Set(productVariants.map((variant: any) => variant.type))];
      setProductVariantTypes(variantTypes);

      if (!productVariant) {
        let selectedVariant: any[] = [];
        variantTypes.forEach((variantType, index) => {
          selectedVariant.push(productVariants.find((variant: any) => variant.type == variantType));
        });
        setSelectedProductVariant(selectedVariant);
      } else {
        setSelectedProductVariant(
          !Array.isArray(productVariant) ? [productVariant] : productVariant
        );
      }
    }
  }, [productVariants.length, productVariant]);

  const updateCartWithLogin = useUpdateCartWithLogin();
  const updateCartByDevice = useUpdateCartByDevice();
  const updateCartWithService = useUpdateCartWithService();
  const deleteCartItem = useDeleteCartItem();

  const handleAddToCart = async (
    newQuantity: number,
    actionType: "add" | "remove",
    variant?: any,
    skipDisclaimer: boolean = false,
  ) => {
    // For buygroup products, show disclaimer first when adding (unless skipping)
    if (isBuygroup && actionType === "add" && !skipDisclaimer && !hasSeenBuygroupDisclaimer) {
      setIsBuygroupDisclaimerOpen(true);
      return;
    }

    const minQuantity = item.productPrices?.length
      ? item.productPrices[0]?.minQuantityPerCustomer
      : null;
    const maxQuantity = item.productPrices?.length
      ? item.productPrices[0]?.maxQuantityPerCustomer
      : null;

    if (actionType == "add" && newQuantity == -1) {
      newQuantity =
        minQuantity && quantity < minQuantity ? minQuantity : quantity + 1;
    }

    if (actionType == "add" && minQuantity && minQuantity > newQuantity) {
      toast({
        description: t("min_quantity_must_be_n", { n: minQuantity }),
        variant: "danger",
      });
      return;
    }

    if (maxQuantity && maxQuantity < newQuantity) {
      toast({
        description: t("max_quantity_must_be_n", { n: maxQuantity }),
        variant: "danger",
      });
      return;
    }

    if (actionType == "remove" && minQuantity && minQuantity > newQuantity) {
      setIsConfirmDialogOpen(true);
      return;
    }

    if (haveAccessToken) {
      if (!item?.productProductPriceId) {
        toast({
          title: t("something_went_wrong"),
          description: t("product_price_id_not_found"),
          variant: "danger",
        });
        return;
      }

      let linkService = !!(!cartId && serviceId && serviceCartId);

      if (linkService) {
        const response = await updateCartWithService.mutateAsync({
          productId: item?.id,
          productPriceId: item?.productProductPriceId,
          quantity: newQuantity,
          productVariant: variant || selectedProductVariant,
          serviceId: relatedCart?.serviceId || serviceId,
          cartId: relatedCart?.id || serviceCartId
        });
  
        if (response.success) {
          setQuantity(
            actionType === "add" && newQuantity === 0 ? 1 : newQuantity,
          );
          toast({
            title:
              actionType == "add"
                ? t("item_added_to_cart")
                : t("item_removed_from_cart"),
            description: t("check_your_cart_for_more_details"),
            variant: "success",
          });
          return response.success;
        } else {
          toast({
            title: t("something_went_wrong"),
            description: response.message,
            variant: "danger",
          });
        }

        return;
      }

      const response = await updateCartWithLogin.mutateAsync({
        productPriceId: item?.productProductPriceId,
        quantity: newQuantity,
        productVariant: variant || selectedProductVariant,
      });

      if (response.status) {
        setQuantity(
          actionType === "add" && newQuantity === 0 ? 1 : newQuantity,
        );
        toast({
          title:
            actionType == "add"
              ? t("item_added_to_cart")
              : t("item_removed_from_cart"),
          description: t("check_your_cart_for_more_details"),
          variant: "success",
        });
        return response.status;
      } else {
        toast({
          title: t("something_went_wrong"),
          description: response.message,
          variant: "danger",
        });
      }

    } else {
      if (!item?.productProductPriceId) {
        toast({
          title: t("something_went_wrong"),
          description: t("product_price_id_not_found"),
          variant: "danger",
        });
        return;
      }
      const response = await updateCartByDevice.mutateAsync({
        productPriceId: item?.productProductPriceId,
        quantity: newQuantity,
        deviceId,
        productVariant: variant || selectedProductVariant,
      });
      if (response.status) {
        setQuantity(
          actionType === "add" && newQuantity === 0 ? 1 : newQuantity,
        );
        toast({
          title:
            actionType == "add"
              ? t("item_added_to_cart")
              : t("item_removed_from_cart"),
          description: t("check_your_cart_for_more_details"),
          variant: "success",
        });
        return response.status;
      } else {
        toast({
          title: t("something_went_wrong"),
          description: response.message,
          variant: "danger",
        });
      }
    }
  };

  const handleQuantity = (quantity: number, action: "add" | "remove") => {
    const minQuantity = item.productPrices?.length
      ? item.productPrices[0]?.minQuantityPerCustomer
      : null;
    const maxQuantity = item.productPrices?.length
      ? item.productPrices[0]?.maxQuantityPerCustomer
      : null;

    if (maxQuantity && maxQuantity < quantity) {
      toast({
        description: t("max_quantity_must_be_n", { n: maxQuantity }),
        variant: "danger",
      });
      setQuantity(productQuantity || maxQuantity);
      return;
    }

    setQuantity(quantity);
    // If item is already in cart, update immediately
    if (cartId) {
      handleAddToCart(quantity, action);
    }
    // If item is NOT in cart, just update the quantity state
    // Don't show minimum quantity error here - let it show when they click "Add to Cart"
  };

  // Handler to proceed with booking after disclaimer
  const handleProceedWithBooking = () => {
    setIsBuygroupDisclaimerOpen(false);
    setHasSeenBuygroupDisclaimer(true);
    // Call handleAddToCart again, this time skipping the disclaimer check
    handleAddToCart(quantity, "add", undefined, true);
  };

  const handleQuantityChange = () => {
    if (quantity == 0 && productQuantity != 0) {
      toast({
        description: t("quantity_can_not_be_0"),
        variant: "danger",
      });
      handleQuantity(quantity, "remove");
      return;
    }

    // Only validate minimum quantity if item is already in cart
    // Otherwise, let the validation happen when they click "Add to Cart"
    const minQuantity = item.productPrices?.length
      ? item.productPrices[0]?.minQuantityPerCustomer
      : null;
    if (cartId && minQuantity && minQuantity > quantity) {
      toast({
        description: t("min_quantity_must_be_n", { n: minQuantity }),
        variant: "danger",
      });
      handleQuantity(quantity, quantity > productQuantity ? "add" : "remove");
      return;
    }

    const maxQuantity = item.productPrices?.length
      ? item.productPrices[0]?.maxQuantityPerCustomer
      : null;
    if (maxQuantity && maxQuantity < quantity) {
      toast({
        description: t("max_quantity_must_be_n", { n: maxQuantity }),
        variant: "danger",
      });
      setQuantity(productQuantity || maxQuantity);
      return;
    }

    const action = quantity > productQuantity ? "add" : "remove";
    if (quantity != productQuantity) handleQuantity(quantity, action);
  };

  const handleRemoveItemFromCart = async (cartId: number) => {
    const response = await deleteCartItem.mutateAsync({ cartId });
    if (response.status) {
      toast({
        title: t("item_removed_from_cart"),
        description: t("check_your_cart_for_more_details"),
        variant: "success",
      });
    } else {
      toast({
        title: t("item_not_removed_from_cart"),
        description: t("check_your_cart_for_more_details"),
        variant: "danger",
      });
    }
  };

  const onConfirmRemove = () => {
    if (cartId) handleRemoveItemFromCart(cartId);
    setIsConfirmDialogOpen(false);
  };

  const onCancelRemove = () => {
    setQuantity(productQuantity);
    setIsConfirmDialogOpen(false);
  };

  const getLocalTimestamp = (dateStr: any, timeStr: any) => {
    const date = new Date(dateStr);
    const [hours, minutes] = (timeStr || "").split(":").map(Number);
    date.setHours(hours, minutes || 0, 0, 0);
    return date.getTime();
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const isRtl = langDir === "rtl";
    const numberFormatter = new Intl.NumberFormat(language, {
      minimumIntegerDigits: 2,
      useGrouping: false,
    });

    const formattedDays = days.toString();
    const formattedHours = numberFormatter.format(hours);
    const formattedMinutes = numberFormatter.format(minutes);
    const formattedSeconds = numberFormatter.format(seconds);

    const daysLabel = t("days");

    const timeString = isRtl
      ? `${formattedSeconds}:${formattedMinutes}:${formattedHours} ؛${daysLabel} ${formattedDays}`
      : `${formattedDays} ${daysLabel}; ${formattedHours}:${formattedMinutes}:${formattedSeconds}`;

    return timeString;
  };

  useEffect(() => {
    if (
      !item?.productPrices?.length ||
      item?.productPrices?.[0]?.sellType !== "BUYGROUP"
    ) {
      setTimeLeft(null);
      return;
    }

    const product = item.productPrices[0];
    const startTimestamp = getLocalTimestamp(
      product.dateOpen,
      product.startTime,
    );
    const endTimestamp = getLocalTimestamp(product.dateClose, product.endTime);

    const updateCountdown = () => {
      const now = Date.now();

      if (now < startTimestamp) {
        setTimeLeft(t("not_started"));
        return;
      }

      const ms = endTimestamp - now;
      if (ms <= 0) {
        setTimeLeft(t("expired"));
        return;
      }

      setTimeLeft(formatTime(ms));
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [item?.productPrices, language, t]);

  // Helper: derive flags and formatted sale start for BUYGROUP
  const isBuygroup = !!(item?.productPrices?.length && item?.productPrices?.[0]?.sellType === "BUYGROUP");
  const saleNotStarted = isBuygroup && timeLeft === t("not_started");
  const saleExpired = isBuygroup && timeLeft === t("expired");
  const remainingStock = useMemo(() => {
    const stock = item?.productPrices?.[0]?.stock;
    if (stock === undefined || stock === null) return null;
    const soldCount = typeof sold === "number" ? sold : 0;
    return Math.max(0, Number(stock) - Number(soldCount));
  }, [item?.productPrices, sold]);
  const outOfStockActive = isBuygroup && !saleExpired && remainingStock !== null && remainingStock <= 0;

  const getSaleStartLabel = () => {
    try {
      if (!isBuygroup || !item.productPrices?.length) return "";
      const p = item.productPrices[0];
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

  return (
    <div className="group relative bg-white rounded-lg sm:rounded-xl shadow-sm sm:shadow-lg border border-gray-100 hover:shadow-xl hover:border-gray-200 transition-all duration-300 overflow-hidden h-full flex flex-row sm:flex-col items-stretch">
      {/* Selection Checkbox */}
      {isSelectable ? (
        <div className="absolute left-1.5 sm:left-3 top-1.5 sm:top-3 z-20">
          <Checkbox
            className="border-2 border-gray-300 data-[state=checked]:bg-primary! data-[state=checked]:border-primary! scale-75 sm:scale-100"
            checked={selectedIds?.includes(item.id)}
            onCheckedChange={(checked) => onSelectedId?.(checked, item.id)}
          />
        </div>
      ) : null}

      {/* Time / Coming Soon Badge */}
      {timeLeft ? (
        <div className="absolute right-1.5 sm:right-3 top-1.5 sm:top-3 z-20">
          <div className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${saleNotStarted ? "bg-warning" : timeLeft === t("expired") ? "bg-gray-500" : "bg-destructive"} text-white`}>
            <span dir={langDir} translate="no">{timeLeft}</span>
          </div>
        </div>
      ) : null}
      {outOfStockActive ? (
        <div className="absolute left-1.5 sm:left-3 top-1.5 sm:top-3 z-20">
          <div className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold bg-gray-800 text-white">
            {t("out_of_stock")}
          </div>
        </div>
      ) : null}

      {/* Product Image Container */}
      <Link href={`/trending/${item.id}`} className="block sm:w-full w-32 flex-shrink-0">
        {/* Discount Badge - Only show if user is eligible for discount */}
        {(() => {
          const { discount, discountType } = getApplicableDiscount();
          return item?.askForPrice !== "true" && discount > 0 && discountType ? (
            <div className="absolute right-auto left-1 sm:right-3 sm:left-auto top-20 sm:top-12 z-20 bg-linear-to-r from-warning to-red-500 text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold shadow-lg">
              {discountType === "PERCENTAGE" 
                ? `${discount}%` 
                : `${currency.symbol}${discount}`
              }
            </div>
          ) : null;
        })()}

        <div className="relative w-full h-full sm:h-48 lg:h-56 bg-gray-50 overflow-hidden min-h-[140px]">
          {item?.productImage && (validator.isURL(item.productImage) || item.productImage.startsWith('data:image/')) ? (
            // Check if the image is from an allowed domain (S3 bucket) or is a data URL
            item.productImage.includes('puremoon.s3.amazonaws.com') || item.productImage.startsWith('data:image/') ? (
              <Image
                src={item.productImage}
                alt="product-image"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-contain group-hover:scale-105 transition-transform duration-300"
                blurDataURL="/images/product-placeholder.png"
                placeholder="blur"
              />
            ) : (
              // Use regular img tag for external URLs not in allowed domains
              <img
                src={item.productImage}
                alt="product-image"
                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  e.currentTarget.src = PlaceholderImage.src;
                }}
              />
            )
          ) : (
            <Image
              src={PlaceholderImage}
              alt="product-image"
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-contain group-hover:scale-105 transition-transform duration-300"
              blurDataURL="/images/product-placeholder.png"
              placeholder="blur"
            />
          )}
          {/* Eye-catching ad ribbon when sale not started */}
          {saleNotStarted ? (
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3">
              <div className="bg-white/90 text-gray-900 text-[11px] sm:text-xs font-semibold inline-flex items-center gap-2 px-2.5 py-1.5 rounded-full shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-warning">
                  <path fillRule="evenodd" d="M12 2.25a.75.75 0 01.75.75v.61A8.25 8.25 0 1120.39 11.25h.61a.75.75 0 010 1.5h-.61A8.25 8.25 0 1112.75 3.61v-.61a.75.75 0 01.75-.75zM12 7.5a.75.75 0 01.75.75v3.69l2.28 2.28a.75.75 0 11-1.06 1.06l-2.5-2.5a.75.75 0 01-.22-.53V8.25A.75.75 0 0112 7.5z" clipRule="evenodd" />
                </svg>
                <span>{t("sale_starts_on")}: {getSaleStartLabel()}</span>
              </div>
            </div>
          ) : null}
        </div>
      </Link>

      {/* Action Buttons */}
      {isInteractive ? (
        <div className="absolute top-1.5 sm:top-3 left-1/2 transform -translate-x-1/2 opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 flex gap-1 sm:gap-2">
          {!isOwnProduct && item?.askForPrice !== "true" && !saleNotStarted && !saleExpired && !outOfStockActive ? (
            <Button
              variant="secondary"
              size="sm"
              className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-white/90 backdrop-blur-xs shadow-lg hover:bg-white hover:scale-110 transition-all duration-200 [&_svg]:scale-75 sm:[&_svg]:scale-100"
              onClick={() => handleAddToCart(-1, "add")}
            >
              <ShoppingIcon />
            </Button>
          ) : null}
          <Link
            href={`/trending/${item.id}`}
            className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-white/90 backdrop-blur-xs shadow-lg hover:bg-white hover:scale-110 transition-all duration-200 flex items-center justify-center"
          >
            <FiEye size={14} className="text-gray-700 sm:w-4 sm:h-4" />
          </Link>
          {haveAccessToken ? (
            <Button
              variant="secondary"
              size="sm"
              className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-white/90 backdrop-blur-xs shadow-lg hover:bg-white hover:scale-110 transition-all duration-200"
              onClick={onWishlist}
            >
              {inWishlist ? (
                <FaHeart color="#ef4444" size={12} className="sm:w-3.5 sm:h-3.5" />
              ) : (
                <FaRegHeart size={12} className="text-gray-700 sm:w-3.5 sm:h-3.5" />
              )}
            </Button>
          ) : null}
        </div>
      ) : null}

      {/* Product Information */}
      <div className="p-2 sm:p-4 space-y-1 sm:space-y-3 flex-1 flex flex-col">
        <Link href={`/trending/${item.id}`} className="block group">
          <h3 className="font-semibold text-gray-900 text-sm sm:text-base leading-tight line-clamp-2 group-hover:text-primary transition-colors duration-200 mb-1 sm:mb-2" dir={langDir}>
            {translate(item.productName)}
          </h3>
          
          {/* Rating */}
          <div className="flex items-center gap-0.5 sm:gap-1 mb-1 sm:mb-2">
            <div className="flex scale-75 sm:scale-100 origin-left">
              {calculateRatings(calculateAvgRating)}
            </div>
            <span className="text-[10px] sm:text-sm text-gray-500 ml-0.5 sm:ml-1">
              ({item.productReview?.length || 0})
            </span>
          </div>

          <p className="text-gray-600 text-xs sm:text-sm line-clamp-2 mb-1 sm:mb-2" title={item.shortDescription}>
            {item.shortDescription}
          </p>
        </Link>
        
        {/* Price Section */}
        <div className="space-y-1 sm:space-y-2 mb-1 sm:mb-3">
          {item?.askForPrice === "true" ? (
            <Link href={`/seller-rfq-request?product_id=${item?.id}`}>
              <button
                type="button"
                className="w-full bg-linear-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-warning/90 text-white font-semibold py-1.5 sm:py-2 px-2 sm:px-4 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-md text-[10px] sm:text-sm"
                dir={langDir}
                translate="no"
              >
                {t("ask_vendor_for_price")}
              </button>
            </Link>
          ) : (
            <div className="space-y-0.5 sm:space-y-1" suppressHydrationWarning>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-0.5 sm:gap-2">
                <span className="text-base sm:text-lg font-bold text-primary" dir={langDir}>
                  {currency.symbol}{calculateDiscountedPrice()}
                </span>
                {item.productProductPrice && Number(item.productProductPrice) > calculateDiscountedPrice() && (
                  <span className="text-xs sm:text-sm text-gray-500 line-through">
                    {currency.symbol}{item.productProductPrice}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
        {/* Product Variants */}
        {productVariantTypes.length > 0 ? (
          <div className="space-y-1 sm:space-y-2 mb-1 sm:mb-3">
            {productVariantTypes.map((variantType: string, index: number) => {
              return (
                <div key={index} dir={langDir}>
                  <label htmlFor={variantType} className="block text-xs sm:text-sm font-medium text-gray-700 mb-0.5 sm:mb-1">
                    {variantType}
                  </label>
                  <select
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors duration-200"
                    value={selectedProductVariant?.find((variant: any) => variant.type == variantType)?.value}
                    onChange={(e) => {
                      let selectedVariants = [];
                      let value = e.target.value;
                      const selected = productVariants.find(
                        (variant: any) => variant.type == variantType && variant.value == value
                      );

                      if (selectedProductVariant.find((variant: any) => variant.type == selected.type)) {
                        selectedVariants = selectedProductVariant.map((variant: any) => {
                          if (variant.type == selected.type) {
                            return selected;
                          }
                          return variant;
                        });

                      } else {
                        selectedVariants = [
                          ...selectedProductVariant,
                          selected
                        ];
                      }

                      setSelectedProductVariant(selectedVariants);

                      if (cartId) handleAddToCart(quantity, "add", selectedVariants);
                    }}
                  >
                    {productVariants.filter((variant: any) => variant.type == variantType)
                      .map((variant: any, i: number) => {
                      return <option key={`${index}${i}`} value={variant.value} dir={langDir}>{variant.value}</option>;
                    })}
                  </select>
                </div>
              );
            })}
          </div>
        ) : null}
        {/* Quantity Section */}
        {!isOwnProduct && !saleNotStarted && (
          <div className="space-y-1 sm:space-y-2 mb-1 sm:mb-3">
            <label className="block text-xs sm:text-sm font-medium text-gray-700" dir={langDir} translate="no">
              {t("quantity")}
            </label>
            <div className="flex items-center justify-center gap-1 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-6 w-6 sm:h-8 sm:w-8 rounded-full border-gray-300 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50"
                onClick={() => handleQuantity(quantity - 1, "remove")}
                disabled={
                  quantity === 0 ||
                  saleExpired ||
                  outOfStockActive ||
                  updateCartWithLogin?.isPending ||
                  updateCartByDevice?.isPending
                }
              >
                <Image
                  src="/images/upDownBtn-minus.svg"
                  alt="minus-icon"
                  width={16}
                  height={16}
                />
              </Button>
              <input
                type="text"
                value={quantity}
                className="h-6 w-12 sm:h-8 sm:w-16 text-center text-xs sm:text-sm font-medium border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                onChange={(e) => {
                  const value = Number(e.target.value);
                  setQuantity(isNaN(value) ? productQuantity : value);
                }}
                onBlur={handleQuantityChange}
                disabled={saleExpired || outOfStockActive}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-6 w-6 sm:h-8 sm:w-8 rounded-full border-gray-300 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50"
                onClick={() => handleQuantity(quantity + 1, "add")}
                disabled={
                  saleExpired ||
                  outOfStockActive ||
                  updateCartWithLogin?.isPending ||
                  updateCartByDevice?.isPending
                }
              >
                <Image
                  src="/images/upDownBtn-plus.svg"
                  alt="plus-icon"
                  width={18}
                  height={18}
                />
              </Button>
            </div>
          </div>
        )}

        {/* Cart Button */}
        <div className="mt-auto pt-1 sm:pt-3">
          {isAddedToCart ? (
            <button
              type="button"
              className="w-full flex items-center justify-center gap-1 sm:gap-2 py-1.5 sm:py-2 px-2 sm:px-4 rounded-md sm:rounded-lg border border-success sm:border-2 sm:border-success/20 bg-success/5 text-success font-semibold text-xs sm:text-sm transition-all duration-200"
              disabled={false}
              dir={langDir}
              translate="no"
            >
              <FaCircleCheck color="#10b981" size={12} className="sm:w-4 sm:h-4" />
              <span>{t("added_to_cart")}</span>
            </button>
          ) : !isOwnProduct ? (
            <button
              type="button"
              className={`w-full text-white font-semibold py-1.5 sm:py-2 px-2 sm:px-4 rounded-md sm:rounded-lg transition-all duration-200 shadow-sm sm:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-xs sm:text-sm ${saleNotStarted ? "bg-warning" : saleExpired || outOfStockActive ? "bg-gray-500" : "bg-primary sm:bg-linear-to-r sm:from-primary sm:to-primary/80 hover:bg-primary/90 sm:hover:from-blue-700 sm:hover:to-blue-800 sm:transform sm:hover:scale-105"}`}
              onClick={() => !saleNotStarted && !saleExpired && !outOfStockActive && handleAddToCart(quantity, "add")}
              disabled={quantity == 0 || saleNotStarted || saleExpired || outOfStockActive}
              dir={langDir}
              translate="no"
            >
              {saleNotStarted ? t("coming_soon") : saleExpired ? t("expired") : outOfStockActive ? t("out_of_stock") : isBuygroup ? "Book" : t("add_to_cart")}
            </button>
          ) : null}
        </div>

        {/* Sold Progress Bar */}
        {sold !== undefined && sold !== null && item.productPrices?.[0]?.stock
          ? (() => {
              const percentage = Number(
                (100 - (sold / (sold + item.productPrices[0].stock)) * 100).toFixed(),
              );
              return (
                <div className="mt-1.5 sm:mt-3 space-y-1 sm:space-y-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-linear-to-r from-yellow-400 to-orange-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <span translate="no">
                      {t("sold")}: {sold}
                    </span>
                    <span className="font-semibold">
                      {percentage}% {t("left")}
                    </span>
                  </div>
                </div>
              );
            })()
          : null}
      </div>
      {/* Confirmation Dialog */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={handleConfirmDialog}>
        <DialogContent
          className="max-w-md p-6 rounded-xl"
          ref={confirmDialogRef}
        >
          <div className="flex items-center justify-between mb-4" dir={langDir}>
            <DialogTitle className="text-lg font-semibold text-gray-900">
              {t("confirm_removal")}
            </DialogTitle>
            <Button
              onClick={onCancelRemove}
              variant="ghost"
              size="sm"
              className="h-8 w-8 rounded-full hover:bg-gray-100"
            >
              <IoCloseSharp size={18} />
            </Button>
          </div>
          <div className="text-center space-y-4">
            <p className="text-gray-600" translate="no">
              {t("do_you_want_to_remove_this_item_from_cart")}
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                type="button"
                variant="outline"
                onClick={onCancelRemove}
                translate="no"
                className="px-6"
              >
                {t("cancel")}
              </Button>
              <Button
                type="button"
                className="bg-destructive hover:bg-destructive px-6"
                onClick={onConfirmRemove}
                translate="no"
              >
                {t("remove")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Buygroup Disclaimer Dialog */}
      <Dialog open={isBuygroupDisclaimerOpen} onOpenChange={setIsBuygroupDisclaimerOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900 mb-4">
              How Buygroups Work
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-gray-700">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">What is a Buygroup?</h3>
              <p className="text-sm leading-relaxed">
                A buygroup is a collective purchasing system where multiple customers come together to purchase products at better prices. When you book a product in a buygroup, you're reserving your spot for that item.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">How It Works:</h3>
              <ul className="list-disc list-inside space-y-2 text-sm leading-relaxed">
                <li>Select the quantity you want to book</li>
                <li>Click "Book" to reserve your items</li>
                <li>Wait for the buygroup to reach the required number of participants</li>
                <li>Once the buygroup is complete, you'll be notified and can proceed with payment</li>
                <li>Your booking is confirmed only after the buygroup reaches its target</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Important Notes:</h3>
              <ul className="list-disc list-inside space-y-2 text-sm leading-relaxed">
                <li>Your booking is a reservation, not an immediate purchase</li>
                <li>You can cancel your booking before the buygroup closes</li>
                <li>If the buygroup doesn't reach its target, your booking will be automatically cancelled</li>
                <li>You'll receive notifications about the buygroup status</li>
              </ul>
            </div>
          </div>
          
          <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={() => setIsBuygroupDisclaimerOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              {t("cancel") || "Cancel"}
            </button>
            <button
              onClick={handleProceedWithBooking}
              className="px-4 py-2 text-sm font-medium text-white bg-primary rounded hover:bg-primary/90 transition-colors"
            >
              I Understand, Proceed
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductCard;
