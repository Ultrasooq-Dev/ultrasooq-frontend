"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { debounce } from "lodash";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingBag,
  TrendingUp,
  Store,
  Package,
} from "lucide-react";
import {
  useOrders,
  useOrdersBySellerId,
  useUpdateOrderStatus,
  useOrderStatusSync,
} from "@/apis/queries/orders.queries";
import BuyerOrderCard from "@/components/modules/myOrders/BuyerOrderCard";
import SellerOrderCard from "@/components/modules/myOrders/SellerOrderCard";
import Pagination from "@/components/shared/Pagination";
import OrderFilterBar from "@/components/modules/orders/OrderFilterBar";
import BulkActionBar from "@/components/modules/orders/BulkActionBar";
import OrderListSkeleton from "@/components/modules/orders/OrderListSkeleton";
import { getYearDates, STATUS_MAP } from "@/components/modules/orders/constants";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { OrderProductDetail } from "@/components/modules/orders/types";

const PAGE_SIZE = 40;

export default function MyOrdersPage() {
  const t = useTranslations();
  const { langDir, currency } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const bulkUpdateStatus = useUpdateOrderStatus();
  useOrderStatusSync();

  const [activeTab, setActiveTab] = useState<"buying" | "selling">("buying");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [page, setPage] = useState(1);
  const searchRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [orderStatus, setOrderStatus] = useState("");
  const [orderTime, setOrderTime] = useState("");

  const dateRange = getYearDates(orderTime);

  const buyingQuery = useOrders({
    page,
    limit: PAGE_SIZE,
    term: searchTerm || undefined,
    orderProductStatus: orderStatus,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });

  const sellingQuery = useOrdersBySellerId({
    page,
    limit: PAGE_SIZE,
    term: searchTerm || undefined,
    orderProductStatus: orderStatus,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });

  const ordersQuery = activeTab === "buying" ? buyingQuery : sellingQuery;
  const responseData = ordersQuery?.data as any;
  const displayItems: OrderProductDetail[] = responseData?.data || [];
  const totalCount: number = responseData?.totalCount || 0;

  const handleDebounce = debounce(
    (e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value),
    1000,
  );

  const handleClearSearch = () => {
    if (searchRef.current) searchRef.current.value = "";
    setSearchTerm("");
  };

  const handleClearAll = () => {
    setOrderStatus("");
    setOrderTime("");
    handleClearSearch();
  };

  const handleBulkUpdate = async (status: string) => {
    const ids = Array.from(selectedIds);
    const apiStatus = STATUS_MAP[status] || status.toLowerCase();
    try {
      await Promise.all(
        ids.map((oid) =>
          bulkUpdateStatus.mutateAsync({ orderProductId: oid, status: apiStatus }),
        ),
      );
      queryClient.invalidateQueries({ queryKey: ["orders-by-seller-id"] });
      toast({
        title: `${ids.length} ${t("orders")} updated`,
        variant: "success",
      });
      setSelectedIds(new Set());
    } catch {
      toast({ title: t("error") || "Some orders failed to update", variant: "danger" });
    }
  };

  return (
    <div className="min-h-screen bg-muted">
      <div className="w-full px-6 py-8 lg:px-12">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <ol className="flex items-center gap-2 text-sm text-muted-foreground">
            <li>
              <Link
                href="/home"
                className="transition-colors hover:text-foreground"
                dir={langDir}
              >
                {t("home")}
              </Link>
            </li>
            <li className="flex items-center">
              <span className="mx-2">/</span>
              <span className="font-medium text-foreground">
                {t("my_orders")}
              </span>
            </li>
          </ol>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1
                className="flex items-center gap-3 text-3xl font-bold text-foreground"
                dir={langDir}
              >
                <ShoppingBag className="h-8 w-8 text-primary" />
                {t("my_orders")}
              </h1>
              <p className="mt-2 text-muted-foreground" dir={langDir}>
                {t("manage_your_orders_and_track_their_status")}
              </p>
            </div>
            <Badge variant="outline" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              {totalCount} {t("orders")}
            </Badge>
          </div>

          {/* Buying / Selling Tabs */}
          <div className="mt-6 flex gap-1 rounded-xl bg-muted p-1">
            <button
              type="button"
              onClick={() => {
                setActiveTab("buying");
                setPage(1);
                setOrderStatus("");
                setOrderTime("");
              }}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all",
                activeTab === "buying"
                  ? "bg-card text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <ShoppingBag className="h-4 w-4" />
              {t("my_purchases") || "My Purchases"}
              {(buyingQuery?.data as any)?.totalCount ? (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-bold",
                    activeTab === "buying"
                      ? "bg-primary/10 text-primary"
                      : "bg-muted-foreground/10",
                  )}
                >
                  {String((buyingQuery?.data as any)?.totalCount || 0)}
                </span>
              ) : null}
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("selling");
                setPage(1);
                setOrderStatus("");
                setOrderTime("");
              }}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all",
                activeTab === "selling"
                  ? "bg-card text-emerald-600 shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Store className="h-4 w-4" />
              {t("my_sales") || "My Sales"}
              {(sellingQuery?.data as any)?.totalCount ? (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-bold",
                    activeTab === "selling"
                      ? "bg-emerald-500/10 text-emerald-600"
                      : "bg-muted-foreground/10",
                  )}
                >
                  {String((sellingQuery?.data as any)?.totalCount || 0)}
                </span>
              ) : null}
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <OrderFilterBar
          searchTerm={searchTerm}
          onSearchChange={handleDebounce}
          searchRef={searchRef}
          onClearSearch={handleClearSearch}
          orderStatus={orderStatus}
          onStatusChange={(s) => { setOrderStatus(s); setPage(1); }}
          orderTime={orderTime}
          onTimeChange={(t) => { setOrderTime(t); setPage(1); }}
          totalCount={totalCount}
          onClearAll={handleClearAll}
        />

        {/* Bulk actions (seller only) */}
        {activeTab === "selling" && (
          <BulkActionBar
            selectedCount={selectedIds.size}
            onBulkUpdate={handleBulkUpdate}
            onClearSelection={() => setSelectedIds(new Set())}
            isPending={bulkUpdateStatus.isPending}
          />
        )}

        {/* Select all (seller only) */}
        {activeTab === "selling" && displayItems.length > 0 && (
          <div className="mb-3 flex items-center gap-2 px-1">
            <input
              type="checkbox"
              checked={selectedIds.size > 0 && selectedIds.size === displayItems.length}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedIds(new Set(displayItems.map((i) => i.id)));
                } else {
                  setSelectedIds(new Set());
                }
              }}
              className="h-4 w-4 cursor-pointer rounded border-border text-primary focus:ring-primary/30"
            />
            <span className="text-xs text-muted-foreground">
              {t("select_all") || "Select all"}
            </span>
          </div>
        )}

        {/* Orders List */}
        <div className="space-y-4">
          {ordersQuery.isLoading ? (
            <OrderListSkeleton />
          ) : !displayItems.length ? (
            <Card className="p-12 text-center">
              <Package className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold text-foreground">
                {t("no_orders_found")}
              </h3>
              <p className="text-muted-foreground">
                {t("no_orders_match_filters") || "No orders match your current filters"}
              </p>
            </Card>
          ) : (
            displayItems.map((item) =>
              activeTab === "selling" ? (
                <SellerOrderCard
                  key={item.id}
                  id={item.id}
                  orderProductType={item.orderProductType}
                  productId={item.productId || item.orderProduct_product?.id || 0}
                  purchasePrice={String(item.purchasePrice || item.salePrice || 0)}
                  productName={
                    item.orderProduct_productPrice?.productPrice_product?.productName ||
                    item.orderProduct_product?.productName ||
                    "Product"
                  }
                  produtctImage={
                    item.orderProduct_productPrice?.productPrice_product?.productImages ||
                    item.orderProduct_product?.productImages
                  }
                  orderQuantity={item.orderQuantity}
                  orderId={item.orderProduct_order?.orderNo || item.orderNo || String(item.id)}
                  orderStatus={item.orderProductStatus || "PLACED"}
                  orderProductDate={item.orderProductDate || item.createdAt || ""}
                  updatedAt={item.updatedAt || ""}
                  serviceFeature={item.serviceFeatures?.[0]?.serviceFeature}
                  buyerName={
                    item.orderProduct_order?.order_user
                      ? `${(item.orderProduct_order as Record<string, unknown>).order_user ? ((item.orderProduct_order as Record<string, unknown>).order_user as Record<string, string>)?.firstName || "" : ""} ${(item.orderProduct_order as Record<string, unknown>).order_user ? ((item.orderProduct_order as Record<string, unknown>).order_user as Record<string, string>)?.lastName || "" : ""}`.trim()
                      : undefined
                  }
                  buyerRating={4.2}
                  selected={selectedIds.has(item.id)}
                  onSelect={(oid, checked) => {
                    setSelectedIds((prev) => {
                      const next = new Set(prev);
                      checked ? next.add(oid) : next.delete(oid);
                      return next;
                    });
                  }}
                  onStatusChange={() => {
                    queryClient.invalidateQueries({ queryKey: ["orders-by-seller-id"] });
                  }}
                />
              ) : (
                <BuyerOrderCard
                  key={item.id}
                  id={item.id}
                  orderProductType={item.orderProductType}
                  productId={item.productId || item.orderProduct_product?.id || 0}
                  purchasePrice={String(item.purchasePrice || item.salePrice || 0)}
                  productName={
                    item.orderProduct_productPrice?.productPrice_product?.productName ||
                    item.orderProduct_product?.productName ||
                    "Product"
                  }
                  produtctImage={
                    item.orderProduct_productPrice?.productPrice_product?.productImages ||
                    item.orderProduct_product?.productImages
                  }
                  orderQuantity={item.orderQuantity}
                  orderId={String(item.id)}
                  orderNo={item.orderProduct_order?.orderNo || item.orderNo}
                  orderStatus={item.orderProductStatus || "PLACED"}
                  orderProductDate={item.orderProductDate || item.createdAt || ""}
                  updatedAt={item.updatedAt || ""}
                  serviceFeature={item.serviceFeatures?.[0]?.serviceFeature}
                  sellerName={
                    item.orderProduct_productPrice?.adminDetail
                      ? `${item.orderProduct_productPrice.adminDetail.firstName || ""} ${item.orderProduct_productPrice.adminDetail.lastName || ""}`.trim()
                      : undefined
                  }
                />
              ),
            )
          )}
        </div>

        {/* Pagination */}
        {totalCount > PAGE_SIZE && (
          <div className="mt-8">
            <Pagination
              page={page}
              setPage={setPage}
              totalCount={totalCount}
              limit={PAGE_SIZE}
            />
          </div>
        )}
      </div>
    </div>
  );
}
