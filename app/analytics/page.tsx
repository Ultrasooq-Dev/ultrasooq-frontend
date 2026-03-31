"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  useVendorOverview,
  useVendorProducts,
  useVendorFunnel,
  useVendorReviews,
} from "@/apis/queries/vendor-analytics.queries";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Eye,
  MousePointerClick,
  ShoppingCart,
  Package,
  TrendingUp,
  DollarSign,
  Star,
  ArrowDownRight,
  CheckCircle,
  XCircle,
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
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-8 w-24 bg-muted animate-pulse rounded" />
        ) : (
          <>
            <div className="text-2xl font-bold">
              {typeof value === "number" ? value.toLocaleString() : value}
            </div>
            {sub && (
              <p className="text-xs text-muted-foreground mt-1">{sub}</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function VendorAnalyticsPage() {
  const t = useTranslations();
  const [days, setDays] = useState(30);

  const { data: overview, isLoading: loadingOverview } =
    useVendorOverview(days);
  const { data: products, isLoading: loadingProducts } =
    useVendorProducts(days);
  const { data: funnel, isLoading: loadingFunnel } = useVendorFunnel(days);
  const { data: reviews, isLoading: loadingReviews } = useVendorReviews();

  const kpis = overview?.kpis ?? {};
  const salesTrend = overview?.salesTrend ?? [];
  const funnelSteps = funnel?.funnel ?? [];
  const productList = products?.products ?? [];
  const reviewList = reviews?.reviews ?? [];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t("analytics") || "Analytics"}
          </h1>
          <p className="text-muted-foreground text-sm">
            Track your store performance and sales
          </p>
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <KpiCard
          title="Product Views"
          value={kpis.views ?? 0}
          icon={Eye}
          loading={loadingOverview}
        />
        <KpiCard
          title="Clicks"
          value={kpis.clicks ?? 0}
          icon={MousePointerClick}
          loading={loadingOverview}
        />
        <KpiCard
          title="Add to Cart"
          value={kpis.cartAdds ?? 0}
          icon={ShoppingCart}
          loading={loadingOverview}
        />
        <KpiCard
          title="Orders"
          value={kpis.orders ?? 0}
          icon={Package}
          sub={`${kpis.delivered ?? 0} delivered · ${kpis.cancelled ?? 0} cancelled`}
          loading={loadingOverview}
        />
        <KpiCard
          title="Revenue"
          value={kpis.revenue ? `${kpis.revenue.toLocaleString()} OMR` : "0"}
          icon={DollarSign}
          sub={`Avg ${kpis.avgOrderValue ?? 0} OMR/order`}
          loading={loadingOverview}
        />
      </div>

      {/* Conversion Rate + Products Count */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Conversion Rate"
          value={`${kpis.conversionRate ?? 0}%`}
          icon={TrendingUp}
          sub="views → orders"
          loading={loadingOverview}
        />
        <KpiCard
          title="Delivered"
          value={kpis.delivered ?? 0}
          icon={CheckCircle}
          loading={loadingOverview}
        />
        <KpiCard
          title="Cancelled"
          value={kpis.cancelled ?? 0}
          icon={XCircle}
          loading={loadingOverview}
        />
        <KpiCard
          title="Active Products"
          value={kpis.totalProducts ?? 0}
          icon={Package}
          loading={loadingOverview}
        />
      </div>

      {/* Sales Trend + Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Sales Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Sales Trend</CardTitle>
            <CardDescription>Daily revenue & orders</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingOverview ? (
              <div className="h-48 w-full bg-muted animate-pulse rounded" />
            ) : salesTrend.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">
                No sales data yet
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={salesTrend}>
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
                    yAxisId="left"
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                    name="Revenue (OMR)"
                  />
                  <Line
                    yAxisId="right"
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

        {/* Conversion Funnel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Conversion Funnel
            </CardTitle>
            <CardDescription>
              Views → Clicks → Cart → Orders → Delivered
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingFunnel ? (
              <div className="h-48 w-full bg-muted animate-pulse rounded" />
            ) : funnelSteps.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">
                No funnel data yet
              </p>
            ) : (
              <div className="space-y-3">
                {funnelSteps.map((step: any, i: number) => (
                  <div key={step.step} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{step.step}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono">
                          {step.count.toLocaleString()}
                        </span>
                        {i > 0 && step.dropOff > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            <ArrowDownRight className="h-3 w-3 me-0.5" />
                            {step.dropOff}%
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{
                          width: `${Math.max(step.conversionRate, 2)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Products */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Product Performance
          </CardTitle>
          <CardDescription>
            Your products ranked by views ({products?.total ?? 0} total)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground text-xs uppercase">
                  <th className="text-start py-2 pe-4">Product</th>
                  <th className="text-end py-2 px-3">Views</th>
                  <th className="text-end py-2 px-3">Clicks</th>
                  <th className="text-end py-2 px-3">Cart</th>
                  <th className="text-end py-2 px-3">Orders</th>
                  <th className="text-end py-2 px-3">Revenue</th>
                  <th className="text-end py-2 px-3">Rating</th>
                  <th className="text-end py-2 ps-3">Stock</th>
                </tr>
              </thead>
              <tbody>
                {loadingProducts
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b">
                        <td colSpan={8} className="py-3">
                          <div className="h-6 w-full bg-muted animate-pulse rounded" />
                        </td>
                      </tr>
                    ))
                  : productList.length === 0
                    ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="text-center py-8 text-muted-foreground"
                        >
                          No products yet
                        </td>
                      </tr>
                    )
                    : productList.map((p: any) => (
                      <tr
                        key={p.priceId}
                        className="border-b hover:bg-muted/40 cursor-pointer"
                        onClick={() => window.location.href = `/analytics/${p.priceId}`}
                      >
                        <td className="py-2 pe-4">
                          <div className="font-medium truncate max-w-xs">
                            {p.productName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {p.offerPrice ?? p.productPrice} OMR
                          </div>
                        </td>
                        <td className="text-end py-2 px-3 font-mono">
                          {p.views.toLocaleString()}
                        </td>
                        <td className="text-end py-2 px-3 font-mono">
                          {p.clicks.toLocaleString()}
                        </td>
                        <td className="text-end py-2 px-3 font-mono">
                          {p.cartAdds.toLocaleString()}
                        </td>
                        <td className="text-end py-2 px-3 font-mono">
                          {p.orders.toLocaleString()}
                        </td>
                        <td className="text-end py-2 px-3 font-mono">
                          {p.revenue.toLocaleString()}
                        </td>
                        <td className="text-end py-2 px-3">
                          {p.avgRating > 0 ? (
                            <div className="flex items-center justify-end gap-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span className="font-mono">{p.avgRating}</span>
                              <span className="text-xs text-muted-foreground">
                                ({p.reviewCount})
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="text-end py-2 ps-3">
                          <Badge
                            variant={
                              p.stock == null
                                ? "outline"
                                : p.stock > 10
                                  ? "default"
                                  : p.stock > 0
                                    ? "secondary"
                                    : "destructive"
                            }
                          >
                            {p.stock ?? "∞"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Reviews Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Rating Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Reviews Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingReviews ? (
              <div className="h-32 w-full bg-muted animate-pulse rounded" />
            ) : (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-4xl font-bold">
                    {reviews?.avgRating ?? 0}
                  </div>
                  <div className="flex items-center justify-center gap-0.5 mt-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`h-4 w-4 ${
                          s <= Math.round(reviews?.avgRating ?? 0)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-muted"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {reviews?.totalReviews ?? 0} reviews
                  </p>
                </div>
                {/* Distribution bars */}
                <div className="space-y-1.5">
                  {[5, 4, 3, 2, 1].map((rating) => {
                    const dist = (reviews?.distribution ?? []).find(
                      (d: any) => d.rating === rating
                    );
                    const count = dist?.count ?? 0;
                    const pct =
                      (reviews?.totalReviews ?? 0) > 0
                        ? Math.round(
                            (count / (reviews?.totalReviews ?? 1)) * 100
                          )
                        : 0;
                    return (
                      <div
                        key={rating}
                        className="flex items-center gap-2 text-xs"
                      >
                        <span className="w-4 text-end">{rating}</span>
                        <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-yellow-400 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-8 text-end text-muted-foreground">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Reviews */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Recent Reviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {loadingReviews
                ? Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-16 w-full bg-muted animate-pulse rounded"
                    />
                  ))
                : reviewList.length === 0
                  ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No reviews yet
                    </p>
                  )
                  : reviewList.slice(0, 10).map((r: any) => (
                    <div
                      key={r.id}
                      className="border-b last:border-0 pb-3 last:pb-0"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
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
                      <p className="text-sm mt-1 text-muted-foreground truncate">
                        {r.productName}
                      </p>
                      {r.description && (
                        <p className="text-sm mt-0.5">{r.description}</p>
                      )}
                    </div>
                  ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
