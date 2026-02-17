import React, { useEffect, useMemo, useRef, useState } from "react";
import ProductCard from "./ProductCard";
import { useMe } from "@/apis/queries/user.queries";
import {
  useProductVariant,
  useProducts,
  useVendorProducts,
} from "@/apis/queries/product.queries";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import {
  useCartListByUserId,
  useUpdateCartWithLogin,
} from "@/apis/queries/cart.queries";
import {
  useAddToWishList,
  useDeleteFromWishList,
} from "@/apis/queries/wishlist.queries";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { IBrands, ISelectOptions } from "@/utils/types/common.types";
import { Checkbox } from "@/components/ui/checkbox";
import ReactSlider from "react-slider";
import { Button } from "@/components/ui/button";
import { useBrands } from "@/apis/queries/masters.queries";
import { debounce } from "lodash";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import FilterMenuIcon from "@/components/icons/FilterMenuIcon";
import SkeletonProductCardLoader from "@/components/shared/SkeletonProductCardLoader";

type ProductsSectionProps = {
  sellerId?: string;
};

const ProductsSection: React.FC<ProductsSectionProps> = ({ sellerId }) => {
  const t = useTranslations();
  const { langDir, currency } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const searchInputRef = useRef<HTMLInputElement>(null);

  const [searchTermBrand, setSearchTermBrand] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("desc");
  const [productFilter, setProductFilter] = useState(false);
  const [selectedBrandIds, setSelectedBrandIds] = useState<number[]>([]);
  const [displayStoreProducts, setDisplayStoreProducts] = useState(false);
  const [displayBuyGroupProducts, setDisplayBuyGroupProducts] = useState(false);
  const [displayExpiredProducts, setDisplayExpiredProducts] = useState(false);
  const [displayHiddenProducts, setDisplayHiddenProducts] = useState(false);
  const [displayDiscountedProducts, setDisplayDiscountedProducts] =
    useState(false);
  const [productVariants, setProductVariants] = useState<any[]>([]);
  const [cartList, setCartList] = useState<any[]>([]);

  const me = useMe();

  const handleDebounceBrand = debounce((event: any) => {
    setSearchTermBrand(event.target.value);
  }, 1000);

  const brandsQuery = useBrands({
    term: searchTermBrand,
  });

  const memoizedBrands = useMemo(() => {
    return (
      brandsQuery?.data?.data.map((item: IBrands) => {
        return { label: item.brandName, value: item.id };
      }) || []
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandsQuery?.data?.data?.length]);

  const sellType = () => {
    if (displayStoreProducts && displayBuyGroupProducts) {
      return "NORMALSELL,BUYGROUP";
    }

    if (displayStoreProducts) {
      return "NORMALSELL";
    }

    if (displayBuyGroupProducts) {
      return "BUYGROUP";
    }

    return "";
  };

  const fetchProductVariant = useProductVariant();

  const productsQuery = useProducts(
    {
      userId: String(me?.data?.data?.id),
      page: 1,
      limit: 10,
      term: searchTerm,
      brandIds: selectedBrandIds.join(","),
      status: displayHiddenProducts ? "INACTIVE" : "",
      expireDate: displayExpiredProducts ? "expired" : "",
      sellType:
        displayStoreProducts || displayBuyGroupProducts ? sellType() : "",
      discount: displayDiscountedProducts,
      sort: sortBy,
    },
    !!me?.data?.data?.id && !sellerId,
  );

  const handleDebounce = debounce((event: any) => {
    setSearchTerm(event.target.value);
  }, 1000);

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

  const vendorProductsQuery = useVendorProducts(
    {
      adminId: sellerId || "",
      page: 1,
      limit: 10,
      term: searchTerm,
      brandIds: selectedBrandIds.join(","),
      status: "",
      expireDate: displayExpiredProducts ? "expired" : "",
      sellType:
        displayStoreProducts || displayBuyGroupProducts ? sellType() : "",
      discount: displayDiscountedProducts,
      sort: sortBy,
    },
    !!sellerId,
  );

  const selectAll = () => {
    setSelectedBrandIds(
      brandsQuery?.data?.data?.map((item: any) => {
        return item.id;
      }) || [],
    );
    setDisplayStoreProducts(true);
    setDisplayBuyGroupProducts(true);
    setDisplayExpiredProducts(true);
    setDisplayHiddenProducts(true);
    setDisplayDiscountedProducts(true);
  };

  const clearFilter = () => {
    setSearchTerm("");
    setSelectedBrandIds([]);
    setDisplayStoreProducts(false);
    setDisplayBuyGroupProducts(false);
    setDisplayExpiredProducts(false);
    setDisplayHiddenProducts(false);
    setDisplayDiscountedProducts(false);

    if (searchInputRef.current) searchInputRef.current.value = "";
  };

  const updateCartWithLogin = useUpdateCartWithLogin();
  const addToWishlist = useAddToWishList();
  const deleteFromWishlist = useDeleteFromWishList();

  const memoizedProducts = useMemo(() => {
    const mapped = (productsQuery.data?.data?.map((item: any) => {
      // Find the active product price entry (status: "ACTIVE")
      // If no active entry, fall back to the first one
      const activePriceEntry = item?.product_productPrice?.find(
        (pp: any) => pp?.status === "ACTIVE"
      ) || item?.product_productPrice?.[0];
      
      const mappedItem = {
        id: item?.id,
        productName: item?.productName || "-",
        productPrice: item?.productPrice || 0,
        offerPrice: item?.offerPrice || 0,
        productImage: item?.productImages?.[0]?.image,
        categoryName: item?.category?.name || "-",
        skuNo: item?.skuNo,
        brandName: item?.brand?.brandName || "-",
        productReview: item?.productReview || [],
        shortDescription: item?.product_productShortDescription?.length
          ? item?.product_productShortDescription?.[0]?.shortDescription
          : "-",
        status: item?.status || "-",
        productWishlist: item?.product_wishlist || [],
        inWishlist: item?.product_wishlist?.find(
          (ele: any) => ele?.userId === me.data?.data?.id,
        ),
        productProductPriceId: activePriceEntry?.id,
        productProductPrice: activePriceEntry?.offerPrice,
        consumerDiscount: activePriceEntry?.consumerDiscount,
        consumerDiscountType: activePriceEntry?.consumerDiscountType,
        vendorDiscount: activePriceEntry?.vendorDiscount,
        vendorDiscountType: activePriceEntry?.vendorDiscountType,
        askForPrice: activePriceEntry?.askForPrice,
        productPrices: item?.product_productPrice,
        categoryId: item?.categoryId,
        categoryLocation: item?.categoryLocation,
        consumerType: activePriceEntry?.consumerType,
      };
      
      return mappedItem;
    }) || []);
    
    return mapped;
  }, [
    productsQuery.data?.data,
    me.data?.data?.id,
    searchTerm,
    selectedBrandIds,
    displayStoreProducts,
    displayBuyGroupProducts,
    displayExpiredProducts,
    displayHiddenProducts,
    displayDiscountedProducts,
    sortBy,
  ]);

  const memoizedVendorProducts = useMemo(() => {
    return (
      vendorProductsQuery.data?.data?.map((item: any) => {
        // Find the active product price entry (status: "ACTIVE")
        // If no active entry, fall back to the first one
        const activePriceEntry = item?.product_productPrice?.find(
          (pp: any) => pp?.status === "ACTIVE"
        ) || item?.product_productPrice?.[0];
        
        return {
          id: item?.id,
          productName: item?.productName || "-",
          productPrice: item?.productPrice || 0,
          offerPrice: item?.offerPrice || 0,
          productImage: item?.productImages?.[0]?.image,
          categoryName: item?.category?.name || "-",
          skuNo: item?.skuNo,
          brandName: item?.brand?.brandName || "-",
          productReview: item?.productReview || [],
          shortDescription: item?.product_productShortDescription?.length
            ? item?.product_productShortDescription?.[0]?.shortDescription
            : "-",
          status: item?.status || "-",
          productWishlist: item?.product_wishlist || [],
          inWishlist: item?.product_wishlist?.find(
            (ele: any) => ele?.userId === me.data?.data?.id,
          ),
          productProductPriceId: activePriceEntry?.id,
          productProductPrice: activePriceEntry?.offerPrice,
          consumerDiscount: activePriceEntry?.consumerDiscount,
          consumerDiscountType: activePriceEntry?.consumerDiscountType,
          vendorDiscount: activePriceEntry?.vendorDiscount,
          vendorDiscountType: activePriceEntry?.vendorDiscountType,
          askForPrice: activePriceEntry?.askForPrice,
          productPrices: item?.product_productPrice,
          categoryId: item?.categoryId,
          categoryLocation: item?.categoryLocation,
          consumerType: activePriceEntry?.consumerType,
        };
      }) || []
    );
  }, [
    vendorProductsQuery.data?.data,
    me.data?.data?.id,
    searchTerm,
    selectedBrandIds,
    displayStoreProducts,
    displayBuyGroupProducts,
    displayExpiredProducts,
    displayHiddenProducts,
    displayDiscountedProducts,
    sortBy,
  ]);

  const getProductVariants = async () => {
    let productPriceIds = [];
    if (memoizedProducts.length > 0) {
      productPriceIds = memoizedProducts
        .filter((item: any) => item.productPrices.length > 0)
        .map((item: any) => item.productPrices[0].id);
    } else if (memoizedVendorProducts.length > 0) {
      productPriceIds = memoizedVendorProducts
        .filter((item: any) => item.productPrices.length > 0)
        .map((item: any) => item.productPrices[0].id);
    }

    if (productPriceIds.length > 0) {
      const response = await fetchProductVariant.mutateAsync(productPriceIds);
      if (response.status) setProductVariants(response.data);
    }
  };

  useEffect(() => {
    getProductVariants();
  }, [memoizedProducts, memoizedVendorProducts]);

  const cartListByUser = useCartListByUserId({
    page: 1,
    limit: 100,
  });

  useEffect(() => {
    setCartList((cartListByUser.data?.data || []).map((item: any) => item));
  }, [cartListByUser.data?.data]);

  const handleDeleteFromWishlist = async (productId: number) => {
    const response = await deleteFromWishlist.mutateAsync({
      productId,
    });
    if (response.status) {
      toast({
        title: t("item_removed_from_wishlist"),
        description: t("check_your_wishlist_for_more_details"),
        variant: "success",
      });
      queryClient.invalidateQueries({
        queryKey: [
          "product-by-id",
          { productId: String(productId), userId: me.data?.data?.id },
        ],
      });
    } else {
      toast({
        title: t("item_not_removed_from_wishlist"),
        description: t("check_your_wishlist_for_more_details"),
        variant: "danger",
      });
    }
  };

  const handleAddToWishlist = async (
    productId: number,
    wishlistArr?: any[],
  ) => {
    const wishlistObject = wishlistArr?.find(
      (item) => item.userId === me.data?.data?.id,
    );
    // return;
    if (wishlistObject) {
      handleDeleteFromWishlist(wishlistObject?.productId);
      return;
    }

    const response = await addToWishlist.mutateAsync({
      productId,
    });
    if (response.status) {
      toast({
        title: t("item_added_to_wishlist"),
        description: t("check_your_wishlist_for_more_details"),
        variant: "success",
      });
      queryClient.invalidateQueries({
        queryKey: [
          "product-by-id",
          { productId: String(productId), userId: me.data?.data?.id },
        ],
      });
    } else {
      toast({
        title: response.message || t("item_not_added_to_wishlist"),
        description: t("check_your_wishlist_for_more_details"),
        variant: "danger",
      });
    }
  };

  return (
    <div className="trending-search-sec mt-0">
      <div className="container m-auto px-3">
        <div
          className={productFilter ? "left-filter show" : "left-filter"}
          dir={langDir}
        >
          <div className="all_select_button">
            <button type="button" onClick={selectAll} translate="no">
              {t("select_all")}
            </button>
            <button type="button" onClick={clearFilter} translate="no">
              {t("clean_select")}
            </button>
          </div>
          <Accordion
            type="multiple"
            defaultValue={["brand"]}
            className="filter-col"
          >
            <AccordionItem value="brand">
              <AccordionTrigger
                className="px-3 text-base hover:no-underline!"
                dir={langDir}
                translate="no"
              >
                {t("by_brand")}
              </AccordionTrigger>
              <AccordionContent>
                <div className="filter-sub-header">
                  <Input
                    type="text"
                    placeholder={t("search_brand")}
                    className="custom-form-control-s1 searchInput rounded-none"
                    onChange={handleDebounceBrand}
                    dir={langDir}
                    translate="no"
                  />
                </div>
                <div className="filter-body-part">
                  <div className="filter-checklists">
                    {!memoizedBrands.length ? (
                      <p
                        className="text-center text-sm font-medium"
                        dir={langDir}
                        translate="no"
                      >
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
          <Accordion
            type="multiple"
            defaultValue={["product_conditions"]}
            className="filter-col"
          >
            <AccordionItem value="brand">
              <AccordionTrigger
                className="px-3 text-base hover:no-underline!"
                translate="no"
              >
                {t("by_menu")}
              </AccordionTrigger>
              <AccordionContent>
                <div className="filter-body-part">
                  <div className="filter-checklists">
                    <div className="div-li">
                      <Checkbox
                        id="displayStoreProducts"
                        className="border border-solid border-gray-300 data-[state=checked]:bg-dark-orange!"
                        onCheckedChange={(checked: boolean) =>
                          setDisplayStoreProducts(checked)
                        }
                        checked={displayStoreProducts}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <label
                          htmlFor="displayStoreProducts"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          dir={langDir}
                          translate="no"
                        >
                          {t("store")}
                        </label>
                      </div>
                    </div>
                    <div className="div-li">
                      <Checkbox
                        id="displayBuyGroupProducts"
                        className="border border-solid border-gray-300 data-[state=checked]:bg-dark-orange!"
                        onCheckedChange={(checked: boolean) => {
                          setDisplayBuyGroupProducts(checked);
                          setDisplayExpiredProducts(
                            checked ? displayExpiredProducts : false,
                          );
                        }}
                        checked={displayBuyGroupProducts}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <label
                          htmlFor="displayBuyGroupProducts"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          dir={langDir}
                          translate="no"
                        >
                          {t("buy_group")}
                        </label>
                      </div>
                    </div>
                    {displayBuyGroupProducts ? (
                      <div className="div-li">
                        <Checkbox
                          id="displayExpiredProducts"
                          className="border border-solid border-gray-300 data-[state=checked]:bg-dark-orange!"
                          onCheckedChange={(checked: boolean) =>
                            setDisplayExpiredProducts(checked)
                          }
                          checked={displayExpiredProducts}
                        />
                        <div className="grid gap-1.5 leading-none">
                          <label
                            htmlFor="displayExpiredProducts"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            dir={langDir}
                            translate="no"
                          >
                            {t("expired")}
                          </label>
                        </div>
                      </div>
                    ) : null}
                    {!sellerId ? (
                      <div className="div-li">
                        <Checkbox
                          id="displayHiddenProducts"
                          className="border border-solid border-gray-300 data-[state=checked]:bg-dark-orange!"
                          onCheckedChange={(checked: boolean) =>
                            setDisplayHiddenProducts(checked)
                          }
                          checked={displayHiddenProducts}
                        />
                        <div className="grid gap-1.5 leading-none">
                          <label
                            htmlFor="displayHiddenProducts"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            dir={langDir}
                            translate="no"
                          >
                            {t("hidden")}
                          </label>
                        </div>
                      </div>
                    ) : null}
                    <div className="div-li">
                      <Checkbox
                        id="displayDiscountedProducts"
                        className="border border-solid border-gray-300 data-[state=checked]:bg-dark-orange!"
                        onCheckedChange={(checked: boolean) =>
                          setDisplayDiscountedProducts(checked)
                        }
                        checked={displayDiscountedProducts}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <label
                          htmlFor="displayDiscountedProducts"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          dir={langDir}
                          translate="no"
                        >
                          {t("discounted")}
                        </label>
                      </div>
                    </div>
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
          <div className="products-header-filter">
            <div className="le-info">
              {/* TODO: need name here */}
              {/* <h3></h3> */}
            </div>
            <div className="rg-filter">
              {!sellerId && memoizedProducts.length ? (
                <p dir={langDir} translate="no">
                  {t("n_products_found", {
                    n: productsQuery.data?.totalCount,
                  })}
                </p>
              ) : null}

              {sellerId && memoizedVendorProducts.length ? (
                <p dir={langDir} translate="no">
                  {t("n_products_found", {
                    n: vendorProductsQuery.data?.totalCount,
                  })}
                </p>
              ) : null}

              <ul>
                <li>
                  <Input
                    type="text"
                    placeholder={t("search")}
                    className="custom-form-control-s1 searchInput rounded-none bg-white"
                    onChange={handleDebounce}
                    dir={langDir}
                    ref={searchInputRef}
                    translate="no"
                  />
                </li>

                <li>
                  <Select onValueChange={(e) => setSortBy(e)}>
                    <SelectTrigger className="custom-form-control-s1 bg-white">
                      <SelectValue
                        placeholder={t("sort_by")}
                        dir={langDir}
                        translate="no"
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="desc" dir={langDir} translate="no">
                          {t("sort_by_latest")}
                        </SelectItem>
                        <SelectItem value="asc" dir={langDir} translate="no">
                          {t("sort_by_oldest")}
                        </SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </li>

                <li className="block md:hidden">
                  <button
                    type="button"
                    className="view-type-btn"
                    onClick={() => setProductFilter(true)}
                  >
                    <FilterMenuIcon />
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {!sellerId && productsQuery.isLoading ? (
            <div className="grid grid-cols-4 gap-5">
              {Array.from({ length: 8 }).map((_, index: number) => (
                <SkeletonProductCardLoader key={index} />
              ))}
            </div>
          ) : null}

          {sellerId && vendorProductsQuery.isLoading ? (
            <div className="grid grid-cols-4 gap-5">
              {Array.from({ length: 8 }).map((_, index: number) => (
                <SkeletonProductCardLoader key={index} />
              ))}
            </div>
          ) : null}

          {!sellerId &&
          !memoizedProducts.length &&
          !productsQuery?.isLoading ? (
            <p
              className="p-4 text-center text-base font-medium text-color-dark"
              dir={langDir}
              translate="no"
            >
              {t("no_product_found")}
            </p>
          ) : null}

          {sellerId &&
          !memoizedVendorProducts.length &&
          !vendorProductsQuery?.isLoading ? (
            <p
              className="p-4 text-center text-base font-medium text-color-dark"
              dir={langDir}
              translate="no"
            >
              {t("no_product_found")}
            </p>
          ) : null}

          <div className="profile_details_product flex flex-wrap gap-3 md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {!sellerId && memoizedProducts.length && !productsQuery?.isLoading
              ? memoizedProducts.map((item: any) => {
                  const cartItem = cartList?.find(
                    (el: any) => el.productId == item.id,
                  );
                  let relatedCart: any = null;
                  if (cartItem) {
                    relatedCart = cartList
                      ?.filter(
                        (c: any) =>
                          c.serviceId && c.cartProductServices?.length,
                      )
                      .find((c: any) => {
                        return !!c.cartProductServices.find(
                          (r: any) =>
                            r.relatedCartType == "PRODUCT" &&
                            r.productId == item.id,
                        );
                      });
                  }
                  return (
                    <ProductCard
                      key={item.id}
                      item={item}
                      onWishlist={() =>
                        handleAddToWishlist(item.id, item?.productWishlist)
                      }
                      inWishlist={item?.inWishlist}
                      haveAccessToken={!!me.data?.data}
                      productVariants={
                        productVariants.find(
                          (variant: any) => variant.productId == item.id,
                        )?.object || []
                      }
                      isAddedToCart={cartItem ? true : false}
                      cartQuantity={cartItem?.quantity || 0}
                      productVariant={cartItem?.object}
                      cartId={cartItem?.id}
                      relatedCart={relatedCart}
                    />
                  );
                })
              : null}

            {sellerId &&
            memoizedVendorProducts.length &&
            !vendorProductsQuery?.isLoading
              ? memoizedVendorProducts.map((item: any) => {
                  const cartItem = cartList?.find(
                    (el: any) => el.productId == item.id,
                  );
                  let relatedCart: any = null;
                  if (cartItem) {
                    relatedCart = cartList
                      ?.filter(
                        (c: any) =>
                          c.serviceId && c.cartProductServices?.length,
                      )
                      .find((c: any) => {
                        return !!c.cartProductServices.find(
                          (r: any) =>
                            r.relatedCartType == "PRODUCT" &&
                            r.productId == item.id,
                        );
                      });
                  }
                  return (
                    <ProductCard
                      key={item.id}
                      item={item}
                      onWishlist={() =>
                        handleAddToWishlist(item.id, item?.productWishlist)
                      }
                      inWishlist={item?.inWishlist}
                      haveAccessToken={!!me.data?.data}
                      isSeller
                      productVariants={
                        productVariants.find(
                          (variant: any) => variant.productId == item.id,
                        )?.object || []
                      }
                      isAddedToCart={cartItem ? true : false}
                      cartQuantity={cartItem?.quantity || 0}
                      productVariant={cartItem?.object}
                      cartId={cartItem?.id}
                      relatedCart={relatedCart}
                    />
                  );
                })
              : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductsSection;
