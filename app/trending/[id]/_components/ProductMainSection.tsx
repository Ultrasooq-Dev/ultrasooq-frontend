"use client";
import React from "react";
import { useRouter } from "next/navigation";
import ProductImagesCard from "@/components/modules/productDetails/ProductImagesCard";
import ProductDescriptionCard from "@/components/modules/productDetails/ProductDescriptionCard";

interface ProductMainSectionProps {
  productDetails: any;
  pageId: string;
  globalQuantity: number;
  getProductQuantityByUser: number | undefined;
  getProductQuantityByDevice: number | undefined;
  hasItemByUser: boolean;
  hasItemByDevice: boolean;
  productQueryById: any;
  productQueryByOtherSeller: any;
  otherSellerId: string | null;
  otherProductId: string | null;
  otherSellerDetails: any;
  productVariantTypes: string[] | undefined;
  productVariants: any[] | undefined;
  selectedProductVariant: any;
  productInWishlist: any;
  haveAccessToken: boolean;
  isBuygroup: boolean;
  saleNotStarted: boolean;
  saleExpired: boolean;
  buygroupStartTime: number;
  buygroupEndTime: number;
  soldBy: string;
  meDataId: number | undefined;
  handleAddToCart: (quantity: number, action: "add" | "remove", variant?: any) => Promise<any>;
  handleQuantity: (quantity: number, action: "add" | "remove") => void;
  handleCheckoutPage: () => Promise<void>;
  handelOpenCartLayout: () => void;
  handleProductUpdateSuccess: () => void;
  handleAddToWishlist: () => Promise<void>;
  selectProductVariant: (variant: any) => void;
  setIsChatOpen: (open: boolean) => void;
}

export default function ProductMainSection({
  productDetails, pageId, globalQuantity, getProductQuantityByUser, getProductQuantityByDevice,
  hasItemByUser, hasItemByDevice, productQueryById, productQueryByOtherSeller,
  otherSellerId, otherProductId, otherSellerDetails,
  productVariantTypes, productVariants, selectedProductVariant, productInWishlist,
  haveAccessToken, isBuygroup, saleNotStarted, saleExpired, buygroupStartTime, buygroupEndTime,
  soldBy, meDataId,
  handleAddToCart, handleQuantity, handleCheckoutPage, handelOpenCartLayout,
  handleProductUpdateSuccess, handleAddToWishlist, selectProductVariant, setIsChatOpen,
}: ProductMainSectionProps) {
  const router = useRouter();

  const pp = productDetails?.product_productPrice?.[0];

  return (
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
                  const minQuantity = pp?.minQuantityPerCustomer;
                  const resp = await handleAddToCart(globalQuantity || minQuantity || 1, "add");
                  if (resp === true) router.push("/checkout");
                }}
                onToCheckout={handleCheckoutPage}
                openCartCard={handelOpenCartLayout}
                hasItem={hasItemByUser || hasItemByDevice}
                isLoading={!(productQueryById.isFetched || productQueryByOtherSeller.isFetched)}
                onWishlist={handleAddToWishlist}
                haveAccessToken={haveAccessToken}
                inWishlist={!!productInWishlist}
                askForPrice={pp?.askForPrice}
                isAddedToCart={hasItemByUser || hasItemByDevice}
                cartQuantity={globalQuantity}
                additionalMarketingImages={productDetails?.additionalMarketingImages}
                saleNotStarted={saleNotStarted}
                saleExpired={saleExpired}
              />
            </div>
          </div>

          <div className="lg:col-span-6">
            <ProductDescriptionCard
              productId={pageId}
              productName={productDetails?.productName}
              productType={productDetails?.productType}
              brand={productDetails?.brand?.brandName}
              productPrice={productDetails?.productPrice}
              offerPrice={pp?.offerPrice}
              skuNo={productDetails?.skuNo}
              category={productDetails?.category?.name}
              categoryId={productDetails?.categoryId}
              categoryLocation={productDetails?.categoryLocation}
              consumerType={pp?.consumerType}
              productTags={productDetails?.productTags}
              productShortDescription={productDetails?.product_productShortDescription}
              productQuantity={globalQuantity || getProductQuantityByUser || getProductQuantityByDevice}
              onQuantityChange={handleQuantity}
              productReview={productDetails?.productReview}
              onAdd={handleAddToCart}
              onBuyNow={handleCheckoutPage}
              isLoading={
                !otherSellerId && !otherProductId
                  ? !productQueryById.isFetched
                  : !productQueryByOtherSeller.isFetched
              }
              soldBy={soldBy}
              soldByTradeRole={pp?.adminDetail?.tradeRole}
              userId={meDataId}
              sellerId={pp?.adminDetail?.id}
              adminId={pp?.adminDetail?.id}
              onOpenChat={() => setIsChatOpen(true)}
              haveOtherSellers={!!otherSellerDetails?.length}
              productProductPrice={pp?.productPrice}
              consumerDiscount={pp?.consumerDiscount}
              consumerDiscountType={pp?.consumerDiscountType}
              vendorDiscount={pp?.vendorDiscount}
              vendorDiscountType={pp?.vendorDiscountType}
              askForPrice={pp?.askForPrice}
              minQuantity={pp?.minQuantityPerCustomer}
              maxQuantity={pp?.maxQuantityPerCustomer}
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
              sellType={pp?.sellType}
              dateOpen={pp?.dateOpen}
              startTime={pp?.startTime}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
