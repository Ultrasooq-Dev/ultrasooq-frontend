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
import { useAuth } from "@/context/AuthContext";
import { checkCategoryConnection } from "@/utils/categoryConnection";
import { useVendorBusinessCategories } from "@/hooks/useVendorBusinessCategories";
import { useCurrentAccount } from "@/apis/queries/auth.queries";
import { useAddCustomizeProduct } from "@/apis/queries/rfq.queries";
import { useToast } from "@/components/ui/use-toast";
import { useTrackProductClick, useTrackProductSearch } from "@/apis/queries/product.queries";
import { getOrCreateDeviceId } from "@/utils/helper";
import {
  Star, ShoppingCart, Send, Paperclip,
  MessageSquare, FileText, X, Image, ChevronDown, ChevronUp,
  Eye, Zap, Plus, Wrench, Loader2, Tag,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// ─── Extracted components ───────────────────────────────────────
import {
  FilterChipBar, SortViewBar, AdvancedFilterPanel,
  FILTER_CHIPS, CHIP_STYLES, CATEGORY_FILTERS,
  type FilterChipKey, type FilterChipDef,
} from "./cards/FilterChipBar";
import { ProductGridCard } from "./cards/ProductGridCard";
import { ProductListCard } from "./cards/ProductListCard";
import { ProductDetailView } from "./panels/ProductDetailView";
import { BuyTab } from "./panels/BuyTab";

// ─── Component ──────────────────────────────────────────────────
interface ItemDetailPanelProps {
  selectedItemId: string | null;
  searchTerm?: string;
  onAddToCart: (productPriceId: number, quantity?: number) => void;
  onAddToRfqCart?: (productId: number, priceFrom?: number, priceTo?: number) => void;
  onSelectProduct?: (product: any) => void;
  locale: string;
  activeCategories?: Set<string>;
  onCategoryChange?: (categories: Set<string>) => void;
}

export default function ItemDetailPanel({ selectedItemId, searchTerm, onAddToCart, onAddToRfqCart, onSelectProduct, locale, activeCategories, onCategoryChange }: ItemDetailPanelProps) {
  const isAr = locale === "ar";
  // Auth & pricing context — same hooks as ProductDescriptionCard
  const { user, currency } = useAuth();
  const currentAccount = useCurrentAccount();
  const vendorBusinessCategoryIds = useVendorBusinessCategories();
  const currentTradeRole = currentAccount?.data?.data?.account?.tradeRole || user?.tradeRole;
  const [chatInput, setChatInput] = useState("");
  const [searchPage, setSearchPage] = useState(1);

  // Tracking hooks
  const trackClick = useTrackProductClick();
  const trackSearch = useTrackProductSearch();

  // AI usage: 50/day free — TODO: track via API, for now localStorage
  const [aiUsedToday, setAiUsedToday] = useState(0);
  const [aiResetHours, setAiResetHours] = useState(24);
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("us_ai_suggest") ?? "{}");
      const today = new Date().toDateString();
      setAiUsedToday(stored.date === today ? (stored.count ?? 0) : 0);
      setAiResetHours(Math.max(1, 24 - new Date().getHours()));
    } catch {}
  }, []);
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

  // Shared chip matcher — used by both browse and search modes
  const matchesChip = (p: any, chip: typeof FILTER_CHIPS[0]) => {
    const cp = chip.params;
    const prices: any[] = p.product_productPrice ?? [];
    if (cp.productType && p.productType !== cp.productType) return false;
    if (cp.sellType) {
      const hasSellType = prices.some((pp: any) => pp.sellType === cp.sellType && !pp.deletedAt && pp.status === "ACTIVE");
      if (!hasSellType) return false;
    }
    if (cp.hasDiscount === "true") {
      const hasDiscount = prices.some((pp: any) => Number(pp.offerPrice) > 0 && Number(pp.offerPrice) < Number(pp.productPrice))
        || (Number(p.offerPrice) > 0 && Number(p.offerPrice) < Number(p.productPrice));
      if (!hasDiscount) return false;
    }
    if (cp.isCustomProduct === "true") {
      const isCustom = prices.some((pp: any) => pp.isCustomProduct === "true" || pp.isCustomProduct === true) || p.isCustomProduct === true;
      if (!isCustom) return false;
    }
    if (Object.keys(cp).length === 0) return false;
    return true;
  };

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
          // Pass allSellTypes=true so BUYGROUP/WHOLESALE/TRIAL products also appear
          const needsAllTypes = activeChipDefs.some((c) =>
            c.key === "buygroup" || c.key === "wholesale" || c.key === "discount" || c.key === "service" || c.key === "vendor_store"
          );
          const res = await http.get(`${getApiUrl()}/product/getAllProduct`, {
            params: { page: 1, limit: 200, ...(needsAllTypes ? { allSellTypes: "true" } : {}) },
          });
          const allProducts = res.data?.data ?? [];

          // OR logic using shared matchesChip
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
      // For single chip, pass params to backend. For multi/no chips, filter client-side after search.
      const singleChipParams = activeChipDefs.length === 1 ? activeChipDefs[0].params : {};
      let searchData: any[] = [];
      let searchTotal = 0;

      try {
        const res = await http.get(`${getApiUrl()}/product/search/unified`, {
          params: { q: cleanTerm, page: searchPage, limit: hasActiveChips ? 50 : PRODUCTS_PER_PAGE, ...singleChipParams },
        });
        searchData = res.data?.data ?? [];
        searchTotal = res.data?.totalCount ?? 0;
      } catch (err: any) {
        console.error("[Search] Unified failed:", err?.response?.status, err?.message);
        // Fallback to traditional search
        try {
          const res = await http.get(`${getApiUrl()}/product/getAllProduct`, { params: { page: searchPage, limit: hasActiveChips ? 50 : PRODUCTS_PER_PAGE, term: cleanTerm } });
          searchData = res.data?.data ?? [];
          searchTotal = res.data?.totalCount ?? 0;
        } catch {}
      }

      // If multi-chip active, apply client-side OR filtering on search results
      if (activeChipDefs.length > 1 && searchData.length > 0) {
        searchData = searchData.filter((p: any) => activeChipDefs.some((chip) => matchesChip(p, chip)));
        searchTotal = searchData.length;
      }

      if (searchData.length > 0) {
        const page = searchData.slice(0, PRODUCTS_PER_PAGE);
        return { data: page, totalCount: searchTotal };
      }
      return { data: [], totalCount: 0 };
    },
    enabled: (!!searchTerm && searchTerm.length >= 1) || hasActiveChips,
    staleTime: 30_000,
  });

  // Track search when results arrive for a search term
  useEffect(() => {
    if (searchTerm && searchTerm.trim().length >= 1 && productSearchQuery.isSuccess) {
      trackSearch.mutate({
        searchTerm: searchTerm.trim(),
        deviceId: getOrCreateDeviceId() || undefined,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, productSearchQuery.isSuccess]);

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

    return Array.from(modelMap.values()).map((m) => {
      // Find original raw product for enrichment
      const rawProduct = data.find((p: any) => p.id === m.id);
      const pp = rawProduct?.product_productPrice?.[0];
      return {
        id: m.id,
        name: m.name,
        price: m.minPrice,
        originalPrice: Number(pp?.productPrice ?? rawProduct?.productPrice ?? m.minPrice),
        priceRange: m.minPrice !== m.maxPrice ? `${m.minPrice} - ${m.maxPrice}` : null,
        rating: m.bestRating,
        reviews: m.totalReviews,
        seller: m.sellers > 1 ? `${m.sellers} sellers` : "1 seller",
        delivery: pp?.deliveryAfter ? `${pp.deliveryAfter} days` : "3-5 days",
        inStock: (pp?.stock ?? 0) > 0,
        stock: pp?.stock ?? 0,
        specs: [] as string[][],
        sellersCount: m.sellers,
        allIds: m.allIds,
        // Buygroup + pricing fields from ProductPrice
        sellType: pp?.sellType ?? "NORMALSELL",
        isBuygroup: pp?.sellType === "BUYGROUP",
        dateOpen: pp?.dateOpen ?? null,
        dateClose: pp?.dateClose ?? null,
        startTime: pp?.startTime ?? null,
        endTime: pp?.endTime ?? null,
        minCustomer: pp?.minCustomer ?? null,
        maxCustomer: pp?.maxCustomer ?? null,
        sold: 0, // TODO: track sold count
        enableChat: pp?.enableChat === true,
        isCustomProduct: pp?.isCustomProduct === "true" || pp?.isCustomProduct === true,
        consumerType: pp?.consumerType ?? "CONSUMER",
        image: rawProduct?.productImages?.[0]?.image ?? null,
      };
    });
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
          enableChat: pp.enableChat === true,
          isCustomProduct: pp.isCustomProduct === "true" || pp.isCustomProduct === true,
          // Buygroup date fields for grid card
          dateOpen: pp.dateOpen ?? null,
          dateClose: pp.dateClose ?? null,
          startTime: pp.startTime ?? null,
          endTime: pp.endTime ?? null,
          minCustomer: pp.minCustomer ?? null,
          maxCustomer: pp.maxCustomer ?? null,
        };
      });
  }, [buyDetailQuery.data]);

  // (moved up — declared before recommended/buy queries that reference them)
  const [specsOpen, setSpecsOpen] = useState(true);
  const customizeMutation = useAddCustomizeProduct();
  const { toast } = useToast();
  const [rfqPriceFrom, setRfqPriceFrom] = useState<string>("");
  const [rfqPriceTo, setRfqPriceTo] = useState<string>("");

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
  const editorRef = React.useRef<HTMLDivElement>(null);
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
  // buyListings use composite string id (productId-priceId), so match by productId
  const viewingProduct = (buyListings ?? []).find((p: any) => p.productId === viewingProductId);
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

  // Per-product quantity map for card steppers
  const [cardQtys, setCardQtys] = useState<Record<number, number>>({});
  const getCardQty = (id: number) => cardQtys[id] ?? 0;
  const setCardQty = (id: number, qty: number) => setCardQtys((prev) => ({ ...prev, [id]: Math.max(0, qty) }));

  // Buygroup disclaimer popup
  const [buygroupDisclaimerOpen, setBuygroupDisclaimerOpen] = useState(false);
  const [hasSeenBuygroupDisclaimer, setHasSeenBuygroupDisclaimer] = useState(false);
  const [buygroupPendingProductId, setBuygroupPendingProductId] = useState<number | null>(null);
  const [buygroupPendingQty, setBuygroupPendingQty] = useState(1);
  const [buygroupTimeLeft, setBuygroupTimeLeft] = useState<string | null>(null);

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

  // Buygroup countdown timer — watches product detail data
  useEffect(() => {
    const detail = productDetailQuery?.data;
    const pp = detail?.product_productPrice?.[0];
    if (!pp || pp.sellType !== "BUYGROUP" || !pp.dateClose) { setBuygroupTimeLeft(null); return; }
    const getTs = (ds: string, ts?: string) => { const d = new Date(ds); if (ts) { const [h, m] = ts.split(":").map(Number); d.setHours(h || 0, m || 0, 0, 0); } return d.getTime(); };
    const startTs = pp.dateOpen ? getTs(pp.dateOpen, pp.startTime) : 0;
    const endTs = getTs(pp.dateClose, pp.endTime);
    const fmt = (ms: number) => { const s = Math.floor(ms / 1000); const d = Math.floor(s / 86400); return `${d} ${isAr ? "يوم" : "Days"}; ${String(Math.floor((s % 86400) / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`; };
    const tick = () => {
      const now = Date.now();
      if (startTs && now < startTs) { setBuygroupTimeLeft(isAr ? "لم يبدأ بعد" : "Not Started"); return; }
      const ms = endTs - now;
      if (ms <= 0) { setBuygroupTimeLeft(isAr ? "انتهى" : "Expired"); return; }
      setBuygroupTimeLeft(fmt(ms));
    };
    tick(); const iv = setInterval(tick, 1000); return () => clearInterval(iv);
  }, [productDetailQuery?.data, isAr]);

  // ── Pricing calculation for ProductDetailView ──
  const computeDetailPricing = () => {
    const detail = productDetailQuery.data;
    const priceEntry = detail?.product_productPrice?.[0];
    const ppEntry = priceEntry || {};

    const pricingInfo = {
      consumerDiscount: ppEntry.consumerDiscount ?? 0,
      consumerDiscountType: ppEntry.consumerDiscountType ?? null,
      vendorDiscount: ppEntry.vendorDiscount ?? 0,
      vendorDiscountType: ppEntry.vendorDiscountType ?? null,
      consumerType: ppEntry.consumerType ?? "CONSUMER",
      minQuantity: ppEntry.minQuantityPerCustomer ?? ppEntry.minQuantity ?? 1,
      maxQuantity: ppEntry.maxQuantityPerCustomer ?? ppEntry.maxQuantity ?? null,
      minOrder: ppEntry.minQuantity ?? 1,
      maxOrder: ppEntry.maxQuantity ?? null,
      askForPrice: ppEntry.askForPrice === "true",
      sellType: ppEntry.sellType ?? "NORMALSELL",
      enableChat: ppEntry.enableChat ?? false,
      dateOpen: ppEntry.dateOpen ?? null,
      dateClose: ppEntry.dateClose ?? null,
      startTime: ppEntry.startTime ?? null,
      endTime: ppEntry.endTime ?? null,
      minCustomer: ppEntry.minCustomer ?? null,
      maxCustomer: ppEntry.maxCustomer ?? null,
    };

    // Category connection for vendor discount eligibility
    const categoryId = detail?.categoryId;
    const categoryLocation = detail?.category?.categoryLocation;

    // calculateDiscountedPrice — copied EXACTLY from ProductDescriptionCard
    const calculateDiscountedPrice = () => {
      const price = Number(ppEntry.productPrice ?? detail?.productPrice ?? 0);
      const offerPriceValue = Number(ppEntry.offerPrice ?? detail?.offerPrice ?? 0);

      if (offerPriceValue > 0 && offerPriceValue !== price) return offerPriceValue;

      const rawConsumerType = pricingInfo.consumerType || "CONSUMER";
      const productConsumerType = typeof rawConsumerType === "string" ? rawConsumerType.toUpperCase().trim() : "CONSUMER";
      const isVendorType = productConsumerType === "VENDOR" || productConsumerType === "VENDORS";
      const isConsumerType = productConsumerType === "CONSUMER";
      const isEveryoneType = productConsumerType === "EVERYONE";

      const isCategoryMatch = checkCategoryConnection(
        vendorBusinessCategoryIds,
        categoryId || 0,
        categoryLocation,
        []
      );

      let discount = pricingInfo.consumerDiscount || 0;
      let discountType = pricingInfo.consumerDiscountType;

      if (currentTradeRole && currentTradeRole !== "BUYER") {
        if (isCategoryMatch) {
          if (pricingInfo.vendorDiscount > 0) {
            discount = pricingInfo.vendorDiscount;
            discountType = pricingInfo.vendorDiscountType;
          } else {
            discount = 0;
          }
        } else {
          if (isEveryoneType) {
            discount = pricingInfo.consumerDiscount || 0;
            discountType = pricingInfo.consumerDiscountType;
          } else {
            discount = 0;
          }
        }
      } else {
        if (isConsumerType || isEveryoneType) {
          discount = pricingInfo.consumerDiscount || 0;
          discountType = pricingInfo.consumerDiscountType;
        } else {
          discount = 0;
        }
      }

      if (discount > 0 && discountType) {
        if (discountType === "PERCENTAGE") return Number((price - (price * discount) / 100).toFixed(2));
        if (discountType === "FLAT") return Number((price - discount).toFixed(2));
      }
      return price;
    };

    const calculatedPrice = calculateDiscountedPrice();
    const originalPrice = Number(ppEntry.productPrice ?? detail?.productPrice ?? 0);
    const hasCalcDiscount = originalPrice > calculatedPrice && calculatedPrice > 0;
    const calcDiscountPct = hasCalcDiscount ? Math.round((1 - calculatedPrice / originalPrice) * 100) : 0;

    return { pricingInfo, calculatedPrice, originalPrice, hasCalcDiscount, calcDiscountPct };
  };

  const openBuygroupDisclaimer = (priceId: number, qty: number) => {
    setBuygroupPendingProductId(priceId);
    setBuygroupPendingQty(qty);
    setBuygroupDisclaimerOpen(true);
  };

  const currencySymbol = currency?.symbol || "OMR ";

  // ── Shared card props for ProductGridCard / ProductListCard ──
  const cardCallbacks = {
    onSelectProduct: onSelectProduct ?? (() => {}),
    onSetSelectedProductId: (id: number) => {
      setSelectedProductId(id);
      trackClick.mutate({ productId: id, clickSource: 'rfq_panel', deviceId: getOrCreateDeviceId() || undefined });
    },
    onSetActiveTab: setActiveTab,
    onSetReqMode: setReqMode,
  };

  // ═══ FULL PRODUCT DETAIL VIEW (takes over panel) ═══
  if (viewingProductId && (viewingProduct || productDetailQuery.data)) {
    const pricing = computeDetailPricing();
    return (
      <ProductDetailView
        locale={locale}
        currencySymbol={currencySymbol}
        viewingProductId={viewingProductId}
        viewingProduct={viewingProduct}
        productDetailQuery={productDetailQuery}
        selectedProduct={selectedProduct}
        calculatedPrice={pricing.calculatedPrice}
        originalPrice={pricing.originalPrice}
        hasCalcDiscount={pricing.hasCalcDiscount}
        calcDiscountPct={pricing.calcDiscountPct}
        pricingInfo={pricing.pricingInfo}
        buygroupTimeLeft={buygroupTimeLeft}
        onBack={() => setViewingProductId(null)}
        onAddToCart={onAddToCart}
        onAddToRfqCart={onAddToRfqCart}
        onSetSelectedProductId={setSelectedProductId}
        onSetReqMode={setReqMode}
        onSetViewingProductId={setViewingProductId}
        onSetActiveTab={setActiveTab}
        hasSeenBuygroupDisclaimer={hasSeenBuygroupDisclaimer}
        onOpenBuygroupDisclaimer={openBuygroupDisclaimer}
      />
    );
  }

  // ═══ Shared top bar — always renders ═══
  const chipBar = (
    <FilterChipBar
      locale={locale}
      activeChips={activeChips}
      toggleChip={toggleChip}
      filtersOpen={filtersOpen}
      setFiltersOpen={setFiltersOpen}
      activeFilterCount={activeFilterCount}
      clearAllFilters={clearAllFilters}
    />
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
          <div className="border-b border-border shrink-0">
            <SortViewBar
              locale={locale}
              sortBy={sortBy}
              setSortBy={setSortBy}
              viewMode={viewMode}
              setViewMode={setViewMode}
              activeChips={activeChips}
            />
          </div>
          {/* Advanced filters panel */}
          {filtersOpen && (
            <div className="border-b border-border shrink-0">
              <AdvancedFilterPanel
                locale={locale}
                filtersOpen={filtersOpen}
                minRating={minRating}
                setMinRating={setMinRating}
                stockOnly={stockOnly}
                setStockOnly={setStockOnly}
                discountOnly={discountOnly}
                setDiscountOnly={setDiscountOnly}
                filterValues={filterValues}
                setFilterValue={setFilterValue}
                toggleMultiSelect={toggleMultiSelect}
                showCategoryFilters={false}
              />
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
                  {(realProducts ?? []).map((p) => (
                    <ProductGridCard
                      key={`grid-${p.id}`}
                      product={p}
                      locale={locale}
                      currencySymbol={currencySymbol}
                      selectedProductId={selectedProductId}
                      cardQty={getCardQty(p.id)}
                      onSetCardQty={setCardQty}
                      {...cardCallbacks}
                    />
                  ))}
                </div>
              ) : (
                (realProducts ?? []).map((p) => (
                  <ProductListCard
                    key={p.id}
                    product={p}
                    locale={locale}
                    selectedProductId={selectedProductId}
                    {...cardCallbacks}
                  />
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
            <SortViewBar
              locale={locale}
              sortBy={sortBy}
              setSortBy={setSortBy}
              viewMode={viewMode}
              setViewMode={setViewMode}
              activeChips={activeChips}
              includeDeliverySort
            />

            {/* Expanded dynamic filter panel — driven by category SpecTemplate */}
            {filtersOpen && (
              <AdvancedFilterPanel
                locale={locale}
                filtersOpen={filtersOpen}
                minRating={minRating}
                setMinRating={setMinRating}
                stockOnly={stockOnly}
                setStockOnly={setStockOnly}
                discountOnly={discountOnly}
                setDiscountOnly={setDiscountOnly}
                filterValues={filterValues}
                setFilterValue={setFilterValue}
                toggleMultiSelect={toggleMultiSelect}
                showCategoryFilters
              />
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
                {(realProducts ?? []).map((p) => (
                  <ProductGridCard
                    key={`grid-${p.id}`}
                    product={p}
                    locale={locale}
                    currencySymbol={currencySymbol}
                    selectedProductId={selectedProductId}
                    cardQty={getCardQty(p.id)}
                    onSetCardQty={setCardQty}
                    {...cardCallbacks}
                  />
                ))}
              </div>
            ) : (
              (realProducts ?? []).map((p) => (
                <ProductListCard
                  key={p.id}
                  product={p}
                  locale={locale}
                  selectedProductId={selectedProductId}
                  showSelection
                  {...cardCallbacks}
                />
              ))
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
                {recommendedProducts.map((p: any) => (
                  <ProductListCard
                    key={p.id}
                    product={p}
                    locale={locale}
                    selectedProductId={selectedProductId}
                    isRecommended
                    showSelection
                    {...cardCallbacks}
                  />
                ))}
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
                <button type="button"
                  onClick={() => {
                    const from = rfqPriceFrom ? Number(rfqPriceFrom) : undefined;
                    const to = rfqPriceTo ? Number(rfqPriceTo) : undefined;
                    onAddToRfqCart?.(selectedProduct.id, from, to);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 py-2 text-[11px] font-bold">
                  <ShoppingCart className="h-3.5 w-3.5" /> {isAr ? "أضف لسلة الأسعار" : "Add to RFQ Cart"}
                </button>
                <button type="button"
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
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50 py-2 text-[11px] font-bold">
                  {customizeMutation.isPending
                    ? <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <Wrench className="h-3.5 w-3.5" />}
                  {isAr ? `اطلب تخصيص من ${selectedProduct.seller}` : `Ask ${selectedProduct.seller} to Customize`}
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
                ref={editorRef}
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

            {/* ── Price Range (below attachments) ── */}
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
        )}

        {/* ═══ BUY / CUSTOMIZE TAB — vendors for selected product ═══ */}
        {activeTab === "buynow" && (
          <BuyTab
            locale={locale}
            selectedProduct={selectedProduct}
            buyListings={buyListings}
            buyDetailQuery={buyDetailQuery}
            buygroupTimeLeft={buygroupTimeLeft}
            getCardQty={getCardQty}
            setCardQty={setCardQty}
            onAddToCart={onAddToCart}
            onSetSelectedProductId={setSelectedProductId}
            onSetViewingProductId={setViewingProductId}
            onSetReqMode={setReqMode}
            onSetActiveTab={setActiveTab}
            hasSeenBuygroupDisclaimer={hasSeenBuygroupDisclaimer}
            onOpenBuygroupDisclaimer={openBuygroupDisclaimer}
          />
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

      {/* ═══ Buygroup Disclaimer Popup — exact copy from ProductCard ═══ */}
      <Dialog open={buygroupDisclaimerOpen} onOpenChange={setBuygroupDisclaimerOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground mb-4">
              {isAr ? "كيف تعمل مجموعات الشراء" : "How Buygroups Work"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-muted-foreground">
            <div>
              <h3 className="font-semibold text-foreground mb-2">{isAr ? "ما هي مجموعة الشراء؟" : "What is a Buygroup?"}</h3>
              <p className="text-sm leading-relaxed">
                {isAr
                  ? "مجموعة الشراء هي نظام شراء جماعي حيث يجتمع عدة عملاء لشراء المنتجات بأسعار أفضل. عندما تحجز منتجًا في مجموعة شراء، فأنت تحجز مكانك لهذا المنتج."
                  : "A buygroup is a collective purchasing system where multiple customers come together to purchase products at better prices. When you book a product in a buygroup, you're reserving your spot for that item."}
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">{isAr ? "كيف يعمل:" : "How It Works:"}</h3>
              <ul className="list-disc list-inside space-y-2 text-sm leading-relaxed">
                <li>{isAr ? "اختر الكمية التي تريد حجزها" : "Select the quantity you want to book"}</li>
                <li>{isAr ? "اضغط \"حجز\" لتأكيد مكانك" : 'Click "Book" to reserve your items'}</li>
                <li>{isAr ? "انتظر حتى تصل المجموعة للعدد المطلوب" : "Wait for the buygroup to reach the required number of participants"}</li>
                <li>{isAr ? "بمجرد اكتمال المجموعة، سيتم إخطارك للدفع" : "Once the buygroup is complete, you'll be notified and can proceed with payment"}</li>
                <li>{isAr ? "يتم تأكيد حجزك فقط بعد وصول المجموعة لهدفها" : "Your booking is confirmed only after the buygroup reaches its target"}</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">{isAr ? "ملاحظات مهمة:" : "Important Notes:"}</h3>
              <ul className="list-disc list-inside space-y-2 text-sm leading-relaxed">
                <li>{isAr ? "حجزك هو حجز وليس شراء فوري" : "Your booking is a reservation, not an immediate purchase"}</li>
                <li>{isAr ? "يمكنك إلغاء حجزك قبل إغلاق المجموعة" : "You can cancel your booking before the buygroup closes"}</li>
                <li>{isAr ? "إذا لم تصل المجموعة لهدفها، سيتم إلغاء حجزك تلقائيًا" : "If the buygroup doesn't reach its target, your booking will be automatically cancelled"}</li>
                <li>{isAr ? "ستتلقى إشعارات حول حالة المجموعة" : "You'll receive notifications about the buygroup status"}</li>
              </ul>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-border">
            <button onClick={() => setBuygroupDisclaimerOpen(false)}
              className="px-4 py-2 text-sm font-medium text-muted-foreground bg-card border border-border rounded hover:bg-muted transition-colors">
              {isAr ? "إلغاء" : "Cancel"}
            </button>
            <button onClick={() => {
              setBuygroupDisclaimerOpen(false);
              setHasSeenBuygroupDisclaimer(true);
              if (buygroupPendingProductId) {
                onAddToCart(buygroupPendingProductId, buygroupPendingQty);
                setBuygroupPendingProductId(null);
                setBuygroupPendingQty(1);
              }
            }}
              className="px-4 py-2 text-sm font-medium text-white bg-primary rounded hover:bg-primary/90 transition-colors">
              {isAr ? "أفهم، متابعة" : "I Understand, Proceed"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
