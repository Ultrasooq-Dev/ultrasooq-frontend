"use client";
import { useState } from "react";
import {
  Users, Package, Timer, DollarSign,
  CheckCircle2, AlertTriangle, ChevronDown,
  MoreHorizontal, Zap, CalendarPlus, Bell, Ban, BarChart3,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Line,
} from "recharts";
import { cn } from "@/lib/utils";
import { T } from "./theme";
import { BuyGroupDeal } from "./types";
import { generateDealTimeline } from "./utils";
import { StatusBadge } from "./StatusBadge";
import { ProgressBar } from "./ProgressBar";
import { CountdownTimer } from "./CountdownTimer";
import { ChartTooltip } from "./ChartTooltip";
import { BuyersPanel } from "./BuyersPanel";
import { ExtendTimeModal, CancelRefundModal, NotifyBuyersModal } from "./DealCardModals";

export function DealCard({ deal, langDir, t }: { deal: BuyGroupDeal; langDir: string; t: any }) {
  const [showPanel, setShowPanel] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [extendDays, setExtendDays] = useState(1);
  const [extendInput, setExtendInput] = useState("");

  const activeOrders = deal.orders.filter((o) => !["CANCELLED", "REFUNDED"].includes(o.status));
  const cancelledOrders = deal.orders.filter((o) => ["CANCELLED", "REFUNDED"].includes(o.status));
  const customerPct = deal.minCustomer > 0 ? (deal.currentCustomers / deal.minCustomer) * 100 : 100;
  const quantityPct = deal.stock > 0 ? (deal.orderedQuantity / deal.stock) * 100 : 0;
  const isExpired = deal.status === "EXPIRED";
  const isActive = deal.status === "ACTIVE";
  const isThresholdMet = deal.status === "THRESHOLD_MET";
  const isDealDone = ["COMPLETED", "CANCELLED"].includes(deal.status);
  const revenue = activeOrders.reduce((sum, o) => sum + o.total, 0);

  return (
    <div className={cn(T.card, T.border, "border rounded-2xl overflow-hidden transition-shadow hover:shadow-md")}>
      <div className="p-6">
        {/* ── Deal Header ── */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className={cn("w-16 h-16 rounded-xl flex-shrink-0 flex items-center justify-center", T.accentLight)}>
              {deal.productImage ? (
                <img src={deal.productImage} alt={deal.productName} className="w-full h-full rounded-xl object-cover" />
              ) : (
                <Package className={cn("h-8 w-8", T.accentText)} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className={cn("text-lg font-semibold truncate", T.text)}>{deal.productName}</h3>
                <StatusBadge status={deal.status} />
              </div>
              <div className={cn("flex items-center gap-4 mt-1.5 text-sm", T.muted)}>
                <span className="flex items-center gap-1">
                  <DollarSign className="h-3.5 w-3.5" />
                  <span className="line-through">{deal.currency}{deal.price}</span>
                  <span className={cn("font-semibold", T.accentText)}>{deal.currency}{deal.offerPrice}</span>
                </span>
                <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{deal.currentCustomers}/{deal.minCustomer} min</span>
                <span className="flex items-center gap-1"><Package className="h-3.5 w-3.5" />{deal.orderedQuantity}/{deal.stock} units</span>
                {!isDealDone && (
                  <span className="flex items-center gap-1">
                    <Timer className="h-3.5 w-3.5" />
                    <CountdownTimer dateClose={deal.dateClose} endTime={deal.endTime} />
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          {!isDealDone && (
            <div className="flex items-center gap-2 flex-shrink-0">
              {isThresholdMet && (
                <button className={cn("px-4 py-2 rounded-xl text-sm font-medium text-white transition-colors", T.accentBg, "hover:opacity-90")}>
                  <CheckCircle2 className="h-4 w-4 inline-block me-1.5" />Accept Deal
                </button>
              )}
              <button onClick={() => setShowActions(!showActions)} className={cn("p-2 rounded-xl transition-colors hover:bg-gray-100", T.muted)}>
                <MoreHorizontal className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>

        {/* ── Progress Bars ── */}
        <div className="grid grid-cols-2 gap-6 mt-5">
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className={T.muted}>Customers ({deal.currentCustomers}/{deal.minCustomer} min)</span>
              <span className={cn("font-semibold", customerPct >= 100 ? T.success : T.accentText)}>{Math.round(customerPct)}%</span>
            </div>
            <ProgressBar value={deal.currentCustomers} max={deal.minCustomer} color={customerPct >= 100 ? "bg-emerald-500" : "bg-[#c2703e]"} height="h-2.5" />
          </div>
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className={T.muted}>Quantity ({deal.orderedQuantity}/{deal.stock} stock)</span>
              <span className={cn("font-semibold", quantityPct >= 100 ? T.success : T.infoText)}>{Math.round(quantityPct)}%</span>
            </div>
            <ProgressBar value={deal.orderedQuantity} max={deal.stock} color={quantityPct >= 100 ? "bg-emerald-500" : "bg-blue-500"} height="h-2.5" />
          </div>
        </div>

        {/* ── Action Dropdown ── */}
        {showActions && !isDealDone && (
          <div className={cn("mt-4 p-4 rounded-xl border flex flex-wrap gap-2", T.border, "bg-[#faf6f1]")}>
            {isActive && (
              <button className={cn("inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-colors", T.successBg, T.successBorder, T.success, "hover:bg-emerald-100")}>
                <Zap className="h-4 w-4" />Bypass Minimum
              </button>
            )}
            <button onClick={() => setShowExtendModal(true)} className={cn("inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-colors", T.infoBg, T.infoBorder, T.infoText, "hover:bg-blue-100")}>
              <CalendarPlus className="h-4 w-4" />Extend Time
            </button>
            <button onClick={() => setShowNotifyModal(true)} className={cn("inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-colors", "bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100")}>
              <Bell className="h-4 w-4" />Notify All Buyers
            </button>
            <button onClick={() => setShowCancelModal(true)} className={cn("inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-colors", T.dangerBg, T.dangerBorder, T.danger, "hover:bg-red-100")}>
              <Ban className="h-4 w-4" />Cancel & Refund All
            </button>
          </div>
        )}

        {/* ── Expired Deal Actions ── */}
        {isExpired && (
          <div className={cn("mt-4 p-4 rounded-xl border", T.warningBorder, T.warningBg)}>
            <div className="flex items-start gap-3">
              <AlertTriangle className={cn("h-5 w-5 flex-shrink-0 mt-0.5", T.warning)} />
              <div className="flex-1">
                <p className={cn("text-sm font-medium", T.warning)}>
                  Deal expired without meeting minimum ({deal.currentCustomers}/{deal.minCustomer} customers)
                </p>
                <p className="text-xs text-amber-500 mt-1">
                  Choose to extend the deal, bypass the minimum to proceed, or cancel and refund all orders.
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <button className={cn("px-3 py-1.5 rounded-lg text-xs font-medium text-white", T.accentBg)}>
                    <Zap className="h-3.5 w-3.5 inline me-1" />Bypass & Accept
                  </button>
                  <button
                    onClick={() => {
                      const origDays = Math.max(1, Math.round((new Date(deal.dateClose).getTime() - new Date(deal.dateOpen).getTime()) / 86400000));
                      const maxExt = Math.max(1, Math.floor(origDays / 2));
                      setExtendDays(Math.min(maxExt, 7));
                      setExtendInput(String(Math.min(maxExt, 7)));
                      setShowExtendModal(true);
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500 text-white"
                  >
                    <CalendarPlus className="h-3.5 w-3.5 inline me-1" />Extend Time
                  </button>
                  <button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500 text-white">
                    <Ban className="h-3.5 w-3.5 inline me-1" />Cancel & Refund All
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Per-Deal Mini Timeline ── */}
        {deal.orders.length > 0 && (() => {
          const tl = generateDealTimeline(deal);
          return (
            <div className={cn("mt-4 pt-4 border-t", T.border)}>
              <div className="flex items-center justify-between mb-2">
                <span className={cn("text-xs font-medium", T.muted)}>Order Timeline</span>
                <div className={cn("flex items-center gap-4 text-xs", T.muted)}>
                  <span>Revenue: <span className={cn("font-semibold", T.text)}>{deal.currency}{revenue.toFixed(2)}</span></span>
                  <span>Active: <span className="font-semibold">{activeOrders.length}</span></span>
                  {cancelledOrders.length > 0 && <span className={T.danger}>Cancelled: {cancelledOrders.length}</span>}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={100}>
                <AreaChart data={tl} margin={{ top: 2, right: 4, left: 0, bottom: 2 }}>
                  <defs>
                    <linearGradient id={`miniGrad-${deal.id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#c2703e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#c2703e" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8dfd4" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#8a7560" }} tickLine={false} axisLine={false} />
                  <YAxis hide />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="customers" name="Customers" stroke="#c2703e" strokeWidth={2} fill={`url(#miniGrad-${deal.id})`} dot={{ r: 2, fill: "#c2703e", strokeWidth: 0 }} />
                  <Line type="monotone" dataKey="target" name="Min Target" stroke="#f87171" strokeWidth={1} strokeDasharray="4 3" dot={false} activeDot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          );
        })()}

        {/* Action Buttons Row */}
        <div className={cn("flex items-center gap-2 mt-3 pt-3 border-t", T.border)}>
          <button
            onClick={() => setShowPanel(true)}
            className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium text-sm border transition-colors", T.border, T.accentText, "hover:bg-[#c2703e]/5")}
          >
            <Users className="h-4 w-4" />View Buyers ({deal.orders.length})
          </button>
          <a
            href={`/manage-products/deal-analysis?id=${deal.id}`}
            className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium text-sm text-white transition-colors", T.accentBg, "hover:opacity-90")}
          >
            <BarChart3 className="h-4 w-4" />Full Analysis
          </a>
        </div>
      </div>

      {showPanel && <BuyersPanel deal={deal} onClose={() => setShowPanel(false)} />}

      {showExtendModal && (
        <ExtendTimeModal
          deal={deal}
          extendDays={extendDays}
          extendInput={extendInput}
          setExtendDays={setExtendDays}
          setExtendInput={setExtendInput}
          onClose={() => setShowExtendModal(false)}
        />
      )}

      {showCancelModal && (
        <CancelRefundModal
          activeOrders={activeOrders}
          revenue={revenue}
          currency={deal.currency}
          onClose={() => setShowCancelModal(false)}
        />
      )}

      {showNotifyModal && (
        <NotifyBuyersModal
          activeOrderCount={activeOrders.length}
          onClose={() => setShowNotifyModal(false)}
        />
      )}
    </div>
  );
}
