"use client";
import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Form } from "@/components/ui/form";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTags } from "@/apis/queries/tags.queries";
import BasicInformationSection from "@/components/modules/createProduct/BasicInformationSection";
import ProductDetailsSection from "@/components/modules/createProduct/ProductDetailsSection";
import ProductWizard from "@/components/modules/createProduct/wizard/ProductWizard";
import dynamic from "next/dynamic";

const DescriptionAndSpecificationSection = dynamic(
  () => import("@/components/modules/createProduct/DescriptionAndSpecificationSection"),
  {
    loading: () => <div className="animate-pulse h-64 bg-muted rounded-lg" />,
    ssr: false,
  },
);

import DropshipProductForm from "@/components/modules/createProduct/DropshipProductForm";
import Footer from "@/components/shared/Footer";
import {
  useCreateProduct,
  useProductById,
  useProductVariant,
  useExistingProductById,
  useUpdateSingleProduct,
  useOneProductByProductCondition,
  useUpdateProduct,
} from "@/apis/queries/product.queries";
import { useCurrentAccount } from "@/apis/queries/auth.queries";
import { getCookie } from "cookies-next";
import { ULTRASOOQ_TOKEN_KEY } from "@/utils/constants";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useUploadMultipleFile } from "@/apis/queries/upload.queries";
import {
  BUYGROUP_MENU_ID,
  FACTORIES_MENU_ID,
  RFQ_MENU_ID,
  STORE_MENU_ID,
  imageExtensions,
  videoExtensions,
} from "@/utils/constants";
import BackgroundImage from "@/public/images/before-login-bg.png";
import {
  convertDate,
  convertTime,
  generateRandomSkuNoWithTimeStamp,
  handleDescriptionParse,
} from "@/utils/helper";
import LoaderWithMessage from "@/components/shared/LoaderWithMessage";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { v4 as uuidv4 } from "uuid";
import { fetchSubCategoriesById } from "@/apis/requests/category.requests";
import {
  buildCategoryPathFromLeaf,
  populateFormWithAIData,
} from "@/components/modules/createProduct/wizard/populateFormWithAIData";

const baseProductPriceItemSchema = (t: any) => {
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

const productPriceItemSchemaWhenSetUpPriceTrue = (t: any) => {
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
      ({
        minQuantityPerCustomer,
        maxQuantityPerCustomer,
        sellType,
        consumerType,
      }) => {
        // Skip validation if fields are not required (TRIAL_PRODUCT with non-EVERYONE consumer type)
        if (sellType === "TRIAL_PRODUCT" && consumerType !== "EVERYONE") {
          return true;
        }
        // Apply validation for other cases
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
        minCustomer,
        maxCustomer,
        startTime,
        endTime,
      } = schema;
      // Make quantity per customer optional for BUYGROUP, but required for NORMALSELL
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
      // For TRIAL_PRODUCT, only require quantity per customer fields when consumer type is EVERYONE
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
      // Removed required validations for BUYGROUP fields to make them optional
      // minQuantity, maxQuantity, minCustomer, maxCustomer are now optional for BUYGROUP
      if (sellType == "BUYGROUP" || sellType == "WHOLESALE_PRODUCT") {
        if (
          (minQuantity &&
            Number(minQuantity || 0) > Number(maxQuantity || 0)) ||
          (maxQuantity && Number(minQuantity || 0) > Number(maxQuantity || 0))
        ) {
          ctx.addIssue({
            code: "custom",
            message: t("min_quantity_must_be_less_than_max_quantity"),
            path: ["maxQuantity"],
          });
        }
      }
      // if (sellType === "BUYGROUP") {
      //   if (!startTime) {
      //     ctx.addIssue({ code: "custom", message: t("time_open_is_required"), path: ["startTime"], });
      //   }
      // }
      // if (sellType === "BUYGROUP") {
      //   if (!endTime) {
      //     ctx.addIssue({ code: "custom", message: t("time_close_is_required"), path: ["endTime"], });
      //   }
      // }
    });
};

