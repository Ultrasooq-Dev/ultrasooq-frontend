"use client";
import { useEffect, useMemo, useState } from "react";
import {
  useExistingProduct,
  useAddMultiplePriceForProduct,
} from "@/apis/queries/product.queries";
import { useToast } from "@/components/ui/use-toast";
import { useTranslations } from "next-intl";
import { IBrands, ISelectOptions } from "@/utils/types/common.types";
import { useBrands } from "@/apis/queries/masters.queries";
import { useCategory } from "@/apis/queries/category.queries";
import { PRODUCT_CATEGORY_ID } from "@/utils/constants";

export function useExistingProductsState(meId: number | undefined, activeSearchTermBrand: string) {
  const t = useTranslations();
  const { toast } = useToast();

  const [existingProductsPage, setExistingProductsPage] = useState(1);
  const [existingProductsLimit] = useState(8);
  const [existingProductsSearchTerm, setExistingProductsSearchTerm] = useState("");
  const [activeExistingProductsSearchTerm, setActiveExistingProductsSearchTerm] = useState("");
  const [existingProductsSelectedBrandIds, setExistingProductsSelectedBrandIds] = useState<number[]>([]);
  const [existingProductsSelectedCategoryIds, setExistingProductsSelectedCategoryIds] = useState<number[]>([]);
  const [existingProductsSelectedIds, setExistingProductsSelectedIds] = useState<number[]>([]);
  const [existingProductsSelectedType, setExistingProductsSelectedType] = useState<string>("");

  const existingProductsBrandsQuery = useBrands({
    term: activeSearchTermBrand,
    addedBy: meId,
    type: "BRAND",
  });

  const categoriesQuery = useCategory(PRODUCT_CATEGORY_ID.toString());
  const addMultiplePriceForProductIds = useAddMultiplePriceForProduct();

  const memoizedExistingProductsBrands = useMemo(() => {
    return (
      existingProductsBrandsQuery?.data?.data.map((item: IBrands) => ({
        label: item.brandName,
        value: item.id,
      })) || []
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingProductsBrandsQuery?.data?.data?.length]);

  const memoizedCategories = useMemo(() => {
    if (categoriesQuery?.data?.data?.children) {
      return categoriesQuery.data.data.children.map((item: any) => ({
        label: item.name,
        value: item.id,
      }));
    }
    return [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoriesQuery?.data?.data?.children]);

  const existingProductsQueryParams = {
    page: existingProductsSelectedType ? 1 : existingProductsPage,
    limit: existingProductsSelectedType ? 100 : existingProductsLimit,
    sort: "desc",
    brandIds:
      existingProductsSelectedBrandIds.map((item) => item.toString()).join(",") || undefined,
    categoryIds:
      existingProductsSelectedCategoryIds.map((item) => item.toString()).join(",") || undefined,
    term: activeExistingProductsSearchTerm !== "" ? activeExistingProductsSearchTerm : undefined,
    brandAddedBy: meId,
    productType: existingProductsSelectedType || undefined,
    type: existingProductsSelectedType || undefined,
  };

  const existingProductsQuery = useExistingProduct(existingProductsQueryParams);

  const memoizedExistingProductList = useMemo(() => {
    let products =
      existingProductsQuery?.data?.data?.map((item: any) => ({
        id: item.id,
        productName: item?.productName || "-",
        productPrice: item?.productPrice || 0,
        offerPrice: item?.offerPrice || 0,
        productImage: item?.existingProductImages?.[0]?.image,
        categoryName: item?.category?.name || "-",
        categoryId: item?.category?.id,
        skuNo: item?.skuNo,
        brandName: item?.brand?.brandName || "-",
        productReview: [],
        productProductPriceId: item?.id,
        productProductPrice: item?.offerPrice,
        shortDescription: item?.shortDescription || "-",
        consumerDiscount: 0,
        askForPrice: "NO",
        productType: item?.productType || "P",
      })) || [];

    if (existingProductsSelectedType && products.length > 0) {
      products = products.filter(
        (product: any) => product.productType === existingProductsSelectedType,
      );
    }
    if (existingProductsSelectedCategoryIds.length > 0 && products.length > 0) {
      products = products.filter((product: any) =>
        existingProductsSelectedCategoryIds.includes(product.categoryId),
      );
    }
    return products;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    existingProductsQuery?.data?.data,
    existingProductsQuery?.data?.data?.length,
    existingProductsPage,
    existingProductsLimit,
    existingProductsSearchTerm,
    existingProductsSelectedBrandIds,
    existingProductsSelectedCategoryIds,
    existingProductsSelectedType,
  ]);

  const filteredTotalCount = useMemo(() => {
    if (!existingProductsSelectedType) {
      return existingProductsQuery.data?.totalCount || 0;
    }
    return memoizedExistingProductList.length;
  }, [
    existingProductsSelectedType,
    memoizedExistingProductList.length,
    existingProductsQuery.data?.totalCount,
  ]);

  useEffect(() => {
    if (existingProductsSelectedType) setExistingProductsPage(1);
  }, [existingProductsSelectedType]);

  useEffect(() => {
    if (existingProductsSelectedCategoryIds.length > 0) existingProductsQuery.refetch();
  }, [existingProductsSelectedCategoryIds, existingProductsQuery]);

  const handleExistingProductsSearchChange = (event: any) => {
    setExistingProductsSearchTerm(event.target.value);
  };

  const handleExistingProductsSearch = () => {
    setActiveExistingProductsSearchTerm(existingProductsSearchTerm);
    if (existingProductsQuery.refetch) existingProductsQuery.refetch();
  };

  const handleExistingProductsCategoryChange = (categoryIds: number[]) => {
    setExistingProductsSelectedCategoryIds(categoryIds);
  };

  const handleExistingProductsCategoryClear = () => {
    setExistingProductsSelectedCategoryIds([]);
  };

  const handleExistingProductsBrandChange = (
    checked: boolean | string,
    item: ISelectOptions,
  ) => {
    let tempArr = existingProductsSelectedBrandIds || [];
    if (checked && !tempArr.find((ele: number) => ele === item.value))
      tempArr = [...tempArr, item.value];
    if (!checked && tempArr.find((ele: number) => ele === item.value))
      tempArr = tempArr.filter((ele: number) => ele !== item.value);
    setExistingProductsSelectedBrandIds(tempArr);
  };

  const handleExistingProductsSelection = (checked: boolean | string, id: number) => {
    let tempArr = existingProductsSelectedIds || [];
    if (checked && !tempArr.find((ele: number) => ele === id)) tempArr = [...tempArr, id];
    if (!checked && tempArr.find((ele: number) => ele === id))
      tempArr = tempArr.filter((ele: number) => ele !== id);
    setExistingProductsSelectedIds(tempArr);
  };

  const handleAddExistingProducts = async (
    onSuccess: () => void,
  ) => {
    const data = existingProductsSelectedIds.map((item: number) => ({
      productId: item,
      status: "INACTIVE",
    }));
    const response = await addMultiplePriceForProductIds.mutateAsync({
      productPrice: data,
    });
    if (response.status && response.data) {
      toast({
        title: t("product_price_add_successful"),
        description: response.message,
        variant: "success",
      });
      setExistingProductsSelectedIds([]);
      onSuccess();
    } else {
      toast({
        title: t("product_price_add_failed"),
        description: response.message,
        variant: "danger",
      });
    }
  };

  return {
    existingProductsPage, setExistingProductsPage,
    existingProductsLimit,
    existingProductsSearchTerm, setExistingProductsSearchTerm,
    existingProductsSelectedBrandIds, setExistingProductsSelectedBrandIds,
    existingProductsSelectedCategoryIds, setExistingProductsSelectedCategoryIds,
    existingProductsSelectedIds, setExistingProductsSelectedIds,
    existingProductsSelectedType, setExistingProductsSelectedType,
    existingProductsBrandsQuery, categoriesQuery,
    memoizedExistingProductsBrands, memoizedCategories,
    existingProductsQuery, memoizedExistingProductList, filteredTotalCount,
    handleExistingProductsSearchChange, handleExistingProductsSearch,
    handleExistingProductsCategoryChange, handleExistingProductsCategoryClear,
    handleExistingProductsBrandChange, handleExistingProductsSelection,
    handleAddExistingProducts,
  };
}
