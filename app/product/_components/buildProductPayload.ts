import {
  BUYGROUP_MENU_ID,
  FACTORIES_MENU_ID,
  RFQ_MENU_ID,
  STORE_MENU_ID,
  imageExtensions,
  videoExtensions,
} from "@/utils/constants";
import { generateRandomSkuNoWithTimeStamp } from "@/utils/helper";

/**
 * Assemble and transform formData into the final payload for create/update API calls.
 * Returns the enriched `updatedFormData` object (mutations applied in-place on a copy).
 */
export const buildProductPayload = async (
  formData: any,
  activeProductType: string | undefined,
  watchProductImages: any[],
  isWholesaleProduct: boolean,
  handleUploadedFile: (list: any[]) => Promise<any>,
) => {
  const updatedFormData: any = {
    ...formData,
    productType:
      activeProductType === "R" ? "R"
      : activeProductType === "F" ? "F"
      : isWholesaleProduct ? "D"
      : formData.isDropshipable === true ? "D"
      : "P",
    isDropshipable: isWholesaleProduct || formData.isDropshipable === true,
    status: activeProductType === "R" || activeProductType === "F" ? "ACTIVE" : "INACTIVE",
  };

  // --- images ---
  updatedFormData.productImagesList = [];
  if (watchProductImages.length) {
    const fileTypeArrays = watchProductImages.filter((item: any) => typeof item.path === "object");
    const imageUrlArray: any = fileTypeArrays?.length ? await handleUploadedFile(fileTypeArrays) : [];
    updatedFormData.productImages = [
      ...watchProductImages.filter((item: any) => typeof item.path === "string").map((item: any) => item.path),
      ...imageUrlArray,
    ];
    if (updatedFormData.productImages.length) {
      updatedFormData.productImagesList = updatedFormData.productImages.map((item: string) => {
        const extension = item.split(".").pop()?.toLowerCase();
        if (extension) {
          if (videoExtensions.includes(extension)) return { video: item, videoName: item.split("/").pop()! };
          if (imageExtensions.includes(extension)) return { image: item, imageName: item.split("/").pop()! };
        }
        return { image: item, imageName: item };
      });
    }
  }

  const randomSkuNo = generateRandomSkuNoWithTimeStamp().toString();
  delete updatedFormData.productImages;

  // --- price list ---
  updatedFormData.productPriceList = [
    {
      ...(activeProductType !== "R" && updatedFormData.productPriceList[0]),
      askForStock: updatedFormData.isStockRequired ? "true" : "false",
      askForPrice: updatedFormData.isOfferPriceRequired ? "true" : "false",
      isCustomProduct: updatedFormData.isCustomProduct ? "true" : "false",
      productPrice: updatedFormData.isOfferPriceRequired ? 0 : activeProductType === "R" ? (updatedFormData.offerPrice ?? 0) : (updatedFormData.productPrice ?? 0),
      offerPrice: updatedFormData.isOfferPriceRequired ? 0 : activeProductType === "R" ? (updatedFormData.offerPrice ?? 0) : (updatedFormData.productPrice ?? 0),
      stock: updatedFormData.isStockRequired ? 0 : updatedFormData.productPriceList?.[0]?.stock ?? 0,
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
          ? updatedFormData.offerPrice || updatedFormData.isOfferPriceRequired ? "ACTIVE" : "INACTIVE"
          : updatedFormData.productPrice || updatedFormData.isOfferPriceRequired ? "ACTIVE" : "INACTIVE",
    },
  ];

  if (activeProductType === "R") {
    updatedFormData.productPriceList[0] = {
      consumerType: "", sellType: "", consumerDiscount: 0, vendorDiscount: 0,
      consumerDiscountType: "", vendorDiscountType: "", minCustomer: 0, maxCustomer: 0,
      minQuantityPerCustomer: 0, maxQuantityPerCustomer: 0, minQuantity: 0, maxQuantity: 0,
      timeOpen: 0, timeClose: 0, deliveryAfter: 0, stock: 0,
      askForStock: updatedFormData.isStockRequired ? "true" : undefined,
      askForPrice: updatedFormData.isOfferPriceRequired ? "true" : undefined,
      ...updatedFormData.productPriceList[0],
    };
    ["productCountryId", "productStateId", "productCityId", "productTown", "productLatLng",
      "sellCountryIds", "sellStateIds", "sellCityIds"].forEach((k) => delete updatedFormData.productPriceList[0][k]);
  }

  const sellType = updatedFormData.productPriceList?.[0]?.sellType;
  if (sellType == "NORMALSELL") updatedFormData.productPriceList[0].menuId = STORE_MENU_ID;
  if (sellType == "BUYGROUP") updatedFormData.productPriceList[0].menuId = BUYGROUP_MENU_ID;
  if (sellType == "TRIAL_PRODUCT") updatedFormData.productPriceList[0].menuId = STORE_MENU_ID;
  if (sellType == "WHOLESALE_PRODUCT") updatedFormData.productPriceList[0].menuId = STORE_MENU_ID;
  if (updatedFormData.isCustomProduct) updatedFormData.productPriceList[0].menuId = FACTORIES_MENU_ID;
  if (activeProductType == "R") updatedFormData.productPriceList[0].menuId = RFQ_MENU_ID;

  ["productCountryId", "productStateId", "productCityId", "productTown", "productLatLng",
    "sellCountryIds", "sellStateIds", "sellCityIds", "setUpPrice"].forEach((k) => delete updatedFormData[k]);

  const savedProductCondition = updatedFormData.productCondition;
  const savedIsStockRequired = updatedFormData.isStockRequired;
  const savedIsOfferPriceRequired = updatedFormData.isOfferPriceRequired;

  delete updatedFormData.productCondition;
  delete updatedFormData.isStockRequired;
  delete updatedFormData.isOfferPriceRequired;

  updatedFormData.skuNo = randomSkuNo;
  updatedFormData.offerPrice = activeProductType === "R" ? (updatedFormData.offerPrice ?? 0) : (updatedFormData.productPrice ?? 0);
  updatedFormData.productPrice = activeProductType === "R" ? (updatedFormData.offerPrice ?? 0) : (updatedFormData.productPrice ?? 0);

  if (updatedFormData.categoryId === 0) delete updatedFormData.categoryId;

  updatedFormData.description = updatedFormData?.descriptionJson ? JSON.stringify(updatedFormData?.descriptionJson) : "";
  delete updatedFormData.descriptionJson;

  // short descriptions
  if (updatedFormData.productShortDescriptionList?.length > 0) {
    const valid = updatedFormData.productShortDescriptionList
      .filter((item: any) => item.shortDescription && item.shortDescription.trim())
      .map((item: any) => ({ shortDescription: item.shortDescription.trim() }));
    if (valid.length > 0) {
      updatedFormData.productShortDescriptionList = valid;
      updatedFormData.shortDescription = valid[0].shortDescription;
    } else {
      delete updatedFormData.productShortDescriptionList;
      updatedFormData.shortDescription = "";
    }
  } else {
    updatedFormData.shortDescription = "";
  }

  // specifications
  if (updatedFormData.productSpecificationList?.length > 0) {
    const valid = updatedFormData.productSpecificationList
      .filter((item: any) => item.label && item.label.trim() && item.specification && item.specification.trim())
      .map((item: any) => ({ label: item.label.trim(), specification: item.specification.trim() }));
    if (valid.length > 0) {
      updatedFormData.productSpecificationList = valid;
    } else {
      delete updatedFormData.productSpecificationList;
    }
  }

  // product variants
  updatedFormData.productVariant = [];
  for (const productVariant of updatedFormData.productVariants) {
    if (productVariant.type) {
      for (const variant of productVariant.variants) {
        if (variant.value) {
          updatedFormData.productVariant.push({ type: productVariant.type, value: variant.value });
        }
      }
    }
  }

  // variant images
  let productVariantImages: any[] = [];
  for (const productVariant of updatedFormData.productVariants) {
    if (productVariant.type) {
      for (const variant of productVariant.variants) {
        if (variant.image && variant.value) {
          productVariantImages.push({ path: variant.image, id: `${productVariant.type}-${variant.value}` });
        }
      }
    }
  }
  if (productVariantImages.length > 0) {
    const uploadedArr = await handleUploadedFile(
      productVariantImages.filter((item: any) => typeof item.path === "object"),
    );
    const resolvedArr: any[] = [];
    let i = 0;
    productVariantImages.forEach((item: any) => {
      if (typeof item.path === "object") { resolvedArr.push(uploadedArr ? uploadedArr[i] : null); i++; }
      else resolvedArr.push(item.path);
    });
    if (resolvedArr.length) {
      productVariantImages = productVariantImages.map((img: any, idx: number) => {
        img.url = resolvedArr[idx];
        return img;
      });
      for (const pv of updatedFormData.productVariants) {
        if (pv.type) {
          for (const variant of pv.variants) {
            if (variant.image && variant.value) {
              const found = productVariantImages.find((img: any) => img.id == `${pv.type}-${variant.value}`);
              if (found) {
                const url = found.url;
                const ext = url.split(".").pop()?.toLowerCase();
                if (ext && imageExtensions.includes(ext)) {
                  updatedFormData.productImagesList.push({ image: url, imageName: url.split("/").pop()!, variant: { type: pv.type, value: variant.value } });
                } else {
                  updatedFormData.productImagesList.push({ image: url, imageName: url, variant: { type: pv.type, value: variant.value } });
                }
              }
            }
          }
        }
      }
    }
  }
  delete updatedFormData.productVariants;

  // variant pricing
  if (updatedFormData.variantPricingList?.length > 0) {
    updatedFormData.productVariantPricing = updatedFormData.variantPricingList
      .filter((vp: any) => vp.combinationKey)
      .map((vp: any) => ({ combination: vp.combinationKey, label: vp.combinationLabel, price: Number(vp.price) || 0, stock: Number(vp.stock) || 0 }));
  }
  delete updatedFormData.variantPricingList;

  return { updatedFormData, savedProductCondition, savedIsStockRequired, savedIsOfferPriceRequired };
};
