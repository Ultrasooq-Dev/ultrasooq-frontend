"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { sanitizeHtml } from "@/utils/sanitize";
import {
  useProductById,
  useOneWithProductPrice,
} from "@/apis/queries/product.queries";
import RelatedProductsSection from "@/components/modules/productDetails/RelatedProductsSection";
import ProductDescriptionCard from "@/components/modules/productDetails/ProductDescriptionCard";
import ProductImagesCard from "@/components/modules/productDetails/ProductImagesCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { getCookie } from "cookies-next";
import { PUREMOON_TOKEN_KEY } from "@/utils/constants";
import { handleDescriptionParse } from "@/utils/helper";
import ReviewSection from "@/components/shared/ReviewSection";
import QuestionsAnswersSection from "@/components/modules/productDetails/QuestionsAnswersSection";
import {
  useAddToWishList,
  useDeleteFromWishList,
} from "@/apis/queries/wishlist.queries";
import { useMe } from "@/apis/queries/user.queries";
import { useQueryClient } from "@tanstack/react-query";
import Footer from "@/components/shared/Footer";
import VendorSection from "@/components/modules/productDetails/VendorSection";
import PlateEditor from "@/components/shared/Plate/PlateEditor";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useDeleteRfqCartItem, useRfqCartListByUserId, useUpdateRfqCartWithLogin } from "@/apis/queries/rfq.queries";
import dynamic from "next/dynamic";

const AddToRfqForm = dynamic(
  () => import("@/components/modules/rfq/AddToRfqForm"),
  {
    loading: () => <div className="animate-pulse h-64 bg-gray-200 rounded-lg" />,
    ssr: false,
  },
);

