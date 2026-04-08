/**
 * ItemDetailPanel — Panel 3 of Product Hub (/product-hub)
 *
 * Features: Product search, 8-chip filter system, product detail view,
 *           buy/customize tab, specs & requirements tab
 *
 * Filter system docs: docs/filter-chip-system.md
 * Product Hub docs:   frontend/docs/PRODUCT-HUB.md
 * Search engine docs: docs/product-intelligence-engine.md
 *
 * Backend endpoints:
 *   GET /product/search/unified  — Intelligent search with filter chips
 *   GET /product/getAllProduct    — Fallback traditional search
 *   GET /product/findOne          — Full product detail
 */
"use client";
import React, { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import http from "@/apis/http";
import { getApiUrl } from "@/config/api";
import { track } from "@/lib/analytics";
import {
  Star, ShoppingCart, Send, Paperclip, MapPin, Truck, Shield,
  MessageSquare, FileText, X, Image, Edit3, ChevronDown, ChevronUp,
  Check, Eye, CreditCard, Zap, Minus, Plus, SlidersHorizontal, ArrowUpDown, RotateCcw, Wrench, ChevronRight, Loader2,
  Store, Package, Users, Tag, Percent, Briefcase, Layers, LayoutGrid, List,
} from "lucide-react";

// ─── Filter chip definitions ────────────────────────────────────
type FilterChipKey = "retail" | "wholesale" | "buygroup" | "customizable" | "discount" | "rfq" | "vendor_store" | "service";

interface FilterChipDef {
  key: FilterChipKey;
  label: string;
  labelAr: string;
  icon: React.ElementType;
  color: string;       // Tailwind ring/bg color suffix
  /** Maps to backend query params */
  params: Record<string, string>;
}

// Active/inactive styles per chip — fully spelled out for Tailwind JIT
const CHIP_STYLES: Record<string, { active: string; inactive: string }> = {
  blue:    { active: "bg-blue-100 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 ring-1 ring-blue-200", inactive: "" },
  indigo:  { active: "bg-indigo-100 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-200", inactive: "" },
  violet:  { active: "bg-violet-100 dark:bg-violet-950/30 border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300 ring-1 ring-violet-200", inactive: "" },
  amber:   { active: "bg-amber-100 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 ring-1 ring-amber-200", inactive: "" },
  rose:    { active: "bg-rose-100 dark:bg-rose-950/30 border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300 ring-1 ring-rose-200", inactive: "" },
  primary: { active: "bg-primary/10 border-primary/30 text-primary ring-1 ring-primary/20", inactive: "" },
  emerald: { active: "bg-emerald-100 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-200", inactive: "" },
  cyan:    { active: "bg-cyan-100 dark:bg-cyan-950/30 border-cyan-300 dark:border-cyan-700 text-cyan-700 dark:text-cyan-300 ring-1 ring-cyan-200", inactive: "" },
};

const FILTER_CHIPS: FilterChipDef[] = [
  { key: "retail",        label: "Retail",        labelAr: "تجزئة",         icon: ShoppingCart, color: "blue",    params: { productType: "P", sellType: "NORMALSELL" } },
  { key: "wholesale",     label: "Wholesale",     labelAr: "جملة",          icon: Package,      color: "indigo",  params: { productType: "F" } },
  { key: "buygroup",      label: "Buy Group",     labelAr: "مجموعة شراء",   icon: Users,        color: "violet",  params: { sellType: "BUYGROUP" } },
  { key: "customizable",  label: "Customizable",  labelAr: "قابل للتخصيص",  icon: Wrench,       color: "amber",   params: { isCustomProduct: "true" } },
  { key: "discount",      label: "Discount",      labelAr: "خصم",           icon: Percent,      color: "rose",    params: { hasDiscount: "true" } },
  { key: "rfq",           label: "RFQ",           labelAr: "طلب أسعار",     icon: FileText,     color: "primary", params: { productType: "R" } },
  { key: "vendor_store",  label: "Vendor Store",  labelAr: "متاجر البائعين", icon: Store,        color: "emerald", params: {} },
  { key: "service",       label: "Service",       labelAr: "خدمات",          icon: Briefcase,    color: "cyan",    params: {} },
];

// ─── Component ──────────────────────────────────────────────────
interface ItemDetailPanelProps {
  selectedItemId: string | null;
  searchTerm?: string;
  onAddToCart: (productId: number) => void;
  onSelectProduct?: (product: any) => void;
  locale: string;
  activeCategories?: Set<string>;
  onCategoryChange?: (categories: Set<string>) => void;
}

export default function ItemDetailPanel({ selectedItemId, searchTerm, onAddToCart, onSelectProduct, locale, activeCategories, onCategoryChange }: ItemDetailPanelProps) {
  const isAr = locale === "ar";
  const [chatInput, setChatInput] = useState("");
  const [searchPage, setSearchPage] = useState(1);

  // AI usage: 50/day free — TODO: track via API, for now localStorage
  const [aiUsedToday] = useState(() => {
    if (typeof window === "undefined") return 0;
    try {
      const stored = JSON.parse(localStorage.getItem("us_ai_suggest") ?? "{}");
      const today = new Date().toDateString();
      return stored.date === today ? (stored.count ?? 0) : 0;
    } catch { return 0; }
  });
  const aiResetHours = Math.max(1, 24 - new Date().getHours());
  const PRODUCTS_PER_PAGE = 5;

  // ── Filter chips state — synced with parent (Panel 2 shares same state) ──
  const [localChips, setLocalChips] = useState<Set<FilterChipKey>>(new Set());
  const activeChipsEarly = (activeCategories ?? localChips) as Set<FilterChipKey>;
  const setActiveChipsEarly = (val: Set<FilterChipKey> | ((prev: Set<FilterChipKey>) => Set<FilterChipKey>)) => {
    if (typeof val === "function") {
      const next = val(activeChipsEarly);
      if (onCategoryChange) onCategoryChange(next);
      else setLocalChips(next);
    } else {
      if (onCategoryChange) onCategoryChange(val);
      else setLocalChips(val);
    }
  };
  // Collect active chip definitions (not merged — kept separate for OR logic)
  const activeChipDefs = useMemo(() =>
    FILTER_CHIPS.filter((c) => activeChipsEarly.has(c.key)),
    [activeChipsEarly],
  );
  // For single-chip search mode, merge params (backward compat)
  const chipFilterParamsEarly = useMemo(() => {
    if (activeChipDefs.length === 1) return { ...activeChipDefs[0].params };
    // Multi-chip: don't merge (would overwrite), handle in queryFn with OR logic
    if (activeChipDefs.length > 1) return { _multiChip: "true" };
    return {};
  }, [activeChipDefs]);

  // Reset page when search term or filters change
  useEffect(() => { setSearchPage(1); }, [searchTerm]);

  // Detect browse mode: chips active but no search term
  const hasActiveChips = activeChipsEarly.size > 0;
  const isBrowseMode = hasActiveChips && !searchTerm?.trim();

  // ── Real product search — uses unified intelligent search ──
  // Fires on search term OR chip-only browse
  const productSearchQuery = useQuery({
    queryKey: ["product-hub-search", searchTerm, searchPage, JSON.stringify(chipFilterParamsEarly)],
    queryFn: async () => {
      const cleanTerm = searchTerm?.trim() || "";
      const hasFilters = Object.keys(chipFilterParamsEarly).length > 0;
      if (!cleanTerm && !hasFilters) return { data: [], totalCount: 0 };

      // ── Browse mode: no search term, chips only → use getAllProduct + OR filter ──
      if (!cleanTerm && hasFilters) {
        try {
          const res = await http.get(`${getApiUrl()}/product/getAllProduct`, {
            params: { page: 1, limit: 200 }, // fetch large set, OR-filter client-side
          });
          const allProducts = res.data?.data ?? [];

          // OR logic: product passes if it matches ANY active chip's criteria
          const matchesChip = (p: any, chip: typeof FILTER_CHIPS[0]) => {
            const cp = chip.params;
            if (cp.productType && p.productType !== cp.productType) return false;
            if (cp.sellType) {
              // Check if any ProductPrice entry matches the sellType
              const prices = p.product_productPrice ?? [];
              const hasSellType = prices.some((pp: any) => pp.sellType === cp.sellType && !pp.deletedAt);
              if (!hasSellType) return false;
            }
            if (cp.hasDiscount === "true" && !(Number(p.offerPrice) > 0 && Number(p.offerPrice) < Number(p.productPrice))) return false;
            if (cp.isCustomProduct === "true" && p.isCustomProduct !== true) return false;
            // Chips with no params (vendor_store, service) — show all
            if (Object.keys(cp).length === 0) return true;
            return true;
          };

          const filtered = activeChipDefs.length > 0
            ? allProducts.filter((p: any) => activeChipDefs.some((chip) => matchesChip(p, chip)))
            : allProducts;

          // Sort by views (trending)
          filtered.sort((a: any, b: any) => (b.productViewCount ?? 0) - (a.productViewCount ?? 0));
          const page = filtered.slice((searchPage - 1) * PRODUCTS_PER_PAGE, searchPage * PRODUCTS_PER_PAGE);
          return { data: page, totalCount: filtered.length };
        } catch (err: any) {
          console.error("[Browse] getAllProduct failed:", err?.message);
          return { data: [], totalCount: 0 };
        }
      }

      // ── Search mode: term + optional chip filters ──
      try {
        const res = await http.get(`${getApiUrl()}/product/search/unified`, {
          params: { q: cleanTerm, page: searchPage, limit: PRODUCTS_PER_PAGE, ...chipFilterParamsEarly },
        });
        const data = res.data?.data ?? [];
        const totalCount = res.data?.totalCount ?? 0;
        if (Array.isArray(data) && data.length > 0) return { data, totalCount };
      } catch (err: any) {
        console.error("[Search] Unified failed:", err?.response?.status, err?.message);
      }
      // Fallback to traditional search
      try {
        const res = await http.get(`${getApiUrl()}/product/getAllProduct`, { params: { page: searchPage, limit: PRODUCTS_PER_PAGE, term: cleanTerm } });
        return { data: res.data?.data ?? [], totalCount: res.data?.totalCount ?? 0 };
      } catch {}
      return { data: [], totalCount: 0 };
    },
    enabled: (!!searchTerm && searchTerm.length >= 1) || hasActiveChips,
    staleTime: 30_000,
  });

  // Map real products
  const totalProductCount = productSearchQuery?.data?.totalCount ?? 0;
  const totalPages = Math.ceil(totalProductCount / PRODUCTS_PER_PAGE);

  // Group by model (deduplicate by product name) — show unique models, not duplicate listings
  const realProducts = useMemo(() => {
    const data = productSearchQuery?.data?.data ?? [];
    if (!Array.isArray(data) || data.length === 0) return null;

    // Group by normalized product name → unique models
    const modelMap = new Map<string, {
      id: number;
      name: string;
      minPrice: number;
      maxPrice: number;
      sellers: number;
      bestRating: number;
      totalReviews: number;
      allIds: number[];
    }>();

    for (const p of data) {
      const name = (p.productName ?? p.name ?? `Product #${p.id}`).trim();
      // Normalize: trim to first 80 chars for grouping (handles slight title variations)
      const key = name.substring(0, 80).toLowerCase();
      const price = Number(p.offerPrice ?? p.productPrice ?? 0);

      if (modelMap.has(key)) {
        const model = modelMap.get(key)!;
        model.minPrice = Math.min(model.minPrice, price);
        model.maxPrice = Math.max(model.maxPrice, price);
        model.sellers++;
        model.bestRating = Math.max(model.bestRating, p.rating ?? 4.0);
        model.totalReviews += p.reviewCount ?? 0;
        model.allIds.push(p.id);
      } else {
        modelMap.set(key, {
          id: p.id,
          name,
          minPrice: price,
          maxPrice: price,
          sellers: 1,
          bestRating: p.rating ?? 4.0,
          totalReviews: p.reviewCount ?? 0,
          allIds: [p.id],
        });
      }
    }

    return Array.from(modelMap.values()).map((m) => ({
      id: m.id,
      name: m.name,
      price: m.minPrice,
      priceRange: m.minPrice !== m.maxPrice ? `${m.minPrice} - ${m.maxPrice}` : null,
      rating: m.bestRating,
      reviews: m.totalReviews,
      seller: m.sellers > 1 ? `${m.sellers} sellers` : "1 seller",
      delivery: "3-5 days",
      inStock: true,
      stock: 50,
      specs: [] as string[][],
      sellersCount: m.sellers,
      allIds: m.allIds,
    }));
  }, [productSearchQuery?.data]);

  const [activeTab, setActiveTab] = useState<"products" | "customize" | "buynow">("products");
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

  // ── Recommended products: search-based similar products when few matches ──
  const topProduct = (realProducts ?? [])[0];
  const needsRecommendations = (realProducts ?? []).length < 5 && !!topProduct;
  // Extract 2-3 key words from product name for broader search
  const similarSearchTerm = useMemo(() => {
    if (!topProduct?.name) return "";
    const words = topProduct.name.split(/\s+/).filter((w: string) => w.length > 3);
    // Take first 2-3 significant words (skip brand-like short words)
    return words.slice(0, 3).join(" ");
  }, [topProduct?.name]);

  const recommendedQuery = useQuery({
    queryKey: ["product-hub-similar", similarSearchTerm],
    queryFn: async () => {
      if (!similarSearchTerm) return { data: [], totalCount: 0 };
      try {
        const res = await http.get(`${getApiUrl()}/product/search/unified`, {
          params: { q: similarSearchTerm, page: 1, limit: 10 },
        });
        return { data: res.data?.data ?? [], totalCount: res.data?.totalCount ?? 0 };
      } catch { return { data: [], totalCount: 0 }; }
    },
    enabled: needsRecommendations && activeTab === "products" && similarSearchTerm.length > 3,
    staleTime: 60_000,
  });

  // Map and deduplicate recommended products
  const recommendedProducts = useMemo(() => {
    const items = recommendedQuery?.data?.data ?? [];
    if (!Array.isArray(items) || items.length === 0) return [];
    // Deduplicate: exclude products already shown in main results (by name prefix)
    const existingNames = new Set((realProducts ?? []).map((p: any) => (p.name || "").substring(0, 80).toLowerCase()));
    const existingIds = new Set((realProducts ?? []).map((p: any) => p.id));

    // Group similar results into models (same dedup as main results)
    const modelMap = new Map<string, any>();
    for (const p of items) {
      const name = (p.productName ?? p.name ?? "").trim();
      const key = name.substring(0, 80).toLowerCase();
      if (existingNames.has(key) || existingIds.has(p.id)) continue;
      if (modelMap.has(key)) {
        modelMap.get(key).sellers++;
      } else {
        modelMap.set(key, {
          id: p.id,
          name,
          price: Number(p.offerPrice ?? p.productPrice ?? 0),
          rating: p.rating ?? 4.0,
          reviews: p.reviewCount ?? 0,
          seller: "1 seller",
          sellers: 1,
          delivery: "3-5 days",
          inStock: true,
          stock: 50,
          specs: [] as string[][],
          isRecommended: true,
        });
      }
    }

    return Array.from(modelMap.values())
      .map(m => ({ ...m, seller: m.sellers > 1 ? `${m.sellers} sellers` : "1 seller", sellersCount: m.sellers }))
      .slice(0, 6);
  }, [recommendedQuery?.data, realProducts]);

  // ── Buy/Customize: fetch SAME product detail with ALL sellers ──
  const selectedProductForBuy = (realProducts ?? []).find((p: any) => p.id === selectedProductId);
  const buyDetailQuery = useQuery({
    queryKey: ["product-buy-detail", selectedProductId],
    queryFn: async () => {
      if (!selectedProductId) return null;
      try {
        const res = await http.get(`${getApiUrl()}/product/findOne`, {
          params: { productId: selectedProductId },
        });
        return res.data?.data ?? res.data ?? null;
      } catch { return null; }
    },
    enabled: !!selectedProductId && activeTab === "buynow",
    staleTime: 60_000,
  });
  // Keep old name for compatibility in JSX
  const buySearchQuery = { isLoading: buyDetailQuery.isLoading, data: buyDetailQuery.data };

  // Map ALL sellers from product_productPrice into individual listing cards
  const buyListings = useMemo(() => {
    const detail = buyDetailQuery.data;
    if (!detail) return [];
    const priceEntries = detail.product_productPrice ?? [];
    if (priceEntries.length === 0) return [];

    return priceEntries
      .filter((pp: any) => !pp.deletedAt && pp.status !== "DELETE")
      .map((pp: any) => {
        const admin = pp.adminDetail;
        const sellerName = admin?.companyName || admin?.accountName
          || (admin?.firstName ? `${admin.firstName} ${admin.lastName || ""}`.trim() : null)
          || "Seller";
        return {
          id: `${detail.id}-${pp.id}`,
          productId: detail.id,
          priceId: pp.id,
          name: detail.productName ?? "Product",
          seller: sellerName,
          sellerAvatar: admin?.profilePicture || null,
          price: Number(pp.offerPrice ?? pp.productPrice ?? detail.offerPrice ?? 0),
          originalPrice: Number(pp.productPrice ?? detail.productPrice ?? 0),
          rating: detail.averageRating ?? 4.0,
          reviews: detail.productReview?.length ?? 0,
          stock: pp.stock ?? 0,
          delivery: pp.deliveryAfter ? `${pp.deliveryAfter} days` : "3-5 days",
          inStock: (pp.stock ?? 0) > 0,
          sellType: pp.sellType ?? "NORMALSELL",
          condition: pp.productCondition ?? "New",
          brand: detail.brand?.brandName ?? "",
          category: detail.category?.name ?? "",
          description: detail.description ?? detail.shortDescription ?? "",
          minOrder: pp.minOrder ?? 1,
          warranty: pp.warranty ?? "",
        };
      });
  }, [buyDetailQuery.data]);

  // (moved up — declared before recommended/buy queries that reference them)
  const [specsOpen, setSpecsOpen] = useState(true);

  // Reset product selection and tab when switching items
  useEffect(() => {
    setSelectedProductId(null);
    setViewingProductId(null);
    setActiveTab("products");
    if (searchTerm) track("rfq_product_search", { term: searchTerm });
  }, [selectedItemId, searchTerm]);
  const [customerNote, setCustomerNote] = useState("Need for corporate use. Prefer black or silver.\nBulk packaging OK. Must include carrying case.");
  const [noteAttachments, setNoteAttachments] = useState<string[]>(["requirements.pdf", "reference-photo.jpg"]);
  const [viewingProductId, setViewingProductId] = useState<number | null>(null);
  const [chatExpanded, setChatExpanded] = useState(false);
  // "rfq" = send to all vendors, "vendor" = send to specific product's vendor
  const [reqMode, setReqMode] = useState<"rfq" | "vendor">("rfq");
  const [vendorMsg, setVendorMsg] = useState("");
  const [vendorAttachments, setVendorAttachments] = useState<string[]>([]);
  const vendorFileRef = React.useRef<HTMLInputElement>(null);
  const [sortBy, setSortBy] = useState("price-asc");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  // activeChips/chipFilterParams are aliased from early declarations (before search query)
  const activeChips = activeChipsEarly;
  const setActiveChips = setActiveChipsEarly;
  const [filtersOpen, setFiltersOpen] = useState(false);
  // Dynamic filter values: key → value (string for SELECT, [min,max] for NUMBER, Set for MULTI_SELECT, boolean for BOOLEAN)
  const [filterValues, setFilterValues] = useState<Record<string, any>>({});
  // Base filters (always present regardless of category)
  const [minRating, setMinRating] = useState(0);
  const [stockOnly, setStockOnly] = useState(true);
  const [discountOnly, setDiscountOnly] = useState(false);

  // Mock category filters — in production, fetched from GET /specification/filters/{categoryId}
  const CATEGORY_FILTERS: Array<{
    key: string; name: string; nameAr?: string; dataType: "TEXT" | "NUMBER" | "SELECT" | "MULTI_SELECT" | "BOOLEAN";
    unit?: string; options?: string; groupName?: string;
  }> = [
    { key: "anc_type", name: "Noise Cancelling", nameAr: "إلغاء الضوضاء", dataType: "SELECT", options: "Active ANC,Passive,Adaptive ANC,None", groupName: "Audio" },
    { key: "bluetooth", name: "Bluetooth", nameAr: "بلوتوث", dataType: "SELECT", options: "5.0,5.1,5.2,5.3", groupName: "Connectivity" },
    { key: "battery_hours", name: "Battery Life", nameAr: "عمر البطارية", dataType: "NUMBER", unit: "hrs", groupName: "Power" },
    { key: "driver_size", name: "Driver Size", nameAr: "حجم المحرك", dataType: "NUMBER", unit: "mm", groupName: "Audio" },
    { key: "weight", name: "Weight", nameAr: "الوزن", dataType: "NUMBER", unit: "g", groupName: "Physical" },
    { key: "foldable", name: "Foldable", nameAr: "قابل للطي", dataType: "BOOLEAN", groupName: "Physical" },
    { key: "multipoint", name: "Multipoint", nameAr: "تعدد الاتصال", dataType: "BOOLEAN", groupName: "Connectivity" },
    { key: "warranty", name: "Warranty", nameAr: "الكفالة", dataType: "SELECT", options: "6 months,1 year,2 years,3 years", groupName: "Support" },
    { key: "delivery", name: "Delivery", nameAr: "التوصيل", dataType: "SELECT", options: "1-2 days,3-5 days,5-7 days,7+ days", groupName: "Shipping" },
  ];

  // Group filters by groupName
  const filterGroups = CATEGORY_FILTERS.reduce<Record<string, typeof CATEGORY_FILTERS>>((acc, f) => {
    const group = f.groupName ?? "Other";
    if (!acc[group]) acc[group] = [];
    acc[group].push(f);
    return acc;
  }, {});

  const setFilterValue = (key: string, value: any) => {
    setFilterValues((prev) => {
      const next = { ...prev };
      // Remove empty values
      if (value === "" || value === false || value === null || value === undefined ||
        (Array.isArray(value) && value.length === 0) || (value instanceof Set && value.size === 0)) {
        delete next[key];
      } else {
        next[key] = value;
      }
      return next;
    });
  };

  const toggleMultiSelect = (key: string, option: string) => {
    setFilterValues((prev) => {
      const current: Set<string> = prev[key] instanceof Set ? new Set(prev[key]) : new Set();
      if (current.has(option)) current.delete(option); else current.add(option);
      return { ...prev, [key]: current.size > 0 ? current : undefined };
    });
  };

  // Toggle a filter chip on/off
  const toggleChip = (key: FilterChipKey) => {
    setActiveChips((prev: Set<FilterChipKey>) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
    setSearchPage(1); // Reset pagination on filter change
  };

  const activeFilterCount = Object.keys(filterValues).length + (minRating > 0 ? 1 : 0) + (stockOnly ? 1 : 0) + (discountOnly ? 1 : 0) + activeChips.size;

  const clearAllFilters = () => {
    setFilterValues({});
    setMinRating(0);
    setStockOnly(false);
    setDiscountOnly(false);
    setActiveChips(new Set());
  };

  // Real products only — no mock fallback
  const selectedProduct = (realProducts ?? []).find((p: any) => p.id === selectedProductId);
  // Real buy listings only
  const viewingProduct = (buyListings ?? []).find((p: any) => p.id === viewingProductId);
  // Vendor listings from real search data
  const vendorListings = selectedProductId && selectedProduct
    ? [{
        id: selectedProduct.id,
        seller: selectedProduct.seller || "Vendor",
        rating: selectedProduct.rating || 4.0,
        reviews: selectedProduct.reviews || 0,
        price: selectedProduct.price || 0,
        originalPrice: selectedProduct.price ? selectedProduct.price * 1.2 : 0,
        discount: 15,
        stock: selectedProduct.stock || 50,
        delivery: selectedProduct.delivery || "3-5 days",
        minOrder: 1,
        condition: "New",
        sellType: "retail",
      }]
    : [];


  const [detailQty, setDetailQty] = useState(1);
  const [activeMediaIdx, setActiveMediaIdx] = useState(0);
  // Reset media index when viewing different product
  useEffect(() => { setActiveMediaIdx(0); }, [viewingProductId]);
  // Per-product quantity map for card steppers
  const [cardQtys, setCardQtys] = useState<Record<number, number>>({});
  const getCardQty = (id: number) => cardQtys[id] ?? 0;
  const setCardQty = (id: number, qty: number) => setCardQtys((prev) => ({ ...prev, [id]: Math.max(0, qty) }));

  // ── Fetch full product detail when viewing ──
  const productDetailQuery = useQuery({
    queryKey: ["product-detail", viewingProductId],
    queryFn: async () => {
      if (!viewingProductId) return null;
      try {
        const res = await http.get(`${getApiUrl()}/product/findOne`, { params: { productId: viewingProductId } });
        return res.data?.data ?? res.data ?? null;
      } catch { return null; }
    },
    enabled: !!viewingProductId,
    staleTime: 60_000,
  });

  // ═══ FULL PRODUCT DETAIL VIEW (takes over panel) ═══
  if (viewingProductId && (viewingProduct || productDetailQuery.data)) {
    const detail = productDetailQuery.data;
    const priceEntry = detail?.product_productPrice?.[0];
    const sellerDetail = priceEntry?.adminDetail;
    const sellerName = sellerDetail?.companyName || sellerDetail?.accountName
      || (sellerDetail?.firstName ? `${sellerDetail.firstName} ${sellerDetail.lastName || ""}`.trim() : null)
      || viewingProduct?.seller || "Seller";
    const realPrice = viewingProduct?.price || Number(priceEntry?.offerPrice || detail?.offerPrice || detail?.productPrice || 0);
    const realOriginalPrice = Number(priceEntry?.productPrice || detail?.productPrice || realPrice);
    const realStock = priceEntry?.stock ?? viewingProduct?.stock ?? 0;
    const realReviewCount = detail?.productReview?.length || 0;
    const realRating = detail?.averageRating || (realReviewCount > 0 ? detail.productReview.reduce((s: number, r: any) => s + (r.rating || 0), 0) / realReviewCount : 0);
    const sellerProfile = sellerDetail?.userProfile?.[0];

    const vp = {
      ...(viewingProduct || {}),
      id: viewingProductId,
      name: detail?.productName || viewingProduct?.name || "Product",
      seller: sellerName,
      sellerVerified: !!sellerProfile,
      sellerLocation: sellerProfile?.companyAddress || detail?.placeOfOrigin?.countryName || "",
      price: realPrice,
      originalPrice: realOriginalPrice,
      discount: realOriginalPrice > realPrice ? Math.round((1 - realPrice / realOriginalPrice) * 100) : 0,
      rating: realRating,
      reviewCount: realReviewCount,
      stock: realStock,
      condition: priceEntry?.productCondition || "New",
      delivery: priceEntry?.deliveryAfter ? `${priceEntry.deliveryAfter} days` : viewingProduct?.delivery || "3-5 days",
      description: detail?.description || detail?.shortDescription || "",
      specs: detail?.productSpecValues?.map((s: any) => [s.specTemplate?.name || s.key, s.value]) || [],
      images: detail?.productImages?.filter((img: any) => img.image)?.map((img: any) => img.image) || [],
      videos: detail?.productImages?.filter((img: any) => img.video)?.map((img: any) => img.video) || [],
      // Combined media: images first, then videos
      media: [
        ...(detail?.productImages?.filter((img: any) => img.image)?.map((img: any) => ({ type: "image" as const, src: img.image })) || []),
        ...(detail?.productImages?.filter((img: any) => img.video)?.map((img: any) => ({ type: "video" as const, src: img.video })) || []),
      ],
      reviews: detail?.productReview || [],
      brand: detail?.brand?.brandName || "",
      category: detail?.category?.name || "",
      skuNo: detail?.skuNo || "",
    };
    const bulkPricing = [
      { min: 1, max: 9, price: vp.price },
      { min: 10, max: 49, price: Math.round(vp.price * 0.95) },
      { min: 50, max: 99, price: Math.round(vp.price * 0.9) },
      { min: 100, max: null, price: Math.round(vp.price * 0.85) },
    ];
    const productReviews = (vp.reviews || []).map((r: any) => ({
      user: r.user?.firstName || r.userName || "User",
      rating: r.rating || 4,
      text: r.description || r.title || "",
      date: r.createdAt ? new Date(r.createdAt).toLocaleDateString("en", { month: "short", day: "numeric" }) : "",
    }));

    return (
      <div className="flex flex-col h-full min-h-0 bg-background">
        {/* Back header */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-border shrink-0">
          <button type="button" onClick={() => setViewingProductId(null)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ChevronDown className="h-3.5 w-3.5 rotate-90" /> {isAr ? "رجوع" : "Back"}
          </button>
          <span className="ms-auto text-xs text-muted-foreground">{vp.seller}</span>
        </div>

        {/* Scrollable detail */}
        <div className="flex-1 overflow-y-auto">
          {/* Image/Video gallery — main + side thumbnails */}
          <div className="bg-muted/20 p-3">
            {vp.media.length > 0 ? (
              <div className="flex gap-2">
                {/* Main display */}
                <div className="flex-1 h-56 rounded-lg overflow-hidden bg-muted relative">
                  {vp.media[activeMediaIdx]?.type === "video" ? (
                    <video
                      src={vp.media[activeMediaIdx].src}
                      controls
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <img
                      src={vp.media[activeMediaIdx]?.src || vp.images[0]}
                      alt={vp.name}
                      className="h-full w-full object-contain"
                    />
                  )}
                  {/* Media counter badge */}
                  {vp.media.length > 1 && (
                    <span className="absolute bottom-2 end-2 text-[9px] bg-black/60 text-white px-1.5 py-0.5 rounded">
                      {activeMediaIdx + 1}/{vp.media.length}
                    </span>
                  )}
                </div>
                {/* Side thumbnails */}
                {vp.media.length > 1 && (
                  <div className="flex flex-col gap-1.5 w-14 overflow-y-auto max-h-56 scrollbar-thin">
                    {vp.media.map((m: { type: string; src: string }, i: number) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setActiveMediaIdx(i)}
                        className={cn(
                          "h-12 w-14 rounded border-2 overflow-hidden bg-muted shrink-0 relative",
                          i === activeMediaIdx ? "border-primary ring-1 ring-primary/30" : "border-transparent hover:border-muted-foreground/30"
                        )}
                      >
                        {m.type === "video" ? (
                          <>
                            <video src={m.src} className="h-full w-full object-cover" muted />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                              <div className="h-4 w-4 rounded-full bg-white/80 flex items-center justify-center">
                                <div className="w-0 h-0 border-t-[3px] border-b-[3px] border-s-[5px] border-transparent border-s-black/70 ms-0.5" />
                              </div>
                            </div>
                          </>
                        ) : (
                          <img src={m.src} alt="" className="h-full w-full object-cover" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 h-40 rounded-lg bg-muted flex items-center justify-center">
                <ShoppingCart className="h-12 w-12 text-muted-foreground/10" />
              </div>
            )}
            {productDetailQuery.isLoading && (
              <div className="flex items-center justify-center py-2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-xs text-muted-foreground ms-2">{isAr ? "جاري التحميل..." : "Loading details..."}</span>
              </div>
            )}
          </div>

          <div className="px-4 py-3 space-y-4">
            {/* Title + Seller side by side */}
            <div className="flex gap-4">
              {/* Product info */}
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-bold">{selectedProduct?.name ?? vp.seller}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xl font-bold text-green-600">{vp.price} OMR</span>
                  {vp.discount > 0 && (
                    <>
                      <span className="text-sm text-muted-foreground line-through">{vp.originalPrice} OMR</span>
                      <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-1.5 py-0.5 rounded font-semibold">-{vp.discount}%</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-1 mt-1.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={cn("h-3.5 w-3.5", s <= Math.round(vp.rating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20")} />
                  ))}
                  <span className="text-xs text-muted-foreground ms-1">{vp.rating > 0 ? vp.rating.toFixed(1) : "—"} ({vp.reviewCount})</span>
                </div>
              </div>

              {/* Seller card — beside product name */}
              <div className="shrink-0 w-36 rounded-lg border border-border p-2.5 bg-muted/10">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                    {vp.seller.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-semibold block truncate">{vp.seller}</span>
                    {vp.sellerVerified && <span className="text-[8px] text-green-600 flex items-center gap-0.5"><Check className="h-2 w-2" />{isAr ? "موثق" : "Verified"}</span>}
                  </div>
                </div>
                <div className="flex items-center justify-between text-[9px] text-muted-foreground">
                  {vp.sellerLocation && <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" /> {vp.sellerLocation}</span>}
                  <span className="flex items-center gap-0.5"><Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" /> {vp.rating > 0 ? vp.rating.toFixed(1) : "—"}</span>
                </div>
                <div className="text-[8px] text-muted-foreground mt-1">
                  {vp.stock > 0 ? <span className="text-green-600">{vp.stock} {isAr ? "متوفر" : "in stock"}</span> : <span className="text-amber-600">{isAr ? "اتصل للتوفر" : "Contact for availability"}</span>}
                </div>
                <button type="button" className="w-full mt-1.5 text-[9px] font-medium text-primary border border-primary/30 rounded py-1 hover:bg-primary/5">
                  {isAr ? "زيارة المتجر" : "Visit Store"}
                </button>
              </div>
            </div>

            {/* Product info + badges row */}
            <div className="flex items-end gap-4">
              <div className="flex flex-wrap gap-2 text-[10px]">
                {vp.brand && <span className="bg-muted px-2 py-0.5 rounded font-medium">{vp.brand}</span>}
                {vp.category && <span className="bg-muted px-2 py-0.5 rounded">{vp.category}</span>}
                {vp.skuNo && <span className="bg-muted px-2 py-0.5 rounded text-muted-foreground">SKU: {vp.skuNo}</span>}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {vp.stock > 0 && (
                  <span className="flex items-center gap-1 text-[9px] bg-green-50 dark:bg-green-950/20 text-green-700 px-1.5 py-0.5 rounded">
                    <Zap className="h-2.5 w-2.5" /> {vp.stock} {isAr ? "متوفر" : "in stock"}
                  </span>
                )}
                <span className="flex items-center gap-1 text-[9px] bg-muted px-1.5 py-0.5 rounded">
                  <Shield className="h-2.5 w-2.5" /> {vp.condition}
                </span>
                <span className="flex items-center gap-1 text-[9px] bg-muted px-1.5 py-0.5 rounded">
                  <Truck className="h-2.5 w-2.5" /> {vp.delivery}
                </span>
              </div>
            </div>

            {/* Bulk pricing tiers */}
            <div>
              <h3 className="text-[11px] font-semibold mb-1.5">{isAr ? "أسعار الجملة" : "Bulk Pricing"}</h3>
              <div className="grid grid-cols-4 gap-1">
                {bulkPricing.map((tier, i) => (
                  <div key={i} className={cn(
                    "rounded border text-center py-1.5 px-1",
                    i === 2 ? "border-green-300 bg-green-50 dark:bg-green-950/20" : "border-border"
                  )}>
                    <span className="text-[9px] text-muted-foreground block">
                      {tier.min}{tier.max ? `-${tier.max}` : "+"} {isAr ? "قطعة" : "units"}
                    </span>
                    <span className={cn("text-xs font-bold", i === 2 ? "text-green-600" : "")}>{tier.price} OMR</span>
                    {i > 0 && (
                      <span className="text-[8px] text-green-600 block">
                        {isAr ? "وفر" : "Save"} {Math.round((1 - tier.price / vp.price) * 100)}%
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-[11px] font-semibold mb-1">{isAr ? "الوصف" : "Description"}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{vp.description}</p>
            </div>

            {/* Specifications */}
            <div>
              <h3 className="text-[11px] font-semibold mb-1">{isAr ? "المواصفات" : "Specifications"}</h3>
              <div className="rounded-lg border border-border overflow-hidden">
                {(vp.specs && vp.specs.length > 0) ? vp.specs.map(([key, val]: string[], i: number) => (
                  <div key={i} className={cn("flex items-center px-3 py-1.5 text-xs", i % 2 === 0 ? "bg-muted/30" : "bg-background")}>
                    <span className="text-muted-foreground w-24 shrink-0">{key}</span>
                    <span className="font-medium">{val}</span>
                  </div>
                )) : (
                  <div className="px-3 py-4 text-center text-xs text-muted-foreground">{isAr ? "لا توجد مواصفات" : "Specs will be available soon"}</div>
                )}
              </div>
            </div>

            {/* Reviews */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <h3 className="text-[11px] font-semibold">{isAr ? "التقييمات" : "Reviews"} ({productReviews.length})</h3>
              </div>
              {productReviews.length > 0 ? (
                <div className="space-y-2">
                  {productReviews.map((r: any, i: number) => (
                    <div key={i} className="rounded-lg border border-border p-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[9px] font-bold">{r.user?.charAt(0) || "U"}</div>
                          <span className="text-[11px] font-semibold">{r.user}</span>
                        </div>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} className={cn("h-2.5 w-2.5", s <= r.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20")} />
                          ))}
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">{r.text}</p>
                      <span className="text-[8px] text-muted-foreground/60 mt-0.5 block">{r.date}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-border p-4 text-center">
                  <p className="text-xs text-muted-foreground">{isAr ? "لا توجد تقييمات بعد" : "No reviews yet"}</p>
                  <button type="button"
                    onClick={() => { setSelectedProductId(vp.id); setReqMode("rfq"); setViewingProductId(null); setActiveTab("customize"); }}
                    className="text-[10px] text-primary font-medium mt-1 hover:underline">
                    {isAr ? "كن أول من يقيم هذا المنتج" : "Be the first to review this product →"}
                  </button>
                </div>
              )}
            </div>

            {/* Q&A */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <h3 className="text-[11px] font-semibold">{isAr ? "أسئلة وأجوبة" : "Q&A"}</h3>
                <button type="button"
                  onClick={() => { setSelectedProductId(vp.id); setReqMode("rfq"); setViewingProductId(null); setActiveTab("customize"); }}
                  className="text-[10px] text-primary hover:underline">
                  {isAr ? "اسأل سؤال" : "Ask a question"}
                </button>
              </div>
              <div className="rounded-lg border border-border p-4 text-center">
                <p className="text-xs text-muted-foreground">{isAr ? "لا توجد أسئلة بعد" : "No questions yet"}</p>
                <button type="button"
                  onClick={() => { setSelectedProductId(vp.id); setReqMode("rfq"); setViewingProductId(null); setActiveTab("customize"); }}
                  className="text-[10px] text-primary font-medium mt-1 hover:underline">
                  {isAr ? "اسأل البائع عن هذا المنتج" : "Ask the seller about this product →"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky bottom: qty + add to cart + RFQ option */}
        <div className="border-t border-border px-4 py-2.5 shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              <button type="button" onClick={() => setDetailQty((q) => Math.max(1, q - 1))}
                className="flex h-8 w-8 items-center justify-center rounded-s-md border border-border bg-muted text-muted-foreground hover:bg-muted/80">
                <Minus className="h-3 w-3" />
              </button>
              <div className="flex h-8 w-12 items-center justify-center border-y border-border bg-background text-sm font-semibold">{detailQty}</div>
              <button type="button" onClick={() => setDetailQty((q) => q + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-e-md border border-border bg-muted text-muted-foreground hover:bg-muted/80">
                <Plus className="h-3 w-3" />
              </button>
            </div>
            <button type="button" onClick={() => { onAddToCart(vp.id); }}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 py-2 text-xs font-bold">
              <CreditCard className="h-3.5 w-3.5" /> {isAr ? "شراء" : "Buy"} — {vp.price * detailQty} OMR
            </button>
            <button type="button" onClick={() => { setSelectedProductId(vp.id); setReqMode("rfq"); setViewingProductId(null); setActiveTab("customize"); }}
              className="flex items-center justify-center gap-1 rounded-lg border border-primary text-primary hover:bg-primary/5 px-3 py-2 text-xs font-semibold">
              <FileText className="h-3.5 w-3.5" /> RFQ
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═══ Grid card for product (discovery only — no buy actions) ═══
  const renderGridCard = (p: any, opts?: { isRecommended?: boolean }) => (
    <div
      key={`grid-${p.id}`}
      onClick={() => { setSelectedProductId(p.id); setActiveTab("buynow"); onSelectProduct?.(p); }}
      role="button"
      tabIndex={0}
      className={cn(
        "flex flex-col rounded-lg border transition-colors cursor-pointer overflow-hidden",
        p.id === selectedProductId ? "border-primary ring-1 ring-primary/20" : "border-border hover:border-primary/30"
      )}
    >
      {/* Image placeholder */}
      <div className="h-32 bg-muted flex items-center justify-center">
        <ShoppingCart className="h-8 w-8 text-muted-foreground/20" />
      </div>
      {/* Info */}
      <div className="p-2 flex-1 flex flex-col">
        <span className="text-[11px] font-semibold line-clamp-2 leading-tight">{p.name}</span>
        <div className="flex items-center gap-1 mt-1">
          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
          <span className="text-[9px]">({p.reviews ?? 0})</span>
          {opts?.isRecommended && <span className="text-[7px] bg-purple-100 text-purple-700 px-1 rounded">{isAr ? "مقترح" : "Suggested"}</span>}
        </div>
        <span className="text-[9px] text-muted-foreground mt-0.5">{p.seller ?? "1 seller"}</span>
        <span className="text-sm font-bold text-primary mt-auto pt-1">{p.price} OMR</span>
      </div>
      {/* Actions — discovery only: Buy/Customize or RFQ */}
      <div className="flex items-center gap-1 px-2 pb-2">
        <button type="button"
          onClick={(e) => { e.stopPropagation(); setSelectedProductId(p.id); setActiveTab("buynow"); }}
          className="flex-1 flex items-center justify-center gap-1 rounded bg-green-600 text-white hover:bg-green-700 py-1.5 text-[9px] font-semibold">
          <ShoppingCart className="h-3 w-3" /> {isAr ? "شراء" : "Buy"}
        </button>
        <button type="button"
          onClick={(e) => { e.stopPropagation(); setSelectedProductId(p.id); setReqMode("rfq"); setActiveTab("customize"); }}
          className="flex-1 flex items-center justify-center gap-1 rounded bg-amber-600 text-white hover:bg-amber-700 py-1.5 text-[9px] font-semibold">
          <FileText className="h-3 w-3" /> RFQ
        </button>
      </div>
    </div>
  );

  // ═══ Shared top bar — always renders (even with no selected item) ═══
  const chipBar = (
    <div className="border-b border-border shrink-0">
      <div className="flex items-center gap-1 px-2 py-1.5 bg-muted/20 overflow-x-auto scrollbar-thin">
        {FILTER_CHIPS.map((chip) => {
          const Icon = chip.icon;
          const isActive = activeChips.has(chip.key);
          const styles = CHIP_STYLES[chip.color] || CHIP_STYLES.blue;
          return (
            <button
              key={chip.key}
              type="button"
              onClick={() => toggleChip(chip.key)}
              className={cn(
                "flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full border whitespace-nowrap transition-all shrink-0",
                isActive
                  ? styles.active
                  : "bg-background border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground"
              )}
            >
              <Icon className="h-3 w-3" />
              {isAr ? chip.labelAr : chip.label}
            </button>
          );
        })}

        <div className="h-4 w-px bg-border shrink-0" />

        {/* Filters toggle */}
        <button type="button" onClick={() => setFiltersOpen(!filtersOpen)}
          className={cn("flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full border whitespace-nowrap transition-all shrink-0",
            filtersOpen ? "bg-primary/10 border-primary/30 text-primary ring-1 ring-primary/20" : "bg-background border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground")}>
          <SlidersHorizontal className="h-3 w-3" />
          {isAr ? "فلاتر" : "Filters"}
          {activeFilterCount > 0 && (
            <span className="flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[7px] font-bold px-0.5">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Clear all */}
        {activeFilterCount > 0 && (
          <button type="button" onClick={clearAllFilters}
            className="flex items-center gap-0.5 text-[9px] text-muted-foreground hover:text-destructive shrink-0 ms-auto">
            <RotateCcw className="h-2.5 w-2.5" /> {isAr ? "مسح" : "Clear"}
          </button>
        )}
      </div>
    </div>
  );

  // ═══ No item selected AND no product action pending — show chips + browse/empty ═══
  if (!selectedItemId && !selectedProductId) {
    return (
      <div className="flex flex-col h-full min-h-0 min-w-0 bg-background overflow-hidden">
        {chipBar}

        {/* Browse results when chips active */}
        {hasActiveChips ? (
          <>
          {/* Sort + view toggle for browse mode */}
          <div className="flex items-center gap-2 px-3 py-1 bg-muted/20 border-b border-border shrink-0">
            <ArrowUpDown className="h-3 w-3 text-muted-foreground shrink-0" />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
              className="text-[10px] bg-background border border-border rounded px-1.5 py-0.5 outline-none">
              <option value="price-asc">{isAr ? "السعر: الأقل" : "Price: Low→High"}</option>
              <option value="price-desc">{isAr ? "السعر: الأعلى" : "Price: High→Low"}</option>
              <option value="rating-desc">{isAr ? "التقييم: الأعلى" : "Rating: Best"}</option>
              <option value="discount-desc">{isAr ? "الخصم: الأكبر" : "Discount: Biggest"}</option>
            </select>
            <div className="flex items-center rounded border border-border ms-auto">
              <button type="button" onClick={() => setViewMode("list")}
                className={cn("flex h-6 w-6 items-center justify-center transition-colors",
                  viewMode === "list" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground")}>
                <List className="h-3 w-3" />
              </button>
              <button type="button" onClick={() => setViewMode("grid")}
                className={cn("flex h-6 w-6 items-center justify-center border-s border-border transition-colors",
                  viewMode === "grid" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground")}>
                <LayoutGrid className="h-3 w-3" />
              </button>
            </div>
          </div>
          {/* Advanced filters panel — expands when Filters button clicked */}
          {filtersOpen && (
            <div className="px-3 py-2.5 bg-muted/10 border-b border-border shrink-0">
              <div className="flex items-center gap-4 pb-2 mb-2 border-b border-border/30">
                <div className="flex items-center gap-0.5">
                  <span className="text-[9px] text-muted-foreground me-1">{isAr ? "تقييم" : "Rating"}</span>
                  {[1, 2, 3, 4, 5].map((r) => (
                    <button key={r} type="button" onClick={() => setMinRating(minRating === r ? 0 : r)} className="p-0.5">
                      <Star className={cn("h-3.5 w-3.5", r <= minRating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20")} />
                    </button>
                  ))}
                </div>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input type="checkbox" checked={stockOnly} onChange={(e) => setStockOnly(e.target.checked)} className="rounded border-border text-primary h-3 w-3" />
                  <span className="text-[9px]">{isAr ? "متوفر" : "In Stock"}</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input type="checkbox" checked={discountOnly} onChange={(e) => setDiscountOnly(e.target.checked)} className="rounded border-border text-primary h-3 w-3" />
                  <span className="text-[9px]">{isAr ? "خصم" : "Discount"}</span>
                </label>
              </div>
            </div>
          )}
          <div className="flex-1 overflow-y-auto">
            <div className="p-3 space-y-2">
              {/* Loading */}
              {productSearchQuery.isLoading && (
                <div className="flex items-center justify-center py-8">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-primary" />
                  <span className="text-[10px] text-muted-foreground ms-2">{isAr ? "جاري التحميل..." : "Loading..."}</span>
                </div>
              )}

              {/* Browse header */}
              {!productSearchQuery.isLoading && (realProducts ?? []).length > 0 && (
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-[10px] text-muted-foreground font-medium px-2 flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    {isAr ? "الأكثر شعبية في" : "Trending in"}{" "}
                    <span className="font-bold text-foreground">
                      {Array.from(activeChipsEarly).map((k) => {
                        const chip = FILTER_CHIPS.find((c) => c.key === k);
                        return chip ? (isAr ? chip.labelAr : chip.label) : k;
                      }).join(" + ")}
                    </span>
                  </span>
                  <div className="flex-1 h-px bg-border" />
                </div>
              )}

              {/* No results */}
              {!productSearchQuery.isLoading && (realProducts ?? []).length === 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50/50 dark:bg-amber-950/10 p-4 text-center">
                  <span className="text-xs text-amber-700 dark:text-amber-400 font-semibold block">
                    {isAr ? "لا توجد منتجات لهذا الفلتر" : "No products found for this filter"}
                  </span>
                  <span className="text-[10px] text-amber-600/70 mt-1 block">
                    {isAr ? "جرب فلاتر أخرى أو ابحث عن منتج" : "Try other filters or search for a product"}
                  </span>
                </div>
              )}

              {/* Browse product cards — list or grid */}
              {viewMode === "grid" ? (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                  {(realProducts ?? []).map((p) => renderGridCard(p))}
                </div>
              ) : (
                (realProducts ?? []).map((p) => (
                  <div
                    key={p.id}
                    onClick={() => { setSelectedProductId(p.id); setActiveTab("buynow"); onSelectProduct?.(p); }}
                    role="button"
                    tabIndex={0}
                    className="flex items-start gap-3 p-3 rounded-lg border border-border hover:border-primary/30 transition-colors cursor-pointer"
                  >
                    <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <ShoppingCart className="h-4 w-4 text-muted-foreground/40" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-semibold line-clamp-2">{p.name}</span>
                        <div className="text-end shrink-0">
                          <span className="text-sm font-bold text-primary">{p.price} OMR</span>
                          {p.priceRange && <span className="text-[8px] text-muted-foreground block">{p.priceRange}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        <span className="text-[10px]">{p.rating} ({p.reviews})</span>
                        <span className="text-[9px] text-muted-foreground">• {p.seller}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <button type="button"
                          onClick={(e) => { e.stopPropagation(); setSelectedProductId(p.id); setActiveTab("buynow"); }}
                          className="flex items-center gap-1 rounded bg-green-600 text-white hover:bg-green-700 px-2 py-1 text-[10px] font-semibold">
                          <ShoppingCart className="h-3 w-3" /> {isAr ? "شراء / تخصيص" : "Buy / Customize"}
                        </button>
                        <button type="button"
                          onClick={(e) => { e.stopPropagation(); setSelectedProductId(p.id); setReqMode("rfq"); setActiveTab("customize"); }}
                          className="flex items-center gap-1 rounded bg-amber-600 text-white hover:bg-amber-700 px-2 py-1 text-[10px] font-semibold">
                          <FileText className="h-3 w-3" /> RFQ
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          </>
        ) : (
          /* No chips active — show prompt */
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
            <MessageSquare className="h-12 w-12 mb-3 opacity-15" />
            <h3 className="text-sm font-semibold mb-1">{isAr ? "تفاصيل العنصر" : "Item Details"}</h3>
            <p className="text-xs text-center max-w-[200px] opacity-60">
              {isAr ? "اختر فلتر أعلاه أو ابحث عن منتج" : "Select a filter above or search for a product"}
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0 min-w-0 bg-background overflow-hidden">
      {/* Item header */}
      <div className="px-4 py-2 border-b border-border shrink-0">
        <h3 className="text-sm font-bold truncate">
          {selectedProductId ? (
            <button type="button" onClick={() => setViewingProductId(selectedProductId)}
              className="hover:text-primary hover:underline transition-colors text-start">
              {searchTerm ?? selectedProduct?.name ?? selectedItemId ?? ""}
            </button>
          ) : (
            searchTerm ?? selectedItemId ?? ""
          )}
        </h3>
      </div>

      {/* ═══ CATEGORY CHIPS — always fixed at top, never hidden ═══ */}
      {chipBar}

      {/* 3 Tabs: Products → Buy/Customize → Specs & Req. */}
      <div className="flex border-b border-border shrink-0">
        <button type="button" onClick={() => setActiveTab("products")}
          className={cn("flex-1 py-2 text-xs font-medium border-b-2 transition-colors",
            activeTab === "products" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}>
          {isAr ? "المنتجات" : "Products"} {(realProducts ?? []).length > 0 ? `(${(realProducts ?? []).length})` : ""}
        </button>
        <button type="button"
          onClick={() => { if (selectedProductId) setActiveTab("buynow"); }}
          disabled={!selectedProductId}
          className={cn("flex-1 py-2 text-xs font-medium border-b-2 transition-colors",
            activeTab === "buynow" ? "border-green-600 text-green-600"
              : selectedProductId ? "border-transparent text-muted-foreground hover:text-foreground"
              : "border-transparent text-muted-foreground/30 cursor-not-allowed")}>
          <span className="flex items-center justify-center gap-1">
            <ShoppingCart className="h-3 w-3" /> {isAr ? "شراء / تخصيص" : "Buy / Customize"}
          </span>
        </button>
        <button type="button"
          onClick={() => { if (selectedProductId) setActiveTab("customize"); }}
          disabled={!selectedProductId}
          className={cn("flex-1 py-2 text-xs font-medium border-b-2 transition-colors truncate",
            activeTab === "customize" ? "border-primary text-primary"
              : selectedProductId ? "border-transparent text-muted-foreground hover:text-foreground"
              : "border-transparent text-muted-foreground/30 cursor-not-allowed")}>
          {isAr ? "المواصفات" : "Specs & Req."}
        </button>
      </div>

      {/* ═══ SORT + ADVANCED FILTERS — below tabs ═══ */}
      {(activeTab === "products" || activeTab === "buynow") && (
        <div className="border-b border-border shrink-0">
            {/* Sort row */}
            <div className="flex items-center gap-2 px-3 py-1 bg-muted/20">
              <ArrowUpDown className="h-3 w-3 text-muted-foreground shrink-0" />
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                className="text-[10px] bg-background border border-border rounded px-1.5 py-0.5 outline-none">
                <option value="price-asc">{isAr ? "السعر: الأقل" : "Price: Low→High"}</option>
                <option value="price-desc">{isAr ? "السعر: الأعلى" : "Price: High→Low"}</option>
                <option value="rating-desc">{isAr ? "التقييم: الأعلى" : "Rating: Best"}</option>
                <option value="delivery-asc">{isAr ? "التوصيل: الأسرع" : "Delivery: Fastest"}</option>
                <option value="discount-desc">{isAr ? "الخصم: الأكبر" : "Discount: Biggest"}</option>
              </select>

              {/* View mode toggle */}
              <div className="flex items-center rounded border border-border ms-auto">
                <button type="button" onClick={() => setViewMode("list")}
                  className={cn("flex h-6 w-6 items-center justify-center transition-colors",
                    viewMode === "list" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground")}>
                  <List className="h-3 w-3" />
                </button>
                <button type="button" onClick={() => setViewMode("grid")}
                  className={cn("flex h-6 w-6 items-center justify-center border-s border-border transition-colors",
                    viewMode === "grid" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground")}>
                  <LayoutGrid className="h-3 w-3" />
                </button>
              </div>

              {/* Active chip summary */}
              {activeChips.size > 0 && (
                <div className="flex items-center gap-1">
                  <Layers className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[9px] text-muted-foreground">
                    {activeChips.size} {isAr ? "فلتر نشط" : "active"}
                  </span>
                </div>
              )}
            </div>

            {/* Expanded dynamic filter panel — driven by category SpecTemplate */}
            {filtersOpen && (
              <div className="px-3 py-2.5 bg-muted/10 border-t border-border/50">
                {/* Base filters: Rating + Stock + Discount */}
                <div className="flex items-center gap-4 pb-2 mb-2 border-b border-border/30">
                  <div className="flex items-center gap-0.5">
                    <span className="text-[9px] text-muted-foreground me-1">{isAr ? "تقييم" : "Rating"}</span>
                    {[1, 2, 3, 4, 5].map((r) => (
                      <button key={r} type="button" onClick={() => setMinRating(minRating === r ? 0 : r)} className="p-0.5">
                        <Star className={cn("h-3.5 w-3.5", r <= minRating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20")} />
                      </button>
                    ))}
                  </div>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input type="checkbox" checked={stockOnly} onChange={(e) => setStockOnly(e.target.checked)} className="rounded border-border text-primary h-3 w-3" />
                    <span className="text-[9px]">{isAr ? "متوفر" : "In Stock"}</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input type="checkbox" checked={discountOnly} onChange={(e) => setDiscountOnly(e.target.checked)} className="rounded border-border text-primary h-3 w-3" />
                    <span className="text-[9px]">{isAr ? "خصم" : "Discount"}</span>
                  </label>
                </div>

                {/* Dynamic category filters — grouped */}
                {Object.entries(filterGroups).map(([groupName, groupFilters]) => (
                  <div key={groupName} className="mb-2.5">
                    <span className="text-[8px] font-bold text-muted-foreground/60 uppercase tracking-widest">{groupName}</span>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-1">
                      {groupFilters.map((f) => {
                        const label = isAr && f.nameAr ? f.nameAr : f.name;
                        const val = filterValues[f.key];

                        // SELECT — dropdown
                        if (f.dataType === "SELECT") {
                          const opts = (f.options ?? "").split(",").map((o) => o.trim()).filter(Boolean);
                          return (
                            <div key={f.key}>
                              <label className="text-[9px] text-muted-foreground block mb-0.5">{label}</label>
                              <select value={val ?? ""} onChange={(e) => setFilterValue(f.key, e.target.value)}
                                className="w-full text-[10px] bg-background border border-border rounded px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-primary">
                                <option value="">{isAr ? "الكل" : "Any"}</option>
                                {opts.map((o) => <option key={o} value={o}>{o}</option>)}
                              </select>
                            </div>
                          );
                        }

                        // MULTI_SELECT — pill chips
                        if (f.dataType === "MULTI_SELECT") {
                          const opts = (f.options ?? "").split(",").map((o) => o.trim()).filter(Boolean);
                          const selected: Set<string> = val instanceof Set ? val : new Set();
                          return (
                            <div key={f.key} className="col-span-2">
                              <label className="text-[9px] text-muted-foreground block mb-0.5">{label}</label>
                              <div className="flex flex-wrap gap-1">
                                {opts.map((o) => (
                                  <button key={o} type="button" onClick={() => toggleMultiSelect(f.key, o)}
                                    className={cn("text-[9px] px-1.5 py-0.5 rounded-full border transition-colors",
                                      selected.has(o) ? "bg-primary/10 border-primary/30 text-primary" : "bg-background border-border text-muted-foreground")}>
                                    {o}
                                  </button>
                                ))}
                              </div>
                            </div>
                          );
                        }

                        // NUMBER — min-max range
                        if (f.dataType === "NUMBER") {
                          const range = val ?? [null, null];
                          return (
                            <div key={f.key}>
                              <label className="text-[9px] text-muted-foreground block mb-0.5">{label}{f.unit ? ` (${f.unit})` : ""}</label>
                              <div className="flex items-center gap-1">
                                <input type="number" placeholder="min" value={range[0] ?? ""}
                                  onChange={(e) => setFilterValue(f.key, [e.target.value ? Number(e.target.value) : null, range[1]])}
                                  className="w-14 text-[10px] border border-border rounded px-1.5 py-0.5 bg-background outline-none focus:ring-1 focus:ring-primary" />
                                <span className="text-[8px] text-muted-foreground">–</span>
                                <input type="number" placeholder="max" value={range[1] ?? ""}
                                  onChange={(e) => setFilterValue(f.key, [range[0], e.target.value ? Number(e.target.value) : null])}
                                  className="w-14 text-[10px] border border-border rounded px-1.5 py-0.5 bg-background outline-none focus:ring-1 focus:ring-primary" />
                              </div>
                            </div>
                          );
                        }

                        // BOOLEAN — checkbox
                        if (f.dataType === "BOOLEAN") {
                          return (
                            <label key={f.key} className="flex items-center gap-1.5 cursor-pointer">
                              <input type="checkbox" checked={!!val} onChange={(e) => setFilterValue(f.key, e.target.checked || undefined)}
                                className="rounded border-border text-primary h-3 w-3" />
                              <span className="text-[10px]">{label}</span>
                            </label>
                          );
                        }

                        // TEXT — input
                        return (
                          <div key={f.key}>
                            <label className="text-[9px] text-muted-foreground block mb-0.5">{label}</label>
                            <input type="text" value={val ?? ""} onChange={(e) => setFilterValue(f.key, e.target.value)}
                              placeholder={label} className="w-full text-[10px] border border-border rounded px-1.5 py-0.5 bg-background outline-none focus:ring-1 focus:ring-primary" />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      {/* Hidden file input — always mounted */}
      <input ref={vendorFileRef} type="file" multiple accept="*/*" className="hidden"
        onChange={(e) => { if (e.target.files) { const names = Array.from(e.target.files).map((f) => f.name); setVendorAttachments((p) => [...p, ...names]); } e.target.value = ""; }} />

      {/* ═══ SCROLLABLE CONTENT (products/specs/buynow) ═══ */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {/* ═══ PRODUCTS TAB — Vendor view: manage offerings per request ═══ */}
        {activeTab === "products" && (
          <div className="p-3 space-y-2">


            {/* Create RFQ + AI Suggest — only on search or RFQ filter */}
            {(!!searchTerm || activeChips.has("rfq")) && <div className="flex gap-2">
              <button type="button" onClick={() => { setActiveTab("customize"); setReqMode("rfq"); }}
                className="flex-1 flex items-center gap-2 p-2 rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/10 text-start">
                <FileText className="h-4 w-4 text-primary shrink-0" />
                <div>
                  <span className="text-[9px] font-bold text-primary block">{isAr ? "طلب أسعار" : "Create RFQ"}</span>
                  <span className="text-[7px] text-muted-foreground">{isAr ? "يدوياً" : "Manual"}</span>
                </div>
              </button>
              <button type="button" disabled={aiUsedToday >= 50}
                className={cn("flex-1 flex items-center gap-2 p-2 rounded-lg border text-start relative",
                  aiUsedToday >= 50 ? "border-border opacity-50" : "border-purple-200 bg-purple-50/50 hover:bg-purple-100/50")}>
                <Zap className="h-4 w-4 text-purple-600 shrink-0" />
                <div>
                  <span className="text-[9px] font-bold text-purple-700 block">{isAr ? "اقتراح AI" : "AI Suggest"}</span>
                  <span className="text-[7px] text-muted-foreground">{50 - aiUsedToday}/50</span>
                </div>
              </button>
            </div>}

            {/* Loading */}
            {productSearchQuery.isLoading && (
              <div className="flex items-center justify-center py-6">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-primary" />
                <span className="text-[10px] text-muted-foreground ms-2">{isAr ? "جاري البحث..." : "Searching..."}</span>
              </div>
            )}

            {/* No results message */}
            {!productSearchQuery.isLoading && (searchTerm || hasActiveChips) && (realProducts ?? []).length === 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50/50 dark:bg-amber-950/10 p-4 text-center">
                <span className="text-xs text-amber-700 dark:text-amber-400 font-semibold block">
                  {searchTerm
                    ? (isAr ? `لا توجد نتائج لـ "${searchTerm}"` : `No results for "${searchTerm}"`)
                    : (isAr ? "لا توجد منتجات لهذا الفلتر" : "No products found for this filter")}
                </span>
                <span className="text-[10px] text-amber-600/70 mt-1 block">
                  {searchTerm
                    ? (isAr ? "جرب كلمات مختلفة أو أنشئ طلب أسعار مخصص" : "Try different keywords or create a custom RFQ above")
                    : (isAr ? "جرب فلاتر أخرى أو ابحث عن منتج" : "Try other filters or search for a product")}
                </span>
              </div>
            )}

            {/* Browse mode header — when chip active but no search */}
            {isBrowseMode && (realProducts ?? []).length > 0 && (
              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1 h-px bg-border" />
                <span className="text-[10px] text-muted-foreground font-medium px-2 flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  {isAr ? "الأكثر شعبية في" : "Trending in"}{" "}
                  <span className="font-bold text-foreground">
                    {Array.from(activeChips).map((k) => {
                      const chip = FILTER_CHIPS.find((c) => c.key === k);
                      return chip ? (isAr ? chip.labelAr : chip.label) : k;
                    }).join(" + ")}
                  </span>
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>
            )}

            {/* Product list — list or grid view */}
            {viewMode === "grid" ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                {(realProducts ?? []).map((p) => renderGridCard(p))}
              </div>
            ) : (
              (realProducts ?? []).map((p) => {
                const isSel = p.id === selectedProductId;
                return (
                  <div
                    key={p.id}
                    onClick={() => { setSelectedProductId(p.id); setActiveTab("buynow"); onSelectProduct?.(p); }}
                    role="button"
                    tabIndex={0}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer",
                      isSel ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border hover:border-primary/30"
                    )}
                  >
                    <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <ShoppingCart className="h-4 w-4 text-muted-foreground/40" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <span className={cn("text-xs font-semibold line-clamp-2", isSel && "text-primary")}>{p.name}</span>
                        <div className="text-end shrink-0">
                          <span className="text-sm font-bold text-primary">{p.price} OMR</span>
                          {p.priceRange && <span className="text-[8px] text-muted-foreground block">{p.priceRange}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        <span className="text-[10px]">{p.rating} ({p.reviews})</span>
                        <span className="text-[9px] text-muted-foreground">• {p.seller}</span>
                        {p.sellersCount > 1 && (
                          <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 rounded-full font-medium">
                            {p.sellersCount} {isAr ? "بائع" : "sellers"}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <button type="button"
                          onClick={(e) => { e.stopPropagation(); setSelectedProductId(p.id); setActiveTab("buynow"); }}
                          className="flex items-center gap-1 rounded bg-green-600 text-white hover:bg-green-700 px-2 py-1 text-[10px] font-semibold">
                          <ShoppingCart className="h-3 w-3" /> {isAr ? "شراء / تخصيص" : "Buy / Customize"}
                        </button>
                        <button type="button"
                          onClick={(e) => { e.stopPropagation(); setSelectedProductId(p.id); setReqMode("rfq"); setActiveTab("customize"); }}
                          className="flex items-center gap-1 rounded bg-amber-600 text-white hover:bg-amber-700 px-2 py-1 text-[10px] font-semibold">
                          <FileText className="h-3 w-3" /> RFQ
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {/* ── Recommended models (when few results) ── */}
            {recommendedProducts.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-[9px] text-muted-foreground font-medium px-2">
                    {isAr ? "منتجات مشابهة قد تهمك" : "Similar products you might like"}
                  </span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                {recommendedProducts.map((p: any) => {
                  const isSel = p.id === selectedProductId;
                  return (
                    <div
                      key={`rec-${p.id}`}
                      onClick={() => { setSelectedProductId(p.id); onSelectProduct?.(p); }}
                      role="button"
                      tabIndex={0}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer",
                        isSel ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border/50 border-dashed hover:border-primary/30 bg-background/50"
                      )}
                    >
                      <div className="h-12 w-12 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                        <ShoppingCart className="h-4 w-4 text-muted-foreground/20" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className={cn("text-xs font-semibold line-clamp-2", isSel && "text-primary")}>{p.name}</span>
                              <span className="text-[8px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded shrink-0">{isAr ? "مقترح" : "Suggested"}</span>
                            </div>
                          </div>
                          <div className="text-end shrink-0">
                            <span className="text-sm font-bold text-primary">{p.price} OMR</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          <span className="text-[10px]">{p.rating} ({p.reviews})</span>
                          <span className="text-[9px] text-muted-foreground">• {p.seller}</span>
                          {p.sellersCount > 1 && (
                            <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 rounded-full font-medium">
                              {p.sellersCount} {isAr ? "بائع" : "sellers"}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <button type="button"
                            onClick={(e) => { e.stopPropagation(); setSelectedProductId(p.id); setActiveTab("buynow"); }}
                            className="flex items-center gap-1 rounded bg-green-600 text-white hover:bg-green-700 px-2 py-1 text-[10px] font-semibold">
                            <ShoppingCart className="h-3 w-3" /> {isAr ? "شراء / تخصيص" : "Buy / Customize"}
                          </button>
                          <button type="button"
                            onClick={(e) => { e.stopPropagation(); setSelectedProductId(p.id); setReqMode("rfq"); setActiveTab("customize"); }}
                            className="flex items-center gap-1 rounded bg-amber-600 text-white hover:bg-amber-700 px-2 py-1 text-[10px] font-semibold">
                            <FileText className="h-3 w-3" /> RFQ
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ═══ SPECS & REQUIREMENTS TAB ═══ */}
        {activeTab === "customize" && (
          <div className="p-3 space-y-3">
            {/* ── Action buttons at TOP ── */}
            {selectedProduct && (
              <div className="flex gap-2">
                <button type="button" onClick={() => onAddToCart(selectedProduct.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 py-2 text-[11px] font-bold">
                  <ShoppingCart className="h-3.5 w-3.5" /> {isAr ? "أضف لسلة الأسعار" : "Add to RFQ Cart"}
                </button>
                <button type="button"
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-amber-600 text-white hover:bg-amber-700 py-2 text-[11px] font-bold">
                  <Wrench className="h-3.5 w-3.5" /> {isAr ? `اطلب تخصيص من ${selectedProduct.seller}` : `Ask ${selectedProduct.seller} to Customize`}
                </button>
              </div>
            )}

            {/* ── Product Specs from category (collapsible) ── */}
            <div className="rounded-lg border border-border overflow-hidden">
              <button type="button" onClick={() => setSpecsOpen(!specsOpen)}
                className="flex items-center gap-2 w-full px-3 py-2 bg-muted/40 hover:bg-muted/60 text-xs font-semibold">
                <Eye className="h-3.5 w-3.5 text-primary" />
                <span className="flex-1 text-start">{selectedProduct?.name ?? "Product"} — {isAr ? "المواصفات" : "Specs"}</span>
                {specsOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
              {specsOpen && selectedProduct && (
                <div className="grid grid-cols-3 gap-px bg-border">
                  {(selectedProduct.specs && selectedProduct.specs.length > 0)
                    ? selectedProduct.specs.map(([key, val]: string[], i: number) => (
                        <div key={i} className="bg-background px-2.5 py-1.5">
                          <span className="text-[9px] text-muted-foreground block">{key}</span>
                          <span className="text-[10px] font-medium">{val}</span>
                        </div>
                      ))
                    : (
                      <div className="col-span-3 bg-background px-3 py-4 text-center">
                        <p className="text-[10px] text-muted-foreground">{isAr ? "لا توجد مواصفات متاحة" : "No specs available yet"}</p>
                        <p className="text-[9px] text-muted-foreground/60 mt-1">{isAr ? "المواصفات ستُستخرج تلقائياً" : "Specs will be auto-extracted from product description"}</p>
                      </div>
                    )
                  }
                </div>
              )}
            </div>

            {/* ── Rich Text Editor Area ── */}
            <div className="rounded-lg border border-border overflow-hidden">
              {/* Toolbar */}
              <div className="flex items-center gap-0.5 px-2 py-1.5 bg-muted/30 border-b border-border/50 flex-wrap">
                {/* Text formatting */}
                {[
                  { icon: "B", title: "Bold", cls: "font-bold" },
                  { icon: "I", title: "Italic", cls: "italic" },
                  { icon: "U", title: "Underline", cls: "underline" },
                ].map((b) => (
                  <button key={b.title} type="button" title={b.title}
                    className={`h-6 w-6 flex items-center justify-center rounded text-[11px] ${b.cls} text-muted-foreground hover:bg-muted hover:text-foreground`}>
                    {b.icon}
                  </button>
                ))}

                <div className="h-4 w-px bg-border mx-0.5" />

                {/* Structure */}
                <button type="button" title="Heading" className="h-6 px-1.5 flex items-center justify-center rounded text-[9px] font-bold text-muted-foreground hover:bg-muted hover:text-foreground">
                  H
                </button>
                <button type="button" title="Bullet List" className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1.5" fill="currentColor"/><circle cx="4" cy="12" r="1.5" fill="currentColor"/><circle cx="4" cy="18" r="1.5" fill="currentColor"/></svg>
                </button>
                <button type="button" title="Numbered List" className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="10" y1="6" x2="20" y2="6"/><line x1="10" y1="12" x2="20" y2="12"/><line x1="10" y1="18" x2="20" y2="18"/><text x="2" y="8" fontSize="8" fill="currentColor" stroke="none">1</text><text x="2" y="14" fontSize="8" fill="currentColor" stroke="none">2</text><text x="2" y="20" fontSize="8" fill="currentColor" stroke="none">3</text></svg>
                </button>

                <div className="h-4 w-px bg-border mx-0.5" />

                {/* Media */}
                <button type="button" onClick={() => vendorFileRef.current?.click()} title="Insert Image"
                  className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground">
                  <Image className="h-3.5 w-3.5" />
                </button>
                <button type="button" onClick={() => vendorFileRef.current?.click()} title="Attach File"
                  className="relative h-6 flex items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground px-1">
                  <Paperclip className="h-3.5 w-3.5" />
                  {vendorAttachments.length > 0 && (
                    <span className="flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[7px] font-bold px-0.5 ms-0.5">
                      {vendorAttachments.length}
                    </span>
                  )}
                </button>

                <div className="h-4 w-px bg-border mx-0.5" />

                {/* Table */}
                <button type="button" title="Insert Table"
                  className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>
                </button>

                {/* Spacer + AI */}
                <div className="flex-1" />
                <button type="button" className="flex items-center gap-1 text-[9px] text-primary hover:text-primary/80 bg-primary/5 rounded px-2 py-0.5">
                  <Zap className="h-3 w-3" /> AI
                </button>
              </div>

              {/* Editor content area */}
              <div
                contentEditable
                suppressContentEditableWarning
                className="min-h-[200px] px-3 py-3 text-xs leading-relaxed outline-none focus:ring-0"
                style={{ maxHeight: "400px", overflowY: "auto" }}
              >
                <p>Need for corporate use. Prefer black or silver.</p>
                <p>Bulk packaging OK. Must include carrying case.</p>
                <br />
                <p className="text-muted-foreground">{isAr ? "اكتب تفاصيل طلبك هنا..." : "Continue writing your request details..."}</p>
              </div>

              {/* Quick requirements chips */}
              <div className="flex flex-wrap gap-1 px-3 py-2 border-t border-border/50 bg-muted/10">
                {[
                  { l: isAr ? "شهادة جودة" : "Quality Cert", c: true },
                  { l: isAr ? "كفالة" : "Warranty", c: true },
                  { l: isAr ? "عينات" : "Samples", c: false },
                  { l: isAr ? "تغليف مخصص" : "Custom Pkg", c: false },
                  { l: isAr ? "شعار" : "Branding", c: false },
                  { l: isAr ? "شحن سريع" : "Express", c: true },
                ].map((r, i) => (
                  <label key={i} className="flex items-center gap-1 rounded border border-border px-1.5 py-0.5 cursor-pointer hover:bg-muted/30 bg-background">
                    <input type="checkbox" defaultChecked={r.c} className="rounded border-border text-primary h-2.5 w-2.5" />
                    <span className="text-[8px]">{r.l}</span>
                  </label>
                ))}
              </div>

              {/* Attachments — multi-file */}
              <div className="px-3 py-2 border-t border-border/50 space-y-2">
                {/* Header + Add button */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold flex items-center gap-1">
                    <Paperclip className="h-3 w-3 text-primary" />
                    {isAr ? "المرفقات" : "Attachments"}
                    {vendorAttachments.length > 0 && (
                      <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary text-primary-foreground text-[8px] font-bold px-1">
                        {vendorAttachments.length}
                      </span>
                    )}
                  </span>
                  <button type="button" onClick={() => vendorFileRef.current?.click()}
                    className="ms-auto flex items-center gap-1 rounded border border-dashed border-border hover:border-primary px-2 py-1 text-[9px] text-muted-foreground hover:text-primary">
                    <Plus className="h-3 w-3" /> {isAr ? "إضافة" : "Add Files"}
                  </button>
                </div>

                {/* File list — always below */}
                {vendorAttachments.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {vendorAttachments.map((f, i) => {
                      const isImg = f.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);
                      const isPdf = f.match(/\.pdf$/i);
                      return (
                        <div key={i} className="flex items-center gap-1.5 rounded-md border border-border bg-muted/30 px-2 py-1.5">
                          {isImg ? <Image className="h-3.5 w-3.5 text-blue-500" /> : isPdf ? <FileText className="h-3.5 w-3.5 text-red-500" /> : <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />}
                          <span className="text-[10px] max-w-[120px] truncate">{f}</span>
                          <button type="button" onClick={() => setVendorAttachments((p) => p.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-destructive ms-1">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Empty state hint */}
                {vendorAttachments.length === 0 && (
                  <p className="text-[9px] text-muted-foreground/50 text-center">
                    {isAr ? "أضف صور، مستندات PDF، رسومات تصميم" : "Add images, PDF documents, design drawings, specs sheets"}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══ BUY / CUSTOMIZE TAB — vendors for selected product ═══ */}
        {activeTab === "buynow" && (
          <div className="p-3">
            {/* Selected product header */}
            {selectedProduct && (
              <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-muted/30 border border-border">
                <div className="h-8 w-8 rounded bg-muted flex items-center justify-center shrink-0">
                  <ShoppingCart className="h-3.5 w-3.5 text-muted-foreground/30" />
                </div>
                <div className="flex-1 min-w-0">
                  <button type="button" onClick={() => setViewingProductId(selectedProduct.id)}
                    className="text-[11px] font-bold block truncate text-primary hover:underline text-start">
                    {selectedProduct.name}
                  </button>
                  <span className="text-[9px] text-muted-foreground">
                    {buySearchQuery?.isLoading ? (isAr ? "جاري البحث..." : "Searching sellers...") : `${buyListings.length} ${isAr ? "عرض لهذا المنتج" : "listings for this product"}`}
                  </span>
                </div>
                <span className="text-xs font-bold text-primary">{selectedProduct.price} OMR</span>
              </div>
            )}

            {!buySearchQuery?.isLoading && buyListings.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-20" />
                <p className="text-xs">{isAr ? "اختر منتج من قائمة المنتجات أولاً" : "Select a product from the Products tab first"}</p>
              </div>
            )}

            {buySearchQuery?.isLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}

            <div className="space-y-2 overflow-hidden">
              {buyListings.map((p: any) => (
                <div key={p.id} className="rounded-lg border border-border hover:border-primary/30 transition-colors bg-background p-3">
                  {/* Product info */}
                  <div className="flex items-start gap-3">
                    <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <ShoppingCart className="h-4 w-4 text-muted-foreground/40" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <button type="button" onClick={() => setViewingProductId(p.productId)}
                          className="text-xs font-semibold line-clamp-2 text-foreground hover:text-primary hover:underline transition-colors text-start">
                          {p.name}
                        </button>
                        <div className="text-end shrink-0">
                          <span className="text-sm font-bold text-primary">{p.price} OMR</span>
                          {p.originalPrice > p.price && (
                            <span className="text-[9px] text-muted-foreground line-through block">{p.originalPrice} OMR</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className="text-[10px] text-muted-foreground">{p.seller}</span>
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0" />
                        <span className="text-[10px]">{p.rating} ({p.reviews})</span>
                        <span className="text-[10px] text-muted-foreground">·</span>
                        <span className={cn("text-[10px]", p.inStock ? "text-green-600" : "text-destructive")}>
                          {p.stock > 0 ? `${p.stock} ${isAr ? "متوفر" : "in stock"}` : (isAr ? "غير متوفر" : "Out of stock")}
                        </span>
                        {p.brand && <span className="text-[9px] bg-muted px-1 rounded">{p.brand}</span>}
                        <span className="text-[9px] text-muted-foreground">· {p.delivery}</span>
                      </div>
                      {p.description && (
                        <p className="text-[9px] text-muted-foreground mt-1 line-clamp-2">{p.description}</p>
                      )}
                    </div>
                  </div>
                  {/* Actions — quantity stepper + Cart + Message */}
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    <div className="flex items-center rounded border border-border">
                      <button type="button" onClick={() => setCardQty(p.productId, getCardQty(p.productId) - 1)}
                        disabled={getCardQty(p.productId) <= 0}
                        className="flex h-7 w-7 items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30">
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="flex h-7 w-9 items-center justify-center border-x border-border text-[11px] font-bold">{getCardQty(p.productId)}</span>
                      <button type="button" onClick={() => setCardQty(p.productId, getCardQty(p.productId) + 1)}
                        className="flex h-7 w-7 items-center justify-center text-muted-foreground hover:text-foreground">
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <button type="button" onClick={() => onAddToCart(p.productId)}
                      className="flex items-center gap-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-1.5 text-[10px] font-semibold">
                      <ShoppingCart className="h-3 w-3" /> {isAr ? "سلة" : "Cart"}
                    </button>
                    <button type="button"
                      className="flex items-center gap-1 rounded bg-blue-600 text-white hover:bg-blue-700 px-3 py-1.5 text-[10px] font-semibold">
                      <MessageSquare className="h-3 w-3" /> {isAr ? "رسالة" : "Message"}
                    </button>
                    <button type="button"
                      onClick={() => { setSelectedProductId(p.productId); setReqMode("vendor"); setActiveTab("customize"); }}
                      className="flex items-center gap-1 rounded bg-amber-600 text-white hover:bg-amber-700 px-3 py-1.5 text-[10px] font-semibold">
                      <Wrench className="h-3 w-3" /> {isAr ? "تخصيص" : "Customize"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* ═══ Chat — pinned at bottom, only on Products tab ═══ */}
      {activeTab === "products" && (
        <div className="border-t border-border shrink-0">
          <button
            type="button"
            onClick={() => setChatExpanded(!chatExpanded)}
            className="flex items-center gap-2 w-full px-3 py-1.5 bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <MessageSquare className="h-3 w-3 text-primary" />
            <span className="text-[10px] font-semibold">{isAr ? "محادثة" : "Discussion"}</span>
            {/* message count badge placeholder */}
            {/* Usage counter */}
            <span className={cn(
              "text-[7px] font-bold px-1 py-0.5 rounded ms-auto me-1",
              aiUsedToday >= 50 ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"
            )}>
              {50 - aiUsedToday}/50
            </span>
            <ChevronDown className={cn("h-3 w-3 text-muted-foreground transition-transform", chatExpanded && "rotate-180")} />
          </button>

          {chatExpanded && (
            <div className="max-h-36 overflow-y-auto px-3 py-2 space-y-1.5 border-t border-border/30">
              <div className="text-center py-4 text-muted-foreground">
                <MessageSquare className="h-5 w-5 mx-auto mb-1 opacity-20" />
                <p className="text-[9px]">{isAr ? "ابدأ المحادثة" : "Start a discussion"}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 px-3 py-1.5 border-t border-border/50">
            {aiUsedToday >= 50 ? (
              <div className="flex-1 text-center py-1">
                <span className="text-[9px] text-destructive font-medium">{isAr ? `انتهى الحد اليومي — يتجدد خلال ${aiResetHours}س` : `Daily limit reached — resets in ${aiResetHours}h`}</span>
              </div>
            ) : (
              <>
                <button type="button" onClick={() => vendorFileRef.current?.click()} className="text-muted-foreground hover:text-foreground shrink-0">
                  <Paperclip className="h-3 w-3" />
                </button>
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={isAr ? "اسأل عن المنتج..." : "Ask about this product..."}
                  className="flex-1 bg-muted/50 rounded border px-2 py-1 text-[10px] placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary"
                />
                <button type="button" className="text-primary hover:text-primary/80 shrink-0">
                  <Send className="h-3 w-3" />
                </button>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
