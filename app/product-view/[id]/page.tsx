"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useProductById, useProductVariant, useTrackProductView } from "@/apis/queries/product.queries";
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
import dynamic from "next/dynamic";
import {
  Star, Heart, ShoppingCart, Share2, ChevronLeft, ChevronRight,
  Package, Truck, ShieldCheck, Clock, Store, MessageCircle,
  Minus, Plus, ArrowLeft, Tag, Award, Users, Timer,
  Zap, Check, X, Copy, Eye, ChevronDown,
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
  const [bgTimeLeft, setBgTimeLeft] = useState("");

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
  const deliveryDays = pp?.deliveryAfter || 0;
  const sellType = pp?.sellType;
  const consumerDiscount = pp?.consumerDiscount || 0;
  const consumerDiscountType = pp?.consumerDiscountType;

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
    <div className="min-h-screen bg-[#f8f5f0]">
      <div className="max-w-[1400px] mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div className="aspect-[4/5] rounded-3xl bg-[#ebe6de] animate-pulse" />
          <div className="space-y-6 py-8">
            <div className="h-4 w-32 rounded-full bg-[#ebe6de] animate-pulse" />
            <div className="h-10 w-4/5 rounded-xl bg-[#ebe6de] animate-pulse" />
            <div className="h-6 w-1/3 rounded-lg bg-[#ebe6de] animate-pulse" />
            <div className="h-48 rounded-2xl bg-[#ebe6de] animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );

  if (!product) return (
    <div className="min-h-screen bg-[#f8f5f0] flex items-center justify-center">
      <div className="text-center">
        <Package className="h-20 w-20 mx-auto mb-6 text-[#c9bfb0]" />
        <h2 className="text-2xl font-light text-[#2d2017] tracking-wide">Product not found</h2>
        <button onClick={() => router.back()} className="mt-6 text-sm text-[#c2703e] hover:underline underline-offset-4">
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

      <div className="min-h-screen bg-[#f8f5f0]">

        {/* ══════ HERO SECTION ══════ */}
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 pt-6 pb-4">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-[13px] text-[#8a7560] mb-4">
            <button onClick={() => router.back()} className="hover:text-[#c2703e] transition-colors"><ArrowLeft className="h-4 w-4" /></button>
            <span className="opacity-40">/</span>
            <a href="/trending" className="hover:text-[#c2703e] transition-colors">{t("store") || "Store"}</a>
            {product.category?.categoryName_en && (<><span className="opacity-40">/</span><span className="hover:text-[#c2703e] transition-colors cursor-pointer">{product.category.categoryName_en}</span></>)}
          </nav>
        </div>

        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 pb-20">

          {/* ══════ FULL WIDTH: Title + Seller side by side ══════ */}
          <div className="flex items-center gap-6 mb-6">
            {/* Left: Brand + Title + Rating */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                {product.brand?.brandName && (
                  <span className="text-xs font-semibold tracking-[0.15em] uppercase text-[#c2703e]">{product.brand.brandName}</span>
                )}
                {product.category?.categoryName_en && (
                  <span className="text-xs text-[#8a7560]">in {product.category.categoryName_en}</span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-bold leading-tight text-[#2d2017]">
                {product.productName}
              </h1>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                {reviews.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className={cn("h-4 w-4", i <= Math.round(avgRating) ? "fill-amber-400 text-amber-400" : "text-[#d4cdc2]")} />
                    ))}
                    <span className="text-sm font-medium text-[#2d2017] ms-1">{avgRating.toFixed(1)}</span>
                    <span className="text-sm text-[#8a7560]">({reviews.length})</span>
                  </div>
                )}
                {product.sold > 0 && (
                  <span className="text-sm text-[#8a7560]">{product.sold}+ sold</span>
                )}
              </div>
            </div>

                {/* Right: Seller Card */}
                <div className="flex-shrink-0 w-[220px] rounded-2xl overflow-hidden border border-[#e8dfd4] shadow-sm hover:shadow-md hover:border-[#c2703e]/30 transition-all cursor-pointer flex flex-col"
                  onClick={() => { if (seller?.id) router.push(`/company-profile-details?sellerId=${seller.id}`); }}>
                  {/* Top: gradient header with avatar */}
                  <div className="bg-gradient-to-br from-[#c2703e] to-[#a85d32] px-4 pt-4 pb-5 flex flex-col items-center relative">
                    <div className="w-14 h-14 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center text-white font-bold text-xl backdrop-blur-sm">
                      {sellerName.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-bold text-white mt-2">
                      {sellerName.length <= 3 ? sellerName : sellerName.slice(0, 3) + "***"}
                    </span>
                    {/* Badge on header */}
                    <span className={cn("absolute top-2 end-2 inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full",
                      seller?.tradeRole === "COMPANY" ? "bg-white/20 text-white" :
                      seller?.tradeRole === "FREELANCER" ? "bg-white/20 text-white" :
                      "bg-white/20 text-white"
                    )}>
                      {seller?.tradeRole === "COMPANY" ? <><ShieldCheck className="h-2.5 w-2.5" /> Company</> :
                       seller?.tradeRole === "FREELANCER" ? <><Award className="h-2.5 w-2.5" /> Pro</> :
                       <><Check className="h-2.5 w-2.5" /> Verified</>}
                    </span>
                  </div>
                  {/* Bottom: stats */}
                  <div className="bg-white px-4 py-3 flex-1 flex flex-col justify-between">
                    <div className="flex items-center justify-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((i) => <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />)}
                      <span className="text-xs font-semibold text-[#2d2017] ms-1.5">98%</span>
                    </div>
                    <div className="flex items-center justify-center gap-2.5 mt-2 text-[10px] text-[#8a7560]">
                      <span className="flex items-center gap-1"><Eye className="h-3 w-3 text-emerald-500" /> 2h ago</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-blue-500" /> ~1h</span>
                      <span className="flex items-center gap-1 text-[#8a7560]">
                        <Users className="h-3 w-3 text-purple-500" />
                        {seller?.createdAt ? new Date(seller.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "2024"}
                      </span>
                    </div>
                    {otherSellers.length > 0 && (
                      <div className="mt-2 text-center text-[10px] text-[#c2703e] font-medium">+{otherSellers.length} other sellers</div>
                    )}
                  </div>
                </div>
          </div>{/* end full-width title row */}

          {/* ══════ TWO COLUMNS: Image + Price side by side ══════ */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">

            {/* ── LEFT: Gallery ── */}
            <div className="lg:col-span-6">
              <div className="sticky top-6">
                <div className="relative rounded-2xl overflow-hidden bg-white shadow-[0_4px_24px_rgba(0,0,0,0.06)] group">
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
                        <span className="px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r from-[#c2703e] to-[#a85d32] shadow-lg shadow-[#c2703e]/20">{sellTypeLabel}</span>
                      )}
                    </div>
                    {/* Nav arrows */}
                    {images.length > 1 && (
                      <>
                        <button onClick={() => setSelectedImg((i) => (i - 1 + images.length) % images.length)}
                          className="absolute start-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><ChevronLeft className="h-5 w-5 text-[#2d2017]" /></button>
                        <button onClick={() => setSelectedImg((i) => (i + 1) % images.length)}
                          className="absolute end-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><ChevronRight className="h-5 w-5 text-[#2d2017]" /></button>
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
                        className={cn("w-16 h-16 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all duration-300 bg-white",
                          selectedImg === i ? "border-[#c2703e] shadow-lg shadow-[#c2703e]/15 scale-105" : "border-transparent opacity-60 hover:opacity-100")}>
                        {typeof img === "string" ? <img src={img} alt="" className="w-full h-full object-cover" /> : <Image src={img} alt="" width={64} height={64} className="w-full h-full object-cover" />}
                      </button>
                    ))}
                  </div>
                )}
                {/* Save / Share / Chat below image */}
                <div className="flex items-center gap-2 mt-3">
                  <button onClick={handleWishlist}
                    className={cn("flex-1 h-10 rounded-xl border text-sm font-medium flex items-center justify-center gap-2 transition-all",
                      inWishlist ? "bg-red-50 border-red-200 text-red-600" : "border-[#e8dfd4] text-[#8a7560] hover:border-[#c2703e] hover:text-[#c2703e]")}>
                    <Heart className={cn("h-4 w-4", inWishlist && "fill-red-500")} />
                    {inWishlist ? t("saved") || "Saved" : t("save") || "Save"}
                  </button>
                  <button onClick={handleShare}
                    className="flex-1 h-10 rounded-xl border border-[#e8dfd4] text-sm font-medium text-[#8a7560] flex items-center justify-center gap-2 hover:border-[#c2703e] hover:text-[#c2703e] transition-all">
                    {copiedLink ? <><Check className="h-4 w-4 text-emerald-600" /> Copied!</> : <><Share2 className="h-4 w-4" /> {t("share") || "Share"}</>}
                  </button>
                  <button onClick={() => setIsChatOpen(true)}
                    className="flex-1 h-10 rounded-xl border border-[#e8dfd4] text-sm font-medium text-[#8a7560] flex items-center justify-center gap-2 hover:border-[#c2703e] hover:text-[#c2703e] transition-all">
                    <MessageCircle className="h-4 w-4" /> {t("chat") || "Chat"}
                  </button>
                </div>
              </div>
            </div>

            {/* ── RIGHT: All-in-one product card ── */}
            <div className="lg:col-span-6">
              <div className="rounded-2xl bg-white border border-[#e8dfd4] shadow-sm overflow-hidden">

              {/* Short Description */}
              {product.product_productShortDescription?.length > 0 && (
                <div className="px-5 pt-5 pb-4 border-b border-[#f0ebe4]">
                  <h3 className="text-xs font-bold text-[#8a7560] uppercase tracking-wider mb-2">Product Description</h3>
                  {product.product_productShortDescription.map((sd: any, i: number) => (
                    <p key={i} className="text-sm leading-relaxed text-[#5a4d3e]" dir={langDir}>{sd.shortDescription}</p>
                  ))}
                </div>
              )}

              {/* ── Price Section ── */}
              <div className="px-5 py-5">
                {askForPrice ? (
                  <div className="text-center py-4">
                    <span className="text-lg font-semibold text-[#c2703e]">{t("ask_for_price") || "Ask for Price"}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-end gap-3 flex-wrap">
                      <span className="text-3xl font-extrabold text-[#2d2017] leading-none">${offerPrice.toFixed(2)}</span>
                      {discount > 0 && (
                        <span className="text-lg text-[#b5a898] line-through mb-1">${price.toFixed(2)}</span>
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
                      {product.skuNo && <span className="text-xs text-[#b5a898] ms-auto">SKU: {product.skuNo}</span>}
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
                    <div className="mt-5 rounded-2xl border-2 border-[#c2703e]/20 overflow-hidden">
                      {/* Header */}
                      <div className="bg-gradient-to-r from-[#c2703e] to-[#a85d32] px-5 py-3 flex items-center justify-between">
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
                      <div className="bg-[#c2703e]/[0.03] px-5 py-4 space-y-4">
                        {/* How it works */}
                        <p className="text-xs text-[#8a7560] leading-relaxed">
                          Join this group buy! When enough buyers join, the deal activates and everyone gets the discounted price.
                        </p>

                        {/* Min customers progress */}
                        {minCust > 0 && (
                          <div>
                            <div className="flex items-center justify-between text-xs mb-1.5">
                              <span className="text-[#8a7560] font-medium">Buyers needed</span>
                              <span className="font-bold text-[#c2703e]">{minCust} minimum</span>
                            </div>
                            <div className="h-2 bg-[#e8dfd4] rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-[#c2703e] to-[#e8943e] rounded-full transition-all duration-500" style={{ width: "0%" }} />
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-[#b5a898] mt-1">
                              <span>Join now to be first!</span>
                              {maxCust > 0 && <span>Max: {maxCust}</span>}
                            </div>
                          </div>
                        )}

                        {/* Deal details grid */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="p-2.5 rounded-xl bg-white border border-[#e8dfd4]">
                            <div className="text-[10px] text-[#b5a898] uppercase tracking-wider">Per Buyer</div>
                            <div className="text-sm font-bold text-[#2d2017] mt-0.5">
                              {minQtyPer}{maxQtyPer > 0 ? ` — ${maxQtyPer}` : "+"} units
                            </div>
                          </div>
                          <div className="p-2.5 rounded-xl bg-white border border-[#e8dfd4]">
                            <div className="text-[10px] text-[#b5a898] uppercase tracking-wider">Available</div>
                            <div className="text-sm font-bold text-[#2d2017] mt-0.5">{totalStock} units</div>
                          </div>
                          {startDate && (
                            <div className="p-2.5 rounded-xl bg-white border border-[#e8dfd4]">
                              <div className="text-[10px] text-[#b5a898] uppercase tracking-wider">Starts</div>
                              <div className="text-xs font-semibold text-[#2d2017] mt-0.5">
                                {startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                              </div>
                            </div>
                          )}
                          {endDate && (
                            <div className="p-2.5 rounded-xl bg-white border border-[#e8dfd4]">
                              <div className="text-[10px] text-[#b5a898] uppercase tracking-wider">Ends</div>
                              <div className="text-xs font-semibold text-[#2d2017] mt-0.5">
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

                {/* Quantity + Cart */}
                {!askForPrice && stock > 0 && !saleNotStarted && !saleExpired && (
                  <div className="mt-6 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center border border-[#e8dfd4] rounded-xl overflow-hidden">
                        <button onClick={() => setQuantity(Math.max(minQty, quantity - 1))}
                          className="w-11 h-11 flex items-center justify-center hover:bg-[#f8f5f0] transition-colors"><Minus className="h-4 w-4 text-[#8a7560]" /></button>
                        <input type="number" value={quantity} onChange={(e) => setQuantity(Math.max(minQty, Math.min(maxQty, Number(e.target.value))))}
                          className="w-14 h-11 text-center font-semibold text-[#2d2017] border-x border-[#e8dfd4] focus:outline-none" />
                        <button onClick={() => setQuantity(Math.min(maxQty, quantity + 1))}
                          className="w-11 h-11 flex items-center justify-center hover:bg-[#f8f5f0] transition-colors"><Plus className="h-4 w-4 text-[#8a7560]" /></button>
                      </div>
                      <button onClick={isBuygroup ? () => setShowBuygroupWarning(true) : handleAddToCart} disabled={stock === 0}
                        className={cn("flex-1 h-12 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-40",
                          isBuygroup ? "bg-[#c2703e] hover:bg-[#a85d32] shadow-lg shadow-[#c2703e]/20" : "bg-[#2d2017] hover:bg-[#1a130d]")}>
                        {isBuygroup ? <Users className="h-4.5 w-4.5" /> : <ShoppingCart className="h-4.5 w-4.5" />}
                        {isBuygroup ? "Book Your Spot" : isInCart ? t("update_cart") || "Update Cart" : t("add_to_cart") || "Add to Cart"}
                        {isBuygroup && ` — $${(offerPrice * quantity).toFixed(2)}`}
                      </button>
                    </div>
                    {!isBuygroup && (
                      <button onClick={handleBuyNow}
                        className="w-full h-12 rounded-xl bg-[#c2703e] text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#a85d32] transition-all active:scale-[0.98] shadow-lg shadow-[#c2703e]/20">
                        <Zap className="h-4.5 w-4.5" />
                        {t("buy_now") || "Buy Now"} — ${(offerPrice * quantity).toFixed(2)}
                      </button>
                    )}
                    {minQty > 1 && <p className="text-xs text-[#8a7560] text-center">Min order: {minQty} units</p>}
                  </div>
                )}
              </div>


              {/* ── Product Details (inside same card) ── */}
              <div className="px-5 py-4 border-t border-[#f0ebe4] space-y-2.5">
                {/* Delivery */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <Truck className="h-4.5 w-4.5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-[#2d2017]">
                      {deliveryDays > 0 ? `Estimated delivery in ${deliveryDays} days` : "Delivery available"}
                    </div>
                    <div className="text-xs text-[#8a7560]">Shipping cost calculated at checkout</div>
                  </div>
                </div>
                {/* Buyer Protection */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="h-4.5 w-4.5 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-[#2d2017]">Buyer Protection</div>
                    <div className="text-xs text-[#8a7560]">Money-back guarantee if not as described</div>
                  </div>
                </div>
                {/* Product Condition — eBay-style */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                    <Tag className="h-4.5 w-4.5 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-[#2d2017]">
                      {(() => {
                        const cond = (pp?.productCondition || "new").toLowerCase();
                        const condMap: Record<string, { label: string; desc: string }> = {
                          "new": { label: "New", desc: "Brand new, unused, unopened, undamaged item in its original packaging" },
                          "open box": { label: "Open Box", desc: "Item is in original packaging, opened but never used" },
                          "refurbished": { label: "Certified Refurbished", desc: "Professionally restored to working order by manufacturer or seller" },
                          "like new": { label: "Like New", desc: "Item that has been used but is in excellent, near-new condition" },
                          "used": { label: "Pre-Owned", desc: "Previously used item, may show signs of cosmetic wear" },
                          "good": { label: "Good", desc: "Item shows wear from consistent use, fully operational and functions as intended" },
                          "fair": { label: "Acceptable", desc: "Item is fairly worn but continues to work properly, some cosmetic damage" },
                          "for parts": { label: "For Parts or Not Working", desc: "Item does not function as intended or requires repair" },
                        };
                        const match = condMap[cond] || condMap["new"];
                        return match.label;
                      })()}
                    </div>
                    <div className="text-xs text-[#8a7560]">
                      {(() => {
                        const cond = (pp?.productCondition || "new").toLowerCase();
                        const condMap: Record<string, string> = {
                          "new": "Brand new, unused, unopened, undamaged item in original packaging",
                          "open box": "Original packaging, opened but never used",
                          "refurbished": "Professionally restored to working order",
                          "like new": "Used but in excellent, near-new condition",
                          "used": "Previously used, may show signs of cosmetic wear",
                          "good": "Shows wear from consistent use, fully operational",
                          "fair": "Fairly worn but continues to work properly",
                          "for parts": "Does not function as intended, requires repair",
                        };
                        return condMap[cond] || condMap["new"];
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
            <div className="flex items-center gap-1 border-b border-[#e8dfd4] overflow-x-auto">
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
                    activeTab === tab.id ? "border-[#c2703e] text-[#c2703e]" : "border-transparent text-[#8a7560] hover:text-[#2d2017]")}>
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="bg-white rounded-b-2xl border border-t-0 border-[#e8dfd4] p-6 sm:p-10 min-h-[300px]">
              {activeTab === "description" && (() => {
                const desc = product?.isDropshipped && product?.customMarketingContent?.marketingText
                  ? product.customMarketingContent.marketingText : product?.description;
                if (!desc) return <p className="text-[#8a7560]">No description available.</p>;
                if (typeof desc === "object") return <PlateEditor description={desc} readOnly fixedToolbar={false} />;
                try { return <PlateEditor description={JSON.parse(desc)} readOnly fixedToolbar={false} />; }
                catch { return <div className="prose prose-gray max-w-none text-[#5a4d3e] leading-relaxed" dir={langDir}>{desc}</div>; }
              })()}

              {activeTab === "specs" && (
                specs.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2">
                    {specs.map((sv: any, i: number) => (
                      <div key={i} className={cn("flex py-3.5 px-5", i % 2 === 0 ? "bg-[#faf7f2]" : "bg-white")}>
                        <span className="w-1/2 text-sm font-medium text-[#8a7560]">{sv.specTemplate?.name_en || "—"}</span>
                        <span className="w-1/2 text-sm text-[#2d2017]">{sv.value || "—"}</span>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-[#8a7560]">No specifications available.</p>
              )}

              {activeTab === "reviews" && <ReviewSection productId={Number(productId)} productReview={reviews} />}
              {activeTab === "qanda" && <QuestionsAnswersSection productId={Number(productId)} sellerId={seller?.id} userId={me.data?.data?.id} />}
              {activeTab === "vendor" && <VendorSection sellerId={seller?.id} sellerName={sellerName} />}
              {activeTab === "services" && <RelatedServices categoryId={product?.categoryId} sellerId={seller?.id} />}
            </div>
          </div>

          {/* Related */}
          <div className="mt-12"><RelatedProductsSection productId={Number(productId)} categoryId={product?.categoryId} /></div>
          <div className="mt-8"><ProductRecommendations productId={Number(productId)} /></div>
        </div>
      </div>

      {/* BuyGroup Warning Popup */}
      {showBuygroupWarning && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40" onClick={() => setShowBuygroupWarning(false)}>
          <div className="bg-white rounded-2xl w-full max-w-sm mx-4 shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-gradient-to-r from-[#c2703e] to-[#a85d32] px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <Users className="h-5 w-5" />
                <span className="text-base font-bold">How Buygroups Work</span>
              </div>
              <button onClick={() => setShowBuygroupWarning(false)} className="text-white/70 hover:text-white"><X className="h-5 w-5" /></button>
            </div>

            <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
              {/* What is a Buygroup */}
              <h3 className="text-sm font-bold text-[#2d2017] mb-2">What is a Buygroup?</h3>
              <p className="text-xs text-[#5a4d3e] leading-relaxed mb-5">
                A buygroup is a collective purchasing system where multiple customers come together to purchase products at better prices. When you book a product in a buygroup, you are reserving your spot for that item.
              </p>

              {/* How It Works */}
              <h3 className="text-sm font-bold text-[#2d2017] mb-3">How It Works:</h3>
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
                    <p className="text-xs text-[#5a4d3e] leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>

              {/* Important Notes */}
              <h3 className="text-sm font-bold text-[#2d2017] mb-3">Important Notes:</h3>
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
                    <p className="text-xs text-[#5a4d3e] leading-relaxed">{note}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-[#e8dfd4] flex items-center gap-3">
              <button onClick={() => setShowBuygroupWarning(false)}
                className="flex-1 h-11 rounded-xl border border-[#e8dfd4] text-sm font-medium text-[#8a7560] hover:bg-[#faf7f2] transition-colors">
                Cancel
              </button>
              <button onClick={() => { setShowBuygroupWarning(false); handleAddToCart(); }}
                className="flex-1 h-11 rounded-xl bg-[#c2703e] text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#a85d32] transition-colors shadow-lg shadow-[#c2703e]/20">
                I Understand, Proceed
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
    </>
  );
}
