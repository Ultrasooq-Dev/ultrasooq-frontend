"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getVendorProductsForSuggestion } from "@/apis/requests/chat.requests";
import Image from "next/image";
import PlaceholderImage from "@/public/images/product-placeholder.png";
import validator from "validator";
import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";

interface ProductSuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProducts: (products: Array<{ 
    suggestedProductId: number; 
    offerPrice?: number; 
    quantity?: number;
    productDetails?: any; // Full product object for display
  }>) => void;
  rfqQuoteProductId: number;
  vendorId: number;
  defaultQuantity?: number;
  defaultOfferPrice?: number;
  mainProduct?: {
    id: number;
    name: string;
    image?: string;
    quantity: number;
    offerPrice?: number;
  };
  /** Existing suggestions for this RFQ product. These will be pre-checked with their current values. */
  existingSuggestions?: Array<{
    suggestedProductId: number;
    offerPrice?: number;
    quantity?: number;
  }>;
}

const ProductSuggestionModal: React.FC<ProductSuggestionModalProps> = ({
  isOpen,
  onClose,
  onSelectProducts,
  rfqQuoteProductId,
  vendorId,
  defaultQuantity = 1,
  defaultOfferPrice,
  mainProduct,
  existingSuggestions = [],
}) => {
  const t = useTranslations();
  const { currency, langDir } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Map<number, { offerPrice?: number; quantity: number }>>(new Map());
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    if (isOpen && vendorId) {
      // Pre-populate selectedProducts with existing suggestions
      if (existingSuggestions.length > 0) {
        const preSelected = new Map<number, { offerPrice?: number; quantity: number }>();
        existingSuggestions.forEach((suggestion) => {
          preSelected.set(suggestion.suggestedProductId, {
            offerPrice: suggestion.offerPrice,
            quantity: suggestion.quantity || defaultQuantity,
          });
        });
        setSelectedProducts(preSelected);
      }
      loadProducts();
    } else {
      // Reset when modal closes
      setSearchTerm("");
      setPage(1);
      setSelectedProducts(new Map());
      setProducts([]);
    }
  }, [isOpen, vendorId, existingSuggestions, defaultQuantity]);

  useEffect(() => {
    if (isOpen && vendorId) {
      // Debounce search
      const timeoutId = setTimeout(() => {
        setPage(1);
        loadProducts(true);
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [searchTerm]);

  const loadProducts = async (resetProducts = false) => {
    if (!vendorId) return;
    
    setLoading(true);
    try {
      const response = await getVendorProductsForSuggestion({
        vendorId,
        page: resetProducts ? 1 : page,
        limit: 20,
        term: searchTerm || undefined,
      });
      if (response.data?.status === 200) {
        let newProducts = response.data.data || [];
        // Don't filter out products - show all products, including already-suggested ones
        if (resetProducts) {
          setProducts(newProducts);
        } else {
          // Filter out duplicates based on product.id when appending
          setProducts((prev) => {
            const existingIds = new Set(prev.map(p => p.id));
            const uniqueNewProducts = newProducts.filter(p => !existingIds.has(p.id));
            return [...prev, ...uniqueNewProducts];
          });
        }
        setTotalCount(response.data.totalCount || 0);
        setHasMore(newProducts.length === 20);
        if (!resetProducts) {
          setPage((prev) => prev + 1);
        }
      }
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      loadProducts();
    }
  };

  const toggleProductSelection = (productId: number, defaultPrice?: number) => {
    const newSelection = new Map(selectedProducts);
    if (newSelection.has(productId)) {
      newSelection.delete(productId);
    } else {
      newSelection.set(productId, {
        offerPrice: defaultPrice || defaultOfferPrice,
        quantity: defaultQuantity,
      });
    }
    setSelectedProducts(newSelection);
  };

  const updateProductPrice = (productId: number, price: string) => {
    const newSelection = new Map(selectedProducts);
    const current = newSelection.get(productId);
    if (current) {
      newSelection.set(productId, { ...current, offerPrice: parseFloat(price) || undefined });
      setSelectedProducts(newSelection);
    }
  };

  const updateProductQuantity = (productId: number, quantity: string) => {
    const newSelection = new Map(selectedProducts);
    const current = newSelection.get(productId);
    if (current) {
      newSelection.set(productId, { ...current, quantity: parseInt(quantity) || 1 });
      setSelectedProducts(newSelection);
    }
  };

  const handleSubmit = () => {
    const selectedArray = Array.from(selectedProducts.entries()).map(
      ([suggestedProductId, data]) => {
        // Find the product object from the products list
        const product = products.find((p) => p.id === suggestedProductId);
        return {
          suggestedProductId,
          offerPrice: data.offerPrice,
          quantity: data.quantity,
          productDetails: product, // Include full product object
        };
      },
    );

    // Avoid sending duplicates: if a product was already suggested before
    // and neither its price nor quantity changed, we don't send it again.
    const existingById = new Map(
      (existingSuggestions || []).map((s) => [
        s.suggestedProductId,
        { offerPrice: s.offerPrice, quantity: s.quantity },
      ]),
    );

    const filteredToSend = selectedArray.filter((item) => {
      const existing = existingById.get(item.suggestedProductId);
      if (!existing) return true; // new suggestion

      const existingQty = existing.quantity ?? defaultQuantity;
      const newQty = item.quantity ?? defaultQuantity;
      const existingPrice = existing.offerPrice ?? undefined;
      const newPrice = item.offerPrice ?? undefined;

      return existingQty !== newQty || existingPrice !== newPrice;
    });

    // Handle de-selections: any existing suggestion that is NOT in selectedProducts
    // will be sent once with quantity 0 so the latest state means "removed".
    const deselected = (existingSuggestions || [])
      .filter((s) => !selectedProducts.has(s.suggestedProductId))
      .map((s) => {
        // Try to find product details for deselected items too
        const product = products.find((p) => p.id === s.suggestedProductId);
        return {
          suggestedProductId: s.suggestedProductId,
          quantity: 0,
          productDetails: product,
        };
      });

    const toSend = [...filteredToSend, ...deselected];

    if (toSend.length === 0) {
      return;
    }

    onSelectProducts(toSend);
    setSelectedProducts(new Map());
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      <div className="bg-card rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between flex-shrink-0">
          <h2 className="text-base font-semibold">{t("suggest_alternative_products") || "Suggest Alternative Products"}</h2>
          <button 
            onClick={onClose} 
            className="text-muted-foreground hover:text-muted-foreground p-1 rounded hover:bg-muted"
            type="button"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Main requested product preview */}
        {mainProduct && (
          <div className="flex items-center gap-3 border-b border-border bg-muted px-4 py-3 flex-shrink-0">
            <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded border border-border bg-card">
              <Image
                src={mainProduct.image || PlaceholderImage}
                alt={mainProduct.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                {mainProduct.name}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Requested qty: {mainProduct.quantity}
                {mainProduct.offerPrice
                  ? ` • ${currency.symbol}${mainProduct.offerPrice}`
                  : ""}
              </p>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="p-3 border-b border-border flex-shrink-0">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            dir={langDir}
          />
        </div>

        {/* Products List */}
        <div className="flex-1 overflow-y-auto p-4 min-h-0">
          {loading && products.length === 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-lg" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <svg className="h-12 w-12 mb-3 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-sm">{t("no_products_found") || "No products found"}</p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {products.map((product, index) => {
                  const isSelected = selectedProducts.has(product.id);
                  const selectionData = selectedProducts.get(product.id);
                  const productPrice = product.product_productPrice?.[0];
                  const productPriceId = productPrice?.id;
                  const defaultPrice =
                    productPrice?.offerPrice || productPrice?.productPrice || 0;
                  const imageUrl =
                    productPrice?.productPrice_productSellerImage?.[0]?.image ||
                    product.productImages?.[0]?.image ||
                    PlaceholderImage;

                  const uniqueKey = `${product.id}-${productPriceId || index}`;

                  return (
                    <div
                      key={uniqueKey}
                      className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border bg-card hover:border-border"
                      }`}
                      onClick={() => toggleProductSelection(product.id, defaultPrice)}
                    >
                      {/* Left side: checkbox + image + name */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`flex h-4 w-4 items-center justify-center rounded border text-[10px] ${
                            isSelected
                              ? "border-primary bg-primary text-white"
                              : "border-border bg-card text-transparent"
                          }`}
                        >
                          ✓
                        </div>
                        <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded border border-border bg-muted">
                          <Image
                            src={imageUrl && validator.isURL(imageUrl) ? imageUrl : PlaceholderImage}
                            alt={product.productName || "Product"}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-foreground">
                            {product.productName}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {currency.symbol}
                            {defaultPrice}
                          </p>
                        </div>
                      </div>

                      {/* Right side: price / qty editors (no extra Add button) */}
                      <div
                        className="flex items-center gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {isSelected && (
                          <>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[9px] text-muted-foreground">
                                {t("price") || "Price"}
                              </span>
                              <input
                                type="number"
                                placeholder="Price"
                                value={selectionData?.offerPrice ?? defaultPrice ?? ""}
                                onChange={(e) =>
                                  updateProductPrice(product.id, e.target.value)
                                }
                                className="w-24 rounded border border-border px-2 py-1 text-[10px] focus:outline-none focus:ring-1 focus:ring-primary"
                                step="0.01"
                                min="0"
                              />
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[9px] text-muted-foreground">
                                {t("quantity") || "Qty"}
                              </span>
                              <input
                                type="number"
                                placeholder={t("enter_quantity") || "Quantity"}
                                value={selectionData?.quantity ?? defaultQuantity}
                                onChange={(e) =>
                                  updateProductQuantity(product.id, e.target.value)
                                }
                                className="w-16 rounded border border-border px-2 py-1 text-[10px] focus:outline-none focus:ring-1 focus:ring-primary"
                                min="1"
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {hasMore && (
                <div className="mt-4 text-center">
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    className="px-4 py-2 text-xs border border-border rounded-lg hover:bg-muted disabled:opacity-50"
                    type="button"
                  >
                    {loading ? (t("loading") || "Loading...") : "Load More"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-border flex items-center justify-between flex-shrink-0">
          <span className="text-xs text-muted-foreground">
            {selectedProducts.size} {t("products_selected") || "products selected"} • {totalCount} {t("total") || "total"}
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-muted transition-colors"
              type="button"
            >
              {t("cancel") || "Cancel"}
            </button>
            <button
              onClick={handleSubmit}
              disabled={selectedProducts.size === 0}
              className="px-3 py-1.5 text-xs bg-primary text-white rounded-lg hover:bg-primary/90 disabled:bg-muted disabled:cursor-not-allowed transition-colors"
              type="button"
            >
              {t("suggest_products") || "Suggest Products"} ({selectedProducts.size})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductSuggestionModal;

