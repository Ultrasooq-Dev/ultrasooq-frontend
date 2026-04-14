import { useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { fetchSubCategoriesById } from "@/apis/requests/category.requests";
import { useProductVariant } from "@/apis/queries/product.queries";
import { populateFormWithProductData, populateFormWithExistingProductData } from "./populateProductFormHelpers";

interface UseProductDataSyncOptions {
  form: UseFormReturn<any>;
  productQueryByIdData: any;
  existingProductQueryByIdData: any;
  searchParams: ReturnType<typeof import("next/navigation").useSearchParams>;
  setActiveProductType: (type: string) => void;
  setSelectedCategoryIds: (ids: string[]) => void;
  t: (key: string, params?: any) => string;
}

const buildCategoryPath = async (categoryId: number): Promise<number[]> => {
  try {
    const res = await fetchSubCategoriesById({ categoryId: String(categoryId) });
    const categoryData = res.data?.data;
    if (categoryData?.categoryLocation) {
      return categoryData.categoryLocation
        .split(",")
        .map((id: string) => Number(id.trim()))
        .filter((id: number) => !Number.isNaN(id));
    }
    if (!categoryData?.parentId || categoryData.parentId === categoryId) return [categoryId];
    const parentPath = await buildCategoryPath(categoryData.parentId);
    return [...parentPath, categoryId];
  } catch (error) {
    return [categoryId];
  }
};

/**
 * Syncs the form with product data fetched from the server (copy / existing-product flows).
 * Also handles fetching variant data for a given productPriceId.
 */
export const useProductDataSync = ({
  form,
  productQueryByIdData,
  existingProductQueryByIdData,
  searchParams,
  setActiveProductType,
  setSelectedCategoryIds,
  t,
}: UseProductDataSyncOptions) => {
  const getProductVariant = useProductVariant();

  const fetchProductVariant = async (productPriceId: number) => {
    const product = productQueryByIdData;
    const response = await getProductVariant.mutateAsync([productPriceId]);
    const variants = response?.data?.[0]?.object || [];
    if (variants.length === 0) return;

    const productSellerImages = product?.product_productPrice?.[0]
      ?.productPrice_productSellerImage?.length
      ? product?.product_productPrice?.[0]?.productPrice_productSellerImage
      : product?.productImages?.length ? product?.productImages : [];

    const variantTypes = [...new Set(variants.map((v: any) => v.type))];
    form.setValue(
      "productVariants",
      variantTypes.map((type: any) => ({
        type,
        variants: variants
          .filter((v: any) => v.type == type)
          .map((v: any) => ({
            value: v.value,
            image:
              productSellerImages?.find(
                (img: any) => img.variant && img.variant?.type == type && img.variant?.value == v.value,
              )?.image || null,
          })),
      })) as any,
    );
  };

  // Populate from own product (copy from manage-products)
  useEffect(() => {
    if (productQueryByIdData && !searchParams?.get("fromExisting")) {
      populateFormWithProductData(
        form,
        productQueryByIdData,
        setActiveProductType,
        setSelectedCategoryIds,
        fetchProductVariant,
        t,
      );
    }
  }, [productQueryByIdData, searchParams]);

  // Populate from existing product catalog
  useEffect(() => {
    if (!existingProductQueryByIdData || searchParams?.get("fromExisting") !== "true") return;

    const existingProduct = existingProductQueryByIdData;
    const hasValidCategoryLocation =
      typeof existingProduct.categoryLocation === "string" &&
      existingProduct.categoryLocation.trim().length > 0 &&
      /^[0-9]+(,[0-9]+)*$/.test(existingProduct.categoryLocation.trim());

    const applyExistingProduct = (product: any) =>
      populateFormWithExistingProductData(form, product, setActiveProductType, setSelectedCategoryIds, t);

    if (!hasValidCategoryLocation && existingProduct.categoryId) {
      buildCategoryPath(existingProduct.categoryId)
        .then((pathIds) => {
          setTimeout(() => applyExistingProduct({ ...existingProduct, categoryLocation: pathIds.join(",") }), 100);
        })
        .catch(() => {
          setTimeout(() => applyExistingProduct({ ...existingProduct, categoryLocation: String(existingProduct.categoryId) }), 100);
        });
    } else {
      setTimeout(() => applyExistingProduct(existingProduct), 100);
    }
  }, [existingProductQueryByIdData, searchParams]);
};
