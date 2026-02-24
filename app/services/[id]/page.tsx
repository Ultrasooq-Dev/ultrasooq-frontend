"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useCartListByDevice,
  useCartListByUserId,
  useDeleteCartItem,
  useDeleteServiceFromCart,
} from "@/apis/queries/cart.queries";
import { useToast } from "@/components/ui/use-toast";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { getCookie } from "cookies-next";
import { ULTRASOOQ_TOKEN_KEY } from "@/utils/constants";
import { getOrCreateDeviceId, handleDescriptionParse } from "@/utils/helper";
import ReviewSection from "@/components/shared/ReviewSection";
import QuestionsAnswersSection from "@/components/modules/serviceDetails/QuestionsAnswersSection";
import {
  useAddToWishList,
  useDeleteFromWishList,
} from "@/apis/queries/wishlist.queries";
import { useMe } from "@/apis/queries/user.queries";
import { useQueryClient } from "@tanstack/react-query";
import Footer from "@/components/shared/Footer";
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
import {
  useAddServiceToCart,
  useServiceById,
} from "@/apis/queries/services.queries";
import ServiceImagesCard from "@/components/modules/serviceDetails/ServiceImagesCard";
import ServiceDescriptionCard from "@/components/modules/serviceDetails/ServiceDescriptionCard";
import RelatedProducts from "@/components/modules/serviceDetails/RelatedProducts";

