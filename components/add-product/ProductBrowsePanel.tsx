"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  Search, Package, Star, Loader2, Sparkles, Filter, ChevronDown,
  Check, ArrowRight, Eye, Grid3X3, List, Plus, FileEdit,
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
  sku?: string;
  raw?: any;
}

interface ProductBrowsePanelProps {
  searchTerm: string | null;
  selectedId: number | null;
  onSelect: (product: ProductResult) => void;
  onCreateManual?: () => void;
  locale: string;
}

export default function ProductBrowsePanel({ searchTerm, selectedId, onSelect, onCreateManual, locale }: ProductBrowsePanelProps) {
  const isAr = locale === "ar";

  const [results, setResults] = useState<ProductResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  // Manual search override
  const [manualSearch, setManualSearch] = useState("");
  const [activeSearch, setActiveSearch] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minRating, setMinRating] = useState(0);
  const [stockOnly, setStockOnly] = useState(false);

  // Auto-search when P1 item selected
  useEffect(() => {
    if (searchTerm && searchTerm !== activeSearch) {
      setManualSearch("");
      doSearch(searchTerm, 1);
    }
  }, [searchTerm]);

  // Search
  const doSearch = useCallback(async (term: string, pageNum = 1) => {
    if (!term.trim()) return;
    setLoading(true);
    setSearched(true);
    setActiveSearch(term);
    try {
      const res = await http.get("/product/search/unified", {
        params: { q: term.trim(), page: pageNum, limit: 12 },
      });
      const products = res.data?.data?.data ?? res.data?.data ?? res.data ?? [];
      const mapped: ProductResult[] = products.map((p: any) => ({
        id: p.id,
        name: p.productName ?? p.productName_en ?? `Product #${p.id}`,
        image: p.images?.[0]?.url ?? p.productImage,
        price: Number(p.offerPrice ?? p.productPrice?.[0]?.offerPrice ?? p.productPrice ?? 0),
        stock: Number(p.productPrice?.[0]?.stock ?? p.stock ?? 0),
        rating: Number(p.averageRating ?? 0),
        seller: p.productPrice?.[0]?.user?.firstName ?? "",
        category: p.category?.categoryName_en ?? "",
        sku: p.skuNo ?? "",
        raw: p,
      }));
      if (pageNum === 1) setResults(mapped); else setResults((prev) => [...prev, ...mapped]);
      setPage(pageNum);
      setHasMore(mapped.length >= 12);
    } catch {
      if (pageNum === 1) setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Manual search with debounce
  const handleManualSearch = (value: string) => {
    setManualSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.length >= 2) {
      debounceRef.current = setTimeout(() => doSearch(value, 1), 400);
    }
  };

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
      {/* Header + search */}
      <div className="px-3 py-2.5 border-b border-border shrink-0 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold flex-1">
            {isAr ? "تصفح المنتجات" : "Browse Products"}
          </span>
          {/* View toggle */}
          <button type="button" onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-border/50 text-muted-foreground hover:text-foreground">
            {viewMode === "grid" ? <List className="h-3.5 w-3.5" /> : <Grid3X3 className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input type="text"
            value={manualSearch || ""}
            onChange={(e) => handleManualSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") doSearch(manualSearch || searchTerm || "", 1); }}
            placeholder={searchTerm ? `${isAr ? "بحث:" : "Searching:"} ${searchTerm}` : (isAr ? "ابحث عن منتج..." : "Search products...")}
            className="w-full rounded-md border bg-background ps-8 pe-3 py-2 text-sm placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Action row */}
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={() => doSearch(manualSearch || searchTerm || "", 1)}
            disabled={loading} className="flex items-center gap-1 rounded-md bg-primary text-primary-foreground py-1.5 px-3 text-xs font-medium disabled:opacity-50">
            <Search className="h-3 w-3" /> {isAr ? "بحث" : "Search"}
          </button>
          <button type="button" onClick={() => doSearch(manualSearch || searchTerm || "", 1)}
            disabled={loading} className="flex items-center gap-1 rounded-md border border-primary/30 text-primary py-1.5 px-2 text-xs font-medium disabled:opacity-50 hover:bg-primary/5">
            <Sparkles className="h-3 w-3" /> AI
          </button>
          <div className="flex-1" />
          <button type="button" onClick={() => setShowFilters(!showFilters)}
            className={cn("flex h-7 w-7 items-center justify-center rounded-md border text-muted-foreground hover:text-foreground",
              showFilters ? "border-primary bg-primary/5 text-primary" : "border-border/50")}>
            <Filter className="h-3.5 w-3.5" />
          </button>
          <span className="text-[10px] text-muted-foreground">{filtered.length} {isAr ? "نتيجة" : "results"}</span>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1">
              <input type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="Min"
                className="w-14 rounded border px-1.5 py-1 text-xs bg-background outline-none focus:ring-1 focus:ring-primary" />
              <span className="text-xs text-muted-foreground">-</span>
              <input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="Max"
                className="w-14 rounded border px-1.5 py-1 text-xs bg-background outline-none focus:ring-1 focus:ring-primary" />
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
        {/* Manual create — always first, always visible */}
        {searchTerm && (
          <div className="px-2 pt-2">
            <button type="button" onClick={() => onCreateManual?.()}
              className={cn(
                "flex w-full items-center gap-3 p-2.5 rounded-lg border text-start transition-all",
                selectedId === -1 ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border hover:border-primary/30 hover:bg-muted/20"
              )}>
              <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center shrink-0">
                <Plus className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium block truncate">{searchTerm}</span>
                <span className="text-xs text-muted-foreground">{isAr ? "إنشاء يدوي" : "Create manually"}</span>
              </div>
            </button>
          </div>
        )}

        {!searched && !loading && !searchTerm && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6">
            <Search className="h-10 w-10 mb-3 opacity-10" />
            <p className="text-sm font-medium">{isAr ? "اختر منتج من القائمة" : "Select a product from the list"}</p>
            <p className="text-xs opacity-60 mt-1 text-center">{isAr ? "أو ابحث يدوياً" : "Or search manually"}</p>
          </div>
        )}

        {loading && results.length === 0 && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        )}

        {searched && !loading && filtered.length === 0 && searchTerm && (
          <div className="flex flex-col items-center py-6 text-muted-foreground">
            <p className="text-xs">{isAr ? "لا توجد منتجات مشابهة" : "No similar products in database"}</p>
          </div>
        )}

        {/* List view */}
        {viewMode === "list" && filtered.length > 0 && (
          <div className="p-2 space-y-1">
            {filtered.map((product) => {
              const isSel = product.id === selectedId;
              return (
                <button key={product.id} type="button" onClick={() => onSelect(product)}
                  className={cn(
                    "flex w-full items-center gap-3 p-2.5 rounded-lg border text-start transition-all",
                    isSel ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border hover:border-primary/30 hover:bg-muted/20"
                  )}>
                  <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                    {product.image
                      ? <img src={product.image} alt="" className="h-full w-full object-cover" />
                      : <Package className="h-4 w-4 text-muted-foreground/20" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={cn("text-sm block truncate", isSel ? "font-bold" : "font-medium")}>{product.name}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      {product.price ? <span className="text-xs font-bold text-green-600">{product.price} OMR</span> : null}
                      {product.rating ? (
                        <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                          <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" /> {product.rating.toFixed(1)}
                        </span>
                      ) : null}
                      {product.sku && <span className="text-[10px] text-muted-foreground font-mono">{product.sku}</span>}
                    </div>
                    {product.category && <span className="text-[9px] text-muted-foreground/60">{product.category}</span>}
                  </div>
                  {isSel ? <Check className="h-4 w-4 text-primary shrink-0" /> : <Eye className="h-4 w-4 text-muted-foreground/30 shrink-0" />}
                </button>
              );
            })}
          </div>
        )}

        {/* Grid view */}
        {viewMode === "grid" && filtered.length > 0 && (
          <div className="p-2 grid grid-cols-2 gap-2">
            {filtered.map((product) => {
              const isSel = product.id === selectedId;
              return (
                <button key={product.id} type="button" onClick={() => onSelect(product)}
                  className={cn(
                    "flex flex-col rounded-lg border text-start transition-all overflow-hidden",
                    isSel ? "border-primary ring-1 ring-primary/20" : "border-border hover:border-primary/30"
                  )}>
                  <div className="h-24 bg-muted flex items-center justify-center overflow-hidden">
                    {product.image
                      ? <img src={product.image} alt="" className="h-full w-full object-cover" />
                      : <Package className="h-6 w-6 text-muted-foreground/10" />}
                  </div>
                  <div className="p-2">
                    <span className="text-xs font-medium block truncate">{product.name}</span>
                    <div className="flex items-center gap-1.5 mt-1">
                      {product.price ? <span className="text-xs font-bold text-green-600">{product.price}</span> : null}
                      {product.rating ? (
                        <span className="flex items-center gap-0.5 text-[9px] text-muted-foreground">
                          <Star className="h-2 w-2 fill-amber-400 text-amber-400" /> {product.rating.toFixed(1)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  {isSel && <div className="h-0.5 bg-primary" />}
                </button>
              );
            })}
          </div>
        )}

        {/* Load more */}
        {hasMore && (
          <div className="p-2">
            <button type="button" onClick={() => doSearch(activeSearch || searchTerm || "", page + 1)}
              disabled={loading}
              className="flex w-full items-center justify-center py-2 rounded-md border border-dashed border-border text-xs text-muted-foreground hover:bg-muted/30">
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : (isAr ? "تحميل المزيد" : "Load more")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
