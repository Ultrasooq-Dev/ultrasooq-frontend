"use client";
import React, { useRef, useState } from "react";
import { useOrders, useOrdersBySellerId } from "@/apis/queries/orders.queries";
import {
  Search,
  Filter,
  Package,
  Clock,
  CheckCircle,
  Truck,
  PackageCheck,
  XCircle,
  X,
  Calendar,
  ShoppingBag,
  TrendingUp,
  Store,
} from "lucide-react";
import BuyerOrderCard from "@/components/modules/myOrders/BuyerOrderCard";
import SellerOrderCard from "@/components/modules/myOrders/SellerOrderCard";
import { debounce } from "lodash";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { v4 as uuidv4 } from "uuid";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import Pagination from "@/components/shared/Pagination";
import { cn } from "@/lib/utils";

const MyOrdersPage = () => {
  const t = useTranslations();
  const { langDir, currency } = useAuth();
  const [activeTab, setActiveTab] = useState<"buying" | "selling">("buying");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(40);
  const searchRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [orderStatus, setOrderStatus] = useState<string>("");
  const [orderTime, setOrderTime] = useState<string>("");

  const getYearDates = (
    input: string,
  ): { startDate: string; endDate: string } => {
    const currentDate = new Date();

    if (input === "last30") {
      const startDate = new Date(currentDate);
      startDate.setDate(currentDate.getDate() - 30);
      const endDate = currentDate;

      return {
        startDate: startDate.toISOString().slice(0, 10),
        endDate: endDate.toISOString().slice(0, 10) + " 23:59:59",
      };
    }

    if (input === "older") {
      const startDate = new Date(currentDate.getFullYear() - 20, 0, 1);
      const endDate = new Date(currentDate.getFullYear() - 1, 11, 31);

      return {
        startDate: `${startDate.getFullYear()}-01-01`,
        endDate: `${endDate.getFullYear()}-12-31`,
      };
    }

    const yearNumber = Number(input);
    if (isNaN(yearNumber) || yearNumber < 1000 || yearNumber > 9999) {
      return { startDate: "", endDate: "" };
    }

    const startDate = `${yearNumber}-01-01`;
    const endDate = `${yearNumber}-12-31`;

    return {
      startDate,
      endDate,
    };
  };

  // Buying orders (customer)
  const buyingQuery = useOrders({
    page: page,
    limit: limit,
    term: searchTerm !== "" ? searchTerm : undefined,
    orderProductStatus: orderStatus,
    startDate: getYearDates(orderTime).startDate,
    endDate: getYearDates(orderTime).endDate,
  });

  // Selling orders (vendor)
  const sellingQuery = useOrdersBySellerId({
    page: page,
    limit: limit,
    term: searchTerm !== "" ? searchTerm : undefined,
    orderProductStatus: orderStatus,
    startDate: getYearDates(orderTime).startDate,
    endDate: getYearDates(orderTime).endDate,
  });

  // Use the active tab's query
  const ordersQuery = activeTab === "buying" ? buyingQuery : sellingQuery;

  const handleDebounce = debounce((event: any) => {
    setSearchTerm(event.target.value);
  }, 1000);

  const handleClearSearch = () => {
    if (searchRef.current) {
      searchRef.current.value = "";
    }
    setSearchTerm("");
  };

  const handleClearFilter = () => {
    setOrderStatus("");
    setOrderTime("");
  };

  // Get status icon and color
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return <CheckCircle className="h-4 w-4" />;
      case "SHIPPED":
        return <Truck className="h-4 w-4" />;
      case "OFD":
        return <Truck className="h-4 w-4" />;
      case "DELIVERED":
        return <Package className="h-4 w-4" />;
      case "CANCELLED":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "bg-primary/10 text-primary";
      case "SHIPPED":
        return "bg-info/10 text-info";
      case "OFD":
        return "bg-warning/10 text-warning";
      case "DELIVERED":
        return "bg-success/10 text-success";
      case "CANCELLED":
        return "bg-destructive/10 text-destructive";
      default:
        return "bg-muted text-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-muted">
      <div className="w-full px-6 py-8 lg:px-12">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <ol className="flex items-center space-x-2 text-sm text-muted-foreground">
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
                Track and manage your orders
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                {(ordersQuery?.data as any)?.totalCount || 0} Orders
              </Badge>
            </div>
          </div>

          {/* Buying / Selling Tabs */}
          <div className="mt-6 flex gap-1 rounded-xl bg-muted p-1">
            <button
              type="button"
              onClick={() => { setActiveTab("buying"); setPage(1); setOrderStatus(""); setOrderTime(""); }}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all ${
                activeTab === "buying"
                  ? "bg-card text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ShoppingBag className="h-4 w-4" />
              My Purchases
              {(buyingQuery?.data as any)?.totalCount > 0 && (
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  activeTab === "buying" ? "bg-primary/10 text-primary" : "bg-muted-foreground/10"
                }`}>
                  {(buyingQuery?.data as any)?.totalCount || 0}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab("selling"); setPage(1); setOrderStatus(""); setOrderTime(""); }}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all ${
                activeTab === "selling"
                  ? "bg-card text-emerald-600 shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Store className="h-4 w-4" />
              My Sales
              {(sellingQuery?.data as any)?.totalCount > 0 && (
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  activeTab === "selling" ? "bg-emerald-500/10 text-emerald-600" : "bg-muted-foreground/10"
                }`}>
                  {(sellingQuery?.data as any)?.totalCount || 0}
                </span>
              )}
            </button>
          </div>
        </div>

        <div>
          {/* Horizontal Filter Bar */}
          <div className="sticky top-0 z-20 mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card/95 backdrop-blur-sm px-5 py-3 shadow-sm">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute top-1/2 start-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder={t("search_orders")}
                onChange={handleDebounce}
                ref={searchRef}
                className="w-full rounded-lg border border-border bg-muted/30 py-2 pe-3 ps-10 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                dir={langDir}
              />
              {searchTerm !== "" && (
                <button type="button" onClick={handleClearSearch}
                  className="absolute top-1/2 end-3 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="h-6 w-px bg-border" />

            {/* Status chips */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { value: "", label: t("all") },
                { value: "CONFIRMED", label: t("confirmed") },
                { value: "SHIPPED", label: t("shipped") },
                { value: "OFD", label: t("on_the_way") },
                { value: "DELIVERED", label: t("delivered") },
                { value: "CANCELLED", label: t("cancelled") },
              ].map((s) => (
                <button key={s.value} type="button"
                  onClick={() => { setOrderStatus(s.value); setPage(1); }}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium transition-all",
                    orderStatus === s.value
                      ? "bg-primary text-white shadow-sm"
                      : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                  )}>
                  {s.label}
                </button>
              ))}
            </div>

            <div className="h-6 w-px bg-border" />

            {/* Time dropdown */}
            <select
              value={orderTime}
              onChange={(e) => { setOrderTime(e.target.value); setPage(1); }}
              className="rounded-lg border border-border bg-muted/30 px-3 py-1.5 text-xs font-medium outline-none focus:border-primary cursor-pointer"
            >
              <option value="">{t("all_time") || "All Time"}</option>
              <option value="last30">{t("last_30_days")}</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
              <option value="older">{t("older")}</option>
            </select>

            {/* Clear */}
            {(orderStatus || orderTime || searchTerm) && (
              <button type="button" onClick={() => { handleClearFilter(); handleClearSearch(); }}
                className="flex items-center gap-1 text-xs font-medium text-destructive hover:underline">
                <X className="h-3 w-3" /> Clear
              </button>
            )}
          </div>

          {/* Full width content */}
          <div>

            {/* Bulk Action Bar — seller only */}
            {activeTab === "selling" && selectedIds.size > 0 && (
              <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-5 py-3">
                <span className="text-sm font-semibold text-primary">
                  {selectedIds.size} selected
                </span>
                <div className="h-4 w-px bg-border" />
                <button type="button"
                  onClick={() => {
                    selectedIds.forEach((oid) => { /* TODO: batch API call */ });
                    setSelectedIds(new Set());
                  }}
                  className="flex items-center gap-1.5 rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600">
                  <CheckCircle className="h-3.5 w-3.5" /> Confirm All
                </button>
                <button type="button"
                  onClick={() => {
                    selectedIds.forEach((oid) => { /* TODO: batch API call */ });
                    setSelectedIds(new Set());
                  }}
                  className="flex items-center gap-1.5 rounded-lg bg-indigo-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-600">
                  <Truck className="h-3.5 w-3.5" /> Ship All
                </button>
                <button type="button"
                  onClick={() => {
                    selectedIds.forEach((oid) => { /* TODO: batch API call */ });
                    setSelectedIds(new Set());
                  }}
                  className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600">
                  <Truck className="h-3.5 w-3.5" /> Mark OFD
                </button>
                <button type="button"
                  onClick={() => {
                    selectedIds.forEach((oid) => { /* TODO: batch API call */ });
                    setSelectedIds(new Set());
                  }}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600">
                  <PackageCheck className="h-3.5 w-3.5" /> Deliver All
                </button>
                <div className="flex-1" />
                <button type="button" onClick={() => setSelectedIds(new Set())}
                  className="text-xs font-medium text-muted-foreground hover:text-foreground">
                  Clear selection
                </button>
              </div>
            )}

            {/* Select all checkbox — seller only */}
            {activeTab === "selling" && (ordersQuery?.data?.data as any)?.length > 0 && (
              <div className="mb-3 flex items-center gap-2 px-1">
                <input
                  type="checkbox"
                  checked={selectedIds.size > 0 && selectedIds.size === (ordersQuery?.data?.data as any)?.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedIds(new Set((ordersQuery?.data?.data as any)?.map((i: any) => i.id)));
                    } else {
                      setSelectedIds(new Set());
                    }
                  }}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30 cursor-pointer"
                />
                <span className="text-xs text-muted-foreground">Select all</span>
              </div>
            )}

            {/* Orders List */}
            <div className="space-y-4">
              {ordersQuery.isLoading ? (
                Array.from({ length: 3 }, (_, i) => (
                  <Card key={i} className="mb-2 p-6">
                    <div className="flex gap-4">
                      <Skeleton className="h-24 w-24 rounded-lg" />
                      <div className="flex-1 space-y-3">
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-4 w-1/4" />
                      </div>
                    </div>
                  </Card>
                ))
              ) : !(ordersQuery?.data?.data as any)?.length ? (
                <Card className="p-12 text-center">
                  <Package className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
                  <h3 className="mb-2 text-lg font-semibold text-foreground">
                    {t("no_orders_found")}
                  </h3>
                  <p className="text-muted-foreground">
                    No orders match your current filters
                  </p>
                </Card>
              ) : (
                (ordersQuery?.data?.data as any)?.map((item: any) => (
                  activeTab === "selling" ? (
                    <SellerOrderCard
                      key={item.id}
                      id={item.id}
                      orderProductType={item.orderProductType}
                      productId={item.productId || item.orderProduct_product?.id}
                      purchasePrice={String(item.purchasePrice || item.salePrice || 0)}
                      productName={
                        item.orderProduct_productPrice?.productPrice_product?.productName ||
                        item.orderProduct_product?.productName || "Product"
                      }
                      produtctImage={
                        item.orderProduct_productPrice?.productPrice_product?.productImages ||
                        item.orderProduct_product?.productImages
                      }
                      orderQuantity={item.orderQuantity}
                      orderId={item.orderProduct_order?.orderNo || item.orderNo || String(item.id)}
                      orderStatus={item.orderProductStatus}
                      orderProductDate={item.orderProductDate || item.createdAt}
                      updatedAt={item.updatedAt}
                      serviceFeature={item.serviceFeatures?.[0]?.serviceFeature}
                      buyerName={
                        item.orderProduct_order?.order_user
                          ? `${item.orderProduct_order.order_user.firstName || ""} ${item.orderProduct_order.order_user.lastName || ""}`.trim()
                          : item.buyerName || undefined
                      }
                      buyerEmail={item.orderProduct_order?.order_user?.email}
                      buyerPhone={item.orderProduct_order?.order_user?.phoneNumber}
                      buyerRating={4.2}
                      buyerOrderCount={item.orderProduct_order?.order_user?.orderCount}
                      selected={selectedIds.has(item.id)}
                      onSelect={(oid, checked) => {
                        setSelectedIds((prev) => {
                          const next = new Set(prev);
                          checked ? next.add(oid) : next.delete(oid);
                          return next;
                        });
                      }}
                      onStatusChange={(opId, newStatus) => {
                        // TODO: call backend API to update status
                      }}
                    />
                  ) : (
                    <BuyerOrderCard
                      key={item.id}
                      id={item.id}
                      orderProductType={item.orderProductType}
                      productId={item.productId || item.orderProduct_product?.id}
                      purchasePrice={String(item.purchasePrice || item.salePrice || 0)}
                      productName={
                        item.orderProduct_productPrice?.productPrice_product?.productName ||
                        item.orderProduct_product?.productName || "Product"
                      }
                      produtctImage={
                        item.orderProduct_productPrice?.productPrice_product?.productImages ||
                        item.orderProduct_product?.productImages
                      }
                      orderQuantity={item.orderQuantity}
                      orderId={String(item.id)}
                      orderNo={item.orderProduct_order?.orderNo || item.orderNo}
                      orderStatus={item.orderProductStatus}
                      orderProductDate={item.orderProductDate || item.createdAt}
                      updatedAt={item.updatedAt}
                      serviceFeature={item.serviceFeatures?.[0]?.serviceFeature}
                      sellerName={
                        item.orderProduct_productPrice?.adminDetail
                          ? `${item.orderProduct_productPrice.adminDetail.firstName || ""} ${item.orderProduct_productPrice.adminDetail.lastName || ""}`.trim()
                          : undefined
                      }
                    />
                  )
                ))
              )}
            </div>

            {/* Pagination */}
            {(ordersQuery?.data as any)?.totalCount > limit && (
              <div className="mt-8">
                <Pagination
                  page={page}
                  setPage={setPage}
                  totalCount={(ordersQuery?.data as any)?.totalCount}
                  limit={limit}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyOrdersPage;
