"use client";
import React from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { useCheckout } from "./_components/useCheckout";
import CheckoutAddress from "./_components/CheckoutAddress";
import CheckoutCartItems from "./_components/CheckoutCartItems";
import CheckoutRfqItems from "./_components/CheckoutRfqItems";
import CheckoutSummary from "./_components/CheckoutSummary";
import CheckoutDialogs from "./_components/CheckoutDialogs";

const CheckoutPage = () => {
  const t = useTranslations();
  const { langDir } = useAuth();

  const {
    currency,
    me,
    // state
    router,
    wrapperRef,
    confirmDialogRef,
    shippingModalRef,
    haveAccessToken,
    isAddModalOpen,
    setIsAddModalOpen,
    selectedAddressId,
    setSelectedAddressId,
    selectedOrderDetails,
    addressType,
    setAddressType,
    guestShippingAddress,
    setGuestShippingAddress,
    guestBillingAddress,
    setGuestBillingAddress,
    guestEmail,
    setGuestEmail,
    itemsTotal,
    fee,
    totalAmount,
    sellerIds,
    shippingInfo,
    setShippingInfo,
    shippingErrors,
    shippingCharge,
    rfqQuoteData,
    isFromRfq,
    selectedCartId,
    setSelectedCartId,
    isConfirmDialogOpen,
    setIsConfirmDialogOpen,
    handleConfirmDialog,
    selectedSellerId,
    setSelectedSellerId,
    selectedShippingType,
    setSelectedShippingType,
    fromCityId,
    setFromCityId,
    toCityId,
    setToCityId,
    isShippingModalOpen,
    setIsShippingModalOpen,
    handleShippingModal,
    handleToggleAddModal,
    selectedShippingAddressId,
    setSelectedShippingAddressId,
    invalidProducts,
    notAvailableProducts,
    handleOrderDetails,
    // queries
    memoizedCartList,
    memoziedAddressList,
    productPricingInfoMap,
    cartListByDeviceQuery,
    cartListByUser,
    allUserAddressQuery,
    preOrderCalculation,
    rfqQuoteDetailsQuery,
    rfqQuoteDetails,
    // handlers
    handleAddToCart,
    handleAddToWishlist,
    handleRemoveServiceFromCart,
    handleDeleteAddress,
    onConfirmRemove,
    onCancelRemove,
    onSaveOrder,
  } = useCheckout();

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Page header */}
        <div className="mb-8">
          <h1
            className="text-3xl font-bold text-foreground"
            dir={langDir}
            translate="no"
          >
            {t("checkout")}
          </h1>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left column: address + cart items */}
          <div className="space-y-6 lg:col-span-2">
            {/* Address section */}
            <CheckoutAddress
              me={me}
              memoziedAddressList={memoziedAddressList}
              selectedShippingAddressId={selectedShippingAddressId}
              setSelectedShippingAddressId={setSelectedShippingAddressId}
              selectedOrderDetails={selectedOrderDetails}
              guestShippingAddress={guestShippingAddress}
              guestBillingAddress={guestBillingAddress}
              guestEmail={guestEmail}
              setGuestEmail={setGuestEmail}
              setAddressType={setAddressType}
              handleToggleAddModal={handleToggleAddModal}
              handleOrderDetails={handleOrderDetails}
              handleDeleteAddress={handleDeleteAddress}
              setSelectedAddressId={setSelectedAddressId}
            />

            {/* RFQ items (shown only for RFQ orders) */}
            {isFromRfq && (
              <CheckoutRfqItems
                rfqQuoteData={rfqQuoteData}
                rfqQuoteDetails={rfqQuoteDetails}
              />
            )}

            {/* Regular cart items (shown only for non-RFQ orders) */}
            {!isFromRfq && (
              <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-border bg-muted">
                  <h2
                    className="text-xl font-semibold text-foreground"
                    dir={langDir}
                    translate="no"
                  >
                    {t("your_cart")}
                  </h2>
                </div>
                <div className="p-6">
                  <CheckoutCartItems
                    memoizedCartList={memoizedCartList}
                    sellerIds={sellerIds}
                    shippingInfo={shippingInfo}
                    setShippingInfo={setShippingInfo}
                    shippingErrors={shippingErrors}
                    productPricingInfoMap={productPricingInfoMap}
                    invalidProducts={invalidProducts}
                    notAvailableProducts={notAvailableProducts}
                    haveAccessToken={haveAccessToken}
                    memoziedAddressList={memoziedAddressList}
                    selectedShippingAddressId={selectedShippingAddressId}
                    setSelectedSellerId={setSelectedSellerId}
                    setSelectedShippingType={setSelectedShippingType}
                    setFromCityId={setFromCityId}
                    setToCityId={setToCityId}
                    setIsShippingModalOpen={setIsShippingModalOpen}
                    setIsConfirmDialogOpen={setIsConfirmDialogOpen}
                    setSelectedCartId={setSelectedCartId}
                    handleAddToCart={handleAddToCart}
                    handleAddToWishlist={handleAddToWishlist}
                    handleRemoveServiceFromCart={handleRemoveServiceFromCart}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right column: order summary */}
          <CheckoutSummary
            itemsTotal={itemsTotal}
            shippingCharge={shippingCharge}
            fee={fee}
            totalAmount={totalAmount}
            isFromRfq={isFromRfq}
            rfqQuoteData={rfqQuoteData}
            memoizedCartList={memoizedCartList}
            rfqQuoteDetailsQuery={rfqQuoteDetailsQuery}
            updateCartByDevice={null}
            updateCartWithLogin={null}
            cartListByDeviceQuery={cartListByDeviceQuery}
            cartListByUser={cartListByUser}
            allUserAddressQuery={allUserAddressQuery}
            preOrderCalculation={preOrderCalculation}
            onSaveOrder={onSaveOrder}
          />
        </div>
      </div>

      {/* Modals and dialogs */}
      <CheckoutDialogs
        isAddModalOpen={isAddModalOpen}
        handleToggleAddModal={handleToggleAddModal}
        wrapperRef={wrapperRef}
        me={me}
        selectedAddressId={selectedAddressId}
        setIsAddModalOpen={setIsAddModalOpen}
        setSelectedAddressId={setSelectedAddressId}
        setAddressType={setAddressType}
        addressType={addressType}
        guestShippingAddress={guestShippingAddress}
        guestBillingAddress={guestBillingAddress}
        setGuestShippingAddress={setGuestShippingAddress}
        setGuestBillingAddress={setGuestBillingAddress}
        isConfirmDialogOpen={isConfirmDialogOpen}
        handleConfirmDialog={handleConfirmDialog}
        confirmDialogRef={confirmDialogRef}
        onCancelRemove={onCancelRemove}
        onConfirmRemove={onConfirmRemove}
        isShippingModalOpen={isShippingModalOpen}
        handleShippingModal={handleShippingModal}
        shippingModalRef={shippingModalRef}
        selectedSellerId={selectedSellerId}
        selectedShippingType={selectedShippingType}
        fromCityId={fromCityId}
        toCityId={toCityId}
        setSelectedSellerId={setSelectedSellerId}
        setSelectedShippingType={setSelectedShippingType}
        setFromCityId={setFromCityId}
        setToCityId={setToCityId}
        setIsShippingModalOpen={setIsShippingModalOpen}
        shippingInfo={shippingInfo}
        setShippingInfo={setShippingInfo}
      />
    </div>
  );
};

export default CheckoutPage;
