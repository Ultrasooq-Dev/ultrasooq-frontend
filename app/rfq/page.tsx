"use client";
import React, { use } from "react";
import dynamic from "next/dynamic";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import Footer from "@/components/shared/Footer";
import { cn } from "@/lib/utils";
import { RfqPageProps } from "./_components/types";
import { useRfqPageState } from "./_components/useRfqPageState";
import FilterSidebar from "./_components/FilterSidebar";
import FilterDrawer from "./_components/FilterDrawer";
import DesktopCartSidebar from "./_components/DesktopCartSidebar";
import MobileCartDrawer from "./_components/MobileCartDrawer";
import ProductsSection from "./_components/ProductsSection";

const AddToRfqForm = dynamic(
  () => import("@/components/modules/rfq/AddToRfqForm"),
  {
    loading: () => <div className="animate-pulse h-64 bg-muted rounded-lg" />,
    ssr: false,
  },
);

const RfqPage = (props: RfqPageProps) => {
  const searchParams = props.searchParams ? use(props.searchParams) : {};

  const state = useRfqPageState(searchParams?.term);

  const {
    t,
    langDir,
    isRTL,
    filterSheetSide,
    cartSheetSide,
    wrapperRef,
    minPriceInputRef,
    maxPriceInputRef,
    searchInputRef,
    viewType,
    setViewType,
    sortBy,
    setSortBy,
    searchTermBrand,
    selectedBrandIds,
    productFilter,
    setProductFilter,
    showCartDrawer,
    setShowCartDrawer,
    haveAccessToken,
    page,
    setPage,
    limit,
    quantity,
    offerPriceFrom,
    offerPriceTo,
    cartList,
    isAddToCartModalOpen,
    selectedProductId,
    me,
    rfqProductsQuery,
    memoizedBrands,
    memoizedRfqProducts,
    updateRfqCartWithLogin,
    deleteRfqCartItem,
    handleToggleAddModal,
    handleRfqDebounce,
    handlePriceDebounce,
    handleMinPriceChange,
    handleMaxPriceChange,
    handleBrandChange,
    handleBrandSearchChange,
    handleBrandSearch,
    handleRFQCart,
    handleAddToCart,
    handleCartPage,
    handleRemoveItemFromCart,
    handleAddToWishlist,
    selectAll,
    clearFilter,
    setIsAddToCartModalOpen,
    setSelectedProductId,
    setQuantity,
    setPriceRange,
    currency,
  } = state;

  return (
    <>
      <title dir={langDir} translate="no">{`${t("rfq")} | Ultrasooq`}</title>
      <div className="body-content-s1 bg-card">
        {/* Full Width Two Column Layout */}
        <div className="min-h-screen w-full bg-card px-2 sm:px-4 lg:px-8">
          <div
            className={cn(
              "flex h-full flex-col gap-4",
              isRTL ? "lg:flex-row-reverse" : "lg:flex-row",
            )}
          >
            {/* Sidebar - Filters (Desktop) */}
            <FilterSidebar
              t={t}
              langDir={langDir}
              currency={currency}
              memoizedBrands={memoizedBrands}
              selectedBrandIds={selectedBrandIds}
              searchTermBrand={searchTermBrand}
              minPriceInputRef={minPriceInputRef}
              maxPriceInputRef={maxPriceInputRef}
              onSelectAll={selectAll}
              onClearFilter={clearFilter}
              onBrandSearchChange={handleBrandSearchChange}
              onBrandSearch={handleBrandSearch}
              onBrandChange={handleBrandChange}
              onPriceDebounce={handlePriceDebounce}
              onMinPriceChange={handleMinPriceChange}
              onMaxPriceChange={handleMaxPriceChange}
              onClearPrice={() => setPriceRange([])}
            />

            {/* Main Content Column */}
            <ProductsSection
              t={t}
              langDir={langDir}
              isRTL={isRTL}
              cartList={cartList}
              haveAccessToken={haveAccessToken}
              searchParams={searchParams}
              viewType={viewType}
              setViewType={setViewType}
              sortBy={sortBy}
              setSortBy={setSortBy}
              rfqProductsQuery={rfqProductsQuery}
              memoizedRfqProducts={memoizedRfqProducts}
              me={me}
              page={page}
              setPage={setPage}
              limit={limit}
              searchInputRef={searchInputRef}
              onOpenFilterDrawer={() => setProductFilter(true)}
              onOpenCartDrawer={() => setShowCartDrawer(true)}
              onRfqDebounce={handleRfqDebounce}
              onRFQCart={handleRFQCart}
              onCartPage={handleCartPage}
              onAddToWishlist={handleAddToWishlist}
            />
          </div>
        </div>

        {/* Mobile Filter Drawer */}
        <FilterDrawer
          t={t}
          langDir={langDir}
          currency={currency}
          open={productFilter}
          onOpenChange={setProductFilter}
          filterSheetSide={filterSheetSide}
          memoizedBrands={memoizedBrands}
          selectedBrandIds={selectedBrandIds}
          searchTermBrand={searchTermBrand}
          onSelectAll={selectAll}
          onClearFilter={clearFilter}
          onBrandSearchChange={handleBrandSearchChange}
          onBrandSearch={handleBrandSearch}
          onBrandChange={handleBrandChange}
          onPriceDebounce={handlePriceDebounce}
          onMinPriceChange={handleMinPriceChange}
          onMaxPriceChange={handleMaxPriceChange}
          onClearPrice={() => setPriceRange([])}
        />

        {/* Fixed Desktop Cart Sidebar */}
        <DesktopCartSidebar
          t={t}
          isRTL={isRTL}
          cartList={cartList}
          memoizedRfqProducts={memoizedRfqProducts}
          updateRfqCartIsPending={updateRfqCartWithLogin.isPending}
          deleteRfqCartIsPending={deleteRfqCartItem.isPending}
          onAddToCart={handleAddToCart}
          onRemoveItemFromCart={handleRemoveItemFromCart}
        />

        {/* Mobile Cart Drawer */}
        <MobileCartDrawer
          t={t}
          open={showCartDrawer}
          onOpenChange={setShowCartDrawer}
          cartSheetSide={cartSheetSide}
          cartList={cartList}
          memoizedRfqProducts={memoizedRfqProducts}
          deleteRfqCartIsPending={deleteRfqCartItem.isPending}
          onRemoveItemFromCart={handleRemoveItemFromCart}
        />

        {/* Add to Cart Modal */}
        <Dialog open={isAddToCartModalOpen} onOpenChange={handleToggleAddModal}>
          <DialogContent
            className="add-new-address-modal gap-0 p-0 md:max-w-2xl!"
            ref={wrapperRef}
          >
            <AddToRfqForm
              onClose={() => {
                setIsAddToCartModalOpen(false);
                setSelectedProductId(undefined);
                setQuantity(undefined);
              }}
              selectedProductId={selectedProductId}
              selectedQuantity={quantity}
              offerPriceFrom={offerPriceFrom}
              offerPriceTo={offerPriceTo}
            />
          </DialogContent>
        </Dialog>
      </div>
      <Footer />
    </>
  );
};

export default RfqPage;
