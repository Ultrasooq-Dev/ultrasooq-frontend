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
} from "lucide-react";

// ─── Mock Data ──────────────────────────────────────────────────
const MOCK_PRODUCTS = [
  {
    id: 1, name: "Sony WH-1000XM5", price: 95, rating: 4.7, reviews: 234,
    seller: "Tech Store Oman", delivery: "3-5 days", inStock: true, stock: 120,
    specs: [
      ["Driver", "30mm"], ["ANC", "Adaptive, Auto Optimizer"], ["BT", "5.2 LDAC"],
      ["Battery", "30hrs"], ["Charge", "USB-C, 3min=3hrs"], ["Weight", "250g"],
      ["Fold", "Yes"], ["Mics", "8, AI noise reduction"], ["Multipoint", "2 devices"],
    ],
  },
  {
    id: 2, name: "JBL Tune 770NC", price: 45, rating: 4.3, reviews: 156,
    seller: "Audio World LLC", delivery: "2-4 days", inStock: true, stock: 85,
    specs: [
      ["Driver", "40mm"], ["ANC", "Adaptive"], ["BT", "5.3 AAC"],
      ["Battery", "44hrs"], ["Charge", "USB-C, 5min=3hrs"], ["Weight", "226g"],
      ["Fold", "Yes"], ["Mics", "Built-in VoiceAware"], ["Multipoint", "2 devices"],
    ],
  },
  {
    id: 3, name: "Bose QC Ultra", price: 120, rating: 4.8, reviews: 89,
    seller: "Premium Electronics", delivery: "5-7 days", inStock: false, stock: 0,
    specs: [
      ["Driver", "35mm"], ["ANC", "CustomTune Quiet/Aware"], ["BT", "5.3 aptX"],
      ["Battery", "24hrs"], ["Charge", "USB-C, 15min=2.5hrs"], ["Weight", "250g"],
      ["Fold", "Yes + case"], ["Mics", "6, wind rejection"], ["Multipoint", "Yes + Snapdragon"],
    ],
  },
  {
    id: 4, name: "Samsung AKG N700", price: 65, rating: 4.1, reviews: 67,
    seller: "Gulf Gadgets", delivery: "3-5 days", inStock: true, stock: 30,
    specs: [
      ["Driver", "40mm"], ["ANC", "Adaptive + Ambient"], ["BT", "5.0 Scalable"],
      ["Battery", "20hrs"], ["Charge", "USB-C"], ["Weight", "264g"],
      ["Fold", "Yes"], ["Mics", "3 total"], ["Multipoint", "No"],
    ],
  },
];

const MOCK_MESSAGES = [
  { id: 1, isOwn: false, text: "Found 4 matching products. Sony WH-1000XM5 is the best for ANC.", time: "2m" },
  { id: 2, isOwn: true, text: "Do they come with warranty? Need at least 1 year.", time: "1m" },
  { id: 3, isOwn: false, text: "Yes, all include 1yr. Tech Store offers 2yrs.", time: "now" },
];

