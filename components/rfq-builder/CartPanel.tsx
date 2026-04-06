"use client";
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Minus, Plus, Trash2, ShoppingCart, Send, CreditCard, FileText, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useRfqCartListByUserId, useUpdateRfqCartWithLogin, useDeleteRfqCartItem, useAddRfqQuotes } from "@/apis/queries/rfq.queries";
import { useAuth } from "@/context/AuthContext";

interface CartItem {
  id: number;
  name: string;
  quantity: number;
  unitPrice: number;
  seller: string;
  rfqCartId?: number;
}

function ItemCard({ item, onUpdateQty, onDelete, isUpdating }: {
  item: CartItem;
  onUpdateQty: (id: number, qty: number) => void;
  onDelete: (id: number) => void;
  isUpdating: boolean;
}) {
  return (
    <div className="rounded border border-border bg-background p-2">
      <div className="flex items-start justify-between gap-1">
        <div className="min-w-0">
          <span className="text-[10px] font-semibold block truncate">{item.name}</span>
          <span className="text-[8px] text-muted-foreground">{item.seller}</span>
        </div>
        <button type="button" onClick={() => onDelete(item.rfqCartId ?? item.id)}
          disabled={isUpdating}
          className="text-muted-foreground hover:text-destructive shrink-0 disabled:opacity-50">
          <Trash2 className="h-2.5 w-2.5" />
        </button>
      </div>
      <div className="flex items-center justify-between mt-1">
        <div className="flex items-center">
          <button type="button" disabled={isUpdating || item.quantity <= 1}
            onClick={() => onUpdateQty(item.id, item.quantity - 1)}
            className="flex h-5 w-5 items-center justify-center rounded-s border border-border bg-muted text-muted-foreground disabled:opacity-30">
            <Minus className="h-2 w-2" />
          </button>
          <div className="flex h-5 w-8 items-center justify-center border-y border-border bg-background text-[9px] font-semibold">
            {isUpdating ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : item.quantity}
          </div>
          <button type="button" disabled={isUpdating}
            onClick={() => onUpdateQty(item.id, item.quantity + 1)}
            className="flex h-5 w-5 items-center justify-center rounded-e border border-border bg-muted text-muted-foreground disabled:opacity-30">
            <Plus className="h-2 w-2" />
          </button>
        </div>
        <span className="text-[10px] font-bold text-primary">{(item.quantity * item.unitPrice).toLocaleString()} OMR</span>
      </div>
    </div>
  );
}

