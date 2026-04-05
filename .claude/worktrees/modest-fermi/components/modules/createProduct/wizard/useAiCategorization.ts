"use client";
import { useState, useCallback } from "react";
import type { UseFormReturn } from "react-hook-form";
import { useAiCategorize } from "@/apis/queries/aiCategorize.queries";
import type { AiCategorizationResult } from "./wizardTypes";
import { fetchSubCategoriesById } from "@/apis/requests/category.requests";

type AiStatus = "idle" | "analyzing" | "matching" | "done" | "error";

interface UseAiCategorizationOptions {
  form: UseFormReturn<any>;
  setSelectedCategoryIds?: (ids: string[]) => void;
}

export function useAiCategorization({
  form,
  setSelectedCategoryIds,
}: UseAiCategorizationOptions) {
  const [status, setStatus] = useState<AiStatus>("idle");
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);
  const [suggestions, setSuggestions] = useState<AiCategorizationResult | null>(
    null
  );

  const aiCategorizeMutation = useAiCategorize();

  /**
   * Build the full category path and select each level in the accordion.
   */
  const applyCategoryPath = useCallback(
    async (categoryPath: number[]) => {
      if (!categoryPath.length) return;

      // Set categoryId to the leaf (last in path)
      const leafId = categoryPath[categoryPath.length - 1];
      form.setValue("categoryId", leafId);
      form.setValue("categoryLocation", categoryPath.join(","));

      // Set the cascade IDs for the category accordion selector
      if (setSelectedCategoryIds) {
        setSelectedCategoryIds(categoryPath.map(String));
      }
    },
    [form, setSelectedCategoryIds]
  );

  /**
   * Main categorization function — called when user clicks "Next" from Step 1.
   */
  const categorize = useCallback(async () => {
    const productName = form.getValues("productName");
    if (!productName || productName.trim().length < 2) return;

    setIsOverlayVisible(true);
    setStatus("analyzing");

    try {
      // Short delay for UX so user sees "Analyzing..." before request
      await new Promise((r) => setTimeout(r, 400));

      setStatus("matching");

      const result = await aiCategorizeMutation.mutateAsync({
        productName: productName.trim(),
      });

      const data = result.data;

      if (data && (data.suggestedTags.length > 0 || data.suggestedCategories.length > 0)) {
        setSuggestions(data);

        // Auto-apply the first suggested category
        if (data.suggestedCategories.length > 0) {
          const bestCategory = data.suggestedCategories[0];
          await applyCategoryPath(bestCategory.path);
        }

        // Auto-apply suggested tags to the form
        if (data.suggestedTags.length > 0) {
          const tagValues = data.suggestedTags.map((tag) => ({
            label: tag.tagName,
            value: tag.id,
          }));
          form.setValue("productTagList", tagValues);
        }

        setStatus("done");
      } else {
        setStatus("done");
      }
    } catch (error) {
      console.error("[AI Categorize] Error:", error);
      setStatus("error");
    }

    // Hide overlay after a brief delay
    setTimeout(() => {
      setIsOverlayVisible(false);
      setStatus("idle");
    }, 800);
  }, [form, aiCategorizeMutation, applyCategoryPath]);

  return {
    categorize,
    status,
    isOverlayVisible,
    suggestions,
  };
}
