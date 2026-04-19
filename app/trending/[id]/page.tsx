"use client";
import React, { useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { getCookie } from "cookies-next";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "next-intl";
import { ULTRASOOQ_TOKEN_KEY } from "@/utils/constants";
import Footer from "@/components/shared/Footer";
import RelatedProductsSection from "@/components/modules/productDetails/RelatedProductsSection";
import SameBrandSection from "@/components/modules/productDetails/SameBrandSection";
import { ProductRecommendations } from "@/components/modules/recommendations/ProductRecommendations";
import { useProductPageState } from "./_components/useProductPageState";
import { useCartActions } from "./_components/useCartActions";
import { useWishlistActions } from "./_components/useWishlistActions";
import ProductMainSection from "./_components/ProductMainSection";
import ProductTabsSection from "./_components/ProductTabsSection";
import ConfirmRemoveDialog from "./_components/ConfirmRemoveDialog";
import ChatDrawer from "./_components/ChatDrawer";

const ProductDetailsPage = () => {
  const t = useTranslations();
  const { langDir } = useAuth();
  const searchParams = useParams();
  const searchQuery = useSearchParams();

  const accessToken = getCookie(ULTRASOOQ_TOKEN_KEY);
  const otherSellerId = searchQuery?.get("sellerId") ?? null;
  const otherProductId = searchQuery?.get("productId") ?? null;
  const sharedLinkId = searchQuery?.get("sharedLinkId") ?? "";
  const pageId = searchParams?.id as string ?? "";

  const [haveAccessToken, setHaveAccessToken] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("description");

  useEffect(() => { setHaveAccessToken(!!accessToken); }, [accessToken]);
  useEffect(() => {
    const type = searchQuery?.get("type");
    if (type) setActiveTab(type);
  }, [searchQuery]);

  const state = useProductPageState(
    pageId,
    otherSellerId,
    otherProductId,
    sharedLinkId,
    haveAccessToken,
  );
  const {
    deviceId, me,
    productDetails, productInWishlist, otherSellerDetails,
    productQueryById, productQueryByOtherSeller,
    cartListByUser, cartListByDeviceQuery, memoizedCartList,
    hasItemByUser, hasItemByDevice,
    getProductQuantityByUser, getProductQuantityByDevice,
    updateCartWithLogin, updateCartByDevice,
    deleteCartItem, deleteServiceFromCart,
    addToWishlist, deleteFromWishlist,
    productVariantTypes, productVariants,
    selectedProductVariant, setSelectedProductVariant,
    globalQuantity, setGlobalQuantity,
    isVisible, setIsVisible,
    isConfirmDialogOpen, setIsConfirmDialogOpen,
    handleConfirmDialog, confirmDialogRef,
    isChatOpen, setIsChatOpen,
    calculateTagIds,
    onCancelRemoveRef,
    trackView,
  } = state;

  const cartActions = useCartActions({
    productDetails,
    haveAccessToken,
    deviceId,
    globalQuantity,
    setGlobalQuantity,
    selectedProductVariant,
    memoizedCartList,
    cartListByUser,
    cartListByDeviceQuery,
    productQueryById,
    setIsConfirmDialogOpen,
    setIsVisible,
    getProductQuantityByUser,
    getProductQuantityByDevice,
    updateCartWithLogin,
    updateCartByDevice,
    deleteCartItem,
    deleteServiceFromCart,
  });

  const { handleAddToWishlist } = useWishlistActions({
    searchParamsId: pageId,
    productInWishlist,
    meDataId: me.data?.data?.id,
    addToWishlist,
    deleteFromWishlist,
  });

  // Wire cancel ref so clickOutside can call onCancelRemove
  onCancelRemoveRef.current = () => {
    setGlobalQuantity(getProductQuantityByDevice || getProductQuantityByUser || 0);
    setIsConfirmDialogOpen(false);
  };

  const isBuygroup = productDetails?.product_productPrice?.[0]?.sellType === "BUYGROUP";
  const getTs = (dateStr?: string, timeStr?: string) => {
    if (!dateStr) return 0;
    try {
      const d = new Date(dateStr);
      if (timeStr) { const [h, m] = timeStr.split(":").map(Number); d.setHours(h || 0, isNaN(m) ? 0 : m, 0, 0); }
      return d.getTime();
    } catch { return 0; }
  };
  const buygroupStartTime = getTs(productDetails?.product_productPrice?.[0]?.dateOpen, productDetails?.product_productPrice?.[0]?.startTime);
  const buygroupEndTime = getTs(productDetails?.product_productPrice?.[0]?.dateClose, productDetails?.product_productPrice?.[0]?.endTime);
  const now = Date.now();
  const saleNotStarted = isBuygroup && buygroupStartTime > 0 && now < buygroupStartTime;
  const saleExpired = isBuygroup && buygroupEndTime > 0 && now > buygroupEndTime;

  const onConfirmRemove = () => {
    const cartId =
      cartListByUser.data?.data?.find((i: any) => i.productId == productDetails?.id)?.id ||
      cartListByDeviceQuery.data?.data?.find((i: any) => i.productId == productDetails?.id)?.id;
    if (cartId) cartActions.handleRemoveItemFromCart(cartId);
    setIsConfirmDialogOpen(false);
  };

  return (
    <div className="min-h-screen" dir={langDir}>
      {productDetails && (
        <ProductMainSection
          productDetails={productDetails}
          pageId={pageId}
          globalQuantity={globalQuantity}
          getProductQuantityByUser={getProductQuantityByUser}
          getProductQuantityByDevice={getProductQuantityByDevice}
          hasItemByUser={hasItemByUser}
          hasItemByDevice={hasItemByDevice}
          productQueryById={productQueryById}
          productQueryByOtherSeller={productQueryByOtherSeller}
          otherSellerId={otherSellerId}
          otherProductId={otherProductId}
          otherSellerDetails={otherSellerDetails}
          productVariantTypes={productVariantTypes}
          productVariants={productVariants}
          selectedProductVariant={selectedProductVariant}
          productInWishlist={productInWishlist}
          haveAccessToken={haveAccessToken}
          isBuygroup={isBuygroup}
          saleNotStarted={saleNotStarted}
          saleExpired={saleExpired}
          buygroupStartTime={buygroupStartTime}
          buygroupEndTime={buygroupEndTime}
          soldBy={productDetails?.adminId?.toString() ?? ""}
          meDataId={me.data?.data?.id}
          handleAddToCart={cartActions.handleAddToCart}
          handleQuantity={cartActions.handleQuantity}
          handleCheckoutPage={cartActions.handleCheckoutPage}
          handelOpenCartLayout={cartActions.handelOpenCartLayout}
          handleProductUpdateSuccess={() => {}}
          handleAddToWishlist={handleAddToWishlist}
          selectProductVariant={(v) => setSelectedProductVariant(v)}
          setIsChatOpen={setIsChatOpen}
        />
      )}

      <ProductTabsSection
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        productDetails={productDetails}
        searchParamsId={pageId}
        haveAccessToken={haveAccessToken}
        meDataId={me.data?.data?.id}
        memoizedCartList={memoizedCartList}
      />

      {calculateTagIds && (
        <RelatedProductsSection calculateTagIds={calculateTagIds} productId={pageId} />
      )}
      {productDetails && (
        <SameBrandSection productDetails={productDetails} productId={pageId} />
      )}

      <ProductRecommendations productId={Number(pageId)} />

      <Footer />

      <ConfirmRemoveDialog
        isOpen={isConfirmDialogOpen}
        onOpenChange={handleConfirmDialog}
        onConfirm={onConfirmRemove}
        onCancel={() => {
          setGlobalQuantity(getProductQuantityByDevice || getProductQuantityByUser || 0);
          setIsConfirmDialogOpen(false);
        }}
        dialogRef={confirmDialogRef}
      />

      <ChatDrawer
        productDetails={productDetails}
        meDataId={me.data?.data?.id}
        searchParamsId={pageId}
        isChatOpen={isChatOpen}
        setIsChatOpen={setIsChatOpen}
      />
    </div>
  );
};

export default ProductDetailsPage;
