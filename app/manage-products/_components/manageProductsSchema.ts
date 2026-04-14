import { z } from "zod";

export const schema = (t: any) => {
  return (
    z
      .object({
        productPrice: z.number().optional(),
        offerPrice: z.coerce.number().optional(),
        stock: z.coerce.number().optional(),
        deliveryAfter: z.coerce.number().optional(),
        timeOpen: z.coerce.number().optional(),
        timeClose: z.coerce.number().optional(),
        consumerType: z.string().trim().optional(),
        sellType: z.string().trim().optional(),
        vendorDiscount: z.coerce.number().optional(),
        vendorDiscountType: z.coerce.string().optional(),
        consumerDiscount: z.coerce.number().optional(),
        consumerDiscountType: z.coerce.string().optional(),
        minQuantity: z.coerce.number().optional(),
        maxQuantity: z.coerce.number().optional(),
        minCustomer: z.coerce.number().optional(),
        maxCustomer: z.coerce.number().optional(),
        minQuantityPerCustomer: z.coerce.number().optional(),
        maxQuantityPerCustomer: z.coerce.number().optional(),
        productCondition: z.string().optional(),
        isProductConditionRequired: z.boolean().optional(),
        isHiddenRequired: z.boolean().optional(),
        isStockRequired: z.boolean().optional(),
        isOfferPriceRequired: z.boolean().optional(),
        isDeliveryAfterRequired: z.boolean().optional(),
        isConsumerTypeRequired: z.boolean().optional(),
        isSellTypeRequired: z.boolean().optional(),
        isVendorDiscountRequired: z.boolean().optional(),
        isConsumerDiscountRequired: z.boolean().optional(),
        isMinQuantityRequired: z.boolean().optional(),
        isMaxQuantityRequired: z.boolean().optional(),
        isMinCustomerRequired: z.boolean().optional(),
        isMaxCustomerRequired: z.boolean().optional(),
        isMinQuantityPerCustomerRequired: z.boolean().optional(),
        isMaxQuantityPerCustomerRequired: z.boolean().optional(),
      })
      .refine(
        (data) => !data.isProductConditionRequired || !!data.productCondition,
        {
          message: t("product_condition_required"),
          path: ["productCondition"],
        },
      )
      .refine((data) => !data.isDeliveryAfterRequired || !!data.deliveryAfter, {
        message: t("delivery_after_is_required"),
        path: ["deliveryAfter"],
      })
      .refine((data) => !data.isConsumerTypeRequired || !!data.consumerType, {
        message: t("consumer_type_is_required"),
        path: ["consumerType"],
      })
      .refine((data) => !data.isSellTypeRequired || !!data.sellType, {
        message: t("sell_type_is_required"),
        path: ["sellType"],
      })
  );
};
