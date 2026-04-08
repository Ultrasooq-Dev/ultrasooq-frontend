"use client";
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Star, ShoppingCart, Send, MapPin, Truck, Shield,
  MessageSquare, FileText, ChevronDown,
  Check, CreditCard, Zap, Minus, Plus, Loader2, Clock,
} from "lucide-react";

export interface ProductDetailViewProps {
  locale: string;
  currencySymbol: string;
  // Product detail data
  viewingProductId: number;
  viewingProduct: any;
  productDetailQuery: { data: any; isLoading: boolean };
  selectedProduct: any;
  // Pricing context
  calculatedPrice: number;
  originalPrice: number;
  hasCalcDiscount: boolean;
  calcDiscountPct: number;
  pricingInfo: {
    askForPrice: boolean;
    consumerDiscount: number;
    consumerDiscountType: string | null;
    vendorDiscount: number;
    vendorDiscountType: string | null;
    consumerType: string;
    minQuantity: number;
    maxQuantity: number | null;
    minOrder: number;
    maxOrder: number | null;
    sellType: string;
    enableChat: boolean;
    dateOpen: string | null;
    dateClose: string | null;
    startTime: string | null;
    endTime: string | null;
    minCustomer: number | null;
    maxCustomer: number | null;
  };
  buygroupTimeLeft: string | null;
  // State callbacks
  onBack: () => void;
  onAddToCart: (productPriceId: number, quantity?: number) => void;
  onAddToRfqCart?: (productId: number) => void;
  onSetSelectedProductId: (id: number) => void;
  onSetReqMode: (mode: "rfq" | "vendor") => void;
  onSetViewingProductId: (id: number | null) => void;
  onSetActiveTab: (tab: "products" | "customize" | "buynow") => void;
  // Buygroup disclaimer
  hasSeenBuygroupDisclaimer: boolean;
  onOpenBuygroupDisclaimer: (priceId: number, qty: number) => void;
}

