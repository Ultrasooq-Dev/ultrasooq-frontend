"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { X, CheckCircle2 } from "lucide-react";
import { PreviewData } from "./addFromExistingTypes";

interface AIPreviewModalProps {
  previewData: PreviewData;
  onClose: () => void;
  onUse: () => void;
}

export const AIPreviewModal: React.FC<AIPreviewModalProps> = ({
  previewData,
  onClose,
  onUse,
}) => {
  const t = useTranslations();
  const { langDir } = useAuth();

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3 className="text-xl font-semibold text-foreground" dir={langDir}>
            {t("review_product_data") || "Review Product Data"}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-2 hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                {t("suggested_product_name") || "Suggested Product Name"}
              </label>
              <p className="text-foreground mt-1">
                {previewData.productName ||
                  previewData.name ||
                  t("not_specified")}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                {t("approx_price_use_your_own") ||
                  "Approx price(use your own price)"}
              </label>
              <p className="text-foreground mt-1">
                {previewData.price ||
                  previewData.estimatedPrice ||
                  t("not_specified")}
              </p>
            </div>

            {previewData.description && (
              <div className="col-span-2">
                <label className="text-sm font-medium text-muted-foreground">
                  {t("description")}
                </label>
                <p className="text-foreground mt-1">{previewData.description}</p>
              </div>
            )}

            {previewData.category && (
              <div className="col-span-2">
                <label className="text-sm font-medium text-muted-foreground">
                  {t("category")}
                </label>
                <div className="mt-1">
                  <p className="text-foreground">{previewData.category}</p>
                  {previewData.matchedCategoryId ? (
                    <p
                      className={`text-xs mt-1 flex items-center gap-1 ${
                        previewData.categoryConfidence === "high"
                          ? "text-success"
                          : previewData.categoryConfidence === "medium"
                          ? "text-primary"
                          : "text-warning"
                      }`}
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      {previewData.categoryConfidence === "high"
                        ? t("category_matched") ||
                          "Category matched - will be auto-selected"
                        : previewData.categoryConfidence === "medium"
                        ? t("category_suggested") ||
                          "Category suggested - please verify"
                        : t("category_low_confidence") ||
                          "Category match uncertain - please verify"}
                    </p>
                  ) : (
                    <p className="text-xs text-warning mt-1 flex items-center gap-1">
                      <X className="h-3 w-3" />
                      {t("category_not_matched") ||
                        "Category not found - please select manually"}
                    </p>
                  )}
                </div>
              </div>
            )}

            {previewData.brand && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  {t("brand")}
                </label>
                <p className="text-foreground mt-1">{previewData.brand}</p>
              </div>
            )}

            {previewData.shortDescription && (
              <div className="col-span-2">
                <label className="text-sm font-medium text-muted-foreground">
                  {t("short_description")}
                </label>
                <p className="text-foreground mt-1">
                  {previewData.shortDescription}
                </p>
              </div>
            )}

            {previewData.specifications &&
              Array.isArray(previewData.specifications) &&
              previewData.specifications.length > 0 && (
                <div className="col-span-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    {t("specifications")}
                  </label>
                  <div className="mt-1 space-y-2">
                    {previewData.specifications.map((spec, idx) => (
                      <div key={idx} className="flex gap-2 text-sm">
                        <span className="font-medium text-muted-foreground">
                          {spec.label}:
                        </span>
                        <span className="text-foreground">
                          {spec.specification}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {previewData.modelExists !== null && (
              <div
                className={`col-span-2 p-3 rounded-lg ${
                  previewData.modelExists
                    ? "bg-warning/5 border border-warning/20"
                    : "bg-success/5 border border-success/20"
                }`}
              >
                <p
                  className={`text-sm font-medium ${
                    previewData.modelExists ? "text-warning" : "text-success"
                  }`}
                >
                  {previewData.modelExists
                    ? t("model_exists_in_system") ||
                      "⚠️ This model already exists in your product catalog"
                    : t("model_new") || "✅ This is a new model"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button
            onClick={onUse}
            className="bg-info hover:bg-info/90 text-white"
          >
            {t("use_this_data") || "Use This Data"}
          </Button>
        </div>
      </div>
    </div>
  );
};
