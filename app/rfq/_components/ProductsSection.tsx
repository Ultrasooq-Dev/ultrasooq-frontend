"use client";
import React from "react";
import Link from "next/link";
import RfqProductCard from "@/components/modules/rfq/RfqProductCard";
import RfqProductTable from "@/components/modules/rfq/RfqProductTable";
import Pagination from "@/components/shared/Pagination";
import SkeletonProductCardLoader from "@/components/shared/SkeletonProductCardLoader";
import { FaPlus } from "react-icons/fa";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import ProductsHeader from "./ProductsHeader";

interface ProductsSectionProps {
  t: (key: string) => string;
  langDir: string;
  isRTL: boolean;
  cartList: any[];
  haveAccessToken: boolean;
  searchParams?: { term?: string };
  viewType: "grid" | "list";
  setViewType: (v: "grid" | "list") => void;
  sortBy: "newest" | "oldest";
  setSortBy: (v: "newest" | "oldest") => void;
  rfqProductsQuery: any;
  memoizedRfqProducts: any[];
  me: any;
  page: number;
  setPage: (p: number) => void;
  limit: number;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  onOpenFilterDrawer: () => void;
  onOpenCartDrawer: () => void;
  onRfqDebounce: (event: any) => void;
  onRFQCart: (
    quantity: number,
    productId: number,
    action: "add" | "remove",
    offerPriceFrom?: number,
    offerPriceTo?: number,
    note?: string,
  ) => void;
  onCartPage: () => void;
  onAddToWishlist: (productId: number, wishlistArr?: any[]) => Promise<void>;
}

const ProductsSection: React.FC<ProductsSectionProps> = ({
  t,
  langDir,
  isRTL,
  cartList,
  haveAccessToken,
  searchParams,
  viewType,
  setViewType,
  sortBy,
  setSortBy,
  rfqProductsQuery,
  memoizedRfqProducts,
  me,
  page,
  setPage,
  limit,
  searchInputRef,
  onOpenFilterDrawer,
  onOpenCartDrawer,
  onRfqDebounce,
  onRFQCart,
  onCartPage,
  onAddToWishlist,
}) => {
  const router = useRouter();

  return (
    <div
      className={cn(
        "flex-1 overflow-y-auto bg-card",
        cartList.length > 0
          ? isRTL
            ? "lg:pl-36"
            : "lg:pr-36"
          : isRTL
            ? "lg:pl-0"
            : "lg:pr-0",
      )}
    >
      <div className="p-2 sm:p-4 lg:p-6">
        <ProductsHeader
          t={t}
          langDir={langDir}
          viewType={viewType}
          setViewType={setViewType}
          sortBy={sortBy}
          setSortBy={setSortBy}
          cartListLength={cartList.length}
          onOpenFilterDrawer={onOpenFilterDrawer}
          onOpenCartDrawer={onOpenCartDrawer}
        />

        {/* Search and Add Product Section */}
        <div className="mb-6">
          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="search"
                  className="w-full rounded-lg border border-border px-4 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-primary sm:py-2.5 sm:text-base"
                  placeholder={t("search_product")}
                  onChange={onRfqDebounce}
                  ref={searchInputRef}
                  defaultValue={searchParams?.term || ""}
                  dir={langDir}
                  translate="no"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg
                    className="h-4 w-4 text-muted-foreground"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>
            {haveAccessToken ? (
              <Link
                href="/product?productType=R"
                className="flex items-center justify-center gap-x-2 rounded-lg bg-warning px-4 py-2 text-sm whitespace-nowrap text-white transition-colors hover:bg-warning sm:py-2.5 sm:text-base"
                dir={langDir}
                translate="no"
              >
                <FaPlus />
                {t("add_new_rfq_product")}
              </Link>
            ) : null}
          </div>
        </div>

        {/* Loading State */}
        {rfqProductsQuery.isLoading && viewType === "grid" ? (
          <div className="flex flex-col gap-3 sm:grid sm:grid-cols-2 sm:items-stretch sm:gap-4 lg:grid-cols-3 lg:gap-5 xl:grid-cols-4">
            {Array.from({ length: 10 }).map((_, index) => (
              <SkeletonProductCardLoader key={index} />
            ))}
          </div>
        ) : null}

        {/* No Data State */}
        {!rfqProductsQuery?.data?.data?.length && !rfqProductsQuery.isLoading ? (
          <div className="py-12 text-center">
            <p className="text-lg text-muted-foreground" dir={langDir} translate="no">
              {t("no_data_found")}
            </p>
          </div>
        ) : null}

        {/* Grid View */}
        {viewType === "grid" && !rfqProductsQuery.isLoading ? (
          <div className="flex flex-col gap-3 sm:grid sm:grid-cols-2 sm:items-stretch sm:gap-4 lg:grid-cols-3 lg:gap-5 xl:grid-cols-4">
            {memoizedRfqProducts.map((item: any) => (
              <RfqProductCard
                key={item.id}
                id={item.id}
                productType={item?.productType || "-"}
                productName={item?.productName || "-"}
                productNote={
                  cartList?.find((el: any) => el.productId == item.id)?.note || ""
                }
                productStatus={item?.status}
                productImages={item?.productImages}
                productQuantity={item?.quantity || 0}
                productPrice={item?.product_productPrice}
                offerPriceFrom={
                  cartList?.find((el: any) => el.productId == item.id)?.offerPriceFrom
                }
                offerPriceTo={
                  cartList?.find((el: any) => el.productId == item.id)?.offerPriceTo
                }
                onAdd={onRFQCart}
                onToCart={onCartPage}
                onEdit={(productId) => {
                  router.push(`/product?productType=R&copy=${productId}`);
                }}
                onWishlist={() => onAddToWishlist(item.id, item?.product_wishlist)}
                isCreatedByMe={item?.userId === me.data?.data?.id}
                isAddedToCart={item?.isAddedToCart}
                inWishlist={item?.product_wishlist?.find(
                  (el: any) => el?.userId === me.data?.data?.id,
                )}
                haveAccessToken={haveAccessToken}
                productReview={item?.productReview || []}
                shortDescription={
                  item?.product_productShortDescription?.[0]?.shortDescription || ""
                }
              />
            ))}
          </div>
        ) : null}

        {/* List View */}
        {viewType === "list" && rfqProductsQuery?.data?.data?.length ? (
          <div className="rounded-lg bg-card shadow">
            <RfqProductTable list={rfqProductsQuery?.data?.data} />
          </div>
        ) : null}

        {/* Pagination */}
        {rfqProductsQuery.data?.totalCount > 10 ? (
          <div className="mt-8">
            <Pagination
              page={page}
              setPage={setPage}
              totalCount={rfqProductsQuery.data?.totalCount}
              limit={limit}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ProductsSection;
