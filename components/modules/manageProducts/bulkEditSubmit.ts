import { BulkEditFormValues } from "./bulkEditTypes";

/**
 * Builds the payload for the general bulk update (warehouse + basic + discounts sections).
 * Returns an empty object when nothing is enabled/changed.
 */
export function buildBulkUpdatePayload(data: BulkEditFormValues): Record<string, any> {
  const updateData: any = {};

  if (data.updateWarehouse) {
    if (data.branchId !== undefined && data.branchId !== "") updateData.branchId = data.branchId;
  }

  if (data.updateBasic) {
    if (data.enableChat !== undefined) updateData.enableChat = data.enableChat;
  }

  if (data.updateDiscounts) {
    if (data.consumerType !== undefined && data.consumerType !== "") updateData.consumerType = data.consumerType;
    if (data.sellType !== undefined && data.sellType !== "") updateData.sellType = data.sellType;
    if (data.deliveryAfter !== undefined) updateData.deliveryAfter = data.deliveryAfter;
    if (data.vendorDiscount !== undefined) {
      updateData.vendorDiscount = data.vendorDiscount;
      if (data.vendorDiscountType !== undefined) updateData.vendorDiscountType = data.vendorDiscountType;
    }
    if (data.consumerDiscount !== undefined) {
      updateData.consumerDiscount = data.consumerDiscount;
      if (data.consumerDiscountType !== undefined) updateData.consumerDiscountType = data.consumerDiscountType;
    }
    if (data.minQuantity !== undefined) updateData.minQuantity = data.minQuantity;
    if (data.maxQuantity !== undefined) updateData.maxQuantity = data.maxQuantity;
    if (data.minCustomer !== undefined) updateData.minCustomer = data.minCustomer;
    if (data.maxCustomer !== undefined) updateData.maxCustomer = data.maxCustomer;
    if (data.minQuantityPerCustomer !== undefined) updateData.minQuantityPerCustomer = data.minQuantityPerCustomer;
    if (data.maxQuantityPerCustomer !== undefined) updateData.maxQuantityPerCustomer = data.maxQuantityPerCustomer;
    if (data.timeOpen !== undefined) updateData.timeOpen = Number(data.timeOpen);
    if (data.timeClose !== undefined) updateData.timeClose = Number(data.timeClose);
  }

  return updateData;
}

/** Builds the discount data object from form values */
export function buildDiscountData(formData: BulkEditFormValues): Record<string, any> {
  const d: any = {
    consumerType: formData.consumerType,
    sellType: formData.sellType,
  };
  if (formData.deliveryAfter !== undefined) d.deliveryAfter = Number(formData.deliveryAfter);
  if (formData.vendorDiscount !== undefined) d.vendorDiscount = Number(formData.vendorDiscount);
  if (formData.vendorDiscountType) d.vendorDiscountType = formData.vendorDiscountType;
  if (formData.consumerDiscount !== undefined) d.consumerDiscount = Number(formData.consumerDiscount);
  if (formData.consumerDiscountType) d.consumerDiscountType = formData.consumerDiscountType;
  if (formData.minQuantity !== undefined) d.minQuantity = Number(formData.minQuantity);
  if (formData.maxQuantity !== undefined) d.maxQuantity = Number(formData.maxQuantity);
  if (formData.minCustomer !== undefined) d.minCustomer = Number(formData.minCustomer);
  if (formData.maxCustomer !== undefined) d.maxCustomer = Number(formData.maxCustomer);
  if (formData.minQuantityPerCustomer !== undefined) d.minQuantityPerCustomer = Number(formData.minQuantityPerCustomer);
  if (formData.maxQuantityPerCustomer !== undefined) d.maxQuantityPerCustomer = Number(formData.maxQuantityPerCustomer);
  if (formData.timeOpen !== undefined) d.timeOpen = Number(formData.timeOpen);
  if (formData.timeClose !== undefined) d.timeClose = Number(formData.timeClose);
  return d;
}
