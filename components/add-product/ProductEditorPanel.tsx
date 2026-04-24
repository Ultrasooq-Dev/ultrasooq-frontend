"use client";
import React, { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  Package, ImagePlus, X, FileText, DollarSign, Truck, Layers,
  Check, RotateCcw, Plus, MapPin, Tag, Palette, Clock, Users,
  Percent, Calendar, ToggleLeft, Sparkles, Loader2,
} from "lucide-react";
import http from "@/apis/http";
import dynamic from "next/dynamic";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

// AI-suggested spec templates per product category
const SPEC_TEMPLATES: Record<string, string[]> = {
  headphones: ["Driver Size", "ANC", "Bluetooth", "Battery Life", "Charging", "Weight", "Foldable", "Microphones", "Multipoint"],
  laptop: ["Processor", "RAM", "Storage", "Display", "GPU", "Battery", "Weight", "OS", "Ports", "Keyboard"],
  phone: ["Display", "Processor", "RAM", "Storage", "Camera", "Battery", "OS", "5G", "Weight", "Water Resistance"],
  monitor: ["Display Size", "Resolution", "Panel Type", "Refresh Rate", "Response Time", "Ports", "HDR", "Adjustable Stand"],
  keyboard: ["Type", "Switch", "Layout", "Connectivity", "Backlight", "Battery", "Weight", "Hot-Swappable"],
  mouse: ["Sensor", "DPI", "Buttons", "Connectivity", "Battery", "Weight", "Grip Style"],
  chair: ["Material", "Max Weight", "Adjustable Height", "Armrests", "Lumbar Support", "Recline", "Warranty"],
  cable: ["Type", "Length", "Material", "Speed", "Compatibility", "Warranty"],
  camera: ["Sensor", "Resolution", "Lens Mount", "ISO Range", "Video", "Stabilization", "Weight", "Battery"],
  tablet: ["Display", "Processor", "RAM", "Storage", "Camera", "Battery", "OS", "Stylus Support", "Weight"],
  speaker: ["Driver", "Power", "Connectivity", "Battery", "Waterproof", "Weight", "Stereo Pairing"],
  tv: ["Display Size", "Resolution", "Panel Type", "Smart TV OS", "HDR", "Refresh Rate", "Ports", "Sound"],
  printer: ["Type", "Resolution", "Speed", "Connectivity", "Paper Size", "Duplex", "Ink/Toner"],
  router: ["WiFi Standard", "Speed", "Bands", "Ports", "Coverage", "Mesh Support", "Security"],
  default: ["Material", "Dimensions", "Weight", "Color", "Warranty", "Compatibility"],
};

interface ProductEditorPanelProps {
  productName: string | null;
  selectedTemplate?: any;
  onUpdate: (data: any) => void;
  onSave?: (data: any) => void;
  locale: string;
}

