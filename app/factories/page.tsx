"use client";
import React, { useEffect, useMemo, useRef, useState, use } from "react";
import { debounce } from "lodash";
import {
  useAddCustomizeProduct,
  useFactoriesProducts,
  useFactoriesCartListByUserId,
  useUpdateFactoriesCartWithLogin,
} from "@/apis/queries/rfq.queries";
import Pagination from "@/components/shared/Pagination";
import GridIcon from "@/components/icons/GridIcon";
import ListIcon from "@/components/icons/ListIcon";
import ProductTable from "@/components/modules/trending/ProductTable";
import FilterMenuIcon from "@/components/icons/FilterMenuIcon";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useMe } from "@/apis/queries/user.queries";
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
import Image from "next/image";
import { getCookie } from "cookies-next";
import { PUREMOON_TOKEN_KEY } from "@/utils/constants";
import BannerImage from "@/public/images/rfq-sec-bg.png";
import SearchIcon from "@/public/images/search-icon-rfq.png";
import Footer from "@/components/shared/Footer";
import SkeletonProductCardLoader from "@/components/shared/SkeletonProductCardLoader";
import FactoriesProductCard from "@/components/modules/factories/FactoriesProductCard";
import { useQueryClient } from "@tanstack/react-query";
import FactoryCartMenu from "@/components/modules/factories/FactoriesCartMenu";
import {
  useAddToWishList,
  useDeleteFromWishList,
} from "@/apis/queries/wishlist.queries";
import { useTranslations } from "next-intl";
import { useCartListByUserId } from "@/apis/queries/cart.queries";
import BrandFilterList from "@/components/modules/rfq/BrandFilterList";
import { useBrands } from "@/apis/queries/masters.queries";
import { ISelectOptions, IBrands } from "@/utils/types/common.types";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import dynamic from "next/dynamic";

const AddToCustomizeForm = dynamic(
  () => import("@/components/modules/factories/AddToCustomizeForm"),
  {
    loading: () => <div className="animate-pulse h-64 bg-gray-200 rounded-lg" />,
    ssr: false,
  },
);

import { useAuth } from "@/context/AuthContext";
import { useProductVariant } from "@/apis/queries/product.queries";
import Cart from "@/components/modules/cartList/Cart";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ShoppingCart, X, Search, Building2, Trash2, Minus } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ReactSlider from "react-slider";
import { Package } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface FactoriesPageProps {
  searchParams?: Promise<{ term?: string }>;
}

