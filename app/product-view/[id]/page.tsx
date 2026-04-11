"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  useProductById,
  useOneWithProductPrice,
  useProductVariant,
  useTrackProductView,
} from "@/apis/queries/product.queries";
import {
  useCartListByDevice,
  useCartListByUserId,
  useUpdateCartByDevice,
  useUpdateCartWithLogin,
  useDeleteCartItem,
  useDeleteServiceFromCart,
} from "@/apis/queries/cart.queries";
import {
  useAddToWishList,
  useDeleteFromWishList,
} from "@/apis/queries/wishlist.queries";
import { useMe } from "@/apis/queries/user.queries";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "next-intl";
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { getCookie } from "cookies-next";
import { ULTRASOOQ_TOKEN_KEY } from "@/utils/constants";
import { getOrCreateDeviceId } from "@/utils/helper";
import { sanitizeHtml } from "@/utils/sanitize";
import { cn } from "@/lib/utils";
import ProductImagesCard from "@/components/modules/productDetails/ProductImagesCard";
import ProductDescriptionCard from "@/components/modules/productDetails/ProductDescriptionCard";
import RelatedProductsSection from "@/components/modules/productDetails/RelatedProductsSection";
import ReviewSection from "@/components/shared/ReviewSection";
import QuestionsAnswersSection from "@/components/modules/productDetails/QuestionsAnswersSection";
import VendorSection from "@/components/modules/productDetails/VendorSection";
import { ProductRecommendations } from "@/components/modules/recommendations/ProductRecommendations";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Package } from "lucide-react";
import dynamic from "next/dynamic";
import PlateEditor from "@/components/shared/Plate/PlateEditor";
import RelatedServices from "@/components/modules/trending/RelatedServices";
import ProductCard from "@/components/modules/cartList/ProductCard";
import ServiceCard from "@/components/modules/cartList/ServiceCard";
import { CartItem } from "@/utils/types/cart.types";

const ProductChat = dynamic(
  () => import("@/components/modules/chat/productChat/ProductChat"),
  { loading: () => <div className="animate-pulse h-64 bg-muted rounded-lg" />, ssr: false },
);

import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";

/* ═══════════════════════════════════════════════════════════════
   PRODUCT VIEW PAGE — /product-view/[id]
   Full-featured product detail page reusing existing components.
   Handles: Normal, BuyGroup, Wholesale, Dropship, all sell types.
   ═══════════════════════════════════════════════════════════════ */

