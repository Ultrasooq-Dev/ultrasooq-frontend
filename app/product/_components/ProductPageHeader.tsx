"use client";
import React from "react";
import { useTranslations } from "next-intl";

interface ProductPageHeaderProps {
  activeTab: "create" | "dropship";
  onTabChange: (tab: "create" | "dropship") => void;
  showTabs: boolean;
}

const ProductPageHeader: React.FC<ProductPageHeaderProps> = ({
  activeTab,
  onTabChange,
  showTabs,
}) => {
  const t = useTranslations();

  if (!showTabs) return null;

  return (
    <div className="mb-8 text-center">
      <div className="inline-flex rounded-xl border border-border bg-card p-1 shadow-sm">
        <button
          type="button"
          className={`rounded-lg px-6 py-3 text-sm font-medium transition-all duration-200 ${
            activeTab === "create"
              ? "bg-warning text-white shadow-md"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
          onClick={() => onTabChange("create")}
        >
          {t("create_new_product")}
        </button>
        <button
          type="button"
          className={`rounded-lg px-6 py-3 text-sm font-medium transition-all duration-200 ${
            activeTab === "dropship"
              ? "bg-warning text-white shadow-md"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
          onClick={() => onTabChange("dropship")}
        >
          {t("dropship_product")}
        </button>
      </div>
    </div>
  );
};

export default ProductPageHeader;
