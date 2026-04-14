import { UseFormReturn } from "react-hook-form";

/**
 * Populate form with the user's own product data (copy / edit from manage-products).
 */
export const populateFormWithProductData = (
  form: UseFormReturn<any>,
  product: any,
  setActiveProductType: (type: string) => void,
  setSelectedCategoryIds: (ids: string[]) => void,
  fetchProductVariantFn: (productPriceId: number) => void,
  t: (key: string) => string,
) => {
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
      ?.map((item: any) => ({
        label: item.productTagsTag.tagName,
        value: item.productTagsTag.id,
      })) || [];
  form.setValue("productTagList", productTagList);
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
  form.setValue("keywords", product.keywords || "");
  form.setValue("shortDescription", product.shortDescription);
  form.setValue("barcode", product.barcode);
  form.setValue("placeOfOriginId", product.placeOfOriginId);
  form.setValue("productType", product.productType);
  form.setValue("typeProduct", product.typeProduct);

  form.setValue(
    "productSpecificationList",
    product.product_productSpecification?.map((item: any) => ({
      label: item.label,
      specification: item.specification,
    })) || [],
  );

  if (product.product_productPrice?.length) {
    fetchProductVariantFn(product.product_productPrice?.[0]?.id);
  }
};

/**
 * Populate form with data from the existing products catalog (admin-added products).
 */
export const populateFormWithExistingProductData = (
  form: UseFormReturn<any>,
  existingProduct: any,
  setActiveProductType: (type: string) => void,
  setSelectedCategoryIds: (ids: string[]) => void,
  t: (key: string) => string,
) => {
  const inferredTypeOfProduct =
    existingProduct.typeOfProduct ||
    (existingProduct.brandId ? "BRAND" : "OWNBRAND");
  form.setValue("typeOfProduct", inferredTypeOfProduct);
  setActiveProductType(existingProduct.productType);

  const rawCategoryLocation =
    existingProduct.categoryLocation ||
    (existingProduct.categoryId ? String(existingProduct.categoryId) : "");
  const categoryIds = rawCategoryLocation
    ? rawCategoryLocation.split(",").filter((item: string) => item.trim())
    : [];
  form.setValue("categoryId", existingProduct.categoryId || 0);
  form.setValue("categoryLocation", rawCategoryLocation || "");
  setSelectedCategoryIds(categoryIds);

  form.setValue("productName", existingProduct.productName);

  if (existingProduct.brandId) {
    form.setValue("brandId", existingProduct.brandId);
    form.setValue("brandName", existingProduct.brand?.brandName || "");
  }
  form.setValue("productCondition", "New");

  const productTagList =
    existingProduct.existingProductTags
      ?.filter((item: any) => item.existingProductTag)
      ?.map((item: any) => ({
        label: item.existingProductTag.tagName,
        value: item.existingProductTag.id,
      })) || [];
  form.setValue("productTagList", productTagList);
  setTimeout(() => {
    form.trigger("productTagList");
  }, 100);

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
  form.setValue("keywords", existingProduct.keywords || "");

  if (existingProduct.description) {
    try {
      const descriptionJson = JSON.parse(existingProduct.description);
      if (Array.isArray(descriptionJson) && descriptionJson.length > 0) {
        form.setValue("descriptionJson", descriptionJson);
      } else {
        form.setValue("descriptionJson", [
          { id: "1", type: "p", children: [{ text: existingProduct.description }] },
        ]);
      }
    } catch (e) {
      form.setValue("descriptionJson", [
        { id: "1", type: "p", children: [{ text: existingProduct.description }] },
      ]);
    }
  } else {
    form.setValue("descriptionJson", [
      { id: "1", type: "p", children: [{ text: "" }] },
    ]);
  }

  if (existingProduct.specification && existingProduct.specification.trim()) {
    try {
      const specData = JSON.parse(existingProduct.specification);
      if (Array.isArray(specData) && specData.length > 0) {
        form.setValue(
          "productSpecificationList",
          specData.map((item: any) => ({
            label: item.label || "",
            specification: item.specification || "",
          })),
        );
      } else {
        form.setValue("productSpecificationList", [
          { label: t("specification"), specification: existingProduct.specification },
        ]);
      }
    } catch (e) {
      form.setValue("productSpecificationList", [
        { label: t("specification"), specification: existingProduct.specification },
      ]);
    }
  } else {
    form.setValue("productSpecificationList", [{ label: "", specification: "" }]);
  }

  if (existingProduct.shortDescription && existingProduct.shortDescription.trim()) {
    try {
      const shortDescData = JSON.parse(existingProduct.shortDescription);
      if (Array.isArray(shortDescData) && shortDescData.length > 0) {
        form.setValue(
          "productShortDescriptionList",
          shortDescData.map((item: any) => ({
            shortDescription: item.shortDescription || "",
          })),
        );
      } else {
        form.setValue("productShortDescriptionList", [
          { shortDescription: existingProduct.shortDescription },
        ]);
      }
    } catch (e) {
      form.setValue("productShortDescriptionList", [
        { shortDescription: existingProduct.shortDescription },
      ]);
    }
  } else {
    form.setValue("productShortDescriptionList", [{ shortDescription: "" }]);
  }

  form.setValue("shortDescription", existingProduct.shortDescription);
  form.setValue("barcode", existingProduct.barcode);
  form.setValue("placeOfOriginId", existingProduct.placeOfOriginId);
  form.setValue("productType", existingProduct.productType);
  form.setValue("typeProduct", existingProduct.typeProduct);
};
