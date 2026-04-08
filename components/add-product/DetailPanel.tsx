"use client";
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Package, Star, MapPin, Truck, Shield, ShoppingCart, MessageSquare,
  Heart, Share2, ChevronDown, Check, Eye, CreditCard, Tag, Box,
  Clock, Award, BarChart3, Layers, Send,
} from "lucide-react";

interface DetailPanelProps {
  product: any | null;
  locale: string;
}

export default function AddProductDetailPanel({ product, locale }: DetailPanelProps) {
  const isAr = locale === "ar";
  const [activeTab, setActiveTab] = useState<"overview" | "specs" | "vendor">("overview");
  const [quantity, setQuantity] = useState(1);

  // Empty state
  if (!product) {
    return (
      <div className="flex flex-col h-full min-h-0 bg-muted/10">
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-6">
          <Package className="h-12 w-12 mb-3 opacity-10" />
          <h3 className="text-sm font-semibold mb-1">{isAr ? "تفاصيل المنتج" : "Product Detail"}</h3>
          <p className="text-xs text-center opacity-60 max-w-[200px]">
            {isAr ? "اختر منتج من القائمة لعرض التفاصيل" : "Select a product from the list to view details"}
          </p>
        </div>
      </div>
    );
  }

  const price = product.price ?? product.productPrice?.[0]?.offerPrice ?? 0;
  const stock = product.stock ?? product.productPrice?.[0]?.stock ?? 0;
  const rating = product.rating ?? product.averageRating ?? 0;
  const reviews = product.reviews ?? product.reviewCount ?? 0;
  const seller = product.seller ?? product.productPrice?.[0]?.user?.firstName ?? "Vendor";
  const name = product.name ?? product.productName_en ?? product.productName ?? "";
  const image = product.image ?? product.images?.[0]?.url ?? product.productImage;
  const specs = product.specs ?? [];
  const category = product.category ?? product.categoryName ?? "";
  const delivery = product.delivery ?? "3-5 days";
  const warranty = product.warranty ?? "1 year";

  return (
    <div className="flex flex-col h-full min-h-0 bg-background">
      {/* Product image + basic info */}
      <div className="shrink-0 border-b border-border">
        {/* Image */}
        <div className="h-48 bg-muted flex items-center justify-center overflow-hidden">
          {image ? (
            <img src={image} alt={name} className="h-full w-full object-contain" />
          ) : (
            <Package className="h-16 w-16 text-muted-foreground/10" />
          )}
        </div>

        {/* Name + price */}
        <div className="px-4 py-3">
          <h2 className="text-base font-bold leading-tight">{name}</h2>
          {category && <span className="text-xs text-muted-foreground">{category}</span>}

          <div className="flex items-center gap-3 mt-2">
            <span className="text-xl font-bold text-green-600">{price} <span className="text-sm">OMR</span></span>
            {rating > 0 && (
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="text-sm font-medium">{rating.toFixed(1)}</span>
                {reviews > 0 && <span className="text-xs text-muted-foreground">({reviews})</span>}
              </div>
            )}
          </div>

          {/* Stock + seller */}
          <div className="flex items-center gap-3 mt-2 text-xs">
            <span className={cn("flex items-center gap-1", stock > 0 ? "text-green-600" : "text-destructive")}>
              <Box className="h-3 w-3" />
              {stock > 0 ? `${stock} ${isAr ? "متوفر" : "in stock"}` : (isAr ? "غير متوفر" : "Out of stock")}
            </span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="h-3 w-3" /> {seller}
            </span>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-2 px-4 pb-3">
          {/* Quantity */}
          <div className="flex items-center border border-border rounded-md">
            <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="flex h-8 w-8 items-center justify-center text-sm hover:bg-muted">-</button>
            <input type="number" value={quantity} onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="h-8 w-12 text-center text-sm border-x border-border bg-background outline-none" />
            <button type="button" onClick={() => setQuantity(quantity + 1)}
              className="flex h-8 w-8 items-center justify-center text-sm hover:bg-muted">+</button>
          </div>

          {/* Add to RFQ */}
          <button type="button"
            className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
            <Send className="h-3.5 w-3.5" /> {isAr ? "إضافة للطلب" : "Add to RFQ"}
          </button>

          {/* Buy Now */}
          <button type="button"
            className="flex items-center justify-center gap-1.5 h-8 px-3 rounded-md bg-green-600 text-white text-sm font-medium hover:bg-green-700">
            <ShoppingCart className="h-3.5 w-3.5" /> {isAr ? "شراء" : "Buy"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border shrink-0">
        {[
          { id: "overview" as const, label: isAr ? "نظرة عامة" : "Overview", icon: Eye },
          { id: "specs" as const, label: isAr ? "المواصفات" : "Specs", icon: Layers },
          { id: "vendor" as const, label: isAr ? "البائع" : "Vendor", icon: MapPin },
        ].map((tab) => (
          <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold border-b-2 transition-colors",
              activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            )}>
            <tab.icon className="h-3.5 w-3.5" /> {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {/* Overview */}
        {activeTab === "overview" && (
          <div className="p-4 space-y-4">
            {/* Key features */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: Truck, label: isAr ? "التوصيل" : "Delivery", value: delivery },
                { icon: Shield, label: isAr ? "الكفالة" : "Warranty", value: warranty },
                { icon: CreditCard, label: isAr ? "الدفع" : "Payment", value: isAr ? "بطاقة/محفظة" : "Card/Wallet" },
                { icon: Award, label: isAr ? "الحالة" : "Condition", value: isAr ? "جديد" : "New" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2 rounded-lg border border-border p-2.5">
                  <item.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[10px] text-muted-foreground block">{item.label}</span>
                    <span className="text-xs font-medium">{item.value}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Description */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                {isAr ? "الوصف" : "Description"}
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {product.description ?? (isAr ? "لا يوجد وصف متاح" : "No description available.")}
              </p>
            </div>

            {/* Bulk pricing */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                {isAr ? "أسعار الجملة" : "Bulk Pricing"}
              </h4>
              <div className="rounded-lg border border-border overflow-hidden">
                {[
                  { qty: "1-9", price: price },
                  { qty: "10-49", price: Math.round(price * 0.95) },
                  { qty: "50-99", price: Math.round(price * 0.9) },
                  { qty: "100+", price: Math.round(price * 0.85) },
                ].map((tier, i) => (
                  <div key={i} className={cn("flex items-center justify-between px-3 py-2 text-sm",
                    i % 2 === 0 ? "bg-muted/30" : "")}>
                    <span className="text-muted-foreground">{tier.qty} {isAr ? "قطعة" : "units"}</span>
                    <span className="font-bold text-green-600">{tier.price} OMR</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Specs */}
        {activeTab === "specs" && (
          <div className="p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
              {isAr ? "المواصفات الفنية" : "Technical Specifications"}
            </h4>
            {specs.length > 0 ? (
              <div className="rounded-lg border border-border overflow-hidden">
                {specs.map(([key, val]: [string, string], i: number) => (
                  <div key={i} className={cn("flex items-center px-3 py-2 text-sm",
                    i % 2 === 0 ? "bg-muted/30" : "")}>
                    <span className="text-muted-foreground w-28 shrink-0 font-medium">{key}</span>
                    <span className="flex-1">{val}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Layers className="h-8 w-8 mb-2 opacity-15" />
                <p className="text-xs">{isAr ? "لا توجد مواصفات" : "No specs available"}</p>
              </div>
            )}
          </div>
        )}

        {/* Vendor */}
        {activeTab === "vendor" && (
          <div className="p-4 space-y-4">
            {/* Vendor card */}
            <div className="flex items-center gap-3 p-3 rounded-lg border border-border">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary text-lg font-bold shrink-0">
                {seller.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-bold block">{seller}</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  <span className="text-xs text-muted-foreground">4.8 · 234 {isAr ? "تقييم" : "reviews"}</span>
                </div>
              </div>
              <button type="button"
                className="flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted">
                <MessageSquare className="h-3 w-3" /> {isAr ? "تواصل" : "Chat"}
              </button>
            </div>

            {/* Vendor stats */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: isAr ? "معدل الرد" : "Response", value: "< 1h" },
                { label: isAr ? "نسبة التوصيل" : "On-time", value: "98%" },
                { label: isAr ? "عمل منذ" : "Since", value: "2019" },
              ].map((stat) => (
                <div key={stat.label} className="text-center p-2 rounded-lg border border-border">
                  <span className="text-sm font-bold block">{stat.value}</span>
                  <span className="text-[10px] text-muted-foreground">{stat.label}</span>
                </div>
              ))}
            </div>

            {/* Other products by vendor */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                {isAr ? "منتجات أخرى" : "Other Products"}
              </h4>
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded-md border border-border/50 hover:bg-muted/30 cursor-pointer">
                    <div className="h-10 w-10 rounded bg-muted flex items-center justify-center shrink-0">
                      <Package className="h-4 w-4 text-muted-foreground/20" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-medium block truncate">{isAr ? "منتج مشابه" : "Similar Product"} #{i}</span>
                      <span className="text-xs text-green-600 font-bold">{Math.round(price * (0.8 + i * 0.1))} OMR</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact actions */}
            <div className="flex gap-2">
              <button type="button"
                className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
                <Send className="h-3.5 w-3.5" /> {isAr ? "طلب عرض سعر" : "Request Quote"}
              </button>
              <button type="button"
                className="flex items-center justify-center h-9 w-9 rounded-md border border-border hover:bg-muted">
                <Heart className="h-4 w-4 text-muted-foreground" />
              </button>
              <button type="button"
                className="flex items-center justify-center h-9 w-9 rounded-md border border-border hover:bg-muted">
                <Share2 className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
