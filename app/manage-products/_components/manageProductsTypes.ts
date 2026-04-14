export const VALID_TABS = ['my-products', 'dropship-products', 'my-services'] as const;
export type ActiveTab = typeof VALID_TABS[number];

export interface ManagedProduct {
  id: number;
  productId: number;
  status: string;
  askForPrice: string;
  askForStock: string;
  productPrice_product: {
    productImages: {
      id: number;
      image: string | null;
      video: string | null;
    }[];
    productName: string;
    productPrice?: string;
    offerPrice?: string;
    productType?: string;
    isDropshipped?: boolean;
  };
  productPrice_productSellerImage: {
    id: number;
    image: string | null;
    video: string | null;
  }[];
  productPrice: string;
  offerPrice: string;
  stock: number;
  consumerType: string;
  sellType: string;
  deliveryAfter: number;
  timeOpen: number | null;
  timeClose: number | null;
  vendorDiscount: number | null;
  vendorDiscountType: string | null;
  consumerDiscount: number | null;
  consumerDiscountType: string | null;
  minQuantity: number | null;
  maxQuantity: number | null;
  minCustomer: number | null;
  maxCustomer: number | null;
  minQuantityPerCustomer: number | null;
  maxQuantityPerCustomer: number | null;
  productCondition: string;
}

export interface ExistingProduct {
  id: number;
  productName: string;
  productPrice: number;
  offerPrice: number;
  productImage: string | undefined;
  categoryName: string;
  categoryId: number | undefined;
  skuNo: string | undefined;
  brandName: string;
  productReview: any[];
  productProductPriceId: number;
  productProductPrice: number;
  shortDescription: string;
  consumerDiscount: number;
  askForPrice: string;
  productType: string;
}

export const defaultValues = {
  productPrice: 0,
  offerPrice: 0,
  stock: 0,
  deliveryAfter: 0,
  timeOpen: 0,
  timeClose: 0,
  consumerType: "CONSUMER",
  sellType: "NORMALSELL",
  vendorDiscount: 0,
  consumerDiscount: 0,
  minQuantity: 0,
  maxQuantity: 0,
  minCustomer: 0,
  maxCustomer: 0,
  minQuantityPerCustomer: 0,
  maxQuantityPerCustomer: 0,
  productCondition: "",
  isProductConditionRequired: false,
  isStockRequired: false,
  isOfferPriceRequired: false,
  isDeliveryAfterRequired: false,
  isConsumerTypeRequired: false,
  isSellTypeRequired: false,
};
