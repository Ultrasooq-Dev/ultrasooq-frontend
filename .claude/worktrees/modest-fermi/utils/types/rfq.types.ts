export interface AddRfqQuotesRequest {
  rfqCartIds: number[];
  firstName: string;
  lastName: string;
  phoneNumber: string;
  cc: string;
  address: string;
  city: string;
  province: string;
  country: string;
  postCode: string;
  rfqDate: string;
}

export interface AddFactoriesQuotesRequest {
  factoriesCartIds: number[];
  firstName: string;
  lastName: string;
  phoneNumber: string;
  cc: string;
  address: string;
  city: string;
  province: string;
  country: string;
  postCode: string;
  factoriesDate: string;
}
