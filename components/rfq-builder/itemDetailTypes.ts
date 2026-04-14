/**
 * Shared types for ItemDetailPanel and its extracted sub-components/hooks.
 */

export interface ItemDetailPanelProps {
  selectedItemId: string | null;
  searchTerm?: string;
  onAddToCart: (productPriceId: number, quantity?: number) => void;
  onAddToRfqCart?: (productId: number) => void;
  onSelectProduct?: (product: any) => void;
  locale: string;
  activeCategories?: Set<string>;
  onCategoryChange?: (categories: Set<string>) => void;
}

export interface MappedProduct {
  id: number;
  name: string;
  price: number;
  originalPrice: number;
  priceRange: string | null;
  rating: number;
  reviews: number;
  seller: string;
  delivery: string;
  inStock: boolean;
  stock: number;
  specs: string[][];
  sellersCount: number;
  allIds: number[];
  sellType: string;
  isBuygroup: boolean;
  dateOpen: string | null;
  dateClose: string | null;
  startTime: string | null;
  endTime: string | null;
  minCustomer: number | null;
  maxCustomer: number | null;
  sold: number;
  enableChat: boolean;
  isCustomProduct: boolean;
  consumerType: string;
  image: string | null;
  isRecommended?: boolean;
}

export interface BuyListing {
  id: string;
  productId: number;
  priceId: number;
  name: string;
  seller: string;
  sellerAvatar: string | null;
  price: number;
  originalPrice: number;
  rating: number;
  reviews: number;
  stock: number;
  delivery: string;
  inStock: boolean;
  sellType: string;
  condition: string;
  brand: string;
  category: string;
  description: string;
  minOrder: number;
  warranty: string;
  enableChat: boolean;
  isCustomProduct: boolean;
  dateOpen: string | null;
  dateClose: string | null;
  startTime: string | null;
  endTime: string | null;
  minCustomer: number | null;
  maxCustomer: number | null;
}

export interface PricingInfo {
  consumerDiscount: number;
  consumerDiscountType: string | null;
  vendorDiscount: number;
  vendorDiscountType: string | null;
  consumerType: string;
  minQuantity: number;
  maxQuantity: number | null;
  minOrder: number;
  maxOrder: number | null;
  askForPrice: boolean;
  sellType: string;
  enableChat: boolean;
  dateOpen: string | null;
  dateClose: string | null;
  startTime: string | null;
  endTime: string | null;
  minCustomer: number | null;
  maxCustomer: number | null;
}

export interface DetailPricing {
  pricingInfo: PricingInfo;
  calculatedPrice: number;
  originalPrice: number;
  hasCalcDiscount: boolean;
  calcDiscountPct: number;
}
