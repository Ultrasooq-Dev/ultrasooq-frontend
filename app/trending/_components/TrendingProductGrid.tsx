"use client";
import React from "react";
import { TrendingProduct } from "@/utils/types/common.types";
import ProductCard from "@/components/modules/trending/ProductCard";
import ProductTable from "@/components/modules/trending/ProductTable";
import GridIcon from "@/components/icons/GridIcon";
import ListIcon from "@/components/icons/ListIcon";
import FilterMenuIcon from "@/components/icons/FilterMenuIcon";
import {
  Select, SelectContent, SelectGroup,
  SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { ShoppingCart } from "lucide-react";
import SkeletonProductCardLoader from "@/components/shared/SkeletonProductCardLoader";
import Pagination from "@/components/shared/Pagination";
import { useUpdateCartByDevice, useUpdateCartWithLogin } from "@/apis/queries/cart.queries";
import { useToast } from "@/components/ui/use-toast";
import ProductGridItems from "./ProductGridItems";

interface TrendingProductGridProps {
  memoizedProductList: any[];
  isLoading: boolean;
  totalCount: number;
  viewType: "grid" | "list";
  setViewType: (type: "grid" | "list") => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  cartList: any[];
  productVariants: any[];
  haveAccessToken: boolean;
  deviceId: string;
  page: number;
  setPage: (page: number) => void;
  limit: number;
  onWishlist: (productId: number, wishlistArr?: any[]) => void;
  onOpenMobileFilter: () => void;
  onOpenMobileCart: () => void;
  onTrackClick: (productId: number) => void;
  updateCartWithLogin: ReturnType<typeof useUpdateCartWithLogin>;
  updateCartByDevice: ReturnType<typeof useUpdateCartByDevice>;
}

export default function TrendingProductGrid({
  memoizedProductList,
  isLoading,
  totalCount,
  viewType,
  setViewType,
  sortBy,
  setSortBy,
  cartList,
  productVariants,
  haveAccessToken,
  deviceId,
  page,
  setPage,
  limit,
  onWishlist,
  onOpenMobileFilter,
  onOpenMobileCart,
  onTrackClick,
  updateCartWithLogin,
  updateCartByDevice,
}: TrendingProductGridProps) {
  const t = useTranslations();
  const { langDir } = useAuth();
  const { toast } = useToast();

  const handleAddToCart = async (
    item: any,
    quantity: number,
    action: "add" | "remove",
    variant: any,
  ) => {
    if (!item?.productProductPriceId) {
      toast({ title: t("something_went_wrong"), description: t("product_price_id_not_found"), variant: "danger" });
      return;
    }
    const qty = action === "add" ? quantity : 0;
    if (haveAccessToken) {
      const r = await updateCartWithLogin.mutateAsync({ productPriceId: item.productProductPriceId, quantity: qty, productVariant: variant });
      if (r.status) toast({ title: action === "add" ? t("item_added_to_cart") : t("item_removed_from_cart"), description: t("check_your_cart_for_more_details"), variant: "success" });
    } else {
      const r = await updateCartByDevice.mutateAsync({ productPriceId: item.productProductPriceId, quantity: qty, deviceId, productVariant: variant });
      if (r.status) toast({ title: action === "add" ? t("item_added_to_cart") : t("item_removed_from_cart"), description: t("check_your_cart_for_more_details"), variant: "success" });
    }
  };

  return (
    <>
      {/* Toolbar */}
      <div className="mb-6 flex flex-col items-start justify-between gap-4 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center">
        <div className="flex w-full items-center gap-3 sm:w-auto">
          <button type="button" className="rounded-lg border border-border bg-card p-2.5 transition-colors hover:bg-muted lg:hidden" onClick={onOpenMobileFilter}>
            <FilterMenuIcon />
          </button>
          <button type="button" className="relative rounded-lg border border-border bg-card p-2.5 transition-colors hover:bg-muted lg:hidden" onClick={onOpenMobileCart}>
            <ShoppingCart className="h-5 w-5" />
            {cartList.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-bold text-white">
                {cartList.length > 99 ? "99+" : cartList.length}
              </span>
            )}
          </button>
          <div className="flex-1 sm:flex-none">
            <p className="text-base font-semibold text-foreground sm:text-lg" dir={langDir} translate="no">
              {t("n_products_found", { n: totalCount })}
            </p>
          </div>
        </div>
        <div className="flex w-full items-center gap-3 sm:w-auto">
          <Select onValueChange={(e) => setSortBy(e)} value={sortBy}>
            <SelectTrigger className="h-10 w-full border-border bg-card sm:w-[180px]">
              <SelectValue placeholder={t("sort_by")} dir={langDir} translate="no" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="desc" dir={langDir} translate="no">{t("sort_by_latest")}</SelectItem>
                <SelectItem value="asc" dir={langDir} translate="no">{t("sort_by_oldest")}</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <div className="hidden items-center gap-2 rounded-lg border border-border bg-card p-1 sm:flex">
            <button type="button" className={`rounded p-2 transition-colors ${viewType === "grid" ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted"}`} onClick={() => setViewType("grid")}>
              <GridIcon active={viewType === "grid"} />
            </button>
            <button type="button" className={`rounded p-2 transition-colors ${viewType === "list" ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted"}`} onClick={() => setViewType("list")}>
              <ListIcon active={viewType === "list"} />
            </button>
          </div>
        </div>
      </div>

      {isLoading && viewType === "grid" ? (
        <div className="flex flex-col gap-3 sm:grid sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 lg:gap-5 xl:grid-cols-4">
          {Array.from({ length: 10 }).map((_, index: number) => <SkeletonProductCardLoader key={index} />)}
        </div>
      ) : null}

      {!memoizedProductList.length && !isLoading ? (
        <p className="text-center text-sm font-medium" dir={langDir} translate="no">{t("no_data_found")}</p>
      ) : null}

      {viewType === "grid" ? (
        <ProductGridItems
          memoizedProductList={memoizedProductList}
          cartList={cartList}
          productVariants={productVariants}
          haveAccessToken={haveAccessToken}
          onWishlist={onWishlist}
          onTrackClick={onTrackClick}
        />
      ) : null}

      {viewType === "list" && memoizedProductList.length ? (
        <div className="product-list-s1 overflow-x-auto p-2 sm:p-4">
          <ProductTable
            list={memoizedProductList}
            onWishlist={onWishlist}
            onAddToCart={handleAddToCart}
            wishlistMap={new Map(memoizedProductList.map((item) => [item.id, item?.inWishlist || false]))}
            cartMap={new Map(cartList?.map((item: any) => [item.productId, { quantity: item.quantity, cartId: item.id }]) || [])}
            haveAccessToken={haveAccessToken}
            productVariants={productVariants}
          />
        </div>
      ) : null}

      <Pagination page={page} setPage={setPage} totalCount={totalCount} limit={limit} />
    </>
  );
}
