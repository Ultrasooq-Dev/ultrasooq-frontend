/**
 * @module specification.requests
 * @description API request functions for specification templates, spec values,
 *   filters, category keywords, and multi-category product management.
 * @api /specification/*
 */
import { ULTRASOOQ_TOKEN_KEY } from "@/utils/constants";
import axios from "axios";
import { getCookie } from "cookies-next";
import { getApiUrl } from "@/config/api";

const authHeaders = () => ({
  "Content-Type": "application/json",
  Accept: "application/json",
  Authorization: "Bearer " + getCookie(ULTRASOOQ_TOKEN_KEY),
});

// ── Spec Templates ──

export const fetchSpecTemplates = (categoryId: number) => {
  return axios({
    method: "GET",
    url: `${getApiUrl()}/specification/template/${categoryId}`,
    headers: authHeaders(),
  });
};

export const fetchSpecTemplatesForCategories = (categoryIds: number[]) => {
  return axios({
    method: "GET",
    url: `${getApiUrl()}/specification/template/multi?ids=${categoryIds.join(",")}`,
    headers: authHeaders(),
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
  return axios({
    method: "POST",
    url: `${getApiUrl()}/specification/template`,
    headers: authHeaders(),
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
  return axios({
    method: "POST",
    url: `${getApiUrl()}/specification/template/bulk`,
    headers: authHeaders(),
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
  return axios({
    method: "PATCH",
    url: `${getApiUrl()}/specification/template/${id}`,
    headers: authHeaders(),
    data,
  });
};

export const deleteSpecTemplate = (id: number) => {
  return axios({
    method: "DELETE",
    url: `${getApiUrl()}/specification/template/${id}`,
    headers: authHeaders(),
  });
};

// ── Spec Values ──

export const fetchSpecValues = (productId: number) => {
  return axios({
    method: "GET",
    url: `${getApiUrl()}/specification/value/${productId}`,
    headers: authHeaders(),
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
  return axios({
    method: "POST",
    url: `${getApiUrl()}/specification/value`,
    headers: authHeaders(),
    data,
  });
};

export const updateSpecValue = (
  id: number,
  data: { value?: string; numericValue?: number }
) => {
  return axios({
    method: "PATCH",
    url: `${getApiUrl()}/specification/value/${id}`,
    headers: authHeaders(),
    data,
  });
};

// ── Filters ──

export const fetchFilters = (categoryId: number) => {
  return axios({
    method: "GET",
    url: `${getApiUrl()}/specification/filters/${categoryId}`,
    headers: authHeaders(),
  });
};

// ── Category Keywords ──

export const addCategoryKeywords = (
  categoryId: number,
  keywords: string[]
) => {
  return axios({
    method: "POST",
    url: `${getApiUrl()}/specification/keywords/${categoryId}`,
    headers: authHeaders(),
    data: { keywords },
  });
};

export const fetchCategoryKeywords = (categoryId: number) => {
  return axios({
    method: "GET",
    url: `${getApiUrl()}/specification/keywords/${categoryId}`,
    headers: authHeaders(),
  });
};

export const matchCategories = (text: string) => {
  return axios({
    method: "POST",
    url: `${getApiUrl()}/specification/match-categories`,
    headers: authHeaders(),
    data: { text },
  });
};

// ── Product Categories (Multi-Category) ──

export const setProductCategories = (
  productId: number,
  categoryIds: number[],
  primaryCategoryId?: number
) => {
  return axios({
    method: "POST",
    url: `${getApiUrl()}/specification/product-categories/${productId}`,
    headers: authHeaders(),
    data: { categoryIds, primaryCategoryId },
  });
};

export const fetchProductCategories = (productId: number) => {
  return axios({
    method: "GET",
    url: `${getApiUrl()}/specification/product-categories/${productId}`,
    headers: authHeaders(),
  });
};

export const autoCategorizeProduct = (productId: number) => {
  return axios({
    method: "POST",
    url: `${getApiUrl()}/specification/auto-categorize/${productId}`,
    headers: authHeaders(),
  });
};

// ── AI Suggestions ──

export const suggestCategories = (data: {
  productName: string;
  description: string;
  tags: string[];
}) => {
  return axios({
    method: "POST",
    url: `${getApiUrl()}/product/suggestCategories`,
    headers: authHeaders(),
    data,
  });
};

export const generateSpecValues = (data: {
  productName: string;
  description: string;
  categoryId: number;
}) => {
  return axios({
    method: "POST",
    url: `${getApiUrl()}/product/generateSpecValues`,
    headers: authHeaders(),
    data,
  });
};

// ── Health ──

export const fetchHealth = () => {
  return axios({
    method: "GET",
    url: `${getApiUrl()}/health`,
  });
};
