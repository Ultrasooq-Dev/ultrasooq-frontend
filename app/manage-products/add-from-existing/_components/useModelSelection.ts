"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useToast } from "@/components/ui/use-toast";
import {
  resolveCategoryForDetails,
  checkModelExists,
  fetchAIProductDetails,
} from "./productApi";
import { ProductModel, PreviewData } from "./addFromExistingTypes";

interface UseModelSelectionProps {
  aiProductModels: ProductModel[];
  categoriesQueryData: any;
}

interface UseModelSelectionReturn {
  selectedModel: string | null;
  modelExists: boolean | null;
  checkingModel: boolean;
  showPreviewModal: boolean;
  setShowPreviewModal: React.Dispatch<React.SetStateAction<boolean>>;
  previewData: PreviewData | null;
  processingProductIndex: number | null;
  handleSelectModel: (model: string | ProductModel) => Promise<void>;
  handleSelectSuggestion: (product: any, index: number) => Promise<void>;
  handleUsePreviewData: (onNavigate: (url: string) => void) => void;
}

export const useModelSelection = ({
  aiProductModels,
  categoriesQueryData,
}: UseModelSelectionProps): UseModelSelectionReturn => {
  const t = useTranslations();
  const { toast } = useToast();

  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [modelExists, setModelExists] = useState<boolean | null>(null);
  const [checkingModel, setCheckingModel] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [processingProductIndex, setProcessingProductIndex] = useState<number | null>(null);

  const handleUsePreviewData = (onNavigate: (url: string) => void) => {
    if (previewData) {
      const categoryLocation = previewData.categoryPath?.join(",") || "";
      const encodedData = encodeURIComponent(
        JSON.stringify({
          ...previewData,
          matchedCategoryId: previewData.matchedCategoryId || null,
          categoryConfidence: previewData.categoryConfidence || "low",
          categoryPath: previewData.categoryPath || [],
          categoryLocation: categoryLocation,
        })
      );

      const url = new URL("/product", window.location.origin);
      url.searchParams.set("autoFill", "true");
      url.searchParams.set("data", encodedData);
      if (previewData.categoryPath?.length) {
        url.searchParams.set("selectedCategoryIds", previewData.categoryPath.join(","));
      }

      onNavigate(url.pathname + url.search);
      setShowPreviewModal(false);
    }
  };

  const openPreviewFromDetails = async (
    productName: string,
    modelExists: boolean,
    extra?: { category?: string; brand?: string }
  ) => {
    const detailsData = await fetchAIProductDetails(productName, extra);

    if (!detailsData.status || !detailsData.data) {
      toast({
        title: t("generation_failed") || "Failed",
        description:
          detailsData.message ||
          t("failed_to_generate_details") ||
          "Failed to generate product details",
        variant: "destructive",
      });
      return;
    }

    const { matchedCategoryId, categoryConfidence, categoryPath } =
      await resolveCategoryForDetails(
        detailsData.data,
        categoriesQueryData,
        productName
      );

    setPreviewData({
      ...detailsData.data,
      matchedCategoryId,
      categoryConfidence,
      categoryPath,
      modelExists,
    });
    setShowPreviewModal(true);
  };

  const handleSelectModel = async (model: string | ProductModel) => {
    const modelName = typeof model === "string" ? model : model.modelName;
    setSelectedModel(modelName);
    setCheckingModel(true);
    setModelExists(null);
    const modelIndex = aiProductModels.findIndex((m) => {
      const mName = typeof m === "string" ? m : m.modelName;
      return mName === modelName;
    });
    setProcessingProductIndex(modelIndex >= 0 ? modelIndex : null);

    try {
      const checkData = await checkModelExists(modelName);

      if (!checkData.status) {
        toast({
          title: t("check_failed") || "Failed",
          description:
            checkData.message ||
            t("failed_to_check_model") ||
            "Failed to check model existence",
          variant: "destructive",
        });
        return;
      }

      setModelExists(checkData.exists ?? null);
      await openPreviewFromDetails(modelName, checkData.exists ?? false);
    } catch (error: any) {
      toast({
        title: t("generation_failed") || "Failed",
        description: error.message || t("ai_generation_error") || "AI generation error",
        variant: "destructive",
      });
    } finally {
      setCheckingModel(false);
      setProcessingProductIndex(null);
    }
  };

  const handleSelectSuggestion = async (product: any, index: number) => {
    setProcessingProductIndex(index);
    setSelectedModel(product.productName);
    setCheckingModel(true);
    setModelExists(null);

    try {
      const checkData = await checkModelExists(product.productName);

      if (!checkData.status) {
        toast({
          title: t("check_failed") || "Failed",
          description:
            checkData.message ||
            t("failed_to_check_model") ||
            "Failed to check model existence",
          variant: "destructive",
        });
        return;
      }

      setModelExists(checkData.exists ?? null);
      await openPreviewFromDetails(product.productName, checkData.exists ?? false, {
        category: product.category,
        brand: product.brand,
      });
    } catch (error: any) {
      toast({
        title: t("generation_failed") || "Failed",
        description: error.message || t("ai_generation_error") || "AI generation error",
        variant: "destructive",
      });
    } finally {
      setProcessingProductIndex(null);
      setCheckingModel(false);
    }
  };

  return {
    selectedModel,
    modelExists,
    checkingModel,
    showPreviewModal,
    setShowPreviewModal,
    previewData,
    processingProductIndex,
    handleSelectModel,
    handleSelectSuggestion,
    handleUsePreviewData,
  };
};
