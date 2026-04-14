"use client";
import React, { useEffect } from "react";
import RelatedProductsSection from "@/components/modules/productDetails/RelatedProductsSection";
import ProductDescriptionCard from "@/components/modules/productDetails/ProductDescriptionCard";
import ProductImagesCard from "@/components/modules/productDetails/ProductImagesCard";
import Footer from "@/components/shared/Footer";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { useProductPageState } from "./_components/useProductPageState";
import { useCartHandlers } from "./_components/useCartHandlers";
import { useWishlistHandlers } from "./_components/useWishlistHandlers";
import { useNavigationHandlers } from "./_components/useNavigationHandlers";
import ProductTabs from "./_components/ProductTabs";
import ConfirmRemoveDialog from "./_components/ConfirmRemoveDialog";
import CustomizeDialog from "./_components/CustomizeDialog";

const ProductDetailsPage = () => {
  const t = useTranslations();
  const { langDir } = useAuth();

  const state = useProductPageState();
  const {
    searchParams, router, queryClient,
    haveAccessToken, deviceId, me,
    productDetails, productInWishlist, otherSellerDetails,
    otherSellerId, otherProductId,
    productQueryById, productQueryByOtherSeller,
    calculateTagIds,
    productVariantTypes, productVariants,
    selectedProductVariant, setSelectedProductVariant,
    cartListByUser, cartListByDeviceQuery, memoizedCartList,
    hasItemByUser, hasItemByDevice,
    getProductQuantityByUser, getProductQuantityByDevice,
    getProductVariantByUser, getProductVariantByDevice,
    globalQuantity, setGlobalQuantity,
    setIsVisible,
    activeTab, setActiveTab,
    isConfirmDialogOpen, setIsConfirmDialogOpen, handleConfirmDialog, confirmDialogRef,
    isCustomizeDialogOpen, setIsCustomizeDialogOpen, handleCustomizeDialog,
    isShareLinkProcessed, setIsShareLinkProcessed,
    handleProductUpdateSuccess, onCancelRemove,
    productQueryById_data_generatedLinkDetail,
    updateCartWithLogin, updateCartByDevice,
    deleteCartItem, deleteServiceFromCart,
    addToWishlist, deleteFromWishlist,
  } = state;

  const {
    handleRemoveItemFromCart, handleAddToCart,
    handleQuantity, onConfirmRemove,
    selectProductVariant: selectVariant,
  } = useCartHandlers({
    productDetails, haveAccessToken, deviceId,
    globalQuantity, setGlobalQuantity, setIsVisible,
    setIsConfirmDialogOpen, setIsCustomizeDialogOpen,
    selectedProductVariant, hasItemByUser, hasItemByDevice,
    getProductQuantityByUser, getProductQuantityByDevice,
    cartListByUser, cartListByDeviceQuery, memoizedCartList,
    updateCartWithLogin, updateCartByDevice,
    deleteCartItem, deleteServiceFromCart,
    productQueryById_data_generatedLinkDetail,
  });

  const { handleAddToWishlist } = useWishlistHandlers({
    searchParams, queryClient, me, productInWishlist,
    addToWishlist, deleteFromWishlist,
    productDetails, memoizedCartList,
    cartListByUser, cartListByDeviceQuery,
    isShareLinkProcessed, setIsShareLinkProcessed,
    productQueryById_data_generatedLinkDetail,
    handleRemoveItemFromCart, handleAddToCart,
  });

  const { handleCheckoutPage, handelOpenCartLayout } = useNavigationHandlers({
    productDetails, globalQuantity,
    getProductQuantityByUser, getProductQuantityByDevice,
    router, setIsVisible, handleAddToCart,
  });

  const selectProductVariant = (variant: any) => {
    selectVariant(variant, setSelectedProductVariant);
  };

  useEffect(() => {
    setGlobalQuantity(getProductQuantityByUser || getProductQuantityByDevice || 0);
    if (getProductVariantByDevice || getProductVariantByUser) {
      setSelectedProductVariant(getProductVariantByDevice || getProductVariantByUser);
    } else {
      setSelectedProductVariant(
        productVariantTypes?.map((variantType: string) =>
          productVariants?.find((variant: any) => variant.type == variantType),
        ),
      );
    }
  }, [cartListByUser.data?.data, cartListByDeviceQuery.data?.data, productVariants?.length]);

  // Buygroup timing (not relevant for factory products, but needed for ProductDescriptionCard)
  const isBuygroup = false;
  const saleNotStarted = false;
  const saleExpired = false;
  const buygroupStartTime = 0;
  const buygroupEndTime = 0;

  const price0 = productDetails?.product_productPrice?.[0];

  return (
    <>
      <title dir={langDir} translate="no">{`${t("factories")} | Ultrasooq`}</title>

      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="bg-card">
          <div className="container mx-auto max-w-7xl px-4 py-8 lg:px-8">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
              <div className="lg:col-span-6">
                <div className="sticky top-4">
                  <ProductImagesCard
                    productDetails={productDetails}
                    onProductUpdateSuccess={handleProductUpdateSuccess}
                    onAdd={() => handleAddToCart(globalQuantity, "add")}
                    onToCart={async () => {
                      const resp = await handleAddToCart(
                        globalQuantity || price0?.minQuantityPerCustomer || 1,
                        "add",
                      );
                      if (resp === true) router.push("/checkout");
                    }}
                    onToCheckout={handleCheckoutPage}
                    openCartCard={handelOpenCartLayout}
                    hasItem={hasItemByUser || hasItemByDevice}
                    isLoading={!(productQueryById.isFetched || productQueryByOtherSeller.isFetched)}
                    onWishlist={handleAddToWishlist}
                    haveAccessToken={haveAccessToken}
                    inWishlist={!!productInWishlist}
                    askForPrice={price0?.askForPrice}
                    isAddedToCart={hasItemByUser || hasItemByDevice}
                    cartQuantity={globalQuantity}
                    additionalMarketingImages={productDetails?.additionalMarketingImages}
                  />
                </div>
              </div>

              <div className="lg:col-span-6">
                <ProductDescriptionCard
                  productId={searchParams?.id ? (searchParams?.id as string) : ""}
                  productName={productDetails?.productName}
                  productType="F"
                  brand={productDetails?.brand?.brandName}
                  productPrice={productDetails?.productPrice}
                  offerPrice={price0?.offerPrice}
                  skuNo={productDetails?.skuNo}
                  category={productDetails?.category?.name}
                  productTags={productDetails?.productTags}
                  productShortDescription={productDetails?.product_productShortDescription}
                  productQuantity={globalQuantity || getProductQuantityByUser || getProductQuantityByDevice}
                  onQuantityChange={handleQuantity}
                  productReview={productDetails?.productReview}
                  onAdd={handleAddToCart}
                  isLoading={
                    !otherSellerId && !otherProductId
                      ? !productQueryById.isFetched
                      : !productQueryByOtherSeller.isFetched
                  }
                  soldBy={
                    price0?.adminDetail?.accountName ||
                    price0?.adminDetail?.userProfile?.companyName ||
                    `${price0?.adminDetail?.firstName || ""} ${price0?.adminDetail?.lastName || ""}`.trim() ||
                    "Unknown Seller"
                  }
                  soldByTradeRole={price0?.adminDetail?.tradeRole}
                  userId={me.data?.data?.id}
                  sellerId={price0?.adminDetail?.id}
                  adminId={price0?.adminDetail?.id}
                  haveOtherSellers={!!otherSellerDetails?.length}
                  productProductPrice={price0?.productPrice}
                  consumerDiscount={price0?.consumerDiscount}
                  consumerDiscountType={price0?.consumerDiscountType}
                  vendorDiscount={price0?.vendorDiscount}
                  vendorDiscountType={price0?.vendorDiscountType}
                  askForPrice={price0?.askForPrice}
                  minQuantity={price0?.minQuantityPerCustomer}
                  maxQuantity={price0?.maxQuantityPerCustomer}
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
                  sellType={price0?.sellType}
                  dateOpen={price0?.dateOpen}
                  startTime={price0?.startTime}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto max-w-7xl px-4 py-8 lg:px-8">
          <div className="grid grid-cols-1 gap-8">
            <div className="w-full">
              <ProductTabs
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                productDetails={productDetails}
                searchParams={searchParams}
                haveAccessToken={haveAccessToken}
                memoizedCartList={memoizedCartList}
                me={me}
              />
            </div>
          </div>
        </div>

        <RelatedProductsSection
          calculateTagIds={calculateTagIds}
          productId={searchParams?.id as string}
        />
      </div>

      <Footer />

      <ConfirmRemoveDialog
        isOpen={isConfirmDialogOpen}
        onOpenChange={handleConfirmDialog}
        onConfirm={() => onConfirmRemove(productDetails?.id)}
        onCancel={onCancelRemove}
        confirmDialogRef={confirmDialogRef}
      />

      <CustomizeDialog
        isOpen={isCustomizeDialogOpen}
        onOpenChange={handleCustomizeDialog}
        selectedProductId={Number(searchParams?.id)}
      />
    </>
  );
};

export default ProductDetailsPage;