export function ProductDetailView({
  locale,
  currencySymbol,
  viewingProductId,
  viewingProduct,
  productDetailQuery,
  selectedProduct,
  calculatedPrice,
  originalPrice,
  hasCalcDiscount,
  calcDiscountPct,
  pricingInfo,
  buygroupTimeLeft,
  onBack,
  onAddToCart,
  onAddToRfqCart,
  onSetSelectedProductId,
  onSetReqMode,
  onSetViewingProductId,
  onSetActiveTab,
  hasSeenBuygroupDisclaimer,
  onOpenBuygroupDisclaimer,
}: ProductDetailViewProps) {
  const isAr = locale === "ar";
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
    media: [
      ...(detail?.productImages?.filter((img: any) => img.image)?.map((img: any) => ({ type: "image" as const, src: img.image })) || []),
      ...(detail?.productImages?.filter((img: any) => img.video)?.map((img: any) => ({ type: "video" as const, src: img.video })) || []),
    ],
    reviews: detail?.productReview || [],
    brand: detail?.brand?.brandName || "",
    category: detail?.category?.name || "",
    skuNo: detail?.skuNo || "",
  };

  const productReviews = (vp.reviews || []).map((r: any) => ({
    user: r.user?.firstName || r.userName || "User",
    rating: r.rating || 4,
    text: r.description || r.title || "",
    date: r.createdAt ? new Date(r.createdAt).toLocaleDateString("en", { month: "short", day: "numeric" }) : "",
  }));

  // Local state for detail view
  const [detailQty, setDetailQty] = useState(1);
  const [activeMediaIdx, setActiveMediaIdx] = useState(0);
  const [askingQuestion, setAskingQuestion] = useState(false);
  const [questionText, setQuestionText] = useState("");
  const [writingReview, setWritingReview] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);

  return (
    <div className="flex flex-col h-full min-h-0 bg-background">
      {/* Back header */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border shrink-0">
        <button type="button" onClick={onBack}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ChevronDown className="h-3.5 w-3.5 rotate-90" /> {isAr ? "رجوع" : "Back"}
        </button>
        <span className="ms-auto text-xs text-muted-foreground">{vp.seller}</span>
      </div>

      {/* Scrollable detail */}
      <div className="flex-1 overflow-y-auto">
        {/* Image/Video gallery */}
        <div className="bg-muted/20 p-3">
          {vp.media.length > 0 ? (
            <div className="flex gap-2">
              {/* Main display */}
              <div className="flex-1 h-56 rounded-lg overflow-hidden bg-muted relative">
                {vp.media[activeMediaIdx]?.type === "video" ? (
                  <video src={vp.media[activeMediaIdx].src} controls className="h-full w-full object-contain" />
                ) : (
                  <img src={vp.media[activeMediaIdx]?.src || vp.images[0]} alt={vp.name} className="h-full w-full object-contain" />
                )}
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
                <span className="text-xs text-muted-foreground ms-1">{vp.rating > 0 ? vp.rating.toFixed(1) : "\u2014"} ({vp.reviewCount})</span>
              </div>
            </div>

            {/* Seller card */}
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
                <span className="flex items-center gap-0.5"><Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" /> {vp.rating > 0 ? vp.rating.toFixed(1) : "\u2014"}</span>
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

          {/* Pricing & Rules */}
          <div className="space-y-2">
            <h3 className="text-[11px] font-semibold">{isAr ? "التسعير والقواعد" : "Pricing & Rules"}</h3>

            {pricingInfo.askForPrice ? (
              <div className="rounded-lg border border-amber-300 bg-amber-50/50 dark:bg-amber-950/10 p-3 text-center">
                <p className="text-xs font-semibold text-amber-700">{isAr ? "اتصل بالبائع للحصول على السعر" : "Contact seller for pricing"}</p>
                <button type="button" className="mt-1.5 flex items-center gap-1 mx-auto rounded bg-amber-600 text-white hover:bg-amber-700 px-3 py-1.5 text-[10px] font-semibold">
                  <MessageSquare className="h-3 w-3" /> {isAr ? "رسالة" : "Message Seller"}
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-lg font-bold text-foreground">{currencySymbol}{calculatedPrice}</span>
                  {hasCalcDiscount && (
                    <>
                      <span className="text-xs text-muted-foreground line-through">{currencySymbol}{originalPrice}</span>
                      <span className="text-[10px] font-semibold text-green-600">-{calcDiscountPct}%</span>
                    </>
                  )}
                </div>

                {/* Buy Group timer */}
                {pricingInfo.sellType === "BUYGROUP" && pricingInfo.dateClose && (
                  <div className="rounded-lg border border-amber-300/50 bg-amber-50/30 dark:bg-amber-950/10 p-2.5">
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <Clock className="h-3 w-3 text-amber-600" />
                      <span className="font-semibold text-amber-700">{isAr ? "مجموعة شراء" : "Group Buy"}</span>
                      {buygroupTimeLeft && (
                        <span className={cn(
                          "px-1.5 py-0.5 rounded-full text-[9px] font-bold text-white",
                          buygroupTimeLeft === (isAr ? "انتهى" : "Expired") ? "bg-muted-foreground" :
                          buygroupTimeLeft === (isAr ? "لم يبدأ بعد" : "Not Started") ? "bg-amber-500" :
                          "bg-destructive"
                        )}>
                          {buygroupTimeLeft}
                        </span>
                      )}
                    </div>
                    {(pricingInfo.minCustomer || pricingInfo.maxCustomer) && (
                      <div className="text-[9px] text-muted-foreground mt-1">
                        {pricingInfo.minCustomer && `${isAr ? "الحد الأدنى" : "Min"} ${pricingInfo.minCustomer} ${isAr ? "مشتري" : "buyers"}`}
                        {pricingInfo.minCustomer && pricingInfo.maxCustomer && " \u2014 "}
                        {pricingInfo.maxCustomer && `${isAr ? "الحد الأقصى" : "Max"} ${pricingInfo.maxCustomer} ${isAr ? "مشتري" : "buyers"}`}
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-1.5">
                  {/* Sell type */}
                  <div className="rounded border border-border p-2">
                    <span className="text-[9px] text-muted-foreground block">{isAr ? "نوع البيع" : "Sell Type"}</span>
                    <span className="text-[10px] font-semibold">
                      {pricingInfo.sellType === "NORMALSELL" ? (isAr ? "تجزئة" : "Retail") :
                       pricingInfo.sellType === "BUYGROUP" ? (isAr ? "مجموعة شراء" : "Buy Group") :
                       pricingInfo.sellType === "WHOLESALE_PRODUCT" ? (isAr ? "جملة" : "Wholesale") :
                       pricingInfo.sellType === "TRIAL_PRODUCT" ? (isAr ? "تجريبي" : "Trial") :
                       pricingInfo.sellType}
                    </span>
                  </div>
                  {/* Consumer type */}
                  <div className="rounded border border-border p-2">
                    <span className="text-[9px] text-muted-foreground block">{isAr ? "الفئة المستهدفة" : "Target"}</span>
                    <span className="text-[10px] font-semibold">
                      {pricingInfo.consumerType === "CONSUMER" ? (isAr ? "مستهلكين" : "Consumers") :
                       pricingInfo.consumerType === "VENDORS" ? (isAr ? "تجار فقط" : "Vendors Only") :
                       pricingInfo.consumerType === "EVERYONE" ? (isAr ? "الجميع" : "Everyone") :
                       pricingInfo.consumerType}
                    </span>
                  </div>
                  {/* Discount details */}
                  {pricingInfo.consumerDiscount > 0 && (
                    <div className="rounded border border-green-200 bg-green-50/50 dark:bg-green-950/10 p-2">
                      <span className="text-[9px] text-muted-foreground block">{isAr ? "خصم المستهلك" : "Consumer Discount"}</span>
                      <span className="text-[10px] font-bold text-green-600">
                        {pricingInfo.consumerDiscountType === "FLAT" ? `${pricingInfo.consumerDiscount} OMR off` : `${pricingInfo.consumerDiscount}%`}
                      </span>
                    </div>
                  )}
                  {pricingInfo.vendorDiscount > 0 && (
                    <div className="rounded border border-blue-200 bg-blue-50/50 dark:bg-blue-950/10 p-2">
                      <span className="text-[9px] text-muted-foreground block">{isAr ? "خصم التجار" : "Vendor Discount"}</span>
                      <span className="text-[10px] font-bold text-blue-600">
                        {pricingInfo.vendorDiscountType === "FLAT" ? `${pricingInfo.vendorDiscount} OMR off` : `${pricingInfo.vendorDiscount}%`}
                      </span>
                    </div>
                  )}
                  {/* Quantity limits */}
                  {(pricingInfo.minQuantity > 1 || pricingInfo.maxQuantity) && (
                    <div className="rounded border border-border p-2">
                      <span className="text-[9px] text-muted-foreground block">{isAr ? "الكمية" : "Quantity"}</span>
                      <span className="text-[10px] font-semibold">
                        {isAr ? "من" : "Min"} {pricingInfo.minQuantity}
                        {pricingInfo.maxQuantity && ` \u2014 ${isAr ? "إلى" : "Max"} ${pricingInfo.maxQuantity}`}
                      </span>
                    </div>
                  )}
                  {/* Stock */}
                  <div className="rounded border border-border p-2">
                    <span className="text-[9px] text-muted-foreground block">{isAr ? "المخزون" : "Stock"}</span>
                    <span className={cn("text-[10px] font-semibold", vp.stock > 0 ? "text-green-600" : "text-destructive")}>
                      {vp.stock > 0 ? `${vp.stock} ${isAr ? "قطعة" : "available"}` : (isAr ? "غير متوفر" : "Out of stock")}
                    </span>
                  </div>
                </div>
              </>
            )}
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
              <div className="space-y-2">
                {writingReview && (
                  <div className="rounded-lg border border-amber-300/50 bg-amber-50/30 dark:bg-amber-950/10 p-2.5 space-y-2">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-muted-foreground me-1">{isAr ? "تقييمك" : "Your rating"}</span>
                      {[1, 2, 3, 4, 5].map((r) => (
                        <button key={r} type="button" onClick={() => setReviewRating(r)} className="p-0.5">
                          <Star className={cn("h-4 w-4", r <= reviewRating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20")} />
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      placeholder={isAr ? "اكتب تقييمك..." : "Write your review..."}
                      rows={3}
                      className="w-full text-xs rounded border border-border bg-background px-2.5 py-2 outline-none focus:ring-1 focus:ring-amber-400 resize-none placeholder:text-muted-foreground"
                    />
                    <div className="flex items-center gap-2">
                      <button type="button"
                        disabled={!reviewText.trim()}
                        onClick={() => {
                          setReviewText(""); setWritingReview(false); setReviewRating(5);
                        }}
                        className="flex items-center gap-1 rounded bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50 px-3 py-1.5 text-[10px] font-semibold">
                        <Send className="h-3 w-3" /> {isAr ? "إرسال" : "Submit"}
                      </button>
                      <button type="button" onClick={() => { setWritingReview(false); setReviewText(""); }}
                        className="text-[10px] text-muted-foreground hover:text-foreground px-2 py-1.5">
                        {isAr ? "إلغاء" : "Cancel"}
                      </button>
                    </div>
                  </div>
                )}
                <div className="rounded-lg border border-border p-4 text-center">
                  <p className="text-xs text-muted-foreground">{isAr ? "لا توجد تقييمات بعد" : "No reviews yet"}</p>
                  <button type="button"
                    onClick={() => setWritingReview(true)}
                    className="text-[10px] text-primary font-medium mt-1 hover:underline">
                    {isAr ? "كن أول من يقيم هذا المنتج" : "Be the first to review this product \u2192"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Q&A */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="text-[11px] font-semibold">{isAr ? "أسئلة وأجوبة" : "Q&A"}</h3>
              <button type="button"
                onClick={() => setAskingQuestion(!askingQuestion)}
                className="text-[10px] text-primary hover:underline">
                {askingQuestion ? (isAr ? "إلغاء" : "Cancel") : (isAr ? "اسأل سؤال" : "Ask a question")}
              </button>
            </div>
            {askingQuestion && (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-2.5 mb-2 space-y-2">
                <textarea
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder={isAr ? "اكتب سؤالك عن هذا المنتج..." : "Write your question about this product..."}
                  rows={3}
                  className="w-full text-xs rounded border border-border bg-background px-2.5 py-2 outline-none focus:ring-1 focus:ring-primary resize-none placeholder:text-muted-foreground"
                />
                <div className="flex items-center gap-2">
                  <button type="button"
                    disabled={!questionText.trim()}
                    onClick={() => {
                      setQuestionText(""); setAskingQuestion(false);
                    }}
                    className="flex items-center gap-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 px-3 py-1.5 text-[10px] font-semibold">
                    <Send className="h-3 w-3" /> {isAr ? "إرسال" : "Submit"}
                  </button>
                  <button type="button" onClick={() => { setAskingQuestion(false); setQuestionText(""); }}
                    className="text-[10px] text-muted-foreground hover:text-foreground px-2 py-1.5">
                    {isAr ? "إلغاء" : "Cancel"}
                  </button>
                </div>
              </div>
            )}
            <div className="rounded-lg border border-border p-4 text-center">
              <p className="text-xs text-muted-foreground">{isAr ? "لا توجد أسئلة بعد" : "No questions yet"}</p>
              <button type="button"
                onClick={() => setAskingQuestion(true)}
                className="text-[10px] text-primary font-medium mt-1 hover:underline">
                {isAr ? "اسأل البائع عن هذا المنتج" : "Ask the seller about this product \u2192"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky bottom: qty + add to cart + RFQ */}
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
          {/* Buy/Book button */}
          <button type="button" onClick={() => {
            const ppId = priceEntry?.id;
            if (!ppId) return;
            if (pricingInfo.sellType === "BUYGROUP" && !hasSeenBuygroupDisclaimer) {
              onOpenBuygroupDisclaimer(ppId, detailQty);
              return;
            }
            onAddToCart(ppId, detailQty);
          }}
            className={cn("flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold",
              pricingInfo.sellType === "BUYGROUP" ? "bg-amber-600 text-white hover:bg-amber-700" : "bg-green-600 text-white hover:bg-green-700")}>
            <CreditCard className="h-3.5 w-3.5" />
            {pricingInfo.sellType === "BUYGROUP" ? (isAr ? "حجز" : "Book") : (isAr ? "شراء" : "Buy")} {"\u2014"} {calculatedPrice * detailQty} {currencySymbol}
          </button>
          {/* RFQ button */}
          <button type="button" onClick={() => {
            onAddToRfqCart?.(vp.id);
            onSetSelectedProductId(vp.id); onSetReqMode("rfq"); onSetViewingProductId(null); onSetActiveTab("customize");
          }}
            className="flex items-center justify-center gap-1 rounded-lg border border-primary text-primary hover:bg-primary/5 px-3 py-2 text-xs font-semibold">
            <FileText className="h-3.5 w-3.5" /> RFQ
          </button>
        </div>
      </div>
    </div>
  );
}