export default function ProductEditorPanel({ productName, selectedTemplate, onUpdate, onSave, locale }: ProductEditorPanelProps) {
  const isAr = locale === "ar";
  const [activeTemplate, setActiveTemplate] = useState<any>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // ─── Full form state (mirrors /product page) ───
  const [form, setForm] = useState({
    // Basic
    productName: "", nickname: "", categoryId: "", categoryLocation: "",
    brandId: "", typeOfProduct: "BRAND", skuNo: "",
    keywords: "", productCondition: "NEW", productType: "P",
    // Description
    description: "", shortDescriptions: [""],
    // Pricing
    setUpPrice: true,
    productPrice: "", offerPrice: "", isOfferPriceRequired: false,
    stock: "", isStockRequired: false,
    sellType: "NORMALSELL", consumerType: "EVERYONE",
    consumerDiscount: "", consumerDiscountType: "PERCENTAGE",
    vendorDiscount: "", vendorDiscountType: "PERCENTAGE",
    minQuantity: "", maxQuantity: "",
    minQuantityPerCustomer: "1", maxQuantityPerCustomer: "",
    minCustomer: "", maxCustomer: "",
    dateOpen: "", dateClose: "", startTime: "", endTime: "",
    deliveryAfter: "3",
    isCustomProduct: false,
    // Location
    placeOfOriginId: "",
    productCountryId: "", productStateId: "", productCityId: "", productTown: "",
    // Sell locations
    sellCountryIds: "", sellStateIds: "", sellCityIds: "",
  });
  const [images, setImages] = useState<string[]>([]);
  const [specs, setSpecs] = useState<Array<[string, string]>>([]);
  const [variants, setVariants] = useState<Array<{ type: string; values: string[] }>>([]);
  const [customFields, setCustomFields] = useState<Array<{ label: string; value: string; type: string }>>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggested, setAiSuggested] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);

  // ─── AI auto-suggest: specs, keywords, tags when product name changes ───
  useEffect(() => {
    if (!productName || productName.length < 3 || aiSuggested) return;
    // Skip if template already loaded (has specs from DB)
    if (specs.length > 0) return;

    setAiLoading(true);
    const name = productName.toLowerCase();

    // Match product to spec template
    const matchedKey = Object.keys(SPEC_TEMPLATES).find((key) => name.includes(key)) ?? "default";
    const specLabels = SPEC_TEMPLATES[matchedKey] ?? SPEC_TEMPLATES.default;

    // Auto-fill spec rows (empty values — user fills in)
    setSpecs(specLabels.map((label) => [label, ""]));

    // Auto-suggest keywords
    const autoKeywords = name.split(/[\s\-,]+/).filter((w) => w.length > 2).join(", ");
    setForm((f) => ({ ...f, keywords: f.keywords || autoKeywords }));

    // Auto-suggest tags
    const autoTags = [matchedKey !== "default" ? matchedKey : "", ...name.split(/[\s\-]+/).filter((w) => w.length > 3).slice(0, 5)].filter(Boolean);
    setSuggestedTags(autoTags);

    setAiSuggested(true);
    setAiLoading(false);
  }, [productName, aiSuggested, specs.length]);

  // Reset AI suggestions when product changes
  useEffect(() => { setAiSuggested(false); }, [productName]);

  // Auto-load from P2
  useEffect(() => { if (selectedTemplate) loadTemplate(selectedTemplate); }, [selectedTemplate]);

  const loadTemplate = useCallback((p: any) => {
    setActiveTemplate(p);
    const pp = p.productPrice?.[0] ?? p.productPriceList?.[0] ?? {};
    setForm({
      productName: p.productName ?? p.productName_en ?? p.name ?? productName ?? "",
      nickname: p.nickname ?? p.displayName ?? "",
      categoryId: String(p.categoryId ?? ""), categoryLocation: p.categoryLocation ?? "",
      brandId: String(p.brandId ?? ""), typeOfProduct: p.typeOfProduct ?? "BRAND",
      skuNo: p.skuNo ?? "", keywords: p.keywords ?? "",
      productCondition: p.productCondition ?? "NEW", productType: p.productType ?? "P",
      description: p.description ?? "", shortDescriptions: p.shortDescriptions ?? [""],
      setUpPrice: true,
      productPrice: String(p.productPrice ?? p.price ?? ""),
      offerPrice: String(p.offerPrice ?? pp.offerPrice ?? ""),
      isOfferPriceRequired: !!p.isOfferPriceRequired,
      stock: String(pp.stock ?? p.stock ?? ""),
      isStockRequired: !!p.isStockRequired,
      sellType: pp.sellType ?? "NORMALSELL", consumerType: pp.consumerType ?? "EVERYONE",
      consumerDiscount: String(pp.consumerDiscount ?? ""),
      consumerDiscountType: pp.consumerDiscountType ?? "PERCENTAGE",
      vendorDiscount: String(pp.vendorDiscount ?? ""),
      vendorDiscountType: pp.vendorDiscountType ?? "PERCENTAGE",
      minQuantity: String(pp.minQuantity ?? ""), maxQuantity: String(pp.maxQuantity ?? ""),
      minQuantityPerCustomer: String(pp.minQuantityPerCustomer ?? "1"),
      maxQuantityPerCustomer: String(pp.maxQuantityPerCustomer ?? ""),
      minCustomer: String(pp.minCustomer ?? ""), maxCustomer: String(pp.maxCustomer ?? ""),
      dateOpen: pp.dateOpen ?? "", dateClose: pp.dateClose ?? "",
      startTime: pp.startTime ?? "", endTime: pp.endTime ?? "",
      deliveryAfter: String(pp.deliveryAfter ?? "3"),
      isCustomProduct: p.isCustomProduct ?? false,
      placeOfOriginId: String(p.placeOfOriginId ?? ""),
      productCountryId: String(p.productCountryId ?? ""),
      productStateId: String(p.productStateId ?? ""),
      productCityId: String(p.productCityId ?? ""),
      productTown: p.productTown ?? "",
      sellCountryIds: "", sellStateIds: "", sellCityIds: "",
    });
    setImages((p.images ?? []).map((img: any) => img.url ?? img.imageUrl ?? "").filter(Boolean));
    try {
      const parsed = typeof p.specification === "string" ? JSON.parse(p.specification) : p.specification;
      if (Array.isArray(parsed)) setSpecs(parsed.map((s: any) => [s.key ?? s[0] ?? "", s.value ?? s[1] ?? ""]));
      else setSpecs([]);
    } catch { setSpecs([]); }
    onUpdate({ ...form, templateId: p.id });
  }, [productName, onUpdate]);

  const u = (key: string, value: any) => setForm((f) => { const up = { ...f, [key]: value }; onUpdate(up); return up; });

  const handleSave = useCallback(() => {
    const errors: string[] = [];
    if (!form.productName.trim()) errors.push(isAr ? "اسم المنتج" : "Product Name");
    if (!form.brandId.trim()) errors.push(isAr ? "العلامة" : "Brand");
    if (!form.productPrice || Number(form.productPrice) <= 0) errors.push(isAr ? "السعر" : "Price");
    if (!form.stock || Number(form.stock) < 0) errors.push(isAr ? "المخزون" : "Stock");
    setValidationErrors(errors);
    if (errors.length > 0) return;
    onSave?.({ ...form, images, specs, variants, customFields, suggestedTags, templateId: activeTemplate?.id });
  }, [form, images, specs, variants, customFields, suggestedTags, activeTemplate, isAr, onSave]);

  const handleReset = useCallback(() => {
    setActiveTemplate(null);
    setValidationErrors([]);
  }, []);

  if (!productName) {
    return (
      <div className="flex flex-col h-full min-h-0 bg-background">
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-6">
          <FileText className="h-12 w-12 mb-3 opacity-10" />
          <h3 className="text-sm font-semibold mb-1">{isAr ? "محرر المنتج" : "Product Editor"}</h3>
          <p className="text-xs text-center opacity-60 max-w-[220px]">
            {isAr ? "اختر منتج من القائمة أو من نتائج البحث" : "Select a product from the list or search results"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0 bg-background">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border shrink-0">
        <FileText className="h-4 w-4 text-primary" />
        <span className="text-sm font-bold flex-1 truncate">{form.productName || productName}</span>
        {activeTemplate && <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded">#{activeTemplate.id}</span>}
      </div>

      {/* Single scrollable form — all sections */}
      <div className="flex-1 overflow-y-auto min-h-0 p-4 space-y-5">

        {/* ── 1. Basic Info ── */}
        <Sec icon={Package} label={isAr ? "معلومات أساسية" : "Basic Information"}>
          <Field label={isAr ? "اسم المنتج" : "Product Name"} value={form.productName} onChange={(v) => u("productName", v)} placeholder="e.g. Sony WH-1000XM5" />
          <Field label={isAr ? "اسم العرض (اللقب)" : "Display Name (Nickname)"} value={form.nickname} onChange={(v) => u("nickname", v)}
            placeholder={form.productName ? `${form.productName} - Wireless Noise Cancelling Headphones, 30hr Battery, LDAC` : "Product Name + key details (auto-suggested)"} />
          {/* Category — auto-assigned by AI, hidden from user */}
          <Row2>
            <Sel label={isAr ? "نوع" : "Type of Product"} value={form.typeOfProduct} onChange={(v) => u("typeOfProduct", v)} opts={[["BRAND","Brand"],["SPAREPART","Spare Part"],["OWNBRAND","Own Brand"]]} />
            <Field label={isAr ? "العلامة" : "Brand"} value={form.brandId} onChange={(v) => u("brandId", v)} placeholder="Select brand" />
          </Row2>
          <Row3>
            <Sel label={isAr ? "نوع المنتج" : "Product Type"} value={form.productType} onChange={(v) => u("productType", v)} opts={[["P","Normal"],["R","RFQ"],["F","Factory"],["D","Dropship"]]} />
            <Sel label={isAr ? "الحالة" : "Condition"} value={form.productCondition} onChange={(v) => u("productCondition", v)} opts={[["NEW","New"],["USED","Used"],["REFURBISHED","Refurbished"]]} />
            <Field label="SKU" value={form.skuNo} onChange={(v) => u("skuNo", v)} mono placeholder="Auto-generated" />
          </Row3>
          <Field label={isAr ? "كلمات مفتاحية" : "Keywords"} value={form.keywords} onChange={(v) => u("keywords", v)} placeholder="comma, separated, keywords" />
          {/* AI-suggested tags */}
          {suggestedTags.length > 0 && (
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1 mb-1">
                <Sparkles className="h-3 w-3 text-amber-500" /> {isAr ? "وسوم مقترحة" : "Suggested Tags"}
              </label>
              <div className="flex gap-1.5 flex-wrap">
                {suggestedTags.map((tag, i) => (
                  <span key={i} className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-200/50 rounded-md px-2 py-0.5 text-xs">
                    <Tag className="h-2.5 w-2.5" /> {tag}
                    <button type="button" onClick={() => setSuggestedTags(suggestedTags.filter((_, idx) => idx !== i))} className="hover:text-destructive"><X className="h-2.5 w-2.5" /></button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </Sec>

        {/* ── 2. Images ── */}
        <Sec icon={ImagePlus} label={isAr ? "صور ومقاطع فيديو" : "Images & Videos"}>
          <div className="flex gap-2 flex-wrap">
            {images.map((img, i) => (
              <div key={i} className="relative h-16 w-16 rounded-md border border-border overflow-hidden group">
                <img src={img} alt="" className="h-full w-full object-cover" />
                <button type="button" onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                  className="absolute top-0.5 end-0.5 h-4 w-4 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <X className="h-2.5 w-2.5" />
                </button>
              </div>
            ))}
            <button type="button" className="h-16 w-16 rounded-md border-2 border-dashed border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/30">
              <ImagePlus className="h-4 w-4" />
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground">{isAr ? "يقبل صور وفيديو" : "Accepts images & video files"}</p>
        </Sec>

        {/* ── 3. Description ── */}
        <Sec icon={FileText} label={isAr ? "الوصف" : "Description"}>
          <div className="space-y-2" data-color-mode="light">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">{isAr ? "أوصاف قصيرة (حد 200 حرف)" : "Short Descriptions (max 200 chars each)"}</label>
            {form.shortDescriptions.map((desc, i) => (
              <div key={i} className="relative">
                <MDEditor
                  value={desc}
                  onChange={(val) => { const up = [...form.shortDescriptions]; up[i] = (val || "").slice(0, 200); u("shortDescriptions", up); }}
                  preview="edit"
                  height={120}
                />
                <div className="flex items-center justify-between mt-1">
                  <span className={cn("text-[10px]", desc.length > 180 ? "text-destructive" : "text-muted-foreground")}>{desc.length}/200</span>
                  {form.shortDescriptions.length > 1 && (
                    <button type="button" onClick={() => u("shortDescriptions", form.shortDescriptions.filter((_, idx) => idx !== i))} className="text-[10px] text-destructive hover:underline">{isAr ? "حذف" : "Remove"}</button>
                  )}
                </div>
              </div>
            ))}
            <button type="button" onClick={() => u("shortDescriptions", [...form.shortDescriptions, ""])} className="text-xs text-primary flex items-center gap-0.5"><Plus className="h-3 w-3" /> {isAr ? "إضافة وصف قصير" : "Add short description"}</button>
          </div>
          <div data-color-mode="light">
            <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">{isAr ? "الوصف الكامل" : "Full Description"}</label>
            <MDEditor
              value={form.description}
              onChange={(val) => u("description", val || "")}
              preview="edit"
              height={300}
            />
          </div>
        </Sec>

        {/* ── 4. Specifications ── */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Layers className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{isAr ? "المواصفات" : "Specifications"}</span>
            {aiSuggested && specs.length > 0 && specs.some(([, v]) => !v) && (
              <span className="flex items-center gap-0.5 text-[9px] bg-amber-50 dark:bg-amber-950/20 text-amber-600 px-1.5 py-0.5 rounded">
                <Sparkles className="h-2.5 w-2.5" /> {isAr ? "مقترح بالذكاء" : "AI suggested"}
              </span>
            )}
            {aiLoading && <Loader2 className="h-3 w-3 animate-spin text-amber-500" />}
          </div>
          <div className="space-y-2">
          {specs.length > 0 && (
            <div className="rounded-md border border-border overflow-hidden">
              {specs.map(([key, val], i) => (
                <div key={i} className={cn("flex items-center gap-1.5 px-3 py-1.5", i % 2 === 0 ? "bg-muted/30" : "")}>
                  <input type="text" value={key} onChange={(e) => { const s = [...specs]; s[i] = [e.target.value, val]; setSpecs(s); }}
                    placeholder={isAr ? "مفتاح" : "Label"} className="w-1/3 text-sm bg-transparent border-b border-transparent hover:border-border focus:border-primary outline-none font-medium" />
                  <input type="text" value={val} onChange={(e) => { const s = [...specs]; s[i] = [key, e.target.value]; setSpecs(s); }}
                    placeholder={isAr ? "قيمة" : "Value"} className="flex-1 text-sm bg-transparent border-b border-transparent hover:border-border focus:border-primary outline-none" />
                  <button type="button" onClick={() => setSpecs(specs.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-destructive shrink-0"><X className="h-3 w-3" /></button>
                </div>
              ))}
            </div>
          )}
          <button type="button" onClick={() => setSpecs([...specs, ["", ""]])} className="text-xs text-primary flex items-center gap-0.5"><Plus className="h-3 w-3" /> {isAr ? "إضافة سطر" : "Add row"}</button>
          </div>
        </div>

        {/* ── 5. Product Variants ── */}
        <Sec icon={Palette} label={isAr ? "المتغيرات" : "Product Variants"}>
          {variants.map((v, vi) => (
            <div key={vi} className="rounded-md border border-border p-2.5 space-y-1.5">
              <div className="flex gap-1.5">
                <input type="text" value={v.type} onChange={(e) => { const vv = [...variants]; vv[vi] = { ...v, type: e.target.value }; setVariants(vv); }}
                  placeholder={isAr ? "نوع (مثل: لون، حجم)" : "Type (e.g. Color, Size)"} className="flex-1 rounded-md border px-2 py-1 text-sm bg-background outline-none focus:ring-1 focus:ring-primary" />
                <button type="button" onClick={() => setVariants(variants.filter((_, idx) => idx !== vi))} className="text-muted-foreground hover:text-destructive"><X className="h-3.5 w-3.5" /></button>
              </div>
              <div className="flex gap-1 flex-wrap">
                {v.values.map((val, vvi) => (
                  <div key={vvi} className="flex items-center gap-0.5 bg-muted rounded px-2 py-0.5">
                    <input type="text" value={val} onChange={(e) => { const vv = [...variants]; vv[vi].values[vvi] = e.target.value; setVariants(vv); }}
                      className="w-16 text-xs bg-transparent outline-none" placeholder={isAr ? "قيمة" : "Value"} />
                    <button type="button" onClick={() => { const vv = [...variants]; vv[vi].values = vv[vi].values.filter((_, idx) => idx !== vvi); setVariants(vv); }}><X className="h-2.5 w-2.5 text-muted-foreground" /></button>
                  </div>
                ))}
                <button type="button" onClick={() => { const vv = [...variants]; vv[vi].values.push(""); setVariants(vv); }}
                  className="text-[10px] text-primary flex items-center gap-0.5 px-1"><Plus className="h-2.5 w-2.5" /></button>
              </div>
            </div>
          ))}
          <button type="button" onClick={() => setVariants([...variants, { type: "", values: [""] }])} className="text-xs text-primary flex items-center gap-0.5"><Plus className="h-3 w-3" /> {isAr ? "إضافة متغير" : "Add variant"}</button>
        </Sec>

        {/* ── 6. Pricing ── */}
        <Sec icon={DollarSign} label={isAr ? "التسعير" : "Pricing"}>
          <Toggle label={isAr ? "إعداد السعر" : "Set Up Price"} checked={form.setUpPrice} onChange={(v) => u("setUpPrice", v)} />

          {form.setUpPrice && (<>
            <Row3>
              <Field label={isAr ? "السعر (OMR)" : "Price (OMR)"} value={form.productPrice} onChange={(v) => u("productPrice", v)} type="number" />
              <Field label={isAr ? "سعر العرض" : "Offer Price"} value={form.offerPrice} onChange={(v) => u("offerPrice", v)} type="number" green />
              <Field label={isAr ? "المخزون" : "Stock"} value={form.stock} onChange={(v) => u("stock", v)} type="number" />
            </Row3>
            <Row2>
              <Sel label={isAr ? "نوع البيع" : "Sell Type"} value={form.sellType} onChange={(v) => u("sellType", v)} opts={[["NORMALSELL","Normal Sell"],["BUYGROUP","Buy Group"],["WHOLESALE_PRODUCT","Wholesale"],["TRIAL_PRODUCT","Trial Product"]]} />
              <Sel label={isAr ? "نوع المستهلك" : "Consumer Type"} value={form.consumerType} onChange={(v) => u("consumerType", v)} opts={[["EVERYONE","Everyone"],["CONSUMER","Consumer Only"],["VENDORS","Vendors Only"]]} />
            </Row2>

            {/* Discounts */}
            <Row2>
              <div>
                <Field label={isAr ? "خصم المستهلك" : "Consumer Discount"} value={form.consumerDiscount} onChange={(v) => u("consumerDiscount", v)} type="number" />
                {Number(form.consumerDiscount) > 0 && (
                  <Sel label="" value={form.consumerDiscountType} onChange={(v) => u("consumerDiscountType", v)} opts={[["FLAT","Flat"],["PERCENTAGE","%"]]} />
                )}
              </div>
              <div>
                <Field label={isAr ? "خصم البائع" : "Vendor Discount"} value={form.vendorDiscount} onChange={(v) => u("vendorDiscount", v)} type="number" />
                {Number(form.vendorDiscount) > 0 && (
                  <Sel label="" value={form.vendorDiscountType} onChange={(v) => u("vendorDiscountType", v)} opts={[["FLAT","Flat"],["PERCENTAGE","%"]]} />
                )}
              </div>
            </Row2>

            {/* Quantities — counter inputs */}
            <Row2>
              <Counter label={isAr ? "أقل كمية" : "Min Quantity"} value={form.minQuantity} onChange={(v) => u("minQuantity", v)} />
              <Counter label={isAr ? "أكبر كمية" : "Max Quantity"} value={form.maxQuantity} onChange={(v) => u("maxQuantity", v)} />
            </Row2>
            <Row2>
              <Counter label={isAr ? "أقل كمية/عميل" : "Min Qty/Customer"} value={form.minQuantityPerCustomer} onChange={(v) => u("minQuantityPerCustomer", v)} />
              <Counter label={isAr ? "أكبر كمية/عميل" : "Max Qty/Customer"} value={form.maxQuantityPerCustomer} onChange={(v) => u("maxQuantityPerCustomer", v)} />
            </Row2>

            {/* Buy Group specific — counter inputs */}
            {form.sellType === "BUYGROUP" && (
              <Row2>
                <Counter label={isAr ? "أقل عملاء" : "Min Customers"} value={form.minCustomer} onChange={(v) => u("minCustomer", v)} />
                <Counter label={isAr ? "أكبر عملاء" : "Max Customers"} value={form.maxCustomer} onChange={(v) => u("maxCustomer", v)} />
              </Row2>
            )}

            {/* Date/Time windows — native pickers */}
            <Row2>
              <Field label={isAr ? "تاريخ الفتح" : "Date Open"} value={form.dateOpen} onChange={(v) => u("dateOpen", v)} type="date" />
              <Field label={isAr ? "تاريخ الإغلاق" : "Date Close"} value={form.dateClose} onChange={(v) => u("dateClose", v)} type="date" />
            </Row2>
            <Row2>
              <Field label={isAr ? "وقت الفتح" : "Time Open"} value={form.startTime} onChange={(v) => u("startTime", v)} type="time" />
              <Field label={isAr ? "وقت الإغلاق" : "Time Close"} value={form.endTime} onChange={(v) => u("endTime", v)} type="time" />
            </Row2>

            <Counter label={isAr ? "التوصيل بعد (أيام)" : "Deliver After (days)"} value={form.deliveryAfter} onChange={(v) => u("deliveryAfter", v)} min={1} />

            <Toggle label={isAr ? "منتج قابل للتخصيص" : "Customizable Product"} checked={form.isCustomProduct} onChange={(v) => u("isCustomProduct", v)} />
          </>)}
        </Sec>

        {/* ── 7. Location & Shipping ── */}
        <Sec icon={MapPin} label={isAr ? "الموقع والشحن" : "Location & Shipping"}>
          <Field label={isAr ? "بلد المنشأ" : "Place of Origin"} value={form.placeOfOriginId} onChange={(v) => u("placeOfOriginId", v)} placeholder="Country" />
          <Row3>
            <Field label={isAr ? "بلد المستودع" : "Warehouse Country"} value={form.productCountryId} onChange={(v) => u("productCountryId", v)} />
            <Field label={isAr ? "المحافظة" : "State"} value={form.productStateId} onChange={(v) => u("productStateId", v)} />
            <Field label={isAr ? "المدينة" : "City"} value={form.productCityId} onChange={(v) => u("productCityId", v)} />
          </Row3>
          <Field label={isAr ? "المنطقة" : "Town/Area"} value={form.productTown} onChange={(v) => u("productTown", v)} />
          <div className="border-t border-border pt-2 mt-2">
            <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">{isAr ? "مناطق البيع" : "Selling Regions"}</label>
            <Field label={isAr ? "بلدان البيع" : "Sell to Countries"} value={form.sellCountryIds} onChange={(v) => u("sellCountryIds", v)} placeholder="Multi-select countries" />
            <div className="mt-1.5" />
            <Field label={isAr ? "محافظات البيع" : "Sell to States"} value={form.sellStateIds} onChange={(v) => u("sellStateIds", v)} placeholder="Multi-select states" />
            <div className="mt-1.5" />
            <Field label={isAr ? "مدن البيع" : "Sell to Cities"} value={form.sellCityIds} onChange={(v) => u("sellCityIds", v)} placeholder="Multi-select cities" />
          </div>
        </Sec>

        {/* ── 8. Custom Fields ── */}
        <Sec icon={Tag} label={isAr ? "حقول مخصصة" : "Custom Fields"}>
          {customFields.map((cf, i) => (
            <div key={i} className="flex gap-1.5">
              <input type="text" value={cf.label} onChange={(e) => { const c = [...customFields]; c[i] = { ...cf, label: e.target.value }; setCustomFields(c); }}
                placeholder={isAr ? "اسم الحقل" : "Field name"} className="w-1/3 rounded-md border px-2 py-1.5 text-sm bg-background outline-none focus:ring-1 focus:ring-primary" />
              <input type="text" value={cf.value} onChange={(e) => { const c = [...customFields]; c[i] = { ...cf, value: e.target.value }; setCustomFields(c); }}
                placeholder={isAr ? "القيمة" : "Value"} className="flex-1 rounded-md border px-2 py-1.5 text-sm bg-background outline-none focus:ring-1 focus:ring-primary" />
              <button type="button" onClick={() => setCustomFields(customFields.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-destructive"><X className="h-3.5 w-3.5" /></button>
            </div>
          ))}
          <button type="button" onClick={() => setCustomFields([...customFields, { label: "", value: "", type: "text" }])} className="text-xs text-primary flex items-center gap-0.5"><Plus className="h-3 w-3" /> {isAr ? "إضافة حقل" : "Add field"}</button>
        </Sec>
      </div>

      {/* Footer */}
      <div className="border-t border-border shrink-0">
        {validationErrors.length > 0 && (
          <div className="px-4 py-2 bg-destructive/10 border-b border-destructive/20 text-xs text-destructive">
            {isAr ? "حقول مطلوبة: " : "Required: "}{validationErrors.join("، ")}
          </div>
        )}
        <div className="px-4 py-3 flex gap-2">
          <button type="button" onClick={handleSave} className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-md bg-green-600 text-white text-sm font-medium hover:bg-green-700">
            <Check className="h-4 w-4" /> {isAr ? "حفظ المنتج" : "Save Product"}
          </button>
          <button type="button" onClick={handleReset}
            className="flex items-center justify-center gap-1 h-9 px-4 rounded-md border border-border text-sm text-muted-foreground hover:bg-muted">
            <RotateCcw className="h-3.5 w-3.5" /> {isAr ? "إعادة" : "Reset"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Reusable field components (matching /product form UX) ─────

function Sec({ icon: Icon, label, children }: { icon: any; label: string; children: React.ReactNode }) {
  return (<div><div className="flex items-center gap-1.5 mb-2"><Icon className="h-3.5 w-3.5 text-primary" /><span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</span></div><div className="space-y-2">{children}</div></div>);
}
function Row2({ children }: { children: React.ReactNode }) { return <div className="grid grid-cols-2 gap-3">{children}</div>; }
function Row3({ children }: { children: React.ReactNode }) { return <div className="grid grid-cols-3 gap-3">{children}</div>; }

// Text/number input
function Field({ label, value, onChange, type = "text", placeholder, dir, mono, green }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; dir?: string; mono?: boolean; green?: boolean;
}) {
  return (<div>
    {label && <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">{label}</label>}
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} dir={dir} placeholder={placeholder}
      className={cn("w-full rounded-md border px-3 py-1.5 text-sm bg-background outline-none focus:ring-1 focus:ring-primary", mono && "font-mono", green && "text-green-600 font-bold")} />
  </div>);
}

// Select dropdown (matches ReactSelect style)
function Sel({ label, value, onChange, opts }: { label: string; value: string; onChange: (v: string) => void; opts: [string, string][] }) {
  return (<div>
    {label && <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">{label}</label>}
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-md border px-3 py-1.5 text-sm bg-background outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer">
      {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  </div>);
}

// Counter input (matches CounterTextInputField — number with +/- buttons)
function Counter({ label, value, onChange, min = 0, max = 99999, disabled }: {
  label: string; value: string; onChange: (v: string) => void; min?: number; max?: number; disabled?: boolean;
}) {
  const num = Number(value) || 0;
  return (<div>
    {label && <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">{label}</label>}
    <div className="flex items-center border border-border rounded-md">
      <button type="button" disabled={disabled || num <= min} onClick={() => onChange(String(Math.max(min, num - 1)))}
        className="flex h-8 w-8 items-center justify-center text-sm hover:bg-muted disabled:opacity-30 shrink-0 border-e border-border">−</button>
      <input type="number" value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)}
        className="flex-1 h-8 text-center text-sm bg-background outline-none disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
      <button type="button" disabled={disabled || num >= max} onClick={() => onChange(String(Math.min(max, num + 1)))}
        className="flex h-8 w-8 items-center justify-center text-sm hover:bg-muted disabled:opacity-30 shrink-0 border-s border-border">+</button>
    </div>
  </div>);
}

// Switch toggle (matches shadcn Switch)
function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
        className={cn("relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0",
          checked ? "bg-primary" : "bg-muted-foreground/20")}>
        <span className={cn("inline-block h-4 w-4 rounded-full bg-white transition-transform shadow-sm",
          checked ? "translate-x-4" : "translate-x-0.5")} />
      </button>
      <span className="text-sm">{label}</span>
    </label>
  );
}
