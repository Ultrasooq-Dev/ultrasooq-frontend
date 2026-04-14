// ─── Types ───────────────────────────────────────────────────
export type DealStatus =
  | "ACTIVE"
  | "THRESHOLD_MET"
  | "CONFIRMED"
  | "EXPIRED"
  | "CANCELLED"
  | "COMPLETED";

export interface BuyGroupDeal {
  id: number;
  productName: string;
  productImage: string | null;
  productPriceId: number;
  price: number;
  offerPrice: number;
  currency: string;
  // Thresholds
  minCustomer: number;
  maxCustomer: number;
  currentCustomers: number;
  // Quantity
  stock: number;
  orderedQuantity: number;
  minQuantityPerCustomer: number;
  maxQuantityPerCustomer: number;
  // Time window
  dateOpen: string;
  dateClose: string;
  startTime: string;
  endTime: string;
  // Status
  status: DealStatus;
  // Orders within this deal
  orders: BuyGroupOrder[];
}

export interface BuyGroupOrder {
  id: number;
  orderId: number;
  customerName: string;
  customerEmail: string;
  customerRating: number; // 0-5 stars
  quantity: number;
  total: number;
  status:
    | "PLACED"
    | "CONFIRMED"
    | "SHIPPED"
    | "DELIVERED"
    | "CANCELLED"
    | "REFUNDED";
  createdAt: string;
}