// Vendor listings PER product model — keyed by product ID
// When customer selects a model from Products tab, this shows all vendors selling it
const VENDOR_LISTINGS: Record<number, Array<{
  id: number; seller: string; price: number; originalPrice: number; discount: number;
  stock: number; rating: number; warranty: string; origin: string; shipping: string; minOrder: number;
  description: string; specs: string[][];
}>> = {
  1: [ // Sony WH-1000XM5
    { id: 101, seller: "Tech Store Oman", price: 92, originalPrice: 110, discount: 16, stock: 120, rating: 4.8, warranty: "2 years", origin: "Japan", shipping: "Free over 50 OMR", minOrder: 1,
      description: "Authorized dealer. Factory sealed with full warranty.", specs: [["Driver", "30mm"], ["ANC", "Adaptive"], ["BT", "5.2 LDAC"], ["Battery", "30hrs"], ["Weight", "250g"]] },
    { id: 102, seller: "Gulf Electronics", price: 88, originalPrice: 110, discount: 20, stock: 45, rating: 4.5, warranty: "1 year", origin: "UAE Import", shipping: "3-5 days", minOrder: 5,
      description: "Bulk pricing available. Min order 5 units.", specs: [["Driver", "30mm"], ["ANC", "Adaptive"], ["BT", "5.2 LDAC"], ["Battery", "30hrs"], ["Weight", "250g"]] },
    { id: 103, seller: "Premium Audio Co.", price: 95, originalPrice: 110, discount: 14, stock: 200, rating: 4.9, warranty: "3 years", origin: "Japan", shipping: "Next day delivery", minOrder: 1,
      description: "Official Sony partner. Extended 3-year warranty included.", specs: [["Driver", "30mm"], ["ANC", "Adaptive"], ["BT", "5.2 LDAC"], ["Battery", "30hrs"], ["Weight", "250g"]] },
    { id: 104, seller: "Sound Wave LLC", price: 85, originalPrice: 110, discount: 23, stock: 15, rating: 4.2, warranty: "1 year", origin: "China Import", shipping: "5-7 days", minOrder: 10,
      description: "Best bulk price. Minimum 10 units. Custom packaging available.", specs: [["Driver", "30mm"], ["ANC", "Adaptive"], ["BT", "5.2 LDAC"], ["Battery", "30hrs"], ["Weight", "250g"]] },
  ],
  2: [ // JBL Tune 770NC
    { id: 201, seller: "Audio World LLC", price: 42, originalPrice: 55, discount: 24, stock: 85, rating: 4.3, warranty: "1 year", origin: "China", shipping: "3-5 days", minOrder: 1,
      description: "JBL authorized. Full warranty.", specs: [["Driver", "40mm"], ["ANC", "Adaptive"], ["BT", "5.3"], ["Battery", "44hrs"], ["Weight", "226g"]] },
    { id: 202, seller: "Tech Store Oman", price: 45, originalPrice: 55, discount: 18, stock: 60, rating: 4.8, warranty: "2 years", origin: "China", shipping: "Free over 50 OMR", minOrder: 1,
      description: "Extended 2-year warranty. Free carrying case.", specs: [["Driver", "40mm"], ["ANC", "Adaptive"], ["BT", "5.3"], ["Battery", "44hrs"], ["Weight", "226g"]] },
  ],
  3: [ // Bose QC Ultra
    { id: 301, seller: "Premium Electronics", price: 120, originalPrice: 140, discount: 14, stock: 30, rating: 4.7, warranty: "2 years", origin: "USA", shipping: "5-7 days", minOrder: 1,
      description: "Bose authorized dealer. CustomTune technology.", specs: [["Driver", "35mm"], ["ANC", "CustomTune"], ["BT", "5.3 aptX"], ["Battery", "24hrs"], ["Weight", "250g"]] },
  ],
  4: [ // Samsung AKG N700
    { id: 401, seller: "Gulf Gadgets", price: 62, originalPrice: 75, discount: 17, stock: 30, rating: 4.1, warranty: "1 year", origin: "South Korea", shipping: "3-5 days", minOrder: 1,
      description: "Samsung authorized. AKG-tuned sound.", specs: [["Driver", "40mm"], ["ANC", "Adaptive"], ["BT", "5.0"], ["Battery", "20hrs"], ["Weight", "264g"]] },
    { id: 402, seller: "Mobile Hub Oman", price: 58, originalPrice: 75, discount: 23, stock: 12, rating: 4.0, warranty: "6 months", origin: "Import", shipping: "3-5 days", minOrder: 3,
      description: "Competitive bulk price. Min 3 units.", specs: [["Driver", "40mm"], ["ANC", "Adaptive"], ["BT", "5.0"], ["Battery", "20hrs"], ["Weight", "264g"]] },
  ],
};

// For the product detail view, flatten all vendor listings
const ALL_VENDOR_LISTINGS = Object.values(VENDOR_LISTINGS).flat();

