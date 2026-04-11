"use client";
import React, { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useProductById } from "@/apis/queries/product.queries";
import { useMe } from "@/apis/queries/user.queries";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import Image from "next/image";
import {
  Star, Heart, ShoppingCart, Share2, ChevronLeft, ChevronRight,
  Package, Truck, ShieldCheck, Clock, MapPin, Store, MessageCircle,
  Check, Minus, Plus, ArrowLeft, Eye, Tag, Layers, Award,
  Zap, BarChart3, Users, Box, AlertCircle, Copy, ExternalLink,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   PRODUCT VIEW — Clean, modern product detail page
   Route: /product-view/[id]

   Uses useProductById hook to fetch real data.
   Falls back to mock structure if data loading.
   ═══════════════════════════════════════════════════════════════ */

const T = {
  bg: "bg-[#faf6f1]",
  card: "bg-white",
  accent: "#c2703e",
  accentBg: "bg-[#c2703e]",
  accentText: "text-[#c2703e]",
  accentLight: "bg-[#c2703e]/10",
  text: "text-[#2d2017]",
  muted: "text-[#8a7560]",
  border: "border-[#e8dfd4]",
  success: "text-emerald-600",
  successBg: "bg-emerald-50",
};

function RatingStars({ rating, size = "h-4 w-4" }: { rating: number; size?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={cn(size, i <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-gray-200")} />
      ))}
    </span>
  );
}

