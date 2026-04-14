"use client";
import React from "react";
import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";
import ManageProductCard from "@/components/modules/manageProducts/ManageProductCard";
import Pagination from "@/components/shared/Pagination";
import { ManagedProduct } from "./manageProductsTypes";

interface MyProductsGridProps {
  allManagedProductsQuery: any;
  filteredProducts: ManagedProduct[];
  products: ManagedProduct[];
  selectedProductIds: number[];
  globalSelectedIds: Set<number>;
  showOnlySelected: boolean;
  displayTotalCount: number;
  limit: number;
  page: number;
  miniStatsMap: any;
  onSelectedId: (checked: boolean | string, id: number) => void;
  onRemove: (id: number) => void;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  onFilterToggle: () => void;
  onShowAllProducts: () => void;
}

const MyProductsGrid: React.FC<MyProductsGridProps> = ({
  allManagedProductsQuery,
  filteredProducts,
  products,
  selectedProductIds,
  globalSelectedIds,
  showOnlySelected,
  displayTotalCount,
  limit,
  page,
  miniStatsMap,
  onSelectedId,
  onRemove,
  onPageChange,
  onLimitChange,
  onFilterToggle,
  onShowAllProducts,
}) => {
  const t = useTranslations();

  return (
    <div className="bg-card rounded-lg shadow-xs p-6">
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {t("products")} ({displayTotalCount})
          </h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-muted-foreground">Show Selected :</label>
              <button
                type="button"
                onClick={onFilterToggle}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  showOnlySelected ? "bg-primary" : "bg-muted"
                }`}
              >
                <span
                  className={`inline-block h-3 w-3 transform rounded-full bg-card transition-transform ${
                    showOnlySelected ? "translate-x-5" : "translate-x-1"
                  }`}
                />
              </button>
              {showOnlySelected && (
                <span className="text-xs text-primary font-medium">
                  ({Array.from(globalSelectedIds).length} selected)
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-muted-foreground">Show:</label>
              <select
                value={limit}
                onChange={(e) => onLimitChange(Number(e.target.value))}
                className="h-8 px-2 border border-border rounded-md bg-card text-sm focus:outline-hidden focus:ring-2 focus:ring-primary"
              >
                <option value={3}>3</option>
                <option value={6}>6</option>
                <option value={12}>12</option>
                <option value={24}>24</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {allManagedProductsQuery.isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-24 w-full" />
          ))}
        </div>
      ) : null}

      {!allManagedProductsQuery.data?.data?.length && !allManagedProductsQuery.isLoading ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground text-lg">{t("no_product_found")}</p>
        </div>
      ) : null}

      {showOnlySelected && products.length === 0 && allManagedProductsQuery.data?.data?.length > 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground text-lg">
            No selected products found in the current data
          </p>
          <p className="text-muted-foreground text-sm mt-2">
            Try refreshing the page or check if your selections are still valid
          </p>
          <button
            onClick={onShowAllProducts}
            className="mt-3 px-4 py-2 bg-primary text-white rounded hover:bg-primary transition-colors"
          >
            Show All Products
          </button>
        </div>
      ) : null}

      <div className="space-y-4">
        {filteredProducts.map((product: ManagedProduct) => (
          <ManageProductCard
            key={product?.id}
            selectedIds={selectedProductIds}
            onSelectedId={onSelectedId}
            id={product?.id}
            productId={product?.productId}
            status={product?.status}
            askForPrice={product?.askForPrice}
            askForStock={product?.askForStock}
            productImage={
              product?.productPrice_productSellerImage?.length
                ? product?.productPrice_productSellerImage?.[0]?.image
                : product?.productPrice_product?.productImages?.[0]?.image
            }
            productName={product?.productPrice_product?.productName}
            productPrice={product?.productPrice_product?.productPrice || product?.productPrice || "0"}
            offerPrice={product?.productPrice_product?.offerPrice || product?.offerPrice || "0"}
            deliveryAfter={product?.deliveryAfter || 0}
            stock={product?.stock || 0}
            consumerType={product?.consumerType || "CONSUMER"}
            sellType={product?.sellType || "NORMALSELL"}
            timeOpen={product?.timeOpen || 0}
            timeClose={product?.timeClose || 0}
            vendorDiscount={product?.vendorDiscount || 0}
            vendorDiscountType={product?.vendorDiscountType || "PERCENTAGE"}
            consumerDiscount={product?.consumerDiscount || 0}
            consumerDiscountType={product?.consumerDiscountType || "PERCENTAGE"}
            minQuantity={product?.minQuantity || 0}
            maxQuantity={product?.maxQuantity || 0}
            minCustomer={product?.minCustomer || 0}
            maxCustomer={product?.maxCustomer || 0}
            minQuantityPerCustomer={product?.minQuantityPerCustomer || 0}
            maxQuantityPerCustomer={product?.maxQuantityPerCustomer || 0}
            productCondition={product?.productCondition || ""}
            onRemove={onRemove}
            miniStats={miniStatsMap?.[product?.id] ?? null}
            productType={product?.productPrice_product?.productType}
            isDropshipped={product?.productPrice_product?.isDropshipped || false}
          />
        ))}
      </div>

      {!showOnlySelected && displayTotalCount > limit ? (
        <div className="mt-8">
          <Pagination
            page={page}
            setPage={onPageChange}
            totalCount={displayTotalCount}
            limit={limit}
          />
        </div>
      ) : null}
      {showOnlySelected && (
        <div className="mt-8 text-center text-muted-foreground">
          Showing {products.length} selected products from all pages
        </div>
      )}
    </div>
  );
};

export default MyProductsGrid;
