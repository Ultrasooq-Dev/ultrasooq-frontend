import { z } from "zod";

export const baseProductPriceItemSchema = (t: any) => {
  return z.object({
    consumerType: z.string().trim().optional(),
    sellType: z.string().trim().optional(),
    consumerDiscount: z.coerce.number().optional().or(z.literal("")),
    vendorDiscount: z.coerce.number().optional().or(z.literal("")),
    consumerDiscountType: z.coerce.string().optional(),
    vendorDiscountType: z.coerce.string().optional(),
    minCustomer: z.coerce.number().optional().or(z.literal("")),
    maxCustomer: z.coerce.number().optional().or(z.literal("")),
    minQuantityPerCustomer: z.coerce.number().optional().or(z.literal("")),
    maxQuantityPerCustomer: z.coerce.number().optional().or(z.literal("")),
    minQuantity: z.coerce.number().optional().or(z.literal("")),
    maxQuantity: z.coerce.number().optional().or(z.literal("")),
    dateOpen: z.coerce.string().optional(),
    dateClose: z.coerce.string().optional(),
    startTime: z.coerce.string().optional(),
    endTime: z.coerce.string().optional().or(z.literal("")),
    timeOpen: z.coerce.number().optional().or(z.literal("")),
    timeClose: z.coerce.number().optional(),
    deliveryAfter: z.coerce.number().optional().or(z.literal("")),
    stock: z.coerce.number().optional().or(z.literal("")),
  });
};

export const productPriceItemSchemaWhenSetUpPriceTrue = (t: any) => {
  return baseProductPriceItemSchema(t)
    .extend({
      consumerType: z
        .string()
        .trim()
        .min(1, { message: t("consumer_type_is_required") }),
      sellType: z
        .string()
        .trim()
        .min(1, { message: t("sell_type_is_required") }),
      consumerDiscount: z.coerce
        .number()
        .max(100, { message: t("consumer_discount_must_be_less_than_100") }),
      vendorDiscount: z.coerce
        .number()
        .max(100, { message: t("vendor_discount_must_be_less_than_100") }),
      deliveryAfter: z.coerce
        .number()
        .min(1, { message: t("delivery_after_is_required") }),
    })
    .refine(
      ({ minQuantity, maxQuantity, sellType }) =>
        (sellType != "BUYGROUP" && sellType != "WHOLESALE_PRODUCT") ||
        (minQuantity && Number(minQuantity || 0) < Number(maxQuantity || 0)) ||
        (maxQuantity && Number(minQuantity || 0) < Number(maxQuantity || 0)),
      {
        message: t("min_quantity_must_be_less_than_max_quantity"),
        path: ["minQuantity"],
      },
    )
    .refine(
      ({ minQuantityPerCustomer, maxQuantityPerCustomer, sellType, consumerType }) => {
        if (sellType === "TRIAL_PRODUCT" && consumerType !== "EVERYONE") {
          return true;
        }
        return (
          (minQuantityPerCustomer &&
            Number(minQuantityPerCustomer || 0) <
              Number(maxQuantityPerCustomer || 0)) ||
          (maxQuantityPerCustomer &&
            Number(minQuantityPerCustomer || 0) <
              Number(maxQuantityPerCustomer || 0))
        );
      },
      {
        message: t(
          "min_quantity_per_customer_must_be_less_than_max_quantity_per_customer",
        ),
        path: ["minQuantityPerCustomer"],
      },
    )
    .refine(
      ({ minCustomer, maxCustomer }) =>
        (!minCustomer || minCustomer) <= (!maxCustomer || maxCustomer),
      {
        message: t("min_customer_must_be_less_than_or_equal_to_max_customer"),
        path: ["minCustomer"],
      },
    )
    .superRefine((schema, ctx) => {
      const {
        sellType,
        minQuantityPerCustomer,
        maxQuantityPerCustomer,
        minQuantity,
        maxQuantity,
      } = schema;
      if (sellType === "NORMALSELL") {
        if (!minQuantityPerCustomer) {
          ctx.addIssue({
            code: "custom",
            message: t("quantity_per_customer_is_required"),
            path: ["minQuantityPerCustomer"],
          });
        }
        if (!maxQuantityPerCustomer) {
          ctx.addIssue({
            code: "custom",
            message: t("quantity_per_customer_is_required"),
            path: ["maxQuantityPerCustomer"],
          });
        }
      }
      if (sellType === "TRIAL_PRODUCT" && schema.consumerType === "EVERYONE") {
        if (!minQuantityPerCustomer) {
          ctx.addIssue({
            code: "custom",
            message: t("quantity_per_customer_is_required"),
            path: ["minQuantityPerCustomer"],
          });
        }
        if (!maxQuantityPerCustomer) {
          ctx.addIssue({
            code: "custom",
            message: t("quantity_per_customer_is_required"),
            path: ["maxQuantityPerCustomer"],
          });
        }
      }
      if (sellType == "BUYGROUP" || sellType == "WHOLESALE_PRODUCT") {
        if (
          (minQuantity && Number(minQuantity || 0) > Number(maxQuantity || 0)) ||
          (maxQuantity && Number(minQuantity || 0) > Number(maxQuantity || 0))
        ) {
          ctx.addIssue({
            code: "custom",
            message: t("min_quantity_must_be_less_than_max_quantity"),
            path: ["maxQuantity"],
          });
        }
      }
    });
};
