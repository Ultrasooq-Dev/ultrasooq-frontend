"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Search, Sparkles, Loader2 } from "lucide-react";
import { ExistingProduct, ProductModel } from "./addFromExistingTypes";

interface SearchEmptyStateProps {
  searchTerm: string;
  shouldSearch: boolean;
  querySearchTerm: string;
  searchResults: ExistingProduct[];
  isSearching: boolean;
  aiProductModels: ProductModel[];
  isAIGenerating: boolean;
  langDir: string;
  onAIGenerate: (input: string | File, type: "text" | "image" | "url") => void;
  onSkipLoading: () => void;
}

export const SearchEmptyState: React.FC<SearchEmptyStateProps> = ({
  searchTerm,
  shouldSearch,
  querySearchTerm,
  searchResults,
  isSearching,
  aiProductModels,
  isAIGenerating,
  langDir,
  onAIGenerate,
  onSkipLoading,
}) => {
  const t = useTranslations();

  const showNoResults =
    shouldSearch &&
    querySearchTerm &&
    searchResults.length === 0 &&
    !isSearching &&
    aiProductModels.length === 0;

  const showInitialState = !searchTerm && searchResults.length === 0;

  if (showNoResults) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <Search className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-lg font-medium text-foreground mb-2" dir={langDir}>
          {t("no_products_found")}
        </p>
        <p className="text-sm text-muted-foreground mb-4" dir={langDir}>
          {t("no_matching_products_in_catalog") || t("try_different_search_term")}
        </p>
        {!isAIGenerating && (
          <Button
            onClick={() => onAIGenerate(searchTerm || "", "text")}
            className="bg-info hover:bg-info/90 text-white"
            disabled={!searchTerm.trim()}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {t("load_more_with_ai") || "Load More with AI"}
          </Button>
        )}
        {isAIGenerating && (
          <div className="flex flex-col items-center gap-2">
            <Button disabled className="bg-info text-white">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {t("generating") || "Generating..."}
            </Button>
            <Button
              variant="outline"
              onClick={onSkipLoading}
              className="text-muted-foreground hover:text-foreground"
            >
              {t("skip_loading") || "Skip loading"}
            </Button>
          </div>
        )}
      </div>
    );
  }

  if (showInitialState) {
    return (
      <div className="text-center py-8">
        <div className="bg-muted rounded-lg p-8 border-2 border-dashed border-border">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground mb-2" dir={langDir}>
            {t("search_existing_product_description")}
          </p>
          <p className="text-sm text-muted-foreground" dir={langDir}>
            {t("enter_product_name_to_search")}
          </p>
        </div>
      </div>
    );
  }

  return null;
};
