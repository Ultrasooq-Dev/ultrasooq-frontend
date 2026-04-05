"use client";
import React, { useState, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useMessageStore, type RfqProduct } from "@/lib/messageStore";
import { useSocket } from "@/context/SocketContext";
import { track } from "@/lib/analytics";
import {
  ShoppingBag, ShoppingCart, Send, Star, Package, ChevronDown, FileText,
  Pencil, Trash2, Info, ChevronLeft, Eye, Pin, Archive, Plus,
} from "lucide-react";
import ProductSearch from "./ProductSearch";

// No mock data — real products come from useMessageStore via useMessageData hook

type Role = "vendor" | "customer";

// Type for RFQ product items
interface RfqProductItem {
  id: string;
  requestedName: string;
  requestedQty: number;
  requestedBudget: string;
  alternatives: { id: string; name: string; seller: string; price: number; stock: number; rating: number }[];
}

// ─── Product Card — role-aware ───────────────
function RfqProductCard({ item, role, locale, onViewSpecs, onPriceChange, onStockChange, onAddFromStore }: {
  item: RfqProductItem; role: Role; locale: string;
  onViewSpecs?: (altId: string) => void;
  onPriceChange?: (altId: string, price: number) => void;
  onStockChange?: (altId: string, stock: number) => void;
  onAddFromStore?: () => void;
}) {
  const isAr = locale === "ar";
  const isVendor = role === "vendor";
  const [expanded, setExpanded] = useState(true);
  const [selections, setSelections] = useState<Record<string, { checked: boolean; qty: number; price: number }>>(
    () => Object.fromEntries(item.alternatives.map((a, i) => [a.id, { checked: i === 0, qty: item.requestedQty, price: a.price }]))
  );

  const toggleAlt = (id: string) => setSelections((p) => ({ ...p, [id]: { ...p[id], checked: !p[id].checked } }));
  const setAltQty = (id: string, qty: number) => setSelections((p) => ({ ...p, [id]: { ...p[id], qty: Math.max(1, qty) } }));
  const setAltPrice = (id: string, price: number) => setSelections((p) => ({ ...p, [id]: { ...p[id], price: Math.max(0, price) } }));

  const checkedAlts = item.alternatives.filter((a) => selections[a.id]?.checked);
  const totalForItem = checkedAlts.reduce((s, a) => s + (selections[a.id]?.price ?? a.price) * (selections[a.id]?.qty ?? 0), 0);
  const selectedCount = checkedAlts.length;

  return (
    <div className="border-b border-border">
      {/* L1: Product header — with hover actions */}
      <div className="group flex items-center gap-3 w-full px-4 py-3 text-start hover:bg-muted/30">
        <button type="button" onClick={() => setExpanded(!expanded)} className="shrink-0">
          <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform", expanded && "rotate-180")} />
        </button>
        <Package className="h-5 w-5 text-orange-500 shrink-0" />
        <button type="button" onClick={() => onViewSpecs?.(item.alternatives[0]?.id ?? "")} className="flex-1 min-w-0 text-start hover:text-primary transition-colors">
          <span className="text-base font-bold block truncate">{item.requestedName}</span>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{isAr ? "طلب" : "Req"}: {item.requestedQty}</span>
            <span>·</span>
            <span>{item.requestedBudget}</span>
            {selectedCount > 0 && (
              <>
                <span>·</span>
                <span className="text-green-600 font-medium">{selectedCount} {isAr ? "مختار" : "selected"}</span>
              </>
            )}
          </div>
        </button>
        {/* Hover actions */}
        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button type="button" title={isAr ? "تثبيت" : "Pin"} className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-amber-600">
            <Pin className="h-3.5 w-3.5" />
          </button>
          <button type="button" title={isAr ? "أرشفة" : "Archive"} className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-blue-600">
            <Archive className="h-3.5 w-3.5" />
          </button>
          <button type="button" title={isAr ? "حذف" : "Delete"} className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-destructive">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
        {/* Price — hidden when actions show */}
        <span className="text-base font-bold text-green-600 shrink-0 group-hover:hidden">{totalForItem.toLocaleString()}</span>
      </div>

      {/* L2: Alternatives */}
      {expanded && item.alternatives.map((a) => {
        const sel = selections[a.id];
        const isChecked = sel?.checked ?? false;

        return (
          <div key={a.id} className={cn(
            "group/alt border-t border-border/30",
            isChecked ? "bg-green-50/30 dark:bg-green-950/5" : ""
          )}>
            {/* Row 1: checkbox + name + hover actions */}
            <div className="flex items-center gap-3 px-4 py-2.5 ps-12">
              <input type="checkbox" checked={isChecked} onChange={() => toggleAlt(a.id)}
                className="rounded border-border text-green-600 h-4 w-4 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className={cn("text-sm truncate block", isChecked ? "font-bold" : "font-medium")}>{a.name}</span>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {a.rating}
                  {!isVendor && <span className="ms-1">· {a.stock} {isAr ? "متوفر" : "in stock"}</span>}
                </div>
              </div>
              {/* Always-visible actions */}
              <div className="flex items-center gap-2 shrink-0">
                {isVendor && <Pencil className="h-4 w-4 text-muted-foreground hover:text-primary cursor-pointer" onClick={() => onViewSpecs?.(a.id)} />}
                {!isVendor && <Eye className="h-4 w-4 text-muted-foreground hover:text-primary cursor-pointer" onClick={() => onViewSpecs?.(a.id)} />}
              </div>
              {/* Hover actions */}
              <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover/alt:opacity-100 transition-opacity">
                <button type="button" title={isAr ? "تثبيت" : "Pin"} className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-amber-600">
                  <Pin className="h-3 w-3" />
                </button>
                <button type="button" title={isAr ? "أرشفة" : "Archive"} className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-blue-600">
                  <Archive className="h-3 w-3" />
                </button>
                {isVendor && (
                  <button type="button" title={isAr ? "حذف" : "Delete"} className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Vendor: editable price + stock */}
            {isVendor && (
              <div className="flex items-center gap-3 px-4 pb-2.5 ps-12">
                <input type="number" value={sel?.price ?? a.price}
                  onChange={(e) => {
                    const newPrice = parseInt(e.target.value) || 0;
                    setAltPrice(a.id, newPrice);
                    onPriceChange?.(a.id, newPrice);
                  }}
                  className="w-20 h-8 text-sm font-bold text-green-600 text-end border border-border rounded-md px-2 bg-background outline-none focus:ring-1 focus:ring-green-500" />
                <input type="number" defaultValue={a.stock}
                  onChange={(e) => {
                    const newStock = parseInt(e.target.value) || 0;
                    onStockChange?.(a.id, newStock);
                  }}
                  className="w-14 h-8 text-sm text-end border border-border rounded-md px-2 bg-background outline-none focus:ring-1 focus:ring-primary" />
              </div>
            )}

            {/* Customer: read-only price + qty selector */}
            {!isVendor && (
              <div className="flex items-center gap-3 px-4 pb-2.5 ps-12">
                <span className="text-sm font-bold text-green-600">{(sel?.price ?? a.price).toLocaleString()} OMR</span>
                {isChecked && (
                  <div className="flex items-center ms-auto">
                    <button type="button" onClick={() => setAltQty(a.id, (sel?.qty ?? 1) - 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-s-md border border-border bg-background text-sm font-medium hover:bg-muted">-</button>
                    <input type="number" value={sel?.qty ?? 1}
                      onChange={(e) => setAltQty(a.id, parseInt(e.target.value) || 1)}
                      className="h-8 w-14 border-y border-border bg-background text-center text-sm font-semibold outline-none" />
                    <button type="button" onClick={() => setAltQty(a.id, (sel?.qty ?? 1) + 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-e-md border border-border bg-background text-sm font-medium hover:bg-muted">+</button>
                    <span className="text-sm font-bold text-green-600 ms-3">
                      {((sel?.price ?? a.price) * (sel?.qty ?? 1)).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Vendor: add from store */}
      {expanded && isVendor && (
        <button type="button" onClick={() => onAddFromStore?.()}
          className="flex items-center gap-1 ps-12 pe-4 py-2 text-sm text-primary hover:bg-muted/20 w-full border-t border-border/20">
          + {isAr ? "أضف من متجرك" : "Add from Store"}
        </button>
      )}
    </div>
  );
}

interface MsgPanel6Props {
  personId: string | null;
  role: Role;
  locale: string;
}

export default function MsgPanel6({ personId, role, locale }: MsgPanel6Props) {
  const isAr = locale === "ar";
  const isVendor = role === "vendor";
  const [tab, setTab] = useState<"list" | "specs">("list");
  const [viewingAltId, setViewingAltId] = useState<string | null>(null);
  const [showProductSearch, setShowProductSearch] = useState(false);

  // ─── Read RFQ products from Zustand store, fallback to mock ───
  const { socket } = useSocket();
  const {
    rfqProducts: storeRfqProducts,
    chatRoomId,
    updateAlternativePrice,
    updateAlternativeStock,
  } = useMessageStore();

  const storeProducts = chatRoomId ? storeRfqProducts[chatRoomId] : undefined;

  // Real data only — no mock fallback
  const productData = useMemo(() => {
    if (storeProducts && storeProducts.length > 0) {
      const totalPrice = storeProducts.reduce((sum, p) =>
        sum + p.alternatives.reduce((s, a) => s + a.price * p.requestedQty, 0), 0);
      return { totalPrice, items: storeProducts };
    }
    return { totalPrice: 0, items: [] };
  }, [storeProducts]);

  // Store callbacks for price/stock changes
  const handlePriceChange = useCallback((productId: string, altId: string, price: number) => {
    if (chatRoomId) {
      updateAlternativePrice(chatRoomId, productId, altId, price);
    }
  }, [chatRoomId, updateAlternativePrice]);

  const handleStockChange = useCallback((productId: string, altId: string, stock: number) => {
    if (chatRoomId) {
      updateAlternativeStock(chatRoomId, productId, altId, stock);
    }
  }, [chatRoomId, updateAlternativeStock]);

  // Vendor: emit socket event on "Update Quote"
  const handleUpdateQuote = useCallback(() => {
    if (socket && chatRoomId) {
      socket.emit("updateRfqQuote", {
        roomId: chatRoomId,
        products: productData.items,
        totalPrice: productData.totalPrice,
      });
      track("messaging_rfq_quote_updated", {
        roomId: chatRoomId,
        productCount: productData.items.length,
        totalPrice: productData.totalPrice,
      });
    }
  }, [socket, chatRoomId, productData]);

  // Customer: track "Add to Cart"
  const handleAddToCart = useCallback(() => {
    track("messaging_rfq_added_to_cart", {
      roomId: chatRoomId,
      productCount: productData.items.length,
      totalPrice: productData.totalPrice,
    });
  }, [chatRoomId, productData]);

  if (!personId) return null;

  // Handle product added from search
  const handleAddFromStore = useCallback((product: any) => {
    // TODO: Add to RFQ products in store when wired to real API
    track("messaging_product_added_from_store", {
      productId: product.id,
      productName: product.name,
      price: product.price,
      roomId: chatRoomId,
    });
  }, [chatRoomId]);

  // Show ProductSearch overlay
  if (showProductSearch) {
    return (
      <div className="flex flex-col h-full min-h-0 min-w-0 bg-background border-s border-border">
        <ProductSearch
          onClose={() => setShowProductSearch(false)}
          onAddProduct={handleAddFromStore}
          locale={locale}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0 min-w-0 bg-background border-s border-border">
      {/* Tabs */}
      <div className="flex border-b border-border shrink-0">
        <button type="button" onClick={() => setTab("list")}
          className={cn("flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold border-b-2 transition-colors",
            tab === "list" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}>
          <ShoppingBag className="h-4 w-4" /> {isAr ? "المنتجات" : "Products"}
        </button>
        <button type="button" onClick={() => { if (viewingAltId) setTab("specs"); }}
          className={cn("flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold border-b-2 transition-colors",
            tab === "specs" ? "border-green-600 text-green-600"
              : viewingAltId ? "border-transparent text-muted-foreground hover:text-foreground"
              : "border-transparent text-muted-foreground/30 cursor-not-allowed")}>
          <FileText className="h-4 w-4" /> {isAr ? "المواصفات" : "Specs & Note"}
        </button>
      </div>

      {/* ═══ PRODUCT LIST TAB ═══ */}
      {tab === "list" && (
        <>
          {/* Sticky top: total + action button */}
          <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border bg-background shrink-0">
            <span className="text-sm text-muted-foreground">{productData.items.length} {isAr ? "منتج" : "products"}</span>
            <span className="text-base font-bold text-green-600">{productData.totalPrice.toLocaleString()} OMR</span>
            {isVendor ? (
              <button type="button" onClick={handleUpdateQuote} className="ms-auto flex items-center gap-1.5 rounded-md bg-green-600 text-white hover:bg-green-700 px-4 py-2 text-sm font-semibold">
                <Send className="h-4 w-4" /> {isAr ? "تحديث العرض" : "Update Quote"}
              </button>
            ) : (
              <button type="button" onClick={handleAddToCart} className="ms-auto flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 text-sm font-semibold">
                <ShoppingCart className="h-4 w-4" /> {isAr ? "أضف للسلة" : "Add to Cart"}
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto min-h-0">
            {/* Vendor: Add from Store — always visible */}
            {isVendor && (
              <button type="button" onClick={() => setShowProductSearch(true)}
                className="flex w-full items-center justify-center gap-2 px-4 py-3 border-b border-dashed border-primary/30 text-primary hover:bg-primary/5 transition-colors">
                <Plus className="h-4 w-4" />
                <span className="text-sm font-semibold">{isAr ? "أضف منتج من متجرك" : "Add Product from Store"}</span>
              </button>
            )}

            {/* Empty state */}
            {productData.items.length === 0 && !isVendor && (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Package className="h-10 w-10 mb-3 opacity-15" />
                <p className="text-sm">{isAr ? "لا توجد منتجات بعد" : "No products yet"}</p>
                <p className="text-xs opacity-60 mt-1">{isAr ? "البائع لم يضف منتجات" : "Vendor hasn't added products"}</p>
              </div>
            )}

            {productData.items.map((item) => (
              <RfqProductCard
                key={item.id}
                item={item}
                role={role}
                locale={locale}
                onViewSpecs={(altId) => { setViewingAltId(altId); setTab("specs"); }}
                onPriceChange={(altId, price) => handlePriceChange(item.id, altId, price)}
                onStockChange={(altId, stock) => handleStockChange(item.id, altId, stock)}
                onAddFromStore={() => setShowProductSearch(true)}
              />
            ))}

            {/* Customer requirements */}
          <div className="px-4 py-3 border-t border-border bg-blue-50/20 dark:bg-blue-950/5">
            <div className="flex items-center gap-2 mb-1.5">
              <Info className="h-4 w-4 text-blue-600 shrink-0" />
              <span className="text-sm font-bold text-blue-700 dark:text-blue-400">{isAr ? "متطلبات" : "Requirements"}</span>
              <div className="flex gap-1.5 ms-auto">
                {["Quality", "Warranty", "Express"].map((r, idx) => (
                  <span key={idx} className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 px-2 py-0.5 rounded">{r}</span>
                ))}
                <span className="text-xs bg-blue-100/50 rounded px-2 py-0.5">📎2</span>
              </div>
            </div>
            <p className="text-sm text-blue-800/70 dark:text-blue-300/70">Corporate use. Black/silver. Bulk packaging. Carrying case.</p>
          </div>
          </div>
        </>
      )}

      {/* ═══ SPECS & NOTE TAB ═══ */}
      {tab === "specs" && (
        <div className="flex-1 overflow-y-auto min-h-0">
          {!viewingAltId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
              <Package className="h-12 w-12 mb-3 opacity-15" />
              <p className="text-sm font-medium">{isAr ? "اختر منتج" : "Select a product"}</p>
            </div>
          ) : (
            <>
              {/* Back */}
              <button type="button" onClick={() => setTab("list")}
                className="flex items-center gap-1.5 px-4 py-2 text-sm text-muted-foreground hover:text-foreground border-b border-border">
                <ChevronLeft className="h-4 w-4" /> {isAr ? "رجوع للقائمة" : "Back to list"}
              </button>

              <div className="px-4 py-4 space-y-4">
                {/* Product header */}
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <Package className="h-6 w-6 text-muted-foreground/20" />
                  </div>
                  <div className="flex-1 min-w-0">
                    {isVendor ? (
                      <input type="text" defaultValue="iPad Pro 12.9 (256GB)"
                        className="text-base font-bold w-full bg-transparent border-b border-transparent hover:border-border focus:border-primary outline-none py-1" />
                    ) : (
                      <span className="text-base font-bold block">iPad Pro 12.9 (256GB)</span>
                    )}
                    <span className="text-sm text-muted-foreground">Tech Store Oman · ⭐4.8</span>
                  </div>
                  <div className="shrink-0">
                    <span className="text-lg font-bold text-green-600">420</span>
                    <span className="text-sm text-green-600 ms-1">OMR</span>
                  </div>
                </div>

                {/* Specifications */}
                <div>
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">{isAr ? "المواصفات" : "Specifications"}</span>
                  <div className="rounded-lg border border-border overflow-hidden">
                    {[["Display", "12.9\" Liquid Retina XDR"], ["Chip", "M2"], ["Storage", "256GB"], ["RAM", "8GB"], ["Camera", "12MP Wide + 10MP Ultra Wide"], ["Battery", "10hrs"], ["Weight", "682g"], ["Connectivity", "Wi-Fi 6E + 5G"]].map(([k, v], i) => (
                      <div key={i} className={cn("flex items-center px-4 py-2 text-sm", i % 2 === 0 ? "bg-muted/30" : "bg-background")}>
                        <span className="text-muted-foreground w-28 shrink-0 font-medium">{k}</span>
                        {isVendor ? (
                          <input type="text" defaultValue={v}
                            className="flex-1 bg-transparent border-b border-transparent hover:border-border focus:border-primary outline-none py-0.5 min-w-0" />
                        ) : (
                          <span className="flex-1 min-w-0">{v}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">{isAr ? "الوصف" : "Description"}</span>
                  {isVendor ? (
                    <textarea rows={3}
                      defaultValue="iPad Pro 12.9-inch with M2 chip. Blazing-fast performance with all-day battery life. Liquid Retina XDR display with ProMotion technology."
                      className="w-full rounded-lg border bg-background px-4 py-3 text-sm leading-relaxed outline-none focus:ring-1 focus:ring-primary resize-none" />
                  ) : (
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      iPad Pro 12.9-inch with M2 chip. Blazing-fast performance with all-day battery life. Liquid Retina XDR display with ProMotion technology.
                    </p>
                  )}
                </div>

                {/* Vendor note — vendor can edit, customer can read */}
                <div>
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">{isAr ? "ملاحظات البائع" : "Vendor Note"}</span>
                  {isVendor ? (
                    <textarea rows={2} placeholder={isAr ? "أضف ملاحظة لهذا المنتج..." : "Add a note for this product..."}
                      className="w-full rounded-lg border bg-muted/30 px-4 py-3 text-sm placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary resize-none" />
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      {isAr ? "لا توجد ملاحظات" : "No notes from vendor yet."}
                    </p>
                  )}
                </div>

                {/* Info cards */}
                <div className="flex gap-3">
                  <div className="flex-1 rounded-lg border border-border p-3">
                    <span className="text-xs text-muted-foreground block mb-1">{isAr ? "التوصيل" : "Delivery"}</span>
                    {isVendor ? (
                      <input type="text" defaultValue="3-5 days"
                        className="text-sm font-semibold w-full bg-transparent border-b border-transparent hover:border-border focus:border-primary outline-none" />
                    ) : (
                      <span className="text-sm font-semibold">3-5 days</span>
                    )}
                  </div>
                  <div className="flex-1 rounded-lg border border-border p-3">
                    <span className="text-xs text-muted-foreground block mb-1">{isAr ? "الكفالة" : "Warranty"}</span>
                    {isVendor ? (
                      <input type="text" defaultValue="2 years"
                        className="text-sm font-semibold w-full bg-transparent border-b border-transparent hover:border-border focus:border-primary outline-none" />
                    ) : (
                      <span className="text-sm font-semibold">2 years</span>
                    )}
                  </div>
                  <div className="flex-1 rounded-lg border border-border p-3">
                    <span className="text-xs text-muted-foreground block mb-1">{isAr ? "المخزون" : "Stock"}</span>
                    {isVendor ? (
                      <input type="number" defaultValue={45}
                        className="text-sm font-semibold text-green-600 w-full bg-transparent border-b border-transparent hover:border-border focus:border-green-500 outline-none" />
                    ) : (
                      <span className="text-sm font-semibold text-green-600">45 {isAr ? "متوفر" : "available"}</span>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3">
                  {isVendor ? (
                    <>
                      <button type="button" className="flex-1 flex items-center justify-center gap-2 rounded-md bg-green-600 text-white hover:bg-green-700 py-2.5 text-sm font-semibold">
                        <Send className="h-4 w-4" /> {isAr ? "تحديث" : "Update"}
                      </button>
                      <button type="button" onClick={() => setTab("list")}
                        className="flex items-center justify-center gap-1 rounded-md border border-border text-muted-foreground hover:bg-muted px-6 py-2.5 text-sm">
                        {isAr ? "إعادة تعيين" : "Reset"}
                      </button>
                    </>
                  ) : (
                    <button type="button" onClick={() => setTab("list")}
                      className="flex-1 flex items-center justify-center gap-2 rounded-md border border-border text-muted-foreground hover:bg-muted py-2.5 text-sm">
                      <ChevronLeft className="h-4 w-4" /> {isAr ? "رجوع للقائمة" : "Back to Products"}
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
