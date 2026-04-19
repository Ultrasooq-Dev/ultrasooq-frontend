"use client";
import React from "react";
import { Store } from "lucide-react";
import { IoMdAdd } from "react-icons/io";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { ActiveTab } from "./manageProductsTypes";

interface ManageProductsHeaderProps {
  currentAccount: any;
  activeTab: ActiveTab;
  searchTerm: string;
  existingProductsSearchTerm: string;
  globalSelectedIds: Set<number>;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  onSearchChange: (e: any) => void;
  onSearch: () => void;
  onExistingProductsSearchChange: (e: any) => void;
  onExistingProductsSearch: () => void;
  onAddProduct: () => void;
  onBulkUpdate: () => void;
}

const ManageProductsHeader: React.FC<ManageProductsHeaderProps> = ({
  currentAccount,
  activeTab,
  searchTerm,
  existingProductsSearchTerm,
  globalSelectedIds,
  searchInputRef,
  onSearchChange,
  onSearch,
  onExistingProductsSearchChange,
  onExistingProductsSearch,
  onAddProduct,
  onBulkUpdate,
}) => {
  const t = useTranslations();
  const { langDir } = useAuth();

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Store className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground capitalize">
                {(() => {
                  const account = currentAccount?.data?.account;
                  if (currentAccount?.data?.isMainAccount) {
                    return (
                      (account as any)?.firstName ||
                      (account as any)?.name ||
                      t("main_account")
                    );
                  } else {
                    return (
                      (account as any)?.accountName ||
                      (account as any)?.companyName ||
                      "Account"
                    );
                  }
                })()}
              </h1>
              <p className="text-sm text-muted-foreground">
                {currentAccount?.data?.account?.tradeRole || t("user")}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {activeTab === "my-products" && (
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder={t("search_product")}
                className="w-64 h-10"
                onChange={onSearchChange}
                ref={searchInputRef}
                dir={langDir}
                translate="no"
              />
              <Button
                type="button"
                onClick={onSearch}
                disabled={!searchTerm.trim()}
                className="h-10 px-4 bg-primary hover:bg-primary/90 disabled:bg-muted-foreground disabled:cursor-not-allowed"
              >
                {t("search")}
              </Button>
            </div>
          )}

          {(activeTab as string) === "existing-products" && (
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder={t("search_product")}
                className="w-64 h-10"
                onChange={onExistingProductsSearchChange}
                dir={langDir}
                translate="no"
              />
              <Button
                type="button"
                onClick={onExistingProductsSearch}
                disabled={!existingProductsSearchTerm.trim()}
                className="h-10 px-4 bg-primary hover:bg-primary/90 disabled:bg-muted-foreground disabled:cursor-not-allowed"
              >
                {t("search")}
              </Button>
            </div>
          )}

          <button
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors flex items-center gap-2"
            onClick={onAddProduct}
            dir={langDir}
          >
            <IoMdAdd size={20} />
            <span>{t("add_product")}</span>
          </button>

          {Array.from(globalSelectedIds).length > 0 && (
            <button
              className="px-4 py-2 bg-success text-white rounded hover:bg-success/90 transition-colors"
              onClick={onBulkUpdate}
              dir={langDir}
            >
              Bulk Update ({Array.from(globalSelectedIds).length})
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageProductsHeader;
