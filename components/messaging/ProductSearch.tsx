"use client";
import React, { useState, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  Search, X, ChevronLeft, Package, Star, Plus, ScanLine, FileSpreadsheet,
  Camera, Sparkles, Check, ImageIcon, Loader2, ChevronDown, Filter,
} from "lucide-react";
import http from "@/apis/http";

interface ProductResult {
  id: number;
  name: string;
  image?: string;
  price?: number;
  stock?: number;
  rating?: number;
  seller?: string;
  category?: string;
}

interface ProductSearchProps {
  onClose: () => void;
  onAddProduct: (product: ProductResult) => void;
  locale: string;
}

export default function ProductSearch({ onClose, onAddProduct, locale }: ProductSearchProps) {
  const isAr = locale === "ar";

  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const [results, setResults] = useState<ProductResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set());

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minRating, setMinRating] = useState(0);
  const [stockOnly, setStockOnly] = useState(false);

  // Autocomplete
  const handleInputChange = useCallback((value: string) => {
    setSearchTerm(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
    debounceRef.current = setTimeout(() => {
      http.get("/product/searchSuggestions", { params: { term: value } })
        .then((res) => {
          const data = res.data?.data ?? res.data ?? [];
          const names = Array.isArray(data) ? data.map((d: any) => d.productName_en ?? d.name ?? d) : [];
          setSuggestions(names.slice(0, 6));
          setShowSuggestions(names.length > 0);
        })
        .catch(() => {});
    }, 300);
  }, []);

  // Search
  const doSearch = useCallback(async (term?: string, pageNum = 1) => {
    const q = (term ?? searchTerm).trim();
    if (!q) return;
    setLoading(true); setSearched(true); setShowSuggestions(false);
    try {
      const res = await http.get("/product/getAllProduct", { params: { page: pageNum, limit: 10, term: q } });
      const products = res.data?.data?.data ?? res.data?.data ?? res.data ?? [];
      const mapped: ProductResult[] = products.map((p: any) => ({
        id: p.id,
        name: p.productName_en ?? p.productName ?? p.name ?? `Product #${p.id}`,
        image: p.images?.[0]?.url ?? p.productImage,
        price: p.productPrice?.[0]?.offerPrice ?? p.price ?? 0,
        stock: p.productPrice?.[0]?.stock ?? p.stock ?? 0,
        rating: p.averageRating ?? 0,
        seller: p.productPrice?.[0]?.user?.firstName ?? "",
        category: p.category?.categoryName_en ?? "",
      }));
      if (pageNum === 1) setResults(mapped); else setResults((prev) => [...prev, ...mapped]);
      setPage(pageNum);
      setHasMore(mapped.length >= 10);
    } catch { if (pageNum === 1) setResults([]); }
    finally { setLoading(false); }
  }, [searchTerm]);

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === "Enter") { e.preventDefault(); doSearch(); } };

  // Client-side filter
  const filtered = results.filter((p) => {
    if (minPrice && p.price && p.price < Number(minPrice)) return false;
    if (maxPrice && p.price && p.price > Number(maxPrice)) return false;
    if (minRating && (p.rating ?? 0) < minRating) return false;
    if (stockOnly && (!p.stock || p.stock <= 0)) return false;
    return true;
  });

  return (
    <div className="flex flex-col h-full min-h-0 bg-background">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border shrink-0 bg-muted/30">
        <button type="button" onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted text-muted-foreground">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <Package className="h-4 w-4 text-primary" />
        <span className="text-sm font-bold flex-1">{isAr ? "أضف من متجرك" : "Add from Store"}</span>
        <button type="button" onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted text-muted-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Search bar */}
      <div className="px-3 py-2.5 border-b border-border shrink-0 space-y-2">
        <div className="relative">
          <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input type="text" value={searchTerm}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder={isAr ? "ابحث عن منتج..." : "Search products..."}
            className="w-full rounded-md border bg-background ps-8 pe-3 py-2 text-sm placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary"
            autoFocus />
          {showSuggestions && (
            <div className="absolute start-0 end-0 top-full mt-1 bg-background border border-border rounded-md shadow-lg z-10 max-h-40 overflow-y-auto">
              {suggestions.map((s, i) => (
                <button key={i} type="button"
                  onMouseDown={() => { setSearchTerm(s); setShowSuggestions(false); doSearch(s); }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-start hover:bg-muted/50 border-b border-border/20 last:border-0">
                  <Search className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span className="truncate">{s}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Action row: Search + AI + Tools + Filter */}
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={() => doSearch()} disabled={!searchTerm.trim() || loading}
            className="flex items-center gap-1 rounded-md bg-primary text-primary-foreground py-1.5 px-3 text-xs font-medium disabled:opacity-50">
            <Search className="h-3 w-3" /> {isAr ? "بحث" : "Search"}
          </button>
          <button type="button" onClick={() => doSearch()} disabled={!searchTerm.trim() || loading}
            className="flex items-center gap-1 rounded-md border border-primary/30 text-primary py-1.5 px-2 text-xs font-medium disabled:opacity-50 hover:bg-primary/5">
            <Sparkles className="h-3 w-3" /> AI
          </button>
          <div className="flex-1" />
          {/* Tools */}
          {[
            { icon: Camera, tip: "OCR" },
            { icon: ScanLine, tip: "Barcode" },
            { icon: ImageIcon, tip: "Lens" },
            { icon: FileSpreadsheet, tip: "Excel" },
          ].map((t) => (
            <button key={t.tip} type="button" title={t.tip}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/50">
              <t.icon className="h-3.5 w-3.5" />
            </button>
          ))}
          <button type="button" onClick={() => setShowFilters(!showFilters)} title={isAr ? "تصفية" : "Filters"}
            className={cn("flex h-7 w-7 items-center justify-center rounded-md border text-muted-foreground hover:text-foreground",
              showFilters ? "border-primary bg-primary/5 text-primary" : "border-border/50 hover:bg-muted/50")}>
            <Filter className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Filters (collapsible) */}
        {showFilters && (
          <div className="flex items-center gap-2 pt-1 flex-wrap">
            <div className="flex items-center gap-1">
              <input type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder={isAr ? "من" : "Min"}
                className="w-16 rounded border px-1.5 py-1 text-xs bg-background outline-none focus:ring-1 focus:ring-primary" />
              <span className="text-xs text-muted-foreground">-</span>
              <input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder={isAr ? "إلى" : "Max"}
                className="w-16 rounded border px-1.5 py-1 text-xs bg-background outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((r) => (
                <button key={r} type="button" onClick={() => setMinRating(minRating === r ? 0 : r)}>
                  <Star className={cn("h-3 w-3", r <= minRating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30")} />
                </button>
              ))}
            </div>
            <label className="flex items-center gap-1 text-[10px] text-muted-foreground cursor-pointer">
              <input type="checkbox" checked={stockOnly} onChange={(e) => setStockOnly(e.target.checked)} className="rounded border-border h-3 w-3" />
              {isAr ? "متوفر" : "Stock"}
            </label>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {!searched && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-12">
            <Search className="h-8 w-8 mb-2 opacity-15" />
            <p className="text-sm">{isAr ? "ابحث عن منتج" : "Search for products"}</p>
            <p className="text-[10px] opacity-60 mt-1">{isAr ? "ابحث باسم المنتج أو استخدم الأدوات" : "By name or use tools above"}</p>
          </div>
        )}

        {loading && results.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        )}

        {searched && !loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Package className="h-8 w-8 mb-2 opacity-15" />
            <p className="text-sm">{isAr ? "لا توجد نتائج" : "No products found"}</p>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="p-2 space-y-1.5">
            {filtered.map((product) => {
              const isAdded = addedIds.has(product.id);
              return (
                <div key={product.id} className={cn(
                  "flex items-center gap-2.5 p-2.5 rounded-lg border transition-colors",
                  isAdded ? "border-green-300 bg-green-50/30 dark:bg-green-950/10" : "border-border hover:bg-muted/30"
                )}>
                  {/* Image */}
                  <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                    {product.image
                      ? <img src={product.image} alt="" className="h-full w-full object-cover" />
                      : <Package className="h-4 w-4 text-muted-foreground/20" />}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium block truncate">{product.name}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      {product.price ? <span className="text-xs font-bold text-green-600">{product.price} OMR</span> : null}
                      {product.rating ? (
                        <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                          <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" /> {product.rating.toFixed(1)}
                        </span>
                      ) : null}
                      {product.stock ? <span className="text-[10px] text-muted-foreground">{product.stock} {isAr ? "متوفر" : "stk"}</span> : null}
                    </div>
                  </div>

                  {/* Add */}
                  <button type="button" disabled={isAdded}
                    onClick={() => { if (isAdded) return; onAddProduct(product); setAddedIds((prev) => new Set([...prev, product.id])); }}
                    className={cn("flex h-7 items-center gap-1 rounded-md px-2 text-xs font-medium shrink-0 transition-colors",
                      isAdded ? "bg-green-100 text-green-700 dark:bg-green-900/20" : "bg-primary text-primary-foreground hover:bg-primary/90")}>
                    {isAdded ? <><Check className="h-3 w-3" /> {isAr ? "تمت" : "Added"}</> : <><Plus className="h-3 w-3" /> {isAr ? "إضافة" : "Add"}</>}
                  </button>
                </div>
              );
            })}

            {hasMore && (
              <button type="button" onClick={() => doSearch(searchTerm, page + 1)} disabled={loading}
                className="flex w-full items-center justify-center py-2 rounded-md border border-dashed border-border text-xs text-muted-foreground hover:bg-muted/30">
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : (isAr ? "تحميل المزيد" : "Load more")}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
