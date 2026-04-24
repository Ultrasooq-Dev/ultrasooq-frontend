"use client";
import React, { useState } from "react";
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
          <h1 className="text-2xl font-bold tracking-tight" translate="no">
            {t("analytics")}
          </h1>
          <p className="text-muted-foreground text-sm" translate="no">
            {t("track_your_store_performance")}
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
            <SelectItem value="7">{t("last_7_days")}</SelectItem>
            <SelectItem value="14">{t("last_14_days")}</SelectItem>
            <SelectItem value="30">{t("last_30_days")}</SelectItem>
            <SelectItem value="90">{t("last_90_days")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <KpiCard
          title={t("product_views")}
          value={kpis.views ?? 0}
          icon={Eye}
          loading={loadingOverview}
        />
        <KpiCard
          title={t("clicks")}
          value={kpis.clicks ?? 0}
          icon={MousePointerClick}
          loading={loadingOverview}
        />
        <KpiCard
          title={t("add_to_cart")}
          value={kpis.cartAdds ?? 0}
          icon={ShoppingCart}
          loading={loadingOverview}
        />
        <KpiCard
          title={t("orders")}
          value={kpis.orders ?? 0}
          icon={Package}
          sub={t("delivered_cancelled_summary", {
            delivered: kpis.delivered ?? 0,
            cancelled: kpis.cancelled ?? 0,
          })}
          loading={loadingOverview}
        />
        <KpiCard
          title={t("revenue")}
          value={kpis.revenue ? `${kpis.revenue.toLocaleString()} OMR` : "0"}
          icon={DollarSign}
          sub={t("avg_per_order", { avg: kpis.avgOrderValue ?? 0 })}
          loading={loadingOverview}
        />
      </div>

      {/* Conversion Rate + Products Count */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title={t("conversion_rate")}
          value={`${kpis.conversionRate ?? 0}%`}
          icon={TrendingUp}
          sub={t("views_to_orders")}
          loading={loadingOverview}
        />
        <KpiCard
          title={t("delivered")}
          value={kpis.delivered ?? 0}
          icon={CheckCircle}
          loading={loadingOverview}
        />
        <KpiCard
          title={t("cancelled")}
          value={kpis.cancelled ?? 0}
          icon={XCircle}
          loading={loadingOverview}
        />
        <KpiCard
          title={t("active_products")}
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
            <CardTitle className="text-sm font-medium" translate="no">{t("sales_trend")}</CardTitle>
            <CardDescription translate="no">{t("daily_revenue_orders")}</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingOverview ? (
              <div className="h-48 w-full bg-muted animate-pulse rounded" />
            ) : salesTrend.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12" translate="no">
                {t("no_sales_data")}
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
                    name={t("revenue_omr_label")}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="orders"
                    stroke="hsl(var(--muted-foreground))"
                    strokeWidth={1.5}
                    dot={false}
                    name={t("orders")}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Conversion Funnel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium" translate="no">
              {t("conversion_funnel")}
            </CardTitle>
            <CardDescription translate="no">
              {t("funnel_flow")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingFunnel ? (
              <div className="h-48 w-full bg-muted animate-pulse rounded" />
            ) : funnelSteps.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12" translate="no">
                {t("no_funnel_data")}
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
          <CardTitle className="text-sm font-medium" translate="no">
            {t("product_performance")}
          </CardTitle>
          <CardDescription translate="no">
            {t("products_ranked_by_views", { total: products?.total ?? 0 })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground text-xs uppercase">
                  <th className="text-start py-2 pe-4" translate="no">{t("product")}</th>
                  <th className="text-end py-2 px-3" translate="no">{t("product_views")}</th>
                  <th className="text-end py-2 px-3" translate="no">{t("clicks")}</th>
                  <th className="text-end py-2 px-3" translate="no">{t("cart")}</th>
                  <th className="text-end py-2 px-3" translate="no">{t("orders")}</th>
                  <th className="text-end py-2 px-3" translate="no">{t("revenue")}</th>
                  <th className="text-end py-2 px-3" translate="no">{t("rating")}</th>
                  <th className="text-end py-2 ps-3" translate="no">{t("stock")}</th>
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
                          translate="no"
                        >
                          {t("no_products_yet")}
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
            <CardTitle className="text-sm font-medium" translate="no">
              {t("reviews_summary")}
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
                  <p className="text-sm text-muted-foreground mt-1" translate="no">
                    {t("total_reviews", { count: reviews?.totalReviews ?? 0 })}
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
            <CardTitle className="text-sm font-medium" translate="no">
              {t("recent_reviews")}
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
                    <p className="text-sm text-muted-foreground text-center py-8" translate="no">
                      {t("no_reviews_yet")}
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
