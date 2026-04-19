"use client";

import { useState, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { useToast } from "@/components/ui/use-toast";
import { ULTRASOOQ_TOKEN_KEY } from "@/utils/constants";
import { getApiUrl } from "@/config/api";
import { getCookie } from "cookies-next";
import { buildSpecsFromProductSuggestion } from "./categoryUtils";
import { ProductModel } from "./addFromExistingTypes";

interface UseAIGenerateReturn {
  isAIGenerating: boolean;
  aiGeneratedData: any;
  aiProductSuggestions: any[];
  aiProductModels: ProductModel[];
  aiModelSource: "text" | "image" | "url" | null;
  handleAIGenerate: (input: string | File, type: "text" | "image" | "url") => Promise<void>;
  handleSkipLoading: () => void;
  setAiProductModels: React.Dispatch<React.SetStateAction<ProductModel[]>>;
  setAiProductSuggestions: React.Dispatch<React.SetStateAction<any[]>>;
  setAiModelSource: React.Dispatch<React.SetStateAction<"text" | "image" | "url" | null>>;
  setAutoAISearchTriggered: React.Dispatch<React.SetStateAction<boolean>>;
  setAiSearchSkipped: React.Dispatch<React.SetStateAction<boolean>>;
  autoAISearchTriggered: boolean;
  aiSearchSkipped: boolean;
}

export const useAIGenerate = (): UseAIGenerateReturn => {
  const t = useTranslations();
  const { toast } = useToast();

  const [isAIGenerating, setIsAIGenerating] = useState(false);
  const [aiGeneratedData, setAiGeneratedData] = useState<any>(null);
  const [aiProductSuggestions, setAiProductSuggestions] = useState<any[]>([]);
  const [aiProductModels, setAiProductModels] = useState<ProductModel[]>([]);
  const [aiModelSource, setAiModelSource] = useState<"text" | "image" | "url" | null>(null);
  const [autoAISearchTriggered, setAutoAISearchTriggered] = useState(false);
  const [aiSearchSkipped, setAiSearchSkipped] = useState(false);
  const aiAbortControllerRef = useRef<AbortController | null>(null);

  const handleAIGenerate = useCallback(
    async (input: string | File, type: "text" | "image" | "url") => {
      if (aiAbortControllerRef.current) {
        aiAbortControllerRef.current.abort();
      }

      const abortController = new AbortController();
      aiAbortControllerRef.current = abortController;
      setIsAIGenerating(true);

      try {
        const token = getCookie(ULTRASOOQ_TOKEN_KEY);

        if (type === "text" && typeof input === "string") {
          const response = await fetch(`${getApiUrl()}/product/ai-generate-list`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ type: "text", query: input }),
            signal: abortController.signal,
          });

          if (abortController.signal.aborted) return;
          const data = await response.json();
          if (abortController.signal.aborted) return;

          if (data.status && data.data && Array.isArray(data.data) && data.data.length > 0) {
            if (abortController.signal.aborted) return;
            setAiProductModels(data.data);
            setAiModelSource("text");
            setAiProductSuggestions([]);
            toast({
              title: t("search_successful") || "Search Successful",
              description:
                t("found_models", { n: data.data.length }) ||
                `Found ${data.data.length} product models`,
            });
          } else {
            if (abortController.signal.aborted) return;
            toast({
              title: t("no_results_found") || "No Results",
              description: data.message || t("no_models_found") || "No product models found",
              variant: "destructive",
            });
          }
        } else {
          const formData = new FormData();
          if (type === "image" && input instanceof File) {
            formData.append("image", input);
            formData.append("type", "image");
          } else if (type === "url" && typeof input === "string") {
            formData.append("url", input);
            formData.append("type", "url");
          }

          const response = await fetch(`${getApiUrl()}/product/ai-generate`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
            signal: abortController.signal,
          });

          if (abortController.signal.aborted) return;
          const data = await response.json();
          if (abortController.signal.aborted) return;

          if (data.status && data.data) {
            const isArray = Array.isArray(data.data);

            if (isArray && data.data.length > 0) {
              if (abortController.signal.aborted) return;
              const models = data.data
                .map((p: any) => ({
                  modelName: p.productName || p.name || "",
                  specifications: buildSpecsFromProductSuggestion(p),
                }))
                .filter((m: any) => m.modelName && m.modelName.trim().length > 0);

              setAiProductModels(models);
              setAiProductSuggestions([]);
              setAiGeneratedData(data.data);
              setAiModelSource("image");
              toast({
                title: t("search_successful") || "Search Successful",
                description:
                  t("found_models", { n: models.length }) ||
                  `Found ${models.length} product models`,
              });
            } else if (!isArray && data.data) {
              if (abortController.signal.aborted) return;
              const product = data.data;
              const models = [
                {
                  modelName: product.productName || product.name || "",
                  specifications: buildSpecsFromProductSuggestion(product),
                },
              ].filter((m: any) => m.modelName && m.modelName.trim().length > 0);

              setAiProductModels(models);
              setAiProductSuggestions([]);
              setAiGeneratedData([product]);
              setAiModelSource("image");
              toast({
                title: t("search_successful") || "Search Successful",
                description:
                  t("found_models", { n: models.length }) ||
                  `Found ${models.length} product models`,
              });
            } else {
              if (abortController.signal.aborted) return;
              toast({
                title: t("no_results_found") || "No Results",
                description:
                  t("no_products_found_from_web") || "No products found from web search",
                variant: "destructive",
              });
            }
          } else {
            if (abortController.signal.aborted) return;
            toast({
              title: t("generation_failed") || "Failed",
              description: data.message || t("ai_generation_error") || "AI generation error",
              variant: "destructive",
            });
          }
        }
      } catch (error: any) {
        if (error.name === "AbortError" || abortController.signal.aborted) return;
        toast({
          title: t("generation_failed") || "Failed",
          description: error.message || t("ai_generation_error") || "AI generation error",
          variant: "destructive",
        });
      } finally {
        if (abortController.signal.aborted) {
          setIsAIGenerating(false);
          if (aiAbortControllerRef.current === abortController) {
            aiAbortControllerRef.current = null;
          }
        } else if (aiAbortControllerRef.current === abortController) {
          setIsAIGenerating(false);
          aiAbortControllerRef.current = null;
        }
      }
    },
    [toast, t]
  );

  const handleSkipLoading = () => {
    if (aiAbortControllerRef.current) {
      aiAbortControllerRef.current.abort();
      aiAbortControllerRef.current = null;
    }
    setIsAIGenerating(false);
    setAutoAISearchTriggered(false);
    setAiSearchSkipped(true);
  };

  return {
    isAIGenerating,
    aiGeneratedData,
    aiProductSuggestions,
    aiProductModels,
    aiModelSource,
    handleAIGenerate,
    handleSkipLoading,
    setAiProductModels,
    setAiProductSuggestions,
    setAiModelSource,
    setAutoAISearchTriggered,
    setAiSearchSkipped,
    autoAISearchTriggered,
    aiSearchSkipped,
  };
};
