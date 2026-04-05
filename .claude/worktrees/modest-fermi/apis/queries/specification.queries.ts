/**
 * @module specification.queries
 * @description React Query hooks for specification templates, spec values,
 *   filters, category keywords, and multi-category management.
 * @uses @tanstack/react-query
 * @api /specification/*
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchSpecTemplates,
  fetchSpecTemplatesForCategories,
  createSpecTemplate,
  bulkCreateSpecTemplates,
  updateSpecTemplate,
  deleteSpecTemplate,
  fetchSpecValues,
  setSpecValues,
  updateSpecValue,
  fetchFilters,
  addCategoryKeywords,
  fetchCategoryKeywords,
  matchCategories,
  setProductCategories,
  fetchProductCategories,
  autoCategorizeProduct,
  suggestCategories,
  generateSpecValues,
  fetchHealth,
} from "../requests/specification.requests";

// ── Spec Templates ──

export const useSpecTemplates = (categoryId: number, enabled = true) =>
  useQuery({
    queryKey: ["spec-templates", categoryId],
    queryFn: async () => {
      const res = await fetchSpecTemplates(categoryId);
      return res.data;
    },
    enabled: enabled && !!categoryId,
  });

export const useSpecTemplatesForCategories = (
  categoryIds: number[],
  enabled = true
) =>
  useQuery({
    queryKey: ["spec-templates-multi", categoryIds],
    queryFn: async () => {
      const res = await fetchSpecTemplatesForCategories(categoryIds);
      return res.data;
    },
    enabled: enabled && categoryIds.length > 0,
  });

export const useCreateSpecTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSpecTemplate,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["spec-templates", variables.categoryId],
      });
    },
  });
};

export const useBulkCreateSpecTemplates = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: bulkCreateSpecTemplates,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["spec-templates", variables.categoryId],
      });
    },
  });
};

export const useUpdateSpecTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      updateSpecTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spec-templates"] });
    },
  });
};

export const useDeleteSpecTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSpecTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spec-templates"] });
    },
  });
};

// ── Spec Values ──

export const useSpecValues = (productId: number, enabled = true) =>
  useQuery({
    queryKey: ["spec-values", productId],
    queryFn: async () => {
      const res = await fetchSpecValues(productId);
      return res.data;
    },
    enabled: enabled && !!productId,
  });

export const useSetSpecValues = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: setSpecValues,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["spec-values", variables.productId],
      });
    },
  });
};

export const useUpdateSpecValue = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      updateSpecValue(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spec-values"] });
    },
  });
};

// ── Filters ──

export const useFilters = (categoryId: number, enabled = true) =>
  useQuery({
    queryKey: ["filters", categoryId],
    queryFn: async () => {
      const res = await fetchFilters(categoryId);
      return res.data;
    },
    enabled: enabled && !!categoryId,
  });

// ── Category Keywords ──

export const useCategoryKeywords = (categoryId: number, enabled = true) =>
  useQuery({
    queryKey: ["category-keywords", categoryId],
    queryFn: async () => {
      const res = await fetchCategoryKeywords(categoryId);
      return res.data;
    },
    enabled: enabled && !!categoryId,
  });

export const useAddCategoryKeywords = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      categoryId,
      keywords,
    }: {
      categoryId: number;
      keywords: string[];
    }) => addCategoryKeywords(categoryId, keywords),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["category-keywords", variables.categoryId],
      });
    },
  });
};

export const useMatchCategories = () =>
  useMutation({
    mutationFn: (text: string) => matchCategories(text),
  });

// ── Product Categories (Multi-Category) ──

export const useProductCategories = (productId: number, enabled = true) =>
  useQuery({
    queryKey: ["product-categories", productId],
    queryFn: async () => {
      const res = await fetchProductCategories(productId);
      return res.data;
    },
    enabled: enabled && !!productId,
  });

export const useSetProductCategories = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      categoryIds,
      primaryCategoryId,
    }: {
      productId: number;
      categoryIds: number[];
      primaryCategoryId?: number;
    }) => setProductCategories(productId, categoryIds, primaryCategoryId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["product-categories", variables.productId],
      });
    },
  });
};

export const useAutoCategorize = () =>
  useMutation({
    mutationFn: autoCategorizeProduct,
  });

// ── AI Suggestions ──

export const useSuggestCategories = () =>
  useMutation({
    mutationFn: suggestCategories,
  });

export const useGenerateSpecValues = () =>
  useMutation({
    mutationFn: generateSpecValues,
  });

// ── Health ──

export const useHealth = (enabled = true) =>
  useQuery({
    queryKey: ["health"],
    queryFn: async () => {
      const res = await fetchHealth();
      return res.data;
    },
    enabled,
    refetchInterval: 30000, // 30 seconds
  });
