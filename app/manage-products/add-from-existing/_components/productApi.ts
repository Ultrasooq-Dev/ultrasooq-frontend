// API helpers for product model checking and AI detail generation

import { getApiUrl } from "@/config/api";
import { getCookie } from "cookies-next";
import { ULTRASOOQ_TOKEN_KEY } from "@/utils/constants";
import {
  findMatchingCategoryWithAI,
  findCategoryPathInHierarchy,
} from "./categoryUtils";

// Fetch and check if a model exists in the catalog
export const checkModelExists = async (
  modelName: string
): Promise<{ status: boolean; exists?: boolean; message?: string }> => {
  const token = getCookie(ULTRASOOQ_TOKEN_KEY);
  const res = await fetch(`${getApiUrl()}/product/check-model-exists`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ modelName }),
  });
  return res.json();
};

// Fetch AI-generated product details
export const fetchAIProductDetails = async (
  productName: string,
  extra?: { category?: string; brand?: string }
): Promise<{ status: boolean; data?: any; message?: string }> => {
  const token = getCookie(ULTRASOOQ_TOKEN_KEY);
  const res = await fetch(`${getApiUrl()}/product/ai-generate-details`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ productName, ...extra }),
  });
  return res.json();
};

// Resolve category match + path from AI-generated details data
export const resolveCategoryForDetails = async (
  detailsData: any,
  categoriesQueryData: any,
  productNameHint?: string
): Promise<{
  matchedCategoryId: number | null;
  categoryConfidence: string;
  categoryPath: number[] | null;
}> => {
  let matchedCategoryId: number | null = null;
  let categoryConfidence = "low";
  let categoryPath: number[] | null = null;

  if (detailsData.category) {
    const matchResult = await findMatchingCategoryWithAI(
      detailsData.category,
      categoriesQueryData,
      productNameHint
    );
    matchedCategoryId = matchResult.matchedCategoryId;
    categoryConfidence = matchResult.confidence;
  }

  if (!matchedCategoryId && detailsData.matchedCategoryId) {
    matchedCategoryId = detailsData.matchedCategoryId;
    categoryConfidence = "medium";
  }

  if (matchedCategoryId && categoriesQueryData?.data?.children) {
    categoryPath = findCategoryPathInHierarchy(
      categoriesQueryData.data.children,
      matchedCategoryId
    );
  }

  return { matchedCategoryId, categoryConfidence, categoryPath };
};
