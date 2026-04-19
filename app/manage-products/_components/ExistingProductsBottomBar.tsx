"use client";
import React from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { ActiveTab } from "./manageProductsTypes";

interface ExistingProductsBottomBarProps {
  activeTab: ActiveTab;
  existingProductsSelectedIds: number[];
  onClearSelection: () => void;
}

const ExistingProductsBottomBar: React.FC<ExistingProductsBottomBarProps> = ({
  activeTab,
  existingProductsSelectedIds,
  onClearSelection,
}) => {
  const t = useTranslations();
  const router = useRouter();
  const { langDir } = useAuth();

  if ((activeTab as string) !== "existing-products" || existingProductsSelectedIds.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 z-10 flex w-full items-center justify-between border-t border-solid border-border bg-primary px-10 py-3">
      <div className="flex items-center gap-4">
        <Button
          type="button"
          onClick={onClearSelection}
          size="sm"
          className="flex items-center rounded-sm bg-transparent border border-white text-sm font-bold text-white hover:bg-card hover:text-primary"
          dir={langDir}
          translate="no"
        >
          {t("clear_selection")}
        </Button>
      </div>
      <div className="flex items-center gap-3">
        <Button
          type="button"
          onClick={() => {
            const selectedIds = existingProductsSelectedIds.join(",");
            router.push(`/manage-products/bulk-add-existing?ids=${selectedIds}`);
          }}
          size="lg"
          className="flex items-center rounded-sm bg-transparent border border-white text-sm font-bold text-white hover:bg-card hover:text-primary"
          dir={langDir}
          translate="no"
        >
          {t("bulk_add_products")}
        </Button>
      </div>
    </div>
  );
};

export default ExistingProductsBottomBar;
