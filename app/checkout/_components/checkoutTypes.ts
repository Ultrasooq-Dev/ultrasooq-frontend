export type GuestAddress = {
  firstName: string;
  lastName: string;
  cc: string;
  phoneNumber: string;
  address: string;
  town: string;
  city: string;
  cityId: string;
  state: string;
  stateId: string;
  country: string;
  countryId: string;
  postCode: string;
};

export type ShippingInfoItem = {
  sellerId: number;
  shippingType: string;
  info: {
    shippingDate: null | string;
    fromTime: null | string;
    toTime: null | string;
    shippingCharge: number;
    serviceId: null | number;
    serviceName?: null | string;
  };
};

export type ShippingErrorItem = {
  sellerId: number;
  errors: Record<string, string>;
};

export type ProductPricingInfo = {
  consumerType?: string;
  vendorDiscount?: number;
  vendorDiscountType?: string;
  consumerDiscount?: number;
  consumerDiscountType?: string;
  categoryId?: number;
  categoryLocation?: string;
  categoryConnections?: any[];
};
