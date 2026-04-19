"use client";
import React from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { withActiveUserGuard } from "@/components/shared/withRouteGuard";
import { schema } from "./_components/manageProductsSchema";
import { defaultValues } from "./_components/manageProductsTypes";
import { useManageProducts } from "./_components/useManageProducts";
import ManageProductsHeader from "./_components/ManageProductsHeader";
import ProductTabs from "./_components/ProductTabs";
import MyProductsFilters from "./_components/MyProductsFilters";
import MyProductsGrid from "./_components/MyProductsGrid";
import ExistingProductsFilters from "./_components/ExistingProductsFilters";
import ExistingProductsGrid from "./_components/ExistingProductsGrid";
import DropshipProductsTab from "./_components/DropshipProductsTab";
import MyServicesTab from "./_components/MyServicesTab";
import ExistingProductsBottomBar from "./_components/ExistingProductsBottomBar";
import { useTranslations } from "next-intl";

const ManageProductsPage = () => {
  const t = useTranslations();
  const s = useManageProducts();
  const ep = s.existingProducts;
  const ds = s.dropship;

  const form = useForm({
    resolver: zodResolver(schema(t)) as any,
    defaultValues,
  });

  if (!s.hasPermission) return <div></div>;

  return (
    <>
      <div className="min-h-screen bg-muted">
        <div className="w-full px-8 lg:px-12 py-6">
          <ManageProductsHeader
            currentAccount={s.currentAccount}
            activeTab={s.activeTab}
            searchTerm={s.searchTerm}
            existingProductsSearchTerm={ep.existingProductsSearchTerm}
            globalSelectedIds={s.globalSelectedIds}
            searchInputRef={s.searchInputRef}
            onSearchChange={s.handleSearchChange}
            onSearch={s.handleSearch}
            onExistingProductsSearchChange={ep.handleExistingProductsSearchChange}
            onExistingProductsSearch={ep.handleExistingProductsSearch}
            onAddProduct={() => s.router.push("/add-product")}
            onBulkUpdate={() =>
              s.router.push(
                `/manage-products/bulk-action?ids=${Array.from(s.globalSelectedIds).join(",")}`,
              )
            }
          />

          <ProductTabs activeTab={s.activeTab} onTabChange={s.setActiveTab} />

          {/* My Products Tab */}
          {s.activeTab === "my-products" ? (
            <FormProvider {...form}>
              <form onSubmit={form.handleSubmit(s.onSubmit)}>
                <div className="flex flex-col lg:flex-row gap-6">
                  <div className="lg:w-1/4">
                    <MyProductsFilters
                      searchTermBrand={s.searchTermBrand}
                      selectedBrandIds={s.selectedBrandIds}
                      selectedCategoryIds={s.selectedCategoryIds}
                      memoizedBrands={s.memoizedBrands}
                      displayStoreProducts={s.displayStoreProducts}
                      displayBuyGroupProducts={s.displayBuyGroupProducts}
                      displayTrialProducts={s.displayTrialProducts}
                      displayWholesaleProducts={s.displayWholesaleProducts}
                      displayExpiredProducts={s.displayExpiredProducts}
                      displayHiddenProducts={s.displayHiddenProducts}
                      displayDiscountedProducts={s.displayDiscountedProducts}
                      onSelectAll={s.selectAll}
                      onClearFilter={s.clearFilter}
                      onBrandSearchChange={s.handleBrandSearchChange}
                      onBrandSearch={s.handleBrandSearch}
                      onBrandChange={s.handleBrandChange}
                      onCategoryChange={s.handleCategoryChange}
                      onCategoryClear={s.handleCategoryClear}
                      setDisplayStoreProducts={s.setDisplayStoreProducts}
                      setDisplayBuyGroupProducts={s.setDisplayBuyGroupProducts}
                      setDisplayTrialProducts={s.setDisplayTrialProducts}
                      setDisplayWholesaleProducts={s.setDisplayWholesaleProducts}
                      setDisplayExpiredProducts={s.setDisplayExpiredProducts}
                      setDisplayHiddenProducts={s.setDisplayHiddenProducts}
                      setDisplayDiscountedProducts={s.setDisplayDiscountedProducts}
                    />
                  </div>
                  <div className="lg:w-3/4">
                    <MyProductsGrid
                      allManagedProductsQuery={s.allManagedProductsQuery}
                      filteredProducts={s.filteredProducts}
                      products={s.products}
                      selectedProductIds={s.selectedProductIds}
                      globalSelectedIds={s.globalSelectedIds}
                      showOnlySelected={s.showOnlySelected}
                      displayTotalCount={s.displayTotalCount}
                      limit={s.limit}
                      page={s.page}
                      miniStatsMap={s.miniStatsMap}
                      onSelectedId={s.handleProductIds}
                      onRemove={s.handleRemoveFromList}
                      onPageChange={s.handlePageChange}
                      onLimitChange={s.handleLimitChange}
                      onFilterToggle={s.handleFilterToggle}
                      onShowAllProducts={() => s.setShowOnlySelected(false)}
                    />
                  </div>
                </div>
              </form>
            </FormProvider>
          ) : (s.activeTab as string) === "existing-products" ? (
            /* Existing Products Tab */
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="lg:w-1/4">
                <ExistingProductsFilters
                  searchTermBrand={s.searchTermBrand}
                  existingProductsSelectedBrandIds={ep.existingProductsSelectedBrandIds}
                  existingProductsSelectedCategoryIds={ep.existingProductsSelectedCategoryIds}
                  existingProductsSelectedType={ep.existingProductsSelectedType}
                  memoizedExistingProductsBrands={ep.memoizedExistingProductsBrands}
                  existingProductsBrandsQuery={ep.existingProductsBrandsQuery}
                  categoriesQuery={ep.categoriesQuery}
                  onSelectAll={() => {
                    const brandIds =
                      ep.existingProductsBrandsQuery?.data?.data?.map((i: any) => i.id) || [];
                    const categoryIds =
                      ep.categoriesQuery?.data?.data?.children?.map((i: any) => i.id) || [];
                    ep.handleExistingProductsCategoryChange(categoryIds);
                    brandIds.forEach((id: number) =>
                      ep.handleExistingProductsBrandChange(true, { label: "", value: id, children: [] }),
                    );
                  }}
                  onClearAll={() => {
                    ep.handleExistingProductsCategoryClear();
                    ep.existingProductsSelectedBrandIds.forEach((id) =>
                      ep.handleExistingProductsBrandChange(false, { label: "", value: id, children: [] }),
                    );
                  }}
                  onBrandSearchChange={s.handleBrandSearchChange}
                  onBrandSearch={s.handleBrandSearch}
                  onBrandChange={ep.handleExistingProductsBrandChange}
                  onCategoryChange={ep.handleExistingProductsCategoryChange}
                  onCategoryClear={ep.handleExistingProductsCategoryClear}
                  setExistingProductsSelectedType={ep.setExistingProductsSelectedType}
                />
              </div>
              <div className="lg:w-3/4">
                <ExistingProductsGrid
                  existingProductsQuery={ep.existingProductsQuery}
                  memoizedExistingProductList={ep.memoizedExistingProductList}
                  filteredTotalCount={ep.filteredTotalCount}
                  existingProductsSelectedIds={ep.existingProductsSelectedIds}
                  existingProductsSelectedType={ep.existingProductsSelectedType}
                  existingProductsPage={ep.existingProductsPage}
                  existingProductsLimit={ep.existingProductsLimit}
                  onSelectedId={ep.handleExistingProductsSelection}
                  onPageChange={ep.setExistingProductsPage}
                />
              </div>
            </div>
          ) : s.activeTab === "dropship-products" ? (
            <DropshipProductsTab
              dropshipProductsQuery={ds.dropshipProductsQuery}
              dropshipStatus={ds.dropshipStatus}
              dropshipPage={ds.dropshipPage}
              setDropshipStatus={ds.setDropshipStatus}
              onDropshipPageChange={ds.handleDropshipPageChange}
              onDropshipProductDelete={ds.handleDropshipProductDelete}
            />
          ) : s.activeTab === "my-services" ? (
            <MyServicesTab />
          ) : null}
        </div>
      </div>

      <ExistingProductsBottomBar
        activeTab={s.activeTab}
        existingProductsSelectedIds={ep.existingProductsSelectedIds}
        onClearSelection={() => ep.setExistingProductsSelectedIds([])}
      />
    </>
  );
};

export default withActiveUserGuard(ManageProductsPage);
