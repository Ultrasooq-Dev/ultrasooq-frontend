// Category utility functions for AI-based category matching

import { getApiUrl } from "@/config/api";
import { getCookie } from "cookies-next";
import { ULTRASOOQ_TOKEN_KEY } from "@/utils/constants";

// Build brief specifications string for AI product suggestions (image/URL flow)
export const buildSpecsFromProductSuggestion = (product: any): string => {
  const lines: string[] = [];

  if (product.brand) {
    lines.push(`Brand: ${product.brand}`);
  }
  if (product.category) {
    lines.push(`Category: ${product.category}`);
  }
  const price = product.estimatedPrice ?? product.price;
  if (price) {
    lines.push(`Price: ${price}`);
  }
  if (Array.isArray(product.specifications) && product.specifications.length > 0) {
    for (const spec of product.specifications.slice(0, 3)) {
      if (spec.label && spec.specification) {
        lines.push(`${spec.label}: ${spec.specification}`);
      }
    }
  }

  return lines.join("\n");
};

// Helper function to find category path in hierarchy
export const findCategoryPathInHierarchy = (
  categories: any[],
  targetId: number | string,
  currentPath: number[] = []
): number[] | null => {
  for (const category of categories) {
    const newPath = [...currentPath, category.id];

    if (
      category.id?.toString() === targetId?.toString() ||
      Number(category.id) === Number(targetId)
    ) {
      return newPath;
    }

    if (category.children && category.children.length > 0) {
      const found = findCategoryPathInHierarchy(category.children, targetId, newPath);
      if (found) {
        return found;
      }
    }
  }
  return null;
};

// Helper function to flatten category tree and mark leaf categories
export const flattenCategories = (
  categories: any[],
  parentPath: number[] = []
): Array<{ id: number; name: string; isLeaf: boolean; path: number[]; category: any }> => {
  const result: Array<{
    id: number;
    name: string;
    isLeaf: boolean;
    path: number[];
    category: any;
  }> = [];

  for (const category of categories) {
    const currentPath = [...parentPath, category.id];
    const hasChildren = category.children && category.children.length > 0;

    result.push({
      id: category.id,
      name: category.name,
      isLeaf: !hasChildren,
      path: currentPath,
      category: category,
    });

    if (hasChildren) {
      result.push(...flattenCategories(category.children, currentPath));
    }
  }

  return result;
};

// Helper function to find a category by ID in the tree
export const findCategoryById = (
  categories: any[],
  targetId: number | string
): any => {
  for (const category of categories) {
    if (
      category.id?.toString() === targetId?.toString() ||
      Number(category.id) === Number(targetId)
    ) {
      return category;
    }
    if (category.children && category.children.length > 0) {
      const found = findCategoryById(category.children, targetId);
      if (found) return found;
    }
  }
  return null;
};

// AI-based category matching function
export const findMatchingCategoryWithAI = async (
  aiCategoryName: string,
  categoriesData: any,
  productName?: string
): Promise<{ matchedCategoryId: number | null; confidence: string }> => {
  if (!categoriesData?.data?.children || !aiCategoryName) {
    return { matchedCategoryId: null, confidence: "low" };
  }

  const allCategories = flattenCategories(categoriesData.data.children);
  const leafCategories = allCategories.filter((cat) => cat.isLeaf);
  const parentCategories = allCategories.filter((cat) => !cat.isLeaf);

  try {
    const token = getCookie(ULTRASOOQ_TOKEN_KEY);

    if (leafCategories.length > 0) {
      const leafCategoriesForMatching = leafCategories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        isLeaf: true,
      }));

      const leafResponse = await fetch(
        `${getApiUrl()}/product/ai-match-category`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            aiCategoryName,
            productName: productName || undefined,
            availableCategories: leafCategoriesForMatching,
          }),
        }
      );

      const leafData = await leafResponse.json();

      if (leafData.status && leafData.data && leafData.data.matchedCategoryId) {
        return {
          matchedCategoryId: leafData.data.matchedCategoryId,
          confidence: leafData.data.confidence || "medium",
        };
      }
    }

    const parentCategoriesForMatching = parentCategories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      isLeaf: false,
    }));

    if (parentCategoriesForMatching.length === 0) {
      return { matchedCategoryId: null, confidence: "low" };
    }

    const response = await fetch(
      `${getApiUrl()}/product/ai-match-category`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          aiCategoryName,
          availableCategories: parentCategoriesForMatching,
        }),
      }
    );

    const data = await response.json();

    if (data.status && data.data && data.data.matchedCategoryId) {
      return {
        matchedCategoryId: data.data.matchedCategoryId,
        confidence: data.data.confidence || "low",
      };
    }

    return { matchedCategoryId: null, confidence: "low" };
  } catch (error) {
    console.error("AI category matching error:", error);
    return { matchedCategoryId: null, confidence: "low" };
  }
};
