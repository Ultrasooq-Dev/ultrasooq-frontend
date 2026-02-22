"use client";
import React, { useEffect, useMemo, useRef, useState, use } from "react";
import { debounce } from "lodash";
import { useUserOwnDropshipableProducts, useExistingProduct } from "@/apis/queries/product.queries";
import DropshipProductManageCard from "@/components/modules/dropship/DropshipProductManageCard";
import ExistingProductCard from "@/components/modules/manageProducts/ExistingProductCard";
import Pagination from "@/components/shared/Pagination";
import GridIcon from "@/components/icons/GridIcon";
import ListIcon from "@/components/icons/ListIcon";
import { useMe } from "@/apis/queries/user.queries";
import { useCurrentAccount } from "@/apis/queries/auth.queries";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { useClickOutside } from "use-events";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import Image from "next/image";
import { getCookie } from "cookies-next";
import { PUREMOON_TOKEN_KEY } from "@/utils/constants";
import BannerImage from "@/public/images/rfq-sec-bg.png";
import Footer from "@/components/shared/Footer";
import { IoMdAdd } from "react-icons/io";
import { Truck } from "lucide-react";
import SkeletonProductCardLoader from "@/components/shared/SkeletonProductCardLoader";
import { useQueryClient } from "@tanstack/react-query";
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
import { IBrands, ISelectOptions } from "@/utils/types/common.types";
import { Checkbox } from "@/components/ui/checkbox";
import { useBrands } from "@/apis/queries/masters.queries";
import { useCategory } from "@/apis/queries/category.queries";
import { PRODUCT_CATEGORY_ID } from "@/utils/constants";
import CategoryFilter from "@/components/modules/manageProducts/CategoryFilter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface DropshipProductsPageProps {
  searchParams?: Promise<{ term?: string }>;
}

