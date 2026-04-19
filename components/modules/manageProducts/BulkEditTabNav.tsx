"use client";
import React from "react";
import { ActiveTab } from "./bulkEditTypes";

interface BulkEditTabNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

const TABS: { id: ActiveTab; label: string }[] = [
  { id: "warehouse-location", label: "Location" },
  { id: "product-basic", label: "Product" },
  { id: "ask-for", label: "Ask For" },
  { id: "discounts", label: "Discounts" },
];

const BulkEditTabNav: React.FC<BulkEditTabNavProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="border-b border-border bg-card">
      <nav className="flex space-x-4 px-4" aria-label="Tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`py-2 px-2 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-muted-foreground hover:border-border"
            } transition-colors`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default BulkEditTabNav;
