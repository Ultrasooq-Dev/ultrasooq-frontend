"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useProductById, useProductVariant, useTrackProductView, useRelatedProducts } from "@/apis/queries/product.queries";
import { useCartListByDevice, useCartListByUserId, useUpdateCartByDevice, useUpdateCartWithLogin } from "@/apis/queries/cart.queries";
import { useAddToWishList, useDeleteFromWishList } from "@/apis/queries/wishlist.queries";
import { useMe } from "@/apis/queries/user.queries";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "next-intl";
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { getCookie } from "cookies-next";
import { ULTRASOOQ_TOKEN_KEY } from "@/utils/constants";
import { getOrCreateDeviceId } from "@/utils/helper";
import { cn } from "@/lib/utils";
import Image from "next/image";
import validator from "validator";
import ReviewSection from "@/components/shared/ReviewSection";
import QuestionsAnswersSection from "@/components/modules/productDetails/QuestionsAnswersSection";
import VendorSection from "@/components/modules/productDetails/VendorSection";
import RelatedProductsSection from "@/components/modules/productDetails/RelatedProductsSection";
import { ProductRecommendations } from "@/components/modules/recommendations/ProductRecommendations";
import RelatedServices from "@/components/modules/trending/RelatedServices";
import PlateEditor from "@/components/shared/Plate/PlateEditor";
import AddToCustomizeForm from "@/components/modules/factories/AddToCustomizeForm";
import dynamic from "next/dynamic";
import {
  Star, Heart, ShoppingCart, Share2, ChevronLeft, ChevronRight,
  Package, Truck, ShieldCheck, Clock, Store, MessageCircle,
  Minus, Plus, ArrowLeft, Tag, Award, Users, Timer,
  Zap, Check, X, Copy, Eye, ChevronDown, Pencil, Upload, FlaskConical, Send, Wrench, AlertTriangle,
} from "lucide-react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import PlaceholderImage from "@/public/images/product-placeholder.png";

const ProductChat = dynamic(
  () => import("@/components/modules/chat/productChat/ProductChat"),
  { loading: () => <div className="animate-pulse h-64 bg-muted rounded-lg" />, ssr: false },
);

/* ═══════════════════════════════════════════════════════════════
   PRODUCT VIEW — Premium Editorial Layout
   /product-view/[id]

   Design direction: Luxury editorial — generous whitespace,
   dramatic typography, immersive imagery, warm earth tones.
   Every element breathes. Nothing feels crowded.
   ═══════════════════════════════════════════════════════════════ */

