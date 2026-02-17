"use client";
import React, { useEffect, useMemo, useState } from "react";
import {
  IBrands,
  ISelectOptions,
  TrendingProduct,
} from "@/utils/types/common.types";
import { useBrands } from "@/apis/queries/masters.queries";
import { Checkbox } from "@/components/ui/checkbox";
import {
  useAddMultiplePriceForProduct,
  useAllProducts,
  useExistingProduct,
} from "@/apis/queries/product.queries";
import ProductCard from "@/components/modules/trending/ProductCard";
import { debounce } from "lodash";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import Footer from "@/components/shared/Footer";
import Pagination from "@/components/shared/Pagination";
import { useMe } from "@/apis/queries/user.queries";
import { getCookie } from "cookies-next";
import { PUREMOON_TOKEN_KEY } from "@/utils/constants";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import Image from "next/image";
import LoaderPrimaryIcon from "@/public/images/load-primary.png";
import SkeletonProductCardLoader from "@/components/shared/SkeletonProductCardLoader";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";

const ExistingProductsPage = () => {
  const t = useTranslations();
  const { langDir } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [searchProductTerm, setSearchProductTerm] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBrandIds, setSelectedBrandIds] = useState<number[]>([]);
  const [sortBy] = useState("desc");
  const [productFilter, setProductFilter] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(8);
  const [haveAccessToken, setHaveAccessToken] = useState(false);
  const accessToken = getCookie(PUREMOON_TOKEN_KEY);
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);

  const me = useMe();

  const allProductsQuery = useExistingProduct({
    page,
    limit,
    sort: sortBy,
    brandIds: selectedBrandIds.map((item) => item.toString()).join(",") || undefined,
    term: searchProductTerm !== "" ? searchProductTerm : undefined,
    // userId: me.data?.data?.id,
    brandAddedBy: me.data?.data?.id
  });

  const brandsQuery = useBrands({ term: searchTerm, addedBy: me.data?.data?.id, type: 'BRAND' });

  const addMultiplePriceForProductIds = useAddMultiplePriceForProduct();

  const memoizedBrands = useMemo(() => {
    return (
      brandsQuery?.data?.data.map((item: IBrands) => {
        return { label: item.brandName, value: item.id };
      }) || []
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandsQuery?.data?.data?.length]);

  const handleProductDebounce = debounce((event: any) => {
    setSearchProductTerm(event.target.value);
  }, 1000);

  const handleBrandDebounce = debounce((event: any) => {
    setSearchTerm(event.target.value);
  }, 1000);

  const handleProductIds = (checked: boolean | string, id: number) => {
    let tempArr = selectedProductIds || [];
    if (checked && !tempArr.find((ele: number) => ele === id)) {
      tempArr = [...tempArr, id];
    }

    if (!checked && tempArr.find((ele: number) => ele === id)) {
      tempArr = tempArr.filter((ele: number) => ele !== id);
    }

    setSelectedProductIds(tempArr);
  };

  const handleBrandChange = (
    checked: boolean | string,
    item: ISelectOptions,
  ) => {
    let tempArr = selectedBrandIds || [];
    if (checked && !tempArr.find((ele: number) => ele === item.value)) {
      tempArr = [...tempArr, item.value];
    }

    if (!checked && tempArr.find((ele: number) => ele === item.value)) {
      tempArr = tempArr.filter((ele: number) => ele !== item.value);
    }
    setSelectedBrandIds(tempArr);
  };

  const memoizedProductList = useMemo(() => {
    return (
      allProductsQuery?.data?.data?.map((item: any) => ({
        id: item.id,
        productName: item?.productName || "-",
        productPrice: item?.productPrice || 0,
        offerPrice: item?.offerPrice || 0,
        productImage: item?.existingProductImages?.[0]?.image,
        categoryName: item?.category?.name || "-",
        skuNo: item?.skuNo,
        brandName: item?.brand?.brandName || "-",
        productReview: [], // ExistingProduct doesn't have reviews
        productProductPriceId: item?.id, // Use the existing product ID
        productProductPrice: item?.offerPrice, // Use the existing product offer price
        shortDescription: item?.shortDescription || "-",
        consumerDiscount: 0, // ExistingProduct doesn't have consumer discount
        askForPrice: "NO", // ExistingProduct doesn't have askForPrice
      })) || []
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    allProductsQuery?.data?.data,
    allProductsQuery?.data?.data?.length,
    sortBy,
    page,
    limit,
    searchTerm,
    selectedBrandIds,
  ]);

  const onSubmit = async () => {
    const data = selectedProductIds.map((item: number) => ({
      productId: item,
      status: "INACTIVE",
    }));
    // return;
    const response = await addMultiplePriceForProductIds.mutateAsync({
      productPrice: data,
    });

    if (response.status && response.data) {
      toast({
        title: t("product_price_add_successful"),
        description: response.message,
        variant: "success",
      });
      setSelectedProductIds([]);
      router.push("/manage-products");
    } else {
      toast({
        title: t("product_price_add_failed"),
        description: response.message,
        variant: "danger",
      });
    }
  };

  useEffect(() => {
    if (accessToken) {
      setHaveAccessToken(true);
    } else {
      setHaveAccessToken(false);
    }
  }, [accessToken]);

  return (
    <>
      <div className="body-content-s1">
        <div className="trending-search-sec manage_product_sec mt-0">
          <div className="container m-auto flex flex-wrap px-3">
            <div className="mb-5 flex w-full flex-wrap items-center justify-between border-b border-solid border-gray-300 pb-3.5">
              <div className="flex flex-wrap items-center justify-start">
                <h4 className="mr-3 whitespace-nowrap text-xl font-normal capitalize text-color-dark md:mr-6 md:text-2xl" dir={langDir} translate="no">
                  {t("choose_products")}
                </h4>
              </div>
            </div>
            <div className={productFilter ? "left-filter show" : "left-filter"}>
              <div className="filter-sub-header">
                <Input
                  type="text"
                  placeholder={t("search_product")}
                  className="border-color-[rgb(232 232 232 / var(--tw-border-opacity))] h-[45px] w-full rounded-none border border-solid px-3 py-0 text-sm font-normal"
                  onChange={handleProductDebounce}
                  dir={langDir}
                  translate="no"
                />
              </div>
              <Accordion
                type="multiple"
                defaultValue={["brand"]}
                className="filter-col"
              >
                <AccordionItem value="brand">
                  <AccordionTrigger className="px-3 text-base hover:no-underline!" translate="no">
                    {t("by_brand")}
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="filter-sub-header">
                      <Input
                        type="text"
                        placeholder={t("search_brand")}
                        className="custom-form-control-s1 searchInput rounded-none"
                        onChange={handleBrandDebounce}
                        dir={langDir}
                        translate="no"
                      />
                    </div>
                    <div className="filter-body-part">
                      <div className="filter-checklists">
                        {!memoizedBrands.length ? (
                          <p className="text-center text-sm font-medium" dir={langDir} translate="no">
                            {t("no_data_found")}
                          </p>
                        ) : null}
                        {memoizedBrands.map((item: ISelectOptions) => (
                          <div key={item.value} className="div-li">
                            <Checkbox
                              id={item.label}
                              className="border border-solid border-gray-300 data-[state=checked]:bg-dark-orange!"
                              onCheckedChange={(checked) =>
                                handleBrandChange(checked, item)
                              }
                              checked={selectedBrandIds.includes(item.value)}
                            />
                            <div className="grid gap-1.5 leading-none">
                              <label
                                htmlFor={item.label}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                {item.label}
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
            <div
              className="left-filter-overlay"
              onClick={() => setProductFilter(false)}
            ></div>
            <div className="right-products">
              {allProductsQuery.isLoading ? (
                <div className="grid grid-cols-4 gap-5">
                  {Array.from({ length: 8 }).map((_, index) => (
                    <SkeletonProductCardLoader key={index} />
                  ))}
                </div>
              ) : null}

              {!memoizedProductList.length && !allProductsQuery.isLoading ? (
                <p className="text-center text-sm font-medium" dir={langDir} translate="no">
                  {t("no_data_found")}
                </p>
              ) : null}

              <div className="product-list-s1">
                {memoizedProductList.map((item: TrendingProduct) => (
                  <ProductCard
                    key={item.id}
                    item={item}
                    onWishlist={() => { }}
                    inWishlist={item?.inWishlist}
                    haveAccessToken={haveAccessToken}
                    isSelectable
                    selectedIds={selectedProductIds}
                    onSelectedId={handleProductIds}
                  />
                ))}
              </div>

              {allProductsQuery.data?.totalCount > 8 ? (
                <Pagination
                  page={page}
                  setPage={setPage}
                  totalCount={allProductsQuery.data?.totalCount}
                  limit={limit}
                />
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {selectedProductIds.length ? (
        <div className="fixed bottom-0 left-0 z-10 flex w-full items-center justify-end border-t border-solid border-gray-300 bg-dark-orange px-10 py-3">
          <p className="mr-4 text-base font-medium text-white" translate="no">
            {t("n_products_selected").replace("{n}", String(selectedProductIds.length))}
          </p>
          <Button
            type="submit"
            onClick={onSubmit}
            size="lg"
            className="flex items-center rounded-sm bg-white text-sm font-bold text-dark-orange"
            disabled={addMultiplePriceForProductIds.isPending}
            dir={langDir}
            translate="no"
          >
            {addMultiplePriceForProductIds.isPending ? (
              <>
                <Image
                  src={LoaderPrimaryIcon}
                  alt="fb-icon"
                  width={20}
                  height={20}
                  className="mr-2 animate-spin"
                />
                <span>{t("please_wait")}</span>
              </>
            ) : (
              t("next")
            )}
          </Button>
        </div>
      ) : null}
      <Footer />
    </>
  );
};

export default ExistingProductsPage;
