"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useExistingProduct } from "@/apis/queries/product.queries";
import { useMe } from "@/apis/queries/user.queries";
import { useCategory } from "@/apis/queries/category.queries";
import { useToast } from "@/components/ui/use-toast";
import { PRODUCT_CATEGORY_ID } from "@/utils/constants";
import { ExistingProduct } from "./addFromExistingTypes";
import { useAIGenerate } from "./useAIGenerate";
import { useModelSelection } from "./useModelSelection";
import { useMediaInput } from "./useMediaInput";

export const useAddFromExisting = () => {
  const t = useTranslations();
  const router = useRouter();
  const { toast } = useToast();
  const me = useMe();

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<ExistingProduct[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ExistingProduct | null>(null);
  const [showProductPopup, setShowProductPopup] = useState(false);
  const [shouldSearch, setShouldSearch] = useState(false);
  const [querySearchTerm, setQuerySearchTerm] = useState("");

  const categoriesQuery = useCategory(PRODUCT_CATEGORY_ID.toString());

  const {
    isAIGenerating,
    aiGeneratedData,
    aiProductSuggestions,
    aiProductModels,
    aiModelSource,
    handleAIGenerate,
    handleSkipLoading,
    setAiProductModels,
    setAiProductSuggestions,
    setAutoAISearchTriggered,
    setAiSearchSkipped,
    autoAISearchTriggered,
    aiSearchSkipped,
  } = useAIGenerate();

  const {
    selectedModel,
    modelExists,
    checkingModel,
    showPreviewModal,
    setShowPreviewModal,
    previewData,
    processingProductIndex,
    handleSelectModel,
    handleSelectSuggestion,
    handleUsePreviewData: handleUsePreviewDataBase,
  } = useModelSelection({
    aiProductModels,
    categoriesQueryData: categoriesQuery?.data,
  });

  const mediaInput = useMediaInput({ onAIGenerate: handleAIGenerate });

  const { data: searchData, isError, error } = useExistingProduct(
    { page: 1, limit: 10, term: querySearchTerm, brandAddedBy: me.data?.data?.id },
    shouldSearch && querySearchTerm.trim().length >= 3
  );

  const handleAddNewProduct = () => router.push("/product");

  const handleSearch = useCallback(() => {
    if (!searchTerm.trim() || searchTerm.trim().length < 3) {
      toast({
        title: t("search_term_too_short"),
        description: t("search_term_too_short"),
        variant: "destructive",
      });
      return;
    }
    setAiProductSuggestions([]);
    setAiProductModels([]);
    setAutoAISearchTriggered(false);
    setAiSearchSkipped(false);
    setQuerySearchTerm(searchTerm.trim());
    setShouldSearch(true);
    setIsSearching(true);
  }, [searchTerm, toast, t, setAiProductSuggestions, setAiProductModels, setAutoAISearchTriggered, setAiSearchSkipped]);

  const handleSelectProduct = (product: ExistingProduct) =>
    router.push(`/product?copy=${product.id}&fromExisting=true`);

  const handleViewProduct = (product: ExistingProduct) => {
    setSelectedProduct(product);
    setShowProductPopup(true);
  };

  const closeProductPopup = () => {
    setShowProductPopup(false);
    setSelectedProduct(null);
  };

  const handleUsePreviewData = () => {
    handleUsePreviewDataBase((url) => router.push(url));
  };

  const triggerAutoAI = useCallback(() => {
    if (
      querySearchTerm.trim().length >= 3 &&
      !autoAISearchTriggered &&
      !isAIGenerating &&
      !aiSearchSkipped
    ) {
      setAutoAISearchTriggered(true);
      handleAIGenerate(querySearchTerm, "text");
    }
  }, [querySearchTerm, autoAISearchTriggered, isAIGenerating, aiSearchSkipped, setAutoAISearchTriggered, handleAIGenerate]);

  useEffect(() => {
    if (isError) {
      toast({ title: t("search_failed"), description: t("search_failed"), variant: "destructive" });
      setIsSearching(false);
      setSearchResults([]);
      triggerAutoAI();
    } else if (searchData?.data) {
      setSearchResults(searchData.data);
      setIsSearching(false);
      if (searchData.data.length === 0) triggerAutoAI();
    } else if (querySearchTerm.trim().length >= 3 && shouldSearch && searchData && !searchData.data) {
      setIsSearching(false);
      setSearchResults([]);
      triggerAutoAI();
    }
  }, [searchData, querySearchTerm, shouldSearch, isError, error, toast, t, triggerAutoAI]);

  return {
    searchTerm, setSearchTerm,
    searchResults,
    isSearching,
    selectedProduct,
    showProductPopup,
    shouldSearch,
    querySearchTerm,
    isAIGenerating,
    aiGeneratedData,
    aiProductSuggestions,
    aiProductModels,
    aiModelSource,
    selectedModel,
    modelExists,
    checkingModel,
    showPreviewModal,
    setShowPreviewModal,
    previewData,
    processingProductIndex,
    autoAISearchTriggered,
    aiSearchSkipped,
    // handlers
    handleAddNewProduct,
    handleSearch,
    handleSelectProduct,
    handleViewProduct,
    closeProductPopup,
    handleAIGenerate,
    handleSkipLoading,
    handleUsePreviewData,
    handleSelectModel,
    handleSelectSuggestion,
    // media input
    ...mediaInput,
  };
};
