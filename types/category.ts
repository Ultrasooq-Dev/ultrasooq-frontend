/**
 * @module types/category
 * @description Category and specification template domain types.
 *
 * Field names are consistent with the backend `/category/*` and
 * `/specification/*` endpoints.
 */

// ---------------------------------------------------------------------------
// Core Category
// ---------------------------------------------------------------------------

export interface Category {
  id: number;
  name?: string;
  categoryName?: string;
  slug?: string;
  parentId?: number;
  level?: number;
  image?: string;
  children?: Category[];
  specTemplates?: SpecTemplate[];
  keywords?: string[];
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

// ---------------------------------------------------------------------------
// Specification Templates
// ---------------------------------------------------------------------------

export type SpecDataType = 'TEXT' | 'NUMBER' | 'SELECT' | 'MULTI_SELECT' | 'BOOLEAN';

export interface SpecTemplate {
  id: number;
  categoryId: number;
  name: string;
  key: string;
  dataType?: SpecDataType | string;
  unit?: string;
  options?: string[];
  isRequired?: boolean;
  isFilterable?: boolean;
  sortOrder?: number;
  groupName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSpecTemplateRequest {
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
}

export interface BulkCreateSpecTemplatesRequest {
  categoryId: number;
  templates: Omit<CreateSpecTemplateRequest, 'categoryId'>[];
}

// ---------------------------------------------------------------------------
// Specification Values (product-level)
// ---------------------------------------------------------------------------

export interface SpecValue {
  id?: number;
  productId: number;
  specTemplateId: number;
  value?: string;
  numericValue?: number;
}

export interface SetSpecValuesRequest {
  productId: number;
  values: Array<{
    specTemplateId: number;
    value?: string;
    numericValue?: number;
  }>;
}
