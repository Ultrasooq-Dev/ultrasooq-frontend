"use client";
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Minus, Plus, Trash2, ShoppingCart, Send, CreditCard, FileText, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useRfqCartListByUserId, useUpdateRfqCartWithLogin, useDeleteRfqCartItem, useAddRfqQuotes } from "@/apis/queries/rfq.queries";
import { useCartListByUserId, useUpdateCartWithLogin, useDeleteCartItem } from "@/apis/queries/cart.queries";
import { useAuth } from "@/context/AuthContext";

interface CartItem {
  id: number;
  cartId?: number;
  rfqCartId?: number;
  productId?: number;
  name: string;
  quantity: number;
  unitPrice: number;
  seller: string;
  image?: string;
}

function ItemCard({ item, onUpdateQty, onDelete, onViewProduct, isUpdating, isAr }: {
  item: CartItem;
  onUpdateQty: (item: CartItem, qty: number) => void;
  onDelete: (item: CartItem) => void;
  onViewProduct?: (productId: number) => void;
  isUpdating: boolean;
  isAr?: boolean;
}) {
  const unitTotal = item.quantity * item.unitPrice;
  return (
    <div className="rounded-lg border border-border bg-background overflow-hidden">
      {/* Top: image + info + delete */}
      <div className="flex gap-2 p-2">
        {/* Product image */}
        <button type="button"
          onClick={() => item.productId && onViewProduct?.(item.productId)}
          className="h-14 w-14 rounded-md bg-muted flex items-center justify-center shrink-0 overflow-hidden hover:ring-2 hover:ring-primary/30 transition-all">
          {item.image ? (
            <img src={item.image} alt="" className="h-full w-full object-cover" />
          ) : (
            <ShoppingCart className="h-5 w-5 text-muted-foreground/20" />
          )}
        </button>
        <div className="flex-1 min-w-0">
          {/* Product name — clickable, shows full name in 2 lines */}
          <button type="button"
            onClick={() => item.productId && onViewProduct?.(item.productId)}
            className="text-[10px] font-semibold line-clamp-2 text-start hover:text-primary transition-colors w-full leading-tight">
            {item.name}
          </button>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-[8px] text-muted-foreground">{item.seller}</span>
            <span className="text-[8px] text-muted-foreground">•</span>
            <span className="text-[8px] text-muted-foreground">{item.unitPrice} OMR/{isAr ? "قطعة" : "ea"}</span>
          </div>
        </div>
        <button type="button" onClick={() => onDelete(item)}
          disabled={isUpdating}
          className="text-muted-foreground hover:text-destructive shrink-0 disabled:opacity-50 self-start mt-0.5">
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
      {/* Bottom: qty stepper + total price */}
      <div className="flex items-center justify-between px-2 py-1.5 bg-muted/30 border-t border-border/50">
        <div className="flex items-center rounded-md border border-border overflow-hidden">
          <button type="button" disabled={isUpdating || item.quantity <= 1}
            onClick={() => onUpdateQty(item, item.quantity - 1)}
            className="flex h-7 w-7 items-center justify-center bg-background text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors">
            <Minus className="h-3 w-3" />
          </button>
          <div className="flex h-7 w-9 items-center justify-center border-x border-border bg-background text-xs font-bold">
            {isUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : item.quantity}
          </div>
          <button type="button" disabled={isUpdating}
            onClick={() => onUpdateQty(item, item.quantity + 1)}
            className="flex h-7 w-7 items-center justify-center bg-background text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors">
            <Plus className="h-3 w-3" />
          </button>
        </div>
        <span className="text-xs font-bold text-primary">{unitTotal > 0 ? unitTotal.toLocaleString() : "0"} OMR</span>
      </div>
    </div>
  );
}

interface CartPanelProps {
  locale: string;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onViewProduct?: (productId: number) => void;
}

