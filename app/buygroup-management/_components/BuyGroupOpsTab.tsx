"use client";
import { useState, useMemo } from "react";
import {
  Clock, CheckCircle2, AlertTriangle, DollarSign, Package, Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { T } from "./theme";
import { DealStatus } from "./types";
import { MOCK_DEALS } from "./mock-data";
import { StatCard } from "./StatCard";
import { DealCard } from "./DealCard";
import { DealAnalyticsPanel } from "./DealAnalyticsPanel";

export function BuyGroupOpsTab({ langDir, t }: { langDir: string; t: any }) {
  const [statusFilter, setStatusFilter] = useState<"all" | DealStatus>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const deals = MOCK_DEALS; // Replace with API call

  const filteredDeals = useMemo(() => {
    let result = deals;
    if (statusFilter !== "all") {
      result = result.filter((d) => d.status === statusFilter);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter((d) => d.productName.toLowerCase().includes(term));
    }
    return result;
  }, [deals, statusFilter, searchTerm]);

  const activeDeals = deals.filter((d) => d.status === "ACTIVE").length;
  const thresholdMetDeals = deals.filter((d) => d.status === "THRESHOLD_MET").length;
  const expiredDeals = deals.filter((d) => d.status === "EXPIRED").length;
  const totalRevenue = deals.reduce((sum, d) => {
    const activeOrders = d.orders.filter((o) => !["CANCELLED", "REFUNDED"].includes(o.status));
    return sum + activeOrders.reduce((s, o) => s + o.total, 0);
  }, 0);

  return (
    <div>
      {/* ── Stats ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard icon={<Clock className="h-5 w-5 text-blue-600" />} label="Active Deals" value={activeDeals} sub="Waiting for threshold" color={T.infoBg} />
        <StatCard icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />} label="Ready to Accept" value={thresholdMetDeals} sub="Minimum met — action needed" color={T.successBg} />
        <StatCard icon={<AlertTriangle className="h-5 w-5 text-amber-600" />} label="Expired" value={expiredDeals} sub="Needs decision" color={T.warningBg} />
        <StatCard icon={<DollarSign className="h-5 w-5 text-[#c2703e]" />} label="Total Revenue" value={`$${totalRevenue.toFixed(0)}`} sub="Across all active deals" color={T.accentLight} />
      </div>

      {/* ── Analytics Panel ── */}
      <DealAnalyticsPanel deals={deals} langDir={langDir} />

      {/* ── Filters ── */}
      <div className={cn(T.card, T.border, "border rounded-2xl p-4 mb-6 flex flex-wrap items-center gap-3")}>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search deals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={cn("w-full ps-9 pe-4 py-2 rounded-xl border text-sm", T.border, "focus:outline-none focus:ring-2 focus:ring-[#c2703e]/20 focus:border-[#c2703e]")}
          />
        </div>
        <div className="flex items-center gap-1.5 bg-[#faf6f1] rounded-xl p-1">
          {(["all", "ACTIVE", "THRESHOLD_MET", "EXPIRED", "COMPLETED", "CANCELLED"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                statusFilter === s ? cn(T.accentBg, "text-white") : cn(T.muted, "hover:bg-white"),
              )}
            >
              {s === "all" ? "All" : s === "THRESHOLD_MET" ? "Ready" : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* ── Deal List ── */}
      <div className="space-y-5">
        {filteredDeals.length === 0 ? (
          <div className={cn(T.card, T.border, "border rounded-2xl p-12 text-center")}>
            <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className={cn("text-lg font-medium", T.muted)}>No deals found</p>
            <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          filteredDeals.map((deal) => (
            <DealCard key={deal.id} deal={deal} langDir={langDir} t={t} />
          ))
        )}
      </div>
    </div>
  );
}
