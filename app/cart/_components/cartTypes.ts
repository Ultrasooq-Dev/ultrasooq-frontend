export interface ProductPricingInfo {
  consumerType?: string;
  vendorDiscount?: number;
  vendorDiscountType?: string;
  consumerDiscount?: number;
  consumerDiscountType?: string;
  categoryId?: number;
  categoryLocation?: string;
  categoryConnections?: any[];
}

export interface PromotionalProductPriceResult {
  originalPrice: number;
  discountedPrice: number;
  hasDiscount: boolean;
}
