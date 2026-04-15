"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  Plus, Paperclip, X, Package, ChevronRight, FileText, Trash2, ShoppingCart,
  Search, Loader2, Zap, ScanLine, Camera, Table2, FileSpreadsheet,
  Store, Users, Wrench, Percent, Briefcase, SlidersHorizontal,
} from "lucide-react";
import http from "@/apis/http";
import { track } from "@/lib/analytics";
import { extractTextFromImage, parseSpreadsheet, scanBarcodeFromImage } from "./tools";
import { useTrackProductSearch } from "@/apis/queries/product.queries";
import { useLoadDraftItems, useSaveDraftItems } from "@/apis/queries/rfq.queries";
import { getOrCreateDeviceId } from "@/utils/helper";
import { getCookie } from "cookies-next";
import { ULTRASOOQ_TOKEN_KEY } from "@/utils/constants";

export interface RequestItem {
  id: string;
  name: string;
  quantity: number;
  budgetFrom?: number;
  budgetTo?: number;
  type: "SAME" | "SIMILAR";
  attachments: string[];
  notes?: string;
}

// ─── Category filter chips (always visible in Panel 2) ──────────
type CategoryChipKey = "retail" | "wholesale" | "buygroup" | "customizable" | "discount" | "rfq" | "vendor_store" | "service";

interface CategoryChipDef {
  key: CategoryChipKey;
  label: string;
  labelAr: string;
  icon: React.ElementType;
  activeClass: string;
}

const CATEGORY_CHIPS: CategoryChipDef[] = [
  { key: "retail",        label: "Retail",       labelAr: "تجزئة",         icon: ShoppingCart,      activeClass: "bg-blue-100 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300" },
  { key: "wholesale",     label: "Wholesale",    labelAr: "جملة",          icon: Package,           activeClass: "bg-indigo-100 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300" },
  { key: "buygroup",      label: "Buy Group",    labelAr: "مجموعة شراء",   icon: Users,             activeClass: "bg-violet-100 dark:bg-violet-950/30 border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300" },
  { key: "customizable",  label: "Customizable", labelAr: "قابل للتخصيص",  icon: Wrench,            activeClass: "bg-amber-100 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300" },
  { key: "discount",      label: "Discount",     labelAr: "خصم",           icon: Percent,           activeClass: "bg-rose-100 dark:bg-rose-950/30 border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300" },
  { key: "rfq",           label: "RFQ",          labelAr: "طلب أسعار",     icon: FileText,          activeClass: "bg-primary/10 border-primary/30 text-primary" },
  { key: "vendor_store",  label: "Vendor Store", labelAr: "متاجر البائعين", icon: Store,             activeClass: "bg-emerald-100 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300" },
  { key: "service",       label: "Service",      labelAr: "خدمات",          icon: Briefcase,         activeClass: "bg-cyan-100 dark:bg-cyan-950/30 border-cyan-300 dark:border-cyan-700 text-cyan-700 dark:text-cyan-300" },
];

interface RequestListPanelProps {
  selectedItemId: string | null;
  onSelectItem: (id: string, name?: string) => void;
  onItemRemoved?: (id: string) => void;
  onRequestSession?: () => string; // returns new sessionId
  searchQuery?: string;
  sessionId?: string | null;
  locale: string;
  activeCategories?: Set<string>;
  onCategoryChange?: (categories: Set<string>) => void;
}

