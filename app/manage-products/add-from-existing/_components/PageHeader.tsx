"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";

interface PageHeaderProps {
  onBack: () => void;
  onAddNewProduct: () => void;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  onBack,
  onAddNewProduct,
}) => {
  const t = useTranslations();

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={onBack}
            className="p-2 hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
          </Button>
          <h1 className="text-3xl font-bold text-foreground">
            {t("add_product")}
          </h1>
        </div>

        <Button
          onClick={onAddNewProduct}
          className="bg-primary hover:bg-primary/90 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t("manually_add_new_product") || "Manually add a new product"}
        </Button>
      </div>
    </div>
  );
};
