import { useEffect } from "react";
import { UseFormReturn } from "react-hook-form";

interface UseEditProductFormOptions {
  isEditMode: boolean;
  editProductData: any;
  form: UseFormReturn<any>;
  setSelectedCategoryIds: (ids: string[]) => void;
  setActiveProductType: (type: string) => void;
}

/**
 * Pre-fills the form with existing product data when in edit mode.
 */
export const useEditProductForm = ({
  isEditMode,
  editProductData,
  form,
  setSelectedCategoryIds,
  setActiveProductType,
}: UseEditProductFormOptions) => {
  useEffect(() => {
    if (!isEditMode || !editProductData) return;

    const productData = editProductData;

    let priceSpecificData: any = {};
    if (
      productData.product_productPrice &&
      Array.isArray(productData.product_productPrice) &&
      productData.product_productPrice.length > 0
    ) {
      priceSpecificData = productData.product_productPrice[0];
    }

    let additionalData: any = {};
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

    const priceData =
      Object.keys(priceSpecificData).length > 0
        ? priceSpecificData
        : Object.keys(additionalData).length > 0
          ? additionalData
          : productData;

    const getFieldValue = (
      obj: any,
      fieldVariations: string[],
      defaultValue: any = null,
    ) => {
      for (const field of fieldVariations) {
        if (obj && obj[field] !== undefined && obj[field] !== null && obj[field] !== "") {
          return obj[field];
        }
      }
      return defaultValue;
    };

    const productPriceList = [
      {
        consumerType:
          getFieldValue(priceData, ["consumerType", "consumer_type", "consumerTypeId", "consumer_type_id"]) ||
          getFieldValue(productData, ["consumerType", "consumer_type", "consumerTypeId", "consumer_type_id"]) ||
          "CONSUMER",
        sellType:
          getFieldValue(priceData, ["sellType", "sell_type", "sellTypeId", "sell_type_id"]) ||
          getFieldValue(productData, ["sellType", "sell_type", "sellTypeId", "sell_type_id"]) ||
          "NORMALSELL",
        productPrice: parseInt(productData.productPrice || productData.offerPrice || 0),
        offerPrice: parseInt(productData.offerPrice || 0),
        stock:
          getFieldValue(priceData, ["stock", "stockQuantity", "quantity", "availableStock"]) ||
          getFieldValue(productData, ["stock", "stockQuantity", "quantity", "availableStock"]) ||
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
          const hasActualPrice = productData.productPrice && productData.productPrice > 0;
          const hasActualOfferPrice = productData.offerPrice && productData.offerPrice > 0;
          if (hasActualPrice || hasActualOfferPrice) return "NO";
          return priceData.askForPrice || "NO";
        })(),
        askForStock: (() => {
          const hasActualStock = productData.stock && productData.stock > 0;
          if (hasActualStock) return "NO";
          return priceData.askForStock || "NO";
        })(),
        status: priceData.status || "ACTIVE",
      },
    ];

    const editData = {
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
      productCountryId: Number(
        getFieldValue(productData, ["productCountryId", "countryId", "country_id"]) ||
          (productData.product_productPrice?.[0]
            ? getFieldValue(productData.product_productPrice[0], ["productCountryId", "countryId", "country_id"])
            : null) ||
          0,
      ),
      productStateId: Number(
        getFieldValue(productData, ["productStateId", "stateId", "state_id"]) ||
          (productData.product_productPrice?.[0]
            ? getFieldValue(productData.product_productPrice[0], ["productStateId", "stateId", "state_id"])
            : null) ||
          0,
      ),
      productCityId: Number(
        getFieldValue(productData, ["productCityId", "cityId", "city_id"]) ||
          (productData.product_productPrice?.[0]
            ? getFieldValue(productData.product_productPrice[0], ["productCityId", "cityId", "city_id"])
            : null) ||
          0,
      ),
      productTown:
        getFieldValue(productData, ["productTown", "town", "product_town"]) ||
        (productData.product_productPrice?.[0]
          ? getFieldValue(productData.product_productPrice[0], ["productTown", "town", "product_town"])
          : null) ||
        "",
      productLatLng:
        getFieldValue(productData, ["productLatLng", "latLng", "lat_lng", "coordinates"]) ||
        (productData.product_productPrice?.[0]
          ? getFieldValue(productData.product_productPrice[0], ["productLatLng", "latLng", "lat_lng", "coordinates"])
          : null) ||
        "",
      placeOfOriginId: Number(productData.placeOfOriginId || 1),
      sellCountryIds: productData.sellCountryIds || [],
      sellStateIds: productData.sellStateIds || [],
      sellCityIds: productData.sellCityIds || [],
      productPrice: parseInt(productData.productPrice || productData.offerPrice || 0),
      offerPrice: parseInt(productData.offerPrice || 0),
      productPriceList: productPriceList,
      setUpPrice: true,
      isStockRequired: productPriceList[0].askForStock === "YES",
      isOfferPriceRequired: productPriceList[0].askForPrice === "YES",
      isCustomProduct: productData.isCustomProduct || false,
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
      descriptionJson: (() => {
        try {
          if (typeof productData.description === "string" && productData.description.startsWith("[")) {
            return JSON.parse(productData.description);
          }
          return productData.descriptionJson || [];
        } catch (e) {
          return [];
        }
      })(),
      typeOfProduct: productData.typeOfProduct || productData.typeOfProduct || "BRAND",
      categoryLocation: productData.categoryLocation || "",
    };

    form.reset();

    Object.entries(editData).forEach(([key, value]) => {
      form.setValue(key as any, value);
    });

    if (editData.categoryLocation && editData.categoryLocation.trim()) {
      const categoryIds = editData.categoryLocation
        .split(",")
        .filter((item: string) => item.trim());
      setSelectedCategoryIds(categoryIds);
      setTimeout(() => setSelectedCategoryIds(categoryIds), 200);
      setTimeout(() => setSelectedCategoryIds(categoryIds), 500);
      setTimeout(() => setSelectedCategoryIds(categoryIds), 1000);
    }

    setTimeout(() => {
      form.trigger();
    }, 100);

    form.setValue("productPriceList.0.consumerType", productPriceList[0].consumerType);
    form.setValue("productPriceList.0.sellType", productPriceList[0].sellType);
    form.setValue("productPriceList.0.stock", productPriceList[0].stock);

    const currentValues = form.getValues();
    if (!currentValues.productStateId || currentValues.productStateId === 0) {
      form.setValue("productStateId", 1);
    }
    if (!currentValues.productCityId || currentValues.productCityId === 0) {
      form.setValue("productCityId", 1);
    }
    if (!currentValues.productCountryId || currentValues.productCountryId === 0) {
      form.setValue("productCountryId", 1);
    }
    if (!currentValues.productTown || currentValues.productTown === "") {
      form.setValue("productTown", "Default Town");
    }
    if (!currentValues.productLatLng || currentValues.productLatLng === "") {
      form.setValue("productLatLng", "0,0");
    }

    if (priceData.sellType === "BUYGROUP") {
      setActiveProductType("R");
    } else {
      setActiveProductType("P");
    }
  }, [isEditMode, editProductData, form]);
};
