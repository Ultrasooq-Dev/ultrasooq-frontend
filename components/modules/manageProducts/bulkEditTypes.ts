import { IOption } from "@/utils/types/common.types";

export interface BulkEditSidebarProps {
  onBulkUpdate: (data: any) => void;
  selectedProducts: number[];
  onUpdate: () => void;
  isLoading?: boolean;
}

export type ActiveTab = "warehouse-location" | "product-basic" | "ask-for" | "discounts";

export interface ConfirmAction {
  message: string;
  onConfirm: () => void;
  type: "hide" | "show";
}

export interface BulkEditFormValues {
  // Section checkboxes
  updateWarehouse: boolean;
  updateWhereToSell: boolean;
  updateBasic: boolean;
  updateDiscounts: boolean;
  updateAskFor: boolean;

  // Warehouse fields
  branchId: string;

  // Where to Sell fields
  sellCountryIds: IOption[];
  sellStateIds: IOption[];
  sellCityIds: IOption[];
  placeOfOriginId: string;

  // Basic fields
  enableChat: boolean;

  // Product Condition field
  productCondition: string;

  // Ask For fields
  askForPrice: string;
  askForStock: string;

  // Discount fields
  consumerType: string;
  sellType: string;
  vendorDiscount: number;
  vendorDiscountType: string;
  consumerDiscount: number;
  consumerDiscountType: string;

  // Quantity fields
  minQuantity: number;
  maxQuantity: number;
  minCustomer: number;
  maxCustomer: number;
  minQuantityPerCustomer: number;
  maxQuantityPerCustomer: number;

  // Time fields
  timeOpen: number;
  timeClose: number;

  // Delivery
  deliveryAfter: number;
}

export const BULK_EDIT_DEFAULT_VALUES: BulkEditFormValues = {
  updateWarehouse: false,
  updateWhereToSell: false,
  updateBasic: false,
  updateDiscounts: false,
  updateAskFor: false,

  branchId: "",

  sellCountryIds: [],
  sellStateIds: [],
  sellCityIds: [],
  placeOfOriginId: "",

  enableChat: false,

  productCondition: "",

  askForPrice: "",
  askForStock: "",

  consumerType: "",
  sellType: "",
  vendorDiscount: 0,
  vendorDiscountType: "",
  consumerDiscount: 0,
  consumerDiscountType: "",

  minQuantity: 0,
  maxQuantity: 0,
  minCustomer: 0,
  maxCustomer: 0,
  minQuantityPerCustomer: 0,
  maxQuantityPerCustomer: 0,

  timeOpen: 0,
  timeClose: 0,

  deliveryAfter: 0,
};