const ServiceDetailsPage = () => {
  const t = useTranslations();
  const { langDir } = useAuth();
  const queryClient = useQueryClient();
  const searchParams = useParams();
  const searchQuery = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const addToCartQuery = useAddServiceToCart();
  const deviceId = getOrCreateDeviceId() || "";
  const [activeTab, setActiveTab] = useState("description");
  const [haveAccessToken, setHaveAccessToken] = useState(false);
  const accessToken = getCookie(ULTRASOOQ_TOKEN_KEY);
  const type = searchQuery?.get("type");
  const [isUpdatingCart, setIsUpdatingCart] = useState<boolean>(false);
  const [selectedFeatures, setSelectedFeatures] = useState<any[]>([]);

  const toggleFeature = (id: number, quantity: number, checked: boolean) => {
    const existingFeature = selectedFeatures.find((item) => item.id === id);

    if (!checked && existingFeature) {
      const cartItem = memoizedCartList
        ?.find(
          (item: any) =>
            item.cartType == "SERVICE" &&
            item.serviceId == Number(searchParams?.id),
        )
        ?.cartServiceFeatures?.find(
          (feature: any) => feature.serviceFeatureId == id,
        );

      if (cartItem) {
        handleRemoveServiceFromCart(cartItem.cartId, cartItem.id);
        setSelectedFeatures((prev: any[]) =>
          prev.filter((item) => item.id !== id),
        );
        return;
      }
    }

    setSelectedFeatures((prev) => {
      if (checked) {
        // Add or update the feature if checked
        if (existingFeature) {
          return prev.map((item) =>
            item.id === id
              ? { ...item, quantity: Math.max(1, quantity) }
              : item,
          );
        }
        // return [...prev, { id, quantity: Math.max(1, quantity) }];
        return [
          ...prev,
          {
            id,
            quantity: Math.max(1, quantity),
            date: "", // or new Date() if you want to default to today
            time: "",
          },
        ];
      } else {
        // Remove the feature if unchecked
        return prev.filter((item) => item.id !== id);
      }
    });
    setIsUpdatingCart(true);
  };
  const updateFeatureField = (id: number, field: string, value: any) => {
    setSelectedFeatures((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };
  const updateQuantity = (id: number, quantity: number) => {
    setSelectedFeatures((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item,
      ),
    );
    setIsUpdatingCart(true);
  };

  const incrementQuantity = (id: number) => {
    setSelectedFeatures((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item,
      ),
    );
    setIsUpdatingCart(true);
  };

  const decrementQuantity = (id: number) => {
    const quantity =
      selectedFeatures.find((item: any) => item.id == id)?.quantity || 1;
    if (quantity - 1 >= 1) {
      setSelectedFeatures((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, quantity: Math.max(1, item.quantity - 1) }
            : item,
        ),
      );
      setIsUpdatingCart(true);
    }
  };

  const [isConfirmDialogOpen, setIsConfirmDialogOpen] =
    useState<boolean>(false);
  const handleConfirmDialog = () =>
    setIsConfirmDialogOpen(!isConfirmDialogOpen);
  const confirmDialogRef = useRef(null);
  const [isClickedOutsideConfirmDialog] = useClickOutside(
    [confirmDialogRef],
    (event) => {
      onCancelRemove();
    },
  );

  const me = useMe();
  const serviceQueryById = useServiceById(
    {
      serviceid: searchParams?.id ? (searchParams?.id as string) : "",
    },
    !!searchParams?.id,
  );

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

  const addToWishlist = useAddToWishList();
  const deleteFromWishlist = useDeleteFromWishList();
  const deleteCartItem = useDeleteCartItem();
  const deleteServiceFromCart = useDeleteServiceFromCart();

  const [isVisible, setIsVisible] = useState(false); // Initially hidden

  const hasItemByUser = !!cartListByUser.data?.data?.find(
    (item: any) => item.serviceId === Number(searchParams?.id),
  );

  const hasItemByDevice = !!cartListByDeviceQuery.data?.data?.find(
    (item: any) => item.serviceId === Number(searchParams?.id),
  );

  const getProductQuantityByUser = cartListByUser.data?.data?.find(
    (item: any) => item.serviceId === Number(searchParams?.id),
  )?.quantity;

  const getProductQuantityByDevice = cartListByDeviceQuery.data?.data?.find(
    (item: any) => item.serviceId === Number(searchParams?.id),
  )?.quantity;

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
    setIsConfirmDialogOpen(false);
  };

  const onCancelRemove = () => {
    setIsConfirmDialogOpen(false);
  };

  const serviceDetails = serviceQueryById.data?.data;
  const productInWishlist = serviceQueryById.data?.inWishlist;

  const [globalQuantity, setGlobalQuantity] = useState(0); // Global state

  useEffect(() => {
    setGlobalQuantity(
      getProductQuantityByUser || getProductQuantityByDevice || 0,
    );
    const serviceId = Number(searchParams?.id || "");
    const features =
      (
        cartListByUser.data?.data ||
        cartListByDeviceQuery.data?.data ||
        []
      )?.find(
        (item: any) =>
          item.cartType == "SERVICE" && item.serviceId == serviceId,
      )?.cartServiceFeatures || [];

    setSelectedFeatures(
      features.map((item: any) => {
        const bookingDateTime = item?.bookingDateTime;
        let date: any = "";
        let time = "";

        if (bookingDateTime) {
          const dateObj = new Date(bookingDateTime);
          date = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
          time = dateObj.toISOString().split("T")[1]?.substring(0, 5); // 'HH:MM'
        }
        return {
          id: item.serviceFeatureId,
          quantity: item.quantity,
          date,
          time
        }
      })
    );
  }, [cartListByUser.data?.data, cartListByDeviceQuery.data?.data]);

  const handleAddToCart = async () => {
    const payload: any = {
      serviceId: Number(searchParams?.id),
      features: selectedFeatures.map((f) => {
        return {
          serviceFeatureId: f.id,
          quantity: f.quantity,
          bookingDateTime:
            f.date && f.time
              ? new Date(
                `${f.date instanceof Date ? f.date.toISOString().split('T')[0] : f.date}T${f.time}:00Z`
              ).toISOString()
              : undefined,
        };
      }),
    };
    const response = await addToCartQuery.mutateAsync(payload);
    setIsUpdatingCart(false);
    if ((response as any).success) {
      toast({
        title: t("service_added_to_cart"),
        description: response.message,
        variant: "success",
      });
    } else {
      toast({
        title: t("failed_to_add"),
        description: response.message,
        variant: "danger",
      });
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
      const minQuantity = serviceDetails?.product_productPrice?.length
        ? serviceDetails.product_productPrice[0]?.minQuantityPerCustomer
        : null;
      quantity = minQuantity || 1;
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
      const minQuantity = serviceDetails?.product_productPrice?.length
        ? serviceDetails.product_productPrice[0]?.minQuantityPerCustomer
        : null;
      quantity = minQuantity || 1;
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

  useEffect(() => {
    if ((hasItemByUser || hasItemByDevice) && isUpdatingCart) {
      handleAddToCart();
    }
  }, [selectedFeatures, isUpdatingCart]);

  return (
    <>
      <title dir={langDir} translate="no">{`${t("store")} | Ultrasooq`}</title>
      <div className="body-content-s1 relative">
        <div className="product-view-s1-left-right type2">
          <div className="container m-auto px-3">
            <ServiceImagesCard
              selectedFeatures={selectedFeatures}
              addingToCart={addToCartQuery?.isPending}
              serviceDetails={serviceDetails}
              onProductUpdateSuccess={handleProductUpdateSuccess} // Pass to child
              onAdd={() => handleAddToCart()}
              onToCart={() => handleAddToCart()}
              onToCheckout={handleCheckoutPage}
              openCartCard={handelOpenCartLayout}
              hasItem={hasItemByUser || hasItemByDevice}
              isLoading={serviceQueryById?.isLoading}
              onWishlist={handleAddToWishlist}
              haveAccessToken={haveAccessToken}
              inWishlist={!!productInWishlist}
              askForPrice={
                serviceDetails?.product_productPrice?.[0]?.askForPrice
              }
              isAddedToCart={hasItemByUser || hasItemByDevice}
              cartQuantity={globalQuantity}
            />
            <ServiceDescriptionCard
              selectedFeatures={selectedFeatures}
              toggleFeature={toggleFeature}
              updateFeatureField={updateFeatureField}
              decrementQuantity={decrementQuantity}
              incrementQuantity={incrementQuantity}
              updateQuantity={updateQuantity}
              serviceDetails={serviceDetails}
              productReview={serviceDetails?.productReview}
              isLoading={serviceQueryById?.isLoading}
            />
          </div>
        </div>
        <div className="product-view-s1-left-details-with-right-suggestion">
          <div className="container m-auto px-3">
            <div className="product-view-s1-left-details">
              <div className="w-full">
                <Tabs onValueChange={(e) => setActiveTab(e)} value={activeTab}>
                  <TabsList className="flex h-auto w-full flex-wrap rounded-none bg-transparent px-0 sm:grid sm:min-h-[80px] sm:grid-cols-6">
                    <TabsTrigger
                      value="description"
                      className="w-[50%] rounded-none border-b-2 border-b-transparent bg-[#F8F8F8]! font-semibold text-[#71717A]! data-[state=active]:border-b-2! data-[state=active]:border-b-dark-orange! data-[state=active]:text-dark-orange! data-[state=active]:shadow-none! sm:w-auto md:w-auto md:py-2 md:text-xs lg:w-full lg:py-4 lg:text-base"
                      dir={langDir}
                      translate="no"
                    >
                      {t("description")}
                    </TabsTrigger>
                    <TabsTrigger
                      value="vendor"
                      className="w-[50%] rounded-none border-b-2 border-b-transparent bg-[#F8F8F8]! font-semibold text-[#71717A]! data-[state=active]:border-b-2! data-[state=active]:border-b-dark-orange! data-[state=active]:text-dark-orange! data-[state=active]:shadow-none! sm:w-auto md:w-auto md:py-2 md:text-xs lg:w-full lg:py-4 lg:text-base"
                      dir={langDir}
                      translate="no"
                    >
                      {t("vendor")}
                    </TabsTrigger>
                    <TabsTrigger
                      value="reviews"
                      className="w-[50%] rounded-none border-b-2 border-b-transparent bg-[#F8F8F8]! font-semibold text-[#71717A]! data-[state=active]:border-b-2! data-[state=active]:border-b-dark-orange! data-[state=active]:text-dark-orange! data-[state=active]:shadow-none! sm:w-auto md:w-auto md:py-2 md:text-xs lg:w-full lg:py-4 lg:text-base"
                      dir={langDir}
                      translate="no"
                    >
                      {t("reviews")}
                    </TabsTrigger>
                    <TabsTrigger
                      value="qanda"
                      className="w-[50%] rounded-none border-b-2 border-b-transparent bg-[#F8F8F8]! font-semibold text-[#71717A]! data-[state=active]:border-b-2! data-[state=active]:border-b-dark-orange! data-[state=active]:text-dark-orange! data-[state=active]:shadow-none! sm:w-auto md:w-auto md:py-2 md:text-xs lg:w-full lg:py-4 lg:text-base"
                      dir={langDir}
                      translate="no"
                    >
                      {t("questions")}
                    </TabsTrigger>
                    <TabsTrigger
                      value="offers"
                      className="w-[50%] rounded-none border-b-2 border-b-transparent bg-[#F8F8F8]! font-semibold text-[#71717A]! data-[state=active]:border-b-2! data-[state=active]:border-b-dark-orange! data-[state=active]:text-dark-orange! data-[state=active]:shadow-none! sm:w-auto md:w-auto md:py-2 md:text-xs lg:w-full lg:py-4 lg:text-base"
                      dir={langDir}
                      translate="no"
                    >
                      {t("more_offers")}
                    </TabsTrigger>
                    <TabsTrigger
                      value="products"
                      className="w-[50%] rounded-none border-b-2 border-b-transparent bg-[#F8F8F8]! font-semibold text-[#71717A]! data-[state=active]:border-b-2! data-[state=active]:border-b-dark-orange! data-[state=active]:text-dark-orange! data-[state=active]:shadow-none! sm:w-auto md:w-auto md:py-2 md:text-xs lg:w-full lg:py-4 lg:text-base"
                      dir={langDir}
                      translate="no"
                    >
                      {t("products")}
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="description" className="mt-0">
                    <div className="w-full bg-card">
                      <PlateEditor
                        description={
                          handleDescriptionParse(serviceDetails?.description) ||
                          undefined
                        }
                        readOnly={true}
                        fixedToolbar={false}
                      />
                    </div>
                  </TabsContent>
                  <TabsContent value="specification" className="mt-0">
                    <div className="w-full bg-card">
                      {!serviceDetails?.product_productSpecification?.length ? (
                        <div className="specification-sec">
                          <h2>No specification found</h2>
                        </div>
                      ) : null}
                      {serviceDetails?.product_productSpecification?.length ? (
                        <div className="specification-sec">
                          <h2 dir={langDir} translate="no">
                            {t("specification")}
                          </h2>
                          <table className="specification-table">
                            <tbody>
                              <tr className="grid grid-cols-2">
                                {serviceDetails?.product_productSpecification?.map(
                                  (item: {
                                    id: number;
                                    label: string;
                                    specification: string;
                                  }) => (
                                    <div key={item?.id}>
                                      <th>{item?.label}</th>
                                      <td>{item?.specification}</td>
                                    </div>
                                  ),
                                )}
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      ) : null}
                    </div>
                  </TabsContent>
                  <TabsContent value="vendor" className="mt-0">
                    <div className="w-full bg-card">
                      <VendorSection
                        adminId={serviceDetails?.sellerId}
                      />
                    </div>
                  </TabsContent>
                  <TabsContent value="reviews" className="mt-0">
                    <div className="w-full border border-solid border-border bg-card p-5">
                      <ReviewSection
                        productId={searchParams?.id as string}
                        hasAccessToken={haveAccessToken}
                        productReview={serviceDetails?.productReview}
                        isCreator={
                          me?.data?.data?.id === serviceDetails?.adminId
                        }
                      />
                    </div>
                  </TabsContent>
                  <TabsContent value="qanda" className="mt-0">
                    <div className="w-full border border-solid border-border bg-card p-5">
                      <QuestionsAnswersSection
                        hasAccessToken={haveAccessToken}
                        serviceId={searchParams?.id as string}
                      />
                    </div>
                  </TabsContent>
                  <TabsContent value="offers" className="mt-0">
                    <div className="w-full bg-card">
                      <p>More Offers</p>
                    </div>
                  </TabsContent>
                  <TabsContent value="products" className="mt-0">
                    {serviceDetails?.id ? (
                      <div className="w-full bg-card">
                        <RelatedProducts
                          serviceId={serviceDetails?.id}
                          serviceCategoryId={serviceDetails?.categoryId}
                          cartList={memoizedCartList}
                          serviceCartId={
                            memoizedCartList.find(
                              (item: any) =>
                                item.serviceId == serviceDetails?.id,
                            )?.id
                          }
                          isChildCart={
                            !!memoizedCartList
                              ?.filter(
                                (c: any) =>
                                  c.productId &&
                                  c.cartProductServices?.length > 0,
                              )
                              ?.find((c: any) => {
                                return !!c.cartProductServices.find(
                                  (r: any) =>
                                    r.relatedCartType == "SERVICE" &&
                                    r.serviceId == serviceDetails.id,
                                );
                              })
                          }
                        />
                      </div>
                    ) : null}
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </div>

        {isVisible ? (
          <div className="product_cart_modal absolute right-[20px] top-[150px] w-full px-4 lg:w-[300px]">
            <div className="card-item cart-items">
              <div className="inline-flex w-full items-center justify-center pt-5 text-center">
                <a
                  href="javascript:void(0)"
                  className="rounded-none bg-dark-orange px-5 py-3 text-base text-white"
                  onClick={handleCartPage}
                  dir={langDir}
                  translate="no"
                >
                  {t("go_to_cart_page")}
                </a>
              </div>
              <div className="cart-item-lists">
                {haveAccessToken &&
                  !cartListByUser.data?.data?.length &&
                  !cartListByUser.isLoading ? (
                  <div className="px-3 py-6">
                    <p
                      className="my-3 text-center"
                      dir={langDir}
                      translate="no"
                    >
                      {t("no_cart_items")}
                    </p>
                  </div>
                ) : null}

                {!haveAccessToken &&
                  !cartListByDeviceQuery.data?.data?.length &&
                  !cartListByDeviceQuery.isLoading ? (
                  <div className="px-3 py-6">
                    <p
                      className="my-3 text-center"
                      dir={langDir}
                      translate="no"
                    >
                      {t("no_cart_items")}
                    </p>
                  </div>
                ) : null}

                <div className="px-3">
                  {cartListByUser.isLoading ? (
                    <div className="my-3 space-y-3">
                      {Array.from({ length: 2 }).map((_, i) => (
                        <Skeleton key={i} className="h-28 w-full" />
                      ))}
                    </div>
                  ) : null}

                  {!haveAccessToken && cartListByDeviceQuery.isLoading ? (
                    <div className="my-3 space-y-3">
                      {Array.from({ length: 2 }).map((_, i) => (
                        <Skeleton key={i} className="h-28 w-full" />
                      ))}
                    </div>
                  ) : null}
                </div>

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
                      <ProductCard
                        key={item.id}
                        cartId={item.id}
                        productId={item.productId}
                        productPriceId={item.productPriceId}
                        productName={
                          item.productPriceDetails?.productPrice_product
                            ?.productName
                        }
                        offerPrice={item.productPriceDetails?.offerPrice}
                        productQuantity={item.quantity}
                        productVariant={item.object || null}
                        productImages={
                          item.productPriceDetails?.productPrice_product
                            ?.productImages
                        }
                        consumerDiscount={
                          item.productPriceDetails?.consumerDiscount
                        }
                        consumerDiscountType={
                          item.productPriceDetails?.consumerDiscountType
                        }
                        vendorDiscount={
                          item.productPriceDetails?.vendorDiscount
                        }
                        vendorDiscountType={
                          item.productPriceDetails?.vendorDiscountType
                        }
                        onRemove={handleRemoveItemFromCart}
                        onWishlist={handleAddToWishlist}
                        haveAccessToken={haveAccessToken}
                        minQuantity={
                          item?.productPriceDetails?.minQuantityPerCustomer
                        }
                        maxQuantity={
                          item?.productPriceDetails?.maxQuantityPerCustomer
                        }
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
                      (c: any) => c.productId && c.cartProductServices?.length,
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
                      <ServiceCard
                        key={feature.id}
                        cartId={item.id}
                        serviceId={item.serviceId}
                        serviceFeatureId={feature.serviceFeatureId}
                        serviceFeatureName={feature.serviceFeature.name}
                        serviceCost={Number(feature.serviceFeature.serviceCost)}
                        cartQuantity={feature.quantity}
                        serviceFeatures={features}
                        relatedCart={relatedCart}
                        onRemove={() => {
                          handleRemoveServiceFromCart(item.id, feature.id);
                        }}
                      />
                    );
                  });
                })}
              </div>
            </div>
          </div>
        ) : null}

        {/* <div className="product-view-s1-details-more-suggestion-sliders">
                    <RelatedProductsSection
                        calculateTagIds={calculateTagIds}
                        productId={searchParams?.id as string}
                    />
                </div> */}
      </div>
      <Footer />
      <Dialog open={isConfirmDialogOpen} onOpenChange={handleConfirmDialog}>
        <DialogContent
          className="add-new-address-modal add_member_modal gap-0 p-0 md:max-w-2xl!"
          ref={confirmDialogRef}
        >
          <div className="modal-header justify-between!" dir={langDir}>
            <DialogTitle className="text-center text-xl font-bold text-dark-orange"></DialogTitle>
            <Button
              onClick={onCancelRemove}
              className={`${langDir == "ltr" ? "absolute" : ""} right-2 top-2 z-10 bg-card! text-foreground! shadow-none`}
            >
              <IoCloseSharp size={20} />
            </Button>
          </div>

          <div className="mb-4 mt-4 text-center">
            <p className="text-dark-orange">
              Do you want to remove this item from cart?
            </p>
            <div>
              <Button
                type="button"
                className="mr-2 bg-card text-destructive"
                onClick={onCancelRemove}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="bg-destructive"
                onClick={onConfirmRemove}
              >
                Remove
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ServiceDetailsPage;
