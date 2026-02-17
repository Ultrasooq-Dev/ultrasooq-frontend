/**
 * @module types/product
 * @description Product domain types.
 *
 * Field names match the backend API responses and the existing
 * `utils/types/product.types.ts` & `utils/types/common.types.ts` conventions.
 */

import type { Category } from './category';

// ---------------------------------------------------------------------------
// Enums / Union Types
// ---------------------------------------------------------------------------

export type ProductStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'REJECTED';

/**
 * R = Regular, P = Price-only (existing product), D = Dropship
 * Plus the logical product types used in the storefront.
 */
export type ProductType = 'R' | 'P' | 'D' | 'REGULAR' | 'RFQ' | 'BUYGROUP' | 'FACTORY';

export type ConsumerType = 'CONSUMER' | 'VENDORS' | 'EVERYONE';

export type SellType = string; // open-ended in current API

export type DiscountType = 'PERCENTAGE' | 'FLAT' | string;

// ---------------------------------------------------------------------------
// Core Product
// ---------------------------------------------------------------------------

export interface Product {
  id: number;
  productName: string;
  slug?: string;
  description?: string;
  shortDescription?: string;
  specification?: string;
  productImage?: string;
  productImages?: ProductImage[];
  status: ProductStatus;
  categoryId: number;
  categoryName?: string;
  category?: Category;
  brandId?: number;
  brandName?: string;
  skuNo?: string;
  productPrice: number;
  offerPrice: number;
  productType?: ProductType;
  consumerType?: ConsumerType;
  sellType?: SellType;
  placeOfOriginId?: number;
  userId?: number;
  adminId?: number;
  minQuantity?: number;
  maxQuantity?: number;
  minQuantityPerCustomer?: number;
  maxQuantityPerCustomer?: number;
  minCustomer?: number;
  maxCustomer?: number;
  stock?: number;
  sold?: number;
  askForPrice?: string;
  askForStock?: string;
  deliveryAfter?: number;
  productTagList?: ProductTag[];
  productPrices?: ProductPrice[];
  productSpecValues?: ProductSpecValue[];
  productReview?: ProductReview[];
  productWishlist?: any[];
  inWishlist?: boolean;
  isOwner?: boolean;
  isDropshipable?: boolean;
  dropshipCommission?: number;
  dropshipMinMarkup?: number;
  dropshipMaxMarkup?: number;
  categoryLocation?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
}

// ---------------------------------------------------------------------------
// Sub-entities
// ---------------------------------------------------------------------------

export interface ProductImage {
  id: number;
  image: string;
  imageName?: string;
  videoName?: string;
  video?: string;
}

export interface ProductTag {
  tagId: number;
}

export interface ProductPrice {
  id: number;
  productId?: number;
  adminId?: number;
  productPrice?: number;
  offerPrice: string | number;
  stock?: number;
  status?: string;
  consumerDiscount?: number;
  consumerDiscountType?: DiscountType;
  vendorDiscount?: number;
  vendorDiscountType?: DiscountType;
  minQuantity?: number;
  maxQuantity?: number;
  minQuantityPerCustomer?: number;
  maxQuantityPerCustomer?: number;
  sellType?: string;
  consumerType?: ConsumerType;
  productCondition?: string;
  deliveryAfter?: number;
  askForPrice?: string;
  askForStock?: string;
  /** Nested product info when fetched through price endpoints */
  productPrice_product?: {
    productName: string;
    offerPrice: string;
    productImages: ProductImage[];
  };
}

export interface ProductSpecValue {
  id: number;
  productId: number;
  specTemplateId?: number;
  value?: string;
  numericValue?: number;
}

export interface ProductReview {
  rating: number;
}

// ---------------------------------------------------------------------------
// Request / Filter types
// ---------------------------------------------------------------------------

export interface ProductListParams {
  page: number;
  limit: number;
  userId?: string | number;
  term?: string;
  brandIds?: string;
  categoryIds?: string;
  status?: string;
  expireDate?: string;
  sellType?: string;
  discount?: boolean;
  sort?: string;
  priceMin?: number;
  priceMax?: number;
  isOwner?: string;
  userType?: string;
  productType?: string;
  related?: boolean;
}

export interface CreateProductRequest {
  productType: 'R' | 'P';
  productName: string;
  categoryId: number;
  brandId: number;
  skuNo: string;
  productTagList?: ProductTag[];
  productImagesList?: { imageName: string; image: string }[];
  placeOfOriginId: number;
  productPrice: number;
  offerPrice: number;
  description: string;
  specification: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface UpdateProductRequest extends CreateProductRequest {
  productId: number;
}

export interface DeleteProductRequest {
  productId: string;
}

// ---------------------------------------------------------------------------
// Rendering helpers (from common.types)
// ---------------------------------------------------------------------------

export interface RenderProduct {
  id: number;
  productImage: string;
  productName: string;
  categoryName: string;
  skuNo: string;
  brandName: string;
  productPrice: string;
  status?: string;
  priceStatus?: string;
  productProductPriceId?: number;
  productProductPrice?: string;
  isOwner: boolean;
}

export interface TrendingProduct {
  id: number;
  productName: string;
  productPrice: number;
  offerPrice: number;
  productImage: string;
  categoryName: string;
  brandName: string;
  skuNo: string;
  shortDescription: string;
  productReview: { rating: number }[];
  status: string;
  productWishlist?: any[];
  inWishlist?: boolean;
  productProductPriceId?: number;
  productProductPrice?: string;
  consumerDiscount?: number;
  consumerDiscountType?: string;
  vendorDiscount?: number;
  vendorDiscountType?: string;
  askForPrice?: string;
  productPrices?: any[];
  sold?: number;
  categoryId?: number;
  categoryLocation?: string;
  consumerType?: ConsumerType;
}
