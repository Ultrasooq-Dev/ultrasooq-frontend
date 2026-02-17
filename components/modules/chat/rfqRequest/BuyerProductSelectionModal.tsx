"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import PlaceholderImage from "@/public/images/product-placeholder.png";
import validator from "validator";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";

interface BuyerProductSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProducts: (suggestionIds: number[]) => void;
  suggestedProducts: Array<{
    id: number;
    suggestedProductId: number;
    suggestedProduct: any;
    offerPrice?: number;
    quantity?: number;
    isSelectedByBuyer?: boolean;
  }>;
  rfqQuoteProductId: number;
  rfqQuotesUserId: number;
}

const BuyerProductSelectionModal: React.FC<BuyerProductSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectProducts,
  suggestedProducts,
  rfqQuoteProductId,
  rfqQuotesUserId,
}) => {
  const t = useTranslations();
  const { currency, langDir } = useAuth();
  const [selectedSuggestionIds, setSelectedSuggestionIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (isOpen) {
      // Pre-select already selected products
      const preSelected = new Set<number>();
      suggestedProducts.forEach((s) => {
        if (s.isSelectedByBuyer) {
          preSelected.add(s.id);
        }
      });
      setSelectedSuggestionIds(preSelected);
    } else {
      // Reset when modal closes
      setSelectedSuggestionIds(new Set());
    }
  }, [isOpen, suggestedProducts]);

  const handleToggleSelection = (suggestionId: number) => {
    setSelectedSuggestionIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(suggestionId)) {
        newSet.delete(suggestionId);
      } else {
        newSet.add(suggestionId);
      }
      return newSet;
    });
  };

  const handleSubmit = () => {
    const selectedIds = Array.from(selectedSuggestionIds);
    onSelectProducts(selectedIds);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {"Choose Alternative Products"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {suggestedProducts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {t("no_suggested_products") || "No suggested products available"}
            </div>
          ) : (
            <div className="space-y-3">
              {suggestedProducts.map((s) => {
                const p = s.suggestedProduct;
                const imageUrl =
                  p?.product_productPrice?.[0]
                    ?.productPrice_productSellerImage?.[0]
                    ?.image ||
                  p?.productImages?.[0]?.image ||
                  PlaceholderImage;
                const unitPrice =
                  s.offerPrice ||
                  p?.product_productPrice?.[0]?.offerPrice ||
                  p?.product_productPrice?.[0]?.productPrice ||
                  0;
                const quantity = s.quantity || 1;
                const totalPrice = parseFloat(unitPrice.toString()) * quantity;
                const isSelected = selectedSuggestionIds.has(s.id);

                return (
                  <div
                    key={s.id}
                    className={`border rounded-lg p-3 cursor-pointer transition-all ${
                      isSelected
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => handleToggleSelection(s.id)}
                  >
                    <div className="flex items-center gap-3">
                      {/* Checkbox */}
                      <div className="flex-shrink-0">
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            isSelected
                              ? "bg-blue-500 border-blue-500"
                              : "border-gray-300"
                          }`}
                        >
                          {isSelected && (
                            <svg
                              className="w-3 h-3 text-white"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </div>
                      </div>

                      {/* Product Image */}
                      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded border border-gray-200 bg-white">
                        <Image
                          src={
                            imageUrl && validator.isURL(imageUrl)
                              ? imageUrl
                              : PlaceholderImage
                          }
                          alt={p?.productName || "Product"}
                          fill
                          className="object-cover"
                        />
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {p?.productName || "-"}
                        </h3>
                        {quantity > 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            {t("quantity") || "Qty"}: {quantity}
                          </p>
                        )}
                      </div>

                      {/* Price */}
                      <div className="flex-shrink-0 text-right">
                        <p className="text-sm font-semibold text-gray-900">
                          {currency.symbol}
                          {totalPrice.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            {t("cancel") || "Cancel"}
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
          >
            {t("confirm") || "Confirm Selection"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BuyerProductSelectionModal;
