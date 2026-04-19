"use client";

import React from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Copy, Eye, Sparkles, Loader2, RefreshCw } from "lucide-react";
import { ExistingProduct, ProductModel } from "./addFromExistingTypes";
import { AIModelsList } from "./AIModelsList";
import { SearchEmptyState } from "./SearchEmptyState";

interface ExistingProductSearchProps {
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  isSearching: boolean;
  searchResults: ExistingProduct[];
  shouldSearch: boolean;
  querySearchTerm: string;
  isAIGenerating: boolean;
  aiProductModels: ProductModel[];
  aiModelSource: "text" | "image" | "url" | null;
  checkingModel: boolean;
  processingProductIndex: number | null;
  onSearch: () => void;
  onViewProduct: (product: ExistingProduct) => void;
  onSelectProduct: (product: ExistingProduct) => void;
  onAIGenerate: (input: string | File, type: "text" | "image" | "url") => void;
  onSkipLoading: () => void;
  onSelectModel: (model: string | ProductModel) => void;
}

export const ExistingProductSearch: React.FC<ExistingProductSearchProps> = ({
  searchTerm,
  setSearchTerm,
  isSearching,
  searchResults,
  shouldSearch,
  querySearchTerm,
  isAIGenerating,
  aiProductModels,
  aiModelSource,
  checkingModel,
  processingProductIndex,
  onSearch,
  onViewProduct,
  onSelectProduct,
  onAIGenerate,
  onSkipLoading,
  onSelectModel,
}) => {
  const t = useTranslations();
  const { langDir } = useAuth();

  return (
    <div>
      <div className="mb-4">
        <p className="text-sm text-muted-foreground mb-3" dir={langDir}>
          {t("search_existing_product_description")}
        </p>
        <div className="flex gap-2 w-full">
          <Input
            type="text"
            placeholder={t("enter_product_name")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 min-w-0 sm:min-w-[400px] lg:min-w-[600px]"
            dir={langDir}
          />
          <Button onClick={onSearch} disabled={isSearching || !searchTerm.trim()}>
            <Search className="h-4 w-4 mr-2" />
            {isSearching ? t("searching") : t("search") || "Search"}
          </Button>
        </div>
      </div>

      {/* Existing search results */}
      {searchResults.length > 0 && (
        <div className="space-y-3 mb-6">
          <h4 className="font-medium text-foreground" dir={langDir}>
            {t("product_suggestion_from_ultrasooq") || "Product suggestion from Ultrasooq"}
          </h4>
          <div className="max-h-60 overflow-y-auto space-y-2">
            {searchResults.map((product) => (
              <div
                key={product.id}
                className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-muted"
              >
                <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                  {product.existingProductImages?.[0]?.image ? (
                    <Image
                      src={product.existingProductImages[0].image}
                      alt={product.productName}
                      width={48}
                      height={48}
                      className="rounded-lg object-cover"
                    />
                  ) : (
                    <Copy className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <h5 className="font-medium text-foreground" dir={langDir}>
                    {product.productName}
                  </h5>
                  <p className="text-xs text-muted-foreground" dir={langDir}>
                    {product.category?.name} • {product.brand?.brandName}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => onViewProduct(product)}>
                    <Eye className="h-4 w-4 mr-2" />
                    {t("view")}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => onSelectProduct(product)}>
                    <Copy className="h-4 w-4 mr-2" />
                    {t("select")}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Load More with AI */}
          {!isAIGenerating && aiProductModels.length === 0 && (
            <div className="flex justify-center pt-4 border-t border-border">
              <Button
                onClick={() => onAIGenerate(searchTerm || "", "text")}
                className="bg-info hover:bg-info/90 text-white"
                disabled={!searchTerm.trim()}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {t("load_more_with_ai") || "Load More with AI"}
              </Button>
            </div>
          )}
          {isAIGenerating && (
            <div className="flex flex-col items-center gap-2 pt-4 border-t border-border">
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
      )}

      {/* AI Product Models List - text source */}
      {aiProductModels.length > 0 && aiModelSource === "text" && (
        <div className="space-y-3 mt-6">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-foreground flex items-center gap-2" dir={langDir}>
              <Sparkles className="h-5 w-5 text-info" />
              {t("product_models_found") || "Product Models Found"}
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAIGenerate(searchTerm || "", "text")}
              disabled={isAIGenerating || !searchTerm.trim()}
              className="text-info hover:text-info hover:bg-info/5"
            >
              {isAIGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
          <AIModelsList
            models={aiProductModels}
            checkingModel={checkingModel}
            processingProductIndex={processingProductIndex}
            langDir={langDir}
            onSelectModel={onSelectModel}
          />
        </div>
      )}

      {/* Empty / Initial states */}
      <SearchEmptyState
        searchTerm={searchTerm}
        shouldSearch={shouldSearch}
        querySearchTerm={querySearchTerm}
        searchResults={searchResults}
        isSearching={isSearching}
        aiProductModels={aiProductModels}
        isAIGenerating={isAIGenerating}
        langDir={langDir}
        onAIGenerate={onAIGenerate}
        onSkipLoading={onSkipLoading}
      />
    </div>
  );
};