export default function CartPanel({ locale, collapsed, onToggleCollapse, onViewProduct }: CartPanelProps) {
  const isAr = locale === "ar";
  const [tab, setTab] = useState<"rfq" | "buy">("rfq");
  const { user } = useAuth();

  // Real cart data from backend
  const rfqCartQuery = useRfqCartListByUserId({ page: 1, limit: 50 }, !!user?.id);
  const updateRfqCart = useUpdateRfqCartWithLogin();
  const deleteRfqItem = useDeleteRfqCartItem();
  const submitRfq = useAddRfqQuotes();

  // Regular cart data
  const buyCartQuery = useCartListByUserId({ page: 1, limit: 50 }, !!user?.id);
  const updateBuyCart = useUpdateCartWithLogin();
  const deleteBuyItem = useDeleteCartItem();

  // Map RFQ cart
  const rfq: CartItem[] = (rfqCartQuery.data?.data?.data ?? rfqCartQuery.data?.data ?? []).map((item: any) => ({
    id: item.rfqProductId ?? item.productId ?? item.id,
    productId: item.rfqProductId ?? item.productId,
    rfqCartId: item.id,
    name: item.rfqProduct?.rfqProductName ?? item.product?.productName ?? item.productName ?? `Product #${item.id}`,
    quantity: item.quantity ?? 1,
    unitPrice: Number(item.offerPriceTo ?? item.offerPriceFrom ?? item.offerPrice ?? 0),
    seller: item.rfqProduct?.admin?.firstName ?? item.seller ?? "Vendor",
  }));

  // Map Buy cart — data from cart.service.ts list(): productPriceDetails → productPrice_product
  const buyCartItems: any[] = buyCartQuery.data?.data ?? [];
  const buy: CartItem[] = buyCartItems
    .filter((item: any) => item.cartType === "DEFAULT" || !item.cartType)
    .map((item: any) => {
      const ppd = item.productPriceDetails || {};
      const product = ppd.productPrice_product || {};
      const firstImage = product.productImages?.[0]?.image || ppd.productPrice_productSellerImage?.[0]?.image || null;
      return {
        id: item.productPriceId ?? item.productId ?? item.id,
        cartId: item.id,
        productId: item.productId ?? product.id,
        name: product.productName ?? `Product #${item.productId ?? item.id}`,
        quantity: item.quantity ?? 1,
        unitPrice: Number(ppd.offerPrice ?? ppd.productPrice ?? 0),
        seller: ppd.adminDetail?.firstName
          ? `${ppd.adminDetail.firstName} ${ppd.adminDetail.lastName || ""}`.trim()
          : "Seller",
        image: firstImage,
      };
    });
  const items = tab === "rfq" ? rfq : buy;
  const total = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const units = items.reduce((s, i) => s + i.quantity, 0);

  const handleUpdateQty = (item: CartItem, qty: number) => {
    if (tab === "rfq") {
      updateRfqCart.mutate({ productId: item.id, quantity: qty });
    } else {
      // Buy cart needs productPriceId — use cartId to identify
      if (item.cartId) updateBuyCart.mutate({ productPriceId: item.id, quantity: qty });
    }
  };

  const handleDelete = (item: CartItem) => {
    if (tab === "rfq" && item.rfqCartId) {
      deleteRfqItem.mutate({ rfqCartId: item.rfqCartId });
    } else if (tab === "buy" && item.cartId) {
      deleteBuyItem.mutate({ cartId: item.cartId });
    }
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
              <ItemCard key={item.rfqCartId ?? item.cartId ?? item.id} item={item}
                onUpdateQty={handleUpdateQty}
                onDelete={handleDelete}
                onViewProduct={onViewProduct}
                isUpdating={updateRfqCart.isPending || deleteRfqItem.isPending || updateBuyCart.isPending || deleteBuyItem.isPending}
                isAr={isAr} />
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
            <button type="button" onClick={() => window.location.href = "/checkout"}
              className="flex w-full items-center justify-center gap-1.5 rounded-md bg-green-600 py-2 text-white text-[10px] font-bold hover:bg-green-700">
              <CreditCard className="h-3 w-3" /> {isAr ? "الدفع" : "Checkout"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
