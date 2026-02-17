import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import Slider from "react-slick";
import ProductCard from "./ProductCard";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { stripHTML } from "@/utils/helper";
import { useMe } from "@/apis/queries/user.queries";
import {
  useAddToWishList,
  useDeleteFromWishList,
} from "@/apis/queries/wishlist.queries";
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useRelatedProducts } from "@/apis/queries/product.queries";
import {
  useUpdateCartByDevice,
  useUpdateCartWithLogin,
} from "@/apis/queries/cart.queries";
import { getOrCreateDeviceId } from "@/utils/helper";
import { getCookie } from "cookies-next";
import { PUREMOON_TOKEN_KEY } from "@/utils/constants";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";

type RelatedProductsSectionProps = {
  calculateTagIds: string;
  productId?: string;
};

const RelatedProductsSection: React.FC<RelatedProductsSectionProps> = ({
  calculateTagIds,
  productId,
}) => {
  const t = useTranslations();
  const { langDir } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const deviceId = getOrCreateDeviceId() || "";
  const [haveAccessToken, setHaveAccessToken] = useState(false);
  const accessToken = getCookie(PUREMOON_TOKEN_KEY);
  const sliderRef = useRef<Slider>(null);

  const me = useMe();
  const updateCartWithLogin = useUpdateCartWithLogin();
  const updateCartByDevice = useUpdateCartByDevice();
  const addToWishlist = useAddToWishList();
  const deleteFromWishlist = useDeleteFromWishList();
  const relatedProductsQuery = useRelatedProducts(
    {
      page: 1,
      limit: 10,
      tagIds: calculateTagIds,
      userId: me.data?.data?.id,
      productId,
    },
    !!calculateTagIds,
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

  const memoizedRelatedProductList = useMemo(() => {
    return (
      relatedProductsQuery?.data?.data
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
          categoryId: item?.categoryId,
          categoryLocation: item?.categoryLocation,
          consumerType: item?.product_productPrice?.[0]?.consumerType,
        })) || []
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    relatedProductsQuery?.data?.data,
    me.data?.data?.id,
    relatedProductsQuery?.isFetched,
    calculateTagIds,
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

  const settings = {
    dots: true,
    infinite: true,
    speed: 600,
    slidesToShow: 4,
    slidesToScroll: 1,
    initialSlide: 0,
    autoplay: true,
    autoplaySpeed: 4000,
    pauseOnHover: true,
    arrows: false, // We're using custom arrows
    dotsClass: "slick-dots custom-dots",
    responsive: [
      {
        breakpoint: 1280,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 1,
          infinite: true,
          dots: true,
          autoplay: true,
        },
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
          infinite: true,
          dots: true,
          autoplay: true,
        },
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          infinite: true,
          dots: true,
          autoplay: true,
        },
      },
    ],
  };

  return (
    <section className="w-full bg-white py-12">
      <div className="container mx-auto max-w-7xl px-4 lg:px-8">
        {/* Section Header - Amazon Style */}
        {relatedProductsQuery?.isFetched && memoizedRelatedProductList?.length > 0 && (
          <div className="mb-8 pb-4">
            <h2 className="text-2xl font-bold text-gray-900" dir={langDir} translate="no">
              {t("related_products")}
            </h2>
          </div>
        )}

        {/* Products Carousel - Amazon Style */}
        {relatedProductsQuery?.isFetched &&
        memoizedRelatedProductList?.length ? (
          <div className="relative">
            <Slider ref={sliderRef} className="related_slider w-full" {...settings}>
              {memoizedRelatedProductList?.map((item: any) => (
                <div className="px-2" key={item?.id}>
                  <ProductCard
                    id={item?.id}
                    productName={item?.productName}
                    productImages={item?.productImages}
                    shortDescription={
                      item?.shortDescription
                        ? stripHTML(item?.shortDescription)
                        : "-"
                    }
                    offerPrice={item?.offerPrice}
                    productProductPrice={item?.productProductPrice}
                    productPrice={item?.productPrice}
                    productReview={item?.productReview}
                    onAdd={() => handleAddToCart(-1, item?.productProductPriceId)}
                    onWishlist={() =>
                      handleAddToWishlist(item.id, item?.productWishlist)
                    }
                    inWishlist={item?.inWishlist}
                    haveAccessToken={haveAccessToken}
                    consumerDiscount={item?.consumerDiscount}
                    consumerDiscountType={item?.consumerDiscountType}
                    vendorDiscount={item?.vendorDiscount}
                    vendorDiscountType={item?.vendorDiscountType}
                    askForPrice={item?.askForPrice}
                    categoryId={item?.categoryId}
                    categoryLocation={item?.categoryLocation}
                    consumerType={item?.consumerType}
                  />
                </div>
              ))}
            </Slider>
            
            {/* Amazon-Style Navigation Arrows */}
            <button 
              onClick={() => sliderRef.current?.slickPrev()}
              className="absolute left-0 top-0 bottom-0 z-20 w-12 bg-gradient-to-r from-white via-white to-transparent flex items-center justify-start pl-2 opacity-0 hover:opacity-100 transition-opacity duration-200 group"
              aria-label="Previous"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg border border-gray-300">
                <svg className="h-6 w-6 text-gray-800" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </button>
            <button 
              onClick={() => sliderRef.current?.slickNext()}
              className="absolute right-0 top-0 bottom-0 z-20 w-12 bg-gradient-to-l from-white via-white to-transparent flex items-center justify-end pr-2 opacity-0 hover:opacity-100 transition-opacity duration-200 group"
              aria-label="Next"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg border border-gray-300">
                <svg className="h-6 w-6 text-gray-800" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </button>
          </div>
        ) : relatedProductsQuery?.isFetched && !memoizedRelatedProductList?.length ? (
          <div className="py-16 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
              <svg className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2" dir={langDir} translate="no">
              {t("no_related_products_found")}
            </h3>
            <p className="text-gray-500 max-w-md mx-auto" dir={langDir} translate="no">
              {t("explore_more_products_from_our_catalog")}
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default RelatedProductsSection;
