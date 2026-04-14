"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import LoaderWithMessage from "@/components/shared/LoaderWithMessage";
import { useTranslations } from "next-intl";

interface ProductLoadingStatesProps {
  isClient: boolean;
  isEditMode: boolean;
  isLoading: boolean;
  isError: boolean;
  activeProductType: string | undefined;
}

/**
 * Renders loading / error UI before the main product form is shown.
 * Returns null when the page should render normally.
 */
const ProductLoadingStates: React.FC<ProductLoadingStatesProps> = ({
  isClient,
  isEditMode,
  isLoading,
  isError,
  activeProductType,
}) => {
  const t = useTranslations();
  const router = useRouter();

  if (!isClient) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoaderWithMessage message={t("loading")} />
      </div>
    );
  }

  if (isEditMode && isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoaderWithMessage message={t("loading_product_data")} />
      </div>
    );
  }

  if (isEditMode && isError) {
    const handleBack = () => {
      if (activeProductType === "D") {
        router.push("/dropship-products");
      } else if (activeProductType === "R") {
        router.push("/rfq");
      } else if (activeProductType === "F") {
        router.push("/factories");
      } else {
        router.push("/manage-products");
      }
    };

    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 text-xl font-semibold text-destructive">
            {t("error_loading_product")}
          </h2>
          <p className="mb-4 text-muted-foreground">
            {t("failed_to_load_product_data")}
          </p>
          <Button onClick={handleBack}>{t("back_to_products")}</Button>
        </div>
      </div>
    );
  }

  return null;
};

export default ProductLoadingStates;
