"use client";
import { useState, useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ComposedChart, Line, BarChart, Bar,
} from "recharts";
import {
  Activity, Users, Package, DollarSign, Timer,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { T } from "./theme";
import { BuyGroupDeal } from "./types";
import { generateDealTimeline } from "./utils";
import { ChartTooltip } from "./ChartTooltip";
import { CountdownTimer } from "./CountdownTimer";

export function DealAnalyticsPanel({ deals }: { deals: BuyGroupDeal[]; langDir: string }) {
  const [selectedDealId, setSelectedDealId] = useState<number | "all">("all");
  const [chartView, setChartView] = useState<"customers" | "quantity" | "revenue">("customers");

  const openDeals = deals.filter((d) => ["ACTIVE", "THRESHOLD_MET", "EXPIRED"].includes(d.status));

  const allDealsTimeline = useMemo(() => {
    if (openDeals.length === 0) return [];
    const allDates = openDeals.flatMap((d) => [new Date(d.dateOpen).getTime(), new Date(d.dateClose).getTime()]);
    const minDate = Math.min(...allDates);
    const maxDate = Math.max(...allDates);
    const totalDays = Math.max(1, Math.round((maxDate - minDate) / 86400000));
    const step = totalDays <= 14 ? 1 : totalDays <= 60 ? 3 : 7;
    const points: { date: string; customers: number; quantity: number; revenue: number; deals: number }[] = [];

    for (let d = 0; d <= totalDays; d += step) {
      const dayDate = new Date(minDate + d * 86400000);
      const dayStr = dayDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      let totalCustomers = 0;
      let totalQuantity = 0;
      let totalRevenue = 0;
      let activeDealsCount = 0;

      for (const deal of openDeals) {
        const dealOpen = new Date(deal.dateOpen).getTime();
        const dealClose = new Date(deal.dateClose).getTime();
        if (dayDate.getTime() >= dealOpen && dayDate.getTime() <= dealClose) activeDealsCount++;
        const ordersUpToDay = deal.orders.filter((o) => {
          const orderDate = new Date(o.createdAt).getTime();
          return orderDate <= dayDate.getTime() && !["CANCELLED", "REFUNDED"].includes(o.status);
        });
        totalCustomers += ordersUpToDay.length;
        totalQuantity += ordersUpToDay.reduce((s, o) => s + o.quantity, 0);
        totalRevenue += ordersUpToDay.reduce((s, o) => s + o.total, 0);
      }
      points.push({ date: dayStr, customers: totalCustomers, quantity: totalQuantity, revenue: Math.round(totalRevenue), deals: activeDealsCount });
    }
    return points;
  }, [openDeals]);

  const selectedDeal = selectedDealId === "all" ? null : openDeals.find((d) => d.id === selectedDealId) || null;
  const timeline = selectedDeal ? generateDealTimeline(selectedDeal) : allDealsTimeline;

  const chartConfig = {
    customers: { color: "#c2703e", gradientId: "custGrad", label: "Customers" },
    quantity: { color: "#3b82f6", gradientId: "qtyGrad", label: "Units Ordered" },
    revenue: { color: "#10b981", gradientId: "revGrad", label: "Revenue" },
  };
  const cc = chartConfig[chartView];

  if (openDeals.length === 0) return null;

  return (
    <div className={cn(T.card, T.border, "border rounded-2xl overflow-hidden mb-8")}>
      {/* Header */}
      <div className={cn("px-6 py-4 border-b flex flex-wrap items-center justify-between gap-3", T.border)}>
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-xl", T.accentLight)}>
            <Activity className={cn("h-5 w-5", T.accentText)} />
          </div>
          <div>
            <h3 className={cn("text-base font-semibold", T.text)}>Deal Analytics</h3>
            <p className={cn("text-xs", T.muted)}>Timeline view of open deals performance</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedDealId}
            onChange={(e) => setSelectedDealId(e.target.value === "all" ? "all" : Number(e.target.value))}
            className={cn("px-3 py-1.5 rounded-xl border text-sm", T.border, "focus:outline-none focus:ring-2 focus:ring-primary/20")}
          >
            <option value="all">All Open Deals ({openDeals.length})</option>
            {openDeals.map((d) => (
              <option key={d.id} value={d.id}>
                {d.productName.length > 30 ? d.productName.slice(0, 30) + "..." : d.productName}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-1 bg-muted/50 rounded-xl p-1">
            {(["customers", "quantity", "revenue"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setChartView(v)}
                className={cn("px-3 py-1 rounded-lg text-xs font-medium transition-colors", chartView === v ? cn(T.accentBg, "text-primary-foreground") : cn(T.muted, "hover:bg-card"))}
              >
                {v === "customers" ? "Customers" : v === "quantity" ? "Quantity" : "Revenue"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="p-6">
        {selectedDeal && (
          <div className={cn("flex flex-wrap items-center gap-4 mb-4 text-xs", T.muted)}>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 rounded-full" style={{ backgroundColor: cc.color }} />{cc.label}
            </span>
            {chartView === "customers" && (
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 rounded-full bg-red-400" />Min Target ({selectedDeal.minCustomer})
              </span>
            )}
            <span className="ms-auto">
              Deal: {new Date(selectedDeal.dateOpen).toLocaleDateString("en-US", { month: "short", day: "numeric" })} — {new Date(selectedDeal.dateClose).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          </div>
        )}

        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={timeline as object[]} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id={cc.gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={cc.color} stopOpacity={0.25} />
                <stop offset="95%" stopColor={cc.color} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e8dfd4" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#8a7560" }} tickLine={false} axisLine={{ stroke: "#e8dfd4" }} />
            <YAxis tick={{ fontSize: 11, fill: "#8a7560" }} tickLine={false} axisLine={false} width={45} tickFormatter={(v) => chartView === "revenue" ? `$${v}` : String(v)} />
            <Tooltip content={<ChartTooltip />} />
            <Area type="monotone" dataKey={chartView} name={cc.label} stroke={cc.color} strokeWidth={2.5} fill={`url(#${cc.gradientId})`} dot={{ r: 3, fill: cc.color, strokeWidth: 0 }} activeDot={{ r: 5, fill: cc.color, strokeWidth: 2, stroke: "#fff" }} />
            {selectedDeal && chartView === "customers" && (
              <Line type="monotone" dataKey="target" name="Min Target" stroke="#f87171" strokeWidth={1.5} strokeDasharray="6 4" dot={false} activeDot={false} />
            )}
            {!selectedDeal && (
              <Bar dataKey="deals" name="Active Deals" fill="#c2703e" opacity={0.12} radius={[4, 4, 0, 0]} barSize={20} />
            )}
          </ComposedChart>
        </ResponsiveContainer>

        {selectedDeal && (
          <div className={cn("flex items-center gap-6 mt-4 pt-4 border-t text-sm", T.border)}>
            <div className="flex items-center gap-2">
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", T.infoBg)}><Users className={cn("h-4 w-4", T.infoText)} /></div>
              <div>
                <div className={cn("text-xs", T.muted)}>Customers</div>
                <div className={cn("font-semibold", T.text)}>
                  {selectedDeal.currentCustomers}
                  <span className={cn("text-xs font-normal ms-1", selectedDeal.currentCustomers >= selectedDeal.minCustomer ? T.success : T.warning)}>/ {selectedDeal.minCustomer} min</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", "bg-blue-50")}><Package className="h-4 w-4 text-blue-600" /></div>
              <div>
                <div className={cn("text-xs", T.muted)}>Quantity</div>
                <div className={cn("font-semibold", T.text)}>
                  {selectedDeal.orderedQuantity}<span className="text-xs font-normal text-muted-foreground ms-1">/ {selectedDeal.stock} stock</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", T.successBg)}><DollarSign className={cn("h-4 w-4", T.success)} /></div>
              <div>
                <div className={cn("text-xs", T.muted)}>Revenue</div>
                <div className={cn("font-semibold", T.text)}>
                  {selectedDeal.currency}{selectedDeal.orders.filter((o) => !["CANCELLED", "REFUNDED"].includes(o.status)).reduce((s, o) => s + o.total, 0).toFixed(2)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 ms-auto">
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", T.accentLight)}><Timer className={cn("h-4 w-4", T.accentText)} /></div>
              <div>
                <div className={cn("text-xs", T.muted)}>Time Left</div>
                <div className="font-semibold"><CountdownTimer dateClose={selectedDeal.dateClose} endTime={selectedDeal.endTime} /></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
