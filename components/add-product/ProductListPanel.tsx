"use client";
import React, { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  Plus, Trash2, Package, Search, GripVertical, Check, Camera, ScanLine,
  FileSpreadsheet, ImageIcon, Sparkles, ChevronRight, XCircle, Wrench, Loader2,
} from "lucide-react";
import http from "@/apis/http";
import { extractTextFromImage, parseSpreadsheet, scanBarcodeFromImage } from "@/components/rfq-builder/tools";

type ToolKind = "ocr" | "scan" | "lens" | "excel";

export type ProductKind = "product" | "sparepart";

export interface ProductDraft {
  id: string;
  name: string;
  kind: ProductKind;
  status: "draft" | "editing" | "ready";
  templateId?: number;
}

interface ProductListPanelProps {
  items: ProductDraft[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: (names: string[], kind: ProductKind) => void;
  onRemove: (id: string) => void;
  onClearAll?: () => void;
  onKindChange?: (kind: ProductKind) => void;
  onStatusChange: (id: string, status: ProductDraft["status"]) => void;
  locale: string;
}

export default function ProductListPanel({
  items, selectedId, onSelect, onAdd, onRemove, onClearAll, onKindChange, onStatusChange, locale,
}: ProductListPanelProps) {
  const isAr = locale === "ar";
  const [inputText, setInputText] = useState("");
  const [selectedKind, setSelectedKind] = useState<ProductKind>("product");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [toolLoading, setToolLoading] = useState<ToolKind | null>(null);
  const ocrInputRef = useRef<HTMLInputElement>(null);
  const scanInputRef = useRef<HTMLInputElement>(null);
  const lensInputRef = useRef<HTMLInputElement>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);

