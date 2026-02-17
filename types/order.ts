/**
 * @module types/order
 * @description Order domain types.
 *
 * Status values and field names are derived from the existing
 * `utils/types/orders.types.ts` and the order API request files.
 */

import type { Product } from './product';

// ---------------------------------------------------------------------------
// Enums / Union Types
// ---------------------------------------------------------------------------

export type OrderProductStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'RETURNED';

// ---------------------------------------------------------------------------
// Core Order
// ---------------------------------------------------------------------------

export interface Order {
  id: number;
  orderNumber?: string;
  userId: number;
  status?: string;
  total?: number;
  subtotal?: number;
  shippingFee?: number;
  currency?: string;
  shippingAddress?: Address;
  billingAddress?: Address;
  items?: OrderItem[];
  cancelReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderItem {
  id: number;
  orderId?: number;
  orderProductId?: number;
  productId: number;
  productPriceId?: number;
  quantity: number;
  price?: number;
  status?: OrderProductStatus | string;
  product?: Product;
  trackingNumber?: string;
  carrier?: string;
}

// ---------------------------------------------------------------------------
// Address
// ---------------------------------------------------------------------------

export interface Address {
  firstName?: string;
  lastName?: string;
  email?: string;
  cc?: string;
  phone?: string;
  phoneNumber?: string;
  address?: string;
  street?: string;
  town?: string;
  city?: string;
  state?: string;
  province?: string;
  country?: string;
  postalCode?: string;
  postCode?: string;
  countryId?: string | number;
  stateId?: string | number;
  cityId?: string | number;
  cityDetail?: { id: number; name: string };
  stateDetail?: { id: number; name: string };
  countryDetail?: { id: number; name: string };
}

// ---------------------------------------------------------------------------
// Order Details (checkout form shape from orders.types.ts)
// ---------------------------------------------------------------------------

export interface OrderDetails {
  firstName: string;
  lastName: string;
  email: string;
  cc: string;
  phone: string;
  shippingAddress?: string;
  shippingCity?: string;
  shippingProvince?: string;
  shippingCountry?: string;
  shippingPostCode?: string;
  billingAddress?: string;
  billingCity?: string;
  billingProvince?: string;
  billingCountry?: string;
  billingPostCode?: string;
}

// ---------------------------------------------------------------------------
// Request types
// ---------------------------------------------------------------------------

export interface OrderListParams {
  page: number;
  limit: number;
  term?: string;
  orderProductStatus?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  sellType?: string;
}

export interface UpdateOrderStatusRequest {
  orderProductId: number;
  status: string;
  notes?: string;
}

export interface AddOrderTrackingRequest {
  orderProductId: number;
  trackingNumber: string;
  carrier: string;
  notes?: string;
}
