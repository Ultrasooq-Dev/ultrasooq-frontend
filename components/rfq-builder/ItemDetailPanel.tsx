/**
 * ItemDetailPanel — Panel 3 of Product Hub (/product-hub)
 *
 * Features: Product search, 8-chip filter system, product detail view,
 *           buy/customize tab, specs & requirements tab
 *
 * Filter system docs: docs/filter-chip-system.md
 * Product Hub docs:   frontend/docs/PRODUCT-HUB.md
 * Search engine docs: docs/product-intelligence-engine.md
 *
 * Backend endpoints:
 *   GET /product/search/unified  — Intelligent search with filter chips
 *   GET /product/getAllProduct    — Fallback traditional search
 *   GET /product/findOne          — Full product detail
 */
"use client";
import React, { useState, useEffect } from "react";
import { track } from "@/lib/analytics";
import { useTrackProductClick } from "@/apis/queries/product.queries";
import { getOrCreateDeviceId } from "@/utils/helper";

import { FilterChipBar } from "./cards/FilterChipBar";
import { ProductDetailView } from "./panels/ProductDetailView";
import { BuyTab } from "./panels/BuyTab";

import type { ItemDetailPanelProps } from "./itemDetailTypes";
import { useItemDetailFilters } from "./useItemDetailFilters";
import { useItemDetailSearch } from "./useItemDetailSearch";
import { useItemDetailBuy } from "./useItemDetailBuy";
import { useItemDetailPricing } from "./useItemDetailPricing";
import { ItemDetailBrowseView } from "./ItemDetailBrowseView";
import { ItemDetailTabBar } from "./ItemDetailTabBar";
import { ItemDetailProductsTab } from "./ItemDetailProductsTab";
import { ItemDetailSpecsTab } from "./ItemDetailSpecsTab";
import { ItemDetailChatBar } from "./ItemDetailChatBar";
import { ItemDetailBuygroupDialog } from "./ItemDetailBuygroupDialog";

