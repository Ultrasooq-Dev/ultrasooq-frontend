"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Camera,
  Sparkles,
  Loader2,
  X,
  Link as LinkIcon,
  RefreshCw,
} from "lucide-react";
import { ProductModel } from "./addFromExistingTypes";
import { AIModelsList } from "./AIModelsList";

interface ImageRecognitionTabProps {
  isAIGenerating: boolean;
  aiProductSuggestions: any[];
  aiProductModels: ProductModel[];
  aiModelSource: "text" | "image" | "url" | null;
  checkingModel: boolean;
  processingProductIndex: number | null;
  selectedImage: File | null;
  imagePreview: string | null;
  searchTerm: string;
  onImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImageRecognition: () => void;
  onClearImage: () => void;
  onAIGenerate: (input: string | File, type: "text" | "image" | "url") => void;
  onSelectModel: (model: string | ProductModel) => void;
  onSelectSuggestion: (product: any, index: number) => void;
}

export const ImageRecognitionTab: React.FC<ImageRecognitionTabProps> = ({
  isAIGenerating,
  aiProductSuggestions,
  aiProductModels,
  aiModelSource,
  checkingModel,
  processingProductIndex,
  selectedImage,
  imagePreview,
  searchTerm,
  onImageSelect,
  onImageRecognition,
  onClearImage,
  onAIGenerate,
  onSelectModel,
  onSelectSuggestion,
}) => {
  const t = useTranslations();
  const { langDir } = useAuth();

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-semibold text-foreground mb-2" dir={langDir}>
          {t("scan_product_image") || "Scan Product Image"}
        </h4>
        <p className="text-sm text-muted-foreground mb-4" dir={langDir}>
          {t("upload_product_photo_ai_will_analyze_and_fill_details") ||
            "Upload product photo, AI will analyze and fill details"}
        </p>
      </div>

      {/* Image Upload Area */}
      <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-purple-400 transition-colors">
        <input
          type="file"
          accept="image/*"
          onChange={onImageSelect}
          className="hidden"
          id="image-recognition"
        />
        <label
          htmlFor="image-recognition"
          className="cursor-pointer flex flex-col items-center"
        >
          {imagePreview ? (
            <div className="relative w-48 h-48 mx-auto mb-4">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-full object-cover rounded-lg"
              />
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={(e) => {
                  e.stopPropagation();
                  onClearImage();
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <>
              <Camera className="h-10 w-10 text-muted-foreground mb-2" />
              <span className="text-sm text-muted-foreground mb-2">
                {t("click_to_upload_or_drag_drop") ||
                  "Click to upload or drag & drop"}
              </span>
            </>
          )}
          {!imagePreview && (
            <Button variant="outline" size="sm" asChild>
              <span>{t("choose_file") || "Choose File"}</span>
            </Button>
          )}
        </label>
      </div>

      {/* Process Button */}
      {imagePreview && (
        <Button
          onClick={onImageRecognition}
          disabled={isAIGenerating}
          className="w-full bg-info hover:bg-info/90 text-white"
        >
          {isAIGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {t("analyzing_with_ai") || "Analyzing with AI..."}
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              {t("analyze_with_ai") || "Analyze with AI"}
            </>
          )}
        </Button>
      )}

      {/* AI Product Suggestions List */}
      {aiProductSuggestions.length > 0 && (
        <div className="space-y-3 mt-6">
          <div className="flex items-center justify-between">
            <h4
              className="font-medium text-foreground flex items-center gap-2"
              dir={langDir}
            >
              <Sparkles className="h-5 w-5 text-info" />
              {t("product_suggestions_from_web") ||
                "Product Suggestions from Web"}
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (selectedImage) {
                  onAIGenerate(selectedImage, "image");
                } else if (searchTerm) {
                  onAIGenerate(searchTerm, "text");
                }
              }}
              disabled={isAIGenerating || (!selectedImage && !searchTerm.trim())}
              className="text-info hover:text-info hover:bg-info/5"
            >
              {isAIGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {aiProductSuggestions.map((product, idx) => (
              <div
                key={idx}
                className="bg-card border border-border rounded-lg p-4 hover:border-purple-400 hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h5
                        className="font-semibold text-foreground"
                        dir={langDir}
                      >
                        {product.productName || product.name}
                      </h5>
                      <Button
                        size="sm"
                        onClick={() => onSelectSuggestion(product, idx)}
                        disabled={processingProductIndex === idx}
                        className="bg-info hover:bg-info/90 text-white"
                      >
                        {processingProductIndex === idx ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            {t("generating") || "Generating..."}
                          </>
                        ) : (
                          t("use") || "Use"
                        )}
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <LinkIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs font-medium text-info">
                        {product.sourceName || "Unknown Source"}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {product.category && (
                        <p className="font-medium text-foreground">
                          {t("category")}: {product.category}
                        </p>
                      )}
                      {product.brand && (
                        <p>
                          {t("brand")}: {product.brand}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Product Models from IMAGE source */}
      {aiProductModels.length > 0 && aiModelSource === "image" && (
        <div className="space-y-3 mt-6">
          <div className="flex items-center justify-between">
            <h4
              className="font-medium text-foreground flex items-center gap-2"
              dir={langDir}
            >
              <Sparkles className="h-5 w-5 text-info" />
              {t("product_models_found") || "Product Models Found"}
            </h4>
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
    </div>
  );
};
