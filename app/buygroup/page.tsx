"use client";
import { useBrands } from "@/apis/queries/masters.queries";
import {
  useAllBuyGroupProducts,
  useProductVariant,
} from "@/apis/queries/product.queries";
import { useCategory } from "@/apis/queries/category.queries";
import FilterMenuIcon from "@/components/icons/FilterMenuIcon";
import GridIcon from "@/components/icons/GridIcon";
import ListIcon from "@/components/icons/ListIcon";
import ProductCard from "@/components/modules/trending/ProductCard";
import ProductTable from "@/components/modules/trending/ProductTable";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  IBrands,
  ISelectOptions,
  TrendingProduct,
} from "@/utils/types/common.types";
import { debounce } from "lodash";
import React, { use, useEffect, useMemo, useRef, useState } from "react";
import ReactSlider from "react-slider";
// import { stripHTML } from "@/utils/helper";
// import Image from "next/image";
// import TrendingBannerImage from "@/public/images/trending-product-inner-banner.png";
// import ChevronRightIcon from "@/public/images/nextarow.svg";
// import InnerBannerImage from "@/public/images/trending-product-inner-banner-pic.png";
import {
  useCartListByDevice,
  useCartListByUserId,
  useDeleteCartItem,
  useUpdateCartByDevice,
  useUpdateCartWithLogin,
} from "@/apis/queries/cart.queries";
import { useMe } from "@/apis/queries/user.queries";
import {
  useAddToWishList,
  useDeleteFromWishList,
} from "@/apis/queries/wishlist.queries";
// import BannerSection from "@/components/modules/trending/BannerSection";
import TrendingCategories from "@/components/modules/trending/TrendingCategories";
import Footer from "@/components/shared/Footer";
import Pagination from "@/components/shared/Pagination";
import SkeletonProductCardLoader from "@/components/shared/SkeletonProductCardLoader";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useCategoryStore } from "@/lib/categoryStore";
import { PUREMOON_TOKEN_KEY } from "@/utils/constants";
import { getOrCreateDeviceId } from "@/utils/helper";
import { useQueryClient } from "@tanstack/react-query";
import { getCookie } from "cookies-next";
import { useTranslations } from "next-intl";
import { useDynamicTranslation } from "@/hooks/useDynamicTranslation";
import CategoryFilter from "@/components/modules/manageProducts/CategoryFilter";
import { useCurrentAccount } from "@/apis/queries/auth.queries";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FaPlus } from "react-icons/fa";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ShoppingCart, Package, Trash2, Plus, Minus, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrendingPageProps {
  searchParams?: Promise<{ term?: string }>;
}