export default function ItemDetailPanel({
  selectedItemId, searchTerm, onAddToCart, onAddToRfqCart,
  onSelectProduct, locale, activeCategories, onCategoryChange,
}: ItemDetailPanelProps) {
  const isAr = locale === "ar";
  const trackClick = useTrackProductClick();

  const [aiUsedToday, setAiUsedToday] = useState(0);
  const [aiResetHours, setAiResetHours] = useState(24);
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("us_ai_suggest") ?? "{}");
      const today = new Date().toDateString();
      setAiUsedToday(stored.date === today ? (stored.count ?? 0) : 0);
      setAiResetHours(Math.max(1, 24 - new Date().getHours()));
    } catch {}
  }, []);

  const [chatInput, setChatInput] = useState("");
  const [activeTab, setActiveTab] = useState<"products" | "customize" | "buynow">("products");
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [viewingProductId, setViewingProductId] = useState<number | null>(null);
  const [chatExpanded, setChatExpanded] = useState(false);
  const [reqMode, setReqMode] = useState<"rfq" | "vendor">("rfq");
  const [specsOpen, setSpecsOpen] = useState(true);
  const [vendorAttachments, setVendorAttachments] = useState<string[]>([]);
  const vendorFileRef = React.useRef<HTMLInputElement>(null);

  const [cardQtys, setCardQtys] = useState<Record<number, number>>({});
  const getCardQty = (id: number) => cardQtys[id] ?? 0;
  const setCardQty = (id: number, qty: number) =>
    setCardQtys((prev) => ({ ...prev, [id]: Math.max(0, qty) }));

  const [buygroupDisclaimerOpen, setBuygroupDisclaimerOpen] = useState(false);
  const [hasSeenBuygroupDisclaimer, setHasSeenBuygroupDisclaimer] = useState(false);
  const [buygroupPendingProductId, setBuygroupPendingProductId] = useState<number | null>(null);
  const [buygroupPendingQty, setBuygroupPendingQty] = useState(1);
  const openBuygroupDisclaimer = (priceId: number, qty: number) => {
    setBuygroupPendingProductId(priceId);
    setBuygroupPendingQty(qty);
    setBuygroupDisclaimerOpen(true);
  };

  const {
    activeChips, toggleChip, filtersOpen, setFiltersOpen,
    activeFilterCount, clearAllFilters, activeChipDefs, chipFilterParams,
    sortBy, setSortBy, viewMode, setViewMode,
    minRating, setMinRating, stockOnly, setStockOnly,
    discountOnly, setDiscountOnly, filterValues, setFilterValue,
    toggleMultiSelect, searchPage, setSearchPage,
  } = useItemDetailFilters({ activeCategories, onCategoryChange });

  const hasActiveChips = activeChips.size > 0;
  const isBrowseMode = hasActiveChips && !searchTerm?.trim();

  useEffect(() => { setSearchPage(1); }, [searchTerm]);

  const { productSearchQuery, realProducts, recommendedProducts } = useItemDetailSearch({
    searchTerm, searchPage, chipFilterParams, activeChipDefs, hasActiveChips,
  });
  const { buyDetailQuery, buyListings } = useItemDetailBuy({ selectedProductId, activeTab });
  const { productDetailQuery, buygroupTimeLeft, computeDetailPricing, currencySymbol } =
    useItemDetailPricing({ viewingProductId, locale });

  useEffect(() => {
    setSelectedProductId(null);
    setViewingProductId(null);
    setActiveTab("products");
    if (searchTerm) track("rfq_product_search", { term: searchTerm });
  }, [selectedItemId, searchTerm]);

  const selectedProduct = (realProducts ?? []).find((p) => p.id === selectedProductId);
  const viewingProduct = (buyListings ?? []).find((p) => p.productId === viewingProductId);

  const cardCallbacks = {
    onSelectProduct: onSelectProduct ?? (() => {}),
    onSetSelectedProductId: (id: number) => {
      setSelectedProductId(id);
      trackClick.mutate({ productId: id, clickSource: "rfq_panel", deviceId: getOrCreateDeviceId() || undefined });
    },
    onSetActiveTab: setActiveTab,
    onSetReqMode: setReqMode,
    onSetViewingProductId: setViewingProductId,
    onOpenBuygroupDisclaimer: openBuygroupDisclaimer,
    getCardQty, setCardQty, hasSeenBuygroupDisclaimer, currencySymbol,
  };

  if (viewingProductId && (viewingProduct || productDetailQuery.data)) {
    const pricing = computeDetailPricing();
    return (
      <ProductDetailView
        locale={locale} currencySymbol={currencySymbol}
        viewingProductId={viewingProductId} viewingProduct={viewingProduct}
        productDetailQuery={productDetailQuery} selectedProduct={selectedProduct}
        calculatedPrice={pricing.calculatedPrice} originalPrice={pricing.originalPrice}
        hasCalcDiscount={pricing.hasCalcDiscount} calcDiscountPct={pricing.calcDiscountPct}
        pricingInfo={pricing.pricingInfo} buygroupTimeLeft={buygroupTimeLeft}
        onBack={() => setViewingProductId(null)} onAddToCart={onAddToCart}
        onAddToRfqCart={onAddToRfqCart} onSetSelectedProductId={setSelectedProductId}
        onSetReqMode={setReqMode} onSetViewingProductId={setViewingProductId}
        onSetActiveTab={setActiveTab} hasSeenBuygroupDisclaimer={hasSeenBuygroupDisclaimer}
        onOpenBuygroupDisclaimer={openBuygroupDisclaimer}
      />
    );
  }

  if (!selectedItemId && !selectedProductId) {
    return (
      <ItemDetailBrowseView
        locale={locale} isAr={isAr} activeChips={activeChips} toggleChip={toggleChip}
        filtersOpen={filtersOpen} setFiltersOpen={setFiltersOpen}
        activeFilterCount={activeFilterCount} clearAllFilters={clearAllFilters}
        sortBy={sortBy} setSortBy={setSortBy} viewMode={viewMode} setViewMode={setViewMode}
        minRating={minRating} setMinRating={setMinRating}
        stockOnly={stockOnly} setStockOnly={setStockOnly}
        discountOnly={discountOnly} setDiscountOnly={setDiscountOnly}
        filterValues={filterValues} setFilterValue={setFilterValue}
        toggleMultiSelect={toggleMultiSelect} isLoading={productSearchQuery.isLoading}
        realProducts={realProducts} currencySymbol={currencySymbol}
        selectedProductId={selectedProductId} getCardQty={getCardQty} setCardQty={setCardQty}
        cardCallbacks={cardCallbacks}
      />
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0 min-w-0 bg-background overflow-hidden">
      <div className="px-4 py-2 border-b border-border shrink-0">
        <h3 className="text-sm font-bold truncate">
          {selectedProductId ? (
            <button type="button" onClick={() => setViewingProductId(selectedProductId)}
              className="hover:text-primary hover:underline transition-colors text-start">
              {searchTerm ?? selectedProduct?.name ?? selectedItemId ?? ""}
            </button>
          ) : (searchTerm ?? selectedItemId ?? "")}
        </h3>
      </div>

      <FilterChipBar locale={locale} activeChips={activeChips} toggleChip={toggleChip}
        filtersOpen={filtersOpen} setFiltersOpen={setFiltersOpen}
        activeFilterCount={activeFilterCount} clearAllFilters={clearAllFilters} />

      <ItemDetailTabBar
        isAr={isAr} locale={locale} activeTab={activeTab} setActiveTab={setActiveTab}
        selectedProductId={selectedProductId} productCount={(realProducts ?? []).length}
        sortBy={sortBy} setSortBy={setSortBy} viewMode={viewMode} setViewMode={setViewMode}
        activeChips={activeChips} filtersOpen={filtersOpen}
        minRating={minRating} setMinRating={setMinRating}
        stockOnly={stockOnly} setStockOnly={setStockOnly}
        discountOnly={discountOnly} setDiscountOnly={setDiscountOnly}
        filterValues={filterValues} setFilterValue={setFilterValue}
        toggleMultiSelect={toggleMultiSelect}
      />

      <input ref={vendorFileRef} type="file" multiple accept="*/*" className="hidden"
        onChange={(e) => {
          if (e.target.files) {
            const names = Array.from(e.target.files).map((f) => f.name);
            setVendorAttachments((p) => [...p, ...names]);
          }
          e.target.value = "";
        }} />

      <div className="flex-1 overflow-y-auto min-h-0">
        {activeTab === "products" && (
          <ItemDetailProductsTab
            isAr={isAr} locale={locale} searchTerm={searchTerm}
            hasActiveChips={hasActiveChips} isBrowseMode={isBrowseMode}
            activeChips={activeChips} isLoading={productSearchQuery.isLoading}
            realProducts={realProducts} recommendedProducts={recommendedProducts}
            viewMode={viewMode} currencySymbol={currencySymbol}
            selectedProductId={selectedProductId} aiUsedToday={aiUsedToday}
            cardCallbacks={cardCallbacks}
            onCreateRfq={() => { setActiveTab("customize"); setReqMode("rfq"); }}
          />
        )}
        {activeTab === "customize" && (
          <ItemDetailSpecsTab isAr={isAr} selectedProduct={selectedProduct}
            specsOpen={specsOpen} setSpecsOpen={setSpecsOpen}
            vendorAttachments={vendorAttachments} setVendorAttachments={setVendorAttachments}
            vendorFileRef={vendorFileRef} onAddToRfqCart={onAddToRfqCart} />
        )}
        {activeTab === "buynow" && (
          <BuyTab locale={locale} selectedProduct={selectedProduct}
            buyListings={buyListings} buyDetailQuery={buyDetailQuery}
            buygroupTimeLeft={buygroupTimeLeft} getCardQty={getCardQty} setCardQty={setCardQty}
            onAddToCart={onAddToCart} onSetSelectedProductId={setSelectedProductId}
            onSetViewingProductId={setViewingProductId} onSetReqMode={setReqMode}
            onSetActiveTab={setActiveTab} hasSeenBuygroupDisclaimer={hasSeenBuygroupDisclaimer}
            onOpenBuygroupDisclaimer={openBuygroupDisclaimer} />
        )}
      </div>

      {activeTab === "products" && (
        <ItemDetailChatBar isAr={isAr} chatInput={chatInput} setChatInput={setChatInput}
          chatExpanded={chatExpanded} setChatExpanded={setChatExpanded}
          aiUsedToday={aiUsedToday} aiResetHours={aiResetHours} vendorFileRef={vendorFileRef} />
      )}

      <ItemDetailBuygroupDialog isAr={isAr} open={buygroupDisclaimerOpen}
        onOpenChange={setBuygroupDisclaimerOpen}
        onConfirm={() => {
          setBuygroupDisclaimerOpen(false);
          setHasSeenBuygroupDisclaimer(true);
          if (buygroupPendingProductId) {
            onAddToCart(buygroupPendingProductId, buygroupPendingQty);
            setBuygroupPendingProductId(null);
            setBuygroupPendingQty(1);
          }
        }} />
    </div>
  );
}