const DropshipProductsPage = (props: DropshipProductsPageProps) => {
  const searchParams = use(props.searchParams || Promise.resolve({}));
  const t = useTranslations();
  const { langDir } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const router = useRouter();
  const wrapperRef = useRef(null);
  const [viewType, setViewType] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");
  const [searchDropshipTerm, setSearchDropshipTerm] = useState((searchParams as { term?: string })?.term || "");
  const [selectedBrandIds, setSelectedBrandIds] = useState<number[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [searchTermBrand, setSearchTermBrand] = useState("");
  const [activeSearchTermBrand, setActiveSearchTermBrand] = useState("");
  const [haveAccessToken, setHaveAccessToken] = useState(false);
  const accessToken = getCookie(PUREMOON_TOKEN_KEY);
  const [page, setPage] = useState(1);
  const [limit] = useState(8);
  const [cartList, setCartList] = useState<any[]>([]);
  const addToWishlist = useAddToWishList();
  const deleteFromWishlist = useDeleteFromWishList();

  // Tab state management
  const [activeTab, setActiveTab] = useState<'dropshipable-products' | 'existing-products'>('dropshipable-products');
  
  // Existing products state
  const [existingProductsPage, setExistingProductsPage] = useState(1);
  const [existingProductsLimit] = useState(8);
  const [existingProductsSearchTerm, setExistingProductsSearchTerm] = useState("");
  const [activeExistingProductsSearchTerm, setActiveExistingProductsSearchTerm] = useState("");
  const [existingProductsSelectedBrandIds, setExistingProductsSelectedBrandIds] = useState<number[]>([]);
  const [existingProductsSelectedCategoryIds, setExistingProductsSelectedCategoryIds] = useState<number[]>([]);
  const [existingProductsSelectedType, setExistingProductsSelectedType] = useState<string>("");

  const searchInputRef = useRef<HTMLInputElement>(null);

  const [isClickedOutside] = useClickOutside([wrapperRef], (event) => {});

  const me = useMe(haveAccessToken);
  const currentAccount = useCurrentAccount();
  const dropshipProductsQuery = useUserOwnDropshipableProducts({
    page,
    limit,
    term: searchDropshipTerm,
    categoryIds: selectedCategoryIds.length > 0 ? selectedCategoryIds.join(',') : undefined,
    brandIds: selectedBrandIds.length > 0 ? selectedBrandIds.join(',') : undefined,
    sort: sortBy === 'newest' ? 'DESC' : 'ASC',
  }, haveAccessToken);

  // Existing products queries
  const existingProductsQueryParams = {
    page: existingProductsSelectedType ? 1 : existingProductsPage,
    limit: existingProductsSelectedType ? 100 : existingProductsLimit,
    sort: "desc",
    brandIds: existingProductsSelectedBrandIds.map((item) => item.toString()).join(",") || undefined,
    categoryIds: existingProductsSelectedCategoryIds.map((item) => item.toString()).join(",") || undefined,
    term: activeExistingProductsSearchTerm !== "" ? activeExistingProductsSearchTerm : undefined,
    brandAddedBy: me.data?.data?.id,
    productType: existingProductsSelectedType || undefined,
    type: existingProductsSelectedType || undefined
  };

  const existingProductsQuery = useExistingProduct(existingProductsQueryParams);

  // Brands query
  const brandsQuery = useBrands({
    addedBy: undefined,
    term: activeSearchTermBrand,
  });

  // Existing products brands query
  const existingProductsBrandsQuery = useBrands({ 
    term: activeSearchTermBrand, 
    addedBy: me.data?.data?.id, 
    type: 'BRAND' 
  });

  // Categories query
  const categoriesQuery = useCategory(PRODUCT_CATEGORY_ID.toString());

  const memoizedBrands = useMemo(() => {
    if (brandsQuery.data?.data) {
      return brandsQuery.data.data.map((item: IBrands) => ({
        label: item.brandName,
        value: item.id,
      }));
    }
    return [];
  }, [brandsQuery.data?.data]);

  // Existing products memoized data
  const memoizedExistingProductsBrands = useMemo(() => {
    return (
      existingProductsBrandsQuery?.data?.data.map((item: IBrands) => {
        return { label: item.brandName, value: item.id };
      }) || []
    );
  }, [existingProductsBrandsQuery?.data?.data?.length]);

  const memoizedCategories = useMemo(() => {
    if (categoriesQuery?.data?.data?.children) {
      return categoriesQuery.data.data.children.map((item: any) => {
        return { label: item.name, value: item.id };
      });
    }
    return [];
  }, [categoriesQuery?.data?.data?.children]);

  const memoizedExistingProductList = useMemo(() => {
    let products = existingProductsQuery?.data?.data?.map((item: any) => ({
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

    // Frontend filtering by product type if backend doesn't support it
    if (existingProductsSelectedType && products.length > 0) {
      products = products.filter((product: any) => product.productType === existingProductsSelectedType);
    }

    // Frontend filtering by category if backend doesn't support it
    if (existingProductsSelectedCategoryIds.length > 0 && products.length > 0) {
      products = products.filter((product: any) => 
        existingProductsSelectedCategoryIds.includes(product.categoryId)
      );
    }

    return products;
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

  // Calculate filtered total count for pagination
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

  const handleDropshipDebounce = debounce((event: any) => {
    setSearchDropshipTerm(event.target.value);
  }, 1000);

  const handleDropshipSearch = () => {
    // Trigger search by setting the search term
    if (searchInputRef.current) {
      setSearchDropshipTerm(searchInputRef.current.value);
    }
  };


  const handleCartPage = () => router.push("/dropship-cart");

  const memoizedDropshipProducts = useMemo(() => {
    if (dropshipProductsQuery.data?.data) {
      return dropshipProductsQuery.data?.data.map((item: any) => {
        return {
          ...item,
          isAvailableForDropship: true,
        };
      }) || [];
    } else {
      return [];
    }
  }, [dropshipProductsQuery.data?.data]);

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
        queryKey: ["user-own-dropshipable-products"],
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
        queryKey: ["user-own-dropshipable-products"],
      });
    } else {
      toast({
        title: response.message || t("item_not_added_to_wishlist"),
        description: t("check_your_wishlist_for_more_details"),
        variant: "danger",
      });
    }
  };

  useEffect(() => {
    if (isClickedOutside) {
      // Handle any cleanup if needed
    }
  }, [isClickedOutside]);

  const selectAll = () => {
    // Select all brands
    const allBrandIds = memoizedBrands.map((brand: ISelectOptions) => brand.value);
    setSelectedBrandIds(allBrandIds);
  };

  const clearFilter = () => {
    setSearchDropshipTerm("");
    setSelectedBrandIds([]);
    setSelectedCategoryIds([]);
    setSearchTermBrand("");
    setActiveSearchTermBrand("");

    if (searchInputRef?.current) searchInputRef.current.value = "";
  };

  // Brand filter handlers
  const handleBrandSearchChange = (event: any) => {
    setSearchTermBrand(event.target.value);
  };

  const handleBrandSearch = () => {
    setActiveSearchTermBrand(searchTermBrand);
    if (brandsQuery.refetch) {
      brandsQuery.refetch();
    }
  };

  const handleBrandChange = (checked: boolean | string, item: ISelectOptions) => {
    let tempArr = selectedBrandIds || [];
    if (checked && !tempArr.find((ele: number) => ele === item.value)) {
      tempArr = [...tempArr, item.value];
    }

    if (!checked && tempArr.find((ele: number) => ele === item.value)) {
      tempArr = tempArr.filter((ele: number) => ele !== item.value);
    }
    setSelectedBrandIds(tempArr);
  };

  // Category filter handlers
  const handleCategoryChange = (categoryIds: number[]) => {
    setSelectedCategoryIds(categoryIds);
  };

  const handleCategoryClear = () => {
    setSelectedCategoryIds([]);
  };

  // Existing products handlers
  const handleExistingProductsSearchChange = (event: any) => {
    setExistingProductsSearchTerm(event.target.value);
  };

  const handleExistingProductsSearch = () => {
    setActiveExistingProductsSearchTerm(existingProductsSearchTerm);
    if (existingProductsQuery.refetch) {
      existingProductsQuery.refetch();
    }
  };

  const handleExistingProductsBrandChange = (
    checked: boolean | string,
    item: ISelectOptions,
  ) => {
    let tempArr = existingProductsSelectedBrandIds || [];
    if (checked && !tempArr.find((ele: number) => ele === item.value)) {
      tempArr = [...tempArr, item.value];
    }

    if (!checked && tempArr.find((ele: number) => ele === item.value)) {
      tempArr = tempArr.filter((ele: number) => ele !== item.value);
    }
    setExistingProductsSelectedBrandIds(tempArr);
  };

  const handleExistingProductsCategoryChange = (categoryIds: number[]) => {
    setExistingProductsSelectedCategoryIds(categoryIds);
  };

  const handleExistingProductsCategoryClear = () => {
    setExistingProductsSelectedCategoryIds([]);
  };

  const handleAddSingleProductToDropship = (productId: number) => {
    // Navigate to dropship creation page with the product ID prefilled
    router.push(`/dropship-products/create-dropshipable?productId=${productId}`);
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
      <title dir={langDir} translate="no">{`${t("my_dropship_products")} | Ultrasooq`}</title>
      <div className="min-h-screen bg-muted">
        <div className="w-full px-8 lg:px-12 py-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <Truck className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-xl font-semibold text-foreground capitalize">
                      {(() => {
                        const account = currentAccount?.data?.data?.account;
                        if (currentAccount?.data?.data?.isMainAccount) {
                          return (account as any)?.firstName || account?.accountName || "Main Account";
                        } else {
                          return account?.accountName || (account as any)?.companyName || "Account";
                        }
                      })()}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      {currentAccount?.data?.data?.account?.tradeRole || "User"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {activeTab === 'dropshipable-products' && (
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder={t("search_product")}
                      className="w-64 h-10"
                      onChange={handleDropshipDebounce}
                      ref={searchInputRef}
                      defaultValue={(searchParams as { term?: string })?.term || ""}
                      dir={langDir}
                      translate="no"
                    />
                    <Button
                      type="button"
                      onClick={handleDropshipSearch}
                      disabled={!searchDropshipTerm.trim()}
                      className="h-10 px-4 bg-primary hover:bg-primary/90 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {t("search")}
                    </Button>
                  </div>
                )}

                {activeTab === 'existing-products' && (
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder={t("search_product")}
                      className="w-64 h-10"
                      onChange={handleExistingProductsSearchChange}
                      dir={langDir}
                      translate="no"
                    />
                    <Button
                      type="button"
                      onClick={handleExistingProductsSearch}
                      disabled={!existingProductsSearchTerm.trim()}
                      className="h-10 px-4 bg-primary hover:bg-primary/90 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {t("search")}
                    </Button>
                  </div>
                )}

                {haveAccessToken && me?.data?.data?.tradeRole != 'BUYER' ? (
                  <Button
                    onClick={() => router.push('/dropship-products/create-dropshipable')}
                    className="flex items-center gap-2"
                  >
                    <IoMdAdd className="h-4 w-4" />
                    {t("create_dropshipable_product")}
                  </Button>
                ) : null}
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mb-6">
            <div className="border-b border-border">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('dropshipable-products')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'dropshipable-products'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-muted-foreground hover:border-border'
                  }`}
                >
                  {t("dropshipable_products")}
                </button>
                <button
                  onClick={() => setActiveTab('existing-products')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'existing-products'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-muted-foreground hover:border-border'
                  }`}
                >
                  {t("existing_platform_products")}
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          {activeTab === 'dropshipable-products' ? (
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Filters Sidebar - Left */}
              <div className="lg:w-1/4">
                <div className="bg-card rounded-lg shadow-xs p-6">
                  <div className="mb-4">
                    <div className="flex gap-2 mb-4">
                      <button 
                        type="button" 
                        onClick={selectAll}
                        className="px-3 py-2 bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors text-sm"
                      >
                        {t("select_all")}
                      </button>
                      <button 
                        type="button" 
                        onClick={clearFilter}
                        className="px-3 py-2 bg-muted text-muted-foreground rounded hover:bg-muted transition-colors text-sm"
                      >
                        {t("clean_select")}
                      </button>
                    </div>
                  </div>

                  {/* Category Filter */}
                  <Accordion
                    type="multiple"
                    defaultValue={["category_filter"]}
                    className="mb-4"
                  >
                    <AccordionItem value="category_filter">
                      <AccordionTrigger className="text-base hover:no-underline!">
                        {t("by_category")}
                      </AccordionTrigger>
                      <AccordionContent>
                        <CategoryFilter
                          selectedCategoryIds={selectedCategoryIds}
                          onCategoryChange={handleCategoryChange}
                          onClear={handleCategoryClear}
                        />
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>

                  {/* Brand Filter */}
                  <Accordion
                    type="multiple"
                    defaultValue={["brand"]}
                    className="mb-4"
                  >
                    <AccordionItem value="brand">
                      <AccordionTrigger className="text-base hover:no-underline!">
                        {t("by_brand")}
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="mb-3">
                          <div className="flex gap-2">
                            <Input
                              type="text"
                              placeholder={t("search_brand")}
                              className="flex-1 h-8 text-sm"
                              onChange={handleBrandSearchChange}
                              dir={langDir}
                              translate="no"
                            />
                            <Button
                              type="button"
                              onClick={handleBrandSearch}
                              disabled={!searchTermBrand.trim()}
                              size="sm"
                              className="h-8 px-3 bg-primary hover:bg-primary/90 disabled:bg-gray-400 disabled:cursor-not-allowed text-xs"
                            >
                              {t("search")}
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {!memoizedBrands.length ? (
                            <p className="text-center text-sm text-muted-foreground">
                              {t("no_data_found")}
                            </p>
                          ) : null}
                          {memoizedBrands.map((item: ISelectOptions) => (
                            <div key={item.value} className="flex items-center space-x-2">
                              <Checkbox
                                id={item.label}
                                className="border border-border data-[state=checked]:bg-primary!"
                                onCheckedChange={(checked) =>
                                  handleBrandChange(checked, item)
                                }
                                checked={selectedBrandIds.includes(item.value)}
                              />
                              <label
                                htmlFor={item.label}
                                className="text-sm font-medium leading-none cursor-pointer"
                              >
                                {item.label}
                              </label>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              </div>

              {/* Products List - Right */}
              <div className="lg:w-3/4">
                <div className="bg-card rounded-lg shadow-xs p-6">
                  <div className="mb-4">
                    <h2 className="text-xl font-semibold">
                      {t("dropshipable_products")} ({dropshipProductsQuery.data?.totalCount || 0})
                    </h2>
                  </div>

                  {/* Products List */}
                  {dropshipProductsQuery.isLoading ? (
                    <div className="space-y-4">
                      {Array.from({ length: 6 }).map((_, index) => (
                        <SkeletonProductCardLoader key={index} />
                      ))}
                    </div>
                  ) : dropshipProductsQuery.data?.data?.length > 0 ? (
                    <div className="space-y-4">
                      {memoizedDropshipProducts.map((item: any) => (
                        <DropshipProductManageCard
                          key={item.id}
                          id={item.id}
                          productId={item.productId || item.id}
                          status={item.status || "ACTIVE"}
                          askForPrice={item.askForPrice || "false"}
                          askForStock={item.askForStock || "false"}
                          productImage={item.productImages?.[0]?.image || item.productImages?.[0]?.imageName || null}
                          productName={item.productName}
                          productPrice={item.productPrice || item.product_productPrice?.[0]?.productPrice || "0"}
                          offerPrice={item.offerPrice || item.product_productPrice?.[0]?.offerPrice || "0"}
                          deliveryAfter={item.deliveryAfter || item.product_productPrice?.[0]?.deliveryAfter || 0}
                          stock={item.stock || item.product_productPrice?.[0]?.stock || 0}
                          consumerType={item.consumerType || item.product_productPrice?.[0]?.consumerType || "CONSUMER"}
                          sellType={item.sellType || item.product_productPrice?.[0]?.sellType || "NORMALSELL"}
                          timeOpen={item.timeOpen || item.product_productPrice?.[0]?.timeOpen || null}
                          timeClose={item.timeClose || item.product_productPrice?.[0]?.timeClose || null}
                          vendorDiscount={item.vendorDiscount || item.product_productPrice?.[0]?.vendorDiscount || null}
                          vendorDiscountType={item.vendorDiscountType || item.product_productPrice?.[0]?.vendorDiscountType || null}
                          consumerDiscount={item.consumerDiscount || item.product_productPrice?.[0]?.consumerDiscount || null}
                          consumerDiscountType={item.consumerDiscountType || item.product_productPrice?.[0]?.consumerDiscountType || null}
                          minQuantity={item.minQuantity || item.product_productPrice?.[0]?.minQuantity || null}
                          maxQuantity={item.maxQuantity || item.product_productPrice?.[0]?.maxQuantity || null}
                          minCustomer={item.minCustomer || item.product_productPrice?.[0]?.minCustomer || null}
                          maxCustomer={item.maxCustomer || item.product_productPrice?.[0]?.maxCustomer || null}
                          minQuantityPerCustomer={item.minQuantityPerCustomer || item.product_productPrice?.[0]?.minQuantityPerCustomer || null}
                          maxQuantityPerCustomer={item.maxQuantityPerCustomer || item.product_productPrice?.[0]?.maxQuantityPerCustomer || null}
                          productCondition={item.productCondition || item.product_productPrice?.[0]?.productCondition || "New"}
                          onRemove={(id) => {
                            // Handle product removal
                          }}
                          onWishlist={() =>
                            handleAddToWishlist(
                              item.id,
                              item?.product_wishlist,
                            )
                          }
                          isCreatedByMe={item?.userId === me.data?.data?.id}
                          inWishlist={item?.product_wishlist?.find(
                            (el: any) => el?.userId === me.data?.data?.id,
                          )}
                          haveAccessToken={haveAccessToken}
                          productType={item.productType}
                          isDropshipped={item.isDropshipped}
                          brandName={item.brand?.brandName}
                          categoryName={item.category?.categoryName}
                          shortDescription={item.product_productShortDescription?.[0]?.shortDescription || item.shortDescription}
                          skuNo={item.skuNo}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-muted-foreground mb-4">
                        <Truck className="h-16 w-16 mx-auto" />
                      </div>
                      <h3 className="text-lg font-medium text-foreground mb-2">
                        {t("no_dropship_products")}
                      </h3>
                      <p className="text-muted-foreground mb-6">
                        {t("no_dropship_products_description")}
                      </p>
                      <Button
                        onClick={() => router.push('/dropship-products/create-dropshipable')}
                        className="flex items-center gap-2"
                      >
                        <IoMdAdd className="h-4 w-4" />
                        {t("create_first_dropship_product")}
                      </Button>
                    </div>
                  )}

                  {/* Pagination */}
                  {dropshipProductsQuery.data?.totalCount > 8 && (
                    <div className="mt-8">
                      <Pagination
                        page={page}
                        setPage={setPage}
                        totalCount={dropshipProductsQuery.data?.totalCount}
                        limit={limit}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : activeTab === 'existing-products' ? (
            /* Existing Products Tab */
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Filters - Left Side */}
              <div className="lg:w-1/4">
                <div className="bg-card rounded-lg shadow-xs p-6">
                  <div className="mb-4">
                    <div className="flex gap-2 mb-4">
                      <button 
                        type="button" 
                        onClick={() => {
                          setExistingProductsSelectedBrandIds(
                            existingProductsBrandsQuery?.data?.data?.map((item: any) => item.id) || []
                          );
                          setExistingProductsSelectedCategoryIds(
                            categoriesQuery?.data?.data?.children?.map((item: any) => item.id) || []
                          );
                        }}
                        className="px-3 py-2 bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors text-sm"
                      >
                        {t("select_all")}
                      </button>
                      <button 
                        type="button" 
                        onClick={() => {
                          setExistingProductsSelectedBrandIds([]);
                          setExistingProductsSelectedCategoryIds([]);
                          setExistingProductsSearchTerm("");
                          setActiveExistingProductsSearchTerm("");
                          setSearchTermBrand("");
                          setActiveSearchTermBrand("");
                        }}
                        className="px-3 py-2 bg-muted text-muted-foreground rounded hover:bg-muted transition-colors text-sm"
                      >
                        {t("clean_select")}
                      </button>
                    </div>
                  </div>

                  {/* Category Filter */}
                  <Accordion
                    type="multiple"
                    defaultValue={["category"]}
                    className="mb-4"
                  >
                    <AccordionItem value="category">
                      <AccordionTrigger className="text-base hover:no-underline!">
                        {t("by_category")}
                      </AccordionTrigger>
                      <AccordionContent>
                        <CategoryFilter
                          selectedCategoryIds={existingProductsSelectedCategoryIds}
                          onCategoryChange={handleExistingProductsCategoryChange}
                          onClear={handleExistingProductsCategoryClear}
                        />
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>

                  {/* Brand Filter */}
                  <Accordion
                    type="multiple"
                    defaultValue={["brand"]}
                    className="mb-4"
                  >
                    <AccordionItem value="brand">
                      <AccordionTrigger className="text-base hover:no-underline!">
                        {t("by_brand")}
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="mb-3">
                          <div className="flex gap-2">
                            <Input
                              type="text"
                              placeholder={t("search_brand")}
                              className="flex-1 h-8 text-sm"
                              onChange={handleBrandSearchChange}
                              dir={langDir}
                              translate="no"
                            />
                            <Button
                              type="button"
                              onClick={handleBrandSearch}
                              disabled={!searchTermBrand.trim()}
                              size="sm"
                              className="h-8 px-3 bg-primary hover:bg-primary/90 disabled:bg-gray-400 disabled:cursor-not-allowed text-xs"
                            >
                              {t("search")}
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {!memoizedExistingProductsBrands.length ? (
                            <p className="text-center text-sm text-muted-foreground">
                              {t("no_data_found")}
                            </p>
                          ) : null}
                          {memoizedExistingProductsBrands.map((item: ISelectOptions) => (
                            <div key={item.value} className="flex items-center space-x-2">
                              <Checkbox
                                id={`existing-${item.label}`}
                                className="border border-border data-[state=checked]:bg-primary!"
                                onCheckedChange={(checked) =>
                                  handleExistingProductsBrandChange(checked, item)
                                }
                                checked={existingProductsSelectedBrandIds.includes(item.value)}
                              />
                              <label
                                htmlFor={`existing-${item.label}`}
                                className="text-sm font-medium leading-none cursor-pointer"
                              >
                                {item.label}
                              </label>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>

                  {/* Product Type Filter */}
                  <Accordion
                    type="multiple"
                    defaultValue={["type"]}
                    className="mb-4"
                  >
                    <AccordionItem value="type">
                      <AccordionTrigger className="text-base hover:no-underline!">
                        {t("by_product_type")}
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="existing-type-p"
                              className="border border-border data-[state=checked]:bg-primary!"
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setExistingProductsSelectedType("P");
                                } else {
                                  setExistingProductsSelectedType("");
                                }
                              }}
                              checked={existingProductsSelectedType === "P"}
                            />
                            <label
                              htmlFor="existing-type-p"
                              className="text-sm font-medium leading-none cursor-pointer"
                            >
                              {t("regular_products")}
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="existing-type-r"
                              className="border border-border data-[state=checked]:bg-primary!"
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setExistingProductsSelectedType("R");
                                } else {
                                  setExistingProductsSelectedType("");
                                }
                              }}
                              checked={existingProductsSelectedType === "R"}
                            />
                            <label
                              htmlFor="existing-type-r"
                              className="text-sm font-medium leading-none cursor-pointer"
                            >
                              {t("rfq_products")}
                            </label>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              </div>

              {/* Products List - Right Side */}
              <div className="lg:w-3/4">
                <div className="bg-card rounded-lg shadow-xs p-6">
                  <div className="mb-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-semibold">
                        {t("existing_platform_products")} ({filteredTotalCount})
                      </h2>
                    </div>
                  </div>

                  {existingProductsQuery.isLoading ? (
                    <div className="grid grid-cols-4 gap-5">
                      {Array.from({ length: 8 }).map((_, index) => (
                        <SkeletonProductCardLoader key={index} />
                      ))}
                    </div>
                  ) : null}

                  {!memoizedExistingProductList.length && !existingProductsQuery.isLoading ? (
                    <div className="text-center py-16">
                      <p className="text-muted-foreground text-lg">
                        {t("no_product_found")}
                      </p>
                    </div>
                  ) : null}

                  <div className="space-y-4">
                    {memoizedExistingProductList.map((item: any) => (
                      <ExistingProductCard
                        key={item.id}
                        id={item.id}
                        productImage={item.productImage}
                        productName={item.productName}
                        productPrice={item.productPrice}
                        offerPrice={item.offerPrice}
                        categoryName={item.categoryName}
                        brandName={item.brandName}
                        shortDescription={item.shortDescription}
                        skuNo={item.skuNo}
                        productType={item.productType}
                        isDropshipPage={true}
                        onAddToDropship={handleAddSingleProductToDropship}
                      />
                    ))}
                  </div>

                  {!existingProductsSelectedType && existingProductsQuery.data?.totalCount > existingProductsLimit ? (
                    <div className="mt-8">
                      <Pagination
                        page={existingProductsPage}
                        setPage={setExistingProductsPage}
                        totalCount={existingProductsQuery.data?.totalCount}
                        limit={existingProductsLimit}
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <Footer />
    </>
  );
};

export default DropshipProductsPage;
