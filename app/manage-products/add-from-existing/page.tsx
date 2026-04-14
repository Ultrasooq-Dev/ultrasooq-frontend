"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { withActiveUserGuard } from "@/components/shared/withRouteGuard";
import { useAddFromExisting } from "./_components/useAddFromExisting";
import { PageHeader } from "./_components/PageHeader";
import { ExistingProductSearch } from "./_components/ExistingProductSearch";
import { ImageRecognitionTab } from "./_components/ImageRecognitionTab";
import { AIPreviewModal } from "./_components/AIPreviewModal";
import { ProductDetailsPopup } from "./_components/ProductDetailsPopup";

const AddFromExistingProductPage = () => {
  const t = useTranslations();
  const router = useRouter();

  const state = useAddFromExisting();
  const {
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
    selectedImage,
    imagePreview,
    productUrl,
    setProductUrl,
    handleImageSelect,
    handleImageRecognition,
    handleImportFromUrl,
  } = state;

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <PageHeader
          onBack={() => router.back()}
          onAddNewProduct={handleAddNewProduct}
        />

        <div className="rounded-xl bg-card shadow-sm p-6">
          <Tabs defaultValue="search">
            <TabsList className="mb-6 w-full justify-start gap-1 bg-muted p-1 rounded-lg">
              <TabsTrigger value="search" className="rounded-md">
                {t("search_existing") || "Search Existing"}
              </TabsTrigger>
              <TabsTrigger value="image" className="rounded-md">
                {t("image_recognition") || "Image Recognition"}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="search">
              <ExistingProductSearch
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                isSearching={isSearching}
                searchResults={searchResults}
                shouldSearch={shouldSearch}
                querySearchTerm={querySearchTerm}
                isAIGenerating={isAIGenerating}
                aiProductModels={aiProductModels}
                aiModelSource={aiModelSource}
                checkingModel={checkingModel}
                processingProductIndex={processingProductIndex}
                onSearch={handleSearch}
                onViewProduct={handleViewProduct}
                onSelectProduct={handleSelectProduct}
                onAIGenerate={handleAIGenerate}
                onSkipLoading={handleSkipLoading}
                onSelectModel={handleSelectModel}
              />
            </TabsContent>

            <TabsContent value="image">
              <ImageRecognitionTab
                isAIGenerating={isAIGenerating}
                aiProductSuggestions={aiProductSuggestions}
                aiProductModels={aiProductModels}
                aiModelSource={aiModelSource}
                checkingModel={checkingModel}
                processingProductIndex={processingProductIndex}
                selectedImage={selectedImage}
                imagePreview={imagePreview}
                searchTerm={searchTerm}
                onImageSelect={handleImageSelect}
                onImageRecognition={handleImageRecognition}
                onClearImage={() => {}}
                onAIGenerate={handleAIGenerate}
                onSelectModel={handleSelectModel}
                onSelectSuggestion={handleSelectSuggestion}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {showPreviewModal && previewData && (
        <AIPreviewModal
          previewData={previewData}
          onClose={() => setShowPreviewModal(false)}
          onUse={handleUsePreviewData}
        />
      )}

      {showProductPopup && selectedProduct && (
        <ProductDetailsPopup
          product={selectedProduct}
          onClose={closeProductPopup}
          onSelect={handleSelectProduct}
        />
      )}
    </div>
  );
};

export default withActiveUserGuard(AddFromExistingProductPage);
