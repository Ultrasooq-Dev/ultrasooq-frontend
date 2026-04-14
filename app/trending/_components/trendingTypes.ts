export interface TrendingPageProps {
  searchParams?: Promise<{ term?: string }>;
}

export interface CartPricingParams {
  productData: any;
  cartItem: any;
  currentTradeRole: string | undefined;
  vendorBusinessCategoryIds: number[];
  freshCategoryConnectionsMap: Map<number, any[]>;
  firstCartCategoryId: number | undefined;
}

export interface CartPricingResult {
  unitPrice: number;
  totalPrice: number;
  originalUnitPrice: number;
  originalTotalPrice: number;
}
