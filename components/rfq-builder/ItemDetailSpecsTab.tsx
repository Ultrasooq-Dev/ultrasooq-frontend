"use client";
/**
 * ItemDetailSpecsTab — "Specs & Requirements" tab content for ItemDetailPanel.
 * Renders action buttons, product spec grid, price range inputs, and the rich-text editor panel.
 */
import React, { useState, useRef } from "react";
import {
  ShoppingCart, Wrench, Eye, ChevronDown, ChevronUp,
} from "lucide-react";
import type { MappedProduct } from "./itemDetailTypes";
import { ItemDetailEditorPanel } from "./ItemDetailEditorPanel";
import { useAddCustomizeProduct } from "@/apis/queries/rfq.queries";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";

interface ItemDetailSpecsTabProps {
  isAr: boolean;
  selectedProduct: MappedProduct | undefined;
  specsOpen: boolean;
  setSpecsOpen: (v: boolean) => void;
  vendorAttachments: string[];
  setVendorAttachments: React.Dispatch<React.SetStateAction<string[]>>;
  vendorFileRef: React.RefObject<HTMLInputElement | null>;
  onAddToRfqCart?: (productId: number, priceFrom?: number, priceTo?: number) => void;
}

export function ItemDetailSpecsTab({
  isAr,
  selectedProduct,
  specsOpen,
  setSpecsOpen,
  vendorAttachments,
  setVendorAttachments,
  vendorFileRef,
  onAddToRfqCart,
}: ItemDetailSpecsTabProps) {
  const { currency } = useAuth();
  const { toast } = useToast();
  const customizeMutation = useAddCustomizeProduct();
  const editorRef = useRef<HTMLDivElement>(null);
  const [rfqPriceFrom, setRfqPriceFrom] = useState("");
  const [rfqPriceTo, setRfqPriceTo] = useState("");

  return (
    <div className="p-3 space-y-3">
      {/* Action buttons */}
      {selectedProduct && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              const from = rfqPriceFrom ? Number(rfqPriceFrom) : undefined;
              const to = rfqPriceTo ? Number(rfqPriceTo) : undefined;
              onAddToRfqCart?.(selectedProduct.id, from, to);
            }}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 py-2 text-[11px] font-bold"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            {isAr ? "أضف لسلة الأسعار" : "Add to RFQ Cart"}
          </button>
          <button
            type="button"
            disabled={customizeMutation.isPending}
            onClick={async () => {
              const note = editorRef.current?.innerText?.trim() || "";
              const from = rfqPriceFrom ? Number(rfqPriceFrom) : 0;
              const to = rfqPriceTo ? Number(rfqPriceTo) : 0;
              if (!note && !from && !to) {
                toast({ title: isAr ? "يرجى كتابة متطلباتك أو تحديد الميزانية" : "Please write your requirements or set a budget", variant: "destructive" });
                return;
              }
              try {
                const res = await customizeMutation.mutateAsync({
                  productId: selectedProduct.id,
                  note,
                  fromPrice: from,
                  toPrice: to,
                });
                if (res?.status) {
                  toast({ title: isAr ? "تم إرسال طلب التخصيص" : "Customization request sent!", variant: "success" });
                }
              } catch (err: any) {
                toast({ title: isAr ? "فشل الإرسال" : "Failed to send", description: err?.message || "Try again", variant: "destructive" });
              }
            }}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50 py-2 text-[11px] font-bold"
          >
            {customizeMutation.isPending
              ? <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <Wrench className="h-3.5 w-3.5" />}
            {isAr
              ? `اطلب تخصيص من ${selectedProduct.seller}`
              : `Ask ${selectedProduct.seller} to Customize`}
          </button>
        </div>
      )}

      {/* Product specs (collapsible) */}
      <div className="rounded-lg border border-border overflow-hidden">
        <button
          type="button"
          onClick={() => setSpecsOpen(!specsOpen)}
          className="flex items-center gap-2 w-full px-3 py-2 bg-muted/40 hover:bg-muted/60 text-xs font-semibold"
        >
          <Eye className="h-3.5 w-3.5 text-primary" />
          <span className="flex-1 text-start">
            {selectedProduct?.name ?? "Product"} —{" "}
            {isAr ? "المواصفات" : "Specs"}
          </span>
          {specsOpen ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </button>
        {specsOpen && selectedProduct && (
          <div className="grid grid-cols-3 gap-px bg-border">
            {selectedProduct.specs && selectedProduct.specs.length > 0 ? (
              selectedProduct.specs.map(([key, val]: string[], i: number) => (
                <div key={i} className="bg-background px-2.5 py-1.5">
                  <span className="text-[9px] text-muted-foreground block">
                    {key}
                  </span>
                  <span className="text-[10px] font-medium">{val}</span>
                </div>
              ))
            ) : (
              <div className="col-span-3 bg-background px-3 py-4 text-center">
                <p className="text-[10px] text-muted-foreground">
                  {isAr ? "لا توجد مواصفات متاحة" : "No specs available yet"}
                </p>
                <p className="text-[9px] text-muted-foreground/60 mt-1">
                  {isAr
                    ? "المواصفات ستُستخرج تلقائياً"
                    : "Specs will be auto-extracted from product description"}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Rich-text editor + attachments */}
      <ItemDetailEditorPanel
        isAr={isAr}
        vendorAttachments={vendorAttachments}
        setVendorAttachments={setVendorAttachments}
        vendorFileRef={vendorFileRef}
        editorRef={editorRef}
      />

      {/* Price Range (below editor) */}
      <div className="rounded-lg border border-border bg-muted/20 p-3">
        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
          {isAr ? "نطاق السعر (الميزانية)" : "Price Range (Your Budget)"}
        </label>
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <span className="absolute start-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-medium">{currency?.symbol || "$"}</span>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={rfqPriceFrom}
              onChange={(e) => setRfqPriceFrom(e.target.value)}
              className="w-full rounded-lg border border-border bg-background ps-7 pe-2 py-2 text-xs outline-none focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-muted-foreground/40"
            />
            <span className="absolute end-2 top-1/2 -translate-y-1/2 text-[8px] text-muted-foreground/50 uppercase">{isAr ? "من" : "From"}</span>
          </div>
          <span className="text-muted-foreground text-[10px] font-semibold shrink-0">{isAr ? "إلى" : "to"}</span>
          <div className="flex-1 relative">
            <span className="absolute start-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-medium">{currency?.symbol || "$"}</span>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={rfqPriceTo}
              onChange={(e) => setRfqPriceTo(e.target.value)}
              className="w-full rounded-lg border border-border bg-background ps-7 pe-2 py-2 text-xs outline-none focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-muted-foreground/40"
            />
            <span className="absolute end-2 top-1/2 -translate-y-1/2 text-[8px] text-muted-foreground/50 uppercase">{isAr ? "إلى" : "To"}</span>
          </div>
        </div>
        {rfqPriceFrom && rfqPriceTo && Number(rfqPriceFrom) > Number(rfqPriceTo) && (
          <p className="text-[9px] text-destructive mt-1.5">
            {isAr ? "السعر 'من' يجب أن يكون أقل من 'إلى'" : "'From' price must be less than 'To' price"}
          </p>
        )}
      </div>
    </div>
  );
}