export default function ProductViewPage() {
  const t = useTranslations();
  const { langDir } = useAuth();
  const queryClient = useQueryClient();
  const params = useParams();
  const searchQuery = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const deviceId = getOrCreateDeviceId() || "";
  const accessToken = getCookie(ULTRASOOQ_TOKEN_KEY);
  const [haveAccessToken, setHaveAccessToken] = useState(false);
  const [activeTab, setActiveTab] = useState("description");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [globalQuantity, setGlobalQuantity] = useState(0);
  const [productVariantTypes, setProductVariantTypes] = useState<string[]>();
  const [productVariants, setProductVariants] = useState<any[]>();
  const [selectedProductVariant, setSelectedProductVariant] = useState<any>(null);

  const productId = params?.id as string;
  const otherSellerId = searchQuery?.get("sellerId");
  const otherProductId = searchQuery?.get("productId");
  const sharedLinkId = searchQuery?.get("sharedLinkId") || "";

  const me = useMe();

  // ── Product query ──
  const productQueryById = useProductById(
    { productId, userId: me.data?.data?.id, sharedLinkId },
    !!productId && !otherSellerId && !otherProductId,
  );

  const productQueryByOtherSeller = useOneWithProductPrice(
    { productId: Number(otherProductId), adminId: Number(otherSellerId) },
    !!otherSellerId && !!otherProductId,
  );

  const getProductVariant = useProductVariant();
  const trackView = useTrackProductView();

  const productDetails = !otherSellerId
    ? productQueryById.data?.data
    : productQueryByOtherSeller.data?.data;
  const productInWishlist = !otherSellerId
    ? productQueryById.data?.inWishlist
    : productQueryByOtherSeller.data?.inWishlist;
  const otherSellerDetails = !otherSellerId
    ? productQueryById.data?.otherSeller
    : productQueryByOtherSeller.data?.otherSeller;

  // ── BuyGroup timing ──
  const getLocalTimestamp = (dateStr?: string, timeStr?: string) => {
    if (!dateStr) return 0;
    try {
      const date = new Date(dateStr);
      if (timeStr) {
        const [hours, minutes] = timeStr.split(":").map(Number);
        if (!Number.isNaN(hours)) date.setHours(hours || 0, Number.isNaN(minutes) ? 0 : minutes, 0, 0);
      }
      return date.getTime();
    } catch { return 0; }
  };

  const isBuygroup = productDetails?.product_productPrice?.[0]?.sellType === "BUYGROUP";
  const buygroupStartTime = getLocalTimestamp(productDetails?.product_productPrice?.[0]?.dateOpen, productDetails?.product_productPrice?.[0]?.startTime);
  const buygroupEndTime = getLocalTimestamp(productDetails?.product_productPrice?.[0]?.dateClose, productDetails?.product_productPrice?.[0]?.endTime);
  const now = Date.now();
  const saleNotStarted = isBuygroup && buygroupStartTime > 0 && now < buygroupStartTime;
  const saleExpired = isBuygroup && buygroupEndTime > 0 && now > buygroupEndTime;

  // ── Cart queries ──
  const cartListByDeviceQuery = useCartListByDevice({ page: 1, limit: 100, deviceId }, !haveAccessToken);
  const cartListByUser = useCartListByUserId({ page: 1, limit: 100 }, haveAccessToken);
  const updateCartByDevice = useUpdateCartByDevice();
  const updateCartWithLogin = useUpdateCartWithLogin();
  const addToWishList = useAddToWishList();
  const deleteFromWishList = useDeleteFromWishList();

  const memoizedCartList: CartItem[] = useMemo(() => {
    return haveAccessToken
      ? cartListByUser.data?.data?.data?.cartItems || []
      : cartListByDeviceQuery.data?.data?.data?.cartItems || [];
  }, [haveAccessToken, cartListByUser.data, cartListByDeviceQuery.data]);

  const hasItemByUser = useMemo(() => memoizedCartList.some((item) => item.productId === Number(productId)), [memoizedCartList, productId]);

  const getProductQuantityByUser = useMemo(() => {
    const item = memoizedCartList.find((item) => item.productId === Number(productId));
    return item?.quantity || 0;
  }, [memoizedCartList, productId]);

  // ── Handlers ──
  const handleProductUpdateSuccess = () => { queryClient.invalidateQueries({ queryKey: ["product-by-id"] }); };

  const handleAddToCart = async (quantity: number, action: string) => {
    const priceId = productDetails?.product_productPrice?.[0]?.id;
    if (!priceId) return;
    try {
      if (haveAccessToken) {
        await updateCartWithLogin.mutateAsync({ productPriceId: priceId, quantity: quantity || 1 });
      } else {
        await updateCartByDevice.mutateAsync({ productPriceId: priceId, quantity: quantity || 1, deviceId });
      }
      toast({ title: t("added_to_cart") || "Added to cart", variant: "success" });
      queryClient.invalidateQueries({ queryKey: haveAccessToken ? ["cart-by-user-id"] : ["cart-list-by-device-id"] });
      return true;
    } catch (error: any) {
      toast({ title: t("error") || "Error", description: error?.response?.data?.message || "Failed to add to cart", variant: "destructive" });
      return false;
    }
  };

  const handleCheckoutPage = async () => {
    const minQ = productDetails?.product_productPrice?.[0]?.minQuantityPerCustomer;
    const resp = await handleAddToCart(globalQuantity || minQ || 1, "add");
    if (resp === true) router.push("/checkout");
  };

  const handleQuantity = (quantity: number) => { setGlobalQuantity(quantity); };

  const handleAddToWishlist = async () => {
    if (!haveAccessToken) { toast({ title: t("please_login_first") || "Please login first", variant: "destructive" }); return; }
    try {
      if (productInWishlist) {
        await deleteFromWishList.mutateAsync({ productId: Number(productId) });
        toast({ title: t("removed_from_wishlist") || "Removed from wishlist", variant: "success" });
      } else {
        await addToWishList.mutateAsync({ productId: Number(productId) });
        toast({ title: t("added_to_wishlist") || "Added to wishlist", variant: "success" });
      }
      queryClient.invalidateQueries({ queryKey: ["product-by-id"] });
    } catch { toast({ title: t("error") || "Error", variant: "destructive" }); }
  };

  const selectProductVariant = (variant: any) => { setSelectedProductVariant(variant); };

  // ── Effects ──
  useEffect(() => { setHaveAccessToken(!!accessToken); }, [accessToken]);

  useEffect(() => {
    const fetchVariants = async () => {
      const priceId = productDetails?.product_productPrice?.[0]?.id;
      if (!priceId) return;
      const response = await getProductVariant.mutateAsync([priceId]);
      const variants = response?.data?.[0]?.object || [];
      if (variants.length > 0) {
        let types = variants.map((item: any) => item.type);
        types = Array.from(new Set(types));
        setProductVariantTypes(types);
        setProductVariants(variants);
      }
    };
    if (!productQueryById?.isLoading && productDetails) fetchVariants();
  }, [productDetails?.id]);

  useEffect(() => {
    if (productDetails?.id && !productQueryById.isLoading) {
      trackView.mutate({ productId: productDetails.id, ...(!haveAccessToken && deviceId ? { deviceId } : {}) });
    }
  }, [productDetails?.id, productQueryById.isLoading]);

  useEffect(() => { setGlobalQuantity(getProductQuantityByUser || 0); }, [getProductQuantityByUser]);

  // ── Loading state ──
  const isLoading = !otherSellerId ? !productQueryById.isFetched : !productQueryByOtherSeller.isFetched;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto max-w-7xl px-4 py-8 lg:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-6"><Skeleton className="aspect-square rounded-2xl" /></div>
            <div className="lg:col-span-6 space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-12 w-1/3" />
              <Skeleton className="h-40" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!productDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Package className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h2 className="text-xl font-semibold text-foreground">Product not found</h2>
          <button onClick={() => router.back()} className="mt-4 text-sm text-primary hover:underline">
            <ArrowLeft className="h-4 w-4 inline me-1" /> Go back
          </button>
        </div>
      </div>
    );
  }

  const sellType = productDetails?.product_productPrice?.[0]?.sellType;
  const soldByName =
    productDetails?.product_productPrice?.[0]?.adminDetail?.accountName ||
    productDetails?.product_productPrice?.[0]?.adminDetail?.userProfile?.companyName ||
    `${productDetails?.product_productPrice?.[0]?.adminDetail?.firstName || ""} ${productDetails?.product_productPrice?.[0]?.adminDetail?.lastName || ""}`.trim() ||
    "Seller";

  return (
    <>
      <title dir={langDir} translate="no">{`${productDetails?.productName || "Product"} | Ultrasooq`}</title>

      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Main Product Section */}
        <div className="bg-card">
          <div className="container mx-auto max-w-7xl px-4 py-8 lg:px-8">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
              {/* Product Images */}
              <div className="lg:col-span-6">
                <div className="sticky top-4">
                  <ProductImagesCard
                    productDetails={productDetails}
                    onProductUpdateSuccess={handleProductUpdateSuccess}
                    onAdd={() => handleAddToCart(globalQuantity, "add")}
                    onToCart={async () => {
                      const minQ = productDetails.product_productPrice?.[0]?.minQuantityPerCustomer;
                      const resp = await handleAddToCart(globalQuantity || minQ || 1, "add");
                      if (resp === true) router.push("/checkout");
                    }}
                    onToCheckout={handleCheckoutPage}
                    openCartCard={() => setIsCartDrawerOpen(true)}
                    hasItem={hasItemByUser}
                    isLoading={isLoading}
                    onWishlist={handleAddToWishlist}
                    haveAccessToken={haveAccessToken}
                    inWishlist={!!productInWishlist}
                    askForPrice={productDetails?.product_productPrice?.[0]?.askForPrice}
                    isAddedToCart={hasItemByUser}
                    cartQuantity={globalQuantity}
                    additionalMarketingImages={productDetails?.additionalMarketingImages}
                    saleNotStarted={saleNotStarted}
                    saleExpired={saleExpired}
                  />
                </div>
              </div>

              {/* Product Info */}
              <div className="lg:col-span-6">
                <ProductDescriptionCard
                  productId={productId}
                  productName={productDetails?.productName}
                  productType={productDetails?.productType}
                  brand={productDetails?.brand?.brandName}
                  productPrice={productDetails?.productPrice}
                  offerPrice={productDetails?.product_productPrice?.[0]?.offerPrice}
                  skuNo={productDetails?.skuNo}
                  category={productDetails?.category?.name}
                  categoryId={productDetails?.categoryId}
                  categoryLocation={productDetails?.categoryLocation}
                  consumerType={productDetails?.product_productPrice?.[0]?.consumerType}
                  productTags={productDetails?.productTags}
                  productShortDescription={productDetails?.product_productShortDescription}
                  productQuantity={globalQuantity || getProductQuantityByUser}
                  onQuantityChange={handleQuantity}
                  productReview={productDetails?.productReview}
                  onAdd={handleAddToCart}
                  onBuyNow={handleCheckoutPage}
                  isLoading={isLoading}
                  soldBy={soldByName}
                  soldByTradeRole={productDetails?.product_productPrice?.[0]?.adminDetail?.tradeRole}
                  userId={me.data?.data?.id}
                  sellerId={productDetails?.product_productPrice?.[0]?.adminDetail?.id}
                  adminId={productDetails?.product_productPrice?.[0]?.adminDetail?.id}
                  onOpenChat={() => setIsChatOpen(true)}
                  haveOtherSellers={!!otherSellerDetails?.length}
                  productProductPrice={productDetails?.product_productPrice?.[0]?.productPrice}
                  consumerDiscount={productDetails?.product_productPrice?.[0]?.consumerDiscount}
                  consumerDiscountType={productDetails?.product_productPrice?.[0]?.consumerDiscountType}
                  vendorDiscount={productDetails?.product_productPrice?.[0]?.vendorDiscount}
                  vendorDiscountType={productDetails?.product_productPrice?.[0]?.vendorDiscountType}
                  askForPrice={productDetails?.product_productPrice?.[0]?.askForPrice}
                  minQuantity={productDetails?.product_productPrice?.[0]?.minQuantityPerCustomer}
                  maxQuantity={productDetails?.product_productPrice?.[0]?.maxQuantityPerCustomer}
                  otherSellerDetails={otherSellerDetails}
                  productPriceArr={productDetails?.product_productPrice}
                  productVariantTypes={productVariantTypes}
                  productVariants={productVariants}
                  selectedProductVariant={selectedProductVariant}
                  selectProductVariant={selectProductVariant}
                  isDropshipped={productDetails?.isDropshipped}
                  customMarketingContent={productDetails?.customMarketingContent}
                  additionalMarketingImages={productDetails?.additionalMarketingImages}
                  isBuygroup={isBuygroup}
                  saleNotStarted={saleNotStarted}
                  saleExpired={saleExpired}
                  buygroupStartTime={buygroupStartTime}
                  buygroupEndTime={buygroupEndTime}
                  sellType={sellType}
                  dateOpen={productDetails?.product_productPrice?.[0]?.dateOpen}
                  startTime={productDetails?.product_productPrice?.[0]?.startTime}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="container mx-auto max-w-7xl px-4 py-8 lg:px-8">
          <Tabs onValueChange={(e) => setActiveTab(e)} value={activeTab}>
            <div className="bg-card rounded-t-xl">
              <TabsList className="flex w-full items-center justify-start gap-1 bg-transparent p-0">
                {[
                  { value: "description", label: t("description") },
                  { value: "specification", label: t("specification") },
                  { value: "reviews", label: t("reviews") },
                  { value: "qanda", label: t("questions") || "Q&A" },
                  { value: "vendor", label: t("vendor") },
                  { value: "services", label: t("services") },
                ].map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="relative rounded-none border-0 border-b-4 border-b-transparent bg-transparent px-6 py-3 text-sm font-bold whitespace-nowrap text-muted-foreground transition-all hover:border-b-gray-300 hover:bg-muted hover:text-foreground data-[state=active]:border-b-orange-500 data-[state=active]:bg-warning/5/30 data-[state=active]:text-warning sm:px-8 sm:py-4 sm:text-base"
                    dir={langDir}
                    translate="no"
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <TabsContent value="description" className="mt-0">
              <div className="min-h-[300px] p-8 bg-card">
                {(() => {
                  const desc = productDetails?.isDropshipped && productDetails?.customMarketingContent?.marketingText
                    ? productDetails.customMarketingContent.marketingText
                    : productDetails?.description;
                  if (!desc) return <p className="text-muted-foreground">{t("no_description") || "No description available."}</p>;
                  if (typeof desc === "object" && desc !== null) return <PlateEditor description={desc} readOnly fixedToolbar={false} />;
                  if (typeof desc === "string") {
                    try {
                      const parsed = JSON.parse(desc);
                      return <PlateEditor description={parsed} readOnly fixedToolbar={false} />;
                    } catch {
                      return <div className="prose prose-gray max-w-none leading-relaxed text-muted-foreground" dir={langDir}>{desc}</div>;
                    }
                  }
                  return null;
                })()}
              </div>
            </TabsContent>

            <TabsContent value="specification" className="mt-0">
              <div className="min-h-[300px] p-8 bg-card">
                {productDetails?.productSpecValues?.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-0">
                    {productDetails.productSpecValues.map((sv: any, i: number) => (
                      <div key={i} className={cn("flex items-center py-3 px-4", i % 2 === 0 ? "bg-gray-50" : "bg-white")}>
                        <span className="w-1/2 text-sm font-medium text-muted-foreground">{sv.specTemplate?.name_en || sv.specTemplate?.name || "—"}</span>
                        <span className="w-1/2 text-sm text-foreground">{sv.value || "—"}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">{t("no_specifications") || "No specifications available."}</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="reviews" className="mt-0">
              <div className="min-h-[300px] p-8 bg-card">
                <ReviewSection
                  productId={Number(productId)}
                  productReview={productDetails?.productReview}
                />
              </div>
            </TabsContent>

            <TabsContent value="qanda" className="mt-0">
              <div className="min-h-[300px] p-8 bg-card">
                <QuestionsAnswersSection
                  productId={Number(productId)}
                  sellerId={productDetails?.product_productPrice?.[0]?.adminDetail?.id}
                  userId={me.data?.data?.id}
                />
              </div>
            </TabsContent>

            <TabsContent value="vendor" className="mt-0">
              <div className="min-h-[300px] p-8 bg-card">
                <VendorSection
                  sellerId={productDetails?.product_productPrice?.[0]?.adminDetail?.id}
                  sellerName={soldByName}
                />
              </div>
            </TabsContent>

            <TabsContent value="services" className="mt-0">
              <div className="min-h-[300px] p-8 bg-card">
                <RelatedServices
                  categoryId={productDetails?.categoryId}
                  sellerId={productDetails?.product_productPrice?.[0]?.adminDetail?.id}
                />
              </div>
            </TabsContent>
          </Tabs>

          {/* Related Products */}
          <div className="mt-8">
            <RelatedProductsSection
              productId={Number(productId)}
              categoryId={productDetails?.categoryId}
            />
          </div>

          {/* AI Recommendations */}
          <div className="mt-8">
            <ProductRecommendations productId={Number(productId)} />
          </div>
        </div>
      </div>

      {/* Chat Drawer */}
      <Drawer open={isChatOpen} onOpenChange={setIsChatOpen}>
        <DrawerContent className="h-[85vh]">
          <DrawerHeader><DrawerTitle>{t("chat_with_seller") || "Chat with seller"}</DrawerTitle></DrawerHeader>
          <div className="flex-1 overflow-auto px-4 pb-4">
            <ProductChat
              productId={Number(productId)}
              sellerId={productDetails?.product_productPrice?.[0]?.adminDetail?.id}
              productName={productDetails?.productName}
              productImage={productDetails?.productImages?.[0]?.image}
            />
          </div>
        </DrawerContent>
      </Drawer>

      {/* Cart Drawer */}
      <Drawer open={isCartDrawerOpen} onOpenChange={setIsCartDrawerOpen}>
        <DrawerContent className="h-[70vh]">
          <DrawerHeader><DrawerTitle>{t("your_cart") || "Your Cart"}</DrawerTitle></DrawerHeader>
          <div className="flex-1 overflow-auto px-4 pb-4 space-y-3">
            {memoizedCartList.map((item: CartItem) => (
              item.cartType === "SERVICE" ? (
                <ServiceCard key={item.id} item={item} onDelete={() => {}} />
              ) : (
                <ProductCard key={item.id} item={item} onDelete={() => {}} onQuantityChange={() => {}} />
              )
            ))}
            {memoizedCartList.length === 0 && (
              <p className="text-center text-muted-foreground py-8">{t("cart_empty") || "Your cart is empty"}</p>
            )}
            {memoizedCartList.length > 0 && (
              <Button onClick={() => router.push("/checkout")} className="w-full mt-4">
                {t("proceed_to_checkout") || "Proceed to Checkout"}
              </Button>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