const TrendingPage = (props0: TrendingPageProps) => {
  const searchParams = use(props0.searchParams || Promise.resolve({}));
  const t = useTranslations();
  const { langDir, currency, user } = useAuth();
  const { translate } = useDynamicTranslation();
  const currentAccount = useCurrentAccount();
  const currentTradeRole =
    currentAccount?.data?.data?.account?.tradeRole || user?.tradeRole;
  const queryClient = useQueryClient();
  const categoryStore = useCategoryStore();
  const { toast } = useToast();
  const router = useRouter();
  const deviceId = getOrCreateDeviceId() || "";
  const [viewType, setViewType] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBrandIds, setSelectedBrandIds] = useState<number[]>([]);
  const [priceRange, setPriceRange] = useState<number[]>([]);
  const [minPriceInput, setMinPriceInput] = useState("");
  const [maxPriceInput, setMaxPriceInput] = useState("");
  const [sortBy, setSortBy] = useState("desc");
  const [productFilter, setProductFilter] = useState(false);
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const [displayMyProducts, setDisplayMyProducts] = useState("0");
  const [displayRelatedProducts, setDisplayRelatedProducts] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [productVariants, setProductVariants] = useState<any[]>([]);
  const [haveAccessToken, setHaveAccessToken] = useState(false);
  const accessToken = getCookie(PUREMOON_TOKEN_KEY);
  const searchUrlTerm = (searchParams as any)?.term || "";
  const category = useCategoryStore();

  const minPriceInputRef = useRef<HTMLInputElement>(null);
  const maxPriceInputRef = useRef<HTMLInputElement>(null);

  // Layout helpers for RTL/LTR
  const isRTL = langDir === "rtl";
  const filterSheetSide: "left" | "right" = isRTL ? "right" : "left";
  const cartSheetSide: "left" | "right" = isRTL ? "left" : "right";

  const me = useMe();
  const addToWishlist = useAddToWishList();
  const deleteFromWishlist = useDeleteFromWishList();
  const allProductsQuery = useAllBuyGroupProducts({
    page,
    limit,
    sort: sortBy,
    term: searchUrlTerm,
    priceMin:
      priceRange[0] === 0
        ? 0
        : ((priceRange[0] || Number(minPriceInput)) ?? undefined),
    priceMax: priceRange[1] || Number(maxPriceInput) || undefined,
    brandIds:
      selectedBrandIds.map((item) => item.toString()).join(",") || undefined,
    userId:
      me?.data?.data?.tradeRole == "BUYER"
        ? undefined
        : me?.data?.data?.tradeRole == "MEMBER"
          ? me?.data?.data?.addedBy
          : me?.data?.data?.id,
    categoryIds: category.categoryIds ? category.categoryIds : undefined,
    isOwner: displayMyProducts == "1" ? "me" : "",
    related: displayRelatedProducts,
    userType: me?.data?.data?.tradeRole == "BUYER" ? "BUYER" : "",
  });
  const fetchProductVariant = useProductVariant();
  const brandsQuery = useBrands({
    term: searchTerm,
  });

  const memoizedBrands = useMemo(() => {
    return (
      brandsQuery?.data?.data.map((item: IBrands) => {
        return { label: item.brandName, value: item.id };
      }) || []
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandsQuery?.data?.data?.length]);

  // Helpers for Buygroup coming soon
  const getLocalTimestamp = (dateStr?: string, timeStr?: string) => {
    if (!dateStr) return 0;
    const date = new Date(dateStr);
    const [h, m] = String(timeStr || "")
      .split(":")
      .map(Number);
    if (!Number.isNaN(h)) date.setHours(h || 0, Number.isNaN(m) ? 0 : m, 0, 0);
    return date.getTime();
  };

  const getSaleStartLabel = (dateStr?: string, timeStr?: string) => {
    try {
      if (!dateStr) return "";
      const d = new Date(dateStr);
      if (timeStr) {
        const [h, m] = timeStr.split(":").map(Number);
        if (!Number.isNaN(h)) d.setHours(h || 0, Number.isNaN(m) ? 0 : m, 0, 0);
      }
      return d.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  const comingSoonProducts = useMemo(() => {
    const now = Date.now();
    return (allProductsQuery?.data?.data || []).filter((p: any) => {
      const pp = p?.product_productPrice?.[0];
      if (!pp) return false;
      if (pp?.sellType !== "BUYGROUP") return false;
      const startTs = getLocalTimestamp(pp?.dateOpen, pp?.startTime);
      return startTs && now < startTs; // not started yet
    });
  }, [allProductsQuery?.data?.data]);

  const Carousel: React.FC<{ list: any[] }> = ({ list }) => {
    const [index, setIndex] = useState(0);
    const auto = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
      if (!list?.length) return;
      auto.current = setInterval(() => {
        setIndex((prev) => (prev + 1) % list.length);
      }, 4000);
      return () => {
        if (auto.current) clearInterval(auto.current);
      };
    }, [list?.length]);

    if (!list?.length) return null;

    return (
      <div className="relative w-full overflow-hidden rounded-lg bg-white shadow-sm sm:rounded-xl">
        <div
          className="flex transition-transform duration-500"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {list.map((p: any) => {
            const img =
              p?.product_productPrice?.[0]?.productPrice_productSellerImage?.[0]
                ?.image || p?.productImages?.[0]?.image;
            const startLabel = getSaleStartLabel(
              p?.product_productPrice?.[0]?.dateOpen,
              p?.product_productPrice?.[0]?.startTime,
            );
            return (
              <div
                key={p.id}
                className="relative h-48 min-w-full sm:h-56 md:h-64 lg:h-72"
              >
                <a href={`/trending/${p.id}`} className="absolute inset-0">
                  {/* background image */}
                  <img
                    src={img || "/images/product-placeholder.png"}
                    alt={p.productName}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/10" />
                  <div className="absolute right-2 bottom-2 left-2 flex flex-col items-start justify-between gap-2 sm:right-4 sm:bottom-4 sm:left-4 sm:flex-row sm:items-center">
                    <div className="text-white">
                      <h3 className="mb-1 line-clamp-1 text-sm font-semibold sm:text-lg md:text-xl">
                        {translate(p.productName)}
                      </h3>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <span className="rounded-full bg-orange-500 px-1.5 py-0.5 text-[9px] font-bold text-white shadow sm:px-2 sm:text-[10px] md:text-xs">
                          {t("sale_starts_on")}
                        </span>
                        <span className="rounded-full bg-blue-600 px-1.5 py-0.5 text-[9px] font-semibold text-white shadow sm:px-2 sm:text-[10px] md:text-xs">
                          {startLabel}
                        </span>
                      </div>
                    </div>
                    <span className="rounded-full bg-yellow-500 px-2 py-0.5 text-[10px] font-bold text-white shadow sm:px-3 sm:py-1 sm:text-xs md:text-sm">
                      {t("coming_soon")}
                    </span>
                  </div>
                </a>
              </div>
            );
          })}
        </div>
        {/* Dots */}
        <div className="absolute right-0 bottom-1 left-0 flex justify-center gap-1 sm:bottom-2 sm:gap-1.5">
          {list.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`h-1 rounded-full transition-all sm:h-1.5 ${i === index ? "w-4 bg-white sm:w-6" : "w-2 bg-white/60 sm:w-3"}`}
            />
          ))}
        </div>
      </div>
    );
  };

  const handleDebounce = debounce((event: any) => {
    setSearchTerm(event.target.value);
  }, 1000);

  const handlePriceDebounce = debounce((event: any) => {
    setPriceRange(event);
  }, 1000);

  const handleMinPriceChange = debounce((event: any) => {
    setMinPriceInput(event.target.value);
    // setPriceRange([ Number(event.target.value),500]);
  }, 1000);

  const handleMaxPriceChange = debounce((event: any) => {
    setMaxPriceInput(event.target.value);
    // setPriceRange([0, Number(event.target.value)]);
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

  const memoizedProductList = useMemo(() => {
    return (
      allProductsQuery?.data?.data?.map((item: any) => {
        let sold = 0;
        if (item.orderProducts?.length) {
          item.orderProducts.forEach((product: any) => {
            sold += product?.orderQuantity || 0;
          });
        }

        const activePriceEntry =
          item?.product_productPrice?.find(
            (pp: any) => pp?.status === "ACTIVE",
          ) || item?.product_productPrice?.[0];

        return {
          id: item.id,
          productName: item?.productName || "-",
          productPrice: item?.productPrice || 0,
          offerPrice: activePriceEntry?.offerPrice || item?.offerPrice || 0,
          productImage: activePriceEntry?.productPrice_productSellerImage?.length
            ? activePriceEntry?.productPrice_productSellerImage?.[0]?.image
            : item?.productImages?.[0]?.image,
          categoryName: item?.category?.name || "-",
          skuNo: item?.skuNo,
          brandName: item?.brand?.brandName || "-",
          productReview: item?.productReview || [],
          productWishlist: item?.product_wishlist || [],
          inWishlist: item?.product_wishlist?.find(
            (ele: any) => ele?.userId === me.data?.data?.id,
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
          sold: sold,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    allProductsQuery?.data?.data,
    allProductsQuery?.data?.data?.length,
    sortBy,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    priceRange[0],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    priceRange[1],
    page,
    limit,
    searchTerm,
    selectedBrandIds,
    displayMyProducts,
  ]);

  const getProductVariants = async () => {
    let productPriceIds = memoizedProductList
      .filter((item: any) => item.productPrices.length > 0)
      .map((item: any) => item.productPrices[0].id);

    const response = await fetchProductVariant.mutateAsync(productPriceIds);
    if (response.status) setProductVariants(response.data);
  };

  useEffect(() => {
    if (memoizedProductList.length) {
      getProductVariants();
    }
  }, [memoizedProductList]);

  const [cartList, setCartList] = useState<any[]>([]);

  const cartListByDeviceQuery = useCartListByDevice(
    {
      page: 1,
      limit: 100,
      deviceId,
    },
    !haveAccessToken,
  );

  const cartListByUser = useCartListByUserId(
    {
      page: 1,
      limit: 100,
    },
    haveAccessToken,
  );

  useEffect(() => {
    if (cartListByUser.data?.data) {
      setCartList((cartListByUser.data?.data || []).map((item: any) => item));
    } else if (cartListByDeviceQuery.data?.data) {
      setCartList(
        (cartListByDeviceQuery.data?.data || []).map((item: any) => item),
      );
    }
  }, [cartListByUser.data?.data, cartListByDeviceQuery.data?.data]);

  // Cart mutation hooks
  const deleteCartItem = useDeleteCartItem();
  const updateCartWithLogin = useUpdateCartWithLogin();
  const updateCartByDevice = useUpdateCartByDevice();

  // Handle remove item from cart
  const handleRemoveItemFromCart = async (cartId: number) => {
    const response = await deleteCartItem.mutateAsync({ cartId });
    if (response.status) {
      toast({
        title: t("item_removed_from_cart"),
        description: t("check_your_cart_for_more_details"),
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["cart-list-by-user"] });
      queryClient.invalidateQueries({ queryKey: ["cart-list-by-device"] });
    } else {
      toast({
        title: t("item_not_removed_from_cart"),
        description: response.message || t("check_your_cart_for_more_details"),
        variant: "danger",
      });
    }
  };

  // Handle update cart quantity
  const handleUpdateCartQuantity = async (
    cartItem: any,
    newQuantity: number,
    actionType: "add" | "remove",
  ) => {
    if (newQuantity <= 0) {
      handleRemoveItemFromCart(cartItem.id);
      return;
    }

    if (haveAccessToken) {
      const response = await updateCartWithLogin.mutateAsync({
        productPriceId: cartItem.productPriceDetails?.id,
        quantity: newQuantity,
        productVariant: cartItem.object,
      });
      if (response.status) {
        toast({
          title:
            actionType === "add"
              ? t("item_added_to_cart")
              : t("item_removed_from_cart"),
          description: t("check_your_cart_for_more_details"),
          variant: "success",
        });
        queryClient.invalidateQueries({ queryKey: ["cart-list-by-user"] });
      }
    } else {
      const response = await updateCartByDevice.mutateAsync({
        productPriceId: cartItem.productPriceDetails?.id,
        quantity: newQuantity,
        deviceId,
        productVariant: cartItem.object,
      });
      if (response.status) {
        toast({
          title:
            actionType === "add"
              ? t("item_added_to_cart")
              : t("item_removed_from_cart"),
          description: t("check_your_cart_for_more_details"),
          variant: "success",
        });
        queryClient.invalidateQueries({ queryKey: ["cart-list-by-device"] });
      }
    }
  };

  // Get cart pricing helper
  const getCartPricing = React.useCallback(
    (productData: any, cartItem: any) => {
      if (!cartItem) {
        return {
          unitPrice: 0,
          totalPrice: 0,
          originalUnitPrice: 0,
          originalTotalPrice: 0,
        };
      }

      const quantity = Number(cartItem?.quantity) || 1;
      const cartPriceDetails = cartItem?.productPriceDetails || {};

      let unitPrice = 0;
      if (cartItem.cartType === "DEFAULT" && cartPriceDetails) {
        const offerPrice = Number(cartPriceDetails.offerPrice || 0);
        let discount = 0;
        let discountType: string | undefined;

        if (currentTradeRole && currentTradeRole !== "BUYER") {
          discount = Number(cartPriceDetails.vendorDiscount || 0);
          discountType = cartPriceDetails.vendorDiscountType;
        } else {
          discount = Number(cartPriceDetails.consumerDiscount || 0);
          discountType = cartPriceDetails.consumerDiscountType;
        }

        if (discount > 0 && discountType) {
          const normalizedDiscountType = discountType.toUpperCase().trim();
          if (normalizedDiscountType === "PERCENTAGE") {
            unitPrice = offerPrice * (1 - discount / 100);
          } else if (
            normalizedDiscountType === "AMOUNT" ||
            normalizedDiscountType === "FLAT" ||
            normalizedDiscountType === "FIXED"
          ) {
            unitPrice = offerPrice - discount;
          } else {
            unitPrice = offerPrice;
          }
        } else {
          unitPrice = offerPrice;
        }
      } else {
        unitPrice = Number(
          cartPriceDetails?.offerPrice || cartItem.productPrice || 0,
        );
      }

      const totalPrice = Number((unitPrice * quantity).toFixed(2));
      const originalUnitPrice = Number(
        cartPriceDetails?.price || cartPriceDetails?.basePrice || unitPrice,
      );
      const originalTotalPrice = Number(
        (originalUnitPrice * quantity).toFixed(2),
      );

      return {
        unitPrice: Number(unitPrice.toFixed(2)),
        totalPrice,
        originalUnitPrice,
        originalTotalPrice,
      };
    },
    [currentTradeRole],
  );

  // Calculate cart subtotal
  const cartSubtotal = useMemo(() => {
    return cartList.reduce((total: number, cartItem: any) => {
      const productData = memoizedProductList.find(
        (product: any) => product.id === cartItem.productId,
      );
      const pricing = getCartPricing(productData, cartItem);
      return total + pricing.totalPrice;
    }, 0);
  }, [cartList, memoizedProductList, getCartPricing]);

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

  const selectAll = () => {
    setSelectedBrandIds(
      brandsQuery?.data?.data?.map((item: any) => {
        return item.id;
      }) || [],
    );
  };

  const clearFilter = () => {
    setSelectedBrandIds([]);
    setMaxPriceInput("");
    setMinPriceInput("");
    setPriceRange([]);
    setDisplayMyProducts("0");

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

  useEffect(() => {
    return () => {
      categoryStore.setSubCategories([]);
      categoryStore.setSubSubCategories([]);
      categoryStore.setCategoryId("");
      categoryStore.setCategoryIds("");
      categoryStore.setSubCategoryIndex(0);
      categoryStore.setSecondLevelCategoryIndex(0);
      categoryStore.setSubCategoryParentName("");
      categoryStore.setSubSubCategoryParentName("");
    };
  }, []);

  return (
    <>
      <title dir={langDir} translate="no">{`${t("buygroup")} | Ultrasooq`}</title>
      <div className="body-content-s1">
        <TrendingCategories />
        {/* Coming Soon Carousel */}
        <div className="mt-4 mb-6 px-2 sm:px-6 lg:px-12">
          <Carousel list={comingSoonProducts} />
        </div>

        {/* Full Width Two Column Layout */}
        <div className="min-h-screen w-full bg-white px-2 sm:px-4 lg:px-8">
          <div
            className={cn(
              "flex h-full flex-col gap-4",
              isRTL ? "lg:flex-row-reverse" : "lg:flex-row",
            )}
          >
            {/* Sidebar - Filters (Desktop) */}
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

                {/* Category Filter - Improved */}
                {/* Commented out for now */}
                {/* <div className="mb-6">
                  <Accordion
                    type="multiple"
                    defaultValue={["category_filter"]}
                    className="overflow-hidden rounded-lg border border-gray-200"
                  >
                    <AccordionItem value="category_filter" className="border-0">
                      <AccordionTrigger className="bg-gray-50 px-4 py-3 font-semibold text-gray-900 hover:bg-gray-100">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          <span>{t("by_category")}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="bg-white px-4 py-4">
                        <CategoryFilter
                          selectedCategoryIds={
                            category.categoryIds
                              ? category.categoryIds.split(",").map(Number)
                              : []
                          }
                          onCategoryChange={(categoryIds) =>
                            category.setCategoryIds(categoryIds.join(","))
                          }
                          onClear={() => category.setCategoryIds("")}
                        />
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div> */}

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
                          <Input
                            type="text"
                            placeholder={t("search_brand")}
                            className="h-9 w-full border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
                            onChange={handleDebounce}
                            dir={langDir}
                            translate="no"
                          />
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
                            onChange={handleMinPriceChange}
                            onWheel={(e) => e.currentTarget.blur()}
                            ref={minPriceInputRef}
                          />
                          <div className="center-divider"></div>
                          <Input
                            type="number"
                            placeholder={`${currency.symbol}500`}
                            className="custom-form-control-s1 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
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

            {/* Main Content Column - Products */}
            <div
              className={cn(
                "w-full flex-1 overflow-y-auto bg-white lg:w-auto",
                cartList.length > 0
                  ? isRTL
                    ? "lg:pl-36"
                    : "lg:pr-36"
                  : isRTL
                    ? "lg:pl-0"
                    : "lg:pr-0",
              )}
            >
              <div className="p-2 sm:p-4 lg:p-6">
                {/* Product Header Filter Section */}
                <div className="mb-6 flex flex-col items-start justify-between gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 sm:flex-row sm:items-center">
                  {/* Left Section - Mobile Buttons & Title */}
                  <div className="flex w-full items-center gap-3 sm:w-auto">
                    {/* Mobile Filter Button */}
                    <button
                      type="button"
                      className="rounded-lg border border-gray-300 bg-white p-2.5 transition-colors hover:bg-gray-100 lg:hidden"
                      onClick={() => setProductFilter(true)}
                    >
                      <FilterMenuIcon />
                    </button>

                    {/* Mobile Cart Button */}
                    <button
                      type="button"
                      className="relative rounded-lg border border-gray-300 bg-white p-2.5 transition-colors hover:bg-gray-100 lg:hidden"
                      onClick={() => setShowCartDrawer(true)}
                    >
                      <ShoppingCart className="h-5 w-5" />
                      {cartList.length > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                          {cartList.length}
                        </span>
                      )}
                    </button>

                    {/* Title */}
                    <div className="flex-1 sm:flex-none">
                      <h2
                        className="text-base font-semibold text-gray-900 sm:text-xl"
                        dir={langDir}
                        translate="no"
                      >
                        {t("buygroup_products")}
                      </h2>
                    </div>
                  </div>

                  {/* Right Section - Sort & View Controls */}
                  <div className="flex w-full items-center gap-3 sm:w-auto">
                    {/* Sort Dropdown */}
                    <Select onValueChange={(e) => setSortBy(e)} value={sortBy}>
                      <SelectTrigger className="h-10 w-full border-gray-300 bg-white sm:w-[180px]">
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

                    {/* View Type Buttons */}
                    <div className="hidden items-center gap-2 rounded-lg border border-gray-300 bg-white p-1 sm:flex">
                      <button
                        type="button"
                        className={`rounded p-2 transition-colors ${
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
                        className={`rounded p-2 transition-colors ${
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
                {allProductsQuery.isLoading && viewType === "grid" ? (
                  <div className="flex flex-col gap-3 sm:grid sm:grid-cols-2 sm:items-stretch sm:gap-4 lg:grid-cols-3 lg:gap-5 xl:grid-cols-4">
                    {Array.from({ length: 10 }).map((_, index) => (
                      <SkeletonProductCardLoader key={index} />
                    ))}
                  </div>
                ) : null}

                {/* No Data State */}
                {!memoizedProductList.length && !allProductsQuery.isLoading ? (
                  <div className="py-12 text-center">
                    <p
                      className="text-lg text-gray-500"
                      dir={langDir}
                      translate="no"
                    >
                      {t("no_data_found")}
                    </p>
                  </div>
                ) : null}

                {/* Grid View */}
                {viewType === "grid" && !allProductsQuery.isLoading ? (
                  <div className="flex flex-col gap-3 sm:grid sm:grid-cols-2 sm:items-stretch sm:gap-4 lg:grid-cols-3 lg:gap-5 xl:grid-cols-4">
                    {memoizedProductList.map((item: TrendingProduct) => {
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
                          productVariants={
                            productVariants.find(
                              (variant: any) => variant.productId == item.id,
                            )?.object || []
                          }
                          item={item}
                          onWishlist={() =>
                            handleAddToWishlist(item.id, item?.productWishlist)
                          }
                          inWishlist={item?.inWishlist}
                          haveAccessToken={haveAccessToken}
                          isInteractive
                          productQuantity={cartItem?.quantity}
                          productVariant={cartItem?.object}
                          cartId={cartItem?.id}
                          isAddedToCart={cartItem ? true : false}
                          relatedCart={relatedCart}
                          sold={item.sold}
                        />
                      );
                    })}
                  </div>
                ) : null}

                {/* List View */}
                {viewType === "list" && memoizedProductList.length ? (
                  <div className="product-list-s1 overflow-x-auto p-2 sm:p-4">
                    <ProductTable
                      list={memoizedProductList}
                      onWishlist={handleAddToWishlist}
                      onAddToCart={async (item, quantity, action, variant, cartId) => {
                        if (!item?.productProductPriceId) {
                          toast({
                            title: t("something_went_wrong"),
                            description: t("product_price_id_not_found"),
                            variant: "danger",
                          });
                          return;
                        }

                        if (haveAccessToken) {
                          const response = await updateCartWithLogin.mutateAsync({
                            productPriceId: item.productProductPriceId,
                            quantity: action === "add" ? quantity : 0,
                            productVariant: variant,
                          });
                          if (response.status) {
                            toast({
                              title:
                                action === "add"
                                  ? t("item_added_to_cart")
                                  : t("item_removed_from_cart"),
                              description: t("check_your_cart_for_more_details"),
                              variant: "success",
                            });
                          }
                        } else {
                          const response = await updateCartByDevice.mutateAsync({
                            productPriceId: item.productProductPriceId,
                            quantity: action === "add" ? quantity : 0,
                            deviceId,
                            productVariant: variant,
                          });
                          if (response.status) {
                            toast({
                              title:
                                action === "add"
                                  ? t("item_added_to_cart")
                                  : t("item_removed_from_cart"),
                              description: t("check_your_cart_for_more_details"),
                              variant: "success",
                            });
                          }
                        }
                      }}
                      wishlistMap={new Map(
                        memoizedProductList.map((item: any) => [
                          item.id,
                          item?.inWishlist || false,
                        ])
                      )}
                      cartMap={new Map(
                        cartList?.map((item: any) => [
                          item.productId,
                          { quantity: item.quantity, cartId: item.id },
                        ]) || []
                      )}
                      haveAccessToken={haveAccessToken}
                      productVariants={productVariants}
                    />
                  </div>
                ) : null}

                {/* Pagination */}
                {allProductsQuery.data?.totalCount > 10 ? (
                  <div className="mt-8">
                    <Pagination
                      page={page}
                      setPage={setPage}
                      totalCount={allProductsQuery.data?.totalCount}
                      limit={limit}
                    />
                  </div>
                ) : null}
              </div>
            </div>

            {/* Fixed Sidebar Cart - Desktop Only (Amazon Style) */}
            {cartList.length > 0 && (
              <div className="hidden lg:block">
                <div
                  className={cn(
                    "fixed top-0 z-[60] h-screen w-36 bg-white shadow-lg",
                    isRTL
                      ? "left-0 border-r border-gray-200"
                      : "right-0 border-l border-gray-200",
                  )}
                >
                  <div className="flex h-full flex-col">
                    {/* Top sticky subtotal + Go To Cart */}
                    <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-4 pt-4 pb-3 text-center">
                      <div className="flex flex-col items-center">
                        <span
                          className="mb-0.5 text-[11px] font-medium text-gray-600"
                          dir={langDir}
                          translate="no"
                        >
                          {t("subtotal")}
                        </span>
                        <span className="text-sm font-bold text-red-600">
                          {currency.symbol}
                          {cartSubtotal.toFixed(2)}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          window.location.href = "/cart";
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
                        {cartList.map((cartItem: any) => {
                          const productData = memoizedProductList.find(
                            (product: any) => product.id === cartItem.productId,
                          );
                          const pricing = getCartPricing(productData, cartItem);
                          const quantity = cartItem.quantity || 1;

                          // Get product image from cart item if not found in productData
                          const productImage =
                            productData?.productImage ||
                            cartItem.productPriceDetails?.productPrice_product
                              ?.productImages?.[0]?.image ||
                            null;

                          // Get product name from cart item if not found in productData
                          const productNameRaw =
                            productData?.productName ||
                            cartItem.productPriceDetails?.productPrice_product
                              ?.productName ||
                            t("product");
                          const productName = translate(productNameRaw);

                          return (
                            <div
                              key={cartItem.id}
                              className="space-y-2 text-center"
                            >
                              {/* Product Image */}
                              <div className="flex justify-center">
                                <Link
                                  href={`/trending/${cartItem.productId}`}
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

                              {/* Price */}
                              <div className="mb-2 text-center">
                                <p className="text-sm font-semibold text-gray-900">
                                  {currency.symbol}
                                  {pricing.totalPrice.toFixed(2)}
                                </p>
                              </div>

                              {/* Quantity Selector - Amazon Style */}
                              <div className="mb-2 flex items-center justify-center">
                                <div className="flex items-center overflow-hidden rounded-md border-2 border-yellow-400">
                                  {/* Trash/Remove Button */}
                                  <button
                                    onClick={() => {
                                      if (quantity > 1) {
                                        handleUpdateCartQuantity(
                                          cartItem,
                                          quantity - 1,
                                          "remove",
                                        );
                                      } else {
                                        handleRemoveItemFromCart(cartItem.id);
                                      }
                                    }}
                                    disabled={
                                      deleteCartItem.isPending ||
                                      updateCartWithLogin.isPending ||
                                      updateCartByDevice.isPending
                                    }
                                    className="px-1.5 py-1 transition-colors hover:bg-yellow-50 disabled:cursor-not-allowed disabled:opacity-50"
                                    aria-label={t("decrease_quantity")}
                                  >
                                    <Trash2 className="h-3 w-3 text-gray-600" />
                                  </button>

                                  {/* Quantity Number */}
                                  <span className="min-w-[2rem] border-x border-yellow-400 bg-white px-2 py-1 text-center text-xs font-medium text-gray-900">
                                    {quantity}
                                  </span>

                                  {/* Plus Button */}
                                  <button
                                    onClick={() => {
                                      handleUpdateCartQuantity(
                                        cartItem,
                                        quantity + 1,
                                        "add",
                                      );
                                    }}
                                    disabled={
                                      updateCartWithLogin.isPending ||
                                      updateCartByDevice.isPending
                                    }
                                    className="px-1.5 py-1 transition-colors hover:bg-yellow-50 disabled:cursor-not-allowed disabled:opacity-50"
                                    aria-label={t("increase_quantity")}
                                  >
                                    <span className="text-sm font-semibold text-gray-600">
                                      +
                                    </span>
                                  </button>
                                </div>
                              </div>

                              {/* Remove Button */}
                              <div className="flex justify-center">
                                <button
                                  onClick={() =>
                                    handleRemoveItemFromCart(cartItem.id)
                                  }
                                  disabled={deleteCartItem.isPending}
                                  className="text-xs text-blue-600 underline hover:text-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                                  aria-label={t("remove_from_cart")}
                                >
                                  {t("remove")}
                                </button>
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

        {/* Mobile Filter Drawer */}
        <Sheet open={productFilter} onOpenChange={setProductFilter}>
          <SheetContent
            side={filterSheetSide}
            className="w-[300px] overflow-y-auto sm:w-[400px]"
          >
            <SheetHeader>
              <SheetTitle>{t("filters")}</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <div className="mb-4">
                <div className="mb-4 flex gap-2">
                  <button
                    type="button"
                    onClick={selectAll}
                    className="rounded bg-blue-100 px-3 py-2 text-sm text-blue-700 transition-colors hover:bg-blue-200"
                  >
                    {t("select_all")}
                  </button>
                  <button
                    type="button"
                    onClick={clearFilter}
                    className="rounded bg-gray-100 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-200"
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
                      selectedCategoryIds={
                        category.categoryIds
                          ? category.categoryIds.split(",").map(Number)
                          : []
                      }
                      onCategoryChange={(categoryIds) =>
                        category.setCategoryIds(categoryIds.join(","))
                      }
                      onClear={() => category.setCategoryIds("")}
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
                          className="h-8 flex-1 text-sm"
                          onChange={handleDebounce}
                          dir={langDir}
                          translate="no"
                        />
                      </div>
                    </div>
                    <div className="max-h-40 space-y-2 overflow-y-auto">
                      {!memoizedBrands.length ? (
                        <p className="text-center text-sm text-gray-500">
                          {t("no_data_found")}
                        </p>
                      ) : null}
                      {memoizedBrands.map((item: ISelectOptions) => (
                        <div
                          key={item.value}
                          className="flex items-center space-x-2"
                        >
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
                            className="cursor-pointer text-sm leading-none font-medium"
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
              <Accordion type="multiple" defaultValue={["price"]}>
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
                          onChange={handleMinPriceChange}
                          onWheel={(e) => e.currentTarget.blur()}
                        />
                        <div className="center-divider"></div>
                        <Input
                          type="number"
                          placeholder={`${currency.symbol}500`}
                          className="custom-form-control-s1 rounded-none"
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

        {/* Mobile Cart Drawer */}
        <Sheet open={showCartDrawer} onOpenChange={setShowCartDrawer}>
          <SheetContent
            side={cartSheetSide}
            className="w-[300px] overflow-y-auto sm:w-[400px]"
          >
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                <span>{t("my_cart")}</span>
              </SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <div className="mb-4 border-b border-gray-200 pb-4">
                <span className="rounded-full bg-gray-100 px-2 py-1 text-sm text-gray-500">
                  {cartList.length}{" "}
                  {cartList.length === 1 ? t("item") : t("items")}
                </span>
              </div>

              <div className="max-h-[calc(100vh-250px)] overflow-y-auto">
                {cartList.length === 0 ? (
                  <div className="py-6 text-center">
                    <Package className="mx-auto mb-3 h-12 w-12 text-gray-400" />
                    <p className="text-sm text-gray-500">
                      {t("your_cart_is_empty")}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      {t("add_some_products_to_get_started")}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cartList.slice(0, 10).map((cartItem: any) => {
                      const productData = memoizedProductList.find(
                        (product: any) => product.id === cartItem.productId,
                      );
                      const pricing = getCartPricing(productData, cartItem);
                      const quantity = cartItem.quantity || 1;
                      const totalPrice = pricing.totalPrice;

                      // Get product image from cart item if not found in productData
                      const productImage =
                        productData?.productImage ||
                        cartItem.productPriceDetails?.productPrice_product
                          ?.productImages?.[0]?.image ||
                        null;

                      // Get product name from cart item if not found in productData
                      const productNameRaw =
                        productData?.productName ||
                        cartItem.productPriceDetails?.productPrice_product
                          ?.productName ||
                        t("product");
                      const productName = translate(productNameRaw);

                      return (
                        <div
                          key={cartItem.id}
                          className="flex items-center space-x-3 rounded-lg p-2 transition-colors hover:bg-gray-50"
                        >
                          <Link
                            href={`/trending/${cartItem.productId}`}
                            className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 transition-opacity hover:opacity-80"
                            onClick={() => setShowCartDrawer(false)}
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

                          <div className="min-w-0 flex-1">
                            <h4 className="truncate text-sm font-medium text-gray-900">
                              {translate(productName)}
                            </h4>
                            <div className="mt-1 flex items-center justify-between">
                              <p className="text-xs text-gray-500">
                                Qty: {quantity}
                              </p>
                              <p className="text-sm font-semibold text-green-600">
                                {currency.symbol}
                                {totalPrice.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {cartList.length > 10 && (
                      <div className="py-2 text-center">
                        <p className="text-xs text-gray-500">
                          {t("and_n_more_items", { n: cartList.length - 10 })}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Go to Cart Button */}
              {cartList.length > 0 && (
                <div className="border-t border-gray-200 bg-gray-50 p-4">
                  <button
                    onClick={() => router.push("/cart")}
                    className="flex w-full items-center justify-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors duration-200 hover:bg-blue-700"
                  >
                    <Package className="h-4 w-4" />
                    <span>{t("go_to_cart")}</span>
                  </button>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
      <Footer />
    </>
  );
};

export default TrendingPage;
