"use client";
import React, { useState, use } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useVendorProductDetail } from "@/apis/queries/vendor-analytics.queries";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  ArrowLeft,
  Eye,
  MousePointerClick,
  ShoppingCart,
  Package,
  DollarSign,
  Star,
  CheckCircle,
  XCircle,
  Users,
  TrendingUp,
} from "lucide-react";

function KpiCard({
  title,
  value,
  icon: Icon,
  sub,
  loading,
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<any>;
  sub?: string;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-7 w-20 bg-muted animate-pulse rounded" />
        ) : (
          <>
            <div className="text-xl font-bold">
              {typeof value === "number" ? value.toLocaleString() : value}
            </div>
            {sub && (
              <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function ProductDetailAnalyticsPage({
  params,
}: {
  params: Promise<{ productPriceId: string }>;
}) {
  const { productPriceId } = use(params);
  const ppId = Number(productPriceId);
  const t = useTranslations();
  const [days, setDays] = useState(30);

  const { data, isLoading } = useVendorProductDetail(ppId, days);

  const product = data?.product;
  const kpis = data?.kpis ?? {};
  const viewsTrend = data?.viewsTrend ?? [];
  const ordersTrend = data?.ordersTrend ?? [];
  const clickSources = data?.clickSources ?? [];
  const recentOrders = data?.recentOrders ?? [];
  const reviews = data?.reviews ?? [];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/analytics">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              {isLoading ? (
                <div className="h-6 w-48 bg-muted animate-pulse rounded" />
              ) : (
                product?.productName ?? "Product Analytics"
              )}
            </h1>
            {product && (
              <p className="text-sm text-muted-foreground">
                {product.offerPrice ?? product.price} OMR
                {product.stock != null && ` · Stock: ${product.stock}`}
              </p>
            )}
          </div>
        </div>
        <Select
          value={String(days)}
          onValueChange={(v) => setDays(Number(v))}
        >
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="14">Last 14 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <KpiCard
          title="Total Views"
          value={kpis.totalViews ?? 0}
          icon={Eye}
          sub={`${kpis.uniqueViewers ?? 0} unique`}
          loading={isLoading}
        />
        <KpiCard
          title="Clicks"
          value={kpis.totalClicks ?? 0}
          icon={MousePointerClick}
          loading={isLoading}
        />
        <KpiCard
          title="Add to Cart"
          value={kpis.cartAdds ?? 0}
          icon={ShoppingCart}
          loading={isLoading}
        />
        <KpiCard
          title="Orders"
          value={kpis.orders ?? 0}
          icon={Package}
          sub={`${kpis.delivered ?? 0} delivered`}
          loading={isLoading}
        />
        <KpiCard
          title="Revenue"
          value={
            kpis.revenue ? `${kpis.revenue.toLocaleString()} OMR` : "0 OMR"
          }
          icon={DollarSign}
          loading={isLoading}
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          title="Conversion"
          value={`${kpis.conversionRate ?? 0}%`}
          icon={TrendingUp}
          sub="views → orders"
          loading={isLoading}
        />
        <KpiCard
          title="Cancelled"
          value={kpis.cancelled ?? 0}
          icon={XCircle}
          loading={isLoading}
        />
        <KpiCard
          title="Avg Rating"
          value={kpis.avgRating ?? 0}
          icon={Star}
          sub={`${kpis.totalReviews ?? 0} reviews`}
          loading={isLoading}
        />
        <KpiCard
          title="Unique Viewers"
          value={kpis.uniqueViewers ?? 0}
          icon={Users}
          loading={isLoading}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Views Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Daily Views
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-48 w-full bg-muted animate-pulse rounded" />
            ) : viewsTrend.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">
                No view data
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={viewsTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => v.slice(5)}
                  />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                    name="Views"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Orders + Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Daily Orders & Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-48 w-full bg-muted animate-pulse rounded" />
            ) : ordersTrend.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">
                No order data
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={ordersTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => v.slice(5)}
                  />
                  <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                    name="Revenue (OMR)"
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="orders"
                    stroke="hsl(var(--muted-foreground))"
                    strokeWidth={1.5}
                    dot={false}
                    name="Orders"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Click Sources + Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Click Sources */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Traffic Sources
            </CardTitle>
            <CardDescription>Where clicks come from</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-40 bg-muted animate-pulse rounded" />
            ) : clickSources.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No click data
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={clickSources} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis
                    dataKey="source"
                    type="category"
                    tick={{ fontSize: 10 }}
                    width={80}
                  />
                  <Tooltip />
                  <Bar
                    dataKey="count"
                    fill="hsl(var(--primary))"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Recent Orders
            </CardTitle>
            <CardDescription>
              Last {recentOrders.length} orders for this product
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground text-xs uppercase">
                    <th className="text-start py-2 pe-3">Order #</th>
                    <th className="text-end py-2 px-3">Qty</th>
                    <th className="text-end py-2 px-3">Price</th>
                    <th className="text-end py-2 px-3">You Receive</th>
                    <th className="text-start py-2 px-3">Status</th>
                    <th className="text-end py-2 ps-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading
                    ? Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i} className="border-b">
                          <td colSpan={6} className="py-2">
                            <div className="h-5 w-full bg-muted animate-pulse rounded" />
                          </td>
                        </tr>
                      ))
                    : recentOrders.length === 0
                      ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="text-center py-8 text-muted-foreground"
                          >
                            No orders yet
                          </td>
                        </tr>
                      )
                      : recentOrders.map((o: any) => (
                        <tr key={o.id} className="border-b hover:bg-muted/40">
                          <td className="py-2 pe-3 font-mono text-xs">
                            {o.orderNo ?? `#${o.id}`}
                          </td>
                          <td className="text-end py-2 px-3">{o.orderQuantity}</td>
                          <td className="text-end py-2 px-3 font-mono">
                            {o.salePrice} OMR
                          </td>
                          <td className="text-end py-2 px-3 font-mono">
                            {o.sellerReceives} OMR
                          </td>
                          <td className="py-2 px-3">
                            <Badge
                              variant={
                                o.orderProductStatus === "DELIVERED"
                                  ? "default"
                                  : o.orderProductStatus === "CANCELLED"
                                    ? "destructive"
                                    : "secondary"
                              }
                              className="text-xs"
                            >
                              {o.orderProductStatus}
                            </Badge>
                          </td>
                          <td className="text-end py-2 ps-3 text-xs text-muted-foreground">
                            {o.createdAt
                              ? new Date(o.createdAt).toLocaleDateString()
                              : "—"}
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reviews */}
      {reviews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Customer Reviews ({kpis.totalReviews ?? 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reviews.map((r: any) => (
                <div
                  key={r.id}
                  className="border-b last:border-0 pb-3 last:pb-0"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`h-3 w-3 ${
                            s <= (r.rating ?? 0)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-muted"
                          }`}
                        />
                      ))}
                      <span className="text-xs text-muted-foreground ms-2">
                        {r.buyerName}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {r.createdAt
                        ? new Date(r.createdAt).toLocaleDateString()
                        : ""}
                    </span>
                  </div>
                  {r.title && (
                    <p className="text-sm font-medium mt-1">{r.title}</p>
                  )}
                  {r.description && (
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {r.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
