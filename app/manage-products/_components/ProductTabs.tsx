"use client";
import React from "react";
import { useTranslations } from "next-intl";
import { ActiveTab } from "./manageProductsTypes";

interface ProductTabsProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

const ProductTabs: React.FC<ProductTabsProps> = ({ activeTab, onTabChange }) => {
  const t = useTranslations();

  return (
    <div className="mb-6">
      <div className="border-b border-border">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => onTabChange("my-products")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "my-products"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-muted-foreground hover:border-border"
            }`}
          >
            {t("my_products")}
          </button>
          <button
            onClick={() => onTabChange("dropship-products")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "dropship-products"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-muted-foreground hover:border-border"
            }`}
          >
            {t("my_dropship_products")}
          </button>
          <button
            onClick={() => onTabChange("my-services")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "my-services"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-muted-foreground hover:border-border"
            }`}
          >
            {t("my_services")}
          </button>
        </nav>
      </div>
    </div>
  );
};

export default ProductTabs;