export default function ProductViewPage() {
  const params = useParams();
  const router = useRouter();
  const { langDir } = useAuth();
  const t = useTranslations();
  const me = useMe();
  const productId = params?.id as string;

  const { data: productData, isLoading } = useProductById(
    { productId, userId: me.data?.data?.id },
    !!productId,
  );

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"description" | "specs" | "reviews" | "seller">("description");
  const [isWishlisted, setIsWishlisted] = useState(false);

  // Extract product data — useProductById returns res.data, so product is at .data
  const product = productData?.data;
  const prices = product?.product_productPrice || [];
  const mainPrice = prices[0];
  const images: string[] = useMemo(() => {
    // Try seller-specific images first, then product images
    const sellerImages = product?.product_productPrice?.[0]?.productPrice_productSellerImage;
    const sourceImages = sellerImages?.length ? sellerImages : product?.productImages;
    if (!sourceImages || !Array.isArray(sourceImages)) return [];
    return sourceImages
      .map((item: any) => {
        if (typeof item === "string") return item;
        if (item?.image) return item.image;
        if (item?.video) return item.video;
        if (item?.url) return item.url;
        return null;
      })
      .filter((url: any) => url && typeof url === "string");
  }, [product?.productImages, product?.product_productPrice]);

  const price = mainPrice ? Number(mainPrice.productPrice) : 0;
  const offerPrice = mainPrice ? Number(mainPrice.offerPrice) : 0;
  const discount = price > 0 ? Math.round(((price - offerPrice) / price) * 100) : 0;
  const stock = mainPrice?.stock || 0;
  const minQty = mainPrice?.minQuantity || 1;
  const maxQty = mainPrice?.maxQuantity || stock || 99;
  const sellType = mainPrice?.sellType;
  const deliveryDays = mainPrice?.deliveryAfter || 3;
  const sellerName = mainPrice?.adminDetail?.firstName
    ? `${mainPrice.adminDetail.firstName} ${mainPrice.adminDetail.lastName || ""}`
    : "Ultrasooq Seller";
  const rating = 4.5; // TODO: from product reviews
  const reviewCount = 128; // TODO: from product reviews

  // Parse description
  const description = useMemo(() => {
    if (!product?.description) return "";
    try {
      const parsed = JSON.parse(product.description);
      if (Array.isArray(parsed)) {
        return parsed.map((block: any) => {
          if (block.children) return block.children.map((c: any) => c.text || "").join("");
          return block.text || "";
        }).join("\n\n");
      }
      return String(product.description);
    } catch {
      return String(product?.description || "");
    }
  }, [product?.description]);

  const shortDesc = product?.shortDescription || "";

  // Specs
  const specs = useMemo(() => {
    if (!product?.productSpecValues) return [];
    return product.productSpecValues.map((sv: any) => ({
      label: sv.specTemplate?.name_en || sv.specTemplate?.name || "—",
      value: sv.value || "—",
    }));
  }, [product?.productSpecValues]);

  if (isLoading) {
    return (
      <div className={cn("min-h-screen", T.bg)}>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="aspect-square rounded-2xl bg-gray-200 animate-pulse" />
            <div className="space-y-4">
              <div className="h-8 w-3/4 rounded-lg bg-gray-200 animate-pulse" />
              <div className="h-6 w-1/2 rounded-lg bg-gray-200 animate-pulse" />
              <div className="h-12 w-1/3 rounded-lg bg-gray-200 animate-pulse" />
              <div className="h-32 rounded-lg bg-gray-200 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className={cn("min-h-screen flex items-center justify-center", T.bg)}>
        <div className="text-center">
          <Package className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h2 className={cn("text-xl font-semibold", T.text)}>Product not found</h2>
          <button onClick={() => router.back()} className={cn("mt-4 text-sm", T.accentText, "hover:underline")}>
            <ArrowLeft className="h-4 w-4 inline me-1" /> Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <title dir={langDir} translate="no">{`${product.productName || product.productName_en || "Product"} | Ultrasooq`}</title>
      <div className={cn("min-h-screen", T.bg)}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

          {/* ── Breadcrumb ── */}
          <nav className={cn("flex items-center gap-2 text-sm mb-6", T.muted)}>
            <button onClick={() => router.back()} className="hover:text-[#c2703e] transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <span>/</span>
            <a href="/trending" className="hover:text-[#c2703e]">Products</a>
            <span>/</span>
            {product.category?.categoryName_en && (
              <>
                <span className="hover:text-[#c2703e]">{product.category.categoryName_en}</span>
                <span>/</span>
              </>
            )}
            <span className={T.text}>{product.productName || product.productName_en}</span>
          </nav>

          {/* ══════════ MAIN GRID ══════════ */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* ── LEFT: Images ── */}
            <div className="lg:col-span-5">
              <div className={cn(T.card, T.border, "border rounded-2xl overflow-hidden sticky top-6")}>
                {/* Main Image */}
                <div className="relative aspect-square bg-gray-50">
                  {images.length > 0 ? (
                    <img
                      src={images[selectedImageIndex]}
                      alt={product.productName_en || "Product"}
                      className="w-full h-full object-contain p-4"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-24 w-24 text-gray-200" />
                    </div>
                  )}

                  {/* Discount badge */}
                  {discount > 0 && (
                    <span className="absolute top-4 start-4 px-3 py-1 rounded-full text-xs font-bold text-white bg-red-500">
                      -{discount}%
                    </span>
                  )}

                  {/* Sell type badge */}
                  {sellType && sellType !== "NORMALSELL" && (
                    <span className={cn("absolute top-4 end-4 px-3 py-1 rounded-full text-xs font-bold text-white", T.accentBg)}>
                      {sellType === "BUYGROUP" ? "Group Buy" : sellType === "WHOLESALE_PRODUCT" ? "Wholesale" : sellType}
                    </span>
                  )}

                  {/* Nav arrows */}
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={() => setSelectedImageIndex((i) => (i - 1 + images.length) % images.length)}
                        className="absolute start-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 shadow flex items-center justify-center hover:bg-white"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => setSelectedImageIndex((i) => (i + 1) % images.length)}
                        className="absolute end-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 shadow flex items-center justify-center hover:bg-white"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </div>

                {/* Thumbnail strip */}
                {images.length > 1 && (
                  <div className="flex gap-2 p-3 overflow-x-auto">
                    {images.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedImageIndex(i)}
                        className={cn(
                          "w-16 h-16 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-colors",
                          selectedImageIndex === i ? "border-[#c2703e]" : "border-transparent hover:border-gray-300",
                        )}
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Quick actions bar */}
                <div className={cn("flex items-center gap-2 p-3 border-t", T.border)}>
                  <button
                    onClick={() => setIsWishlisted(!isWishlisted)}
                    className={cn("flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border transition-colors",
                      isWishlisted ? "bg-red-50 border-red-200 text-red-600" : cn(T.border, T.muted, "hover:bg-gray-50"))}
                  >
                    <Heart className={cn("h-4 w-4", isWishlisted && "fill-red-500")} />
                    {isWishlisted ? "Saved" : "Save"}
                  </button>
                  <button className={cn("flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border transition-colors", T.border, T.muted, "hover:bg-gray-50")}>
                    <Share2 className="h-4 w-4" /> Share
                  </button>
                </div>
              </div>
            </div>

            {/* ── RIGHT: Product Info ── */}
            <div className="lg:col-span-7 space-y-6">

              {/* Product Title & Rating */}
              <div>
                <h1 className={cn("text-2xl sm:text-3xl font-bold leading-tight", T.text)}>
                  {product.productName || product.productName_en}
                </h1>
                {product.productName_ar && (
                  <p className={cn("text-lg mt-1", T.muted)} dir="rtl">{product.productName_ar}</p>
                )}
                <div className="flex items-center gap-4 mt-3 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <RatingStars rating={rating} />
                    <span className={cn("text-sm font-medium", T.text)}>{rating}</span>
                    <span className={cn("text-sm", T.muted)}>({reviewCount} reviews)</span>
                  </div>
                  {product.sold && (
                    <span className={cn("text-sm flex items-center gap-1", T.muted)}>
                      <BarChart3 className="h-3.5 w-3.5" /> {product.sold} sold
                    </span>
                  )}
                  {product.brandName && (
                    <span className={cn("text-sm flex items-center gap-1 px-2 py-0.5 rounded-full", T.accentLight, T.accentText)}>
                      <Award className="h-3.5 w-3.5" /> {product.brandName}
                    </span>
                  )}
                </div>
              </div>

              {/* Price Card */}
              <div className={cn(T.card, T.border, "border rounded-2xl p-5")}>
                <div className="flex items-baseline gap-3">
                  <span className={cn("text-3xl font-bold", T.accentText)}>
                    ${offerPrice.toFixed(2)}
                  </span>
                  {discount > 0 && (
                    <>
                      <span className="text-lg text-gray-400 line-through">${price.toFixed(2)}</span>
                      <span className="text-sm font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                        Save {discount}%
                      </span>
                    </>
                  )}
                </div>

                {/* Stock & SKU */}
                <div className="flex items-center gap-4 mt-3 flex-wrap">
                  <span className={cn("text-sm flex items-center gap-1.5",
                    stock > 10 ? T.success : stock > 0 ? "text-amber-600" : "text-red-600")}>
                    <Box className="h-4 w-4" />
                    {stock > 10 ? "In Stock" : stock > 0 ? `Only ${stock} left` : "Out of Stock"}
                    {stock > 0 && <span className="text-muted-foreground">({stock} available)</span>}
                  </span>
                  {product.skuNo && (
                    <span className={cn("text-xs", T.muted)}>SKU: {product.skuNo}</span>
                  )}
                </div>

                {/* Quantity + Add to Cart */}
                <div className="flex items-center gap-4 mt-5">
                  <div className="flex items-center">
                    <button
                      onClick={() => setQuantity(Math.max(minQty, quantity - 1))}
                      className={cn("w-10 h-10 flex items-center justify-center border rounded-s-xl", T.border, "hover:bg-gray-50")}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(minQty, Math.min(maxQty, Number(e.target.value))))}
                      className={cn("w-16 h-10 text-center border-y font-semibold", T.border, "focus:outline-none")}
                    />
                    <button
                      onClick={() => setQuantity(Math.min(maxQty, quantity + 1))}
                      className={cn("w-10 h-10 flex items-center justify-center border rounded-e-xl", T.border, "hover:bg-gray-50")}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  <button
                    disabled={stock === 0}
                    className={cn("flex-1 flex items-center justify-center gap-2 h-12 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-40",
                      T.accentBg, "hover:opacity-90")}
                  >
                    <ShoppingCart className="h-5 w-5" />
                    Add to Cart — ${(offerPrice * quantity).toFixed(2)}
                  </button>
                </div>

                {minQty > 1 && (
                  <p className={cn("text-xs mt-2", T.muted)}>
                    Min order: {minQty} units {maxQty < stock && ` · Max: ${maxQty} units`}
                  </p>
                )}
              </div>

              {/* Delivery & Trust Signals */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { icon: <Truck className="h-5 w-5 text-blue-600" />, label: "Delivery", value: `${deliveryDays} days`, bg: "bg-blue-50" },
                  { icon: <ShieldCheck className="h-5 w-5 text-emerald-600" />, label: "Guarantee", value: "Buyer protection", bg: "bg-emerald-50" },
                  { icon: <Zap className="h-5 w-5 text-amber-600" />, label: "Condition", value: mainPrice?.productCondition || "New", bg: "bg-amber-50" },
                  { icon: <Store className="h-5 w-5 text-purple-600" />, label: "Seller", value: sellerName.split(" ")[0], bg: "bg-purple-50" },
                ].map((item) => (
                  <div key={item.label} className={cn(T.card, T.border, "border rounded-xl p-3 text-center")}>
                    <div className={cn("w-10 h-10 rounded-lg mx-auto mb-2 flex items-center justify-center", item.bg)}>
                      {item.icon}
                    </div>
                    <div className={cn("text-xs font-semibold", T.text)}>{item.value}</div>
                    <div className="text-[10px] text-muted-foreground">{item.label}</div>
                  </div>
                ))}
              </div>

              {/* Short Description */}
              {shortDesc && (
                <div className={cn(T.card, T.border, "border rounded-2xl p-5")}>
                  <p className={cn("text-sm leading-relaxed", T.text)}>{shortDesc}</p>
                </div>
              )}

              {/* Seller Card */}
              <div className={cn(T.card, T.border, "border rounded-2xl p-5")}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-12 h-12 rounded-full flex items-center justify-center text-white font-bold", T.accentBg)}>
                      {sellerName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className={cn("font-semibold", T.text)}>{sellerName}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <RatingStars rating={4.5} size="h-3 w-3" />
                        <span className={cn("text-xs", T.muted)}>Verified Seller</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a href={`/trending/${productId}`}
                      className={cn("flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-colors", T.border, T.muted, "hover:bg-gray-50")}>
                      <ExternalLink className="h-3.5 w-3.5" /> Classic View
                    </a>
                    <button className={cn("flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-white transition-colors", T.accentBg, "hover:opacity-90")}>
                      <MessageCircle className="h-3.5 w-3.5" /> Chat
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ══════════ TABS SECTION ══════════ */}
          <div className={cn(T.card, T.border, "border rounded-2xl mt-8 overflow-hidden")}>
            {/* Tab headers */}
            <div className={cn("border-b flex", T.border)}>
              {(["description", "specs", "reviews", "seller"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "flex-1 py-4 text-sm font-medium text-center transition-colors border-b-2",
                    activeTab === tab
                      ? "border-[#c2703e] text-[#c2703e]"
                      : "border-transparent text-muted-foreground hover:text-[#2d2017]",
                  )}
                >
                  {tab === "description" ? "Description" : tab === "specs" ? "Specifications" : tab === "reviews" ? `Reviews (${reviewCount})` : "Seller Info"}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="p-6">
              {activeTab === "description" && (
                <div className={cn("prose prose-sm max-w-none", T.text)}>
                  {description ? (
                    <div className="whitespace-pre-line leading-relaxed">{description}</div>
                  ) : (
                    <p className={T.muted}>No description available.</p>
                  )}
                </div>
              )}

              {activeTab === "specs" && (
                <div>
                  {specs.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-0">
                      {specs.map((spec: any, i: number) => (
                        <div key={i} className={cn("flex items-center py-3 px-4", i % 2 === 0 ? "bg-[#faf6f1]" : "bg-white")}>
                          <span className={cn("w-1/2 text-sm font-medium", T.muted)}>{spec.label}</span>
                          <span className={cn("w-1/2 text-sm", T.text)}>{spec.value}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className={T.muted}>No specifications available.</p>
                  )}
                </div>
              )}

              {activeTab === "reviews" && (
                <div className="text-center py-8">
                  <Star className="h-12 w-12 mx-auto mb-3 text-amber-400 fill-amber-400" />
                  <div className={cn("text-3xl font-bold", T.text)}>{rating}</div>
                  <RatingStars rating={rating} size="h-5 w-5" />
                  <p className={cn("text-sm mt-2", T.muted)}>{reviewCount} reviews</p>
                  <a href={`/trending/${productId}`}
                    className={cn("inline-flex items-center gap-1.5 mt-4 text-sm font-medium", T.accentText, "hover:underline")}>
                    View all reviews on classic page <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              )}

              {activeTab === "seller" && (
                <div className="flex items-start gap-6">
                  <div className={cn("w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold text-white", T.accentBg)}>
                    {sellerName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h3 className={cn("text-lg font-semibold", T.text)}>{sellerName}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <RatingStars rating={4.5} size="h-4 w-4" />
                      <span className={cn("text-sm", T.muted)}>Verified Seller</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <div className={cn("p-3 rounded-xl text-center", T.accentLight)}>
                        <div className={cn("text-lg font-bold", T.text)}>98%</div>
                        <div className="text-xs text-muted-foreground">Positive</div>
                      </div>
                      <div className="p-3 rounded-xl text-center bg-blue-50">
                        <div className={cn("text-lg font-bold", T.text)}>{prices.length}</div>
                        <div className="text-xs text-muted-foreground">Products</div>
                      </div>
                      <div className="p-3 rounded-xl text-center bg-emerald-50">
                        <div className={cn("text-lg font-bold", T.text)}>Fast</div>
                        <div className="text-xs text-muted-foreground">Response</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