const formSchemaForTypeP = (t: any) => {
  return z
    .object({
      productName: z
        .string()
        .trim()
        .min(2, { message: t("product_name_is_required") }),
      categoryId: z.number().optional(),
      categoryLocation: z.string().trim().optional(),
      typeOfProduct: z
        .string({
          error: t("provide_you_product_type"),
        })
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
      // Tags are optional; when provided, map them to backend structure
      productTagList: z
        .array(
          z.object({
            label: z.string().trim(),
            value: z.number(),
          }),
        )
        .optional()
        .transform((value) => {
          if (!value || value.length === 0) {
            return [];
          }
          return value.map((item) => ({ tagId: item.value }));
        }),
      productImagesList: z.any().optional(),
      productPrice: z.coerce.number().optional().or(z.literal("")),
      offerPrice: z.coerce.number().optional().or(z.literal("")),
      placeOfOriginId: z.coerce.number().optional().or(z.literal(0)),
      productShortDescriptionList: z.array(
        z.object({
          shortDescription: z
            .string()
            .trim()
            .min(2, { message: t("short_description_is_required") })
            .max(200, {
              message: t("short_description_must_be_less_than_200_characters"),
            }),
        }),
      ),
      // Specifications are optional
      productSpecificationList: z
        .array(
          z.object({
            // Label is optional; empty label is allowed
            label: z
              .string()
              .trim()
              .optional()
              .or(z.literal("")),
            // Specification is optional; no format restrictions
            specification: z
              .string()
              .trim()
              .optional()
              .or(z.literal("")),
          }),
        )
        .optional(),
      description: z.string().trim().optional(),
      descriptionJson: z.array(z.any()).optional(),
      productPriceList: z.array(baseProductPriceItemSchema(t)).optional(),
      setUpPrice: z.boolean(),
      isStockRequired: z.boolean().optional(),
      isOfferPriceRequired: z.boolean().optional(),
      isCustomProduct: z.boolean().optional(),
      productVariants: z.array(
        z.object({
          type: z
            .string()
            .trim()
            .min(3, {
              message: t(
                "variant_type_must_be_equal_greater_than_2_characters",
              ),
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
      ),
      variantPricingList: z
        .array(
          z.object({
            combinationKey: z.string(),
            combinationLabel: z.string(),
            price: z
              .union([z.coerce.number().min(0), z.literal("")])
              .optional(),
            stock: z
              .union([z.coerce.number().int().min(0), z.literal("")])
              .optional(),
          }),
        )
        .optional()
        .default([]),
    })
    .superRefine((data, ctx) => {
      data.productVariants.forEach((productVariant, index) => {
        const variantsCount = productVariant.variants.filter((el) =>
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
          data.productPriceList = data.productPriceList.map((item) => ({
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

const formSchemaForTypeR = (t: any) => {
  return z
    .object({
      productName: z
        .string()
        .trim()
        .min(2, { message: t("product_name_is_required") }),
      categoryId: z.number().optional(),
      categoryLocation: z.string().trim().optional(),
      typeOfProduct: z
        .string({
          error: t("provide_you_product_type"),
        })
        .trim(),
      brandId: z.number().optional(),
      productCondition: z.string().trim().optional(),
      productTagList: z
        .array(
          z.object({
            label: z.string().trim(),
            value: z.number(),
          }),
        )
        .optional()
        .transform((value) => {
          if (!value || value.length === 0) {
            return [];
          }
          const temp: any = [];
          value.forEach((item) => {
            temp.push({ tagId: item.value });
          });
          return temp;
        }),
      productImagesList: z.any().optional(),
      productPrice: z.coerce.number().optional(),
      offerPrice: z.coerce.number().optional(),
      placeOfOriginId: z.coerce.number().optional().or(z.literal(0)),
      productShortDescriptionList: z.array(
        z.object({
          shortDescription: z
            .string()
            .trim()
            .min(2, { message: t("short_description_is_required") })
            .max(200, {
              message: t("short_description_must_be_less_than_200_characters"),
            }),
        }),
      ),
      // Specifications are optional for R-type products as well
      productSpecificationList: z
        .array(
          z.object({
            label: z
              .string()
              .trim()
              .optional()
              .or(z.literal("")),
            specification: z
              .string()
              .trim()
              .optional()
              .or(z.literal("")),
          }),
        )
        .optional(),
      description: z.string().trim().optional(),
      descriptionJson: z.array(z.any()).optional(),
      setUpPrice: z.boolean(),
      isStockRequired: z.boolean().optional(),
      isOfferPriceRequired: z.boolean().optional(),
      isCustomProduct: z.boolean().optional(),
      productVariants: z.array(
        z.object({
          type: z
            .string()
            .trim()
            .min(3, {
              message: t(
                "variant_type_must_be_equal_greater_than_2_characters",
              ),
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
      ),
      variantPricingList: z
        .array(
          z.object({
            combinationKey: z.string(),
            combinationLabel: z.string(),
            price: z
              .union([z.coerce.number().min(0), z.literal("")])
              .optional(),
            stock: z
              .union([z.coerce.number().int().min(0), z.literal("")])
              .optional(),
          }),
        )
        .optional()
        .default([]),
    })
    .superRefine((data, ctx) => {
      data.productVariants.forEach((productVariant, index) => {
        const variantsCount = productVariant.variants.filter((el) =>
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

      if (data.setUpPrice) {
        // if (data.offerPrice === 0) {
        //   ctx.addIssue({
        //     code: "custom",
        //     message: t("offer_price_is_required"),
        //     path: ["offerPrice"],
        //   });
        // }
      }
    });
};

const defaultValues: { [key: string]: any } = {
  productName: "",
  categoryId: 0,
  categoryLocation: "",
  typeOfProduct: "",
  brandId: 0,
  skuNo: "",
  productCondition: "",
  productTagList: undefined,
  productImagesList: undefined,
  productPrice: "",
  offerPrice: "",
  placeOfOriginId: 0,
  // productLocationId: 0,
  productCountryId: 0,
  productStateId: 0,
  productCityId: 0,
  sellCountryIds: [],
  sellStateIds: [],
  sellCityIds: [],
  productTown: "",
  productLatLng: "",
  isDropshipable: false,
  productShortDescriptionList: [
    {
      shortDescription: "",
    },
  ],
  productSpecificationList: [
    {
      label: "",
      specification: "",
    },
  ],
  description: "",
  descriptionJson: [],
  productImages: [],
  productPriceList: [
    {
      consumerType: "CONSUMER",
      sellType: "NORMALSELL",
      consumerDiscount: "",
      vendorDiscount: "",
      consumerDiscountType: "",
      vendorDiscountType: "",
      minCustomer: "",
      maxCustomer: "",
      minQuantityPerCustomer: "",
      maxQuantityPerCustomer: "",
      minQuantity: "",
      maxQuantity: "",
      dateOpen: "",
      dateClose: "",
      timeOpen: "",
      timeClose: "",
      startTime: "",
      endTime: "",
      deliveryAfter: "",
      stock: "",
    },
  ],
  setUpPrice: true,
  isStockRequired: false,
  isOfferPriceRequired: false,
  isCustomProduct: false,
  productVariants: [
    {
      type: "",
      variants: [
        {
          value: "",
          image: null,
        },
      ],
    },
  ],
  variantPricingList: [],
};

const CreateProductPage = () => {
  const t = useTranslations();
  const { langDir } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const productId =
    searchParams?.get("copy") ||
    searchParams?.get("productId") ||
    searchParams?.get("existingProductId");
  const isEditMode = searchParams?.get("edit") === "true";
  const editProductPriceId = searchParams?.get("productPriceId");
  const { toast } = useToast();
  const [activeProductType, setActiveProductType] = useState<string>();
  const [activeTab, setActiveTab] = useState<"create" | "dropship">("create");
  const [isClient, setIsClient] = useState(false);
  const form = useForm({
    resolver: zodResolver(
      activeProductType === "R" ? formSchemaForTypeR(t) : formSchemaForTypeP(t),
    ) as any,
    defaultValues,
  });

  // Ensure component only renders on client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Handle tab parameter from URL and set isDropshipable for wholesale products
  useEffect(() => {
    if (isClient && searchParams) {
      const tab = searchParams.get("tab");
      const productType = searchParams.get("productType");

      if (tab === "dropship" || productType === "D") {
        setActiveTab("dropship");
      } else {
        setActiveTab("create");
      }

      // Set isDropshipable to true if productType=D
      if (productType === "D") {
        form.setValue("isDropshipable", true);
      }
    }
  }, [isClient, searchParams, form]);

  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

  // Query for product data when editing
  const editProductQuery = useOneProductByProductCondition(
    {
      productId: parseInt(productId || "0"),
      productPriceId: parseInt(editProductPriceId || "0"),
    },
    isEditMode && !!editProductPriceId && !!productId,
  );

  // Pre-fill form for edit mode using fetched data
  useEffect(() => {
    if (isEditMode && editProductQuery.data?.data) {
      const productData = editProductQuery.data.data;

      // Based on console output, check if there's additional data in nested objects
      const productPriceData = productData;

      // Check if there's data in the product_productPrice array
      let priceSpecificData = {};
      if (
        productData.product_productPrice &&
        Array.isArray(productData.product_productPrice) &&
        productData.product_productPrice.length > 0
      ) {
        priceSpecificData = productData.product_productPrice[0];
      }

      // Try to find the missing fields in different possible locations
      // Check if there's any other nested object that might contain the missing data
      let additionalData = {};
      Object.keys(productData).forEach((key) => {
        if (
          typeof productData[key] === "object" &&
          productData[key] !== null &&
          !Array.isArray(productData[key])
        ) {
          if (
            productData[key].consumerType ||
            productData[key].sellType ||
            productData[key].stock
          ) {
            additionalData = productData[key];
          }
        }
      });

      // Create productPriceList array as expected by the form
      // Use the best available data source for price-related fields
      const priceData =
        Object.keys(priceSpecificData).length > 0
          ? priceSpecificData
          : Object.keys(additionalData).length > 0
            ? additionalData
            : productData;

      // Enhanced field extraction with multiple variations
      const getFieldValue = (
        obj: any,
        fieldVariations: string[],
        defaultValue: any = null,
      ) => {
        for (const field of fieldVariations) {
          if (
            obj &&
            obj[field] !== undefined &&
            obj[field] !== null &&
            obj[field] !== ""
          ) {
            return obj[field];
          }
        }
        return defaultValue;
      };

      const productPriceList = [
        {
          consumerType:
            getFieldValue(priceData, [
              "consumerType",
              "consumer_type",
              "consumerTypeId",
              "consumer_type_id",
            ]) ||
            getFieldValue(productData, [
              "consumerType",
              "consumer_type",
              "consumerTypeId",
              "consumer_type_id",
            ]) ||
            "CONSUMER",
          sellType:
            getFieldValue(priceData, [
              "sellType",
              "sell_type",
              "sellTypeId",
              "sell_type_id",
            ]) ||
            getFieldValue(productData, [
              "sellType",
              "sell_type",
              "sellTypeId",
              "sell_type_id",
            ]) ||
            "NORMALSELL",
          productPrice: parseInt(
            productData.productPrice || productData.offerPrice || 0,
          ),
          offerPrice: parseInt(productData.offerPrice || 0),
          stock:
            getFieldValue(priceData, [
              "stock",
              "stockQuantity",
              "quantity",
              "availableStock",
            ]) ||
            getFieldValue(productData, [
              "stock",
              "stockQuantity",
              "quantity",
              "availableStock",
            ]) ||
            0,
          deliveryAfter: priceData.deliveryAfter || 0,
          timeOpen: priceData.timeOpen || 0,
          timeClose: priceData.timeClose || 0,
          dateOpen: priceData.dateOpen || "",
          dateClose: priceData.dateClose || "",
          startTime: priceData.startTime || "",
          endTime: priceData.endTime || "",
          consumerDiscount: priceData.consumerDiscount || 0,
          vendorDiscount: priceData.vendorDiscount || 0,
          consumerDiscountType: priceData.consumerDiscountType || "PERCENTAGE",
          vendorDiscountType: priceData.vendorDiscountType || "PERCENTAGE",
          minCustomer: priceData.minCustomer || 0,
          maxCustomer: priceData.maxCustomer || 0,
          minQuantity: priceData.minQuantity || 0,
          maxQuantity: priceData.maxQuantity || 0,
          minQuantityPerCustomer: priceData.minQuantityPerCustomer || 0,
          maxQuantityPerCustomer: priceData.maxQuantityPerCustomer || 0,
          askForPrice: (() => {
            // If product has actual price values, set askForPrice to NO
            const hasActualPrice =
              productData.productPrice && productData.productPrice > 0;
            const hasActualOfferPrice =
              productData.offerPrice && productData.offerPrice > 0;
            if (hasActualPrice || hasActualOfferPrice) {
              return "NO";
            }
            return priceData.askForPrice || "NO";
          })(),
          askForStock: (() => {
            // If product has actual stock value, set askForStock to NO
            const hasActualStock = productData.stock && productData.stock > 0;
            if (hasActualStock) {
              return "NO";
            }
            return priceData.askForStock || "NO";
          })(),
          status: priceData.status || "ACTIVE",
        },
      ];

      const editData = {
        // Basic product information
        productName: productData.productName || "",
        productCondition:
          productData.productCondition ||
          productData.product_productPrice?.[0]?.productCondition ||
          "New",
        categoryId: productData.categoryId || 0,
        brandId: productData.brandId || 0,
        skuNo: productData.skuNo || "",
        description: productData.description || "",
        shortDescription: productData.shortDescription || "",

        // Location information (use enhanced field extraction from multiple sources)
        productCountryId: Number(
          getFieldValue(productData, [
            "productCountryId",
            "countryId",
            "country_id",
          ]) ||
            (productData.product_productPrice?.[0]
              ? getFieldValue(productData.product_productPrice[0], [
                  "productCountryId",
                  "countryId",
                  "country_id",
                ])
              : null) ||
            0,
        ),
        productStateId: Number(
          getFieldValue(productData, [
            "productStateId",
            "stateId",
            "state_id",
          ]) ||
            (productData.product_productPrice?.[0]
              ? getFieldValue(productData.product_productPrice[0], [
                  "productStateId",
                  "stateId",
                  "state_id",
                ])
              : null) ||
            0,
        ),
        productCityId: Number(
          getFieldValue(productData, ["productCityId", "cityId", "city_id"]) ||
            (productData.product_productPrice?.[0]
              ? getFieldValue(productData.product_productPrice[0], [
                  "productCityId",
                  "cityId",
                  "city_id",
                ])
              : null) ||
            0,
        ),
        productTown:
          getFieldValue(productData, ["productTown", "town", "product_town"]) ||
          (productData.product_productPrice?.[0]
            ? getFieldValue(productData.product_productPrice[0], [
                "productTown",
                "town",
                "product_town",
              ])
            : null) ||
          "",
        productLatLng:
          getFieldValue(productData, [
            "productLatLng",
            "latLng",
            "lat_lng",
            "coordinates",
          ]) ||
          (productData.product_productPrice?.[0]
            ? getFieldValue(productData.product_productPrice[0], [
                "productLatLng",
                "latLng",
                "lat_lng",
                "coordinates",
              ])
            : null) ||
          "",
        placeOfOriginId: Number(productData.placeOfOriginId || 1),

        // Selling locations
        sellCountryIds: productData.sellCountryIds || [],
        sellStateIds: productData.sellStateIds || [],
        sellCityIds: productData.sellCityIds || [],

        // Price information (use the actual values from console)
        productPrice: parseInt(
          productData.productPrice || productData.offerPrice || 0,
        ),
        offerPrice: parseInt(productData.offerPrice || 0),
        productPriceList: productPriceList,
        setUpPrice: true,

        // Stock and offer requirements - use the corrected values from productPriceList
        isStockRequired: productPriceList[0].askForStock === "YES",
        isOfferPriceRequired: productPriceList[0].askForPrice === "YES",
        isCustomProduct: productData.isCustomProduct || false,

        // Lists and arrays - handle nested data structures
        productShortDescriptionList:
          productData.product_productShortDescription ||
          productData.productShortDescriptionList ||
          [],
        productSpecificationList:
          productData.product_productSpecification ||
          productData.productSpecificationList ||
          [],
        productTagList: productData.productTagList || [],
        productImagesList:
          productData.productImages || productData.productImagesList || [],

        // Handle description JSON (parse if it's a string)
        descriptionJson: (() => {
          try {
            if (
              typeof productData.description === "string" &&
              productData.description.startsWith("[")
            ) {
              return JSON.parse(productData.description);
            }
            return productData.descriptionJson || [];
          } catch (e) {
            return [];
          }
        })(),

        // Additional fields
        typeOfProduct:
          productData.typeOfProduct || productData.typeOfProduct || "BRAND",
        categoryLocation: productData.categoryLocation || "",
      };

      // Reset form first to ensure clean state
      form.reset();

      // Set form values first
      Object.entries(editData).forEach(([key, value]) => {
        form.setValue(key as any, value);
      });

      // Set category IDs - try multiple times to ensure it works
      if (editData.categoryLocation && editData.categoryLocation.trim()) {
        const categoryIds = editData.categoryLocation
          .split(",")
          .filter((item: string) => item.trim());

        // Set immediately
        setSelectedCategoryIds(categoryIds);

        // Also set after delays to ensure component has loaded
        setTimeout(() => {
          setSelectedCategoryIds(categoryIds);
        }, 200);

        setTimeout(() => {
          setSelectedCategoryIds(categoryIds);
        }, 500);

        setTimeout(() => {
          setSelectedCategoryIds(categoryIds);
        }, 1000);
      }

      // Force form to re-render by triggering a change event
      setTimeout(() => {
        form.trigger(); // This will trigger validation and re-render
      }, 100);

      // Manually set critical fields with the correct values from our mapping
      form.setValue(
        "productPriceList.0.consumerType",
        productPriceList[0].consumerType,
      );
      form.setValue(
        "productPriceList.0.sellType",
        productPriceList[0].sellType,
      );
      form.setValue("productPriceList.0.stock", productPriceList[0].stock);

      // Set location fields if they're missing or have default values
      const currentValues = form.getValues();
      if (!currentValues.productStateId || currentValues.productStateId === 0) {
        form.setValue("productStateId", 1); // Default state
      }
      if (!currentValues.productCityId || currentValues.productCityId === 0) {
        form.setValue("productCityId", 1); // Default city
      }
      if (
        !currentValues.productCountryId ||
        currentValues.productCountryId === 0
      ) {
        form.setValue("productCountryId", 1); // Default country (India)
      }
      if (!currentValues.productTown || currentValues.productTown === "") {
        form.setValue("productTown", "Default Town"); // Default town
      }
      if (!currentValues.productLatLng || currentValues.productLatLng === "") {
        form.setValue("productLatLng", "0,0"); // Default coordinates
      }

      // Set product type based on sell type
      if (priceData.sellType === "BUYGROUP") {
        setActiveProductType("R");
      } else {
        setActiveProductType("P");
      }
    }
  }, [isEditMode, editProductQuery.data, form]);

  const uploadMultiple = useUploadMultipleFile();
  const tagsQuery = useTags();
  const createProduct = useCreateProduct();
  const updateProductPrice = useUpdateSingleProduct();
  const updateProductFull = useUpdateProduct();
  const watchProductImages = form.watch("productImages");
  const watchSetUpPrice = form.watch("setUpPrice");

  // Get current account to ensure we use the correct user ID
  const { data: currentAccount } = useCurrentAccount();

  // Query for user's own product (for copy from manage-products or regular view)
  const productQueryById = useProductById(
    {
      productId: productId || "",
    },
    !!productId &&
      (!searchParams?.get("copy") ||
        searchParams?.get("fromExisting") !== "true"),
  );

  // Query for existing product when copying from existing products catalog (admin-added products)
  const existingProductQueryById = useExistingProductById(
    {
      existingProductId: productId || "",
    },
    !!productId && searchParams?.get("fromExisting") === "true",
  );

  const getProductVariant = useProductVariant();

  const memoizedTags = useMemo(() => {
    return (
      tagsQuery?.data?.data.map((item: { id: string; tagName: string }) => {
        return { label: item.tagName, value: item.id };
      }) || []
    );
  }, [tagsQuery?.data]);

  const handleUploadedFile = async (list: any[]) => {
    if (list?.length) {
      const formData = new FormData();

      list.forEach((item: { path: File; id: string }) => {
        formData.append("content", item.path);
      });

      const response = await uploadMultiple.mutateAsync(formData);
      if (response.status && response.data) {
        return response.data;
      }
    }
  };

  const fetchProductVariant = async (productPriceId: number) => {
    const product = productQueryById?.data?.data;
    const response = await getProductVariant.mutateAsync([productPriceId]);
    const variants = response?.data?.[0]?.object || [];
    if (variants.length > 0) {
      const productSellerImages = product?.product_productPrice?.[0]
        ?.productPrice_productSellerImage?.length
        ? product?.product_productPrice?.[0]?.productPrice_productSellerImage
        : product?.productImages?.length
          ? product?.productImages
          : [];

      const variantTypes = [
        ...new Set(variants.map((variant: any) => variant.type)),
      ];
      form.setValue(
        "productVariants",
        variantTypes.map((type: any) => {
          return {
            type: type,
            variants: variants
              .filter((variant: any) => variant.type == type)
              .map((variant: any) => {
                return {
                  value: variant.value,
                  image:
                    productSellerImages?.find((image: any) => {
                      return (
                        image.variant &&
                        image.variant?.type == type &&
                        image.variant?.value == variant.value
                      );
                    })?.image || null,
                };
              }),
          };
        }) as any,
      );
    }
  };

  useEffect(() => {
    // Handle regular product data (including copy from manage-products)
    if (productQueryById?.data?.data && !searchParams?.get("fromExisting")) {
      const product = productQueryById?.data?.data;
      populateFormWithProductData(product);
    }
  }, [productQueryById?.data?.data, searchParams]);

  useEffect(() => {
    // Handle existing product data when copying from existing products catalog
    if (
      existingProductQueryById?.data?.data &&
      searchParams?.get("fromExisting") === "true"
    ) {
      const existingProduct = existingProductQueryById?.data?.data;
      // Determine if categoryLocation is already a valid numeric path (e.g. "1,2,4,99,101")
      const hasValidCategoryLocation =
        typeof existingProduct.categoryLocation === "string" &&
        existingProduct.categoryLocation.trim().length > 0 &&
        /^[0-9]+(,[0-9]+)*$/.test(existingProduct.categoryLocation.trim());

      // Fetch category path if categoryLocation is missing or invalid (e.g. contains names like "Electronics/Laptops")
      if (!hasValidCategoryLocation && existingProduct.categoryId) {
        // Function to build full category path (root -> ... -> leaf) by traversing parent chain
        const buildCategoryPath = async (
          categoryId: number,
        ): Promise<number[]> => {
          try {
            const res = await fetchSubCategoriesById({
              categoryId: String(categoryId),
            });
            const categoryData = res.data?.data;

            // If categoryLocation exists in the data, we can trust it and just split it
            if (categoryData?.categoryLocation) {
              return categoryData.categoryLocation
                .split(",")
                .map((id: string) => Number(id.trim()))
                .filter((id: number) => !Number.isNaN(id));
            }

            // If no parentId (or parentId equals id), this is the root category
            if (!categoryData?.parentId || categoryData.parentId === categoryId) {
              return [categoryId];
            }

            // Recursively fetch parent path, then append current categoryId
            const parentPath = await buildCategoryPath(categoryData.parentId);
            const fullPath = [...parentPath, categoryId];
            return fullPath;
          } catch (error) {
            // Fallback: return just this categoryId
            return [categoryId];
          }
        };

        // Build the full path and convert to comma-separated string
        buildCategoryPath(existingProduct.categoryId)
          .then((pathIds) => {
            const categoryLocation = pathIds.join(",");

            const updatedProduct = {
              ...existingProduct,
              categoryLocation,
            };

            setTimeout(() => {
              populateFormWithExistingProductData(updatedProduct);
            }, 100);
          })
          .catch((err) => {
            console.error("🔵 [DEBUG] Error building category path:", err);
            // Fallback: use categoryId as categoryLocation
            const updatedProduct = {
              ...existingProduct,
              categoryLocation: String(existingProduct.categoryId),
            };
            setTimeout(() => {
              populateFormWithExistingProductData(updatedProduct);
            }, 100);
          });
      } else {
        // categoryLocation exists, proceed normally
        setTimeout(() => {
          populateFormWithExistingProductData(existingProduct);
        }, 100);
      }
    }
  }, [existingProductQueryById?.data?.data, searchParams]);

  // Handle AI-generated product data (autoFill)
  useEffect(() => {
    if (isClient && searchParams) {
      // Check for selectedCategoryIds from URL (for AI matching)
      const categoryIdsParam = searchParams.get('selectedCategoryIds');
      if (categoryIdsParam) {
        const categoryIds = categoryIdsParam.split(',').filter(Boolean);
        setSelectedCategoryIds(categoryIds);
      }

      // Handle autoFill parameter and data
      if (searchParams.get("autoFill") === "true") {
        const dataParam = searchParams.get("data");
        if (dataParam) {
          try {
            const aiData = JSON.parse(decodeURIComponent(dataParam));
            populateFormWithAIData(form, aiData, setSelectedCategoryIds).then(() => {
              toast({
                title: t("product_data_loaded") || "Product Data Loaded",
                description: t("ai_data_loaded_successfully") || "AI-generated data loaded successfully. Please review and complete the form.",
              });
            });
          } catch (error) {
            console.error("Error parsing AI data:", error);
            toast({
              title: t("error") || "Error",
              description: t("failed_to_load_ai_data") || "Failed to load AI-generated data",
              variant: "destructive",
            });
          }
        }
      }
    }
  }, [isClient, searchParams, toast, t]);

  const populateFormWithProductData = (product: any) => {
    setActiveProductType(product.productType);

    form.setValue("categoryId", product.categoryId);
    form.setValue("categoryLocation", product.categoryLocation);
    setSelectedCategoryIds(
      product.categoryLocation
        ? product.categoryLocation.split(",").filter((item: string) => item)
        : [],
    );

    form.setValue("productName", product.productName);
    form.setValue("typeOfProduct", product.typeOfProduct);
    form.setValue("brandId", product.brandId);
    form.setValue(
      "productCondition",
      product.product_productPrice?.[0]?.productCondition || "New",
    );
    const productTagList =
      product.productTags
        ?.filter((item: any) => item.productTagsTag)
        ?.map((item: any) => {
          return {
            label: item.productTagsTag.tagName,
            value: item.productTagsTag.id,
          };
        }) || [];
    form.setValue("productTagList", productTagList);
    // Trigger validation after setting tags
    setTimeout(() => {
      form.trigger("productTagList");
    }, 100);

    const productSellerImages = product?.product_productPrice?.[0]
      ?.productPrice_productSellerImage?.length
      ? product?.product_productPrice?.[0]?.productPrice_productSellerImage
      : product?.productImages?.length
        ? product?.productImages
        : [];

    const productImages =
      productSellerImages
        ?.filter((item: any) => item.image)
        .map((item: any) => ({
          id: item.id,
          path: item.image,
          name: item.imageName || "product-image",
          type: "image",
        })) || [];

    form.setValue("productImages", productImages);
    form.setValue("productPrice", product.productPrice);
    form.setValue("offerPrice", product.offerPrice);
    form.setValue("description", product.description);
    form.setValue("specification", product.specification);
    form.setValue("shortDescription", product.shortDescription);
    form.setValue("barcode", product.barcode);
    form.setValue("placeOfOriginId", product.placeOfOriginId);
    form.setValue("productType", product.productType);
    form.setValue("typeProduct", product.typeProduct);

    form.setValue(
      "productSpecificationList",
      product.product_productSpecification?.map((item: any) => {
        return {
          label: item.label,
          specification: item.specification,
        };
      }) || [],
    );

    if (product.product_productPrice?.length) {
      fetchProductVariant(product.product_productPrice?.[0]?.id);
    }
  };

  const populateFormWithExistingProductData = (existingProduct: any) => {
    // 1) Type of product (needed for brand query)
    // Prefer the value coming from backend; if missing, infer from presence of brandId:
    // - If brandId exists -> "BRAND"
    // - Otherwise -> "OWNBRAND"
    const inferredTypeOfProduct =
      existingProduct.typeOfProduct ||
      (existingProduct.brandId ? "BRAND" : "OWNBRAND");

    const typeOfProduct = inferredTypeOfProduct;
    form.setValue("typeOfProduct", typeOfProduct);
    setActiveProductType(existingProduct.productType);

    // 2) Category path
    // Backend sometimes returns categoryLocation as null; fall back to single-level path from categoryId.
    const rawCategoryLocation =
      existingProduct.categoryLocation ||
      (existingProduct.categoryId ? String(existingProduct.categoryId) : "");

    const categoryIds = rawCategoryLocation
      ? rawCategoryLocation.split(",").filter((item: string) => item.trim())
      : [];

    form.setValue("categoryId", existingProduct.categoryId || 0);
    form.setValue("categoryLocation", rawCategoryLocation || "");

    setSelectedCategoryIds(categoryIds);

    // 3) Basic fields
    form.setValue("productName", existingProduct.productName);

    // 4) Brand
    // Store brandId and brandName in form so BrandSelect can always build an option
    if (existingProduct.brandId) {
      form.setValue("brandId", existingProduct.brandId);
      form.setValue("brandName", existingProduct.brand?.brandName || "");
    }
    form.setValue("productCondition", "New"); // Default for existing products
    const productTagList =
      existingProduct.existingProductTags
        ?.filter((item: any) => item.existingProductTag)
        ?.map((item: any) => {
          return {
            label: item.existingProductTag.tagName,
            value: item.existingProductTag.id,
          };
        }) || [];
    form.setValue("productTagList", productTagList);
    // Trigger validation after setting tags
    setTimeout(() => {
      form.trigger("productTagList");
    }, 100);

    // Use existingProductImages for existing products
    const productImages =
      existingProduct.existingProductImages
        ?.filter((item: any) => item.image)
        .map((item: any) => ({
          id: item.id,
          path: item.image,
          name: item.imageName || "product-image",
          type: "image",
        })) || [];

    form.setValue("productImages", productImages);
    form.setValue("productPrice", existingProduct.productPrice);
    form.setValue("offerPrice", existingProduct.offerPrice);
    form.setValue("description", existingProduct.description);

    // Parse description JSON if it exists, otherwise create proper Slate format
    if (existingProduct.description) {
      try {
        const descriptionJson = JSON.parse(existingProduct.description);
        // Validate that it's a proper Slate format
        if (Array.isArray(descriptionJson) && descriptionJson.length > 0) {
          form.setValue("descriptionJson", descriptionJson);
        } else {
          // If it's not a proper Slate format, create one
          form.setValue("descriptionJson", [
            {
              id: "1",
              type: "p",
              children: [{ text: existingProduct.description }],
            },
          ]);
        }
      } catch (e) {
        // Create proper Slate format from plain text
        form.setValue("descriptionJson", [
          {
            id: "1",
            type: "p",
            children: [{ text: existingProduct.description }],
          },
        ]);
      }
    } else {
      // Default empty Slate format
      form.setValue("descriptionJson", [
        {
          id: "1",
          type: "p",
          children: [{ text: "" }],
        },
      ]);
    }

    // Set product specifications - ExistingProduct has specification as a simple string field
    if (existingProduct.specification && existingProduct.specification.trim()) {
      // Try to parse as JSON first, if it fails, treat as plain text
      try {
        const specData = JSON.parse(existingProduct.specification);
        if (Array.isArray(specData) && specData.length > 0) {
          const productSpecificationList = specData.map((item: any) => ({
            label: item.label || "",
            specification: item.specification || "",
          }));
          form.setValue("productSpecificationList", productSpecificationList);
        } else {
          // If it's not an array, create a single specification entry
          form.setValue("productSpecificationList", [
            {
              label: "Specification",
              specification: existingProduct.specification,
            },
          ]);
        }
      } catch (e) {
        // If parsing fails, treat as plain text
        form.setValue("productSpecificationList", [
          {
            label: "Specification",
            specification: existingProduct.specification,
          },
        ]);
      }
    } else {
      // Default empty specification
      form.setValue("productSpecificationList", [
        {
          label: "",
          specification: "",
        },
      ]);
    }

    // Set product short descriptions - ExistingProduct has shortDescription as a simple string field
    if (
      existingProduct.shortDescription &&
      existingProduct.shortDescription.trim()
    ) {
      // Try to parse as JSON first, if it fails, treat as plain text
      try {
        const shortDescData = JSON.parse(existingProduct.shortDescription);
        if (Array.isArray(shortDescData) && shortDescData.length > 0) {
          const productShortDescriptionList = shortDescData.map(
            (item: any) => ({
              shortDescription: item.shortDescription || "",
            }),
          );
          form.setValue(
            "productShortDescriptionList",
            productShortDescriptionList,
          );
        } else {
          // If it's not an array, create a single short description entry
          form.setValue("productShortDescriptionList", [
            {
              shortDescription: existingProduct.shortDescription,
            },
          ]);
        }
      } catch (e) {
        // If parsing fails, treat as plain text
        form.setValue("productShortDescriptionList", [
          {
            shortDescription: existingProduct.shortDescription,
          },
        ]);
      }
    } else {
      // Default empty short description
      form.setValue("productShortDescriptionList", [
        {
          shortDescription: "",
        },
      ]);
    }

    form.setValue("shortDescription", existingProduct.shortDescription);
    form.setValue("barcode", existingProduct.barcode);
    form.setValue("placeOfOriginId", existingProduct.placeOfOriginId);
    form.setValue("productType", existingProduct.productType);
    form.setValue("typeProduct", existingProduct.typeProduct);
  };

  const onSubmit = async (formData: any) => {
    // Get the current user ID from the current account for debugging
    const currentUserId = currentAccount?.data?.account?.id;

    if (!currentUserId) {
      toast({
        title: t("error"),
        description: t("unable_to_determine_account"),
        variant: "danger",
      });
      return;
    }

    // Check if this is a wholesale/dropship product from URL
    const isWholesaleProduct = searchParams?.get("productType") === "D";

    const updatedFormData = {
      ...formData,
      productType:
        activeProductType === "R"
          ? "R"
          : activeProductType === "F"
            ? "F"
            : isWholesaleProduct
              ? "D" // Wholesale/Dropship product from URL
              : formData.isDropshipable === true
                ? "D" // Wholesale/Dropship product from form
                : "P", // Regular product
      isDropshipable: isWholesaleProduct || formData.isDropshipable === true, // Set based on URL or form
      status:
        activeProductType === "R" || activeProductType === "F"
          ? "ACTIVE"
          : "INACTIVE",
    };

    updatedFormData.productImagesList = [];

    if (watchProductImages.length) {
      const fileTypeArrays = watchProductImages.filter(
        (item: any) => typeof item.path === "object",
      );

      const imageUrlArray: any = fileTypeArrays?.length
        ? await handleUploadedFile(fileTypeArrays)
        : [];

      updatedFormData.productImages = [
        ...watchProductImages
          .filter((item: any) => typeof item.path === "string")
          .map((item: any) => item.path),
        ...imageUrlArray,
      ];

      if (updatedFormData.productImages.length) {
        updatedFormData.productImagesList = updatedFormData.productImages.map(
          (item: string) => {
            const extension = item.split(".").pop()?.toLowerCase();

            if (extension) {
              if (videoExtensions.includes(extension)) {
                const videoName: string = item.split("/").pop()!;
                return { video: item, videoName };
              } else if (imageExtensions.includes(extension)) {
                const imageName: string = item.split("/").pop()!;
                return { image: item, imageName };
              }
            }

            return { image: item, imageName: item };
          },
        );
      }
    }
    const randomSkuNo = generateRandomSkuNoWithTimeStamp().toString();

    delete updatedFormData.productImages;
    updatedFormData.productPriceList = [
      {
        ...(activeProductType !== "R" && updatedFormData.productPriceList[0]),
        askForStock: updatedFormData.isStockRequired ? "true" : "false",
        askForPrice: updatedFormData.isOfferPriceRequired ? "true" : "false",
        isCustomProduct: updatedFormData.isCustomProduct ? "true" : "false",
        productPrice: updatedFormData.isOfferPriceRequired
          ? 0
          : activeProductType === "R"
            ? (updatedFormData.offerPrice ?? 0)
            : (updatedFormData.productPrice ?? 0),
        offerPrice: updatedFormData.isOfferPriceRequired
          ? 0
          : activeProductType === "R"
            ? (updatedFormData.offerPrice ?? 0)
            : (updatedFormData.productPrice ?? 0),
        stock: updatedFormData.isStockRequired
          ? 0
          : updatedFormData.productPriceList?.[0]?.stock
            ? updatedFormData.productPriceList[0].stock
            : 0,
        productCountryId: updatedFormData.productCountryId,
        productStateId: updatedFormData.productStateId,
        productCityId: updatedFormData.productCityId,
        productCondition: updatedFormData.productCondition,
        productTown: updatedFormData.productTown,
        productLatLng: updatedFormData.productLatLng,
        sellCountryIds: updatedFormData.sellCountryIds,
        sellStateIds: updatedFormData.sellStateIds,
        sellCityIds: updatedFormData.sellCityIds,
        status:
          activeProductType === "R"
            ? updatedFormData.offerPrice || updatedFormData.isOfferPriceRequired
              ? "ACTIVE"
              : "INACTIVE"
            : updatedFormData.productPrice ||
                updatedFormData.isOfferPriceRequired
              ? "ACTIVE"
              : "INACTIVE",
      },
    ];

    if (activeProductType === "R") {
      updatedFormData.productPriceList[0] = {
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
        timeOpen: 0,
        timeClose: 0,
        deliveryAfter: 0,
        stock: 0,
        askForStock: updatedFormData.isStockRequired ? "true" : undefined,
        askForPrice: updatedFormData.isOfferPriceRequired ? "true" : undefined,
        ...updatedFormData.productPriceList[0],
      };
      delete updatedFormData.productPriceList[0].productCountryId;
      delete updatedFormData.productPriceList[0].productStateId;
      delete updatedFormData.productPriceList[0].productCityId;
      delete updatedFormData.productPriceList[0].productTown;
      delete updatedFormData.productPriceList[0].productLatLng;
      delete updatedFormData.productPriceList[0].sellCountryIds;
      delete updatedFormData.productPriceList[0].sellStateIds;
      delete updatedFormData.productPriceList[0].sellCityIds;
    }

    if (updatedFormData.productPriceList?.[0]?.sellType == "NORMALSELL") {
      updatedFormData.productPriceList[0].menuId = STORE_MENU_ID;
    }
    if (updatedFormData.productPriceList?.[0]?.sellType == "BUYGROUP") {
      updatedFormData.productPriceList[0].menuId = BUYGROUP_MENU_ID;
    }
    if (updatedFormData.productPriceList?.[0]?.sellType == "TRIAL_PRODUCT") {
      updatedFormData.productPriceList[0].menuId = STORE_MENU_ID; // Trial products use store menu
    }
    if (
      updatedFormData.productPriceList?.[0]?.sellType == "WHOLESALE_PRODUCT"
    ) {
      updatedFormData.productPriceList[0].menuId = STORE_MENU_ID; // Wholesale products use store menu
    }
    if (updatedFormData.isCustomProduct) {
      updatedFormData.productPriceList[0].menuId = FACTORIES_MENU_ID;
    }
    if (activeProductType == "R") {
      updatedFormData.productPriceList[0].menuId = RFQ_MENU_ID;
    }

    // delete updatedFormData.productLocationId;
    delete updatedFormData.productCountryId;
    delete updatedFormData.productStateId;
    delete updatedFormData.productCityId;
    delete updatedFormData.productTown;
    delete updatedFormData.productLatLng;
    delete updatedFormData.sellCountryIds;
    delete updatedFormData.sellStateIds;
    delete updatedFormData.sellCityIds;

    delete updatedFormData.setUpPrice;

    // Save values before deleting from root — needed in edit mode
    const savedProductCondition = updatedFormData.productCondition;
    const savedIsStockRequired = updatedFormData.isStockRequired;
    const savedIsOfferPriceRequired = updatedFormData.isOfferPriceRequired;

    delete updatedFormData.productCondition;
    delete updatedFormData.isStockRequired;
    delete updatedFormData.isOfferPriceRequired;

    updatedFormData.skuNo = randomSkuNo;
    updatedFormData.offerPrice =
      activeProductType === "R"
        ? (updatedFormData.offerPrice ?? 0)
        : (updatedFormData.productPrice ?? 0);
    updatedFormData.productPrice =
      activeProductType === "R"
        ? (updatedFormData.offerPrice ?? 0)
        : (updatedFormData.productPrice ?? 0);

    // Add existingProductId if creating from existing product
    if (productId && searchParams?.get("copy")) {
      updatedFormData.existingProductId = parseInt(productId);
    }

    // TODO: category input field change
    if (updatedFormData.categoryId === 0) {
      toast({
        title: t("product_create_failed"),
        description: t("please_select_category"),
        variant: "danger",
      });
      return;
    }

    ((updatedFormData.description = updatedFormData?.descriptionJson
      ? JSON.stringify(updatedFormData?.descriptionJson)
      : ""),
      delete updatedFormData.descriptionJson);

    // Process short descriptions for backend
    if (updatedFormData.productShortDescriptionList?.length > 0) {
      // Filter out empty short descriptions
      const validShortDescriptions = updatedFormData.productShortDescriptionList
        .filter(
          (item: any) => item.shortDescription && item.shortDescription.trim(),
        )
        .map((item: any) => ({
          shortDescription: item.shortDescription.trim(),
        }));

      if (validShortDescriptions.length > 0) {
        updatedFormData.productShortDescriptionList = validShortDescriptions;
        // Also set the first short description as the main shortDescription field
        updatedFormData.shortDescription =
          validShortDescriptions[0].shortDescription;
      } else {
        delete updatedFormData.productShortDescriptionList;
        updatedFormData.shortDescription = "";
      }
    } else {
      updatedFormData.shortDescription = "";
    }

    // Process specifications for backend
    if (updatedFormData.productSpecificationList?.length > 0) {
      // Filter out empty specifications
      const validSpecifications = updatedFormData.productSpecificationList
        .filter(
          (item: any) =>
            item.label &&
            item.label.trim() &&
            item.specification &&
            item.specification.trim(),
        )
        .map((item: any) => ({
          label: item.label.trim(),
          specification: item.specification.trim(),
        }));

      if (validSpecifications.length > 0) {
        updatedFormData.productSpecificationList = validSpecifications;
      } else {
        delete updatedFormData.productSpecificationList;
      }
    }

    updatedFormData.productVariant = [];
    for (const productVariant of updatedFormData.productVariants) {
      if (productVariant.type) {
        for (const variant of productVariant.variants) {
          if (variant.value) {
            updatedFormData.productVariant.push({
              type: productVariant.type,
              value: variant.value,
            });
          }
        }
      }
    }

    let productVariantImages = [];
    for (const productVariant of updatedFormData.productVariants) {
      if (productVariant.type) {
        for (const variant of productVariant.variants) {
          if (variant.image && variant.value) {
            productVariantImages.push({
              path: variant.image,
              id: productVariant.type + "-" + variant.value,
            });
          }
        }
      }
    }

    if (productVariantImages.length > 0) {
      const productVariantImagesArray = await handleUploadedFile(
        productVariantImages.filter(
          (item: any) => typeof item.path === "object",
        ),
      );
      const updatedProductVariantImagesArray: any[] = [];
      let i = 0;
      productVariantImages.forEach((item: any) => {
        if (typeof item.path === "object") {
          updatedProductVariantImagesArray.push(
            productVariantImagesArray ? productVariantImagesArray[i] : null,
          );
          i++;
        } else {
          updatedProductVariantImagesArray.push(item.path);
        }
      });
      if (updatedProductVariantImagesArray.length) {
        productVariantImages = productVariantImages.map(
          (image: any, index: number) => {
            image.url = updatedProductVariantImagesArray[index];
            return image;
          },
        );

        for (const productVariant of updatedFormData.productVariants) {
          if (productVariant.type) {
            for (const variant of productVariant.variants) {
              if (variant.image && variant.value) {
                const variantImage = productVariantImages.find(
                  (image: any) =>
                    image.id == `${productVariant.type}-${variant.value}`,
                );
                if (variantImage) {
                  const url = variantImage.url;
                  const extension = url.split(".").pop()?.toLowerCase();

                  if (extension) {
                    if (imageExtensions.includes(extension)) {
                      const imageName: string = url.split("/").pop()!;
                      updatedFormData.productImagesList.push({
                        image: url,
                        imageName,
                        variant: {
                          type: productVariant.type,
                          value: variant.value,
                        },
                      });
                    } else {
                      updatedFormData.productImagesList.push({
                        image: url,
                        imageName: url,
                        variant: {
                          type: productVariant.type,
                          value: variant.value,
                        },
                      });
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    delete updatedFormData.productVariants;

    // Merge per-variant pricing into the payload
    if (
      updatedFormData.variantPricingList &&
      updatedFormData.variantPricingList.length > 0
    ) {
      updatedFormData.productVariantPricing =
        updatedFormData.variantPricingList
          .filter((vp: any) => vp.combinationKey)
          .map((vp: any) => ({
            combination: vp.combinationKey,
            label: vp.combinationLabel,
            price: Number(vp.price) || 0,
            stock: Number(vp.stock) || 0,
          }));
    }
    delete updatedFormData.variantPricingList;

    if (
      productQueryById?.data?.data &&
      searchParams?.get("copy") &&
      updatedFormData.productName.trim() ==
        productQueryById?.data?.data?.productName.trim()
    ) {
      updatedFormData.status = "ACTIVE";
    }

    let response;

    try {
      if (isEditMode) {
        // Handle edit mode - update existing product
        const productPriceId = searchParams?.get("productPriceId");
        const actualProductId = productId || editProductQuery?.data?.data?.id;

        if (!productPriceId || !actualProductId) {
          toast({
            title: t("error"),
            description: "Product ID not found for editing",
            variant: "danger",
          });
          return;
        }

        // Calculate status based on the same logic as create mode
        const calculatedStatus =
          activeProductType === "R"
            ? updatedFormData.offerPrice || savedIsOfferPriceRequired
              ? "ACTIVE"
              : "INACTIVE"
            : updatedFormData.productPrice ||
                savedIsOfferPriceRequired
              ? "ACTIVE"
              : "INACTIVE";

        // Prepare full product update data (product-level fields: name, category, brand, images, description, etc.)
        const fullProductUpdateData = {
          productId: parseInt(actualProductId),
          productType:
            updatedFormData.productType ||
            (activeProductType === "R" ? "R" : "P"),
          productName: updatedFormData.productName,
          categoryId: updatedFormData.categoryId,
          brandId: updatedFormData.brandId,
          skuNo:
            updatedFormData.skuNo || editProductQuery?.data?.data?.skuNo || "",
          productTagList:
            updatedFormData.productTagList?.map((tag: any) => ({
              tagId: typeof tag === "object" ? tag.value || tag.tagId : tag,
            })) || [],
          productImagesList: updatedFormData.productImagesList || [],
          placeOfOriginId: updatedFormData.placeOfOriginId || 0,
          productPrice: updatedFormData.productPrice || 0,
          offerPrice: updatedFormData.offerPrice || 0,
          description: updatedFormData.description || "",
          specification: updatedFormData.specification || "",
          status: calculatedStatus as "ACTIVE" | "INACTIVE",
        };

        // Prepare product price update data (price-level fields: discounts, stock, delivery, etc.)
        const priceUpdateData = {
          productPriceId: parseInt(productPriceId),
          stock: updatedFormData.productPriceList?.[0]?.stock || 0,
          deliveryAfter:
            updatedFormData.productPriceList?.[0]?.deliveryAfter || 0,
          timeOpen: updatedFormData.productPriceList?.[0]?.timeOpen || null,
          timeClose: updatedFormData.productPriceList?.[0]?.timeClose || null,
          consumerType:
            updatedFormData.productPriceList?.[0]?.consumerType || "CONSUMER",
          sellType:
            updatedFormData.productPriceList?.[0]?.sellType || "NORMALSELL",
          vendorDiscount:
            updatedFormData.productPriceList?.[0]?.vendorDiscount || null,
          vendorDiscountType:
            updatedFormData.productPriceList?.[0]?.vendorDiscountType || null,
          consumerDiscount:
            updatedFormData.productPriceList?.[0]?.consumerDiscount || null,
          consumerDiscountType:
            updatedFormData.productPriceList?.[0]?.consumerDiscountType || null,
          minQuantity:
            updatedFormData.productPriceList?.[0]?.minQuantity || null,
          maxQuantity:
            updatedFormData.productPriceList?.[0]?.maxQuantity || null,
          minCustomer:
            updatedFormData.productPriceList?.[0]?.minCustomer || null,
          maxCustomer:
            updatedFormData.productPriceList?.[0]?.maxCustomer || null,
          minQuantityPerCustomer:
            updatedFormData.productPriceList?.[0]?.minQuantityPerCustomer ||
            null,
          maxQuantityPerCustomer:
            updatedFormData.productPriceList?.[0]?.maxQuantityPerCustomer ||
            null,
          productCondition: savedProductCondition,
          askForPrice: savedIsOfferPriceRequired ? "YES" : "NO",
          askForStock: savedIsStockRequired ? "YES" : "NO",
          status: calculatedStatus,
          productPrice: updatedFormData.productPrice || 0,
          offerPrice: updatedFormData.offerPrice || 0,
        };

        // Update product-level fields first
        const productUpdateResponse = await updateProductFull.mutateAsync(
          fullProductUpdateData,
        );

        // If product update failed, show error and return early
        if (!productUpdateResponse.status) {
          toast({
            title: t("product_update_failed"),
            description:
              productUpdateResponse?.message ||
              "Failed to update product details",
            variant: "danger",
          });
          return;
        }

        // Then update product price details (this is critical for trending page visibility)
        // The trending page filters by product_productPrice[].status === "ACTIVE"
        const priceUpdateResponse =
          await updateProductPrice.mutateAsync(priceUpdateData);

        // Use the price update response as the main response (it's more specific)
        response = priceUpdateResponse;

        // If price update failed, show error
        if (!priceUpdateResponse.status) {
          toast({
            title: t("product_update_failed"),
            description:
              priceUpdateResponse?.message ||
              "Failed to update product price details",
            variant: "danger",
          });
          return;
        }

        // Both updates succeeded - invalidate queries immediately to refresh trending page
        // The trending page uses "existing-products" query key with payload
        // Use predicate to invalidate all queries that start with "existing-products"
        queryClient.invalidateQueries({
          predicate: (query) => {
            return query.queryKey[0] === "existing-products";
          },
        });
        queryClient.invalidateQueries({ queryKey: ["products"] });
        queryClient.invalidateQueries({ queryKey: ["managed-products"] });
        queryClient.invalidateQueries({
          predicate: (query) => {
            return query.queryKey[0] === "product-by-id";
          },
        });

        // Force refetch all existing-products queries to ensure data is fresh
        queryClient.refetchQueries({
          predicate: (query) => {
            return query.queryKey[0] === "existing-products";
          },
        });
      } else {
        // Handle create mode - create new product

        response = await createProduct.mutateAsync(updatedFormData);
      }

      if (response && response.status && response.data) {
        // For create mode, invalidate queries
        if (!isEditMode) {
          queryClient.invalidateQueries({ queryKey: ["products"] });
          queryClient.invalidateQueries({ queryKey: ["all-products"] });
          queryClient.invalidateQueries({ queryKey: ["managed-products"] });
          queryClient.invalidateQueries({ queryKey: ["existing-products"] });
        }

        toast({
          title: isEditMode
            ? t("product_update_successful")
            : t("product_create_successful"),
          description: response.message,
          variant: "success",
        });
        form.reset();
        if (isEditMode) {
          // Small delay to ensure queries are invalidated before navigation
          setTimeout(() => {
            router.push("/manage-products");
          }, 100);
        } else if (activeProductType === "R") {
          router.push("/rfq");
        } else if (activeProductType === "F") {
          router.push("/factories");
        } else if (activeProductType === "D") {
          router.push("/dropship-products");
        } else {
          router.push("/manage-products");
        }
      } else {
        toast({
          title: isEditMode
            ? t("product_update_failed")
            : t("product_create_failed"),
          description: response?.message || "Unknown error occurred",
          variant: "danger",
        });
      }
    } catch (error: any) {
      toast({
        title: isEditMode
          ? t("product_update_failed")
          : t("product_create_failed"),
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Network error occurred",
        variant: "danger",
      });
    }
  };

  useEffect(() => {
    if (!watchSetUpPrice) {
      form.setValue("productPrice", 0);
      form.setValue("offerPrice", 0);
      form.setValue("productPriceList", [
        {
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
        },
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchSetUpPrice, form.setValue]);

  useEffect(() => {
    if (activeProductType == "R") {
      form.setValue("typeOfProduct", "BRAND");
    }
  }, [activeProductType]);

  useEffect(() => {
    const params = new URLSearchParams(document.location.search);
    const activeProductType = params.get("productType");

    if (activeProductType) {
      setActiveProductType(activeProductType);
    } else {
      // Default to 'P' (Product) if no productType is specified
      setActiveProductType("P");
    }
  }, []);

  // Show loading state when not on client side
  if (!isClient) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoaderWithMessage message={t("loading")} />
      </div>
    );
  }

  // Show loading state when fetching product data for editing
  if (isEditMode && editProductQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoaderWithMessage message={t("loading_product_data")} />
      </div>
    );
  }

  // Show error state if product data fetch fails
  if (isEditMode && editProductQuery.error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 text-xl font-semibold text-destructive">
            {t("error_loading_product")}
          </h2>
          <p className="mb-4 text-muted-foreground">
            {t("failed_to_load_product_data")}
          </p>
          <Button
            onClick={() => {
              if (activeProductType === "D") {
                router.push("/dropship-products");
              } else if (activeProductType === "R") {
                router.push("/rfq");
              } else if (activeProductType === "F") {
                router.push("/factories");
              } else {
                router.push("/manage-products");
              }
            }}
          >
            {t("back_to_products")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <section className="min-h-screen bg-muted py-8">
        <div className="container mx-auto max-w-6xl px-4">
          {/* Header Section */}
          <div className="mb-8 text-center">
            {!searchParams?.get("productType") ||
            (searchParams?.get("productType") !== "D" &&
              searchParams?.get("productType") !== "R") ? (
              <>
                {/* Tab Navigation */}
                <div className="inline-flex rounded-xl border border-border bg-card p-1 shadow-sm">
                  <button
                    type="button"
                    className={`rounded-lg px-6 py-3 text-sm font-medium transition-all duration-200 ${
                      activeTab === "create"
                        ? "bg-warning text-white shadow-md"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                    onClick={() => setActiveTab("create")}
                  >
                    {t("create_new_product")}
                  </button>
                  <button
                    type="button"
                    className={`rounded-lg px-6 py-3 text-sm font-medium transition-all duration-200 ${
                      activeTab === "dropship"
                        ? "bg-warning text-white shadow-md"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                    onClick={() => setActiveTab("dropship")}
                  >
                    {t("dropship_product")}
                  </button>
                </div>
              </>
            ) : null}
          </div>

          {/* Form Content */}
          <div className="mx-auto max-w-5xl">
            {activeTab === "dropship" &&
            searchParams?.get("productType") !== "D" ? (
              <DropshipProductForm />
            ) : (
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-8"
                >
                  <ProductWizard
                    form={form}
                    tagsList={memoizedTags}
                    activeProductType={activeProductType}
                    selectedCategoryIds={selectedCategoryIds}
                    setSelectedCategoryIds={setSelectedCategoryIds}
                    isEditMode={isEditMode}
                    copy={
                      searchParams?.get("copy") &&
                      productQueryById?.data?.data
                        ? true
                        : false
                    }
                    isSubmitting={
                      createProduct.isPending ||
                      uploadMultiple.isPending ||
                      updateProductFull.isPending ||
                      updateProductPrice.isPending
                    }
                    onSubmit={() => form.trigger()}
                  />
                </form>
              </Form>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
};

export default CreateProductPage;
