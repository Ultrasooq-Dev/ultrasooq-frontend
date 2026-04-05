"use client";
import React, { useState, useCallback, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import ProductListPanel, { type ProductDraft, type ProductKind } from "@/components/add-product/ProductListPanel";
import ProductBrowsePanel from "@/components/add-product/ProductBrowsePanel";
import ProductEditorPanel from "@/components/add-product/ProductEditorPanel";
import PartCatalogPanel from "@/components/add-product/PartCatalogPanel";
import CarDiagramPanel, { type CarZone, ZONES as CAR_ZONES } from "@/components/add-product/CarDiagramPanel";
import SelectedPartsPanel, { type SelectedPart } from "@/components/add-product/SelectedPartsPanel";

export default function AddProductPage() {
  const { user, langDir } = useAuth();
  const locale = langDir === "rtl" ? "ar" : "en";

  // P1: product list
  const [items, setItems] = useState<ProductDraft[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // P2 (regular): browse
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // P4: catalog tree
  const [selectedVehicle, setSelectedVehicle] = useState<{ make: string; model: string; year: string } | null>(null);

  // P5: car diagram parts
  const [diagramParts, setDiagramParts] = useState<Set<string>>(new Set());

  // P2 (spare): selected parts list
  const [selectedParts, setSelectedParts] = useState<SelectedPart[]>([]);
  const [selectedPartForEdit, setSelectedPartForEdit] = useState<string | null>(null);

  // Show P2 selected parts panel (spare part mode)
  const [showSelectedParts, setShowSelectedParts] = useState(false);

  // Track the active kind from P1 toggle (not just from selected item)
  const [activeKind, setActiveKind] = useState<ProductKind>("product");

  const selectedItem = items.find((i) => i.id === selectedId);
  // Spare part mode: either from selected item's kind OR from the toggle when no item selected
  const isSparePart = selectedItem ? selectedItem.kind === "sparepart" : activeKind === "sparepart";
  const hasSelectedParts = selectedParts.length > 0;

  // ─── P1 handlers ───
  const handleAdd = useCallback((names: string[], kind: ProductKind) => {
    const newItems: ProductDraft[] = names.map((name) => ({
      id: `prod-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name, kind, status: "draft" as const,
    }));
    setItems((prev) => [...prev, ...newItems]);
    if (newItems.length > 0) setSelectedId(newItems[0].id);
    setSelectedProductId(null); setSelectedProduct(null);
  }, []);

  const handleRemove = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    if (selectedId === id) { setSelectedId(null); setSelectedProductId(null); setSelectedProduct(null); }
  }, [selectedId]);

  const handleStatusChange = useCallback((id: string, status: ProductDraft["status"]) => {
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, status } : i));
  }, []);

  const handleSelectItem = useCallback((id: string) => {
    setSelectedId(id); setSelectedProductId(null); setSelectedProduct(null);
  }, []);

  // ─── P2 (regular) handlers ───
  const handleSelectProduct = useCallback((product: any) => {
    setSelectedProductId(product.id); setSelectedProduct(product);
    if (selectedId) {
      setItems((prev) => prev.map((i) => i.id === selectedId ? { ...i, status: "editing", templateId: product.id } : i));
    }
  }, [selectedId]);

  const handleEditorUpdate = useCallback((data: any) => {
    if (selectedId) setItems((prev) => prev.map((i) => i.id === selectedId ? { ...i, status: "editing" } : i));
  }, [selectedId]);

  // ─── P4: catalog part select → add to selected parts ───
  const handleSelectPart = useCallback((part: any) => {
    setSelectedParts((prev) => {
      if (prev.some((p) => p.id === part.id)) return prev;
      return [...prev, { id: part.id, name: part.name, brand: part.brand, price: part.price, oem: part.oem }];
    });
    setShowSelectedParts(true);
    // Also set as template for P3
    setSelectedProduct({
      id: part.id, productName: part.name, productName_en: part.name,
      skuNo: part.partNumber, offerPrice: part.price,
      brand: { name: part.brand }, typeOfProduct: "SPAREPART",
      productCondition: part.condition ?? "NEW", raw: part,
    });
  }, []);

  // P5 handlers are inline in JSX now (simpler)

  // ─── P2 (spare): selected parts handlers ───
  const handleRemoveSelectedPart = useCallback((id: string) => {
    setSelectedParts((prev) => prev.filter((p) => p.id !== id));
    setDiagramParts((prev) => { const n = new Set(prev); n.delete(id); return n; });
  }, []);

  const handleToggleDamaged = useCallback((id: string) => {
    setSelectedParts((prev) => prev.map((p) => p.id === id ? { ...p, damaged: !p.damaged } : p));
  }, []);

  const handleRemoveAllDamaged = useCallback(() => {
    const damagedIds = selectedParts.filter((p) => p.damaged).map((p) => p.id);
    setSelectedParts((prev) => prev.filter((p) => !p.damaged));
    setDiagramParts((prev) => { const n = new Set(prev); damagedIds.forEach((id) => n.delete(id)); return n; });
  }, [selectedParts]);

  const handleMarkAllReady = useCallback(() => {
    // Add all good parts to P1 product list
    const good = selectedParts.filter((p) => !p.damaged);
    const newItems: ProductDraft[] = good.map((p) => ({
      id: `part-${p.id}`, name: p.name, kind: "sparepart" as const, status: "ready" as const,
    }));
    setItems((prev) => [...prev, ...newItems.filter((n) => !prev.some((e) => e.name === n.name))]);
  }, [selectedParts]);

  if (!user) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />
      </div>
    );
  }

  // ─── Layout: dynamic grid based on mode + state ───
  const getGridCols = () => {
    if (!isSparePart) return "240px 300px 1fr"; // P1 + P2browse + P3
    if (showSelectedParts && selectedPartForEdit) return "200px 240px 240px 1fr"; // P1 + P4 + P2sel + P3
    if (showSelectedParts) return "200px 280px 1fr 320px"; // P1 + P4 + P2sel + P5
    return "240px 1fr 1fr"; // P1 + P4 + P5
  };

  return (
    <div
      className="h-[calc(100vh-64px)] overflow-hidden border-t border-border"
      style={{ display: "grid", gridTemplateColumns: getGridCols(), gridTemplateRows: "1fr" }}
    >
      {/* P1: Product name list — always visible */}
      <div className="min-h-0 min-w-0">
        <ProductListPanel
          items={items} selectedId={selectedId}
          onSelect={handleSelectItem} onAdd={handleAdd} onRemove={handleRemove}
          onClearAll={() => { setItems([]); setSelectedId(null); setSelectedProductId(null); setSelectedProduct(null); setSelectedParts([]); setDiagramParts(new Set()); setShowSelectedParts(false); }}
          onKindChange={(kind) => setActiveKind(kind)}
          onStatusChange={handleStatusChange} locale={locale}
        />
      </div>

      {isSparePart ? (
        <>
          {/* P4: Part Catalog tree — always visible in spare part mode */}
          <div className="min-h-0 min-w-0 border-s border-border">
            <PartCatalogPanel
              onSelectVehicle={(make, model, year) => setSelectedVehicle({ make, model, year })}
              onSelectPart={handleSelectPart}
              selectedVehicle={selectedVehicle}
              locale={locale}
            />
          </div>

          {/* P2 (selected parts) — shows when parts are selected */}
          {showSelectedParts && (
            <div className="min-h-0 min-w-0">
              <SelectedPartsPanel
                parts={selectedParts}
                selectedPartId={selectedPartForEdit}
                onSelectPart={(id) => {
                  setSelectedPartForEdit(id);
                  const part = selectedParts.find((p) => p.id === id);
                  if (part) {
                    setSelectedProduct({
                      id: part.id, productName: part.name, productName_en: part.name,
                      offerPrice: part.price, brand: { name: part.brand },
                      typeOfProduct: "SPAREPART", raw: part,
                    });
                  }
                }}
                onRemovePart={handleRemoveSelectedPart}
                onToggleDamaged={handleToggleDamaged}
                onRemoveAllDamaged={handleRemoveAllDamaged}
                onMarkAllReady={handleMarkAllReady}
                locale={locale}
              />
            </div>
          )}

          {/* P5 (car diagram) OR P3 (editor) — rightmost panel */}
          {selectedPartForEdit ? (
            <div className="min-h-0 min-w-0 border-s border-border">
              <ProductEditorPanel
                productName={selectedParts.find((p) => p.id === selectedPartForEdit)?.name ?? null}
                selectedTemplate={selectedProduct?.raw ?? selectedProduct}
                onUpdate={handleEditorUpdate}
                locale={locale}
              />
            </div>
          ) : (
            <div className="min-h-0 min-w-0">
              <CarDiagramPanel
                checkedParts={diagramParts}
                onTogglePart={(partId) => {
                  setDiagramParts((prev) => { const n = new Set(prev); if (n.has(partId)) n.delete(partId); else n.add(partId); return n; });
                  // Sync to selected parts
                  const allParts = CAR_ZONES.flatMap((z) => z.parts.map((p) => ({ ...p, zone: z.label })));
                  const part = allParts.find((p) => p.id === partId);
                  if (part) {
                    setSelectedParts((prev) => {
                      if (prev.some((p) => p.id === partId)) return prev.filter((p) => p.id !== partId);
                      return [...prev, { id: partId, name: part.name, price: part.price, zone: part.zone }];
                    });
                    setShowSelectedParts(true);
                  }
                }}
                onSelectAllZone={(zone) => {
                  const zoneData = CAR_ZONES.find((z) => z.id === zone);
                  if (!zoneData) return;
                  const ids = zoneData.parts.map((p) => p.id);
                  setDiagramParts((prev) => { const n = new Set(prev); ids.forEach((id) => n.add(id)); return n; });
                  setSelectedParts((prev) => {
                    const existing = new Set(prev.map((p) => p.id));
                    const newParts = zoneData.parts.filter((p) => !existing.has(p.id)).map((p) => ({ id: p.id, name: p.name, price: p.price, zone: zoneData.label }));
                    return [...prev, ...newParts];
                  });
                  setShowSelectedParts(true);
                }}
                onDeselectAllZone={(zone) => {
                  const zoneData = CAR_ZONES.find((z) => z.id === zone);
                  if (!zoneData) return;
                  const ids = new Set(zoneData.parts.map((p) => p.id));
                  setDiagramParts((prev) => { const n = new Set(prev); ids.forEach((id) => n.delete(id)); return n; });
                  setSelectedParts((prev) => prev.filter((p) => !ids.has(p.id)));
                }}
                onBulkAdd={(parts) => {
                  const newItems: ProductDraft[] = parts.map((p) => ({
                    id: `part-${p.id}`, name: p.name, kind: "sparepart" as const, status: "ready" as const,
                  }));
                  setItems((prev) => [...prev, ...newItems.filter((n) => !prev.some((e) => e.name === n.name))]);
                }}
                highlightPartId={selectedPartForEdit}
                locale={locale}
              />
            </div>
          )}
        </>
      ) : (
        <>
          {/* P2: Browse existing products — regular mode */}
          <div className="min-h-0 min-w-0 border-s border-border">
            <ProductBrowsePanel
              searchTerm={selectedItem?.name ?? null}
              selectedId={selectedProductId}
              onSelect={handleSelectProduct}
              onCreateManual={() => { setSelectedProductId(-1); setSelectedProduct(null); }}
              locale={locale}
            />
          </div>

          {/* P3: Product editor */}
          <div className="min-h-0 min-w-0 border-s border-border">
            <ProductEditorPanel
              productName={selectedItem?.name ?? null}
              selectedTemplate={selectedProduct?.raw ?? selectedProduct}
              onUpdate={handleEditorUpdate}
              locale={locale}
            />
          </div>
        </>
      )}
    </div>
  );
}
