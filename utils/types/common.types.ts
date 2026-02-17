export interface APIResponseError {
  message: string;
  status: boolean;
  data: unknown;
  response?: {
    data?: { message?: string; status?: boolean };
    status?: number;
    statusText?: string;
  };
}

/** Standard API response wrapper used across mutations/queries */
export interface APIResponse<T = unknown> {
  data: T;
  message: string;
  status: boolean;
}

/** Paginated API response wrapper */
export interface PaginatedAPIResponse<T = unknown> {
  data: T[];
  message: string;
  status: boolean;
  total?: number;
  page?: number;
  limit?: number;
}

export interface ICountries {
  id: number;
  countryName: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  status: string;
}

export interface IAllCountries {
  id: number;
  name: string;
  sortname: string;
  phoneCode: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  status: string;
}

export interface IState {
  id: number;
  name: string;
  sortname: string;
  phoneCode: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  status: string;
}

export interface ICity {
  id: number;
  name: string;
  sortname: string;
  phoneCode: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  status: string;
}

export interface ILocations {
  id: number;
  locationName: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  status: string;
}

export interface IBrands {
  id: number;
  brandName: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  status: string;
}

export interface IUserRoles {
  id: number;
  userRoleName: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  status: string;
}

export interface ISelectOptions {
  label: string;
  value: number;
  children: ISelectOptions[];
}

export interface IRenderProduct {
  id: number;
  productImage: string;
  productName: string;
  categoryName: string;
  skuNo: string;
  brandName: string;
  productPrice: string;
  status?: string;
  priceStatus?: string;
  productProductPriceId?: number;
  productProductPrice?: string;
  isOwner: boolean;
}

export type OptionProps = {
  label: string;
  value: string;
};

export interface TrendingProduct {
  id: number;
  productName: string;
  productPrice: number;
  offerPrice: number;
  productImage: string;
  categoryName: string;
  brandName: string;
  skuNo: string;
  shortDescription: string;
  productReview: {
    rating: number;
  }[];
  status: string;
  productWishlist?: { id: number; productId: number }[];
  inWishlist?: boolean;
  productProductPriceId?: number;
  productProductPrice?: string;
  consumerDiscount?: number;
  consumerDiscountType?: string;
  vendorDiscount?: number;
  vendorDiscountType?: string;
  askForPrice?: string;
  productPrices?: { id: number; offerPrice: number; productPrice: number; adminId: number }[];
  sold?: number;
  categoryId?: number;
  categoryLocation?: string;
  consumerType?: "CONSUMER" | "VENDORS" | "EVERYONE";
}

export type ProductImageProps = {
  path: string;
  id: string;
};

export interface ControlledSelectOptions extends OptionProps {
  icon?: string;
}

export interface IOption {
  readonly label: string;
  readonly value: string;
}
