"use client";
import {
  useCartListByDevice,
  useCartListByUserId,
  useDeleteCartItem,
  useDeleteServiceFromCart,
  useUpdateCartByDevice,
  useUpdateCartWithLogin,
  useCartRecommendations,
} from "@/apis/queries/cart.queries";
import {
  useAddToWishList,
  useDeleteFromWishList,
} from "@/apis/queries/wishlist.queries";
import CartProductCardWrapper from "@/components/modules/cartList/CartProductCardWrapper";
import ServiceCard from "@/components/modules/cartList/ServiceCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useVendorBusinessCategories } from "@/hooks/useVendorBusinessCategories";
import { PUREMOON_TOKEN_KEY } from "@/utils/constants";
import { getOrCreateDeviceId } from "@/utils/helper";
import { checkCategoryConnection } from "@/utils/categoryConnection";
import { CartItem } from "@/utils/types/cart.types";
import { getCookie } from "cookies-next";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useDynamicTranslation } from "@/hooks/useDynamicTranslation";
import React, { useEffect, useMemo, useState } from "react";
import { ShoppingBag, ChevronLeft, ChevronRight } from "lucide-react";
import { useCurrentAccount } from "@/apis/queries/auth.queries";
import { useAllProducts } from "@/apis/queries/product.queries";
import { useCategory } from "@/apis/queries/category.queries";
import { useMe } from "@/apis/queries/user.queries";
import { useQueryClient } from "@tanstack/react-query";
import ProductCard from "@/components/modules/productDetails/ProductCard";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Image from "next/image";
import PlaceholderImage from "@/public/images/product-placeholder.png";
import { FaStar } from "react-icons/fa";