  const splitNames = (text: string): string[] =>
    text.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);

  const handleOCR = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setToolLoading("ocr");
    try {
      const text = await extractTextFromImage(file);
      const names = splitNames(text);
      if (names.length === 0) {
        alert(isAr ? "لم يتم العثور على نص" : "No text found");
      } else {
        onAdd(names, selectedKind);
      }
    } catch (err: any) {
      alert((isAr ? "فشل قراءة النص: " : "OCR failed: ") + (err?.message ?? err));
    }
    setToolLoading(null);
  };

  const handleBarcode = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setToolLoading("scan");
    try {
      const code = await scanBarcodeFromImage(file);
      if (code) setInputText((prev) => prev ? `${prev}\n${code}` : code);
      else alert(isAr ? "لم يتم قراءة الباركود" : "No barcode detected");
    } catch (err: any) {
      alert((isAr ? "فشل مسح الباركود: " : "Barcode scan failed: ") + (err?.message ?? err));
    }
    setToolLoading(null);
  };

  const handleLens = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setToolLoading("lens");
    try {
      const text = await extractTextFromImage(file);
      const firstLine = text.split(/\n+/).map((s) => s.trim()).filter(Boolean)[0] ?? "";
      if (firstLine) setInputText((prev) => prev ? `${prev}\n${firstLine}` : firstLine);
      else alert(isAr ? "لم يتم العثور على نص في الصورة" : "No readable text in image");
    } catch (err: any) {
      alert((isAr ? "فشل البحث البصري: " : "Visual search failed: ") + (err?.message ?? err));
    }
    setToolLoading(null);
  };

  const handleExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setToolLoading("excel");
    try {
      const rows = await parseSpreadsheet(file);
      const names = rows.map((r) => r.replace(/^\d+\s+/, "").trim()).filter(Boolean);
      if (names.length === 0) {
        alert(isAr ? "الملف فارغ" : "No rows found");
      } else {
        onAdd(names, selectedKind);
      }
    } catch (err: any) {
      alert((isAr ? "فشل استيراد الملف: " : "Import failed: ") + (err?.message ?? err));
    }
    setToolLoading(null);
  };

  // Autocomplete
  const handleInputChange = (value: string) => {
    setInputText(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
    debounceRef.current = setTimeout(() => {
      http.get("/product/searchSuggestions", { params: { term: value } })
        .then((res) => {
          const data = res.data?.data ?? res.data ?? [];
          const names = Array.isArray(data) ? data.map((d: any) => d.productName_en ?? d.name ?? d).slice(0, 6) : [];
          setSuggestions(names);
          setShowSuggestions(names.length > 0);
        })
        .catch(() => {});
    }, 300);
  };

  // Parse multi-product input
  const handleAdd = () => {
    const text = inputText.trim();
    if (!text) return;
    // Split by newlines or commas
    const names = text.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
    onAdd(names, selectedKind);
    setInputText("");
    setShowSuggestions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAdd(); }
  };

  const readyCount = items.filter((i) => i.status === "ready").length;

  return (
    <div className="flex flex-col h-full min-h-0 bg-muted/10 border-e border-border">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-primary" />
          <span className="text-sm font-bold flex-1">{isAr ? "قائمة المنتجات" : "Product List"}</span>
          <span className="text-[10px] text-muted-foreground">
            {readyCount}/{items.length} {isAr ? "جاهز" : "ready"}
          </span>
        </div>
      </div>

      {/* Input area */}
      <div className="p-3 border-b border-border shrink-0 space-y-2">
        {/* Product type selector */}
        <div className="flex rounded-md border border-border overflow-hidden">
          <button type="button" onClick={() => { setSelectedKind("product"); onKindChange?.("product"); }}
            className={cn("flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium transition-colors",
              selectedKind === "product" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted/50")}>
            <Package className="h-3 w-3" /> {isAr ? "منتج" : "Product"}
          </button>
          <button type="button" onClick={() => { setSelectedKind("sparepart"); onKindChange?.("sparepart"); }}
            className={cn("flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium transition-colors border-s border-border",
              selectedKind === "sparepart" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted/50")}>
            <Wrench className="h-3 w-3" /> {isAr ? "قطعة غيار" : "Spare Part"}
          </button>
        </div>

        <div className="relative">
          <textarea
            value={inputText}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder={isAr ? "اسم المنتج...\n(أسطر متعددة لمنتجات متعددة)" : "Product name...\n(multiple lines for bulk add)"}
            rows={2}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary resize-none"
          />
          {/* Suggestions */}
          {showSuggestions && (
            <div className="absolute start-0 end-0 top-full mt-1 bg-background border border-border rounded-md shadow-lg z-10 max-h-36 overflow-y-auto">
              {suggestions.map((s, i) => (
                <button key={i} type="button"
                  onMouseDown={() => { setInputText(s); setShowSuggestions(false); }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-start hover:bg-muted/50 border-b border-border/20 last:border-0">
                  <Search className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span className="truncate">{s}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Action row */}
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={handleAdd} disabled={!inputText.trim()}
            className="flex items-center gap-1 rounded-md bg-primary text-primary-foreground py-1.5 px-3 text-xs font-medium disabled:opacity-50">
            <Plus className="h-3 w-3" /> {isAr ? "إضافة" : "Add"}
          </button>
          <div className="flex-1" />
          {/* Hidden file inputs */}
          <input ref={ocrInputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleOCR} />
          <input ref={scanInputRef} type="file" accept="image/*" className="hidden" onChange={handleBarcode} />
          <input ref={lensInputRef} type="file" accept="image/*" className="hidden" onChange={handleLens} />
          <input ref={excelInputRef} type="file" accept=".csv,.xlsx,.xls,.tsv" className="hidden" onChange={handleExcel} />
          {/* Tools */}
          {([
            { kind: "ocr" as const, icon: Camera, tip: isAr ? "قراءة نص من صورة/PDF" : "OCR (image/PDF)", ref: ocrInputRef },
            { kind: "scan" as const, icon: ScanLine, tip: isAr ? "مسح باركود/QR" : "Barcode / QR", ref: scanInputRef },
            { kind: "lens" as const, icon: ImageIcon, tip: isAr ? "بحث بصري" : "Visual lens", ref: lensInputRef },
            { kind: "excel" as const, icon: FileSpreadsheet, tip: isAr ? "استيراد Excel/CSV" : "Excel / CSV import", ref: excelInputRef },
          ]).map((t) => {
            const busy = toolLoading === t.kind;
            const disabled = toolLoading !== null && !busy;
            return (
              <button key={t.kind} type="button" title={t.tip}
                disabled={disabled}
                onClick={() => t.ref.current?.click()}
                aria-label={t.tip}
                aria-busy={busy}
                data-tool={t.kind}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-md border border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed",
                  busy && "bg-muted animate-pulse"
                )}>
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <t.icon className="h-3.5 w-3.5" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Product list */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {items.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4">
            <Package className="h-8 w-8 mb-2 opacity-10" />
            <p className="text-xs text-center">{isAr ? "أضف اسم منتج للبدء" : "Add a product name to start"}</p>
          </div>
        )}

        {items.map((item) => {
          const isSel = item.id === selectedId;
          return (
            <div key={item.id}
              onClick={() => onSelect(item.id)}
              role="button" tabIndex={0}
              className={cn(
                "group flex items-center gap-2 px-3 py-2.5 border-b border-border/30 cursor-pointer transition-colors",
                isSel ? "bg-primary/5 border-s-2 border-s-primary" : "hover:bg-muted/30"
              )}>
              {/* Kind + Status indicator */}
              <div className={cn(
                "flex h-5 w-5 items-center justify-center rounded shrink-0",
                item.kind === "sparepart" ? "bg-orange-100 dark:bg-orange-900/20" : "bg-blue-100 dark:bg-blue-900/20"
              )}>
                {item.kind === "sparepart"
                  ? <Wrench className="h-3 w-3 text-orange-600" />
                  : <Package className="h-3 w-3 text-blue-600" />}
              </div>

              {/* Name */}
              <div className="flex-1 min-w-0">
                <span className={cn("text-sm block truncate", isSel ? "font-semibold" : "font-medium")}>{item.name}</span>
                <span className="text-[10px] text-muted-foreground">
                  {item.status === "ready" ? (isAr ? "جاهز" : "Ready") :
                   item.status === "editing" ? (isAr ? "قيد التحرير" : "Editing") :
                   (isAr ? "مسودة" : "Draft")}
                  {item.templateId && ` · ${isAr ? "من قالب" : "from template"}`}
                </span>
              </div>

              {/* Status icon */}
              {item.status === "ready" && <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />}

              {/* Delete */}
              <button type="button"
                onClick={(e) => { e.stopPropagation(); onRemove(item.id); }}
                className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Footer — summary + actions */}
      {items.length > 0 && (
        <div className="px-3 py-2 border-t border-border shrink-0 flex items-center gap-2">
          <button type="button" onClick={() => onClearAll?.()}
            className="flex items-center gap-0.5 rounded-md border border-border py-1.5 px-2 text-[10px] text-muted-foreground hover:text-destructive hover:border-destructive/30">
            <Trash2 className="h-3 w-3" /> {isAr ? "مسح الكل" : "Clear"}
          </button>
          <span className="text-xs text-muted-foreground flex-1 text-end">
            {items.length} {isAr ? "منتج" : "products"}
          </span>
          <button type="button" disabled={readyCount === 0}
            className="flex items-center gap-1 rounded-md bg-green-600 text-white py-1.5 px-3 text-xs font-medium disabled:opacity-50 hover:bg-green-700">
            <Check className="h-3 w-3" /> {isAr ? "إرسال" : "Submit"} ({readyCount})
          </button>
        </div>
      )}
    </div>
  );
}
