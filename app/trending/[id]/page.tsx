"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { sanitizeHtml } from "@/utils/sanitize";
import {
  useProductById,
  useOneWithProductPrice,
  useProductVariant,
  useTrackProductView,
} from "@/apis/queries/product.queries";
// import SimilarProductsSection from "@/components/modules/productDetails/SimilarProductsSection";
import RelatedProductsSection from "@/components/modules/productDetails/RelatedProductsSection";
import SameBrandSection from "@/components/modules/productDetails/SameBrandSection";
import ProductDescriptionCard from "@/components/modules/productDetails/ProductDescriptionCard";
import ProductImagesCard from "@/components/modules/productDetails/ProductImagesCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useCartListByDevice,
  useCartListByUserId,
  useUpdateCartByDevice,
  useUpdateCartWithLogin,
  useDeleteCartItem,
  useDeleteServiceFromCart,
} from "@/apis/queries/cart.queries";
import { useToast } from "@/components/ui/use-toast";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { getCookie } from "cookies-next";
import { ULTRASOOQ_TOKEN_KEY } from "@/utils/constants";
import { getOrCreateDeviceId, handleDescriptionParse } from "@/utils/helper";
import ReviewSection from "@/components/shared/ReviewSection";
import QuestionsAnswersSection from "@/components/modules/productDetails/QuestionsAnswersSection";
import {
  useAddToWishList,
  useDeleteFromWishList,
} from "@/apis/queries/wishlist.queries";
import { useMe } from "@/apis/queries/user.queries";
import { useQueryClient } from "@tanstack/react-query";
import Footer from "@/components/shared/Footer";
// import Image from "next/image";
// import EmailIcon from "@/public/images/email.svg";
// import PhoneCallIcon from "@/public/images/phone-call.svg";
import VendorSection from "@/components/modules/productDetails/VendorSection";
import PlateEditor from "@/components/shared/Plate/PlateEditor";
import ProductCard from "@/components/modules/cartList/ProductCard";
import ServiceCard from "@/components/modules/cartList/ServiceCard";
import { Skeleton } from "@/components/ui/skeleton";
import { CartItem } from "@/utils/types/cart.types";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useClickOutside } from "use-events";
import { Button } from "@/components/ui/button";
import { IoCloseSharp } from "react-icons/io5";
import dynamic from "next/dynamic";
import RelatedServices from "@/components/modules/trending/RelatedServices";

const ProductChat = dynamic(
  () => import("@/components/modules/chat/productChat/ProductChat"),
  {
    loading: () => <div className="animate-pulse h-64 bg-muted rounded-lg" />,
    ssr: false,
  },
);

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