interface CartPanelProps {
  locale: string;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export default function CartPanel({ locale, collapsed, onToggleCollapse }: CartPanelProps) {
  const isAr = locale === "ar";
  const [tab, setTab] = useState<"rfq" | "buy">("rfq");
  const { user } = useAuth();

  // Real cart data from backend
  const rfqCartQuery = useRfqCartListByUserId({ page: 1, limit: 50 }, !!user?.id);
  const updateCart = useUpdateRfqCartWithLogin();
  const deleteCartItem = useDeleteRfqCartItem();
  const submitRfq = useAddRfqQuotes();

  // Map API response to CartItem format
  const rfq: CartItem[] = (rfqCartQuery.data?.data?.data ?? rfqCartQuery.data?.data ?? []).map((item: any) => ({
    id: item.rfqProductId ?? item.productId ?? item.id,
    rfqCartId: item.id,
    name: item.rfqProduct?.rfqProductName ?? item.product?.productName ?? item.productName ?? `Product #${item.id}`,
    quantity: item.quantity ?? 1,
    unitPrice: Number(item.offerPriceTo ?? item.offerPriceFrom ?? item.offerPrice ?? 0),
    seller: item.rfqProduct?.admin?.firstName ?? item.seller ?? "Vendor",
  }));
  const buy: CartItem[] = []; // Buy cart not yet wired
  const items = tab === "rfq" ? rfq : buy;
  const total = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const units = items.reduce((s, i) => s + i.quantity, 0);

  const handleUpdateQty = (productId: number, qty: number) => {
    updateCart.mutate({ productId, quantity: qty });
  };

  const handleDelete = (rfqCartId: number) => {
    deleteCartItem.mutate({ rfqCartId });
  };

  const handleSubmitRfq = () => {
    if (rfq.length === 0) return;
    const rfqCartIds = rfq.map(r => r.rfqCartId).filter(Boolean) as number[];
    if (rfqCartIds.length === 0) return;
    submitRfq.mutate({
      rfqCartIds,
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      phoneNumber: user?.phoneNumber ?? "",
      cc: user?.cc ?? "",
      address: "",
      city: "",
      province: "",
      country: "",
      postCode: "",
      rfqDate: new Date().toISOString(),
    });
  };

  // ═══ COLLAPSED: icons only ═══
  if (collapsed) {
    return (
      <div className="flex flex-col h-full min-h-0 bg-muted/20 border-s border-border items-center py-2 gap-2">
        {/* Cart icon + expand */}
        <button type="button" onClick={onToggleCollapse}
          className="flex flex-col items-center gap-0.5 text-muted-foreground hover:text-foreground">
          <ShoppingCart className="h-4 w-4" />
          <span className="text-[7px] font-semibold">{isAr ? "السلة" : "Cart"}</span>
          <ChevronLeft className="h-3 w-3" />
        </button>

        <div className="w-8 h-px bg-border" />

        {/* RFQ icon */}
        <button type="button" onClick={() => { onToggleCollapse(); setTab("rfq"); }}
          title={`RFQ (${rfq.length})`}
          className={cn("relative flex flex-col items-center gap-0.5 py-1.5 px-1 rounded-lg transition-colors w-10",
            tab === "rfq" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted")}>
          <FileText className="h-4 w-4" />
          <span className="text-[7px] font-medium">RFQ</span>
          {rfq.length > 0 && (
            <span className="absolute -top-0.5 -end-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary text-primary-foreground text-[8px] font-bold px-0.5">
              {rfq.length}
            </span>
          )}
        </button>

        {/* Buy icon */}
        <button type="button" onClick={() => { onToggleCollapse(); setTab("buy"); }}
          title={`Buy (${buy.length})`}
          className={cn("relative flex flex-col items-center gap-0.5 py-1.5 px-1 rounded-lg transition-colors w-10",
            tab === "buy" ? "bg-green-600/10 text-green-600" : "text-muted-foreground hover:bg-muted")}>
          <CreditCard className="h-4 w-4" />
          <span className="text-[7px] font-medium">{isAr ? "شراء" : "Buy"}</span>
          {buy.length > 0 && (
            <span className="absolute -top-0.5 -end-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-green-600 text-white text-[8px] font-bold px-0.5">
              {buy.length}
            </span>
          )}
        </button>

        {/* Total at bottom */}
        <div className="mt-auto flex flex-col items-center gap-0.5">
          <span className="text-[8px] text-muted-foreground">{isAr ? "المجموع" : "Total"}</span>
          <span className="text-[9px] font-bold text-primary">{total.toLocaleString()}</span>
        </div>
      </div>
    );
  }

  // ═══ EXPANDED: full view ═══
  return (
    <div className="flex flex-col h-full min-h-0 bg-muted/20 border-s border-border">
      {/* Tab header with collapse button */}
      <div className="flex border-b border-border shrink-0">
        <button type="button" onClick={onToggleCollapse}
          className="flex items-center justify-center w-7 text-muted-foreground hover:text-foreground border-e border-border shrink-0">
          <ChevronRight className="h-3 w-3" />
        </button>
        <button type="button" onClick={() => setTab("rfq")}
          className={cn("flex-1 flex items-center justify-center gap-1 py-2 text-[10px] font-semibold border-b-2 transition-colors",
            tab === "rfq" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}>
          <FileText className="h-3 w-3" /> RFQ
          {rfq.length > 0 && <span className={cn("flex h-3.5 min-w-3.5 items-center justify-center rounded-full text-[8px] font-bold px-0.5",
            tab === "rfq" ? "bg-primary text-primary-foreground" : "bg-muted")}>{rfq.length}</span>}
        </button>
        <button type="button" onClick={() => setTab("buy")}
          className={cn("flex-1 flex items-center justify-center gap-1 py-2 text-[10px] font-semibold border-b-2 transition-colors",
            tab === "buy" ? "border-green-600 text-green-600" : "border-transparent text-muted-foreground hover:text-foreground")}>
          <CreditCard className="h-3 w-3" /> {isAr ? "شراء" : "Buy"}
          {buy.length > 0 && <span className={cn("flex h-3.5 min-w-3.5 items-center justify-center rounded-full text-[8px] font-bold px-0.5",
            tab === "buy" ? "bg-green-600 text-white" : "bg-muted")}>{buy.length}</span>}
        </button>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <ShoppingCart className="h-6 w-6 mb-1.5 opacity-15" />
            <p className="text-[9px]">{tab === "rfq" ? (isAr ? "فارغة" : "Empty") : (isAr ? "فارغة" : "Empty")}</p>
          </div>
        ) : (
          <div className="p-1.5 space-y-1">
            {items.map((item) => (
              <ItemCard key={item.rfqCartId ?? item.id} item={item}
                onUpdateQty={handleUpdateQty}
                onDelete={handleDelete}
                isUpdating={updateCart.isPending || deleteCartItem.isPending} />
            ))}
          </div>
        )}
      </div>

      {/* Summary + action */}
      {items.length > 0 && (
        <div className="border-t border-border px-2 py-2 shrink-0 space-y-1.5">
          <div className="flex items-center justify-between text-[9px] text-muted-foreground">
            <span>{items.length} • {units} {isAr ? "قطعة" : "pcs"}</span>
            <span className={cn("text-[11px] font-bold", tab === "rfq" ? "text-primary" : "text-green-600")}>{total.toLocaleString()} OMR</span>
          </div>
          {tab === "rfq" ? (
            <button type="button" onClick={handleSubmitRfq}
              disabled={submitRfq.isPending || rfq.length === 0}
              className="flex w-full items-center justify-center gap-1.5 rounded-md bg-primary py-2 text-primary-foreground text-[10px] font-bold hover:bg-primary/90 disabled:opacity-50">
              {submitRfq.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
              {submitRfq.isPending ? (isAr ? "جاري الإرسال..." : "Submitting...") : (isAr ? "إرسال" : "Submit RFQ")}
            </button>
          ) : (
            <button type="button" className="flex w-full items-center justify-center gap-1.5 rounded-md bg-green-600 py-2 text-white text-[10px] font-bold hover:bg-green-700">
              <CreditCard className="h-3 w-3" /> {isAr ? "الدفع" : "Checkout"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