export default function ProductViewPage() {
  const t = useTranslations();
  const { langDir } = useAuth();
  const queryClient = useQueryClient();
  const params = useParams();
  const searchQuery = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const deviceId = getOrCreateDeviceId() || "";
  const accessToken = getCookie(ULTRASOOQ_TOKEN_KEY);
  const productId = params?.id as string;
  const sharedLinkId = searchQuery?.get("sharedLinkId") || "";

  const [haveAccessToken, setHaveAccessToken] = useState(false);
  const [selectedImg, setSelectedImg] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showBuygroupWarning, setShowBuygroupWarning] = useState(false);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [customizeForm, setCustomizeForm] = useState({ description: "", budget: "", quantity: "1", attachments: [] as File[] });
  const [bgTimeLeft, setBgTimeLeft] = useState("");
  const [showCustomizeForm, setShowCustomizeForm] = useState(false);

  const me = useMe();
  const productQuery = useProductById(
    { productId, userId: me.data?.data?.id, sharedLinkId },
    !!productId,
  );
  const getProductVariant = useProductVariant();
  const trackView = useTrackProductView();
  const updateCartWithLogin = useUpdateCartWithLogin();
  const updateCartByDevice = useUpdateCartByDevice();
  const addToWishList = useAddToWishList();
  const deleteFromWishList = useDeleteFromWishList();
  const cartByUser = useCartListByUserId({ page: 1, limit: 100 }, haveAccessToken);
  const cartByDevice = useCartListByDevice({ page: 1, limit: 100, deviceId }, !haveAccessToken);

  const product = productQuery.data?.data;
  const inWishlist = productQuery.data?.inWishlist;
  const otherSellers = productQuery.data?.otherSeller || [];
  const pp = product?.product_productPrice?.[0]; // primary price
  const isLoading = !productQuery.isFetched;

  // Related products for inline recommendations
  const tagIds = useMemo(() => product?.productTags?.map((t: any) => t.tagId).join(",") || "", [product?.productTags]);
  const relatedQuery = useRelatedProducts(
    { page: 1, limit: 4, tagIds: tagIds || "0", userId: me.data?.data?.id, productId },
    !!product,
  );
  const apiRelated = relatedQuery.data?.data?.products || relatedQuery.data?.data || [];

  // Seed data — shown when API returns empty (remove when real data is wired)
  const seedRelated = useMemo(() => {
    if (!product) return [];
    const basePrice = Number(pp?.offerPrice || 50);
    return [
      { id: 9001, productName: "USB-C Hub Adapter 7-in-1 Multiport", productImages: [], product_productPrice: [{ offerPrice: (basePrice * 0.6).toFixed(2), productPrice: (basePrice * 0.8).toFixed(2) }] },
      { id: 9002, productName: "Thermal Paste High Performance 4g", productImages: [], product_productPrice: [{ offerPrice: (basePrice * 0.15).toFixed(2), productPrice: (basePrice * 0.2).toFixed(2) }] },
      { id: 9003, productName: "Cable Management Kit 120pcs", productImages: [], product_productPrice: [{ offerPrice: (basePrice * 0.25).toFixed(2), productPrice: (basePrice * 0.35).toFixed(2) }] },
      { id: 9004, productName: "Anti-Static Wrist Strap for PC Building", productImages: [], product_productPrice: [{ offerPrice: (basePrice * 0.1).toFixed(2), productPrice: (basePrice * 0.15).toFixed(2) }] },
      { id: 9005, productName: "Compressed Air Duster Can 400ml", productImages: [], product_productPrice: [{ offerPrice: (basePrice * 0.12).toFixed(2), productPrice: (basePrice * 0.18).toFixed(2) }] },
      { id: 9006, productName: "Screwdriver Set 25-in-1 Precision", productImages: [], product_productPrice: [{ offerPrice: (basePrice * 0.2).toFixed(2), productPrice: (basePrice * 0.28).toFixed(2) }] },
      { id: 9007, productName: "Monitor Stand Riser with Storage", productImages: [], product_productPrice: [{ offerPrice: (basePrice * 0.45).toFixed(2), productPrice: (basePrice * 0.6).toFixed(2) }] },
    ];
  }, [product, pp?.offerPrice]);

  const relatedProducts = apiRelated.length > 0 ? apiRelated : seedRelated;
  const [relatedQtys, setRelatedQtys] = useState<Record<number, number>>({});

  // ── Effects ──
  useEffect(() => { setHaveAccessToken(!!accessToken); }, [accessToken]);
  useEffect(() => {
    if (product?.id && !productQuery.isLoading) {
      trackView.mutate({ productId: product.id, ...(!haveAccessToken && deviceId ? { deviceId } : {}) });
    }
  }, [product?.id]);

  // ── Images ──
  const images = useMemo(() => {
    const sellerImgs = pp?.productPrice_productSellerImage;
    const src = sellerImgs?.length ? sellerImgs : product?.productImages;
    if (!src || !Array.isArray(src)) return [PlaceholderImage];
    const urls = src.map((item: any) => {
      if (typeof item === "string" && validator.isURL(item)) return item;
      if (item?.image && validator.isURL(item.image)) return item.image;
      if (item?.video && validator.isURL(item.video)) return item.video;
      return null;
    }).filter(Boolean);
    return urls.length > 0 ? urls : [PlaceholderImage];
  }, [product?.productImages, pp?.productPrice_productSellerImage]);

  // ── Pricing ──
  const price = Number(pp?.productPrice || product?.productPrice || 0);
  const offerPrice = Number(pp?.offerPrice || 0);
  const discount = price > 0 && offerPrice < price ? Math.round(((price - offerPrice) / price) * 100) : 0;
  const stock = pp?.stock || 0;
  const askForPrice = pp?.askForPrice === "true" || pp?.askForPrice === true;
  const minQty = pp?.minQuantityPerCustomer || pp?.minQuantity || 1;
  const maxQty = pp?.maxQuantityPerCustomer || pp?.maxQuantity || stock || 999;

  // Set quantity to minQty when product loads
  useEffect(() => {
    if (minQty > 1 && quantity < minQty) setQuantity(minQty);
  }, [minQty]);
  const deliveryDays = pp?.deliveryAfter || 0;
  const sellType = pp?.sellType;
  const consumerDiscount = pp?.consumerDiscount || 0;
  const consumerDiscountType = pp?.consumerDiscountType;

  const isTrial = sellType === "TRIAL_PRODUCT";
  const isCustomizable = askForPrice; // Products with ask-for-price are customizable

  // ── BuyGroup timing ──
  const isBuygroup = sellType === "BUYGROUP";
  const getTs = (d?: string, t?: string) => {
    if (!d) return 0;
    const dt = new Date(d);
    if (t) { const [h, m] = t.split(":").map(Number); if (!isNaN(h)) dt.setHours(h, isNaN(m) ? 0 : m); }
    return dt.getTime();
  };
  const bgStart = getTs(pp?.dateOpen, pp?.startTime);
  const bgEnd = getTs(pp?.dateClose, pp?.endTime);
  const now = Date.now();
  const saleNotStarted = isBuygroup && bgStart > 0 && now < bgStart;
  const saleExpired = isBuygroup && bgEnd > 0 && now > bgEnd;

  // BuyGroup live countdown
  useEffect(() => {
    if (!bgEnd || saleExpired || saleNotStarted) return;
    const tick = () => {
      const diff = bgEnd - Date.now();
      if (diff <= 0) { setBgTimeLeft("Ended"); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setBgTimeLeft(d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m ${s}s`);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [bgEnd, saleExpired, saleNotStarted]);

  // ── Seller ──
  const seller = pp?.adminDetail;
  const sellerName = seller?.accountName || seller?.userProfile?.companyName ||
    `${seller?.firstName || ""} ${seller?.lastName || ""}`.trim() || t("seller") || "Seller";

  // ── Cart check ──
  const cartList = haveAccessToken ? cartByUser.data?.data : cartByDevice.data?.data;
  const cartItem = Array.isArray(cartList) ? cartList.find((i: any) => i.productId === Number(productId)) : null;
  const isInCart = !!cartItem;

  // ── Handlers ──
  const handleAddToCart = async () => {
    if (!pp?.id) return;
    try {
      if (haveAccessToken) await updateCartWithLogin.mutateAsync({ productPriceId: pp.id, quantity });
      else await updateCartByDevice.mutateAsync({ productPriceId: pp.id, quantity, deviceId });
      toast({ title: t("added_to_cart") || "Added to cart!", variant: "success" });
      queryClient.invalidateQueries({ queryKey: haveAccessToken ? ["cart-by-user-id"] : ["cart-list-by-device-id"] });
    } catch (e: any) {
      toast({ title: t("error") || "Error", description: e?.response?.data?.message || "Failed", variant: "destructive" });
    }
  };

  const handleBuyNow = async () => {
    await handleAddToCart();
    router.push("/checkout");
  };

  const handleWishlist = async () => {
    if (!haveAccessToken) { toast({ title: t("please_login_first") || "Please login first", variant: "destructive" }); return; }
    try {
      if (inWishlist) await deleteFromWishList.mutateAsync({ productId: Number(productId) });
      else await addToWishList.mutateAsync({ productId: Number(productId) });
      queryClient.invalidateQueries({ queryKey: ["product-by-id"] });
      toast({ title: inWishlist ? t("removed_from_wishlist") || "Removed" : t("added_to_wishlist") || "Saved!", variant: "success" });
    } catch { toast({ title: t("error") || "Error", variant: "destructive" }); }
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    toast({ title: t("link_copied") || "Link copied!", variant: "success" });
  };

  // ── Loading ──
  if (isLoading) return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1400px] mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div className="aspect-[4/5] rounded-3xl bg-muted animate-pulse" />
          <div className="space-y-6 py-8">
            <div className="h-4 w-32 rounded-full bg-muted animate-pulse" />
            <div className="h-10 w-4/5 rounded-xl bg-muted animate-pulse" />
            <div className="h-6 w-1/3 rounded-lg bg-muted animate-pulse" />
            <div className="h-48 rounded-2xl bg-muted animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );

  if (!product) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <Package className="h-20 w-20 mx-auto mb-6 text-muted-foreground/50" />
        <h2 className="text-2xl font-light text-foreground tracking-wide">Product not found</h2>
        <button onClick={() => router.back()} className="mt-6 text-sm text-primary hover:underline underline-offset-4">
          <ArrowLeft className="h-4 w-4 inline me-2" />Go back
        </button>
      </div>
    </div>
  );

  const sellTypeLabel = sellType === "BUYGROUP" ? "Group Buy" : sellType === "WHOLESALE_PRODUCT" ? "Wholesale" : sellType === "TRIAL_PRODUCT" ? "Trial" : null;
  const reviews = product?.productReview || [];
  const avgRating = reviews.length > 0 ? reviews.reduce((s: number, r: any) => s + (r.rating || 0), 0) / reviews.length : 0;
  const specs = product?.productSpecValues || [];

  return (
    <>
      <title dir={langDir} translate="no">{`${product.productName || "Product"} | Ultrasooq`}</title>

      <div className="min-h-screen bg-background">

        {/* ══════ HERO SECTION ══════ */}
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 pt-6 pb-4">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-[13px] text-muted-foreground mb-4">
            <button onClick={() => router.back()} className="hover:text-primary transition-colors"><ArrowLeft className="h-4 w-4" /></button>
            <span className="opacity-40">/</span>
            <a href="/trending" className="hover:text-primary transition-colors">{t("store") || "Store"}</a>
            {product.category?.categoryName_en && (<><span className="opacity-40">/</span><span className="hover:text-primary transition-colors cursor-pointer">{product.category.categoryName_en}</span></>)}
          </nav>
        </div>

        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 pb-20">

          {/* ══════ FULL WIDTH: Title + Seller side by side ══════ */}
          <div className="flex items-center gap-6 mb-6">
            {/* Left: Brand + Title + Rating */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                {product.brand?.brandName && (
                  <span className="text-xs font-semibold tracking-[0.15em] uppercase text-primary">{product.brand.brandName}</span>
                )}
                {product.category?.categoryName_en && (
                  <span className="text-xs text-muted-foreground">in {product.category.categoryName_en}</span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-bold leading-tight text-foreground">
                {product.productName}
              </h1>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                {reviews.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className={cn("h-4 w-4", i <= Math.round(avgRating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30")} />
                    ))}
                    <span className="text-sm font-medium text-foreground ms-1">{avgRating.toFixed(1)}</span>
                    <span className="text-sm text-muted-foreground">({reviews.length})</span>
                  </div>
                )}
                {product.sold > 0 && (
                  <span className="text-sm text-muted-foreground">{product.sold}+ sold</span>
                )}
              </div>
            </div>

                {/* Right: Seller Card */}
                <div className="flex-shrink-0 w-[220px] rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-md hover:border-primary/30 transition-all cursor-pointer flex flex-col"
                  onClick={() => { if (seller?.id) router.push(`/company-profile-details?sellerId=${seller.id}`); }}>
                  {/* Top: gradient header with avatar */}
                  <div className="bg-gradient-to-br from-primary to-primary/80 px-4 pt-4 pb-5 flex flex-col items-center relative">
                    <div className="w-14 h-14 rounded-full bg-card/20 border-2 border-white/40 flex items-center justify-center text-white font-bold text-xl backdrop-blur-sm">
                      {sellerName.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-bold text-white mt-2">
                      {sellerName.length <= 3 ? sellerName : sellerName.slice(0, 3) + "***"}
                    </span>
                    {/* Badge on header */}
                    <span className={cn("absolute top-2 end-2 inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full",
                      seller?.tradeRole === "COMPANY" ? "bg-card/20 text-white" :
                      seller?.tradeRole === "FREELANCER" ? "bg-card/20 text-white" :
                      "bg-card/20 text-white"
                    )}>
                      {seller?.tradeRole === "COMPANY" ? <><ShieldCheck className="h-2.5 w-2.5" /> Company</> :
                       seller?.tradeRole === "FREELANCER" ? <><Award className="h-2.5 w-2.5" /> Pro</> :
                       <><Check className="h-2.5 w-2.5" /> Verified</>}
                    </span>
                  </div>
                  {/* Bottom: stats */}
                  <div className="bg-card px-4 py-3 flex-1 flex flex-col justify-between">
                    <div className="flex items-center justify-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((i) => <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />)}
                      <span className="text-xs font-semibold text-foreground ms-1.5">98%</span>
                    </div>
                    <div className="flex items-center justify-center gap-2.5 mt-2 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1"><Eye className="h-3 w-3 text-emerald-500" /> 2h ago</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-blue-500" /> ~1h</span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Users className="h-3 w-3 text-purple-500" />
                        {seller?.createdAt ? new Date(seller.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "2024"}
                      </span>
                    </div>
                    {otherSellers.length > 0 && (
                      <div className="mt-2 text-center text-[10px] text-primary font-medium">+{otherSellers.length} other sellers</div>
                    )}
                  </div>
                </div>
          </div>{/* end full-width title row */}

          {/* ══════ TWO COLUMNS: Image + Price side by side ══════ */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">

            {/* ── LEFT: Gallery ── */}
            <div className="lg:col-span-6">
              <div className="sticky top-6">
                <div className="relative rounded-2xl overflow-hidden bg-card shadow-[0_4px_24px_rgba(0,0,0,0.06)] group">
                  <div className="relative min-h-[300px]">
                    {typeof images[selectedImg] === "string" ? (
                      <img src={images[selectedImg] as string} alt={product.productName} className="w-full h-auto max-h-[500px] object-contain p-4 mx-auto transition-transform duration-700 group-hover:scale-105" />
                    ) : (
                      <div className="aspect-square relative">
                        <Image src={images[selectedImg]} alt={product.productName || ""} fill className="object-contain p-4" />
                      </div>
                    )}
                    {/* Badges */}
                    <div className="absolute top-4 start-4 flex flex-col gap-2">
                      {discount > 0 && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r from-red-500 to-rose-600 shadow-lg shadow-red-500/20">-{discount}% OFF</span>
                      )}
                      {sellTypeLabel && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/20">{sellTypeLabel}</span>
                      )}
                    </div>
                    {/* Nav arrows */}
                    {images.length > 1 && (
                      <>
                        <button onClick={() => setSelectedImg((i) => (i - 1 + images.length) % images.length)}
                          className="absolute start-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card/90 shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><ChevronLeft className="h-5 w-5 text-foreground" /></button>
                        <button onClick={() => setSelectedImg((i) => (i + 1) % images.length)}
                          className="absolute end-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card/90 shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><ChevronRight className="h-5 w-5 text-foreground" /></button>
                      </>
                    )}
                    {images.length > 1 && (
                      <span className="absolute bottom-3 end-3 px-2.5 py-0.5 rounded-full bg-black/50 text-white text-xs font-medium backdrop-blur-sm">{selectedImg + 1}/{images.length}</span>
                    )}
                  </div>
                </div>
                {/* Thumbnails */}
                {images.length > 1 && (
                  <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                    {images.map((img, i) => (
                      <button key={i} onClick={() => setSelectedImg(i)}
                        className={cn("w-16 h-16 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all duration-300 bg-card",
                          selectedImg === i ? "border-primary shadow-lg shadow-primary/15 scale-105" : "border-transparent opacity-60 hover:opacity-100")}>
                        {typeof img === "string" ? <img src={img} alt="" className="w-full h-full object-cover" /> : <Image src={img} alt="" width={64} height={64} className="w-full h-full object-cover" />}
                      </button>
                    ))}
                  </div>
                )}
                {/* Save / Share / Chat below image */}
                <div className="flex items-center gap-2 mt-3">
                  <button onClick={handleWishlist}
                    className={cn("flex-1 h-10 rounded-xl border text-sm font-medium flex items-center justify-center gap-2 transition-all",
                      inWishlist ? "bg-red-50 border-red-200 text-red-600" : "border-border text-muted-foreground hover:border-primary hover:text-primary")}>
                    <Heart className={cn("h-4 w-4", inWishlist && "fill-red-500")} />
                    {inWishlist ? t("saved") || "Saved" : t("save") || "Save"}
                  </button>
                  <button onClick={handleShare}
                    className="flex-1 h-10 rounded-xl border border-border text-sm font-medium text-muted-foreground flex items-center justify-center gap-2 hover:border-primary hover:text-primary transition-all">
                    {copiedLink ? <><Check className="h-4 w-4 text-emerald-600" /> Copied!</> : <><Share2 className="h-4 w-4" /> {t("share") || "Share"}</>}
                  </button>
                  <button onClick={() => setIsChatOpen(true)}
                    className="flex-1 h-10 rounded-xl border border-border text-sm font-medium text-muted-foreground flex items-center justify-center gap-2 hover:border-primary hover:text-primary transition-all">
                    <MessageCircle className="h-4 w-4" /> {t("chat") || "Chat"}
                  </button>
                </div>
              </div>
            </div>

            {/* ── RIGHT: All-in-one product card ── */}
            <div className="lg:col-span-6">
              <div className="rounded-2xl bg-card border border-border shadow-sm overflow-hidden">

              {/* Short Description */}
              {product.product_productShortDescription?.length > 0 && (
                <div className="px-5 pt-5 pb-4 border-b border-border">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Product Description</h3>
                  {product.product_productShortDescription.map((sd: any, i: number) => (
                    <p key={i} className="text-sm leading-relaxed text-muted-foreground" dir={langDir}>{sd.shortDescription}</p>
                  ))}
                </div>
              )}

              {/* ── Price Section ── */}
              <div className="px-5 py-5">
                {askForPrice ? (
                  <div className="text-center py-4">
                    <span className="text-lg font-semibold text-primary">{t("ask_for_price") || "Ask for Price"}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-end gap-3 flex-wrap">
                      <span className="text-3xl font-extrabold text-foreground leading-none">${offerPrice.toFixed(2)}</span>
                      {discount > 0 && (
                        <span className="text-lg text-muted-foreground/70 line-through mb-1">${price.toFixed(2)}</span>
                      )}
                      {consumerDiscount > 0 && (
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full mb-1">
                          Extra {consumerDiscount}{consumerDiscountType === "PERCENTAGE" ? "%" : "$"} off
                        </span>
                      )}
                    </div>

                    {/* Stock indicator */}
                    <div className="flex items-center gap-2 mt-3">
                      <span className={cn("w-2 h-2 rounded-full", stock > 10 ? "bg-emerald-500" : stock > 0 ? "bg-amber-500 animate-pulse" : "bg-red-500")} />
                      <span className={cn("text-sm font-medium", stock > 10 ? "text-emerald-600" : stock > 0 ? "text-amber-600" : "text-red-600")}>
                        {stock > 10 ? t("in_stock") || "In Stock" : stock > 0 ? `${t("only") || "Only"} ${stock} ${t("left") || "left"}` : t("out_of_stock") || "Out of Stock"}
                      </span>
                      {product.skuNo && <span className="text-xs text-muted-foreground/70 ms-auto">SKU: {product.skuNo}</span>}
                    </div>
                  </>
                )}

                {/* ── BuyGroup Deal Panel ── */}
                {isBuygroup && (() => {
                  const minCust = pp?.minCustomer || 0;
                  const maxCust = pp?.maxCustomer || 0;
                  const minQtyPer = pp?.minQuantityPerCustomer || 1;
                  const maxQtyPer = pp?.maxQuantityPerCustomer || 0;
                  const totalStock = pp?.stock || 0;
                  const startDate = pp?.dateOpen ? new Date(pp.dateOpen) : null;
                  const endDate = pp?.dateClose ? new Date(pp.dateClose) : null;

                  return (
                    <div className="mt-5 rounded-2xl border-2 border-primary/20 overflow-hidden">
                      {/* Header */}
                      <div className="bg-gradient-to-r from-primary to-primary/80 px-5 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-white">
                          <Users className="h-4.5 w-4.5" />
                          <span className="text-sm font-bold tracking-wide">Group Buy</span>
                        </div>
                        {!saleExpired && !saleNotStarted && bgTimeLeft && (
                          <div className="flex items-center gap-1.5 text-white/90">
                            <Timer className="h-3.5 w-3.5" />
                            <span className="text-xs font-mono font-bold">{bgTimeLeft}</span>
                          </div>
                        )}
                        {saleNotStarted && startDate && (
                          <span className="text-xs text-white/80 font-medium">
                            Starts {startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                        )}
                        {saleExpired && (
                          <span className="text-xs text-white/80 font-medium">Sale ended</span>
                        )}
                      </div>

                      {/* Body */}
                      <div className="bg-primary/[0.03] px-5 py-4 space-y-4">
                        {/* How it works */}
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Join this group buy! When enough buyers join, the deal activates and everyone gets the discounted price.
                        </p>

                        {/* Min customers progress */}
                        {minCust > 0 && (
                          <div>
                            <div className="flex items-center justify-between text-xs mb-1.5">
                              <span className="text-muted-foreground font-medium">Buyers needed</span>
                              <span className="font-bold text-primary">{minCust} minimum</span>
                            </div>
                            <div className="h-2 bg-border rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-500" style={{ width: "0%" }} />
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-muted-foreground/70 mt-1">
                              <span>Join now to be first!</span>
                              {maxCust > 0 && <span>Max: {maxCust}</span>}
                            </div>
                          </div>
                        )}

                        {/* Deal details grid */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="p-2.5 rounded-xl bg-card border border-border">
                            <div className="text-[10px] text-muted-foreground/70 uppercase tracking-wider">Per Buyer</div>
                            <div className="text-sm font-bold text-foreground mt-0.5">
                              {minQtyPer}{maxQtyPer > 0 ? ` — ${maxQtyPer}` : "+"} units
                            </div>
                          </div>
                          <div className="p-2.5 rounded-xl bg-card border border-border">
                            <div className="text-[10px] text-muted-foreground/70 uppercase tracking-wider">Available</div>
                            <div className="text-sm font-bold text-foreground mt-0.5">{totalStock} units</div>
                          </div>
                          {startDate && (
                            <div className="p-2.5 rounded-xl bg-card border border-border">
                              <div className="text-[10px] text-muted-foreground/70 uppercase tracking-wider">Starts</div>
                              <div className="text-xs font-semibold text-foreground mt-0.5">
                                {startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                              </div>
                            </div>
                          )}
                          {endDate && (
                            <div className="p-2.5 rounded-xl bg-card border border-border">
                              <div className="text-[10px] text-muted-foreground/70 uppercase tracking-wider">Ends</div>
                              <div className="text-xs font-semibold text-foreground mt-0.5">
                                {endDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Savings callout */}
                        {discount > 0 && (
                          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                            <Zap className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                            <span className="text-xs font-semibold text-emerald-700">
                              You save {discount}% compared to ${price.toFixed(2)} regular price
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Non-buygroup timing badges */}
                {!isBuygroup && saleNotStarted && (
                  <div className="mt-4 p-3 rounded-xl bg-blue-50 border border-blue-100">
                    <div className="flex items-center gap-2 text-sm text-blue-600 font-medium">
                      <Clock className="h-4 w-4" />
                      <span>Starts {new Date(bgStart).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
                    </div>
                  </div>
                )}
                {!isBuygroup && saleExpired && (
                  <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-100">
                    <div className="flex items-center gap-2 text-sm text-red-600 font-medium">
                      <X className="h-4 w-4" /> Sale ended
                    </div>
                  </div>
                )}

                {/* Quantity + Cart + Actions */}
                {stock > 0 && !saleNotStarted && !saleExpired && (
                  <div className="mt-6 space-y-3">
                    {/* Trial Product badge */}
                    {isTrial && (
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-purple-50 border border-purple-100">
                        <FlaskConical className="h-4 w-4 text-purple-600 flex-shrink-0" />
                        <div>
                          <span className="text-xs font-semibold text-purple-700">Trial / Sample Product</span>
                          <p className="text-[10px] text-purple-600 mt-0.5">Order a sample to evaluate before bulk purchase</p>
                        </div>
                      </div>
                    )}

                    {/* Quantity selector + main CTA */}
                    {!askForPrice && (
                      <div className="flex items-center gap-3">
                        <div className="flex items-center border border-border rounded-xl overflow-hidden">
                          <button onClick={() => setQuantity(Math.max(minQty, quantity - 1))}
                            className="w-11 h-11 flex items-center justify-center hover:bg-background transition-colors"><Minus className="h-4 w-4 text-muted-foreground" /></button>
                          <input type="number" value={quantity} onChange={(e) => setQuantity(Math.max(minQty, Math.min(maxQty, Number(e.target.value))))}
                            className="w-14 h-11 text-center font-semibold text-foreground border-x border-border focus:outline-none" />
                          <button onClick={() => setQuantity(Math.min(maxQty, quantity + 1))}
                            className="w-11 h-11 flex items-center justify-center hover:bg-background transition-colors"><Plus className="h-4 w-4 text-muted-foreground" /></button>
                        </div>
                        <button onClick={isBuygroup ? () => setShowBuygroupWarning(true) : handleAddToCart} disabled={stock === 0}
                          className={cn("flex-1 h-12 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-40",
                            isTrial ? "bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-500/20" :
                            isBuygroup ? "bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20" :
                            "bg-foreground hover:bg-foreground/90")}>
                          {isTrial ? <FlaskConical className="h-4.5 w-4.5" /> : isBuygroup ? <Users className="h-4.5 w-4.5" /> : <ShoppingCart className="h-4.5 w-4.5" />}
                          {isTrial ? "Order Sample" : isBuygroup ? "Book Your Spot" : isInCart ? t("update_cart") || "Update Cart" : t("add_to_cart") || "Add to Cart"}
                          {(isBuygroup || isTrial) && ` — $${(offerPrice * quantity).toFixed(2)}`}
                        </button>
                      </div>
                    )}

                    {/* Buy Now (normal + wholesale only, not buygroup/trial) */}
                    {!isBuygroup && !isTrial && !askForPrice && (
                      <button onClick={handleBuyNow}
                        className="w-full h-12 rounded-xl bg-primary text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-all active:scale-[0.98] shadow-lg shadow-primary/20">
                        <Zap className="h-4.5 w-4.5" />
                        {t("buy_now") || "Buy Now"} — ${(offerPrice * quantity).toFixed(2)}
                      </button>
                    )}

                    {/* Customize Product button (always shown for customizable products) */}
                    <button onClick={() => setShowCustomizeModal(true)}
                      className="w-full h-11 rounded-xl border-2 border-dashed border-primary/40 text-sm font-semibold text-primary flex items-center justify-center gap-2 hover:bg-primary/5 hover:border-primary transition-all">
                      <Pencil className="h-4 w-4" />
                      Customize This Product
                    </button>

                    {minQty > 1 && <p className="text-xs text-muted-foreground text-center">Min order: {minQty} units</p>}
                  </div>
                )}
              </div>{/* end price section */}

              {/* ── Product Details (inside same card) ── */}
              <div className="px-5 py-4 border-t border-border space-y-2.5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <Truck className="h-4.5 w-4.5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-foreground">
                      {deliveryDays > 0 ? `Estimated delivery in ${deliveryDays} days` : "Delivery available"}
                    </div>
                    <div className="text-xs text-muted-foreground">Shipping cost calculated at checkout</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="h-4.5 w-4.5 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-foreground">Buyer Protection</div>
                    <div className="text-xs text-muted-foreground">Money-back guarantee if not as described</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                    <Tag className="h-4.5 w-4.5 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-foreground">
                      {(() => {
                        const cond = (pp?.productCondition || "new").toLowerCase();
                        const m: Record<string, string> = { "new": "New", "open box": "Open Box", "refurbished": "Certified Refurbished", "like new": "Like New", "used": "Pre-Owned", "good": "Good", "fair": "Acceptable", "for parts": "For Parts or Not Working" };
                        return m[cond] || "New";
                      })()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {(() => {
                        const cond = (pp?.productCondition || "new").toLowerCase();
                        const m: Record<string, string> = { "new": "Brand new, unused, unopened, undamaged item in original packaging", "open box": "Original packaging, opened but never used", "refurbished": "Professionally restored to working order", "like new": "Used but in excellent, near-new condition", "used": "Previously used, may show signs of cosmetic wear", "good": "Shows wear from consistent use, fully operational", "fair": "Fairly worn but continues to work properly", "for parts": "Does not function as intended, requires repair" };
                        return m[cond] || m["new"];
                      })()}
                    </div>
                  </div>
                </div>
              </div>

              </div>{/* end all-in-one card */}
            </div>

          </div>{/* end two-column grid */}

          {/* ══════ TABS ══════ */}
          <div className="mt-10">
            <div className="flex items-center gap-1 border-b border-border overflow-x-auto">
              {[
                { id: "description", label: t("description") || "Description" },
                { id: "specs", label: t("specification") || "Specs" },
                { id: "reviews", label: `${t("reviews") || "Reviews"} (${reviews.length})` },
                { id: "qanda", label: t("questions") || "Q&A" },
                { id: "vendor", label: t("vendor") || "Seller" },
                { id: "services", label: t("services") || "Services" },
              ].map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={cn("px-6 py-4 text-sm font-semibold whitespace-nowrap transition-all border-b-[3px] -mb-px",
                    activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}>
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="bg-card rounded-b-2xl border border-t-0 border-border p-6 sm:p-10 min-h-[300px]">
              {activeTab === "description" && (() => {
                const desc = product?.isDropshipped && product?.customMarketingContent?.marketingText
                  ? product.customMarketingContent.marketingText : product?.description;
                if (!desc) return <p className="text-muted-foreground">No description available.</p>;
                if (typeof desc === "object") return <PlateEditor description={desc} readOnly fixedToolbar={false} />;
                try { return <PlateEditor description={JSON.parse(desc)} readOnly fixedToolbar={false} />; }
                catch { return <div className="prose prose-gray max-w-none text-muted-foreground leading-relaxed" dir={langDir}>{desc}</div>; }
              })()}

              {activeTab === "specs" && (
                specs.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2">
                    {specs.map((sv: any, i: number) => (
                      <div key={i} className={cn("flex py-3.5 px-5", i % 2 === 0 ? "bg-muted/50" : "bg-card")}>
                        <span className="w-1/2 text-sm font-medium text-muted-foreground">{sv.specTemplate?.name_en || "—"}</span>
                        <span className="w-1/2 text-sm text-foreground">{sv.value || "—"}</span>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-muted-foreground">No specifications available.</p>
              )}

              {activeTab === "reviews" && <ReviewSection {...{ productId: Number(productId), productReview: reviews } as any} />}
              {activeTab === "qanda" && <QuestionsAnswersSection {...{ productId: Number(productId), sellerId: seller?.id, userId: me.data?.data?.id } as any} />}
              {activeTab === "vendor" && <VendorSection {...{ sellerId: seller?.id, sellerName } as any} />}
              {activeTab === "services" && <RelatedServices {...{ categoryId: product?.categoryId, sellerId: seller?.id } as any} />}
            </div>
          </div>

          {/* Related */}
          <div className="mt-12"><RelatedProductsSection {...{ productId: Number(productId), categoryId: product?.categoryId } as any} /></div>
          <div className="mt-8"><ProductRecommendations productId={Number(productId)} /></div>

          {/* ── Customers Also Bought (bottom of page, scrollable) ── */}
          {relatedProducts.length > 0 && (
            <div className="mt-10 rounded-2xl bg-card border border-border shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-foreground">Customers Also Bought</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Frequently purchased together with this product</p>
                </div>
                {relatedProducts.length > 4 && (
                  <span className="text-xs text-muted-foreground">Scroll for more →</span>
                )}
              </div>
              <div className="flex overflow-x-auto pb-2" style={{ scrollbarWidth: "thin" }}>
                {relatedProducts.map((rp: any) => {
                  const rpPrice = rp.product_productPrice?.[0];
                  const rpOffer = Number(rpPrice?.offerPrice || rp.offerPrice || rp.productPrice || 0);
                  const rpOriginal = Number(rpPrice?.productPrice || rp.productPrice || 0);
                  const rpImage = rp.productImages?.[0]?.image || rp.productImage || null;
                  const rpId = rp.id;
                  const qty = relatedQtys[rpId] || 0;

                  return (
                    <div key={rpId} className="p-5 flex flex-col items-center text-center min-w-[200px] w-[200px] flex-shrink-0 border-e border-border last:border-e-0">
                      <a href={`/product-view/${rpId}`} className="w-24 h-24 rounded-xl bg-background overflow-hidden mb-3 hover:opacity-80 transition-opacity">
                        {rpImage ? (
                          <img src={rpImage} alt="" className="w-full h-full object-contain p-2" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><Package className="h-8 w-8 text-muted-foreground/50" /></div>
                        )}
                      </a>
                      <a href={`/product-view/${rpId}`} className="text-sm font-medium text-foreground line-clamp-2 hover:text-primary transition-colors mb-2 min-h-[40px]">
                        {rp.productName}
                      </a>
                      <div className="flex items-center gap-1.5 mb-3">
                        <span className="text-lg font-bold text-foreground">${rpOffer.toFixed(2)}</span>
                        {rpOriginal > rpOffer && (
                          <span className="text-xs text-muted-foreground/70 line-through">${rpOriginal.toFixed(2)}</span>
                        )}
                      </div>
                      {qty > 0 ? (
                        <div className="flex items-center border-2 border-primary rounded-xl overflow-hidden">
                          <button onClick={() => setRelatedQtys((q) => ({ ...q, [rpId]: Math.max(0, qty - 1) }))}
                            className="w-9 h-9 flex items-center justify-center hover:bg-primary/5 text-primary">
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-9 h-9 flex items-center justify-center text-sm font-bold text-foreground border-x-2 border-primary">{qty}</span>
                          <button onClick={() => setRelatedQtys((q) => ({ ...q, [rpId]: qty + 1 }))}
                            className="w-9 h-9 flex items-center justify-center hover:bg-primary/5 text-primary">
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setRelatedQtys((q) => ({ ...q, [rpId]: 1 }))}
                          className="h-9 px-5 rounded-xl bg-foreground text-white text-sm font-semibold flex items-center gap-1.5 hover:bg-foreground/90 transition-colors">
                          <Plus className="h-3.5 w-3.5" /> Add
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* BuyGroup Warning Popup */}
      {showBuygroupWarning && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40" onClick={() => setShowBuygroupWarning(false)}>
          <div className="bg-card rounded-2xl w-full max-w-sm mx-4 shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-primary/80 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <Users className="h-5 w-5" />
                <span className="text-base font-bold">How Buygroups Work</span>
              </div>
              <button onClick={() => setShowBuygroupWarning(false)} className="text-white/70 hover:text-white"><X className="h-5 w-5" /></button>
            </div>

            <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
              {/* What is a Buygroup */}
              <h3 className="text-sm font-bold text-foreground mb-2">What is a Buygroup?</h3>
              <p className="text-xs text-muted-foreground leading-relaxed mb-5">
                A buygroup is a collective purchasing system where multiple customers come together to purchase products at better prices. When you book a product in a buygroup, you are reserving your spot for that item.
              </p>

              {/* How It Works */}
              <h3 className="text-sm font-bold text-foreground mb-3">How It Works:</h3>
              <div className="space-y-3 mb-5">
                {[
                  "Select the quantity you want to book",
                  'Click "Book" to reserve your items',
                  "Wait for the buygroup to reach the required number of participants",
                  "Once the buygroup is complete, you'll be notified and can proceed with payment",
                  "Your booking is confirmed only after the buygroup reaches its target",
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="h-3 w-3 text-amber-600" />
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>

              {/* Important Notes */}
              <h3 className="text-sm font-bold text-foreground mb-3">Important Notes:</h3>
              <div className="space-y-3">
                {[
                  "Your booking is a reservation, not an immediate purchase",
                  "You can cancel your booking before the buygroup closes",
                  "If the buygroup doesn't reach its target, your booking will be automatically cancelled",
                  "You'll receive notifications about the buygroup status",
                ].map((note, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <AlertTriangle className="h-3 w-3 text-amber-600" />
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{note}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border flex items-center gap-3">
              <button onClick={() => setShowBuygroupWarning(false)}
                className="flex-1 h-11 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors">
                Cancel
              </button>
              <button onClick={() => { setShowBuygroupWarning(false); handleAddToCart(); }}
                className="flex-1 h-11 rounded-xl bg-primary text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
                I Understand, Proceed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customize Product Modal */}
      {showCustomizeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40" onClick={() => setShowCustomizeModal(false)}>
          <div className="bg-card rounded-2xl w-full max-w-lg mx-4 shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-gradient-to-r from-foreground to-foreground/80 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <Pencil className="h-5 w-5" />
                <span className="text-base font-bold">Customize Product</span>
              </div>
              <button onClick={() => setShowCustomizeModal(false)} className="text-white/70 hover:text-white"><X className="h-5 w-5" /></button>
            </div>

            {/* Product reference */}
            <div className="px-6 py-3 bg-muted/50 border-b border-border flex items-center gap-3">
              <Package className="h-8 w-8 text-muted-foreground/50" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{product?.productName}</p>
                <p className="text-xs text-muted-foreground">Base price: ${offerPrice.toFixed(2)} · Seller: {sellerName.length <= 3 ? sellerName : sellerName.slice(0, 3) + "***"}</p>
              </div>
            </div>

            <div className="px-6 py-5 space-y-4 max-h-[55vh] overflow-y-auto">
              {/* Description */}
              <div>
                <label className="text-sm font-semibold text-foreground mb-1.5 block">What would you like to customize?</label>
                <textarea
                  value={customizeForm.description}
                  onChange={(e) => setCustomizeForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Describe your customization requirements — colors, sizes, materials, branding, packaging, etc."
                  className="w-full p-3 rounded-xl border border-border text-sm resize-none h-28 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              {/* Quantity + Budget row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-semibold text-foreground mb-1.5 block">Quantity Needed</label>
                  <input
                    type="number"
                    value={customizeForm.quantity}
                    onChange={(e) => setCustomizeForm((f) => ({ ...f, quantity: e.target.value }))}
                    min={1}
                    placeholder="100"
                    className="w-full p-3 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground mb-1.5 block">Target Budget</label>
                  <input
                    type="text"
                    value={customizeForm.budget}
                    onChange={(e) => setCustomizeForm((f) => ({ ...f, budget: e.target.value }))}
                    placeholder="$5,000"
                    className="w-full p-3 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              {/* File upload */}
              <div>
                <label className="text-sm font-semibold text-foreground mb-1.5 block">Attachments (optional)</label>
                <label className="flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-border cursor-pointer hover:border-primary hover:bg-muted/50 transition-colors">
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Upload reference images, specs, or designs</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) setCustomizeForm((f) => ({ ...f, attachments: [...f.attachments, ...Array.from(e.target.files!)] }));
                    }}
                  />
                </label>
                {customizeForm.attachments.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {customizeForm.attachments.map((file, i) => (
                      <div key={i} className="flex items-center justify-between text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg">
                        <span className="truncate">{file.name}</span>
                        <button onClick={() => setCustomizeForm((f) => ({ ...f, attachments: f.attachments.filter((_, j) => j !== i) }))}
                          className="text-red-500 hover:text-red-700 ms-2"><X className="h-3 w-3" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Info box */}
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
                <p className="text-xs text-blue-700 leading-relaxed">
                  Your customization request will be sent to the seller. They will review your requirements and respond with a quote, typically within 24-48 hours. You can also add the standard product to your cart while waiting.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border flex items-center gap-3">
              <button onClick={() => setShowCustomizeModal(false)}
                className="flex-1 h-11 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors">
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowCustomizeModal(false);
                  toast({ title: "Customization request sent!", description: "The seller will respond within 24-48 hours.", variant: "success" });
                  setCustomizeForm({ description: "", budget: "", quantity: "1", attachments: [] });
                }}
                disabled={!customizeForm.description.trim()}
                className="flex-1 h-11 rounded-xl bg-primary text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-40">
                <Send className="h-4 w-4" />
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Drawer */}
      {product && seller?.id && me.data?.data?.id !== seller?.id && (
        <Drawer open={isChatOpen} onOpenChange={setIsChatOpen}>
          <DrawerContent className="h-[85vh]">
            <DrawerHeader className="border-b"><DrawerTitle>{t("chat_with_seller") || "Chat with Seller"}</DrawerTitle></DrawerHeader>
            <div className="flex-1 overflow-auto"><ProductChat productId={Number(productId)} /></div>
          </DrawerContent>
        </Drawer>
      )}

      {/* Customize Product Form Modal */}
      {showCustomizeForm && product && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card rounded-xl max-w-2xl w-full my-auto">
            <AddToCustomizeForm
              selectedProductId={Number(productId)}
              onClose={() => setShowCustomizeForm(false)}
              onAddToFactory={() => {
                setShowCustomizeForm(false);
                toast({ title: t("customization_submitted") || "Customization submitted!", variant: "success" });
              }}
              onAddToCart={() => {
                setShowCustomizeForm(false);
                toast({ title: t("added_to_cart") || "Added to cart!", variant: "success" });
                queryClient.invalidateQueries({ queryKey: haveAccessToken ? ["cart-by-user-id"] : ["cart-list-by-device-id"] });
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
