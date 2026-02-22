import React, { useEffect, useMemo, useState, useCallback } from "react";
import SameBrandProductCard from "./SameBrandProductCard";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { stripHTML } from "@/utils/helper";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import Link from "next/link";
import validator from "validator";
import PlaceholderImage from "@/public/images/product-placeholder.png";
import { FaStar, FaRegStar, FaHeart, FaRegHeart } from "react-icons/fa";
import { FiEye } from "react-icons/fi";
import ShoppingIcon from "@/components/icons/ShoppingIcon";
import { useSameBrandProducts } from "@/apis/queries/product.queries";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { useMe } from "@/apis/queries/user.queries";
import {
  useAddToWishList,
  useDeleteFromWishList,
} from "@/apis/queries/wishlist.queries";
import {
  useUpdateCartByDevice,
  useUpdateCartWithLogin,
} from "@/apis/queries/cart.queries";
import { getOrCreateDeviceId } from "@/utils/helper";
import { getCookie } from "cookies-next";
import { PUREMOON_TOKEN_KEY } from "@/utils/constants";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";

type SameBrandSectionProps = {
  productDetails: any;
  productId?: string;
};

const SameBrandSection: React.FC<SameBrandSectionProps> = ({
  productDetails,
  productId,
}) => {
  const t = useTranslations();
  const { langDir } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const deviceId = getOrCreateDeviceId() || "";
  const [haveAccessToken, setHaveAccessToken] = useState(false);
  const accessToken = getCookie(PUREMOON_TOKEN_KEY);

  const me = useMe();
  const updateCartWithLogin = useUpdateCartWithLogin();
  const updateCartByDevice = useUpdateCartByDevice();
  const addToWishlist = useAddToWishList();
  const deleteFromWishlist = useDeleteFromWishList();
  const sameBrandProductsQuery = useSameBrandProducts(
    {
      page: 1,
      limit: 10,
      brandIds: productDetails?.brandId,
      userId: me.data?.data?.id,
      productId,
    },
    !!productDetails?.brandId && !!productId,
  );

  // Helper function to get local timestamp from date and time strings
  const getLocalTimestamp = useCallback((dateStr?: string, timeStr?: string) => {
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
  }, []);

  // Helper function to check if buygroup sale is expired
  const isBuygroupSaleExpired = useCallback((product: any) => {
    const pp = product?.product_productPrice?.[0];
    if (!pp || pp?.sellType !== "BUYGROUP") return false;
    
    try {
      const endTime = getLocalTimestamp(pp?.dateClose, pp?.endTime);
      const now = Date.now();
      return endTime > 0 && now > endTime;
    } catch {
      return false;
    }
  }, [getLocalTimestamp]);

  const memoizedSameBrandProductList = useMemo(() => {
    return (
      sameBrandProductsQuery?.data?.data
        ?.filter((item: any) => {
          // Filter out expired buygroup products
          return !isBuygroupSaleExpired(item);
        })
        ?.map((item: any) => ({
          ...item,
          productImages: item?.product_productPrice?.[0]
            ?.productPrice_productSellerImage?.length
            ? item?.product_productPrice?.[0]?.productPrice_productSellerImage
            : item?.productImages,
          shortDescription: item?.product_productShortDescription?.length
            ? item?.product_productShortDescription?.[0]?.shortDescription
            : "-",
          productWishlist: item?.product_wishlist || [],
          inWishlist: item?.product_wishlist?.find(
            (ele: any) => ele?.userId === me.data?.data?.id,
          ),
          productProductPriceId: item?.product_productPrice?.[0]?.id,
          productProductPrice: item?.product_productPrice?.[0]?.offerPrice,
          consumerDiscount: item?.product_productPrice?.[0]?.consumerDiscount,
          consumerDiscountType: item?.product_productPrice?.[0]?.consumerDiscountType,
          vendorDiscount: item?.product_productPrice?.[0]?.vendorDiscount,
          vendorDiscountType: item?.product_productPrice?.[0]?.vendorDiscountType,
          askForPrice: item?.product_productPrice?.[0]?.askForPrice,
        })) || []
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    sameBrandProductsQuery?.data?.data,
    me.data?.data?.id,
    sameBrandProductsQuery?.isFetched,
    productDetails?.brandId,
    isBuygroupSaleExpired,
  ]);

  const handleAddToCart = async (quantity: number, productPriceId?: number) => {
    if (haveAccessToken) {
      if (!productPriceId) {
        toast({
          title: t("something_went_wrong"),
          description: t("product_price_id_not_found"),
          variant: "danger",
        });
        return;
      }
      const response = await updateCartWithLogin.mutateAsync({
        productPriceId,
        quantity,
      });

      if (response.status) {
        toast({
          title: t("item_added_to_cart"),
          description: t("check_your_cart_for_more_details"),
          variant: "success",
        });
      }
    } else {
      if (!productPriceId) {
        toast({
          title: t("something_went_wrong"),
          description: t("product_price_id_not_found"),
          variant: "danger",
        });
        return;
      }
      const response = await updateCartByDevice.mutateAsync({
        productPriceId,
        quantity,
        deviceId,
      });
      if (response.status) {
        toast({
          title: t("item_added_to_cart"),
          description: t("check_your_cart_for_more_details"),
          variant: "success",
        });
        return response.status;
      }
    }
  };

  const handleDeleteFromWishlist = async (productId: number) => {
    const response = await deleteFromWishlist.mutateAsync({
      productId,
    });
    if (response.status) {
      toast({
        title: t("item_removed_from_wishlist"),
        description: t("check_your_wishlist_for_more_details"),
        variant: "success",
      });
      queryClient.invalidateQueries({
        queryKey: [
          "product-by-id",
          { productId: String(productId), userId: me.data?.data?.id },
        ],
      });
    } else {
      toast({
        title: t("item_not_removed_from_wishlist"),
        description: t("check_your_wishlist_for_more_details"),
        variant: "danger",
      });
    }
  };

  const handleAddToWishlist = async (
    productId: number,
    wishlistArr?: any[],
  ) => {
    const wishlistObject = wishlistArr?.find(
      (item) => item.userId === me.data?.data?.id,
    );
    // return;
    if (wishlistObject) {
      handleDeleteFromWishlist(wishlistObject?.productId);
      return;
    }

    const response = await addToWishlist.mutateAsync({
      productId,
    });
    if (response.status) {
      toast({
        title: t("item_added_to_wishlist"),
        description: t("check_your_wishlist_for_more_details"),
        variant: "success",
      });
      queryClient.invalidateQueries({
        queryKey: [
          "product-by-id",
          { productId: String(productId), userId: me.data?.data?.id },
        ],
      });
    } else {
      toast({
        title: response.message || t("item_not_added_to_wishlist"),
        description: t("check_your_wishlist_for_more_details"),
        variant: "danger",
      });
    }
  };

  useEffect(() => {
    if (accessToken) {
      setHaveAccessToken(true);
    } else {
      setHaveAccessToken(false);
    }
  }, [accessToken]);

  const calculateAvgRating = (productReview: any[]) => {
    if (!productReview?.length) return 0;
    const totalRating = productReview.reduce((acc: number, item: { rating: number }) => {
      return acc + item.rating;
    }, 0);
    const result = totalRating / productReview.length;
    return !isNaN(result) ? Math.floor(result) : 0;
  };

  const calculateDiscountedPrice = (item: any) => {
    const price = item?.productProductPrice ? Number(item.productProductPrice) : 0;
    let discount = item?.consumerDiscount || 0;
    let discountType = item?.consumerDiscountType;
    
    if (discountType === 'PERCENTAGE') {
      return Number((price - (price * discount) / 100).toFixed(2));
    } else if (discountType === 'FLAT') {
      return Number((price - discount).toFixed(2));
    }
    return price;
  };

  const [currentIndex, setCurrentIndex] = useState(0);

  const nextProduct = () => {
    if (memoizedSameBrandProductList?.length) {
      setCurrentIndex((prev) => (prev + 1) % memoizedSameBrandProductList.length);
    }
  };

  const prevProduct = () => {
    if (memoizedSameBrandProductList?.length) {
      setCurrentIndex((prev) => 
        prev === 0 ? memoizedSameBrandProductList.length - 1 : prev - 1
      );
    }
  };

  const currentProduct = memoizedSameBrandProductList?.[currentIndex];

  return (
    <div className="space-y-4">
      {/* Clean Section Header */}
      <div className="border-b border-border pb-3">
        <h3 className="text-lg font-semibold text-foreground" dir={langDir} translate="no">
          {t("same_brand")}
        </h3>
        </div>

      {/* Single Product Display */}
      <div className="relative">
          {!sameBrandProductsQuery?.isFetched ? (
          <div className="space-y-4">
            <Skeleton className="h-48 w-full rounded-lg" />
            <div className="flex justify-center gap-4">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </div>
        ) : memoizedSameBrandProductList?.length ? (
          <div className="space-y-4">
            {/* Single Product Card */}
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <div className="flex">
                {/* Product Image */}
                <div className="relative h-40 w-40 flex-shrink-0 overflow-hidden">
                  <Image
                    src={
                      currentProduct?.productImages?.[0]?.image &&
                      validator.isURL(currentProduct.productImages[0].image)
                        ? currentProduct.productImages[0].image
                        : PlaceholderImage
                    }
                    alt={currentProduct?.productName}
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Product Info */}
                <div className="flex-1 p-4">
                  {/* Product Name & Brand */}
                  <div className="mb-3">
                    <h4 className="text-lg font-bold text-foreground truncate">
                      {currentProduct?.productName}
                    </h4>
                    <p className="text-sm text-muted-foreground truncate">
                      {currentProduct?.brandName || "Brand"}
                    </p>
                  </div>
                  
                  {/* Rating */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <FaStar
                          key={i}
                          size={14}
                          color={i < calculateAvgRating(currentProduct?.productReview) ? "#FFC107" : "#E5E7EB"}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      ({currentProduct?.productReview?.length || 0})
                    </span>
                  </div>

                  {/* Price */}
                  <div className="mb-4">
                    {currentProduct?.askForPrice === "true" ? (
                      <span className="text-sm text-primary font-semibold">
                        {t("ask_for_price")}
                      </span>
                    ) : (
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-bold text-foreground">
                          ₹{calculateDiscountedPrice(currentProduct)}
                        </span>
                        {currentProduct?.productProductPrice && currentProduct?.productProductPrice !== calculateDiscountedPrice(currentProduct).toString() && (
                          <span className="text-sm text-muted-foreground line-through">
                            ₹{currentProduct?.productProductPrice}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/trending/${currentProduct?.id}`}
                      className="flex items-center gap-1.5 rounded-lg bg-muted px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
                    >
                      <FiEye size={14} />
                      {t("view")}
                    </Link>
                    {currentProduct?.askForPrice !== "true" && (
                      <button
                        onClick={() => handleAddToCart(1, currentProduct.productProductPriceId)}
                        className="flex items-center gap-1.5 rounded-lg bg-warning px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-warning"
                      >
                        <ShoppingIcon />
                        {t("add_to_cart")}
                      </button>
                    )}
                    {haveAccessToken && (
                      <button
                        onClick={() => handleAddToWishlist(currentProduct.id, currentProduct?.productWishlist)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card transition-colors hover:bg-muted"
                      >
                        {currentProduct?.inWishlist ? (
                          <FaHeart color="red" size={14} />
                        ) : (
                          <FaRegHeart size={14} />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Arrows */}
            {memoizedSameBrandProductList.length > 1 && (
              <div className="flex items-center justify-between px-2">
                <button
                  onClick={prevProduct}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-card border-2 border-border shadow-sm transition-all hover:shadow-md hover:border-warning/30 hover:bg-warning/5"
                  aria-label="Previous product"
                >
                  <svg className="h-5 w-5 text-muted-foreground transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {memoizedSameBrandProductList.map((_, index) => (
                      <div
                        key={index}
                        className={`h-2 w-2 rounded-full transition-colors ${
                          index === currentIndex ? 'bg-warning' : 'bg-muted'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">
                    {currentIndex + 1} of {memoizedSameBrandProductList.length}
                  </span>
                </div>

                <button
                  onClick={nextProduct}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-card border-2 border-border shadow-sm transition-all hover:shadow-md hover:border-warning/30 hover:bg-warning/5"
                  aria-label="Next product"
                >
                  <svg className="h-5 w-5 text-muted-foreground transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <svg className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2" dir={langDir} translate="no">
              {t("no_product_found")}
            </h3>
            <p className="text-sm text-muted-foreground" dir={langDir} translate="no">
              {t("no_products_from_same_brand")}
            </p>
        </div>
        )}
      </div>
    </div>
  );
};

export default SameBrandSection;
