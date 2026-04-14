"use client";
import { CartRecommendations } from "@/components/modules/recommendations/CartRecommendations";
import dynamic from "next/dynamic";
import { useCart } from "./_components/useCart";
import CartTabHeader from "./_components/CartTabHeader";
import CartItemList from "./_components/CartItemList";
import CartSummary from "./_components/CartSummary";
import CartRecommendedProducts from "./_components/CartRecommendedProducts";

const RfqCartTab = dynamic(
  () => import("@/components/modules/rfqCart/RfqCartTab"),
  {
    loading: () => (
      <div className="py-12 text-center text-muted-foreground">
        Loading RFQ Cart...
      </div>
    ),
  },
);

const CartListPage = () => {
  const {
    langDir,
    currency,
    activeCartTab,
    setActiveCartTab,
    haveAccessToken,
    loading,
    totalAmount,
    memoizedCartList,
    cartListByUser,
    cartListByDeviceQuery,
    cartRecommendationsQuery,
    recommendedProducts,
    currentTradeRole,
    vendorBusinessCategoryIds,
    handleRemoveProductFromCart,
    handleRemoveServiceFromCart,
    handleAddToWishlist,
    handleRecommendedAddToCart,
  } = useCart();

  return (
    <div className="min-h-screen bg-card">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header + Tabs */}
        <CartTabHeader
          langDir={langDir}
          activeCartTab={activeCartTab}
          setActiveCartTab={setActiveCartTab}
          cartItemCount={memoizedCartList.length}
        />

        {activeCartTab === "rfq" ? (
          <RfqCartTab />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              {/* Left Column - Cart Items */}
              <div className="lg:col-span-8">
                <CartItemList
                  memoizedCartList={memoizedCartList}
                  loading={loading}
                  haveAccessToken={haveAccessToken}
                  cartByUserEmpty={!cartListByUser.data?.data?.length}
                  cartByUserLoading={cartListByUser.isLoading}
                  cartByDeviceEmpty={!cartListByDeviceQuery.data?.data?.length}
                  cartByDeviceLoading={cartListByDeviceQuery.isLoading}
                  langDir={langDir}
                  onRemoveProduct={handleRemoveProductFromCart}
                  onRemoveService={handleRemoveServiceFromCart}
                  onWishlist={handleAddToWishlist}
                />
              </div>

              {/* Right Column - Order Summary */}
              <div className="lg:col-span-4">
                <CartSummary
                  langDir={langDir}
                  currency={currency}
                  totalAmount={totalAmount}
                  itemCount={memoizedCartList.length}
                />
              </div>
            </div>

            {/* Recommended Products Carousel */}
            <div className="w-full bg-muted">
              <div className="mx-auto w-full px-2 sm:px-4 lg:px-6">
                <div className="space-y-8">
                  {memoizedCartList.length > 0 && (
                    <CartRecommendedProducts
                      langDir={langDir}
                      currency={currency}
                      recommendedProducts={recommendedProducts}
                      isLoading={cartRecommendationsQuery.isLoading}
                      currentTradeRole={currentTradeRole}
                      vendorBusinessCategoryIds={vendorBusinessCategoryIds}
                      onAddToCart={handleRecommendedAddToCart}
                    />
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Cross-sell recommendations */}
      {memoizedCartList.length > 0 && (
        <div className="w-full px-2 pb-8 sm:px-4 lg:px-6">
          <CartRecommendations enabled={memoizedCartList.length > 0} />
        </div>
      )}
    </div>
  );
};

export default CartListPage;
