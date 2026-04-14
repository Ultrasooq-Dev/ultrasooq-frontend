"use client";
import { useState } from "react";
import {
  CalendarPlus, AlertTriangle, XCircle, Ban, Send,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { T } from "./theme";
import { BuyGroupDeal, BuyGroupOrder } from "./types";

// ─── Extend Time Modal ───────────────────────────────────────

interface ExtendModalProps {
  deal: BuyGroupDeal;
  extendDays: number;
  extendInput: string;
  setExtendDays: (v: number) => void;
  setExtendInput: (v: string) => void;
  onClose: () => void;
}

export function ExtendTimeModal({
  deal, extendDays, extendInput, setExtendDays, setExtendInput, onClose,
}: ExtendModalProps) {
  const openDate = new Date(deal.dateOpen);
  const closeDate = new Date(deal.dateClose);
  const originalDays = Math.max(1, Math.round((closeDate.getTime() - openDate.getTime()) / 86400000));
  const maxExtendDays = Math.max(1, Math.floor(originalDays / 2));
  const safeDays = Math.min(extendDays, maxExtendDays);
  const pct = maxExtendDays > 0 ? (safeDays / maxExtendDays) * 100 : 0;
  const isNearMax = pct >= 80;
  const newDeadline = new Date(closeDate);
  newDeadline.setDate(newDeadline.getDate() + safeDays);
  const quickPicks = [1, 3, 5, 7, 14].filter((d) => d <= maxExtendDays);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className={cn(T.card, "rounded-2xl p-6 w-full max-w-md shadow-xl")} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-5">
          <div className={cn("p-2.5 rounded-xl", T.infoBg)}>
            <CalendarPlus className={cn("h-5 w-5", T.infoText)} />
          </div>
          <div>
            <h3 className={cn("text-lg font-semibold", T.text)}>Extend Deal Time</h3>
            <p className={cn("text-xs", T.muted)}>Max extension: <strong>{maxExtendDays} days</strong> (half of {originalDays}-day deal)</p>
          </div>
        </div>

        {/* Timeline visualization */}
        <div className={cn("p-4 rounded-xl border mb-5", T.border, "bg-muted/50")}>
          <div className="flex items-center justify-between text-xs mb-3">
            <div>
              <div className={T.muted}>Started</div>
              <div className={cn("font-medium", T.text)}>{openDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
            </div>
            <div className="text-center">
              <div className={T.muted}>Current deadline</div>
              <div className={cn("font-medium", T.text)}>{closeDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
            </div>
            <div className="text-end">
              <div className={cn("font-medium", T.infoText)}>New deadline</div>
              <div className={cn("font-semibold", T.infoText)}>{newDeadline.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
            </div>
          </div>
          <div className="relative h-2.5 bg-muted rounded-full overflow-hidden">
            <div className="absolute inset-y-0 start-0 bg-muted-foreground/50 rounded-full" style={{ width: "66.6%" }} />
            <div className="absolute inset-y-0 bg-blue-500 rounded-full transition-all duration-300" style={{ left: "66.6%", width: `${(pct / 100) * 33.4}%` }} />
          </div>
          <div className="flex items-center justify-between text-[10px] mt-1 text-muted-foreground">
            <span>{originalDays} days (original)</span>
            <span>+{safeDays} days extension</span>
          </div>
        </div>

        {quickPicks.length > 0 && (
          <div className="mb-4">
            <label className={cn("text-xs font-medium mb-2 block", T.muted)}>Quick select</label>
            <div className="flex items-center gap-2">
              {quickPicks.map((d) => (
                <button
                  key={d}
                  onClick={() => { setExtendDays(d); setExtendInput(String(d)); }}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors",
                    safeDays === d ? cn(T.accentBg, "text-primary-foreground border-transparent") : cn(T.border, T.muted, "hover:bg-muted/50"),
                  )}
                >
                  {d} {d === 1 ? "day" : "days"}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mb-5">
          <label className={cn("text-xs font-medium mb-2 block", T.muted)}>Or enter custom days</label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={1}
              max={maxExtendDays}
              value={extendInput || safeDays}
              onChange={(e) => {
                const v = e.target.value;
                setExtendInput(v);
                const num = parseInt(v, 10);
                if (!isNaN(num) && num >= 1) {
                  setExtendDays(Math.min(num, maxExtendDays));
                }
              }}
              className={cn(
                "w-20 px-3 py-2 rounded-xl border text-sm text-center font-semibold",
                T.border,
                isNearMax ? "border-amber-300 bg-amber-50" : "",
                "focus:outline-none focus:ring-2 focus:ring-primary/20",
              )}
            />
            <div className="flex-1">
              <input
                type="range"
                min={1}
                max={maxExtendDays}
                value={safeDays}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  setExtendDays(v);
                  setExtendInput(String(v));
                }}
                className="w-full accent-[#c2703e] h-2 rounded-lg cursor-pointer"
              />
              <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-0.5">
                <span>1 day</span>
                <span>{maxExtendDays} days (max)</span>
              </div>
            </div>
          </div>
        </div>

        {isNearMax && (
          <div className={cn("p-3 rounded-xl border mb-4 flex items-start gap-2", T.warningBorder, T.warningBg)}>
            <AlertTriangle className={cn("h-4 w-4 flex-shrink-0 mt-0.5", T.warning)} />
            <p className={cn("text-xs", T.warning)}>
              {safeDays === maxExtendDays
                ? "You are using the maximum allowed extension. No further extensions will be possible."
                : "Approaching the maximum extension limit."}
            </p>
          </div>
        )}

        {extendInput && parseInt(extendInput, 10) > maxExtendDays && (
          <div className={cn("p-3 rounded-xl border mb-4 flex items-start gap-2", T.dangerBorder, T.dangerBg)}>
            <XCircle className={cn("h-4 w-4 flex-shrink-0 mt-0.5", T.danger)} />
            <p className={cn("text-xs", T.danger)}>
              Cannot extend more than {maxExtendDays} days (half of the original {originalDays}-day deal duration).
            </p>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className={cn("px-4 py-2 rounded-xl text-sm", T.muted)}>Cancel</button>
          <button
            disabled={safeDays < 1}
            className={cn("px-4 py-2 rounded-xl text-sm font-medium text-primary-foreground transition-colors disabled:opacity-40", T.accentBg, "hover:opacity-90")}
          >
            <CalendarPlus className="h-4 w-4 inline me-1.5" />
            Extend by {safeDays} {safeDays === 1 ? "day" : "days"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Cancel & Refund Modal ────────────────────────────────────

interface CancelModalProps {
  activeOrders: BuyGroupOrder[];
  revenue: number;
  currency: string;
  onClose: () => void;
}

export function CancelRefundModal({ activeOrders, revenue, currency, onClose }: CancelModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className={cn(T.card, "rounded-2xl p-6 w-full max-w-md shadow-xl")} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <div className={cn("p-2 rounded-xl", T.dangerBg)}><AlertTriangle className={cn("h-5 w-5", T.danger)} /></div>
          <h3 className={cn("text-lg font-semibold", T.text)}>Cancel & Refund All Orders</h3>
        </div>
        <p className={cn("text-sm mb-2", T.muted)}>
          This will cancel <strong>{activeOrders.length} active orders</strong> and initiate refunds totaling{" "}
          <strong>{currency}{revenue.toFixed(2)}</strong>.
        </p>
        <div className={cn("p-3 rounded-xl border mb-4", T.dangerBorder, T.dangerBg)}>
          <p className={cn("text-xs", T.danger)}>This action cannot be undone. All buyers will be notified automatically.</p>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className={cn("px-4 py-2 rounded-xl text-sm", T.muted)}>Keep Deal</button>
          <button className="px-4 py-2 rounded-xl text-sm font-medium text-primary-foreground bg-red-600 hover:bg-red-700">
            <Ban className="h-4 w-4 inline me-1" />
            Cancel & Refund All
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Notify Buyers Modal ──────────────────────────────────────

interface NotifyModalProps {
  activeOrderCount: number;
  onClose: () => void;
}

export function NotifyBuyersModal({ activeOrderCount, onClose }: NotifyModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className={cn(T.card, "rounded-2xl p-6 w-full max-w-md shadow-xl")} onClick={(e) => e.stopPropagation()}>
        <h3 className={cn("text-lg font-semibold mb-4", T.text)}>Notify All Buyers</h3>
        <p className={cn("text-sm mb-3", T.muted)}>
          Send a message to all <strong>{activeOrderCount}</strong> active buyers in this deal.
        </p>
        <textarea
          className={cn("w-full p-3 rounded-xl border text-sm resize-none h-24", T.border)}
          placeholder="Type your message to all buyers..."
        />
        <p className="text-xs text-muted-foreground mt-2 mb-4">
          Buyers will receive this as a notification and email.
        </p>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className={cn("px-4 py-2 rounded-xl text-sm", T.muted)}>Cancel</button>
          <button className="px-4 py-2 rounded-xl text-sm font-medium text-primary-foreground bg-purple-600 hover:bg-purple-700">
            <Send className="h-4 w-4 inline me-1" />
            Send to All
          </button>
        </div>
      </div>
    </div>
  );
}
