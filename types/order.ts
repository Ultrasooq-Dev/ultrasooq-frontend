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

// ---------------------------------------------------------------------------
// API Response types (matches backend Prisma includes)
// ---------------------------------------------------------------------------

/** Image record from ProductImages table */
export interface OrderProductImage {
  id: number;
  image?: string;
  productId?: number;
  status?: string;
  variant?: Record<string, unknown>;
  [key: string]: unknown;
}

/** Nested order (from orderProduct_order include) */
export interface OrderRecord {
  id: number;
  userId?: number;
  orderNo?: string;
  orderStatus?: string;
  orderDate?: string;
  orderType?: string;
  totalPrice?: number;
  actualPrice?: number;
  deliveryCharge?: number;
  totalDiscount?: number;
  totalPlatformFee?: number;
  totalCustomerPay?: number;
  totalCashbackToCustomer?: number;
  paymentMethod?: string;
  paymentType?: string;
  transactionId?: string;
  paymobOrderId?: number;
  advanceAmount?: number;
  dueAmount?: number;
  order_orderAddress?: OrderAddressRecord[];
  order_orderProducts?: OrderProductDetail[];
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

/** Address record (from order_orderAddress include) */
export interface OrderAddressRecord {
  id?: number;
  orderId?: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  cc?: string;
  phone?: string;
  address?: string;
  city?: string;
  province?: string;
  country?: string;
  town?: string;
  postCode?: string;
  addressType?: 'SHIPPING' | 'BILLING' | string;
  cityId?: number;
  countryId?: number;
  stateId?: number;
  [key: string]: unknown;
}

/** Shipping detail record */
export interface OrderShippingRecord {
  id?: number;
  orderId?: number;
  sellerId?: number;
  orderShippingType?: string;
  serviceId?: number;
  status?: string;
  shippingDate?: string;
  shippingCharge?: number;
  receipt?: string;
  fromTime?: string;
  toTime?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

/** Product record nested inside order */
export interface OrderProductRecord {
  id: number;
  productName?: string;
  productImages?: OrderProductImage[];
  [key: string]: unknown;
}

/** ProductPrice record nested inside order */
export interface OrderProductPriceRecord {
  id: number;
  offerPrice?: number;
  salePrice?: number;
  purchasePrice?: number;
  deliveryAfter?: number;
  productId?: number;
  orderQuantity?: number;
  productPrice_product?: OrderProductRecord;
  adminDetail?: {
    id?: number;
    firstName?: string;
    lastName?: string;
    user_userProfile?: {
      id?: number;
      logo?: string;
      companyName?: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/** Service feature record */
export interface OrderServiceFeature {
  id?: number;
  featureId?: number;
  featureName?: string;
  featurePrice?: number;
  serviceFeature?: {
    id?: number;
    name?: string;
    [key: string]: unknown;
  };
  quantity?: number;
  [key: string]: unknown;
}

/** Tracking info embedded in breakdown */
export interface OrderTrackingInfo {
  trackingNumber?: string;
  carrier?: string;
  addedAt?: string;
  notes?: string;
  [key: string]: unknown;
}

/** Breakdown record (may contain tracking, variant info, etc.) */
export interface OrderBreakdown {
  tracking?: OrderTrackingInfo;
  variants?: Record<string, unknown>;
  [key: string]: unknown;
}

/** The main order product detail — returned by getOneOrderProductDetail */
export interface OrderProductDetail {
  id: number;
  orderId?: number;
  userId?: number;
  sellerId?: number;
  productId?: number;
  productPriceId?: number;
  serviceId?: number;
  orderShippingId?: number;
  orderNo?: string;
  sellerOrderNo?: string;
  orderProductType?: string;
  orderProductStatus?: string;
  orderProductDate?: string;
  cancelReason?: string;
  salePrice?: number;
  purchasePrice?: number;
  orderQuantity?: number;
  cashbackToCustomer?: number;
  customerPay?: number;
  platformFee?: number;
  sellerReceives?: number;
  orderProductReceipt?: string;
  breakdown?: OrderBreakdown;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  orderProduct_order?: OrderRecord;
  orderProduct_product?: OrderProductRecord;
  orderProduct_productPrice?: OrderProductPriceRecord;
  orderShippingDetail?: OrderShippingRecord;
  serviceFeatures?: OrderServiceFeature[];
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Mutation response data shapes
// ---------------------------------------------------------------------------

export interface CreateOrderData {
  id: number;
  walletTransactionId?: number;
  [key: string]: unknown;
}

export interface PaymentIntentData {
  client_secret: string;
  [key: string]: unknown;
}

export interface AmwalPayConfigData {
  MID: string;
  TID: string;
  CurrencyId: string;
  AmountTrxn: string;
  MerchantReference: string;
  LanguageId: string;
  PaymentViewType: string;
  TrxDateTime: string;
  SessionToken?: string;
  SecureHash: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Vendor Dashboard types
// ---------------------------------------------------------------------------

export interface VendorOrderStatsData {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalRevenue: number;
  [key: string]: unknown;
}

export interface VendorDashboardOrder {
  id: number;
  orderNo?: string;
  sellerOrderNo?: string;
  orderProductStatus?: string;
  orderProductType?: string;
  orderQuantity?: number;
  salePrice?: number;
  purchasePrice?: number;
  customerPay?: number;
  createdAt?: string;
  updatedAt?: string;
  items?: {
    id: number;
    name?: string;
    image?: string;
    quantity?: number;
    [key: string]: unknown;
  }[];
  order_orderAddress?: OrderAddressRecord[];
  order?: { order_orderAddress?: OrderAddressRecord[]; [key: string]: unknown };
  [key: string]: unknown;
}

export interface VendorRecentOrdersData {
  orders: VendorDashboardOrder[];
  pagination: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Order Detail Response types
// ---------------------------------------------------------------------------

/** Full response from useOrderById (buyer side) */
export interface OrderByIdResponse {
  status: boolean;
  message: string;
  data: OrderProductDetail;
  orderShippingDetail?: OrderShippingRecord;
  otherData?: OrderRecord[];
}

/** Full response from useOrderBySellerId (seller side) */
export interface OrderBySellerIdResponse {
  status: boolean;
  message: string;
  data: OrderProductDetail;
  orderShippingDetail?: OrderShippingRecord;
  otherData?: OrderRecord[];
}