const ProductDetailsPage = () => {
  const t = useTranslations();
  const { langDir } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useParams();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("description");
  const [cartList, setCartList] = useState<any[]>([]);

  const [selectedProductId, setSelectedProductId] = useState<number>();
  const [quantity, setQuantity] = useState<number | undefined>();
  const [offerPriceFrom, setOfferPriceFrom] = useState<number | undefined>();
  const [offerPriceTo, setOfferPriceTo] = useState<number | undefined>();
  const [productNote, setProductNote] = useState<string>("");
  const [isAddToCartModalOpen, setIsAddToCartModalOpen] = useState(false);
  const handleToggleAddModal = () => setIsAddToCartModalOpen(!isAddToCartModalOpen);

  const me = useMe();
  const productQueryById = useProductById(
    {
      productId: searchParams?.id ? (searchParams?.id as string) : "",
      userId: me.data?.data?.id,
    },
    !!searchParams?.id
  );

  const updateRfqCartWithLogin = useUpdateRfqCartWithLogin();
  const deleteRfqCartItem = useDeleteRfqCartItem();
  const rfqCartListByUser = useRfqCartListByUserId(
    {
      page: 1,
      limit: 100,
    }
  );

  useEffect(() => {
    if (rfqCartListByUser.data?.data) {
      setIsVisible(true);
      setCartList(rfqCartListByUser.data?.data?.map((item: any) => item) || []);
    }
  }, [rfqCartListByUser.data?.data]);

  const addToWishlist = useAddToWishList();
  const deleteFromWishlist = useDeleteFromWishList();
  const [isVisible, setIsVisible] = useState(false); // Initially hidden

  const productDetails = productQueryById.data?.data;
  const productInWishlist = productQueryById.data?.inWishlist;

  const calculateTagIds = useMemo(
    () => productDetails?.productTags.map((item: any) => item.tagId).join(","),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [productDetails?.productTags?.length],
  );

  const handleRFQCart = (
    quantity: number,
    productId: number,
    action: "add" | "remove",
    offerPriceFrom?: number,
    offerPriceTo?: number,
    note?: string,
  ) => {
    if (action == "remove" && quantity == 0) {
      handleAddToCart(quantity, productId, "remove", 0, 0, "");
    } else {
      handleToggleAddModal();
      setSelectedProductId(productId);
      setQuantity(quantity);
      setOfferPriceFrom(offerPriceFrom);
      setOfferPriceTo(offerPriceTo);
      setProductNote(note || "");
    }
  };

  const handleAddToCart = async (
    quantity: number,
    productId: number,
    actionType: "add" | "remove",
    offerPriceFrom?: number,
    offerPriceTo?: number,
    note?: string,
  ) => {
    const response = await updateRfqCartWithLogin.mutateAsync({
      productId,
      quantity,
      offerPriceFrom: offerPriceFrom || 0,
      offerPriceTo: offerPriceTo || 0,
      note: note || "",
    });

    if (response.status) {
      setIsVisible(true);
      toast({
        title:
          actionType == "add"
            ? t("item_added_to_cart")
            : t("item_removed_from_cart"),
        description: t("check_your_cart_for_more_details"),
        variant: "success",
      });
    }
  };

  const handleRemoveItemFromRfqCart = async (rfqCartId: number) => {
    const response = await deleteRfqCartItem.mutateAsync({ rfqCartId });
    if (response.status) {
      toast({
        title: t("item_removed_from_cart"),
        description: t("check_your_cart_for_more_details"),
        variant: "success",
      });
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

  return (
    <>
      <title dir={langDir} translate="no">{`${t("store")} | Ultrasooq`}</title>

      {/* Modern Product Details Page */}
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Main Product Section */}
        <div className="bg-white">
          <div className="container mx-auto max-w-7xl px-4 py-8 lg:px-8">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
              {/* Product Images - Left Side */}
              <div className="lg:col-span-6">
                <div className="sticky top-4">
            <ProductImagesCard
              productDetails={productDetails}
                    onAdd={() => {
                      handleToggleAddModal();
                      setSelectedProductId(productDetails?.id);
                    }}
                    onToCart={() => {
                      handleToggleAddModal();
                      setSelectedProductId(productDetails?.id);
                    }}
                    onToCheckout={() => {
                handleToggleAddModal();
                setSelectedProductId(productDetails?.id);
              }}
              openCartCard={handelOpenCartLayout}
                    hasItem={cartList?.find((item: any) => item.productId == productDetails?.id) ? true : false}
              isLoading={productQueryById?.isLoading}
              onWishlist={handleAddToWishlist}
                    haveAccessToken={!!getCookie(PUREMOON_TOKEN_KEY)}
              inWishlist={!!productInWishlist}
                    askForPrice={productDetails?.product_productPrice?.[0]?.askForPrice}
                    onProductUpdateSuccess={() => {}}
              isAddedToCart={
                cartList?.find((item: any) => item.productId == productDetails?.id) ? true : false
              }
              cartQuantity={
                cartList?.find((item: any) => item.productId == productDetails?.id)?.quantity || 0
              }
                    saleNotStarted={false}
                    saleExpired={false}
                  />
                </div>
              </div>

              {/* Product Info - Right Side */}
              <div className="lg:col-span-6">
            <ProductDescriptionCard
              productId={searchParams?.id ? (searchParams?.id as string) : ""}
              productName={productDetails?.productName}
                  productType="RFQ"
              brand={productDetails?.brand?.brandName}
              productPrice={productDetails?.productPrice}
              offerPrice={productDetails?.product_productPrice?.[0]?.offerPrice}
              skuNo={productDetails?.skuNo}
              category={productDetails?.category?.name}
              productTags={productDetails?.productTags}
              productShortDescription={
                productDetails?.product_productShortDescription
              }
              productQuantity={
                cartList?.find((item: any) => item.productId == productDetails?.id)?.quantity || 0
              }
                  onQuantityChange={(quantity, action) => {
                    // For RFQ, opening modal instead of direct quantity change
                    handleToggleAddModal();
                    setSelectedProductId(productDetails?.id);
                    setQuantity(quantity);
                  }}
              productReview={productDetails?.productReview}
                  onAdd={(quantity, action) => {
                    // For RFQ, opening modal instead of direct add
                    handleToggleAddModal();
                    setSelectedProductId(productDetails?.id);
                    setQuantity(quantity);
                  }}
                  onBuyNow={() => {
                    // For RFQ, opening modal
                    handleToggleAddModal();
                    setSelectedProductId(productDetails?.id);
                  }}
              isLoading={productQueryById.isLoading}
                  soldBy={`${productDetails?.product_productPrice?.[0]?.adminDetail?.firstName || ''} ${productDetails?.product_productPrice?.[0]?.adminDetail?.lastName || ''}`.trim() || "Unknown Seller"}
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
                  haveOtherSellers={false}
                  productProductPrice={
                    productDetails?.product_productPrice?.[0]?.productPrice
                  }
                  consumerDiscount={
                    productDetails?.product_productPrice?.[0]?.consumerDiscount
                  }
                  consumerDiscountType={
                    productDetails?.product_productPrice?.[0]?.consumerDiscountType
                  }
                  vendorDiscount={
                    productDetails?.product_productPrice?.[0]?.vendorDiscount
                  }
                  vendorDiscountType={
                    productDetails?.product_productPrice?.[0]?.vendorDiscountType
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
                  otherSellerDetails={[]}
                  productPriceArr={productDetails?.product_productPrice}
                  productVariantTypes={[]}
                  productVariants={[]}
                  selectedProductVariant={null}
                  selectProductVariant={() => {}}
                  isDropshipped={false}
                  customMarketingContent={null}
                  additionalMarketingImages={[]}
                  isBuygroup={false}
                  saleNotStarted={false}
                  saleExpired={false}
                  buygroupStartTime={0}
                  buygroupEndTime={0}
                  sellType={productDetails?.product_productPrice?.[0]?.sellType}
                  dateOpen={productDetails?.product_productPrice?.[0]?.dateOpen}
                  startTime={productDetails?.product_productPrice?.[0]?.startTime}
                />

                {/* RFQ Specific Action Buttons */}
                <div className="mt-6 space-y-3">
                  {productDetails?.adminId === me.data?.data?.id && (
                    <Button
                      type="button"
                      onClick={() => {
                        handleToggleAddModal();
                        setSelectedProductId(productDetails?.id);
                      }}
                      className="w-full rounded-lg bg-blue-600 py-3 text-base font-medium text-white shadow-lg transition-all hover:bg-blue-700 hover:shadow-xl active:scale-95"
                      dir={langDir}
                      translate="no"
                    >
                      {t("send_to_customize")}
                    </Button>
                  )}
                  
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      onClick={() => router.push(`/seller-rfq-request?product_id=${productDetails?.id}`)}
                      className="flex-1 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 py-3 text-base font-medium text-white shadow-lg transition-all hover:from-orange-600 hover:to-orange-700 hover:shadow-xl active:scale-95"
                      dir={langDir}
                      translate="no"
                    >
                      {t("ask_vendor_for_price")}
                    </Button>
                    
                    <Button
                      type="button"
                      onClick={() => {
                        const cartItem = cartList?.find((item: any) => item.productId == productDetails?.id);
                        handleRFQCart(
                          cartItem?.quantity ? cartItem.quantity + 1 : 1,
                          productDetails?.id,
                          "add",
                          cartItem?.offerPriceFrom,
                          cartItem?.offerPriceTo,
                          cartItem?.note || "",
                        );
                      }}
                      disabled={cartList?.find((item: any) => item.productId == productDetails?.id)}
                      className="flex-1 rounded-lg bg-gradient-to-r from-green-500 to-green-600 py-3 text-base font-medium text-white shadow-lg transition-all hover:from-green-600 hover:to-green-700 hover:shadow-xl active:scale-95 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed disabled:opacity-50"
                      translate="no"
                    >
                      {cartList?.find((item: any) => item.productId == productDetails?.id) 
                        ? t("added_to_rfq_cart") 
                        : t("add_to_rfq_cart")}
                    </Button>
                  </div>
                </div>
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
                <div className="bg-white">
                  <TabsList className="flex w-full items-center justify-start gap-1 bg-transparent p-0">
                    <TabsTrigger
                      value="description"
                      className="relative rounded-none border-0 border-b-4 border-b-transparent bg-transparent px-6 py-3 text-sm font-bold text-gray-600 transition-all duration-300 hover:bg-gray-50 hover:text-gray-800 hover:border-b-gray-300 data-[state=active]:border-b-orange-500 data-[state=active]:text-orange-500 data-[state=active]:bg-orange-50/30 data-[state=active]:font-bold data-[state=active]:border-0 whitespace-nowrap sm:px-8 sm:py-4 sm:text-base lg:px-10 lg:py-5 lg:text-lg"
                      dir={langDir}
                      translate="no"
                    >
                      <span className="flex items-center gap-3">
                        <svg className="h-5 w-5 flex-shrink-0 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="hidden sm:inline">{t("description")}</span>
                        <span className="sm:hidden">Desc</span>
                      </span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="specification"
                      className="relative rounded-none border-0 border-b-4 border-b-transparent bg-transparent px-6 py-3 text-sm font-bold text-gray-600 transition-all duration-300 hover:bg-gray-50 hover:text-gray-800 hover:border-b-gray-300 data-[state=active]:border-b-orange-500 data-[state=active]:text-orange-500 data-[state=active]:bg-orange-50/30 data-[state=active]:font-bold data-[state=active]:border-0 whitespace-nowrap sm:px-8 sm:py-4 sm:text-base lg:px-10 lg:py-5 lg:text-lg"
                      dir={langDir}
                      translate="no"
                    >
                      <span className="flex items-center gap-3">
                        <svg className="h-5 w-5 flex-shrink-0 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <span className="hidden sm:inline">{t("specification")}</span>
                        <span className="sm:hidden">Spec</span>
                      </span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="reviews"
                      className="relative rounded-none border-0 border-b-4 border-b-transparent bg-transparent px-6 py-3 text-sm font-bold text-gray-600 transition-all duration-300 hover:bg-gray-50 hover:text-gray-800 hover:border-b-gray-300 data-[state=active]:border-b-orange-500 data-[state=active]:text-orange-500 data-[state=active]:bg-orange-50/30 data-[state=active]:font-bold data-[state=active]:border-0 whitespace-nowrap sm:px-8 sm:py-4 sm:text-base lg:px-10 lg:py-5 lg:text-lg"
                      dir={langDir}
                      translate="no"
                    >
                      <span className="flex items-center gap-3">
                        <svg className="h-5 w-5 flex-shrink-0 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                        <span className="hidden sm:inline">{t("reviews")}</span>
                        <span className="sm:hidden">Reviews</span>
                      </span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="qanda"
                      className="relative rounded-none border-0 border-b-4 border-b-transparent bg-transparent px-6 py-3 text-sm font-bold text-gray-600 transition-all duration-300 hover:bg-gray-50 hover:text-gray-800 hover:border-b-gray-300 data-[state=active]:border-b-orange-500 data-[state=active]:text-orange-500 data-[state=active]:bg-orange-50/30 data-[state=active]:font-bold data-[state=active]:border-0 whitespace-nowrap sm:px-8 sm:py-4 sm:text-base lg:px-10 lg:py-5 lg:text-lg"
                      dir={langDir}
                      translate="no"
                    >
                      <span className="flex items-center gap-3">
                        <svg className="h-5 w-5 flex-shrink-0 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="hidden sm:inline">{t("questions")}</span>
                        <span className="sm:hidden">Q&A</span>
                      </span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="vendor"
                      className="relative rounded-none border-0 border-b-4 border-b-transparent bg-transparent px-6 py-3 text-sm font-bold text-gray-600 transition-all duration-300 hover:bg-gray-50 hover:text-gray-800 hover:border-b-gray-300 data-[state=active]:border-b-orange-500 data-[state=active]:text-orange-500 data-[state=active]:bg-orange-50/30 data-[state=active]:font-bold data-[state=active]:border-0 whitespace-nowrap sm:px-8 sm:py-4 sm:text-base lg:px-10 lg:py-5 lg:text-lg"
                      dir={langDir}
                      translate="no"
                    >
                      <span className="flex items-center gap-3">
                        <svg className="h-5 w-5 flex-shrink-0 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <span className="hidden sm:inline">{t("vendor")}</span>
                        <span className="sm:hidden">Vendor</span>
                      </span>
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* Tab Content - Description */}
                  <TabsContent value="description" className="mt-0">
                  <div className="min-h-[400px] bg-white p-8 sm:p-10 lg:p-12">
                    {productDetails?.description ? (
                      <div className="space-y-4">
                        <div className="prose prose-gray max-w-none">
                          {(() => {
                            const desc = productDetails?.description;
                            
                            // If it's already an object, use it directly
                            if (typeof desc === 'object' && desc !== null) {
                              return (
                      <PlateEditor
                                  description={desc}
                                  readOnly={true}
                                  fixedToolbar={false}
                                />
                              );
                            }
                            
                            // If it's a string, try to parse as JSON
                            if (typeof desc === 'string') {
                              try {
                                // First try to parse as JSON
                                const parsed = JSON.parse(desc);
                                
                                // Extract text content from the parsed structure
                                const extractText = (node: any): string => {
                                  if (typeof node === 'string') return node;
                                  if (node?.text) return node.text;
                                  if (node?.children && Array.isArray(node.children)) {
                                    return node.children.map(extractText).join('');
                                  }
                                  return '';
                                };
                                
                                const textContent = parsed.map(extractText).join('\n\n');
                                
                                // If we have text content, display it as HTML
                                if (textContent.trim()) {
                                  return (
                                    <div 
                                      className="text-gray-700 leading-relaxed" 
                                      dir={langDir} 
                                      translate="no"
                                      dangerouslySetInnerHTML={{
                                        __html: sanitizeHtml(textContent.replace(/\n/g, '<br/>'))
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
                                    <div className="text-gray-600" dir={langDir} translate="no">
                                      {desc}
                                    </div>
                                  );
                                }
                              }
                            }
                            
                            // Fallback
                            return (
                              <div className="text-gray-600" dir={langDir} translate="no">
                                {String(desc)}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    ) : (
                      <div className="flex min-h-[200px] flex-col items-center justify-center text-center">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                          <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2" dir={langDir} translate="no">
                          {t("no_description_available")}
                        </h3>
                        <p className="text-gray-500 max-w-md" dir={langDir} translate="no">
                          {t("product_description_will_be_added_soon")}
                        </p>
                      </div>
                    )}
                    </div>
                  </TabsContent>

                {/* Tab Content - Specification */}
                  <TabsContent value="specification" className="mt-0">
                  <div className="min-h-[400px] bg-white p-8 sm:p-10 lg:p-12">
                      {!productDetails?.product_productSpecification?.length ? (
                      <div className="flex min-h-[200px] flex-col items-center justify-center text-center">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                          <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2" dir={langDir} translate="no">
                          {t("no_specification_available")}
                        </h3>
                        <p className="text-gray-500 max-w-md" dir={langDir} translate="no">
                          {t("specifications_will_be_added_soon")}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <h2 className="text-xl font-semibold text-gray-900" dir={langDir} translate="no">
                          {t("technical_specifications")}
                          </h2>
                        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                          <div className="divide-y divide-gray-100">
                                {productDetails?.product_productSpecification?.map(
                                  (item: {
                                    id: number;
                                    label: string;
                                    specification: string;
                              }, index: number) => (
                                <div key={item?.id} className={`p-6 ${index % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                                    <dt className="text-sm font-semibold text-gray-900">
                                      {item?.label}
                                    </dt>
                                    <dd className="text-sm text-gray-600">
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
                  <div className="min-h-[400px] bg-white p-8 sm:p-10 lg:p-12">
                    <div className="space-y-4">
                      <h2 className="text-xl font-semibold text-gray-900" dir={langDir} translate="no">
                        {t("customer_reviews")}
                      </h2>
                      <ReviewSection
                        productId={searchParams?.id as string}
                        hasAccessToken={true}
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
                  <div className="min-h-[400px] bg-white p-8 sm:p-10 lg:p-12">
                      <QuestionsAnswersSection
                        hasAccessToken={true}
                        productId={searchParams?.id as string}
                      />
                    </div>
                  </TabsContent>

                {/* Tab Content - Vendor */}
                <TabsContent value="vendor" className="mt-0">
                  <div className="min-h-[400px] bg-white p-8 sm:p-10 lg:p-12">
                    <div className="space-y-4">
                      <h2 className="text-xl font-semibold text-gray-900" dir={langDir} translate="no">
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
                </Tabs>
            </div>
          </div>
        </div>

        {/* Related Products Section */}
          <RelatedProductsSection
            calculateTagIds={calculateTagIds}
            productId={searchParams?.id as string}
          />
        </div>

      <Footer />

      <Dialog open={isAddToCartModalOpen} onOpenChange={handleToggleAddModal}>
        <DialogContent
          className="add-new-address-modal gap-0 p-0 md:max-w-2xl!"
        >
          <AddToRfqForm
            onClose={() => {
              setIsAddToCartModalOpen(false);
              setSelectedProductId(undefined);
              setQuantity(undefined);
              setProductNote("");
            }}
            selectedProductId={selectedProductId}
            selectedQuantity={quantity}
            offerPriceFrom={offerPriceFrom}
            offerPriceTo={offerPriceTo}
            note={productNote}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProductDetailsPage;