const CartListPage = () => {
  const t = useTranslations();
  const { user, langDir, currency } = useAuth();
  const { translate } = useDynamicTranslation();
  const currentAccount = useCurrentAccount();
  const currentTradeRole =
    currentAccount?.data?.data?.account?.tradeRole || user?.tradeRole;
  const vendorBusinessCategoryIds = useVendorBusinessCategories();
  const router = useRouter();
  const { toast } = useToast();
  const [haveAccessToken, setHaveAccessToken] = useState(false);
  const deviceId = getOrCreateDeviceId() || "";
  const accessToken = getCookie(PUREMOON_TOKEN_KEY);
  const [loading, setLoading] = useState<boolean>(false);
  const [totalAmount, setTotalAmount] = useState<number>(0);

  const cartListByDeviceQuery = useCartListByDevice(
    {
      page: 1,
      limit: 10,
      deviceId,
    },
    !haveAccessToken,
  );
  const cartListByUser = useCartListByUserId(
    {
      page: 1,
      limit: 10,
    },
    haveAccessToken,
  );
  const updateCartWithLogin = useUpdateCartWithLogin();
  const updateCartByDevice = useUpdateCartByDevice();
  const deleteCartItem = useDeleteCartItem();
  const deleteServiceFromCart = useDeleteServiceFromCart();
  const addToWishlist = useAddToWishList();
  const deleteFromWishlist = useDeleteFromWishList();
  const me = useMe();
  const queryClient = useQueryClient();

  const memoizedCartList = useMemo(() => {
    setLoading(false);
    if (cartListByUser.data?.data) {
      return cartListByUser.data?.data || [];
    } else if (cartListByDeviceQuery.data?.data) {
      return cartListByDeviceQuery.data?.data || [];
    }
    return [];
  }, [cartListByUser.data?.data, cartListByDeviceQuery.data?.data]);

  // Get unique product IDs from cart for calculateTotalAmount
  const uniqueProductIds = useMemo(() => {
    const productIds = new Set<number>();
    memoizedCartList.forEach((item: CartItem) => {
      if (item.cartType === "DEFAULT" && item.productId) {
        productIds.add(item.productId);
      }
    });
    return Array.from(productIds);
  }, [memoizedCartList]);

  // Fetch all products that are in the cart to get consumerType for calculateTotalAmount
  // Note: This is a workaround - ideally the backend should include consumerType in cart response
  const allProductsQuery = useAllProducts(
    {
      page: 1,
      limit: 1000, // Fetch enough to cover all cart items
    },
    haveAccessToken && uniqueProductIds.length > 0,
  );

  // Get unique category IDs from products in cart
  const uniqueCategoryIds = useMemo(() => {
    const categoryIds = new Set<number>();
    if (allProductsQuery?.data?.data) {
      allProductsQuery.data.data.forEach((product: any) => {
        if (uniqueProductIds.includes(product.id)) {
          const categoryId = product?.categoryId ?? product?.category?.id;
          if (categoryId) {
            categoryIds.add(categoryId);
          }
        }
      });
    }
    return Array.from(categoryIds);
  }, [allProductsQuery?.data?.data, uniqueProductIds]);

  // Get product IDs from cart for recommendations
  const cartProductIds = useMemo(() => {
    return memoizedCartList
      .filter((item: CartItem) => item.cartType === "DEFAULT" && item.productId)
      .map((item: CartItem) => item.productId)
      .join(",");
  }, [memoizedCartList]);

  // Fetch recommendations using the new API
  const cartRecommendationsQuery = useCartRecommendations(
    {
      productIds: cartProductIds,
      limit: 20,
      deviceId: !haveAccessToken ? deviceId : undefined,
    },
    memoizedCartList.length > 0 && !loading,
  );

  // Format recommended products
  const recommendedProducts = useMemo(() => {
    if (!cartRecommendationsQuery?.data?.data) return [];

    return cartRecommendationsQuery.data.data
      .filter((product: any) => {
        // Exclude products already in cart
        return !uniqueProductIds.includes(product.id);
      })
      .slice(0, 12) // Limit to 12 products
      .map((item: any) => {
        const activePriceEntry =
          item?.product_productPrice?.find(
            (pp: any) => pp?.status === "ACTIVE",
          ) || item?.product_productPrice?.[0];

        return {
          id: item.id,
          productName: item.productName,
          productImages: item?.product_productPrice?.[0]
            ?.productPrice_productSellerImage?.length
            ? item?.product_productPrice?.[0]?.productPrice_productSellerImage
            : item?.productImages || [],
          shortDescription: item?.product_productShortDescription?.length
            ? item?.product_productShortDescription?.[0]?.shortDescription
            : "-",
          productReview: item?.product_review || [],
          productProductPrice: activePriceEntry?.offerPrice,
          offerPrice: Number(activePriceEntry?.offerPrice || 0),
          productPrice: Number(activePriceEntry?.productPrice || 0),
          productWishlist: item?.product_wishlist || [],
          inWishlist: item?.product_wishlist?.find(
            (ele: any) => ele?.userId === me.data?.data?.id,
          ),
          productProductPriceId: activePriceEntry?.id,
          consumerDiscount: activePriceEntry?.consumerDiscount,
          consumerDiscountType: activePriceEntry?.consumerDiscountType,
          vendorDiscount: activePriceEntry?.vendorDiscount,
          vendorDiscountType: activePriceEntry?.vendorDiscountType,
          askForPrice: activePriceEntry?.askForPrice,
          categoryId: item?.categoryId,
          categoryLocation: item?.categoryLocation,
          categoryConnections: item?.category?.category_categoryIdDetail || [],
          consumerType: activePriceEntry?.consumerType,
        };
      });
  }, [
    cartRecommendationsQuery?.data?.data,
    uniqueProductIds,
    me.data?.data?.id,
  ]);

  // Fetch category data for the first category (if vendor)
  // Note: We fetch one category at a time to avoid hooks rule violations
  // In practice, most carts will have products from the same category
  const firstCategoryId =
    uniqueCategoryIds.length > 0 ? uniqueCategoryIds[0] : undefined;
  const firstCategoryQuery = useCategory(
    firstCategoryId?.toString(),
    !!(currentTradeRole && currentTradeRole !== "BUYER" && firstCategoryId),
  );

  // For now, we'll use the category connections from the product query
  // but prioritize fresh data from category query if available
  // This is a limitation - ideally we'd fetch all categories, but that requires
  // either a batch API or individual components for each category

  // Create a map of productId -> pricing metadata required for discount calculation
  const productPricingInfoMap = useMemo(() => {
    const map = new Map<
      number,
      {
        consumerType?: string;
        vendorDiscount?: number;
        vendorDiscountType?: string;
        consumerDiscount?: number;
        consumerDiscountType?: string;
        categoryId?: number;
        categoryLocation?: string;
        categoryConnections?: any[];
      }
    >();

    if (allProductsQuery?.data?.data) {
      allProductsQuery.data.data.forEach((product: any) => {
        if (uniqueProductIds.includes(product.id)) {
          const activePriceEntry =
            product?.product_productPrice?.find(
              (pp: any) => pp?.status === "ACTIVE",
            ) || product?.product_productPrice?.[0];

          const categoryId = product?.categoryId ?? product?.category?.id;

          // Get fresh category connections - prioritize from category query if it matches
          // Otherwise fall back to product query data
          let freshCategoryConnections: any[] = [];
          if (
            categoryId === firstCategoryId &&
            firstCategoryQuery?.data?.data?.category_categoryIdDetail
          ) {
            freshCategoryConnections =
              firstCategoryQuery.data.data.category_categoryIdDetail;
          } else if (product?.category?.category_categoryIdDetail) {
            freshCategoryConnections =
              product.category.category_categoryIdDetail;
          }

          map.set(product.id, {
            consumerType: activePriceEntry?.consumerType,
            vendorDiscount: activePriceEntry?.vendorDiscount,
            vendorDiscountType: activePriceEntry?.vendorDiscountType,
            consumerDiscount: activePriceEntry?.consumerDiscount,
            consumerDiscountType: activePriceEntry?.consumerDiscountType,
            categoryId: categoryId,
            categoryLocation:
              product?.categoryLocation ?? product?.category?.categoryLocation,
            categoryConnections: freshCategoryConnections,
          });
        }
      });
    }

    return map;
  }, [
    allProductsQuery?.data?.data,
    uniqueProductIds,
    firstCategoryId,
    firstCategoryQuery?.data?.data,
  ]);

  const calculateDiscountedPrice = (
    offerPrice: string | number,
    discount: number,
    discountType?: string,
  ) => {
    const price = offerPrice ? Number(offerPrice) : 0;
    if (discountType == "PERCENTAGE") {
      return Number((price - (price * discount) / 100).toFixed(2));
    } else if (discountType == "FIXED" || discountType == "FLAT") {
      return Number((price - discount).toFixed(2));
    }
    // If no discount type is specified, treat as fixed discount
    return Number((price - discount).toFixed(2));
  };

  // Calculate discounted price for promotional products
  const getPromotionalProductPrice = (product: any) => {
    const offerPrice = product.offerPrice || 0;
    const rawConsumerType = product.consumerType || "";
    const normalizedConsumerType =
      typeof rawConsumerType === "string"
        ? rawConsumerType.toUpperCase().trim()
        : "";
    const isVendorType =
      normalizedConsumerType === "VENDOR" ||
      normalizedConsumerType === "VENDORS";
    const isConsumerType = normalizedConsumerType === "CONSUMER";
    const isEveryoneType = normalizedConsumerType === "EVERYONE";

    const categoryId = Number(product.categoryId || 0);
    const categoryLocation = product.categoryLocation;
    const categoryConnections = product.categoryConnections || [];

    const isCategoryMatch = checkCategoryConnection(
      vendorBusinessCategoryIds,
      categoryId,
      categoryLocation,
      categoryConnections,
    );

    const vendorDiscountValue = Number(product.vendorDiscount || 0);
    const vendorDiscountType = product.vendorDiscountType;
    const normalizedVendorDiscountType = vendorDiscountType
      ? vendorDiscountType.toString().toUpperCase().trim()
      : undefined;

    const consumerDiscountValue = Number(product.consumerDiscount || 0);
    const consumerDiscountType = product.consumerDiscountType;
    const normalizedConsumerDiscountType = consumerDiscountType
      ? consumerDiscountType.toString().toUpperCase().trim()
      : undefined;

    let discount = 0;
    let applicableDiscountType: string | undefined;

    if (currentTradeRole && currentTradeRole !== "BUYER") {
      // VENDOR user
      if (isVendorType || isEveryoneType) {
        if (isCategoryMatch) {
          if (vendorDiscountValue > 0 && normalizedVendorDiscountType) {
            discount = vendorDiscountValue;
            applicableDiscountType = normalizedVendorDiscountType;
          }
        } else {
          if (isEveryoneType) {
            if (consumerDiscountValue > 0 && normalizedConsumerDiscountType) {
              discount = consumerDiscountValue;
              applicableDiscountType = normalizedConsumerDiscountType;
            }
          }
        }
      }
    } else {
      // CONSUMER (BUYER)
      if (isConsumerType || isEveryoneType) {
        if (consumerDiscountValue > 0 && normalizedConsumerDiscountType) {
          discount = consumerDiscountValue;
          applicableDiscountType = normalizedConsumerDiscountType;
        }
      }
    }

    const discountedPrice = calculateDiscountedPrice(
      offerPrice,
      discount,
      applicableDiscountType,
    );

    return {
      originalPrice: offerPrice,
      discountedPrice,
      hasDiscount: discount > 0,
    };
  };

  const calculateTotalAmount = () => {
    if (cartListByUser.data?.data?.length) {
      return cartListByUser.data?.data?.reduce(
        (acc: number, curr: CartItem) => {
          if (curr.cartType == "DEFAULT") {
            const productPriceDetails: any = curr?.productPriceDetails || {};
            const productInfo = productPricingInfoMap.get(curr.productId);

            const rawConsumerType =
              productInfo?.consumerType ||
              productPriceDetails?.consumerType ||
              "";
            const normalizedConsumerType =
              typeof rawConsumerType === "string"
                ? rawConsumerType.toUpperCase().trim()
                : "";
            const isVendorType =
              normalizedConsumerType === "VENDOR" ||
              normalizedConsumerType === "VENDORS";
            const isConsumerType = normalizedConsumerType === "CONSUMER";
            const isEveryoneType = normalizedConsumerType === "EVERYONE";

            const categoryId = Number(productInfo?.categoryId || 0);
            const categoryLocation = productInfo?.categoryLocation;
            const categoryConnections = productInfo?.categoryConnections;

            const isCategoryMatch = checkCategoryConnection(
              vendorBusinessCategoryIds,
              categoryId,
              categoryLocation,
              categoryConnections,
            );

            const vendorDiscountValue = Number(
              productInfo?.vendorDiscount ??
                productPriceDetails?.vendorDiscount ??
                0,
            );
            const vendorDiscountType =
              productInfo?.vendorDiscountType ||
              productPriceDetails?.vendorDiscountType;
            const normalizedVendorDiscountType = vendorDiscountType
              ? vendorDiscountType.toString().toUpperCase().trim()
              : undefined;

            const consumerDiscountValue = Number(
              productInfo?.consumerDiscount ??
                productPriceDetails?.consumerDiscount ??
                0,
            );
            const consumerDiscountType =
              productInfo?.consumerDiscountType ||
              productPriceDetails?.consumerDiscountType;
            const normalizedConsumerDiscountType = consumerDiscountType
              ? consumerDiscountType.toString().toUpperCase().trim()
              : undefined;

            let discount = 0;
            let applicableDiscountType: string | undefined;

            if (currentTradeRole && currentTradeRole !== "BUYER") {
              // VENDOR user
              if (isVendorType || isEveryoneType) {
                // consumerType is VENDOR/VENDORS or EVERYONE - vendor can get vendor discount
                // BUT category match is REQUIRED for vendor discounts
                if (isCategoryMatch) {
                  // Same relation - Vendor gets vendor discount if available
                  if (vendorDiscountValue > 0 && normalizedVendorDiscountType) {
                    discount = vendorDiscountValue;
                    applicableDiscountType = normalizedVendorDiscountType;
                  } else {
                    // No vendor discount available, no discount
                    discount = 0;
                  }
                } else {
                  // Not same relation - No vendor discount
                  // If consumerType is EVERYONE, fallback to consumer discount
                  if (isEveryoneType) {
                    if (
                      consumerDiscountValue > 0 &&
                      normalizedConsumerDiscountType
                    ) {
                      discount = consumerDiscountValue;
                      applicableDiscountType = normalizedConsumerDiscountType;
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
              if (isConsumerType || isEveryoneType) {
                if (
                  consumerDiscountValue > 0 &&
                  normalizedConsumerDiscountType
                ) {
                  discount = consumerDiscountValue;
                  applicableDiscountType = normalizedConsumerDiscountType;
                }
              }
            }

            const calculatedDiscount = calculateDiscountedPrice(
              productPriceDetails?.offerPrice ?? 0,
              discount,
              applicableDiscountType,
            );

            return Number(
              (acc + calculatedDiscount * curr.quantity).toFixed(2),
            );
          }

          if (!curr.cartServiceFeatures?.length) return acc;

          let amount = 0;
          const cartItemAny = curr as any;
          for (const feature of curr.cartServiceFeatures) {
            if (feature.serviceFeature?.serviceCostType == "FLAT") {
              amount +=
                Number(feature.serviceFeature?.serviceCost || "") *
                (feature.quantity || 1);
            } else {
              amount +=
                Number(feature?.serviceFeature?.serviceCost || "") *
                (feature.quantity || 1) *
                (cartItemAny.service?.eachCustomerTime || 1);
            }
          }

          return Number((acc + amount).toFixed(2));
        },
        0,
      );
    } else if (cartListByDeviceQuery.data?.data?.length) {
      return cartListByDeviceQuery.data?.data?.reduce(
        (acc: number, curr: CartItem) => {
          if (curr.cartType == "DEFAULT") {
            const productPriceDetails: any = curr?.productPriceDetails || {};
            const productInfo = productPricingInfoMap.get(curr.productId);

            const rawConsumerType =
              productInfo?.consumerType ||
              productPriceDetails?.consumerType ||
              "";
            const normalizedConsumerType =
              typeof rawConsumerType === "string"
                ? rawConsumerType.toUpperCase().trim()
                : "";
            const isConsumerType = normalizedConsumerType === "CONSUMER";
            const isEveryoneType = normalizedConsumerType === "EVERYONE";

            const consumerDiscountValue = Number(
              productInfo?.consumerDiscount ??
                productPriceDetails?.consumerDiscount ??
                0,
            );
            const consumerDiscountType =
              productInfo?.consumerDiscountType ||
              productPriceDetails?.consumerDiscountType;
            const normalizedConsumerDiscountType = consumerDiscountType
              ? consumerDiscountType.toString().toUpperCase().trim()
              : undefined;

            let discount = 0;
            let applicableDiscountType: string | undefined;

            if (isConsumerType || isEveryoneType) {
              if (consumerDiscountValue > 0 && normalizedConsumerDiscountType) {
                discount = consumerDiscountValue;
                applicableDiscountType = normalizedConsumerDiscountType;
              }
            }

            const calculatedDiscount = calculateDiscountedPrice(
              productPriceDetails?.offerPrice ?? 0,
              discount,
              applicableDiscountType,
            );
            return Number(
              (acc + calculatedDiscount * curr.quantity).toFixed(2),
            );
          }

          if (!curr.cartServiceFeatures?.length) return acc;

          let amount = 0;
          const cartItemAny = curr as any;
          for (const feature of curr.cartServiceFeatures) {
            if (feature.serviceFeature?.serviceCostType == "FLAT") {
              amount +=
                Number(feature.serviceFeature?.serviceCost || "") *
                (feature.quantity || 1);
            } else {
              amount +=
                Number(feature?.serviceFeature?.serviceCost || "") *
                (feature.quantity || 1) *
                (cartItemAny.service?.eachCustomerTime || 1);
            }
          }

          return Number((acc + amount).toFixed(2));
        },
        0,
      );
    } else {
      return 0;
    }
  };

  const handleRemoveProductFromCart = async (cartId: number) => {
    const response = await deleteCartItem.mutateAsync({ cartId });
    if (response.status) {
      setLoading(true);
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

  const handleRemoveServiceFromCart = async (
    cartId: number,
    serviceFeatureId: number,
  ) => {
    const cartItem = memoizedCartList.find((item: any) => item.id == cartId);
    const payload: any = { cartId };
    if (cartItem?.cartServiceFeatures?.length > 1) {
      payload.serviceFeatureId = serviceFeatureId;
    }
    const response = await deleteServiceFromCart.mutateAsync(payload);
    if (response.status) {
      setLoading(true);
      toast({
        title: t("item_removed_from_cart"),
        description: t("check_your_cart_for_more_details"),
        variant: "success",
      });
    } else {
      toast({
        title: response.message || t("item_not_removed_from_cart"),
        description: response.message || t("check_your_cart_for_more_details"),
        variant: "danger",
      });
    }
  };

  const handleAddToWishlist = async (productId: number) => {
    const response = await addToWishlist.mutateAsync({ productId });
    if (response.status) {
      toast({
        title: t("item_added_to_wishlist"),
        description: t("check_your_wishlist_for_more_details"),
        variant: "success",
      });
    } else {
      toast({
        title: response.message || t("item_not_added_to_wishlist"),
        description: t("check_your_wishlist_for_more_details"),
        variant: "danger",
      });
    }
  };

  // Handler for recommended products wishlist
  const handleRecommendedWishlist = async (
    productId: number,
    inWishlist: boolean,
  ) => {
    if (inWishlist) {
      const response = await deleteFromWishlist.mutateAsync({ productId });
      if (response.status) {
        toast({
          title: t("item_removed_from_wishlist"),
          description: t("check_your_wishlist_for_more_details"),
          variant: "success",
        });
        queryClient.invalidateQueries({ queryKey: ["all-products"] });
      }
    } else {
      const response = await addToWishlist.mutateAsync({ productId });
      if (response.status) {
        toast({
          title: t("item_added_to_wishlist"),
          description: t("check_your_wishlist_for_more_details"),
          variant: "success",
        });
        queryClient.invalidateQueries({ queryKey: ["all-products"] });
      }
    }
  };

  // Handler for adding recommended product to cart
  const handleRecommendedAddToCart = async (
    quantity: number,
    productPriceId?: number,
  ) => {
    if (!productPriceId) {
      toast({
        title: t("something_went_wrong"),
        description: t("product_price_id_not_found"),
        variant: "danger",
      });
      return;
    }

    if (haveAccessToken) {
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
        // Refresh cart
        queryClient.invalidateQueries({ queryKey: ["cart-list-by-user"] });
      }
    } else {
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
        // Refresh cart
        queryClient.invalidateQueries({ queryKey: ["cart-list-by-device"] });
      }
    }
  };

  useEffect(() => {
    if (accessToken) {
      setHaveAccessToken(true);
    } else {
      setHaveAccessToken(false);
    }
  }, [accessToken]);

  useEffect(() => {
    setTotalAmount(calculateTotalAmount());
  }, [
    memoizedCartList,
    currentTradeRole,
    productPricingInfoMap,
    vendorBusinessCategoryIds,
  ]);

  return (
    <div className="min-h-screen bg-card">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Cart and Order Summary Section */}
        {/* Header Section - Amazon Style */}
        <div className="mb-6 border-b border-border pb-4">
          <h1
            className="text-3xl font-semibold text-foreground"
            dir={langDir}
            translate="no"
          >
            {t("my_cart")}
          </h1>
          {memoizedCartList.length > 0 && (
            <p
              className="mt-1 text-sm text-muted-foreground"
              dir={langDir}
              translate="no"
            >
              {memoizedCartList.length}{" "}
              {memoizedCartList.length === 1 ? t("item") : t("items")}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Column - Cart Items */}
          <div className="lg:col-span-8">
            {/* My Cart Items Section - Clearly Labeled */}
            <div className="mb-6 rounded-lg border-2 border-primary/20 bg-primary/5/30 p-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2
                    className="text-xl font-bold text-foreground"
                    dir={langDir}
                    translate="no"
                  >
                    {t("items_in_your_cart") || "Items in Your Cart"}
                  </h2>
                  <p
                    className="mt-1 text-sm text-muted-foreground"
                    dir={langDir}
                    translate="no"
                  >
                    {memoizedCartList.length}{" "}
                    {memoizedCartList.length === 1 ? t("item") : t("items")}{" "}
                    added by you
                  </p>
                </div>
                <div className="rounded-full bg-primary/10 px-3 py-1">
                  <span className="text-sm font-semibold text-primary">
                    {memoizedCartList.length}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                {/* Empty Cart State */}
                {haveAccessToken &&
                !cartListByUser.data?.data?.length &&
                !cartListByUser.isLoading ? (
                  <div className="py-12 text-center">
                    <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-muted">
                      <ShoppingBag className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <h3
                      className="mb-2 text-lg font-medium text-foreground"
                      translate="no"
                    >
                      {t("no_cart_items")}
                    </h3>
                    <p className="mb-6 text-muted-foreground" translate="no">
                      Add some products to get started
                    </p>
                    <Button
                      onClick={() => router.push("/trending")}
                      className="bg-primary px-6 py-2 text-white hover:bg-primary/90"
                    >
                      Continue Shopping
                    </Button>
                  </div>
                ) : null}

                {!haveAccessToken &&
                !cartListByDeviceQuery.data?.data?.length &&
                !cartListByDeviceQuery.isLoading ? (
                  <div className="py-12 text-center">
                    <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-muted">
                      <ShoppingBag className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <h3
                      className="mb-2 text-lg font-medium text-foreground"
                      translate="no"
                    >
                      {t("no_cart_items")}
                    </h3>
                    <p className="mb-6 text-muted-foreground" translate="no">
                      Add some products to get started
                    </p>
                    <Button
                      onClick={() => router.push("/trending")}
                      className="bg-primary px-6 py-2 text-white hover:bg-primary/90"
                    >
                      Continue Shopping
                    </Button>
                  </div>
                ) : null}

                {/* Loading States */}
                {cartListByUser.isLoading || loading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 2 }).map((_, i) => (
                      <div
                        key={i}
                        className="flex items-center space-x-4 rounded-lg border border-border p-4"
                      >
                        <Skeleton className="h-20 w-20 rounded-lg" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-4 w-1/2" />
                          <Skeleton className="h-4 w-1/4" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}

                {!haveAccessToken &&
                (cartListByDeviceQuery.isLoading || loading) ? (
                  <div className="space-y-4">
                    {Array.from({ length: 2 }).map((_, i) => (
                      <div
                        key={i}
                        className="flex items-center space-x-4 rounded-lg border border-border p-4"
                      >
                        <Skeleton className="h-20 w-20 rounded-lg" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-4 w-1/2" />
                          <Skeleton className="h-4 w-1/4" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}

                {/* Cart Items */}
                {!loading ? (
                  <div className="space-y-4">
                    {memoizedCartList?.map((item: CartItem) => {
                      if (item.cartType == "DEFAULT") {
                        const relatedCart = memoizedCartList
                          ?.filter(
                            (c: any) =>
                              c.serviceId && c.cartProductServices?.length,
                          )
                          .find((c: any) => {
                            return !!c.cartProductServices.find(
                              (r: any) =>
                                r.relatedCartType == "PRODUCT" &&
                                r.productId == item.productId,
                            );
                          });
                        return (
                          <CartProductCardWrapper
                            key={item.id}
                            item={item}
                            onRemove={handleRemoveProductFromCart}
                            onWishlist={handleAddToWishlist}
                            haveAccessToken={haveAccessToken}
                            relatedCart={relatedCart}
                          />
                        );
                      }

                      if (!item.cartServiceFeatures?.length) return null;

                      const features = item.cartServiceFeatures.map(
                        (feature: any) => ({
                          id: feature.id,
                          serviceFeatureId: feature.serviceFeatureId,
                          quantity: feature.quantity,
                        }),
                      );

                      const relatedCart: any = memoizedCartList
                        ?.filter(
                          (c: any) =>
                            c.productId && c.cartProductServices?.length,
                        )
                        .find((c: any) => {
                          return !!c.cartProductServices.find(
                            (r: any) =>
                              r.relatedCartType == "SERVICE" &&
                              r.serviceId == item.serviceId,
                          );
                        });

                      return item.cartServiceFeatures.map((feature: any) => {
                        return (
                          <div
                            key={feature.id}
                            className="rounded-lg border border-border p-4 transition-shadow hover:shadow-md"
                          >
                            <ServiceCard
                              cartId={item.id}
                              serviceId={item.serviceId}
                              serviceFeatureId={feature.serviceFeatureId}
                              serviceFeatureName={feature.serviceFeature.name}
                              serviceCost={Number(
                                feature.serviceFeature.serviceCost,
                              )}
                              cartQuantity={feature.quantity}
                              serviceFeatures={features}
                              relatedCart={relatedCart}
                              onRemove={() => {
                                handleRemoveServiceFromCart(
                                  item.id,
                                  feature.id,
                                );
                              }}
                            />
                          </div>
                        );
                      });
                    })}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary - Amazon Style */}
          <div className="lg:col-span-4">
            <div className="sticky top-6 rounded-lg border border-border bg-card shadow-sm">
              <div className="border-b border-border bg-muted px-4 py-3">
                <h2
                  className="text-lg font-semibold text-foreground"
                  dir={langDir}
                  translate="no"
                >
                  {t("order_summary") || "Order Summary"}
                </h2>
              </div>

              <div className="p-4">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span
                      className="text-muted-foreground"
                      dir={langDir}
                      translate="no"
                    >
                      {t("subtotal")} ({memoizedCartList.length}{" "}
                      {memoizedCartList.length === 1 ? t("item") : t("items")})
                    </span>
                    <span className="font-medium text-foreground">
                      {currency.symbol}
                      {totalAmount}
                    </span>
                  </div>

                  <div className="border-t border-border pt-3">
                    <div className="flex items-center justify-between">
                      <span
                        className="text-base font-semibold text-foreground"
                        dir={langDir}
                        translate="no"
                      >
                        {t("total_amount")}
                      </span>
                      <span className="text-lg font-bold text-foreground">
                        {currency.symbol}
                        {totalAmount}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Place Order Button - Amazon Style */}
                <div className="mt-4 space-y-2">
                  <Button
                    onClick={() => router.push("/checkout")}
                    disabled={!memoizedCartList?.length}
                    className="w-full rounded-md bg-warning px-4 py-2.5 font-medium text-foreground shadow-sm transition-colors hover:bg-warning disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
                    dir={langDir}
                    translate="no"
                  >
                    {t("proceed_to_checkout") || "Proceed to checkout"}
                  </Button>

                  {memoizedCartList?.length > 0 && (
                    <Button
                      onClick={() => router.push("/trending")}
                      variant="outline"
                      className="w-full border-border text-sm text-muted-foreground hover:bg-muted"
                    >
                      {t("continue_shopping") || "Continue Shopping"}
                    </Button>
                  )}
                </div>

                {/* Security Badge */}
                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                  <span translate="no">Secure checkout</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Promotional Products Sections - Full Screen Width */}
      <div className="w-full bg-muted">
        <div className="mx-auto w-full px-2 sm:px-4 lg:px-6">
          <div className="space-y-8">
            {/* Recommended for You Section - Amazon Style */}
            {memoizedCartList.length > 0 && (
              <div className="w-full bg-card p-4">
                {/* Header Section - Amazon Style */}
                <div className="mb-4 flex items-start justify-between border-b border-border pb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h2
                        className="text-lg font-semibold text-foreground"
                        dir={langDir}
                        translate="no"
                      >
                        Recommended products
                      </h2>
                    </div>
                    <div className="mt-1 flex items-center gap-1">
                      <span className="text-xs text-muted-foreground" translate="no">
                        Sponsored
                      </span>
                      <svg
                        className="h-3 w-3 text-muted-foreground"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                  </div>
                  {/* <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span translate="no">Page 1 of 1</span>
                    <button
                      className="text-primary hover:text-primary hover:underline"
                      translate="no"
                    >
                      Start over
                    </button>
                    </div> */}
                </div>

                {cartRecommendationsQuery.isLoading ? (
                  <div className="flex gap-4 overflow-x-auto pb-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-[180px] flex-shrink-0 rounded border border-border bg-card p-3"
                      >
                        <Skeleton className="mb-3 h-40 w-full rounded" />
                        <Skeleton className="mb-2 h-4 w-full" />
                        <Skeleton className="mb-2 h-3 w-2/3" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    ))}
                  </div>
                ) : recommendedProducts.length > 0 ? (
                  <div className="group relative">
                    <Carousel
                      opts={{
                        align: "start",
                        loop: false,
                        dragFree: true,
                      }}
                      className="w-full"
                    >
                      <CarouselContent className="-ml-2 md:-ml-4">
                        {recommendedProducts
                          .slice(0, 12)
                          .map((product: any) => {
                            const avgRating =
                              product.productReview?.length > 0
                                ? (
                                    product.productReview.reduce(
                                      (sum: number, r: any) =>
                                        sum + (r.rating || 0),
                                      0,
                                    ) / product.productReview.length
                                  ).toFixed(1)
                                : null;
                            const priceInfo =
                              getPromotionalProductPrice(product);
                            const hasListPrice =
                              priceInfo.hasDiscount &&
                              priceInfo.originalPrice >
                                priceInfo.discountedPrice;

                            return (
                              <CarouselItem
                                key={product.id}
                                className="basis-auto pl-2 md:pl-4"
                              >
                                <div className="w-[180px] flex-shrink-0">
                                  <div className="group/product relative flex h-full min-h-[380px] flex-col rounded border border-border bg-card p-3 transition-shadow hover:shadow-md">
                                    {/* Product Image */}
                                    <div className="relative mb-3 aspect-square w-full overflow-hidden rounded bg-muted">
                                      <Image
                                        src={
                                          product.productImages?.[0]?.image ||
                                          PlaceholderImage
                                        }
                                        alt={product.productName}
                                        fill
                                        className="object-contain transition-transform group-hover/product:scale-105"
                                      />
                                    </div>

                                    {/* Product Info */}
                                    <div className="flex flex-1 flex-col space-y-2">
                                      {/* Product Title */}
                                      <h3
                                        className="line-clamp-2 cursor-pointer text-sm leading-tight text-foreground group-hover/product:text-primary"
                                        dir={langDir}
                                        onClick={() =>
                                          router.push(`/trending/${product.id}`)
                                        }
                                      >
                                        {translate(product.productName)}
                                      </h3>

                                      {/* Rating with Stars - Always reserve space */}
                                      <div className="min-h-[20px]">
                                        {avgRating &&
                                          product.productReview?.length > 0 && (
                                            <div className="flex items-center gap-1">
                                              <div className="flex items-center">
                                                {Array.from({ length: 5 }).map(
                                                  (_, i) => {
                                                    const rating =
                                                      parseFloat(avgRating);
                                                    const starValue = i + 1;
                                                    return (
                                                      <FaStar
                                                        key={i}
                                                        className={`h-3 w-3 ${
                                                          starValue <=
                                                          Math.round(rating)
                                                            ? "text-warning/70"
                                                            : "text-muted-foreground"
                                                        }`}
                                                      />
                                                    );
                                                  },
                                                )}
                                                <span className="ml-1 text-xs text-muted-foreground">
                                                  {avgRating}
                                                </span>
                                              </div>
                                              <span className="text-xs text-muted-foreground">
                                                ({product.productReview.length})
                                              </span>
                                            </div>
                                          )}
                                      </div>

                                      {/* Price Section */}
                                      <div className="space-y-0.5">
                                        <div className="flex items-baseline gap-1">
                                          <span className="text-base font-semibold text-foreground">
                                            {currency.symbol}
                                            {Number(
                                              priceInfo.discountedPrice || 0,
                                            ).toFixed(2)}
                                          </span>
                                        </div>
                                        {hasListPrice && (
                                          <div className="text-xs text-muted-foreground">
                                            <span translate="no">
                                              List Price:{" "}
                                            </span>
                                            <span className="line-through">
                                              {currency.symbol}
                                              {Number(
                                                priceInfo.originalPrice || 0,
                                              ).toFixed(2)}
                                            </span>
                                          </div>
                                        )}
                                        {!hasListPrice &&
                                          Number(product.productPrice || 0) >
                                            Number(product.offerPrice || 0) && (
                                            <div className="text-xs text-muted-foreground">
                                              <span translate="no">
                                                List Price:{" "}
                                              </span>
                                              <span className="line-through">
                                                {currency.symbol}
                                                {Number(
                                                  product.productPrice || 0,
                                                ).toFixed(2)}
                                              </span>
                                            </div>
                                          )}
                                      </div>

                                      {/* Add to Cart Button - Yellow Amazon Style - Pushed to bottom */}
                                      <div className="mt-auto pt-2">
                                        <Button
                                          onClick={() =>
                                            handleRecommendedAddToCart(
                                              1,
                                              product.productProductPriceId,
                                            )
                                          }
                                          className="w-full rounded-md bg-warning px-3 py-1.5 text-xs font-medium text-foreground shadow-sm transition-colors hover:bg-warning"
                                          translate="no"
                                        >
                                          Add to Cart
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </CarouselItem>
                            );
                          })}
                      </CarouselContent>
                      <CarouselPrevious className="-left-4 h-8 w-8 border border-border bg-card shadow-md hover:bg-muted" />
                      <CarouselNext className="-right-4 h-8 w-8 border border-border bg-card shadow-md hover:bg-muted" />
                    </Carousel>
                  </div>
                ) : !cartRecommendationsQuery.isLoading &&
                  memoizedCartList.length > 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    <p>
                      {t("no_recommended_products") ||
                        "No recommended products found"}
                    </p>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartListPage;
