"use client";
import React from "react";
import TrendingCategories from "@/components/modules/trending/TrendingCategories";
import Footer from "@/components/shared/Footer";
import { useBuygroupPage } from "./_components/useBuygroupPage";
import { TrendingPageProps } from "./_components/buygroupTypes";
import BuygroupCarousel from "./_components/BuygroupCarousel";
import BuygroupFilters from "./_components/BuygroupFilters";
import BuygroupProductList from "./_components/BuygroupProductList";
import BuygroupDesktopCartSidebar from "./_components/BuygroupDesktopCartSidebar";
import BuygroupMobileCartDrawer from "./_components/BuygroupMobileCartDrawer";
import BuygroupMobileFilterDrawer from "./_components/BuygroupMobileFilterDrawer";

export default function BuygroupPage(props: TrendingPageProps) {
  const state = useBuygroupPage(props);
  const {
    langDir, currency, isRTL,
    filterSheetSide, cartSheetSide,
    memoizedBrands, selectedBrandIds,
    minPriceInputRef, maxPriceInputRef,
    selectAll, clearFilter, handleBrandChange,
    handleDebounce, handlePriceDebounce,
    handleMinPriceChange, handleMaxPriceChange,
    setPriceRange,
    allProductsQuery, comingSoonProducts, memoizedProductList, productVariants,
    viewType, setViewType,
    sortBy, setSortBy,
    page, setPage, limit,
    productFilter, setProductFilter,
    showCartDrawer, setShowCartDrawer,
    haveAccessToken, deviceId,
    category, cart,
    handleAddToWishlist,
  } = state;

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-[1400px] px-4 py-6">
        {/* Coming soon carousel */}
        {comingSoonProducts.length > 0 && (
          <div className="mb-6">
            <BuygroupCarousel list={comingSoonProducts} />
          </div>
        )}

        <div className="flex gap-6">
          {/* Desktop filter sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <BuygroupFilters
              langDir={langDir}
              currency={currency}
              memoizedBrands={memoizedBrands}
              selectedBrandIds={selectedBrandIds}
              minPriceInputRef={minPriceInputRef as React.RefObject<HTMLInputElement>}
              maxPriceInputRef={maxPriceInputRef as React.RefObject<HTMLInputElement>}
              onSelectAll={selectAll}
              onClearFilter={clearFilter}
              onBrandChange={handleBrandChange}
              onBrandSearch={handleDebounce}
              onPriceSliderChange={handlePriceDebounce}
              onMinPriceChange={handleMinPriceChange}
              onMaxPriceChange={handleMaxPriceChange}
              onClearPrice={clearFilter}
            />
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0">
            <TrendingCategories />
            <BuygroupProductList
              langDir={langDir}
              isRTL={isRTL}
              cartListLength={cart.cartList?.length ?? 0}
              viewType={viewType}
              setViewType={setViewType}
              sortBy={sortBy}
              setSortBy={setSortBy}
              isLoading={allProductsQuery.isLoading}
              memoizedProductList={memoizedProductList}
              cartList={cart.cartList ?? []}
              productVariants={productVariants}
              haveAccessToken={haveAccessToken}
              deviceId={deviceId}
              page={page}
              setPage={setPage}
              limit={limit}
              totalCount={allProductsQuery.data?.totalCount ?? 0}
              onOpenFilter={() => setProductFilter(true)}
              onOpenCart={() => setShowCartDrawer(true)}
              onWishlist={handleAddToWishlist}
              onAddToCartLogin={async (productPriceId: number, quantity: number, productVariant: any) =>
                cart.updateCartWithLogin.mutateAsync({ productPriceId, quantity, productVariant })
              }
              onAddToCartDevice={async (productPriceId: number, quantity: number, deviceId: string, productVariant: any) =>
                cart.updateCartByDevice.mutateAsync({ productPriceId, quantity, deviceId, productVariant })
              }
            />
          </main>

          {/* Desktop cart sidebar */}
          <BuygroupDesktopCartSidebar
            cartList={cart.cartList ?? []}
            cartSubtotal={cart.cartSubtotal ?? 0}
            currency={currency}
            langDir={langDir}
            isRTL={isRTL}
            memoizedProductList={memoizedProductList}
            getCartPricing={cart.getCartPricing}
            onRemoveItem={cart.handleRemoveItemFromCart}
            onUpdateQuantity={cart.handleUpdateCartQuantity}
            deleteCartItemPending={cart.deleteCartItem.isPending}
            updateCartWithLoginPending={cart.updateCartWithLogin.isPending}
            updateCartByDevicePending={cart.updateCartByDevice.isPending}
          />
        </div>
      </div>

      <Footer />

      {/* Mobile drawers */}
      <BuygroupMobileFilterDrawer
        open={productFilter}
        onOpenChange={setProductFilter}
        side={filterSheetSide}
        langDir={langDir}
        currency={currency}
        memoizedBrands={memoizedBrands}
        selectedBrandIds={selectedBrandIds}
        categoryIds={category.categoryIds ?? ""}
        onSelectAll={selectAll}
        onClearFilter={clearFilter}
        onBrandChange={handleBrandChange}
        onBrandSearch={handleDebounce}
        onCategoryChange={(ids) => {}}
        onCategoryClear={() => {}}
        onPriceSliderChange={handlePriceDebounce}
        onMinPriceChange={handleMinPriceChange}
        onMaxPriceChange={handleMaxPriceChange}
        onClearPrice={clearFilter}
      />

      <BuygroupMobileCartDrawer
        open={showCartDrawer}
        onOpenChange={setShowCartDrawer}
        side={cartSheetSide}
        cartList={cart.cartList ?? []}
        currency={currency}
        memoizedProductList={memoizedProductList}
        getCartPricing={cart.getCartPricing}
      />
    </div>
  );
}
