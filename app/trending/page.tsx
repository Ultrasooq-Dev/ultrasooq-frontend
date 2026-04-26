"use client";
import React, { useRef, useState, use } from "react";
import { getCookie } from "cookies-next";
import { debounce } from "lodash";
import { getOrCreateDeviceId } from "@/utils/helper";
import { ULTRASOOQ_TOKEN_KEY } from "@/utils/constants";
import { ISelectOptions } from "@/utils/types/common.types";
import { useTrackProductClick } from "@/apis/queries/product.queries";
import { useAuth } from "@/context/AuthContext";
import { useCategoryStore } from "@/lib/categoryStore";
import { useTranslations } from "next-intl";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import Footer from "@/components/shared/Footer";
import TrendingCategories from "@/components/modules/trending/TrendingCategories";
import VendorsSection from "@/components/modules/trending/VendorsSection";
import CategorySidebar from "@/components/modules/trending/CategorySidebar";

import { TrendingPageProps } from "./_components/trendingTypes";
import { useTrendingData } from "./_components/useTrendingData";
import { useCartData } from "./_components/useCartData";
import { useTrendingPageEffects } from "./_components/useTrendingPageEffects";
import TrendingFilterPanel from "./_components/TrendingFilterPanel";
import TrendingProductGrid from "./_components/TrendingProductGrid";
import TrendingCartSidebar from "./_components/TrendingCartSidebar";
import TrendingMobileCartDrawer from "./_components/TrendingMobileCartDrawer";
import TrendingMobileFilterSheet from "./_components/TrendingMobileFilterSheet";

