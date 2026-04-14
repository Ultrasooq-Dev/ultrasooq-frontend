"use client";
/**
 * ItemDetailSpecsTab — "Specs & Requirements" tab content for ItemDetailPanel.
 * Renders action buttons, product spec grid, and the rich-text editor panel.
 */
import React from "react";
import {
  ShoppingCart, Wrench, Eye, ChevronDown, ChevronUp,
} from "lucide-react";
import type { MappedProduct } from "./itemDetailTypes";
import { ItemDetailEditorPanel } from "./ItemDetailEditorPanel";

interface ItemDetailSpecsTabProps {
  isAr: boolean;
  selectedProduct: MappedProduct | undefined;
  specsOpen: boolean;
  setSpecsOpen: (v: boolean) => void;
  vendorAttachments: string[];
  setVendorAttachments: React.Dispatch<React.SetStateAction<string[]>>;
  vendorFileRef: React.RefObject<HTMLInputElement | null>;
  onAddToRfqCart?: (productId: number) => void;
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
  return (
    <div className="p-3 space-y-3">
      {/* Action buttons */}
      {selectedProduct && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onAddToRfqCart?.(selectedProduct.id)}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 py-2 text-[11px] font-bold"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            {isAr ? "أضف لسلة الأسعار" : "Add to RFQ Cart"}
          </button>
          <button
            type="button"
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-amber-600 text-white hover:bg-amber-700 py-2 text-[11px] font-bold"
          >
            <Wrench className="h-3.5 w-3.5" />
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
      />
    </div>
  );
}
