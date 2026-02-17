export type OrderDetails = {
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
};
