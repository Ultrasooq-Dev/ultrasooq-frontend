import type { UseFormReturn } from "react-hook-form";
import { fetchSubCategoriesById } from "@/apis/requests/category.requests";

/**
 * Build the full category path (root → … → leaf) by walking up through parents.
 */
export async function buildCategoryPathFromLeaf(
  categoryId: number,
): Promise<number[]> {
  try {
    const res = await fetchSubCategoriesById({
      categoryId: String(categoryId),
    });
    const categoryData = res.data?.data;

    if (categoryData?.categoryLocation) {
      return categoryData.categoryLocation
        .split(",")
        .map((id: string) => Number(id.trim()))
        .filter((id: number) => !Number.isNaN(id));
    }

    if (!categoryData?.parentId || categoryData.parentId === categoryId) {
      return [categoryId];
    }

    const parentPath = await buildCategoryPathFromLeaf(categoryData.parentId);
    return [...parentPath, categoryId];
  } catch (error) {
    console.error(
      "[AI Category] Error building category path from leaf:",
      error,
    );
    return [categoryId];
  }
}

/**
 * Populate React-Hook-Form fields from AI-generated product data.
 *
 * Used by:
 *  - The in-wizard AiProductSearch (Step 1)
 *  - The URL-based autoFill handler in page.tsx
 */
export async function populateFormWithAIData(
  form: UseFormReturn<any>,
  aiData: any,
  setSelectedCategoryIds?: (ids: string[]) => void,
): Promise<void> {
  // Product name
  if (aiData.productName || aiData.name) {
    form.setValue("productName", aiData.productName || aiData.name);
  }

  // Description + rich-text (Slate JSON)
  if (aiData.description) {
    form.setValue("description", aiData.description);

    try {
      const descriptionJson = JSON.parse(aiData.description);
      if (Array.isArray(descriptionJson) && descriptionJson.length > 0) {
        form.setValue("descriptionJson", descriptionJson);
      } else {
        form.setValue("descriptionJson", [
          { type: "p", children: [{ text: aiData.description }] },
        ]);
      }
    } catch {
      form.setValue("descriptionJson", [
        { type: "p", children: [{ text: aiData.description }] },
      ]);
    }
  }

  // Short description
  if (aiData.shortDescription) {
    form.setValue("productShortDescriptionList", [
      { shortDescription: aiData.shortDescription },
    ]);
  }

  // Specifications
  if (aiData.specifications && Array.isArray(aiData.specifications)) {
    form.setValue(
      "productSpecificationList",
      aiData.specifications.map((spec: any) => ({
        label: spec.label || "",
        specification: spec.specification || "",
      })),
    );
  }

  // Estimated price
  if (aiData.estimatedPrice || aiData.price) {
    const price = aiData.estimatedPrice || aiData.price;
    form.setValue("productPrice", price.toString());
  }

  // Category matching (async path building)
  if (
    aiData.matchedCategoryId &&
    (aiData.categoryConfidence === "high" ||
      aiData.categoryConfidence === "medium")
  ) {
    const matchedId = Number(aiData.matchedCategoryId);

    let path: number[] | null = null;

    if (
      aiData.categoryPath &&
      Array.isArray(aiData.categoryPath) &&
      aiData.categoryPath.length > 0
    ) {
      path = aiData.categoryPath
        .map((id: any) => Number(id))
        .filter((id: number) => !Number.isNaN(id));
    } else {
      path = await buildCategoryPathFromLeaf(matchedId);
    }

    if (path && path.length > 0) {
      const leafId = path[path.length - 1];
      form.setValue("categoryId", leafId);
      setSelectedCategoryIds?.(path.map((id: number) => id.toString()));
      form.setValue("categoryLocation", path.join(","));
    }
  }
}
