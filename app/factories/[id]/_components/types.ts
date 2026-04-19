// Shared types for the factories product details page

export interface SpecificationItem {
  id: number;
  label: string;
  specification: string;
}

export interface CartItem {
  id: number;
  productId: number;
  quantity: number;
  object?: any;
  sharedLinkId?: number;
  serviceId?: number;
  cartServiceFeatures?: any[];
  cartProductServices?: any[];
}

export interface ProductVariant {
  type: string;
  [key: string]: any;
}

export interface ProductDetails {
  id: number;
  adminId: number;
  productName: string;
  productPrice: number;
  description?: any;
  skuNo?: string;
  isDropshipped?: boolean;
  categoryId?: number;
  category?: { name: string };
  brand?: { brandName: string };
  productTags?: { tagId: number }[];
  productReview?: any;
  customMarketingContent?: { marketingText?: string };
  additionalMarketingImages?: any;
  product_productPrice?: ProductPrice[];
  product_productShortDescription?: any;
  product_productSpecification?: SpecificationItem[];
}

export interface ProductPrice {
  id: number;
  adminId: number;
  productPrice: number;
  offerPrice?: number;
  askForPrice?: boolean;
  minQuantityPerCustomer?: number;
  maxQuantityPerCustomer?: number;
  consumerDiscount?: number;
  consumerDiscountType?: string;
  vendorDiscount?: number;
  vendorDiscountType?: string;
  sellType?: string;
  dateOpen?: string;
  startTime?: string;
  adminDetail?: {
    id: number;
    accountName?: string;
    firstName?: string;
    lastName?: string;
    tradeRole?: string;
    userProfile?: { companyName?: string };
  };
}
