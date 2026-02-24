/**
 * @module specification.requests
 * @description API request functions for specification templates, spec values,
 *   filters, category keywords, and multi-category product management.
 * @api /specification/*
 */
import http from "../http";

// ── Spec Templates ──

export const fetchSpecTemplates = (categoryId: number) => {
  return http({
    method: "GET",
    url: `/specification/template/${categoryId}`,
  });
};

export const fetchSpecTemplatesForCategories = (categoryIds: number[]) => {
  return http({
    method: "GET",
    url: `/specification/template/multi?ids=${categoryIds.join(",")}`,
  });
};

export const createSpecTemplate = (data: {
  categoryId: number;
  name: string;
  key: string;
  dataType?: string;
  unit?: string;
  options?: string[];
  isRequired?: boolean;
  isFilterable?: boolean;
  sortOrder?: number;
  groupName?: string;
}) => {
  return http({
    method: "POST",
    url: `/specification/template`,
    data,
  });
};

export const bulkCreateSpecTemplates = (data: {
  categoryId: number;
  templates: Array<{
    name: string;
    key: string;
    dataType?: string;
    unit?: string;
    options?: string[];
    isRequired?: boolean;
    isFilterable?: boolean;
    sortOrder?: number;
    groupName?: string;
  }>;
}) => {
  return http({
    method: "POST",
    url: `/specification/template/bulk`,
    data,
  });
};

export const updateSpecTemplate = (
  id: number,
  data: Partial<{
    name: string;
    key: string;
    dataType: string;
    unit: string;
    options: string[];
    isRequired: boolean;
    isFilterable: boolean;
    sortOrder: number;
    groupName: string;
  }>
) => {
  return http({
    method: "PATCH",
    url: `/specification/template/${id}`,
    data,
  });
};

export const deleteSpecTemplate = (id: number) => {
  return http({
    method: "DELETE",
    url: `/specification/template/${id}`,
  });
};

// ── Spec Values ──

export const fetchSpecValues = (productId: number) => {
  return http({
    method: "GET",
    url: `/specification/value/${productId}`,
  });
};

export const setSpecValues = (data: {
  productId: number;
  values: Array<{
    specTemplateId: number;
    value?: string;
    numericValue?: number;
  }>;
}) => {
  return http({
    method: "POST",
    url: `/specification/value`,
    data,
  });
};

export const updateSpecValue = (
  id: number,
  data: { value?: string; numericValue?: number }
) => {
  return http({
    method: "PATCH",
    url: `/specification/value/${id}`,
    data,
  });
};

// ── Filters ──

export const fetchFilters = (categoryId: number) => {
  return http({
    method: "GET",
    url: `/specification/filters/${categoryId}`,
  });
};

// ── Category Keywords ──

export const addCategoryKeywords = (
  categoryId: number,
  keywords: string[]
) => {
  return http({
    method: "POST",
    url: `/specification/keywords/${categoryId}`,
    data: { keywords },
  });
};

export const fetchCategoryKeywords = (categoryId: number) => {
  return http({
    method: "GET",
    url: `/specification/keywords/${categoryId}`,
  });
};

export const matchCategories = (text: string) => {
  return http({
    method: "POST",
    url: `/specification/match-categories`,
    data: { text },
  });
};

// ── Product Categories (Multi-Category) ──

export const setProductCategories = (
  productId: number,
  categoryIds: number[],
  primaryCategoryId?: number
) => {
  return http({
    method: "POST",
    url: `/specification/product-categories/${productId}`,
    data: { categoryIds, primaryCategoryId },
  });
};

export const fetchProductCategories = (productId: number) => {
  return http({
    method: "GET",
    url: `/specification/product-categories/${productId}`,
  });
};

export const autoCategorizeProduct = (productId: number) => {
  return http({
    method: "POST",
    url: `/specification/auto-categorize/${productId}`,
  });
};

// ── AI Suggestions ──

export const suggestCategories = (data: {
  productName: string;
  description: string;
  tags: string[];
}) => {
  return http({
    method: "POST",
    url: `/product/suggestCategories`,
    data,
  });
};

export const generateSpecValues = (data: {
  productName: string;
  description: string;
  categoryId: number;
}) => {
  return http({
    method: "POST",
    url: `/product/generateSpecValues`,
    data,
  });
};

// ── Health ──

export const fetchHealth = () => {
  return http({
    method: "GET",
    url: `/health`,
  });
};