const FactoriesPage = (props: FactoriesPageProps) => {
  const searchParams = props.searchParams ? use(props.searchParams) : {};
  const t = useTranslations();
  const { langDir } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { currency } = useAuth();
  const wrapperRef = useRef(null);
  const [viewType, setViewType] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");
  const [searchRfqTerm, setSearchRfqTerm] = useState(searchParams?.term || "");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchTermBrand, setSearchTermBrand] = useState("");
  const [selectedBrandIds, setSelectedBrandIds] = useState<number[]>([]);
  const [priceRange, setPriceRange] = useState<number[]>([]);
  const [minPriceInput, setMinPriceInput] = useState("");
  const [maxPriceInput, setMaxPriceInput] = useState("");
  const [productFilter, setProductFilter] = useState(false);
  const [selectAllBrands, setSelectAllBrands] = useState<boolean>(false);
  const [displayMyProducts, setDisplayMyProducts] = useState("0");
  const [displayRelatedProducts, setDisplayRelatedProducts] = useState(false);
  const [haveAccessToken, setHaveAccessToken] = useState(false);
  const accessToken = getCookie(PUREMOON_TOKEN_KEY);
  const [page, setPage] = useState(1);
  const [limit] = useState(8);
  const [productVariants, setProductVariants] = useState<any[]>([]);
  const [cartList, setCartList] = useState<any[]>([]);
  const [factoriesCartList, setFactoriesCartList] = useState<any[]>([]);
  const addToWishlist = useAddToWishList();
  const deleteFromWishlist = useDeleteFromWishList();

  const searchInputRef = useRef<HTMLInputElement>(null);
  const minPriceInputRef = useRef<HTMLInputElement>(null);
  const maxPriceInputRef = useRef<HTMLInputElement>(null);

  const [isAddToFactoryModalOpen, setIsAddToFactoryModalOpen] = useState(false);
  const [selectedCustomizedProduct, setSelectedCustomizedProduct] = useState<{
    [key: string]: any;
  }>();

  const [isClickedOutside] = useClickOutside([wrapperRef], (event) => {});
  const handleToggleAddModal = () =>
    setIsAddToFactoryModalOpen(!isAddToFactoryModalOpen);

  const me = useMe(haveAccessToken);
  const brandsQuery = useBrands({
    term: searchTerm,
  });
  
  const memoizedBrands = useMemo(() => {
    return (
      brandsQuery?.data?.data.map((item: any) => {
        return { label: item.brandName, value: item.id };
      }) || []
    );
  }, [brandsQuery?.data?.data?.length]);

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

  const factoriesProductsQuery = useFactoriesProducts({
    page,
    limit,
    term: searchRfqTerm,
    adminId:
      me?.data?.data?.tradeRole == "MEMBER"
        ? me?.data?.data?.addedBy
        : me?.data?.data?.id,
    sortType: sortBy,
    brandIds: selectedBrandIds.join(","),
    isOwner: displayMyProducts == "1" ? "me" : "",
    related: displayRelatedProducts
  });
  const fetchProductVariant = useProductVariant();
  const cartListByUser = useCartListByUserId(
    {
      page: 1,
      limit: 100,
    },
    haveAccessToken,
  );
  const factoriesCartByUser = useFactoriesCartListByUserId(
    {
      page: 1,
      limit: 100,
    },
    haveAccessToken,
  );
  const addCustomizeProduct = useAddCustomizeProduct();
  const updateFactoriesCartWithLogin = useUpdateFactoriesCartWithLogin();

  const handleRfqDebounce = debounce((event: any) => {
    setSearchRfqTerm(event.target.value);
  }, 1000);

  const handlePriceDebounce = debounce((event: any) => {
    setPriceRange(event);
  }, 1000);

  const handleMinPriceChange = debounce((event: any) => {
    setMinPriceInput(event.target.value);
  }, 1000);

  const handleMaxPriceChange = debounce((event: any) => {
    setMaxPriceInput(event.target.value);
  }, 1000);

  const handleBrandSearchChange = (event: any) => {
    setSearchTermBrand(event.target.value);
  };

  const handleBrandSearch = () => {
    setSearchTerm(searchTermBrand);
  };

  const handleAddToFactories = (productId: number) => {
    const item = factoriesCartList.find((el: any) => el.productId == productId);
    setSelectedCustomizedProduct({
      id: productId,
      customizedProductId: item?.customizeProductId,
      quantity: item?.quantity,
      fromPrice: item?.customizeProductDetail?.fromPrice,
      toPrice: item?.customizeProductDetail?.toPrice,
      note: item?.customizeProductDetail?.note,
    });
    handleToggleAddModal();
  };

  const memoizedRfqProducts = useMemo(() => {
    return (
      factoriesProductsQuery?.data?.data?.map((item: any) => {
        return {
          ...item,
          isAddedToFactoryCart:
            item?.product_rfqCart?.length &&
            item?.product_rfqCart[0]?.quantity > 0,
          factoryCartQuantity: item?.product_rfqCart?.length
            ? item.product_rfqCart[0].quantity
            : 0,
        };
      }) || []
    );
  }, [factoriesProductsQuery.data?.data]);

  // Transform factories products to TrendingProduct format for ProductTable
  const memoizedProductListForTable = useMemo(() => {
    return (
      memoizedRfqProducts?.map((item: any) => {
        const activePriceEntry =
          item?.product_productPrice?.find(
            (pp: any) => pp?.status === "ACTIVE",
          ) || item?.product_productPrice?.[0];

        return {
          id: item.id,
          productName: item?.productName || "-",
          productPrice: item?.productPrice || 0,
          offerPrice: activePriceEntry?.offerPrice || item?.offerPrice || 0,
          productImage: item?.productImages?.[0]?.image || "-",
          categoryName: item?.category?.name || "-",
          skuNo: item?.skuNo,
          brandName: item?.brand?.brandName || "-",
          productReview: item?.productReview || [],
          productWishlist: item?.product_wishlist || [],
          inWishlist: item?.product_wishlist?.find(
            (ele: any) => ele?.userId === me?.data?.data?.id,
          ),
          shortDescription: item?.product_productShortDescription?.length
            ? item?.product_productShortDescription?.[0]?.shortDescription
            : "-",
          productProductPriceId: activePriceEntry?.id,
          productProductPrice: activePriceEntry?.offerPrice,
          consumerDiscount: activePriceEntry?.consumerDiscount,
          consumerDiscountType: activePriceEntry?.consumerDiscountType,
          vendorDiscount: activePriceEntry?.vendorDiscount,
          vendorDiscountType: activePriceEntry?.vendorDiscountType,
          askForPrice: activePriceEntry?.askForPrice,
          productPrices: item?.product_productPrice || [],
          productQuantity: activePriceEntry?.stock !== undefined && activePriceEntry?.stock !== null
            ? Number(activePriceEntry.stock)
            : (item?.productQuantity !== undefined && item?.productQuantity !== null
              ? Number(item.productQuantity)
              : null),
          categoryId: item?.categoryId,
          categoryLocation: item?.categoryLocation,
          categoryConnections: item?.category?.category_categoryIdDetail || [],
          consumerType: activePriceEntry?.consumerType,
          status: item?.status || "ACTIVE",
        };
      }) || []
    );
  }, [memoizedRfqProducts, me?.data?.data?.id]);

  const getProductVariants = async () => {
    let productPriceIds = memoizedRfqProducts
      .filter((item: any) => item.product_productPrice.length > 0)
      .map((item: any) => item.product_productPrice[0].id);

    const response = await fetchProductVariant.mutateAsync(productPriceIds);
    if (response.status) setProductVariants(response.data);
  };

  useEffect(() => {
    if (memoizedRfqProducts.length) {
      getProductVariants();
    }
  }, [memoizedRfqProducts]);

  useEffect(() => {
    if (cartListByUser.data?.data) {
      setCartList((cartListByUser.data?.data || []).map((item: any) => item));
    }
  }, [cartListByUser.data?.data]);

  useEffect(() => {
    if (factoriesCartByUser.data?.data) {
      setFactoriesCartList((factoriesCartByUser.data?.data || []).map((item: any) => item));
    }
  }, [factoriesCartByUser.data?.data]);

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
        queryKey: ["factoriesProducts"],
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
        queryKey: ["factoriesProducts"],
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
      setSelectedCustomizedProduct(undefined);
    }
  }, [isClickedOutside]);

  const selectAll = () => {
    setSelectAllBrands(true);
  };

  const clearFilter = () => {
    setSelectAllBrands(false);
    setSearchRfqTerm("");
    setSelectedBrandIds([]);
    setDisplayMyProducts("0");
    setMaxPriceInput("");
    setMinPriceInput("");
    setPriceRange([]);

    if (searchInputRef?.current) searchInputRef.current.value = "";
    if (minPriceInputRef.current) minPriceInputRef.current.value = "";
    if (maxPriceInputRef.current) maxPriceInputRef.current.value = "";
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
      <title dir={langDir} translate="no">{`${t("factories")} | Ultrasooq`}</title>

      {/* Full Width Two Column Layout */}
      <div className="min-h-screen w-full bg-white px-2 sm:px-4 lg:px-8">
        <div className="flex h-full flex-col gap-4 lg:flex-row">
          {/* Left Column - Filters (Desktop) - Improved UI */}
          <div className="hidden flex-shrink-0 overflow-y-auto bg-white p-4 lg:block lg:w-1/4">
            <div className="sticky top-4 rounded-xl bg-white p-6 shadow-lg">
              {/* Filter Header */}
              <div className="mb-6 border-b border-gray-200 pb-4">
                <h3 className="mb-3 text-lg font-bold text-gray-900">
                  {t("filters")}
                </h3>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={selectAll}
                    className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                  >
                    {t("select_all")}
                  </button>
                  <button
                    type="button"
                    onClick={clearFilter}
                    className="flex-1 rounded-lg bg-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-300"
                  >
                    {t("clean_select")}
                  </button>
                </div>
              </div>

              {/* Brand Filter - Improved */}
              <div className="mb-6">
                <Accordion
                  type="multiple"
                  defaultValue={["brand"]}
                  className="overflow-hidden rounded-lg border border-gray-200"
                >
                  <AccordionItem value="brand" className="border-0">
                    <AccordionTrigger className="bg-gray-50 px-4 py-3 font-semibold text-gray-900 hover:bg-gray-100">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        <span>{t("by_brand")}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="bg-white px-4 py-4">
                      <div className="mb-3">
                        <div className="flex gap-2">
                          <Input
                            type="text"
                            placeholder={t("search_brand")}
                            className="h-9 flex-1 border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
                            value={searchTermBrand}
                            onChange={handleBrandSearchChange}
                            dir={langDir}
                            translate="no"
                          />
                          <Button
                            type="button"
                            onClick={handleBrandSearch}
                            disabled={!searchTermBrand.trim()}
                            size="sm"
                            className="h-9 bg-blue-600 px-4 text-xs font-medium hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                          >
                            {t("search")}
                          </Button>
                        </div>
                      </div>
                      <div className="max-h-48 space-y-2 overflow-y-auto">
                        {!memoizedBrands.length ? (
                          <p className="py-4 text-center text-sm text-gray-500">
                            {t("no_data_found")}
                          </p>
                        ) : null}
                        {memoizedBrands.map((item: ISelectOptions) => (
                          <div
                            key={item.value}
                            className="flex items-center space-x-2 rounded px-2 py-1 transition-colors hover:bg-gray-50"
                          >
                            <Checkbox
                              id={item.label}
                              className="border border-gray-300 data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600"
                              onCheckedChange={(checked) =>
                                handleBrandChange(checked, item)
                              }
                              checked={selectedBrandIds.includes(item.value)}
                            />
                            <label
                              htmlFor={item.label}
                              className="flex-1 cursor-pointer text-sm leading-none font-medium"
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

              {/* Price Filter - Improved */}
              <div>
                <Accordion
                  type="multiple"
                  defaultValue={["price"]}
                  className="overflow-hidden rounded-lg border border-gray-200"
                >
                  <AccordionItem value="price" className="border-0">
                    <AccordionTrigger className="bg-gray-50 px-4 py-3 font-semibold text-gray-900 hover:bg-gray-100">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">💰</span>
                        <span>{t("price")}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="bg-white px-4 py-4">
                      <div className="mb-4 px-2">
                        <ReactSlider
                          className="horizontal-slider"
                          thumbClassName="example-thumb"
                          trackClassName="example-track"
                          defaultValue={[0, 500]}
                          ariaLabel={["Lower thumb", "Upper thumb"]}
                          ariaValuetext={(state) =>
                            `Thumb value ${state.valueNow}`
                          }
                          renderThumb={(props, state) => (
                            <div {...props} key={props.key}>
                              {state.valueNow}
                            </div>
                          )}
                          pearling
                          minDistance={10}
                          onChange={(value) => handlePriceDebounce(value)}
                          max={500}
                          min={0}
                        />
                      </div>
                      <div className="mb-4 flex justify-center">
                        <Button
                          variant="outline"
                          className="h-9 px-4 text-sm"
                          onClick={() => setPriceRange([])}
                          dir={langDir}
                          translate="no"
                        >
                          {t("clear")}
                        </Button>
                      </div>
                      <div className="range-price-left-right-info">
                        <Input
                          type="number"
                          placeholder={`${currency.symbol}0`}
                          className="custom-form-control-s1 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          value={minPriceInput}
                          onChange={handleMinPriceChange}
                          onWheel={(e) => e.currentTarget.blur()}
                          ref={minPriceInputRef}
                        />
                        <div className="center-divider"></div>
                        <Input
                          type="number"
                          placeholder={`${currency.symbol}500`}
                          className="custom-form-control-s1 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          value={maxPriceInput}
                          onChange={handleMaxPriceChange}
                          onWheel={(e) => e.currentTarget.blur()}
                          ref={maxPriceInputRef}
                        />
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </div>
          </div>

        {/* Mobile Filter Drawer */}
        <Sheet open={productFilter} onOpenChange={setProductFilter}>
          <SheetContent side="left" className="w-[300px] sm:w-[400px] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{t("filters")}</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <div className="mb-4">
                <div className="flex gap-2 mb-4">
                  <button 
                    type="button" 
                    onClick={selectAll}
                    className="px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors text-sm"
                  >
                    {t("select_all")}
                  </button>
                  <button 
                    type="button" 
                    onClick={clearFilter}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-sm"
                  >
                    {t("clean_select")}
                  </button>
                </div>
              </div>

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
                          value={searchTermBrand}
                          onChange={handleBrandSearchChange}
                          dir={langDir}
                          translate="no"
                        />
                        <Button
                          type="button"
                          onClick={handleBrandSearch}
                          disabled={!searchTermBrand.trim()}
                          size="sm"
                          className="h-8 px-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-xs"
                        >
                          {t("search")}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {!memoizedBrands.length ? (
                        <p className="text-center text-sm text-gray-500">
                          {t("no_data_found")}
                        </p>
                      ) : null}
                      {memoizedBrands.map((item: ISelectOptions) => (
                        <div key={item.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`mobile-${item.label}`}
                            className="border border-gray-300 data-[state=checked]:bg-blue-600!"
                            onCheckedChange={(checked) =>
                              handleBrandChange(checked, item)
                            }
                            checked={selectedBrandIds.includes(item.value)}
                          />
                          <label
                            htmlFor={`mobile-${item.label}`}
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

              {/* Price Filter */}
              <Accordion
                type="multiple"
                defaultValue={["price"]}
              >
                <AccordionItem value="price">
                  <AccordionTrigger className="text-base hover:no-underline!">
                    {t("price")}
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="px-4">
                      <div className="px-2">
                        <ReactSlider
                          className="horizontal-slider"
                          thumbClassName="example-thumb"
                          trackClassName="example-track"
                          defaultValue={[0, 500]}
                          ariaLabel={["Lower thumb", "Upper thumb"]}
                          ariaValuetext={(state) =>
                            `Thumb value ${state.valueNow}`
                          }
                          renderThumb={(props, state) => (
                            <div {...props} key={props.key}>
                              {state.valueNow}
                            </div>
                          )}
                          pearling
                          minDistance={10}
                          onChange={(value) => handlePriceDebounce(value)}
                          max={500}
                          min={0}
                        />
                      </div>
                      <div className="flex justify-center">
                        <Button
                          variant="outline"
                          className="mb-4"
                          onClick={() => setPriceRange([])}
                          dir={langDir}
                          translate="no"
                        >
                          {t("clear")}
                        </Button>
                      </div>
                      <div className="range-price-left-right-info">
                        <Input
                          type="number"
                          placeholder={`${currency.symbol}0`}
                          className="custom-form-control-s1 rounded-none"
                          value={minPriceInput}
                          onChange={handleMinPriceChange}
                          onWheel={(e) => e.currentTarget.blur()}
                        />
                        <div className="center-divider"></div>
                        <Input
                          type="number"
                          placeholder={`${currency.symbol}500`}
                          className="custom-form-control-s1 rounded-none"
                          value={maxPriceInput}
                          onChange={handleMaxPriceChange}
                          onWheel={(e) => e.currentTarget.blur()}
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </SheetContent>
        </Sheet>

          {/* Main Content Column - Products */}
          <div
            className={cn(
              "w-full flex-1 overflow-y-auto bg-white lg:w-auto",
              factoriesCartList.length > 0 ? "lg:pr-36" : "lg:pr-0",
            )}
          >
          <div className="p-2 sm:p-4 lg:p-6">
            
            {/* Product Header Filter Section */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              {/* Left Section - Mobile Buttons & Product Count */}
              <div className="flex items-center gap-3 w-full sm:w-auto">
                {/* Mobile Filter Button */}
                <button
                  type="button"
                  className="lg:hidden p-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                  onClick={() => setProductFilter(true)}
                >
                  <FilterMenuIcon />
                </button>
                
                {/* Mobile Cart Button - Hidden on desktop as cart is in right column */}
                <button
                  type="button"
                  className="lg:hidden p-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors relative"
                  onClick={() => {/* Will be handled by right column */}}
                >
                  <ShoppingCart className="h-5 w-5" />
                  {factoriesCartList.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {factoriesCartList.length}
                    </span>
                  )}
                </button>

                {/* Product Count */}
                <div className="flex-1 sm:flex-none">
                  <p className="text-base sm:text-lg font-semibold text-gray-800" dir={langDir} translate="no">
                    {factoriesProductsQuery.data?.totalCount || 0} {t("products")}
                  </p>
                </div>
              </div>

              {/* Right Section - Sort & View Controls */}
              <div className="flex items-center gap-3 w-full sm:w-auto">
                {/* Sort Dropdown */}
                <Select onValueChange={(e: any) => setSortBy(e)} value={sortBy}>
                  <SelectTrigger className="w-full sm:w-[180px] h-10 bg-white border-gray-300">
                    <SelectValue
                      placeholder={t("sort_by")}
                      dir={langDir}
                      translate="no"
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem
                        value="newest"
                        dir={langDir}
                        translate="no"
                      >
                        {t("sort_by_latest")}
                      </SelectItem>
                      <SelectItem
                        value="oldest"
                        dir={langDir}
                        translate="no"
                      >
                        {t("sort_by_oldest")}
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>

                {/* View Type Buttons */}
                <div className="hidden sm:flex items-center gap-2 bg-white border border-gray-300 rounded-lg p-1">
                  <button
                    type="button"
                    className={`p-2 rounded transition-colors ${
                      viewType === "grid" 
                        ? "bg-blue-600 text-white" 
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                    onClick={() => setViewType("grid")}
                  >
                    <GridIcon active={viewType === "grid"} />
                  </button>
                  <button
                    type="button"
                    className={`p-2 rounded transition-colors ${
                      viewType === "list" 
                        ? "bg-blue-600 text-white" 
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                    onClick={() => setViewType("list")}
                  >
                    <ListIcon active={viewType === "list"} />
                  </button>
                </div>
              </div>
            </div>

            {/* Loading State */}
            {factoriesProductsQuery.isLoading && viewType === "grid" ? (
              <div className="flex flex-col gap-3 sm:grid sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4 lg:gap-5">
                {Array.from({ length: 8 }).map((_, index) => (
                  <SkeletonProductCardLoader key={index} />
                ))}
              </div>
            ) : null}

            {/* No Data State */}
            {!factoriesProductsQuery?.data?.data?.length && !factoriesProductsQuery.isLoading ? (
              <p
                className="text-center text-sm font-medium my-10"
                dir={langDir}
                translate="no"
              >
                {t("no_data_found")}
              </p>
            ) : null}

            {/* Grid View */}
            {viewType === "grid" ? (
              <div className="flex flex-col gap-3 sm:grid sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4 lg:gap-5 sm:items-stretch">
                          {memoizedRfqProducts.map((item: any) => {
                            const cartItem = cartList?.find(
                              (el: any) => el.productId == item.id,
                            );
                            const factoryCartItem = factoriesCartList?.find(
                              (el: any) => el.productId == item.id,
                            );

                            return (
                              <FactoriesProductCard
                                key={item.id}
                                id={item.id}
                                productType={item?.productType || "-"}
                                productName={item?.productName || "-"}
                                productNote={item?.productNote || ""}
                                productStatus={item?.status}
                                productImages={item?.productImages}
                                productVariants={
                                  productVariants.find(
                                    (variant: any) =>
                                      variant.productId == item.id,
                                  )?.object || []
                                }
                                productQuantity={factoryCartItem?.quantity || 0}
                                productVariant={factoryCartItem?.object}
                                customizeProductId={factoryCartItem?.customizeProductId}
                                onAdd={() => handleAddToFactories(item.id)}
                                onWishlist={() =>
                                  handleAddToWishlist(
                                    item.id,
                                    item?.product_wishlist,
                                  )
                                }
                                isCreatedByMe={
                                  item?.userId === me.data?.data?.id
                                }
                                cartId={factoryCartItem?.id}
                                isAddedToFactoryCart={
                                  factoryCartItem && factoryCartItem?.quantity > 0
                                    ? true
                                    : false
                                }
                                inWishlist={item?.product_wishlist?.find(
                                  (el: any) => el?.userId === me.data?.data?.id,
                                )}
                                haveAccessToken={haveAccessToken}
                                productPrices={item?.product_productPrice}
                                categoryId={item?.categoryId}
                                categoryLocation={item?.categoryLocation}
                                consumerType={item?.product_productPrice?.[0]?.consumerType}
                              />
                            );
                          })}
              </div>
            ) : null}

            {/* List View */}
            {viewType === "list" && memoizedProductListForTable.length ? (
              <div className="product-list-s1 overflow-x-auto p-2 sm:p-4">
                <ProductTable
                  list={memoizedProductListForTable}
                  onWishlist={handleAddToWishlist}
                  onAddToCart={async (item, quantity, action, variant, cartId) => {
                    // For factories, redirect to add to factory modal instead of regular cart
                    if (action === "add") {
                      handleAddToFactories(item.id);
                      return;
                    }
                    // Handle remove if needed
                    if (action === "remove" && cartId) {
                      // Could implement remove from factories cart if needed
                    }
                  }}
                  wishlistMap={new Map(
                    memoizedProductListForTable.map((item: any) => [
                      item.id,
                      item?.inWishlist || false,
                    ])
                  )}
                  cartMap={new Map(
                    factoriesCartList?.map((item: any) => [
                      item.productId,
                      { quantity: item.quantity || 0, cartId: item.id },
                    ]) || []
                  )}
                  haveAccessToken={haveAccessToken}
                  productVariants={productVariants}
                />
              </div>
            ) : null}

            {/* Pagination */}
            {factoriesProductsQuery.data?.totalCount > 8 ? (
              <Pagination
                page={page}
                setPage={setPage}
                totalCount={factoriesProductsQuery.data?.totalCount}
                limit={limit}
              />
            ) : null}
          </div>
        </div>

          {/* Fixed Right Sidebar Cart - Desktop Only (Amazon Style) */}
          {factoriesCartList.length > 0 && (
            <div className="hidden lg:block">
              <div className="fixed top-0 right-0 z-[60] h-screen w-36 border-l border-gray-200 bg-white shadow-lg">
                <div className="flex h-full flex-col">
                  {/* Top sticky header + Go To Cart */}
                  <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-4 pt-4 pb-3 text-center">
                    <div className="flex flex-col items-center">
                      <span
                        className="mb-0.5 text-[11px] font-medium text-gray-600"
                        dir={langDir}
                        translate="no"
                      >
                        {t("factory_cart")}
                      </span>
                      <span className="text-sm font-bold text-red-600">
                        {factoriesCartList.length}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        window.location.href = "/factories-cart";
                      }}
                      className="mt-3 flex w-full items-center justify-center space-x-1.5 rounded-lg bg-yellow-400 px-3 py-2 text-xs font-medium text-gray-900 shadow-sm transition-colors duration-200 hover:bg-yellow-500"
                    >
                      <Package className="h-3 w-3" />
                      <span>{t("go_to_cart")}</span>
                    </button>
                  </div>

                  {/* Scrollable product list */}
                  <div className="scrollbar-hide flex-1 overflow-y-auto px-4 pt-3 pb-4">
                    <div className="space-y-3">
                      {factoriesCartList.map((cartItem: any) => {
                        const productData = memoizedRfqProducts.find(
                          (product: any) => product.id === cartItem.productId,
                        );
                        const quantity = cartItem.quantity || 1;

                        const productImage =
                          productData?.productImages?.[0]?.image || null;

                        const productName =
                          productData?.productName || t("product");

                        return (
                          <div
                            key={cartItem.id}
                            className="space-y-2 text-center"
                          >
                            {/* Product Image */}
                            <div className="flex justify-center">
                              <Link
                                href={`/factories/${cartItem.productId}`}
                                className="h-20 w-20 overflow-hidden rounded-lg bg-gray-100 transition-opacity hover:opacity-80"
                              >
                                {productImage ? (
                                  <img
                                    src={productImage}
                                    alt={productName}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center">
                                    <Package className="h-8 w-8 text-gray-400" />
                                  </div>
                                )}
                              </Link>
                            </div>

                            {/* Quantity */}
                            <div className="mb-2 text-center">
                              <p className="text-xs font-medium text-gray-600">
                                {t("quantity")}: {quantity}
                              </p>
                            </div>

                            {/* Customized Badge */}
                            <div className="mb-2">
                              <span className="inline-block rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                                {t("customized")}
                              </span>
                            </div>

                            {/* Divider */}
                            <div className="mt-3 border-t border-gray-200" />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add to factories modal */}
      {selectedCustomizedProduct?.id ? (
        <Dialog
          open={isAddToFactoryModalOpen}
          onOpenChange={handleToggleAddModal}
        >
          <DialogContent
            className="add-new-address-modal gap-0 p-0 md:max-w-2xl!"
            ref={wrapperRef}
          >
            <AddToCustomizeForm
              selectedProductId={selectedCustomizedProduct?.id}
              onClose={() => {
                setIsAddToFactoryModalOpen(false);
                setSelectedCustomizedProduct(undefined);
              }}
              onAddToFactory={() => {
                // Refetch the listing API after a successful response
                queryClient.invalidateQueries({
                  queryKey: ["factoriesProducts"],
                  exact: false,
                });
                // Refetch the factories cart
                queryClient.invalidateQueries({
                  queryKey: ["factories-cart-by-user"],
                  exact: false,
                });
              }}
            />
          </DialogContent>
        </Dialog>
      ) : null}
      
      <Footer />
    </>
  );
};

export default FactoriesPage;
