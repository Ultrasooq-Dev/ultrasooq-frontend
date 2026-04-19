import { z } from "zod";
import {
  baseProductPriceItemSchema,
  productPriceItemSchemaWhenSetUpPriceTrue,
} from "./productPriceSchemas";

const productVariantsSchema = (t: any) =>
  z.array(
    z.object({
      type: z
        .string()
        .trim()
        .min(3, {
          message: t("variant_type_must_be_equal_greater_than_2_characters"),
        })
        .max(20, {
          message: t("variant_type_must_be_less_than_20_characters"),
        })
        .optional()
        .or(z.literal("")),
      variants: z.array(
        z.object({
          value: z
            .string()
            .trim()
            .min(1, { message: t("value_is_required") })
            .max(20, {
              message: t("value_must_be_less_than_n_characters", { n: 20 }),
            })
            .optional()
            .or(z.literal("")),
          image: z.any().optional(),
        }),
      ),
    }),
  );

const variantPricingListSchema = z
  .array(
    z.object({
      combinationKey: z.string(),
      combinationLabel: z.string(),
      price: z.union([z.coerce.number().min(0), z.literal("")]).optional(),
      stock: z
        .union([z.coerce.number().int().min(0), z.literal("")])
        .optional(),
    }),
  )
  .optional()
  .default([]);

const productShortDescriptionListSchema = (t: any) =>
  z.array(
    z.object({
      shortDescription: z
        .string()
        .trim()
        .min(2, { message: t("short_description_is_required") })
        .max(200, {
          message: t("short_description_must_be_less_than_200_characters"),
        }),
    }),
  );

const productSpecificationListSchema = z
  .array(
    z.object({
      label: z.string().trim().optional().or(z.literal("")),
      specification: z.string().trim().optional().or(z.literal("")),
    }),
  )
  .optional();

const variantSuperRefine = (t: any) => (data: any, ctx: any) => {
  data.productVariants.forEach((productVariant: any, index: number) => {
    const variantsCount = productVariant.variants.filter((el: any) =>
      el.value?.trim(),
    ).length;
    if (productVariant.type?.trim() && variantsCount == 0) {
      ctx.addIssue({
        code: "custom",
        message: t("value_is_required"),
        path: [`productVariants.${index}.variants.0.value`],
      });
    }
    if (variantsCount > 0 && !productVariant.type?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: t("variant_type_is_required"),
        path: [`productVariants.${index}.type`],
      });
    }
  });
};

export const formSchemaForTypeP = (t: any) => {
  return z
    .object({
      productName: z
        .string()
        .trim()
        .min(2, { message: t("product_name_is_required") }),
      categoryId: z.number().optional(),
      categoryLocation: z.string().trim().optional(),
      typeOfProduct: z
        .string({ error: t("provide_you_product_type") })
        .trim(),
      brandId: z.number().optional(),
      productCountryId: z.coerce.number().optional().or(z.literal(0)),
      productStateId: z.coerce.number().optional().or(z.literal(0)),
      productCityId: z.coerce.number().optional().or(z.literal(0)),
      productTown: z.string().trim().optional(),
      productLatLng: z.string().trim().optional(),
      sellCountryIds: z.any().optional(),
      sellStateIds: z.any().optional(),
      sellCityIds: z.any().optional(),
      skuNo: z.string().trim().optional(),
      productCondition: z.string().trim().optional(),
      keywords: z.string().trim().optional(),
      productTagList: z
        .array(z.object({ label: z.string().trim(), value: z.number() }))
        .optional()
        .transform((value) => {
          if (!value || value.length === 0) return [];
          return value.map((item) => ({ tagId: item.value }));
        }),
      productImagesList: z.any().optional(),
      productPrice: z.coerce.number().optional().or(z.literal("")),
      offerPrice: z.coerce.number().optional().or(z.literal("")),
      placeOfOriginId: z.coerce.number().optional().or(z.literal(0)),
      productShortDescriptionList: productShortDescriptionListSchema(t),
      productSpecificationList: productSpecificationListSchema,
      description: z.string().trim().optional(),
      descriptionJson: z.array(z.any()).optional(),
      productPriceList: z.array(baseProductPriceItemSchema(t)).optional(),
      setUpPrice: z.boolean(),
      isStockRequired: z.boolean().optional(),
      isOfferPriceRequired: z.boolean().optional(),
      isCustomProduct: z.boolean().optional(),
      productVariants: productVariantsSchema(t),
      variantPricingList: variantPricingListSchema,
    })
    .superRefine((data, ctx) => {
      variantSuperRefine(t)(data, ctx);
      if (data.setUpPrice) {
        const result = z
          .array(productPriceItemSchemaWhenSetUpPriceTrue(t))
          .safeParse(data.productPriceList);
        if (!result.success) {
          result.error.issues.forEach((issue) => ctx.addIssue(issue as any));
        }
      } else {
        data.productPrice = 0;
        data.offerPrice = 0;
        if (Array.isArray(data.productPriceList)) {
          data.productPriceList = data.productPriceList.map(() => ({
            consumerType: "",
            sellType: "",
            consumerDiscount: 0,
            vendorDiscount: 0,
            consumerDiscountType: "",
            vendorDiscountType: "",
            minCustomer: 0,
            maxCustomer: 0,
            minQuantityPerCustomer: 0,
            maxQuantityPerCustomer: 0,
            minQuantity: 0,
            maxQuantity: 0,
            dateOpen: "",
            dateClose: "",
            timeOpen: 0,
            timeClose: 0,
            startTime: "",
            endTime: "",
            deliveryAfter: 0,
            stock: 0,
          }));
        }
      }
    });
};

export const formSchemaForTypeR = (t: any) => {
  return z
    .object({
      productName: z
        .string()
        .trim()
        .min(2, { message: t("product_name_is_required") }),
      categoryId: z.number().optional(),
      categoryLocation: z.string().trim().optional(),
      typeOfProduct: z
        .string({ error: t("provide_you_product_type") })
        .trim(),
      brandId: z.number().optional(),
      productCondition: z.string().trim().optional(),
      keywords: z.string().trim().optional(),
      productTagList: z
        .array(z.object({ label: z.string().trim(), value: z.number() }))
        .optional()
        .transform((value) => {
          if (!value || value.length === 0) return [];
          const temp: any = [];
          value.forEach((item) => temp.push({ tagId: item.value }));
          return temp;
        }),
      productImagesList: z.any().optional(),
      productPrice: z.coerce.number().optional(),
      offerPrice: z.coerce.number().optional(),
      placeOfOriginId: z.coerce.number().optional().or(z.literal(0)),
      productShortDescriptionList: productShortDescriptionListSchema(t),
      productSpecificationList: productSpecificationListSchema,
      description: z.string().trim().optional(),
      descriptionJson: z.array(z.any()).optional(),
      setUpPrice: z.boolean(),
      isStockRequired: z.boolean().optional(),
      isOfferPriceRequired: z.boolean().optional(),
      isCustomProduct: z.boolean().optional(),
      productVariants: productVariantsSchema(t),
      variantPricingList: variantPricingListSchema,
    })
    .superRefine((data, ctx) => {
      variantSuperRefine(t)(data, ctx);
    });
};