export default function RequestListPanel({ selectedItemId, onSelectItem, onItemRemoved, onRequestSession, searchQuery, sessionId, locale, activeCategories, onCategoryChange }: RequestListPanelProps) {
  const isAr = locale === "ar";

  // Tracking hook
  const trackSearch = useTrackProductSearch();

  // Category chips — use parent-controlled state if provided, otherwise local
  const [localCategories, setLocalCategories] = useState<Set<string>>(new Set());
  const chips = activeCategories ?? localCategories;
  const toggleCategory = (key: string) => {
    const next = new Set(chips);
    if (next.has(key)) next.delete(key); else next.add(key);
    if (onCategoryChange) onCategoryChange(next);
    else setLocalCategories(next);
  };

  const [inputText, setInputText] = useState("");
  const [attachments, setAttachments] = useState<string[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const ocrInputRef = React.useRef<HTMLInputElement>(null);
  const scanInputRef = React.useRef<HTMLInputElement>(null);
  const lensInputRef = React.useRef<HTMLInputElement>(null);
  const excelInputRef = React.useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<RequestItem[]>([]);
  const itemsLoaded = useRef(false);
  const isAuthenticated = !!getCookie(ULTRASOOQ_TOKEN_KEY);

  // Backend draft persistence (authenticated users)
  const draftQuery = useLoadDraftItems(sessionId ?? null, isAuthenticated);
  const saveDraftMutation = useSaveDraftItems();
  const saveMutateRef = useRef(saveDraftMutation.mutate);
  saveMutateRef.current = saveDraftMutation.mutate;
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced save to backend (stable ref to avoid re-trigger loops)
  const debouncedSave = useCallback((sid: string, newItems: RequestItem[]) => {
    if (!isAuthenticated) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveMutateRef.current({ sessionId: sid, items: newItems });
    }, 1000);
  }, [isAuthenticated]);

  // Load items: from backend (auth) or localStorage (guest)
  useEffect(() => {
    if (itemsLoaded.current || !sessionId) return;
    if (isAuthenticated && draftQuery.data?.data) {
      itemsLoaded.current = true;
      const loaded = draftQuery.data.data;
      if (Array.isArray(loaded) && loaded.length > 0) setItems(loaded);
    } else if (isAuthenticated && draftQuery.isLoading) {
      // Wait for backend response
      return;
    } else if (isAuthenticated && draftQuery.isError) {
      // Backend failed — fall back to localStorage
      itemsLoaded.current = true;
      try {
        const stored = localStorage.getItem(`rfq_items_${sessionId}`);
        if (stored) setItems(JSON.parse(stored));
      } catch {}
    } else if (!isAuthenticated) {
      itemsLoaded.current = true;
      try {
        const stored = localStorage.getItem(`rfq_items_${sessionId}`);
        if (stored) setItems(JSON.parse(stored));
      } catch {}
    }
  }, [sessionId, isAuthenticated, draftQuery.data, draftQuery.isLoading, draftQuery.isError]);

  // Persist items when they change
  useEffect(() => {
    if (!sessionId || !itemsLoaded.current) return;
    if (isAuthenticated) {
      // Save to backend (debounced)
      debouncedSave(sessionId, items);
    } else {
      // Fallback to localStorage for guests
      try {
        if (items.length > 0) localStorage.setItem(`rfq_items_${sessionId}`, JSON.stringify(items));
        else localStorage.removeItem(`rfq_items_${sessionId}`);
      } catch {}
    }
  }, [items, sessionId, isAuthenticated, debouncedSave]);

  const [searchMode, setSearchMode] = useState<"search" | "ai">("search");
  const [toolLoading, setToolLoading] = useState<string | null>(null);

  // ── Tool handlers ──
  const handleOCR = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setToolLoading("ocr");
    track("rfq_tool_ocr", { fileType: file.type, fileSize: file.size });
    try {
      const text = await extractTextFromImage(file);
      if (text) { setInputText((prev) => prev ? prev + "\n" + text : text); track("rfq_tool_ocr_success", { textLength: text.length }); }
      else { alert(isAr ? "لم يتم العثور على نص في الصورة" : "No text found in the image"); }
    } catch (err: any) {
      const msg = err?.message ?? err?.toString?.() ?? JSON.stringify(err);
      console.error("OCR failed:", msg, err);
      alert((isAr ? "فشل قراءة النص: " : "OCR failed: ") + msg);
      track("rfq_tool_ocr_error", { error: msg });
    }
    setToolLoading(null);
  };

  const handleBarcodeScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setToolLoading("scan");
    track("rfq_tool_barcode");
    try {
      const code = await scanBarcodeFromImage(file);
      if (code) { setInputText((prev) => prev ? prev + "\n" + code : code); track("rfq_tool_barcode_success", { code }); }
    } catch (err) { console.error("Scan failed:", err); track("rfq_tool_barcode_error"); }
    setToolLoading(null);
  };

  const handleLens = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setAttachments((prev) => [...prev, file.name]);
    setSearchMode("ai");
    setToolLoading(null);
    track("rfq_tool_lens", { fileName: file.name });
  };

  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setToolLoading("excel");
    track("rfq_tool_excel", { fileName: file.name });
    try {
      const productNames = await parseSpreadsheet(file);
      if (productNames.length > 0) {
        const newItems: RequestItem[] = productNames.map((name, i) => {
          // Parse quantity from name like "50 headphones"
          const qtyMatch = name.match(/^(\d+)\s+(.+)/);
          const itemName = qtyMatch ? qtyMatch[2].trim() : name;
          const itemQty = qtyMatch ? parseInt(qtyMatch[1]) || 1 : 1;
          return {
            id: `excel-${Date.now()}-${i}`,
            name: itemName,
            quantity: itemQty,
            type: "SIMILAR" as const,
            attachments: [],
          };
        });
        setItems((prev) => [...prev, ...newItems]);
        if (newItems.length > 0) onSelectItem(newItems[0].id, newItems[0].name);
      }
    } catch (err) { console.error("Excel parse failed:", err); }
    setToolLoading(null);
  };

  // AI usage: 50/day — same counter as Panel 3
  const [aiSearchUsed, setAiSearchUsed] = useState(0);
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("us_ai_search") ?? "{}");
      setAiSearchUsed(stored.date === new Date().toDateString() ? (stored.count ?? 0) : 0);
    } catch {}
  }, []);
  const aiSearchLeft = 50 - aiSearchUsed;
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const suggestTimer = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Fetch suggestions as user types (debounced)
  const fetchSuggestions = (term: string) => {
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    if (term.length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
    suggestTimer.current = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const res = await http({ method: "GET", url: "/product/searchSuggestions", params: { term } });
        const data = res.data?.data ?? res.data ?? [];
        const names = Array.isArray(data) ? data.map((s: any) => s.productName ?? s.name ?? s.term ?? s).filter(Boolean) : [];
        setSuggestions(names.slice(0, 8));
        setShowSuggestions(names.length > 0);
      } catch {
        setSuggestions([]);
      }
      setLoadingSuggestions(false);
    }, 300);
  };

  // Parse text into multiple products — splits by newline, comma, or numbered list
  const parseProducts = (text: string): Array<{ name: string; quantity: number }> => {
    // Split by newlines, commas, or numbered patterns (1. 2. 3. or 1) 2) 3))
    const lines = text
      .split(/[\n,]+/)
      .map((l) => l.replace(/^\s*\d+[\.\)]\s*/, "").trim()) // remove "1." or "1)" prefixes
      .filter((l) => l.length > 0);

    return lines.map((line) => {
      // Try to extract quantity: "50 headphones" or "headphones x50" or "headphones (50)"
      const qtyMatch = line.match(/^(\d+)\s+(.+)/) // "50 headphones"
        ?? line.match(/(.+?)\s*[xX×]\s*(\d+)/) // "headphones x50"
        ?? line.match(/(.+?)\s*\((\d+)\)/); // "headphones (50)"

      if (qtyMatch) {
        const isQtyFirst = /^\d/.test(line);
        return {
          name: isQtyFirst ? qtyMatch[2].trim() : qtyMatch[1].trim(),
          quantity: parseInt(isQtyFirst ? qtyMatch[1] : qtyMatch[2]) || 1,
        };
      }
      return { name: line, quantity: 1 };
    });
  };

  const addItem = (name: string) => {
    const text = name.trim();
    // AI mode: can search with just attachments (no text needed)
    if (!text && attachments.length === 0) return;
    // Auto-create session if none exists
    ensureSession();
    if (!text && attachments.length > 0 && searchMode === "ai") {
      // AI reads attachments only
      const newItem: RequestItem = {
        id: `item-${Date.now()}`,
        name: `📎 ${attachments.join(", ")}`,
        quantity: 1,
        type: "SIMILAR" as const,
        attachments: [...attachments],
      };
      setItems((prev) => [...prev, newItem]);
      setInputText("");
      setAttachments([]);
      setSuggestions([]);
      setShowSuggestions(false);
      onSelectItem(newItem.id, newItem.name);
      return;
    }
    if (!text) return;

    const parsed = parseProducts(text);
    const newItems: RequestItem[] = parsed.map((p, i) => ({
      id: `item-${Date.now()}-${i}`,
      name: p.name,
      quantity: p.quantity,
      type: "SIMILAR" as const,
      attachments: i === 0 ? [...attachments] : [], // attachments go to first item
    }));

    if (newItems.length === 0) return;
    setItems((prev) => [...prev, ...newItems]);
    // Track the search term
    if (searchMode === "search" && text) {
      trackSearch.mutate({ searchTerm: text, deviceId: getOrCreateDeviceId() || undefined });
    }
    setInputText("");
    setAttachments([]);
    setSuggestions([]);
    setShowSuggestions(false);
    // Select the first new item
    onSelectItem(newItems[0].id, newItems[0].name);
  };

  // Initialize items when session/query changes
  const prevSessionRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    if (searchQuery) {
      setItems([{ id: "new-search-1", name: searchQuery, quantity: 1, type: "SIMILAR", attachments: [] }]);
    } else if (sessionId && prevSessionRef.current !== undefined && prevSessionRef.current !== sessionId) {
      // Skip clearing if this session was just auto-created by ensureSession()
      if (autoCreatedRef.current) {
        autoCreatedRef.current = false;
      } else {
        // Reset loaded flag so the new session loads from backend/localStorage
        itemsLoaded.current = false;
        setItems([]);
      }
    }
    prevSessionRef.current = sessionId;
  }, [sessionId, searchQuery]);

  const deleteItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    onItemRemoved?.(id);
    track("rfq_item_deleted", { itemId: id });
  };

  // Auto-create session when user adds first item without a session
  const autoCreatedRef = useRef(false);
  const ensureSession = () => {
    if (!sessionId && onRequestSession) {
      autoCreatedRef.current = true;
      return onRequestSession();
    }
    return sessionId;
  };

  return (
    <div className="flex flex-col h-full min-h-0 border-e border-border bg-background">
      {/* Header */}
      <div className="px-3 py-3 border-b border-border shrink-0">
        <h3 className="text-sm font-bold">{isAr ? "قائمة الطلبات" : "Request Items"}</h3>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {isAr ? "أضف المنتجات التي تحتاجها" : "Add products you need quotes for"}
        </p>
      </div>

      {/* Input area with search mode toggle */}
      <div className="px-3 py-2.5 border-b border-border shrink-0">
        <div className="relative">
          <div className="flex items-start gap-2">
            <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-2" />
            <textarea
              ref={inputRef}
              value={inputText}
              onChange={(e) => { setInputText(e.target.value); fetchSuggestions(e.target.value); }}
              onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
              onBlur={() => { setTimeout(() => setShowSuggestions(false), 200); }}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); addItem(inputText); } }}
              rows={2}
              placeholder={isAr ? "ابحث عن منتج أو صف ما تحتاجه..." : "Search for a product or describe what you need..."}
              className="flex-1 rounded-lg border bg-muted/50 px-3 py-2 text-xs placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>

          {/* Autocomplete dropdown */}
          {showSuggestions && (
            <div className="absolute start-5 end-0 top-full mt-1 z-10 rounded-lg border border-border bg-background shadow-lg max-h-48 overflow-y-auto">
              {loadingSuggestions && (
                <div className="flex items-center gap-2 px-3 py-2 text-[10px] text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" /> {isAr ? "جاري البحث..." : "Searching..."}
                </div>
              )}
              {suggestions.map((s, i) => (
                <button key={i} type="button"
                  onMouseDown={(e) => { e.preventDefault(); addItem(s); }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-start text-[11px] hover:bg-muted/50 border-b border-border/30 last:border-0">
                  <Search className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                  <span className="truncate">{s}</span>
                </button>
              ))}
              {!loadingSuggestions && suggestions.length === 0 && inputText.length >= 2 && (
                <div className="px-3 py-2 text-[10px] text-muted-foreground">
                  {isAr ? "لا توجد اقتراحات — اضغط Enter للإضافة" : "No suggestions — press Enter to add as-is"}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Attachments row */}
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          {/* Hidden multi-file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) {
                const names = Array.from(e.target.files).map((f) => f.name);
                setAttachments((prev) => [...prev, ...names]);
              }
              e.target.value = "";
            }}
          />
          {/* Tools: Attach + OCR + Scan + Lens + Excel */}
          {/* Hidden file inputs for each tool */}
          <input ref={ocrInputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleOCR} />
          <input ref={scanInputRef} type="file" accept="image/*" className="hidden" onChange={handleBarcodeScan} />
          <input ref={lensInputRef} type="file" accept="image/*" className="hidden" onChange={handleLens} />
          <input ref={excelInputRef} type="file" accept=".csv,.xlsx,.xls,.tsv" className="hidden" onChange={handleExcelImport} />

          <div className="flex items-center gap-0.5">
            <button type="button" onClick={() => fileInputRef.current?.click()}
              title={isAr ? "إرفاق ملفات" : "Attach files"}
              className="flex h-7 items-center gap-1 rounded border border-dashed border-border hover:border-primary px-1.5 text-[9px] text-muted-foreground hover:text-primary">
              <Paperclip className="h-3 w-3" /> {isAr ? "إرفاق" : "Attach"}
            </button>
            <button type="button" onClick={() => ocrInputRef.current?.click()}
              disabled={toolLoading === "ocr"}
              title={isAr ? "قراءة نص من صورة/PDF (مجاني)" : "Extract text from image/PDF (free)"}
              className={cn("flex h-7 w-7 items-center justify-center rounded border border-border text-muted-foreground hover:text-foreground hover:bg-muted",
                toolLoading === "ocr" && "animate-pulse bg-muted")}>
              {toolLoading === "ocr" ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileText className="h-3 w-3" />}
            </button>
            <button type="button" onClick={() => scanInputRef.current?.click()}
              disabled={toolLoading === "scan"}
              title={isAr ? "مسح باركود/QR (مجاني)" : "Scan barcode/QR (free)"}
              className={cn("flex h-7 w-7 items-center justify-center rounded border border-border text-muted-foreground hover:text-foreground hover:bg-muted",
                toolLoading === "scan" && "animate-pulse bg-muted")}>
              {toolLoading === "scan" ? <Loader2 className="h-3 w-3 animate-spin" /> : <ScanLine className="h-3 w-3" />}
            </button>
            <button type="button" onClick={() => lensInputRef.current?.click()}
              title={isAr ? "بحث بصري — التقط صورة (يستخدم AI)" : "Visual search — upload photo (uses AI)"}
              className="flex h-7 w-7 items-center justify-center rounded border border-border text-muted-foreground hover:text-foreground hover:bg-muted">
              <Camera className="h-3 w-3" />
            </button>
            <button type="button" onClick={() => excelInputRef.current?.click()}
              disabled={toolLoading === "excel"}
              title={isAr ? "استيراد من Excel/CSV (مجاني)" : "Import from Excel/CSV (free)"}
              className={cn("flex h-7 w-7 items-center justify-center rounded border border-border text-muted-foreground hover:text-foreground hover:bg-muted",
                toolLoading === "excel" && "animate-pulse bg-muted")}>
              {toolLoading === "excel" ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileSpreadsheet className="h-3 w-3" />}
            </button>
          </div>

          {/* Attachment chips */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-1 w-full mt-1">
              {attachments.map((a, i) => (
                <span key={i} className="flex items-center gap-1 bg-muted rounded px-2 py-0.5 text-[9px]">
                  📎 {a}
                  <button type="button" onClick={() => setAttachments((p) => p.filter((_, idx) => idx !== i))}>
                    <X className="h-2.5 w-2.5 text-muted-foreground hover:text-destructive" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Search / AI Search — these submit the query */}
          <div className="flex items-center gap-1 ms-auto shrink-0">
            <button type="button"
              onClick={() => { setSearchMode("search"); addItem(inputText); }}
              disabled={!inputText.trim()}
              title={attachments.length > 0 ? (isAr ? "البحث بالنص فقط — المرفقات تُحفظ مع الطلب" : "Text search only — attachments saved with request") : ""}
              className="flex items-center gap-1 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1.5 text-[9px] font-semibold">
              <Search className="h-3 w-3" /> {isAr ? "بحث" : "Search"}
            </button>
            <button type="button"
              onClick={() => { if (aiSearchLeft > 0) { setSearchMode("ai"); addItem(inputText); } }}
              disabled={(!inputText.trim() && attachments.length === 0) || aiSearchLeft <= 0}
              title={isAr ? "AI يقرأ النص والمرفقات (صور، PDF)" : "AI reads text + attachments (images, PDF)"}
              className={cn("flex items-center gap-1 rounded-lg px-3 py-1.5 text-[9px] font-semibold transition-colors",
                aiSearchLeft <= 0 ? "bg-muted text-muted-foreground/30 cursor-not-allowed"
                  : (!inputText.trim() && attachments.length === 0) ? "bg-purple-600/50 text-white/50 cursor-not-allowed"
                  : "bg-purple-600 text-white hover:bg-purple-700")}>
              <Zap className="h-3 w-3" /> AI
              {attachments.length > 0 && <span className="text-[7px] bg-white/20 rounded px-0.5">+📎</span>}
              <span className="text-[7px] opacity-70">{aiSearchLeft}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Items count + Clear All */}
      <div className="px-3 py-1.5 bg-muted/30 border-b border-border shrink-0 flex items-center justify-between">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          {items.length} {isAr ? "عنصر" : "items"}
        </span>
        <button
          type="button"
          disabled={items.length === 0}
          onClick={() => {
            setItems([]);
            onItemRemoved?.("");
            track("rfq_items_cleared", { count: items.length });
          }}
          className="flex items-center gap-1 text-[9px] font-medium text-destructive/70 hover:text-destructive disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <Trash2 className="h-3 w-3" />
          {isAr ? "مسح الكل" : "Clear All"}
        </button>
      </div>

      {/* Items list */}
      <div className="flex-1 overflow-y-auto">
        {items.map((item, index) => (
          <div
            key={item.id}
            className={cn(
              "group flex w-full items-start gap-2 px-2 py-2 text-start border-b border-border/50 transition-colors",
              item.id === selectedItemId
                ? "bg-primary/5 border-e-2 border-e-primary"
                : "hover:bg-muted/30"
            )}
          >
            {/* Number badge — clickable to select */}
            <button type="button" onClick={() => onSelectItem(item.id, item.name)}
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold shrink-0 mt-0.5",
                item.id === selectedItemId
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}>
              {index + 1}
            </button>

            {/* Content — clickable to select */}
            <button type="button" onClick={() => onSelectItem(item.id, item.name)} className="flex-1 min-w-0 text-start">
              <span className={cn(
                "text-[11px] block truncate",
                item.id === selectedItemId ? "font-bold text-primary" : "font-semibold"
              )}>
                {item.name}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5 text-[9px] text-muted-foreground">
                <span className="flex items-center gap-0.5">
                  <Package className="h-2.5 w-2.5" />
                  {item.quantity}
                </span>
                {item.budgetFrom && (
                  <span>{item.budgetFrom}-{item.budgetTo}</span>
                )}
                <span className={cn(
                  "px-1 rounded text-[7px] font-medium",
                  item.type === "SAME" ? "bg-green-500/10 text-green-600" : "bg-blue-500/10 text-blue-600"
                )}>
                  {item.type}
                </span>
                {item.attachments.length > 0 && (
                  <span className="text-[8px]">📎{item.attachments.length}</span>
                )}
              </div>
            </button>

            {/* Delete */}
            <button type="button" title={isAr ? "حذف" : "Delete"}
              onClick={(e) => { e.stopPropagation(); deleteItem(item.id); }}
              className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
