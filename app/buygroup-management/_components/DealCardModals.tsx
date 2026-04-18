"use client";
import { useState } from "react";
import {
  CalendarPlus, AlertTriangle, XCircle, Ban, Send,
} from "lucide-react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations();
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
            <h3 className={cn("text-lg font-semibold", T.text)}>{t("extend_deal_time")}</h3>
            <p className={cn("text-xs", T.muted)}>{t("max_extension")}: <strong>{maxExtendDays} {t("days").toLowerCase()}</strong> ({t("half_of_day_deal", { n: originalDays })})</p>
          </div>
        </div>

        {/* Timeline visualization */}
        <div className={cn("p-4 rounded-xl border mb-5", T.border, "bg-muted/50")}>
          <div className="flex items-center justify-between text-xs mb-3">
            <div>
              <div className={T.muted}>{t("started")}</div>
              <div className={cn("font-medium", T.text)}>{openDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
            </div>
            <div className="text-center">
              <div className={T.muted}>{t("current_deadline")}</div>
              <div className={cn("font-medium", T.text)}>{closeDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
            </div>
            <div className="text-end">
              <div className={cn("font-medium", T.infoText)}>{t("new_deadline")}</div>
              <div className={cn("font-semibold", T.infoText)}>{newDeadline.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
            </div>
          </div>
          <div className="relative h-2.5 bg-muted rounded-full overflow-hidden">
            <div className="absolute inset-y-0 start-0 bg-muted-foreground/50 rounded-full" style={{ width: "66.6%" }} />
            <div className="absolute inset-y-0 bg-blue-500 rounded-full transition-all duration-300" style={{ left: "66.6%", width: `${(pct / 100) * 33.4}%` }} />
          </div>
          <div className="flex items-center justify-between text-[10px] mt-1 text-muted-foreground">
            <span>{originalDays} {t("days").toLowerCase()} ({t("original").toLowerCase()})</span>
            <span>+{safeDays} {t("days").toLowerCase()} {t("extension")}</span>
          </div>
        </div>

        {quickPicks.length > 0 && (
          <div className="mb-4">
            <label className={cn("text-xs font-medium mb-2 block", T.muted)}>{t("quick_select")}</label>
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
                  {d} {d === 1 ? t("day") : t("days").toLowerCase()}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mb-5">
          <label className={cn("text-xs font-medium mb-2 block", T.muted)}>{t("or_enter_custom_days")}</label>
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
                <span>1 {t("day")}</span>
                <span>{maxExtendDays} {t("days").toLowerCase()} ({t("max").toLowerCase()})</span>
              </div>
            </div>
          </div>
        </div>

        {isNearMax && (
          <div className={cn("p-3 rounded-xl border mb-4 flex items-start gap-2", T.warningBorder, T.warningBg)}>
            <AlertTriangle className={cn("h-4 w-4 flex-shrink-0 mt-0.5", T.warning)} />
            <p className={cn("text-xs", T.warning)}>
              {safeDays === maxExtendDays
                ? t("using_max_extension_warning")
                : t("approaching_max_extension_limit")}
            </p>
          </div>
        )}

        {extendInput && parseInt(extendInput, 10) > maxExtendDays && (
          <div className={cn("p-3 rounded-xl border mb-4 flex items-start gap-2", T.dangerBorder, T.dangerBg)}>
            <XCircle className={cn("h-4 w-4 flex-shrink-0 mt-0.5", T.danger)} />
            <p className={cn("text-xs", T.danger)}>
              {t("cannot_extend_more_than_days", { max: maxExtendDays, orig: originalDays })}
            </p>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className={cn("px-4 py-2 rounded-xl text-sm", T.muted)}>{t("cancel")}</button>
          <button
            disabled={safeDays < 1}
            className={cn("px-4 py-2 rounded-xl text-sm font-medium text-primary-foreground transition-colors disabled:opacity-40", T.accentBg, "hover:opacity-90")}
          >
            <CalendarPlus className="h-4 w-4 inline me-1.5" />
            {t("extend_by")} {safeDays} {safeDays === 1 ? t("day") : t("days").toLowerCase()}
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
  const t = useTranslations();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className={cn(T.card, "rounded-2xl p-6 w-full max-w-md shadow-xl")} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <div className={cn("p-2 rounded-xl", T.dangerBg)}><AlertTriangle className={cn("h-5 w-5", T.danger)} /></div>
          <h3 className={cn("text-lg font-semibold", T.text)}>{t("cancel_refund_all_orders")}</h3>
        </div>
        <p className={cn("text-sm mb-2", T.muted)}>
          {t("cancel_refund_confirmation", { count: activeOrders.length, total: `${currency}${revenue.toFixed(2)}` })}
        </p>
        <div className={cn("p-3 rounded-xl border mb-4", T.dangerBorder, T.dangerBg)}>
          <p className={cn("text-xs", T.danger)}>{t("action_cannot_be_undone_buyers_notified")}</p>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className={cn("px-4 py-2 rounded-xl text-sm", T.muted)}>{t("keep_deal")}</button>
          <button className="px-4 py-2 rounded-xl text-sm font-medium text-primary-foreground bg-red-600 hover:bg-red-700">
            <Ban className="h-4 w-4 inline me-1" />
            {t("cancel_refund_all")}
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
  const t = useTranslations();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className={cn(T.card, "rounded-2xl p-6 w-full max-w-md shadow-xl")} onClick={(e) => e.stopPropagation()}>
        <h3 className={cn("text-lg font-semibold mb-4", T.text)}>{t("notify_all_buyers")}</h3>
        <p className={cn("text-sm mb-3", T.muted)}>
          {t("send_message_to_active_buyers", { count: activeOrderCount })}
        </p>
        <textarea
          className={cn("w-full p-3 rounded-xl border text-sm resize-none h-24", T.border)}
          placeholder={t("type_your_message_to_all_buyers")}
        />
        <p className="text-xs text-muted-foreground mt-2 mb-4">
          {t("buyers_will_receive_notification_email")}
        </p>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className={cn("px-4 py-2 rounded-xl text-sm", T.muted)}>{t("cancel")}</button>
          <button className="px-4 py-2 rounded-xl text-sm font-medium text-primary-foreground bg-purple-600 hover:bg-purple-700">
            <Send className="h-4 w-4 inline me-1" />
            {t("send_to_all")}
          </button>
        </div>
      </div>
    </div>
  );
}