// ─── Component ──────────────────────────────────────────────────
interface ItemDetailPanelProps {
  selectedItemId: string | null;
  searchTerm?: string;
  onAddToCart: (productId: number) => void;
  onSelectProduct?: (product: any) => void;
  locale: string;
}

export default function ItemDetailPanel({ selectedItemId, searchTerm, onAddToCart, onSelectProduct, locale }: ItemDetailPanelProps) {
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

  // Reset page when search term changes
  useEffect(() => { setSearchPage(1); }, [searchTerm]);

  // ── Real product search — uses unified intelligent search ──
  const productSearchQuery = useQuery({
    queryKey: ["product-hub-search", searchTerm, searchPage],
    queryFn: async () => {
      const cleanTerm = searchTerm?.trim();
      if (!cleanTerm) return { data: [], totalCount: 0 };
      try {
        const res = await http.get(`${getApiUrl()}/product/search/unified`, { params: { q: cleanTerm, page: searchPage, limit: PRODUCTS_PER_PAGE } });
        console.log("[Search] Unified response:", { status: res.status, dataLength: res.data?.data?.length, totalCount: res.data?.totalCount });
        const data = res.data?.data ?? [];
        const totalCount = res.data?.totalCount ?? 0;
        if (Array.isArray(data) && data.length > 0) return { data, totalCount };
        console.log("[Search] Unified returned empty, trying fallback");
      } catch (err: any) {
        console.error("[Search] Unified search failed:", err?.response?.status, err?.message, err?.config?.url);
      }
      // Fallback to traditional search
      try {
        const res = await http.get(`${getApiUrl()}/product/getAllProduct`, { params: { page: searchPage, limit: PRODUCTS_PER_PAGE, term: cleanTerm } });
        console.log("[Search] Fallback response:", { status: res.status, dataLength: res.data?.data?.length, totalCount: res.data?.totalCount });
        return { data: res.data?.data ?? [], totalCount: res.data?.totalCount ?? 0 };
      } catch (err: any) {
        console.error("[Search] Fallback also failed:", err?.response?.status, err?.message);
      }
      return { data: [], totalCount: 0 };
    },
    enabled: !!searchTerm && searchTerm.length >= 1,
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

  // ── Recommended products: expand results when few matches ──
  const topProductId = (realProducts ?? [])[0]?.id;
  const needsRecommendations = (realProducts ?? []).length < 5;
  const recommendedQuery = useQuery({
    queryKey: ["product-hub-recommended", topProductId],
    queryFn: async () => {
      if (!topProductId) return { items: [] };
      try {
        const res = await http.get(`${getApiUrl()}/recommendations/product/${topProductId}`, {
          params: { type: "similar", limit: 10 },
        });
        return res.data ?? { items: [] };
      } catch { return { items: [] }; }
    },
    enabled: !!topProductId && needsRecommendations && activeTab === "products",
    staleTime: 60_000,
  });

  // Map recommended products to same format
  const recommendedProducts = useMemo(() => {
    const items = recommendedQuery?.data?.items ?? [];
    if (!Array.isArray(items) || items.length === 0) return [];
    const existingIds = new Set((realProducts ?? []).map((p: any) => p.productId ?? p.id));
    return items
      .filter((p: any) => !existingIds.has(p.productId))
      .map((p: any) => ({
        id: p.productId,
        name: p.productName ?? p.name ?? `Product #${p.productId}`,
        price: Number(p.price ?? 0),
        rating: 4.0,
        reviews: 0,
        seller: p.sellerName ?? "Vendor",
        delivery: "3-5 days",
        inStock: true,
        stock: 50,
        specs: [] as string[][],
        isRecommended: true,
      }));
  }, [recommendedQuery?.data, realProducts]);

  // ── Buy/Customize: search all sellers for selected product ──
  const selectedProductForBuy = (realProducts ?? []).find((p: any) => p.id === selectedProductId);
  const buySearchQuery = useQuery({
    queryKey: ["product-buy-search", selectedProductId, selectedProductForBuy?.name],
    queryFn: async () => {
      if (!selectedProductForBuy?.name) return { data: [], totalCount: 0 };
      try {
        // Search for the same product name — finds all sellers' listings
        const res = await http.get(`${getApiUrl()}/product/search/unified`, {
          params: { q: selectedProductForBuy.name.substring(0, 50), page: 1, limit: 20 },
        });
        return { data: res.data?.data ?? [], totalCount: res.data?.totalCount ?? 0 };
      } catch { return { data: [], totalCount: 0 }; }
    },
    enabled: !!selectedProductId && !!selectedProductForBuy?.name && activeTab === "buynow",
    staleTime: 60_000,
  });

  // Map buy results to vendor listing format
  const buyListings = useMemo(() => {
    const data = buySearchQuery?.data?.data ?? [];
    if (!Array.isArray(data) || data.length === 0) return [];
    return data.map((p: any) => ({
      id: p.id,
      name: p.productName ?? "Product",
      seller: p.adminName ?? p.sellerName ?? "Vendor",
      price: Number(p.offerPrice ?? p.productPrice ?? 0),
      originalPrice: Number(p.productPrice ?? p.offerPrice ?? 0),
      rating: p.rating ?? p.averageRating ?? 4.0,
      reviews: p.reviewCount ?? 0,
      stock: p.stock ?? 50,
      delivery: "3-5 days",
      inStock: true,
    }));
  }, [buySearchQuery?.data]);

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

  const activeFilterCount = Object.keys(filterValues).length + (minRating > 0 ? 1 : 0) + (stockOnly ? 1 : 0) + (discountOnly ? 1 : 0);

  const clearAllFilters = () => {
    setFilterValues({});
    setMinRating(0);
    setStockOnly(false);
    setDiscountOnly(false);
  };

  // Try real products first, fall back to mock
  const selectedProduct = (realProducts ?? []).find((p: any) => p.id === selectedProductId)
    ?? MOCK_PRODUCTS.find((p) => p.id === selectedProductId);
  const viewingProduct = ALL_VENDOR_LISTINGS.find((p) => p.id === viewingProductId);
  // Vendor listings: try mock first, then create from real product data
  const vendorListings = selectedProductId
    ? (VENDOR_LISTINGS[selectedProductId] ?? (selectedProduct ? [{
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
      }] : []))
    : [];


  // ═══ FULL PRODUCT DETAIL VIEW (takes over panel) ═══
  if (viewingProductId && viewingProduct) {
    const mockImages = [1, 2, 3, 4];
    const mockColors = [
      { name: "Black", hex: "#1a1a1a", selected: true },
      { name: "Silver", hex: "#c0c0c0", selected: false },
      { name: "Blue", hex: "#2563eb", selected: false },
    ];
    const bulkPricing = [
      { min: 1, max: 9, price: viewingProduct.price },
      { min: 10, max: 49, price: Math.round(viewingProduct.price * 0.95) },
      { min: 50, max: 99, price: Math.round(viewingProduct.price * 0.9) },
      { min: 100, max: null, price: Math.round(viewingProduct.price * 0.85) },
    ];
    const mockReviews = [
      { user: "Ahmed K.", rating: 5, text: "Excellent noise cancelling. Best for office use.", date: "Mar 15" },
      { user: "Sara M.", rating: 4, text: "Great sound quality but a bit tight for large heads.", date: "Mar 10" },
      { user: "Omar A.", rating: 5, text: "Battery lasts forever. Very comfortable for long flights.", date: "Feb 28" },
    ];

    return (
      <div className="flex flex-col h-full min-h-0 bg-background">
        {/* Back header */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-border shrink-0">
          <button type="button" onClick={() => setViewingProductId(null)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ChevronDown className="h-3.5 w-3.5 rotate-90" /> {isAr ? "رجوع" : "Back"}
          </button>
          <span className="ms-auto text-xs text-muted-foreground">{viewingProduct.seller}</span>
        </div>

        {/* Scrollable detail */}
        <div className="flex-1 overflow-y-auto">
          {/* Image gallery */}
          <div className="bg-muted/20 p-4">
            <div className="flex gap-2">
              {/* Main image */}
              <div className="flex-1 h-48 rounded-lg bg-muted flex items-center justify-center">
                <ShoppingCart className="h-16 w-16 text-muted-foreground/15" />
              </div>
              {/* Thumbnail strip */}
              <div className="flex flex-col gap-1.5 w-14">
                {mockImages.map((_, i) => (
                  <div key={i} className={cn(
                    "h-11 rounded border-2 bg-muted flex items-center justify-center cursor-pointer",
                    i === 0 ? "border-primary" : "border-transparent hover:border-muted-foreground/30"
                  )}>
                    <ShoppingCart className="h-3 w-3 text-muted-foreground/20" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="px-4 py-3 space-y-4">
            {/* Title + Seller side by side */}
            <div className="flex gap-4">
              {/* Product info */}
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-bold">{selectedProduct?.name ?? viewingProduct.seller}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xl font-bold text-green-600">{viewingProduct.price} OMR</span>
                  <span className="text-sm text-muted-foreground line-through">{viewingProduct.originalPrice} OMR</span>
                  <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-1.5 py-0.5 rounded font-semibold">-{viewingProduct.discount}%</span>
                </div>
                <div className="flex items-center gap-1 mt-1.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={cn("h-3.5 w-3.5", s <= Math.round(viewingProduct.rating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20")} />
                  ))}
                  <span className="text-xs text-muted-foreground ms-1">{viewingProduct.rating} ({Math.floor(viewingProduct.rating * 50)})</span>
                </div>
              </div>

              {/* Seller card — beside product name */}
              <div className="shrink-0 w-36 rounded-lg border border-border p-2.5 bg-muted/10">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                    {viewingProduct.seller.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-semibold block truncate">{viewingProduct.seller}</span>
                    <span className="text-[8px] text-green-600 flex items-center gap-0.5"><Check className="h-2 w-2" />{isAr ? "موثق" : "Verified"}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[9px] text-muted-foreground">
                  <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" /> {viewingProduct.origin}</span>
                  <span className="flex items-center gap-0.5"><Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" /> {viewingProduct.rating}</span>
                </div>
                <div className="text-[8px] text-muted-foreground mt-1">98% {isAr ? "إيجابي" : "positive"} · 500+ {isAr ? "طلب" : "orders"}</div>
                <button type="button" className="w-full mt-1.5 text-[9px] font-medium text-primary border border-primary/30 rounded py-1 hover:bg-primary/5">
                  {isAr ? "زيارة المتجر" : "Visit Store"}
                </button>
              </div>
            </div>

            {/* Color selection + badges row */}
            <div className="flex items-end gap-4">
              <div>
                <h3 className="text-[11px] font-semibold mb-1.5">{isAr ? "اللون" : "Color"}: <span className="font-normal text-muted-foreground">Black</span></h3>
                <div className="flex gap-2">
                  {mockColors.map((c) => (
                    <button key={c.name} type="button" className={cn(
                      "h-8 w-8 rounded-full border-2 transition-all",
                      c.selected ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-muted-foreground"
                    )} style={{ backgroundColor: c.hex }} title={c.name} />
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <span className="flex items-center gap-1 text-[9px] bg-green-50 dark:bg-green-950/20 text-green-700 px-1.5 py-0.5 rounded">
                  <Zap className="h-2.5 w-2.5" /> {viewingProduct.stock}
                </span>
                <span className="flex items-center gap-1 text-[9px] bg-muted px-1.5 py-0.5 rounded">
                  <Shield className="h-2.5 w-2.5" /> {viewingProduct.warranty}
                </span>
                <span className="flex items-center gap-1 text-[9px] bg-muted px-1.5 py-0.5 rounded">
                  <Truck className="h-2.5 w-2.5" /> {viewingProduct.shipping}
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
                        {isAr ? "وفر" : "Save"} {Math.round((1 - tier.price / viewingProduct.price) * 100)}%
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-[11px] font-semibold mb-1">{isAr ? "الوصف" : "Description"}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{viewingProduct.description}</p>
            </div>

            {/* Specifications */}
            <div>
              <h3 className="text-[11px] font-semibold mb-1">{isAr ? "المواصفات" : "Specifications"}</h3>
              <div className="rounded-lg border border-border overflow-hidden">
                {viewingProduct.specs.map(([key, val], i) => (
                  <div key={i} className={cn("flex items-center px-3 py-1.5 text-xs", i % 2 === 0 ? "bg-muted/30" : "bg-background")}>
                    <span className="text-muted-foreground w-24 shrink-0">{key}</span>
                    <span className="font-medium">{val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <h3 className="text-[11px] font-semibold">{isAr ? "التقييمات" : "Reviews"} ({mockReviews.length})</h3>
                <button type="button" className="text-[10px] text-primary">{isAr ? "عرض الكل" : "View all"}</button>
              </div>
              <div className="space-y-2">
                {mockReviews.map((r, i) => (
                  <div key={i} className="rounded-lg border border-border p-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[9px] font-bold">{r.user.charAt(0)}</div>
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
            </div>

            {/* Q&A section */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <h3 className="text-[11px] font-semibold">{isAr ? "أسئلة وأجوبة" : "Q&A"} (2)</h3>
                <button type="button" className="text-[10px] text-primary">{isAr ? "اسأل سؤال" : "Ask a question"}</button>
              </div>
              <div className="space-y-2">
                <div className="rounded-lg border border-border p-2.5">
                  <p className="text-[11px] font-medium">Q: Does it work with PS5?</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">A: Yes, via Bluetooth or 3.5mm cable. — <span className="text-primary">Seller</span></p>
                </div>
                <div className="rounded-lg border border-border p-2.5">
                  <p className="text-[11px] font-medium">Q: Can I use it for calls on laptop?</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">A: Yes, multipoint supports 2 devices simultaneously. — <span className="text-primary">Seller</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky bottom: qty + add to cart + RFQ option */}
        <div className="border-t border-border px-4 py-2.5 shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              <button type="button" className="flex h-8 w-8 items-center justify-center rounded-s-md border border-border bg-muted text-muted-foreground"><Minus className="h-3 w-3" /></button>
              <div className="flex h-8 w-12 items-center justify-center border-y border-border bg-background text-sm font-semibold">1</div>
              <button type="button" className="flex h-8 w-8 items-center justify-center rounded-e-md border border-border bg-muted text-muted-foreground"><Plus className="h-3 w-3" /></button>
            </div>
            <button type="button" className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 py-2 text-xs font-bold">
              <CreditCard className="h-3.5 w-3.5" /> {isAr ? "شراء" : "Buy"} — {viewingProduct.price} OMR
            </button>
            <button type="button" onClick={() => { onAddToCart(viewingProduct.id); setViewingProductId(null); }}
              className="flex items-center justify-center gap-1 rounded-lg border border-primary text-primary hover:bg-primary/5 px-3 py-2 text-xs font-semibold">
              <FileText className="h-3.5 w-3.5" /> RFQ
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedItemId) {
    return (
      <div className="flex flex-col h-full min-h-0 bg-background">
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
          <MessageSquare className="h-12 w-12 mb-3 opacity-15" />
          <h3 className="text-sm font-semibold mb-1">{isAr ? "تفاصيل العنصر" : "Item Details"}</h3>
          <p className="text-xs text-center max-w-[200px] opacity-60">
            {isAr ? "اختر عنصر من القائمة" : "Select an item from the list"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0 bg-background">
      {/* Item header */}
      <div className="px-4 py-2.5 border-b border-border shrink-0">
        <h3 className="text-sm font-bold">{searchTerm ?? selectedItemId ?? ""}</h3>
      </div>

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

      {/* ═══ FILTER & SORT — fixed below tabs ═══ */}
      {(activeTab === "products" || activeTab === "buynow") && (
        <div className="border-b border-border shrink-0">
            {/* Toggle bar */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/20">
              {/* Sort */}
              <div className="flex items-center gap-1">
                <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                  className="text-[10px] bg-background border border-border rounded px-1.5 py-0.5 outline-none">
                  <option value="price-asc">{isAr ? "السعر: الأقل" : "Price: Low→High"}</option>
                  <option value="price-desc">{isAr ? "السعر: الأعلى" : "Price: High→Low"}</option>
                  <option value="rating-desc">{isAr ? "التقييم: الأعلى" : "Rating: Best"}</option>
                  <option value="delivery-asc">{isAr ? "التوصيل: الأسرع" : "Delivery: Fastest"}</option>
                  <option value="discount-desc">{isAr ? "الخصم: الأكبر" : "Discount: Biggest"}</option>
                </select>
              </div>

              <div className="h-3 w-px bg-border" />

              {/* Fixed filters: sell type chips */}
              {[
                { key: "retail", l: isAr ? "تجزئة" : "Retail" },
                { key: "wholesale", l: isAr ? "جملة" : "Wholesale" },
                { key: "buygroup", l: isAr ? "مجموعة شراء" : "Buy Group" },
              ].map((t) => (
                <button key={t.key} type="button"
                  className="text-[9px] px-1.5 py-0.5 rounded-full border border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground transition-colors">
                  {t.l}
                </button>
              ))}
              <label className="flex items-center gap-1 text-[9px] cursor-pointer shrink-0">
                <input type="checkbox" className="rounded border-border text-amber-600 h-3 w-3" />
                <Wrench className="h-2.5 w-2.5 text-amber-600" />
                <span>{isAr ? "قابل للتخصيص" : "Customizable"}</span>
              </label>

              <div className="h-3 w-px bg-border" />

              {/* Filter toggle */}
              <button type="button" onClick={() => setFiltersOpen(!filtersOpen)}
                className={cn("flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md transition-colors",
                  filtersOpen ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground")}>
                <SlidersHorizontal className="h-3 w-3" />
                {isAr ? "فلاتر" : "Filters"}
                {activeFilterCount > 0 && (
                  <span className="flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[8px] font-bold px-0.5">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {/* Clear all */}
              {activeFilterCount > 0 && (
                <button type="button" onClick={clearAllFilters}
                  className="flex items-center gap-0.5 text-[9px] text-muted-foreground hover:text-destructive ms-auto">
                  <RotateCcw className="h-2.5 w-2.5" /> {isAr ? "مسح" : "Clear"}
                </button>
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


            {/* Create RFQ + AI Suggest */}
            <div className="flex gap-2">
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
            </div>

            {/* Loading */}
            {productSearchQuery.isLoading && (
              <div className="flex items-center justify-center py-6">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-primary" />
                <span className="text-[10px] text-muted-foreground ms-2">{isAr ? "جاري البحث..." : "Searching..."}</span>
              </div>
            )}

            {/* No results message */}
            {!productSearchQuery.isLoading && searchTerm && (realProducts ?? []).length === 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50/50 dark:bg-amber-950/10 p-4 text-center">
                <span className="text-xs text-amber-700 dark:text-amber-400 font-semibold block">
                  {isAr ? `لا توجد نتائج لـ "${searchTerm}"` : `No results for "${searchTerm}"`}
                </span>
                <span className="text-[10px] text-amber-600/70 mt-1 block">
                  {isAr ? "جرب كلمات مختلفة أو أنشئ طلب أسعار مخصص" : "Try different keywords or create a custom RFQ above"}
                </span>
              </div>
            )}

            {/* Product list — real results only, no mock fallback */}
            {(realProducts ?? []).map((p) => {
              const isSel = p.id === selectedProductId;
              return (
                <div
                  key={p.id}
                  onClick={() => { setSelectedProductId(p.id); onSelectProduct?.(p); }}
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
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setSelectedProductId(p.id); setReqMode("rfq"); setActiveTab("customize"); }}
                        className="flex items-center gap-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 px-2 py-1 text-[10px] font-semibold"
                      >
                        <FileText className="h-3 w-3" /> RFQ
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setSelectedProductId(p.id); setActiveTab("buynow"); }}
                        className="flex items-center gap-1 rounded bg-green-600 text-white hover:bg-green-700 px-2 py-1 text-[10px] font-semibold"
                      >
                        <ShoppingCart className="h-3 w-3" /> {isAr ? "شراء / تخصيص" : "Buy / Customize"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

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
                      className={cn(
                        "flex items-center gap-2 rounded-lg border p-2 mb-1 cursor-pointer transition-all",
                        isSel ? "border-primary bg-primary/5 shadow-sm" : "border-border/50 border-dashed hover:border-primary/30 bg-background/50"
                      )}
                    >
                      <div className="h-9 w-9 rounded bg-muted/50 flex items-center justify-center shrink-0">
                        <ShoppingCart className="h-3.5 w-3.5 text-muted-foreground/20" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-semibold truncate block">{p.name}</span>
                          <span className="text-[7px] bg-purple-100 text-purple-700 px-1 rounded shrink-0">{isAr ? "مقترح" : "Suggested"}</span>
                        </div>
                        <span className="text-[8px] text-muted-foreground">{p.seller}</span>
                      </div>
                      <span className="text-[11px] font-bold text-primary shrink-0">{p.price} OMR</span>
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
                    ? selectedProduct.specs.map(([key, val]: [string, string], i: number) => (
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
                  <span className="text-[11px] font-bold block truncate">{selectedProduct.name}</span>
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

            <div className="space-y-1">
              {buyListings.map((p: any) => (
                <div key={p.id} className="flex items-center gap-2 rounded border border-border hover:border-primary/30 px-2 py-1.5 transition-colors bg-background">
                  {/* Seller avatar */}
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[8px] font-bold shrink-0">
                    {(p.seller || "V").charAt(0)}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] font-semibold truncate">{p.seller}</span>
                      <Star className="h-2 w-2 fill-amber-400 text-amber-400 shrink-0" />
                      <span className="text-[8px]">{p.rating}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[8px] text-muted-foreground">
                      <span className={p.inStock ? "text-green-600" : "text-destructive"}>
                        {p.stock} {isAr ? "متوفر" : "in stock"}
                      </span>
                      <span>·</span>
                      <span>{p.delivery}</span>
                    </div>
                  </div>
                  {/* Price */}
                  <div className="text-end shrink-0 me-1">
                    <span className="text-xs font-bold text-green-600">{p.price}</span>
                    <span className="text-[7px] text-green-600 ms-0.5">OMR</span>
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button type="button" onClick={(e) => { e.stopPropagation(); onAddToCart(p.id); }}
                      className="rounded bg-green-600 text-white hover:bg-green-700 px-2 py-1 text-[8px] font-semibold">
                      {isAr ? "شراء" : "Buy"}
                    </button>
                    <button type="button"
                      onClick={(e) => { e.stopPropagation(); setSelectedProductId(p.id); setReqMode("vendor"); setActiveTab("customize"); }}
                      className="rounded border border-amber-400 text-amber-700 hover:bg-amber-50 px-1.5 py-1 text-[8px]">
                      <Wrench className="h-2.5 w-2.5" />
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
            {MOCK_MESSAGES.length > 0 && (
              <span className="text-[8px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{MOCK_MESSAGES.length}</span>
            )}
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
              {MOCK_MESSAGES.map((msg) => (
                <div key={msg.id} className={cn("flex gap-1.5", msg.isOwn && "flex-row-reverse")}>
                  <div className={cn(
                    "max-w-[80%] rounded-lg px-2 py-1 text-[10px]",
                    msg.isOwn ? "bg-primary text-primary-foreground" : "bg-muted"
                  )}>{msg.text}</div>
                  <span className="text-[7px] text-muted-foreground self-end">{msg.time}</span>
                </div>
              ))}
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