const TrendingPage = (props0: TrendingPageProps) => {
  const searchParams = props0.searchParams ? use(props0.searchParams) : {};
  const t = useTranslations();
  const { langDir } = useAuth();
  const category = useCategoryStore();
  const deviceId = getOrCreateDeviceId() || "";
  const accessToken = getCookie(ULTRASOOQ_TOKEN_KEY);
  const searchUrlTerm = (searchParams as any)?.term || "";

  const [viewType, setViewType] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchTermBrand, setSearchTermBrand] = useState("");
  const [selectedBrandIds, setSelectedBrandIds] = useState<number[]>([]);
  const [priceRange, setPriceRange] = useState<number[]>([]);
  const [minPriceInput, setMinPriceInput] = useState("");
  const [maxPriceInput, setMaxPriceInput] = useState("");
  const [sortBy, setSortBy] = useState("desc");
  const [displayMyProducts, setDisplayMyProducts] = useState("0");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [productVariants] = useState<any[]>([]);
  const [haveAccessToken, setHaveAccessToken] = useState(false);
  const [activeTab, setActiveTab] = useState<"products" | "vendors">("products");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [selectedSpecFilters, setSelectedSpecFilters] = useState<Record<string, string[]>>({});
  const [isCategorySidebarOpen, setIsCategorySidebarOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const minPriceInputRef = useRef<HTMLInputElement>(null);
  const maxPriceInputRef = useRef<HTMLInputElement>(null);

  useTrendingPageEffects({ accessToken, setHaveAccessToken, setIsMounted, setIsCategorySidebarOpen, setSelectedCategoryIds });

  const { me, allProductsQuery, isLoading, totalCount, specFilters, memoizedBrands, memoizedProductList, memoizedVendors } =
    useTrendingData({ page, limit, sortBy, searchUrlTerm, priceRange, minPriceInput, maxPriceInput, selectedBrandIds, selectedCategoryIds, displayMyProducts, searchTerm, categoryIds: category.categoryIds || undefined });

  const trackClick = useTrackProductClick();

  const { cartList, cartSubtotal, deleteCartItem, updateCartWithLogin, updateCartByDevice, getCartPricing, handleRemoveItemFromCart, handleUpdateCartQuantity, handleAddToWishlist } =
    useCartData({ haveAccessToken, deviceId, meDataId: me.data?.data?.id, memoizedProductList });

  // Filter handlers
  const handlePriceDebounce = debounce((v: number | number[]) => setPriceRange(v as number[]), 1000);
  const handleMinPriceChange = debounce((e: any) => setMinPriceInput(e.target.value), 1000);
  const handleMaxPriceChange = debounce((e: any) => setMaxPriceInput(e.target.value), 1000);
  const handleClearPrice = () => { setPriceRange([]); setMinPriceInput(""); setMaxPriceInput(""); };
  const handleBrandChange = (checked: boolean | string, item: ISelectOptions) =>
    setSelectedBrandIds((prev) =>
      checked && !prev.includes(item.value as number) ? [...prev, item.value as number] : prev.filter((id) => id !== item.value),
    );
  const handleClearFilter = () => {
    setSelectedBrandIds([]); setPriceRange([]); setMinPriceInput(""); setMaxPriceInput(""); setSelectedSpecFilters({});
    if (minPriceInputRef.current) minPriceInputRef.current.value = "";
    if (maxPriceInputRef.current) maxPriceInputRef.current.value = "";
  };
  const handleSpecFilterChange = (key: string, value: string, checked: boolean) =>
    setSelectedSpecFilters((prev) => ({ ...prev, [key]: checked ? [...(prev[key] || []), value] : (prev[key] || []).filter((v) => v !== value) }));
  const handleSpecRangeChange = (key: string, min: string, max: string) =>
    setSelectedSpecFilters((prev) => ({ ...prev, [key]: [min, max] }));

  const filterProps = {
    memoizedBrands, selectedBrandIds, searchTermBrand, specFilters, selectedSpecFilters, isMounted,
    onSelectAll: () => setSelectedBrandIds(memoizedBrands.map((b: ISelectOptions) => b.value as number)),
    onClearFilter: handleClearFilter,
    onBrandSearchChange: (e: any) => setSearchTermBrand(e.target.value),
    onBrandSearch: () => { setSearchTerm(searchTermBrand); allProductsQuery.refetch?.(); },
    onBrandChange: handleBrandChange,
    onPriceDebounce: handlePriceDebounce,
    onClearPrice: handleClearPrice,
    onMinPriceChange: handleMinPriceChange,
    onMaxPriceChange: handleMaxPriceChange,
    onSpecFilterChange: handleSpecFilterChange,
    onSpecRangeChange: handleSpecRangeChange,
    minPriceInputRef,
    maxPriceInputRef,
  };

  return (
    <>
      {isCategorySidebarOpen && (
        <CategorySidebar
          isOpen={isCategorySidebarOpen}
          onClose={() => setIsCategorySidebarOpen(false)}
          onCategorySelect={(id: number) => setSelectedCategoryIds((prev) => [...prev, id])}
        />
      )}

      <section className="relative w-full overflow-hidden bg-gradient-to-br from-primary/10 via-background to-warning/10 px-4 py-12 sm:px-8 sm:py-16 lg:px-12 lg:py-20">
        <div className="absolute inset-0 opacity-30" aria-hidden>
          <div className="absolute top-0 end-0 -me-32 -mt-32 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute bottom-0 start-0 -ms-24 -mb-24 h-56 w-56 rounded-full bg-warning/20 blur-3xl" />
        </div>
        <div className="relative mx-auto w-full max-w-[1400px]">
          <h1
            className="text-foreground mb-3 text-3xl font-bold sm:text-4xl lg:text-5xl"
            translate="no"
          >
            {t("view_trending_products")}
          </h1>
          <p
            className="text-muted-foreground max-w-2xl text-sm sm:text-base lg:text-lg"
            translate="no"
          >
            {t("browse_categories_to_find_trending_products")}
          </p>
        </div>
      </section>

      <TrendingCategories />

      <section className="min-h-screen bg-muted py-6">
        <div className="container mx-auto px-4">
          <div className="mb-4">
            <RadioGroup value={displayMyProducts} onValueChange={setDisplayMyProducts} className="flex gap-4">
              <div className="flex items-center gap-2">
                <RadioGroupItem value="0" id="all-products" />
                <Label htmlFor="all-products" translate="no">{t("all_products")}</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="1" id="my-products" />
                <Label htmlFor="my-products" translate="no">{t("my_products")}</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="mb-6 flex gap-4 border-b border-border">
            {(["products", "vendors"] as const).map((tab) => (
              <button key={tab} type="button" translate="no"
                className={`pb-2 text-sm font-medium transition-colors ${activeTab === tab ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}
                onClick={() => setActiveTab(tab)}>
                {t(tab)}
              </button>
            ))}
          </div>

          {activeTab === "vendors" ? (
            <VendorsSection vendors={memoizedVendors} />
          ) : (
            <div className={`flex gap-6 ${langDir === "rtl" ? "flex-row-reverse" : ""}`}>
              <aside className="hidden w-64 shrink-0 lg:block">
                <div className="sticky top-4 rounded-lg border border-border bg-card p-4">
                  <TrendingFilterPanel {...filterProps} />
                </div>
              </aside>

              <div className="min-w-0 flex-1">
                <TrendingProductGrid
                  memoizedProductList={memoizedProductList} isLoading={isLoading} totalCount={totalCount}
                  viewType={viewType} setViewType={setViewType} sortBy={sortBy} setSortBy={setSortBy}
                  cartList={cartList} productVariants={productVariants}
                  haveAccessToken={haveAccessToken} deviceId={deviceId}
                  page={page} setPage={setPage} limit={limit}
                  onWishlist={handleAddToWishlist}
                  onOpenMobileFilter={() => setIsMobileFilterOpen(true)}
                  onOpenMobileCart={() => setIsMobileCartOpen(true)}
                  onTrackClick={(id) => trackClick.mutate({ productId: id })}
                  updateCartWithLogin={updateCartWithLogin} updateCartByDevice={updateCartByDevice}
                />
              </div>

              <TrendingCartSidebar
                cartList={cartList} cartSubtotal={cartSubtotal} memoizedProductList={memoizedProductList}
                getCartPricing={getCartPricing}
                onUpdateQuantity={handleUpdateCartQuantity} onRemoveItem={handleRemoveItemFromCart}
                deleteCartItemPending={deleteCartItem.isPending}
                updateCartWithLoginPending={updateCartWithLogin.isPending}
                updateCartByDevicePending={updateCartByDevice.isPending}
              />
            </div>
          )}
        </div>
      </section>

      <TrendingMobileFilterSheet open={isMobileFilterOpen} onOpenChange={setIsMobileFilterOpen} {...filterProps} />
      <TrendingMobileCartDrawer
        open={isMobileCartOpen} onOpenChange={setIsMobileCartOpen}
        cartList={cartList} memoizedProductList={memoizedProductList}
        getCartPricing={getCartPricing} onRemoveItem={handleRemoveItemFromCart}
        deleteCartItemPending={deleteCartItem.isPending}
      />
      <Footer />
    </>
  );
};

export default TrendingPage;