const ProductDetailsPage = () => {
  const t = useTranslations();
  const { langDir } = useAuth();
  const queryClient = useQueryClient();
  const searchParams = useParams();
  const searchQuery = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const deviceId = getOrCreateDeviceId() || "";
  const [activeTab, setActiveTab] = useState("description");
  const [haveAccessToken, setHaveAccessToken] = useState(false);
  const accessToken = getCookie(ULTRASOOQ_TOKEN_KEY);
  const type = searchQuery?.get("type");
  const otherSellerId = searchQuery?.get("sellerId");
  const otherProductId = searchQuery?.get("productId");
  const sharedLinkId = searchQuery?.get("sharedLinkId") || "";
  const [isShareLinkProcessed, setIsShareLinkProcessed] =
    useState<boolean>(false);
  const [productVariantTypes, setProductVariantTypes] = useState<string[]>();
  const [productVariants, setProductVariants] = useState<any[]>();
  const [selectedProductVariant, setSelectedProductVariant] =
    useState<any>(null);

  const [isConfirmDialogOpen, setIsConfirmDialogOpen] =
    useState<boolean>(false);
  const handleConfirmDialog = () =>
    setIsConfirmDialogOpen(!isConfirmDialogOpen);
  const confirmDialogRef = useRef(null);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [isClickedOutsideConfirmDialog] = useClickOutside(
    [confirmDialogRef],
    (event) => {
      onCancelRemove();
    },
  );

  const me = useMe();
  const productQueryById = useProductById(
    {
      productId: searchParams?.id ? (searchParams?.id as string) : "",
      userId: me.data?.data?.id,
      sharedLinkId: sharedLinkId,
    },
    !!searchParams?.id && !otherSellerId && !otherProductId,
  );
  const getProductVariant = useProductVariant();
  const trackView = useTrackProductView();

  const handleProductUpdateSuccess = () => {
    queryClient.invalidateQueries({
      queryKey: ["product-by-id"],
    }); // Refetch product details
  };

  const cartListByDeviceQuery = useCartListByDevice(
    {
      page: 1,
      limit: 100,
      deviceId,
    },
    !haveAccessToken,
  );
  const cartListByUser = useCartListByUserId(
    {
      page: 1,
      limit: 100,
    },
    haveAccessToken,
  );
  const updateCartWithLogin = useUpdateCartWithLogin();
  const updateCartByDevice = useUpdateCartByDevice();
  const addToWishlist = useAddToWishList();
  const deleteFromWishlist = useDeleteFromWishList();
  const productQueryByOtherSeller = useOneWithProductPrice(
    {
      productId: otherProductId ? Number(otherProductId) : 0,
      adminId: otherSellerId ? Number(otherSellerId) : 0,
    },
    !!otherProductId && !!otherSellerId,
  );
  const deleteCartItem = useDeleteCartItem();
  const deleteServiceFromCart = useDeleteServiceFromCart();
  const [isVisible, setIsVisible] = useState(false); // Initially hidden

  const hasItemByUser = !!cartListByUser.data?.data?.find(
    (item: any) => item.productId === Number(searchParams?.id),
  );

  const hasItemByDevice = !!cartListByDeviceQuery.data?.data?.find(
    (item: any) => item.productId === Number(searchParams?.id),
  );

  const getProductQuantityByUser = cartListByUser.data?.data?.find(
    (item: any) => item.productId === Number(searchParams?.id),
  )?.quantity;

  const getProductQuantityByDevice = cartListByDeviceQuery.data?.data?.find(
    (item: any) => item.productId === Number(searchParams?.id),
  )?.quantity;

  const getProductVariantByUser = cartListByUser.data?.data?.find(
    (item: any) => item.productId === Number(searchParams?.id),
  )?.object;

  const getProductVariantByDevice = cartListByDeviceQuery.data?.data?.find(
    (item: any) => item.productId === Number(searchParams?.id),
  )?.object;

  const memoizedCartList = useMemo(() => {
    if (cartListByUser.data?.data) {
      setIsVisible(true);
      return cartListByUser.data?.data || [];
    } else if (cartListByDeviceQuery.data?.data) {
      return cartListByDeviceQuery.data?.data || [];
    }
    return [];
  }, [cartListByUser.data?.data, cartListByDeviceQuery.data?.data]);

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

  const onConfirmRemove = () => {
    const cartId =
      cartListByUser.data?.data?.find(
        (item: any) => item.productId == productDetails.id,
      )?.id ||
      cartListByDeviceQuery.data?.data?.find(
        (item: any) => item.productId == productDetails.id,
      )?.id;

    if (cartId) handleRemoveItemFromCart(cartId);
    setIsConfirmDialogOpen(false);
  };

  const onCancelRemove = () => {
    setGlobalQuantity(getProductQuantityByDevice || getProductQuantityByUser);
    setIsConfirmDialogOpen(false);
  };

  const selectProductVariant = (variant: any) => {
    setSelectedProductVariant(variant);
    if (getProductQuantityByDevice > 0 || getProductQuantityByUser > 0) {
      handleAddToCart(globalQuantity, "add", variant);
    }
  };

  const addToCartFromSharedLink = async () => {
    if (isShareLinkProcessed) return;

    if (
      productQueryById?.data?.generatedLinkDetail &&
      !cartListByUser?.isLoading &&
      !cartListByDeviceQuery?.isLoading
    ) {
      const item = memoizedCartList.find(
        (item: any) => item.productId == Number(searchParams?.id || ""),
      );
      if (
        !item ||
        (item &&
          item.sharedLinkId != productQueryById.data.generatedLinkDetail.id)
      ) {
        if (item) {
          await handleRemoveItemFromCart(item.id);
        }
        const minQuantity = productDetails?.product_productPrice?.length
          ? productDetails.product_productPrice[0]?.minQuantityPerCustomer
          : null;
        const quantity = item?.quantity || minQuantity || 1;
        handleAddToCart(quantity, "add");
        setIsShareLinkProcessed(true);
      }
    }
  };

  const productDetails = !otherSellerId
    ? productQueryById.data?.data
    : productQueryByOtherSeller.data?.data;
  const productInWishlist = !otherSellerId
    ? productQueryById.data?.inWishlist
    : productQueryByOtherSeller.data?.inWishlist;
  const otherSellerDetails = !otherSellerId
    ? productQueryById.data?.otherSeller
    : productQueryByOtherSeller.data?.otherSeller;

  const calculateTagIds = useMemo(
    () => productDetails?.productTags.map((item: any) => item.tagId).join(","),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [productDetails?.productTags?.length],
  );

  const [globalQuantity, setGlobalQuantity] = useState(0); // Global state

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
  const isBuygroup =
    productDetails?.product_productPrice?.[0]?.sellType === "BUYGROUP";
  const buygroupStartTime = getLocalTimestamp(
    productDetails?.product_productPrice?.[0]?.dateOpen,
    productDetails?.product_productPrice?.[0]?.startTime,
  );
  const buygroupEndTime = getLocalTimestamp(
    productDetails?.product_productPrice?.[0]?.dateClose,
    productDetails?.product_productPrice?.[0]?.endTime,
  );
  const now = Date.now();
  const saleNotStarted =
    isBuygroup && buygroupStartTime > 0 && now < buygroupStartTime;
  const saleExpired =
    isBuygroup && buygroupEndTime > 0 && now > buygroupEndTime;
  const canPurchase = !saleNotStarted && !saleExpired;

  useEffect(() => {
    const fetchProductVariant = async () => {
      const response = await getProductVariant.mutateAsync([
        productDetails?.product_productPrice?.[0]?.id,
      ]);
      const variants = response?.data?.[0]?.object || [];
      if (variants.length > 0) {
        let variantTypes = variants.map((item: any) => item.type);
        variantTypes = Array.from(new Set(variantTypes));
        setProductVariantTypes(variantTypes);
        setProductVariants(variants);
      }
    };

    if (!productQueryById?.isLoading) fetchProductVariant();
  }, [productQueryById?.data?.data]);

  // Track product view when product loads
  useEffect(() => {
    if (productQueryById.data?.data?.id && !productQueryById.isLoading) {
      const payload: any = {
        productId: productQueryById.data.data.id,
      };
      
      // Always send deviceId if user is not logged in
      if (!haveAccessToken && deviceId) {
        payload.deviceId = deviceId;
      }
      
      trackView.mutate(payload);
    }
  }, [productQueryById.data?.data?.id, productQueryById.isLoading, haveAccessToken, deviceId]);

  useEffect(() => {
    addToCartFromSharedLink();
  }, [
    productQueryById?.data?.generatedLinkDetail,
    memoizedCartList.length,
    cartListByDeviceQuery?.isLoading,
    cartListByUser?.isLoading,
  ]);

  useEffect(() => {
    setGlobalQuantity(
      getProductQuantityByUser || getProductQuantityByDevice || 0,
    );

    if (getProductVariantByDevice || getProductVariantByUser) {
      setSelectedProductVariant(
        getProductVariantByDevice || getProductVariantByUser,
      );
    } else {
      setSelectedProductVariant(
        productVariantTypes?.map((variantType: string) => {
          return productVariants?.find(
            (variant: any) => variant.type == variantType,
          );
        }),
      );
    }
  }, [
    cartListByUser.data?.data,
    cartListByDeviceQuery.data?.data,
    productVariants?.length,
  ]);

  const handleQuantity = async (quantity: number, action: "add" | "remove") => {
    setGlobalQuantity(quantity);
    const isAddedToCart = hasItemByUser || hasItemByDevice;
    if (isAddedToCart) {
      handleAddToCart(quantity, action);
    } else {
      const minQuantity =
        productDetails.product_productPrice?.[0]?.minQuantityPerCustomer;
      const maxQuantity =
        productDetails.product_productPrice?.[0]?.maxQuantityPerCustomer;

      if (minQuantity && minQuantity > quantity) {
        toast({
          description: t("min_quantity_must_be_n", { n: minQuantity }),
          variant: "danger",
        });
        return;
      }

      if (maxQuantity && maxQuantity < quantity) {
        toast({
          description: t("max_quantity_must_be_n", { n: maxQuantity }),
          variant: "danger",
        });
        return;
      }
    }
  };

  const handleAddToCart = async (
    quantity: number,
    actionType: "add" | "remove",
    productVariant?: any,
  ) => {
    const minQuantity =
      productDetails.product_productPrice?.[0]?.minQuantityPerCustomer;
    if (actionType == "add" && minQuantity && minQuantity > quantity) {
      toast({
        description: t("min_quantity_must_be_n", { n: minQuantity }),
        variant: "danger",
      });
      return;
    }

    if (actionType == "remove" && minQuantity && minQuantity > quantity) {
      toast({
        description: t("min_quantity_must_be_n", { n: minQuantity }),
        variant: "danger",
      });
      setIsConfirmDialogOpen(true);
      return;
    }

    const maxQuantity =
      productDetails.product_productPrice?.[0]?.maxQuantityPerCustomer;
    if (maxQuantity && maxQuantity < quantity) {
      toast({
        description: t("max_quantity_must_be_n", { n: maxQuantity }),
        variant: "danger",
      });
      return;
    }

    const sharedLinkId = productQueryById?.data?.generatedLinkDetail?.id;

    if (haveAccessToken) {
      if (!productDetails?.product_productPrice?.[0]?.id) {
        toast({
          title: t("something_went_wrong"),
          description: t("product_price_id_not_found"),
          variant: "danger",
        });
        return;
      }

      if (actionType == "add" && quantity == 0) {
        quantity = minQuantity ?? 1;
      }

      const response = await updateCartWithLogin.mutateAsync({
        productPriceId: productDetails?.product_productPrice?.[0]?.id,
        quantity,
        sharedLinkId,
        productVariant: productVariant || selectedProductVariant,
      });

      if (response.status) {
        setGlobalQuantity(quantity);
        toast({
          title:
            actionType == "add"
              ? t("item_added_to_cart")
              : t("item_removed_from_cart"),
          description: t("check_your_cart_for_more_details"),
          variant: "success",
        });
        setIsVisible(true); // Show the div when the button is clicked
        return response.status;
      }
    } else {
      if (!productDetails?.product_productPrice?.[0]?.id) {
        toast({
          title: t("something_went_wrong"),
          description: t("product_price_id_not_found"),
          variant: "danger",
        });
        return;
      }
      const response = await updateCartByDevice.mutateAsync({
        productPriceId: productDetails?.product_productPrice?.[0]?.id,
        quantity,
        deviceId,
        sharedLinkId,
        productVariant: productVariant || selectedProductVariant,
      });
      if (response.status) {
        setGlobalQuantity(quantity);
        toast({
          title:
            actionType == "add"
              ? t("item_added_to_cart")
              : t("item_removed_from_cart"),
          description: t("check_your_cart_for_more_details"),
          variant: "success",
        });
        setIsVisible(true); // Show the div when the button is clicked
        return response.status;
      }
    }
  };

  const handleCartPage = async () => {
    if (
      (getProductQuantityByUser || 0) >= 1 ||
      (getProductQuantityByDevice || 0) >= 1
    ) {
      router.push("/cart");
      return;
    }

    let quantity = globalQuantity;
    if (quantity == 0) {
      const minQuantity = productDetails?.product_productPrice?.length
        ? productDetails.product_productPrice[0]?.minQuantityPerCustomer
        : null;
      quantity = minQuantity || 1;
    }
    const response = await handleAddToCart(quantity, "add");
    if (response) {
      setTimeout(() => {
        router.push("/cart");
      }, 2000);
    }
  };

  const handleCheckoutPage = async () => {
    if (
      (getProductQuantityByUser || 0) >= 1 ||
      (getProductQuantityByDevice || 0) >= 1
    ) {
      router.push("/checkout");
      return;
    }

    let quantity = globalQuantity;
    if (quantity == 0) {
      const minQuantity = productDetails?.product_productPrice?.length
        ? productDetails.product_productPrice[0]?.minQuantityPerCustomer
        : null;
      quantity = minQuantity || 1;
    }
    const response = await handleAddToCart(quantity, "add");
    if (response) {
      setTimeout(() => {
        router.push("/checkout");
      }, 2000);
    }
  };

  const handelOpenCartLayout = () => {
    setIsVisible(true); // Show the div when the button is clicked
  };

  const handleDeleteFromWishlist = async () => {
    const response = await deleteFromWishlist.mutateAsync({
      productId: Number(searchParams?.id),
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
          { productId: searchParams?.id, userId: me.data?.data?.id },
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

  const handleAddToWishlist = async () => {
    if (!!productInWishlist) {
      handleDeleteFromWishlist();
      return;
    }

    const response = await addToWishlist.mutateAsync({
      productId: Number(searchParams?.id),
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
          { productId: searchParams?.id, userId: me.data?.data?.id },
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
    if (type) setActiveTab(type);
  }, [type]);

  useEffect(() => {
    if (accessToken) {
      setHaveAccessToken(true);
    } else {
      setHaveAccessToken(false);
    }
  }, [accessToken]);

  useEffect(() => {}, []);

  return (
    <>
      <title dir={langDir} translate="no">{`${t("store")} | Ultrasooq`}</title>

      {/* Modern Product Details Page */}
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Main Product Section */}
        <div className="bg-card">
          <div className="container mx-auto max-w-7xl px-4 py-8 lg:px-8">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
              {/* Product Images - Left Side */}
              <div className="lg:col-span-6">
                <div className="sticky top-4">
                  <ProductImagesCard
                    productDetails={productDetails}
                    onProductUpdateSuccess={handleProductUpdateSuccess}
                    onAdd={() => handleAddToCart(globalQuantity, "add")}
                    onToCart={async () => {
                      const minQuantity =
                        productDetails.product_productPrice?.[0]
                          ?.minQuantityPerCustomer;
                      const resp = await handleAddToCart(
                        globalQuantity || minQuantity || 1,
                        "add",
                      );
                      if (resp === true) router.push("/checkout");
                    }}
                    onToCheckout={handleCheckoutPage}
                    openCartCard={handelOpenCartLayout}
                    hasItem={hasItemByUser || hasItemByDevice}
                    isLoading={
                      !(
                        productQueryById.isFetched ||
                        productQueryByOtherSeller.isFetched
                      )
                    }
                    onWishlist={handleAddToWishlist}
                    haveAccessToken={haveAccessToken}
                    inWishlist={!!productInWishlist}
                    askForPrice={
                      productDetails?.product_productPrice?.[0]?.askForPrice
                    }
                    isAddedToCart={hasItemByUser || hasItemByDevice}
                    cartQuantity={globalQuantity}
                    additionalMarketingImages={
                      productDetails?.additionalMarketingImages
                    }
                    // Buygroup sale timing
                    saleNotStarted={saleNotStarted}
                    saleExpired={saleExpired}
                  />
                </div>
              </div>

              {/* Product Info - Right Side */}
              <div className="lg:col-span-6">
                <ProductDescriptionCard
                  productId={
                    searchParams?.id ? (searchParams?.id as string) : ""
                  }
                  productName={productDetails?.productName}
                  productType={productDetails?.productType}
                  brand={productDetails?.brand?.brandName}
                  productPrice={productDetails?.productPrice}
                  offerPrice={
                    productDetails?.product_productPrice?.[0]?.offerPrice
                  }
                  skuNo={productDetails?.skuNo}
                  category={productDetails?.category?.name}
                  categoryId={productDetails?.categoryId}
                  categoryLocation={productDetails?.categoryLocation}
                  consumerType={
                    productDetails?.product_productPrice?.[0]?.consumerType
                  }
                  productTags={productDetails?.productTags}
                  productShortDescription={
                    productDetails?.product_productShortDescription
                  }
                  productQuantity={
                    globalQuantity ||
                    getProductQuantityByUser ||
                    getProductQuantityByDevice
                  }
                  onQuantityChange={handleQuantity}
                  productReview={productDetails?.productReview}
                  onAdd={handleAddToCart}
                  onBuyNow={handleCheckoutPage}
                  isLoading={
                    !otherSellerId && !otherProductId
                      ? !productQueryById.isFetched
                      : !productQueryByOtherSeller.isFetched
                  }
                  soldBy={
                    productDetails?.product_productPrice?.[0]?.adminDetail
                      ?.accountName ||
                    productDetails?.product_productPrice?.[0]?.adminDetail
                      ?.userProfile?.companyName ||
                    `${productDetails?.product_productPrice?.[0]?.adminDetail?.firstName || ""} ${productDetails?.product_productPrice?.[0]?.adminDetail?.lastName || ""}`.trim() ||
                    "Unknown Seller"
                  }
                  soldByTradeRole={
                    productDetails?.product_productPrice?.[0]?.adminDetail
                      ?.tradeRole
                  }
                  userId={me.data?.data?.id}
                  sellerId={
                    productDetails?.product_productPrice?.[0]?.adminDetail?.id
                  }
                  adminId={
                    productDetails?.product_productPrice?.[0]?.adminDetail?.id
                  }
                  onOpenChat={() => setIsChatOpen(true)}
                  haveOtherSellers={!!otherSellerDetails?.length}
                  productProductPrice={
                    productDetails?.product_productPrice?.[0]?.productPrice
                  }
                  consumerDiscount={
                    productDetails?.product_productPrice?.[0]?.consumerDiscount
                  }
                  consumerDiscountType={
                    productDetails?.product_productPrice?.[0]
                      ?.consumerDiscountType
                  }
                  vendorDiscount={
                    productDetails?.product_productPrice?.[0]?.vendorDiscount
                  }
                  vendorDiscountType={
                    productDetails?.product_productPrice?.[0]
                      ?.vendorDiscountType
                  }
                  askForPrice={
                    productDetails?.product_productPrice?.[0]?.askForPrice
                  }
                  minQuantity={
                    productDetails?.product_productPrice?.[0]
                      ?.minQuantityPerCustomer
                  }
                  maxQuantity={
                    productDetails?.product_productPrice?.[0]
                      ?.maxQuantityPerCustomer
                  }
                  otherSellerDetails={otherSellerDetails}
                  productPriceArr={productDetails?.product_productPrice}
                  productVariantTypes={productVariantTypes}
                  productVariants={productVariants}
                  selectedProductVariant={selectedProductVariant}
                  selectProductVariant={selectProductVariant}
                  // Dropship marketing content
                  isDropshipped={productDetails?.isDropshipped}
                  customMarketingContent={
                    productDetails?.customMarketingContent
                  }
                  additionalMarketingImages={
                    productDetails?.additionalMarketingImages
                  }
                  // Buygroup sale timing
                  isBuygroup={isBuygroup}
                  saleNotStarted={saleNotStarted}
                  saleExpired={saleExpired}
                  buygroupStartTime={buygroupStartTime}
                  buygroupEndTime={buygroupEndTime}
                  sellType={productDetails?.product_productPrice?.[0]?.sellType}
                  dateOpen={productDetails?.product_productPrice?.[0]?.dateOpen}
                  startTime={
                    productDetails?.product_productPrice?.[0]?.startTime
                  }
                />
              </div>
            </div>
          </div>
        </div>

        {/* Product Details & Related Sections */}
        <div className="container mx-auto max-w-7xl px-4 py-8 lg:px-8">
          <div className="grid grid-cols-1 gap-8">
            {/* Main Content - Tabs */}
            <div className="w-full">
              <Tabs onValueChange={(e) => setActiveTab(e)} value={activeTab}>
                {/* Clean Modern Tabs */}
                <div className="bg-card">
                  <TabsList className="flex w-full items-center justify-start gap-1 bg-transparent p-0">
                    <TabsTrigger
                      value="description"
                      className="relative rounded-none border-0 border-b-4 border-b-transparent bg-transparent px-6 py-3 text-sm font-bold whitespace-nowrap text-muted-foreground transition-all duration-300 hover:border-b-gray-300 hover:bg-muted hover:text-foreground data-[state=active]:border-0 data-[state=active]:border-b-orange-500 data-[state=active]:bg-warning/5/30 data-[state=active]:font-bold data-[state=active]:text-warning sm:px-8 sm:py-4 sm:text-base lg:px-10 lg:py-5 lg:text-lg"
                      dir={langDir}
                      translate="no"
                    >
                      <span className="flex items-center gap-3">
                        <svg
                          className="h-5 w-5 flex-shrink-0 sm:h-6 sm:w-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <span className="hidden sm:inline">
                          {t("description")}
                        </span>
                        <span className="sm:hidden">Desc</span>
                      </span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="specification"
                      className="relative rounded-none border-0 border-b-4 border-b-transparent bg-transparent px-6 py-3 text-sm font-bold whitespace-nowrap text-muted-foreground transition-all duration-300 hover:border-b-gray-300 hover:bg-muted hover:text-foreground data-[state=active]:border-0 data-[state=active]:border-b-orange-500 data-[state=active]:bg-warning/5/30 data-[state=active]:font-bold data-[state=active]:text-warning sm:px-8 sm:py-4 sm:text-base lg:px-10 lg:py-5 lg:text-lg"
                      dir={langDir}
                      translate="no"
                    >
                      <span className="flex items-center gap-3">
                        <svg
                          className="h-5 w-5 flex-shrink-0 sm:h-6 sm:w-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                          />
                        </svg>
                        <span className="hidden sm:inline">
                          {t("specification")}
                        </span>
                        <span className="sm:hidden">Spec</span>
                      </span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="reviews"
                      className="relative rounded-none border-0 border-b-4 border-b-transparent bg-transparent px-6 py-3 text-sm font-bold whitespace-nowrap text-muted-foreground transition-all duration-300 hover:border-b-gray-300 hover:bg-muted hover:text-foreground data-[state=active]:border-0 data-[state=active]:border-b-orange-500 data-[state=active]:bg-warning/5/30 data-[state=active]:font-bold data-[state=active]:text-warning sm:px-8 sm:py-4 sm:text-base lg:px-10 lg:py-5 lg:text-lg"
                      dir={langDir}
                      translate="no"
                    >
                      <span className="flex items-center gap-3">
                        <svg
                          className="h-5 w-5 flex-shrink-0 sm:h-6 sm:w-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                          />
                        </svg>
                        <span className="hidden sm:inline">{t("reviews")}</span>
                        <span className="sm:hidden">Reviews</span>
                      </span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="qanda"
                      className="relative rounded-none border-0 border-b-4 border-b-transparent bg-transparent px-6 py-3 text-sm font-bold whitespace-nowrap text-muted-foreground transition-all duration-300 hover:border-b-gray-300 hover:bg-muted hover:text-foreground data-[state=active]:border-0 data-[state=active]:border-b-orange-500 data-[state=active]:bg-warning/5/30 data-[state=active]:font-bold data-[state=active]:text-warning sm:px-8 sm:py-4 sm:text-base lg:px-10 lg:py-5 lg:text-lg"
                      dir={langDir}
                      translate="no"
                    >
                      <span className="flex items-center gap-3">
                        <svg
                          className="h-5 w-5 flex-shrink-0 sm:h-6 sm:w-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span className="hidden sm:inline">
                          {t("questions")}
                        </span>
                        <span className="sm:hidden">Q&A</span>
                      </span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="vendor"
                      className="relative rounded-none border-0 border-b-4 border-b-transparent bg-transparent px-6 py-3 text-sm font-bold whitespace-nowrap text-muted-foreground transition-all duration-300 hover:border-b-gray-300 hover:bg-muted hover:text-foreground data-[state=active]:border-0 data-[state=active]:border-b-orange-500 data-[state=active]:bg-warning/5/30 data-[state=active]:font-bold data-[state=active]:text-warning sm:px-8 sm:py-4 sm:text-base lg:px-10 lg:py-5 lg:text-lg"
                      dir={langDir}
                      translate="no"
                    >
                      <span className="flex items-center gap-3">
                        <svg
                          className="h-5 w-5 flex-shrink-0 sm:h-6 sm:w-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                          />
                        </svg>
                        <span className="hidden sm:inline">{t("vendor")}</span>
                        <span className="sm:hidden">Vendor</span>
                      </span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="services"
                      className="relative rounded-none border-0 border-b-4 border-b-transparent bg-transparent px-6 py-3 text-sm font-bold whitespace-nowrap text-muted-foreground transition-all duration-300 hover:border-b-gray-300 hover:bg-muted hover:text-foreground data-[state=active]:border-0 data-[state=active]:border-b-orange-500 data-[state=active]:bg-warning/5/30 data-[state=active]:font-bold data-[state=active]:text-warning sm:px-8 sm:py-4 sm:text-base lg:px-10 lg:py-5 lg:text-lg"
                      dir={langDir}
                      translate="no"
                    >
                      <span className="flex items-center gap-3">
                        <svg
                          className="h-5 w-5 flex-shrink-0 sm:h-6 sm:w-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6"
                          />
                        </svg>
                        <span className="hidden sm:inline">
                          {t("services")}
                        </span>
                        <span className="sm:hidden">Serv</span>
                      </span>
                    </TabsTrigger>
                  </TabsList>
                </div>
                {/* Tab Content - Description */}
                <TabsContent value="description" className="mt-0">
                  <div className="min-h-[400px] p-8 sm:p-10 lg:p-12">
                    {/* For dropship products, show marketing text if available, otherwise show regular description */}
                    {(productDetails?.isDropshipped &&
                      productDetails?.customMarketingContent?.marketingText) ||
                    productDetails?.description ? (
                      <div className="space-y-4">
                        <div className="prose prose-gray max-w-none">
                          {(() => {
                            // For dropship products, prioritize marketing text
                            const desc =
                              productDetails?.isDropshipped &&
                              productDetails?.customMarketingContent
                                ?.marketingText
                                ? productDetails?.customMarketingContent
                                    ?.marketingText
                                : productDetails?.description;

                            // If it's already an object, use it directly
                            if (typeof desc === "object" && desc !== null) {
                              return (
                                <PlateEditor
                                  description={desc}
                                  readOnly={true}
                                  fixedToolbar={false}
                                />
                              );
                            }

                            // If it's a string, handle dropship marketing text or try to parse as JSON
                            if (typeof desc === "string") {
                              // For dropship marketing text, display as simple text
                              if (
                                productDetails?.isDropshipped &&
                                productDetails?.customMarketingContent
                                  ?.marketingText
                              ) {
                                return (
                                  <div
                                    className="leading-relaxed text-muted-foreground"
                                    dir={langDir}
                                    translate="no"
                                  >
                                    {desc}
                                  </div>
                                );
                              }
                              try {
                                // First try to parse as JSON
                                const parsed = JSON.parse(desc);

                                // Extract text content from the parsed structure
                                const extractText = (node: any): string => {
                                  if (typeof node === "string") return node;
                                  if (node?.text) return node.text;
                                  if (
                                    node?.children &&
                                    Array.isArray(node.children)
                                  ) {
                                    return node.children
                                      .map(extractText)
                                      .join("");
                                  }
                                  return "";
                                };

                                const textContent = parsed
                                  .map(extractText)
                                  .join("\n\n");

                                // If we have text content, display it as HTML
                                if (textContent.trim()) {
                                  return (
                                    <div
                                      className="leading-relaxed text-muted-foreground"
                                      dir={langDir}
                                      translate="no"
                                      dangerouslySetInnerHTML={{
                                        __html: sanitizeHtml(textContent.replace(
                                          /\n/g,
                                          "<br/>",
                                        )),
                                      }}
                                    />
                                  );
                                }

                                // Fallback to PlateEditor with parsed content
                                return (
                                  <PlateEditor
                                    description={parsed}
                                    readOnly={true}
                                    fixedToolbar={false}
                                  />
                                );
                              } catch (jsonError) {
                                // If JSON parsing fails, use handleDescriptionParse
                                try {
                                  const parsed = handleDescriptionParse(desc);
                                  return (
                                    <PlateEditor
                                      description={parsed}
                                      readOnly={true}
                                      fixedToolbar={false}
                                    />
                                  );
                                } catch (error) {
                                  return (
                                    <div
                                      className="text-muted-foreground"
                                      dir={langDir}
                                      translate="no"
                                    >
                                      {desc}
                                    </div>
                                  );
                                }
                              }
                            }

                            // Fallback
                            return (
                              <div
                                className="text-muted-foreground"
                                dir={langDir}
                                translate="no"
                              >
                                {String(desc)}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    ) : (
                      <div className="flex min-h-[200px] flex-col items-center justify-center text-center">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                          <svg
                            className="h-8 w-8 text-muted-foreground"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        </div>
                        <h3
                          className="mb-2 text-lg font-medium text-foreground"
                          dir={langDir}
                          translate="no"
                        >
                          {productDetails?.isDropshipped
                            ? "Dropship Product"
                            : t("no_description_available")}
                        </h3>
                        <p
                          className="max-w-md text-muted-foreground"
                          dir={langDir}
                          translate="no"
                        >
                          {productDetails?.isDropshipped
                            ? "This is a dropship product. Description is managed by the dropship vendor."
                            : t("product_description_will_be_added_soon")}
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Tab Content - Specification */}
                <TabsContent value="specification" className="mt-0">
                  <div className="min-h-[400px] p-8 sm:p-10 lg:p-12">
                    {!productDetails?.product_productSpecification?.length ||
                    productDetails?.isDropshipped ? (
                      <div className="flex min-h-[200px] flex-col items-center justify-center text-center">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                          <svg
                            className="h-8 w-8 text-muted-foreground"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                            />
                          </svg>
                        </div>
                        <h3
                          className="mb-2 text-lg font-medium text-foreground"
                          dir={langDir}
                          translate="no"
                        >
                          {productDetails?.isDropshipped
                            ? "Dropship Product"
                            : t("no_specification_available")}
                        </h3>
                        <p
                          className="max-w-md text-muted-foreground"
                          dir={langDir}
                          translate="no"
                        >
                          {productDetails?.isDropshipped
                            ? "This is a dropship product. Specifications are managed by the dropship vendor."
                            : t("specifications_will_be_added_soon")}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <h2
                          className="text-xl font-semibold text-foreground"
                          dir={langDir}
                          translate="no"
                        >
                          {t("technical_specifications")}
                        </h2>
                        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                          <div className="divide-y divide-border">
                            {productDetails?.product_productSpecification?.map(
                              (
                                item: {
                                  id: number;
                                  label: string;
                                  specification: string;
                                },
                                index: number,
                              ) => (
                                <div
                                  key={item?.id}
                                  className={`p-6 ${index % 2 === 0 ? "bg-card" : "bg-muted/50"}`}
                                >
                                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                                    <dt className="text-sm font-semibold text-foreground">
                                      {item?.label}
                                    </dt>
                                    <dd className="text-sm text-muted-foreground">
                                      {item?.specification}
                                    </dd>
                                  </div>
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Tab Content - Reviews */}
                <TabsContent value="reviews" className="mt-0">
                  <div className="min-h-[400px] p-8 sm:p-10 lg:p-12">
                    <div className="space-y-4">
                      <h2
                        className="text-xl font-semibold text-foreground"
                        dir={langDir}
                        translate="no"
                      >
                        {t("customer_reviews")}
                      </h2>
                      <ReviewSection
                        productId={searchParams?.id as string}
                        hasAccessToken={haveAccessToken}
                        productReview={productDetails?.productReview}
                        isCreator={
                          me?.data?.data?.id === productDetails?.adminId
                        }
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Tab Content - Q&A */}
                <TabsContent value="qanda" className="mt-0">
                  <div className="min-h-[400px] p-8 sm:p-10 lg:p-12">
                    <QuestionsAnswersSection
                      hasAccessToken={haveAccessToken}
                      productId={searchParams?.id as string}
                    />
                  </div>
                </TabsContent>

                {/* Tab Content - Vendor */}
                <TabsContent value="vendor" className="mt-0">
                  <div className="min-h-[400px] p-8 sm:p-10 lg:p-12">
                    <div className="space-y-4">
                      <h2
                        className="text-xl font-semibold text-foreground"
                        dir={langDir}
                        translate="no"
                      >
                        {t("vendor_information")}
                      </h2>
                      <VendorSection
                        adminId={
                          productDetails?.product_productPrice?.[0]?.adminId
                        }
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Tab Content - Services */}
                <TabsContent value="services" className="mt-0">
                  <div className="min-h-[400px] p-8 sm:p-10 lg:p-12">
                    <div className="space-y-4">
                      <h2
                        className="text-xl font-semibold text-foreground"
                        dir={langDir}
                        translate="no"
                      >
                        {t("related_services")}
                      </h2>
                      <RelatedServices
                        productId={Number(searchParams?.id) || 0}
                        productPriceId={
                          productDetails?.product_productPrice?.[0]?.id
                        }
                        productCategoryId={String(
                          productDetails?.categoryId || "",
                        )}
                        cartList={memoizedCartList}
                        productCartId={
                          memoizedCartList.find(
                            (item: any) =>
                              item.productId == Number(searchParams?.id),
                          )?.id
                        }
                        isChildCart={
                          !!memoizedCartList
                            ?.filter(
                              (c: any) =>
                                c.serviceId && c.cartProductServices?.length,
                            )
                            ?.find((c: any) => {
                              return !!c.cartProductServices.find(
                                (r: any) =>
                                  r.relatedCartType == "PRODUCT" &&
                                  r.productId == searchParams?.id,
                              );
                            })
                        }
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar - Related Products - COMMENTED OUT */}
            {/* <div className="lg:col-span-4">
              <div className="sticky top-4">
                <div className="rounded-xl bg-card border border-border shadow-sm">
                  <div className="border-b border-border px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-warning/10">
                        <svg className="h-4 w-4 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
            </div>
                      <h3 className="text-lg font-semibold text-foreground" dir={langDir} translate="no">
                        {t("related_products")}
                      </h3>
                    </div>
                  </div>
                  <div className="p-4">
                <SameBrandSection
                  productDetails={productDetails}
                  productId={searchParams?.id as string}
                />
              </div>
            </div>
          </div>
            </div> */}
          </div>
        </div>

        {/* Related Products Section */}
        <RelatedProductsSection
          calculateTagIds={calculateTagIds}
          productId={searchParams?.id as string}
        />
      </div>

      <Footer />

      {/* Chat Drawer */}
      {productDetails &&
        productDetails?.product_productPrice?.[0]?.adminDetail?.id &&
        me.data?.data?.id !==
          productDetails?.product_productPrice?.[0]?.adminDetail?.id && (
          <Drawer open={isChatOpen} onOpenChange={setIsChatOpen}>
            <DrawerContent className="flex h-[90vh] max-h-[90vh] flex-col">
              <DrawerHeader className="flex-shrink-0 border-b border-border px-4 py-3">
                <DrawerTitle className="flex items-center justify-between">
                  <span
                    className="flex items-center gap-2 text-lg font-semibold"
                    dir={langDir}
                    translate="no"
                  >
                    <svg
                      className="h-5 w-5 text-primary"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                    {t("chat_with_seller") || "Chat with Seller"}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsChatOpen(false)}
                    className="h-8 w-8 rounded-full p-0"
                  >
                    <IoCloseSharp size={18} />
                  </Button>
                </DrawerTitle>
              </DrawerHeader>
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <ProductChat productId={Number(searchParams?.id)} />
              </div>
            </DrawerContent>
          </Drawer>
        )}

      {/* Modern Confirmation Dialog */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={handleConfirmDialog}>
        <DialogContent
          className="gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-md"
          ref={confirmDialogRef}
        >
          {/* Dialog Header */}
          <div
            className="flex items-center justify-between border-b border-border px-6 py-4"
            dir={langDir}
          >
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <svg
                className="h-5 w-5 text-destructive"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <span translate="no">{t("confirm_removal")}</span>
            </DialogTitle>
            <Button
              onClick={onCancelRemove}
              className="h-8 w-8 rounded-full bg-muted p-0 text-muted-foreground shadow-none hover:bg-muted"
            >
              <IoCloseSharp size={18} />
            </Button>
          </div>

          {/* Dialog Content */}
          <div className="px-6 py-6">
            <p
              className="mb-6 text-center text-muted-foreground"
              dir={langDir}
              translate="no"
            >
              {t("confirm_remove_item_message")}
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button
                type="button"
                onClick={onCancelRemove}
                className="min-w-[120px] rounded-lg border-2 border-border bg-card px-6 py-2.5 font-medium text-muted-foreground shadow-sm transition-all hover:border-border hover:bg-muted"
                dir={langDir}
                translate="no"
              >
                {t("cancel")}
              </Button>
              <Button
                type="button"
                onClick={onConfirmRemove}
                className="min-w-[120px] rounded-lg bg-gradient-to-r from-destructive to-destructive/90 px-6 py-2.5 font-medium text-white shadow-md transition-all hover:from-destructive hover:to-destructive/80 hover:shadow-lg active:scale-95"
                dir={langDir}
                translate="no"
              >
                {t("remove")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProductDetailsPage;
