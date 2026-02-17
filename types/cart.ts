/**
 * @module types/cart
 * @description Cart domain types.
 *
 * Field names are consistent with the existing `utils/types/cart.types.ts`
 * and the `/cart/*` API endpoints.
 */

import type { Product, ProductImage } from './product';

// ---------------------------------------------------------------------------
// Core Cart
// ---------------------------------------------------------------------------

export interface Cart {
  id: number;
  userId?: number;
  deviceId?: string;
  status?: string;
  items: CartItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  id: number;
  cartType?: 'DEFAULT' | 'SERVICE';
  productId: number;
  productPriceId: number;
  productPriceDetails?: CartProductPriceDetails;
  serviceId?: number;
  cartServiceFeatures?: any[];
  quantity: number;
  product?: Product;
  productVariant?: any;
  sharedLinkId?: number;
  object?: any;
}

export interface CartProductPriceDetails {
  adminId: number;
  offerPrice: string;
  productPrice_product: {
    productName: string;
    offerPrice: string;
    productImages: ProductImage[];
  };
  consumerDiscount: number;
  consumerDiscountType?: string;
  vendorDiscount: number;
  vendorDiscountType?: string;
  minQuantityPerCustomer?: number;
  maxQuantityPerCustomer?: number;
}

// ---------------------------------------------------------------------------
// Request types
// ---------------------------------------------------------------------------

export interface UpdateCartRequest {
  productPriceId: number;
  quantity: number;
  sharedLinkId?: number;
  productVariant?: any;
}

export interface UpdateCartByDeviceRequest extends UpdateCartRequest {
  deviceId: string;
}

export interface DeleteCartItemRequest {
  cartId: number;
}

export interface CartListParams {
  page: number;
  limit: number;
  deviceId?: string;
}
