"use client";
import React from "react";
import { useTranslations } from "next-intl";
import ExistingProductCard from "@/components/modules/manageProducts/ExistingProductCard";
import Pagination from "@/components/shared/Pagination";
import SkeletonProductCardLoader from "@/components/shared/SkeletonProductCardLoader";
import { ExistingProduct } from "./manageProductsTypes";

interface ExistingProductsGridProps {
  existingProductsQuery: any;
  memoizedExistingProductList: ExistingProduct[];
  filteredTotalCount: number;
  existingProductsSelectedIds: number[];
  existingProductsSelectedType: string;
  existingProductsPage: number;
  existingProductsLimit: number;
  onSelectedId: (checked: boolean | string, id: number) => void;
  onPageChange: (page: number) => void;
}

const ExistingProductsGrid: React.FC<ExistingProductsGridProps> = ({
  existingProductsQuery,
  memoizedExistingProductList,
  filteredTotalCount,
  existingProductsSelectedIds,
  existingProductsSelectedType,
  existingProductsPage,
  existingProductsLimit,
  onSelectedId,
  onPageChange,
}) => {
  const t = useTranslations();

  return (
    <div className="bg-card rounded-lg shadow-xs p-6">
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {t("existing_products")} ({filteredTotalCount})
          </h2>
        </div>
      </div>

      {existingProductsQuery.isLoading ? (
        <div className="grid grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, index) => (
            <SkeletonProductCardLoader key={index} />
          ))}
        </div>
      ) : null}

      {!memoizedExistingProductList.length && !existingProductsQuery.isLoading ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground text-lg">{t("no_product_found")}</p>
        </div>
      ) : null}

      <div className="space-y-4">
        {memoizedExistingProductList.map((item: ExistingProduct) => (
          <ExistingProductCard
            key={item.id}
            id={item.id}
            productImage={item.productImage ?? null}
            productName={item.productName}
            productPrice={item.productPrice}
            offerPrice={item.offerPrice}
            categoryName={item.categoryName}
            brandName={item.brandName}
            shortDescription={item.shortDescription}
            skuNo={item.skuNo}
            productType={item.productType}
            selectedIds={existingProductsSelectedIds}
            onSelectedId={onSelectedId}
          />
        ))}
      </div>

      {!existingProductsSelectedType &&
        existingProductsQuery.data?.totalCount > existingProductsLimit ? (
        <div className="mt-8">
          <Pagination
            page={existingProductsPage}
            setPage={onPageChange}
            totalCount={existingProductsQuery.data?.totalCount}
            limit={existingProductsLimit}
          />
        </div>
      ) : null}
    </div>
  );
};

export default ExistingProductsGrid;
