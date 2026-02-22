"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  useAllManagedProducts,
  useExistingProduct,
  useAddMultiplePriceForProduct,
} from "@/apis/queries/product.queries";
import { useDropshipProducts, useDeleteDropshipProduct } from "@/apis/queries/dropship.queries";
import { useCategory } from "@/apis/queries/category.queries";
import { PRODUCT_CATEGORY_ID } from "@/utils/constants";
import ManageProductCard from "@/components/modules/manageProducts/ManageProductCard";
import ExistingProductCard from "@/components/modules/manageProducts/ExistingProductCard";
import DropshipProductCard from "@/components/modules/manageProducts/DropshipProductCard";
import ProductCard from "@/components/modules/trending/ProductCard";
import Pagination from "@/components/shared/Pagination";
import { Skeleton } from "@/components/ui/skeleton";

import { FormProvider, useForm } from "react-hook-form";
import { useToast } from "@/components/ui/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { IoMdAdd } from "react-icons/io";
import { Store } from "lucide-react";
import { Input } from "@/components/ui/input";
import { debounce } from "lodash";
import { getCookie } from "cookies-next";
import { PUREMOON_TOKEN_KEY } from "@/utils/constants";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import LoaderPrimaryIcon from "@/public/images/load-primary.png";
import SkeletonProductCardLoader from "@/components/shared/SkeletonProductCardLoader";



import { PERMISSION_PRODUCTS, checkPermission } from "@/helpers/permission";
import { useMe } from "@/apis/queries/user.queries";
import { useCurrentAccount } from "@/apis/queries/auth.queries";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "next-intl";
import BrandFilterList from "@/components/modules/rfq/BrandFilterList";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { IBrands, ISelectOptions } from "@/utils/types/common.types";
import { Checkbox } from "@/components/ui/checkbox";
import { useBrands } from "@/apis/queries/masters.queries";
import { withActiveUserGuard } from "@/components/shared/withRouteGuard";
import CategoryFilter from "@/components/modules/manageProducts/CategoryFilter";

const schema = (t: any) => {
  return (
    z
      .object({
        productPrice: z.number().optional(),
        offerPrice: z.coerce.number().optional(),
        stock: z.coerce.number().optional(),
        deliveryAfter: z.coerce.number().optional(),
        timeOpen: z.coerce.number().optional(),
        timeClose: z.coerce.number().optional(),
        consumerType: z.string().trim().optional(),
        sellType: z.string().trim().optional(),
        vendorDiscount: z.coerce.number().optional(),
        vendorDiscountType: z.coerce.string().optional(),
        consumerDiscount: z.coerce.number().optional(),
        consumerDiscountType: z.coerce.string().optional(),
        minQuantity: z.coerce.number().optional(),
        maxQuantity: z.coerce.number().optional(),
        minCustomer: z.coerce.number().optional(),
        maxCustomer: z.coerce.number().optional(),
        minQuantityPerCustomer: z.coerce.number().optional(),
        maxQuantityPerCustomer: z.coerce.number().optional(),
        productCondition: z.string().optional(),
        isProductConditionRequired: z.boolean().optional(),
        isHiddenRequired: z.boolean().optional(),
        isStockRequired: z.boolean().optional(),
        isOfferPriceRequired: z.boolean().optional(),
        isDeliveryAfterRequired: z.boolean().optional(),
        isConsumerTypeRequired: z.boolean().optional(),
        isSellTypeRequired: z.boolean().optional(),
        isVendorDiscountRequired: z.boolean().optional(),
        isConsumerDiscountRequired: z.boolean().optional(),
        isMinQuantityRequired: z.boolean().optional(),
        isMaxQuantityRequired: z.boolean().optional(),
        isMinCustomerRequired: z.boolean().optional(),
        isMaxCustomerRequired: z.boolean().optional(),
        isMinQuantityPerCustomerRequired: z.boolean().optional(),
        isMaxQuantityPerCustomerRequired: z.boolean().optional(),
      })
      .refine(
        (data) => !data.isProductConditionRequired || !!data.productCondition,
        {
          message: "Product Condition is required",
          path: ["productCondition"],
        },
      )
      // .refine((data) => data.isStockRequired || !!data.stock, {
      //   message: "Stock is required",
      //   path: ["stock"],
      // })
      // .refine((data) => data.isOfferPriceRequired || !!data.offerPrice, {
      //   message: "Offer Price is required",
      //   path: ["offerPrice"],
      // })
      .refine((data) => !data.isDeliveryAfterRequired || !!data.deliveryAfter, {
        message: t("delivery_after_is_required"),
        path: ["deliveryAfter"],
      })
      .refine((data) => !data.isConsumerTypeRequired || !!data.consumerType, {
        message: t("consumer_type_is_required"),
        path: ["consumerType"],
      })
      .refine((data) => !data.isSellTypeRequired || !!data.sellType, {
        message: t("sell_type_is_required"),
        path: ["sellType"],
      })
  );
};

const defaultValues = {
  productPrice: 0,
  offerPrice: 0,
  stock: 0,
  deliveryAfter: 0,
  timeOpen: 0,
  timeClose: 0,
  consumerType: "CONSUMER",
  sellType: "NORMALSELL",
  vendorDiscount: 0,
  consumerDiscount: 0,
  minQuantity: 0,
  maxQuantity: 0,
  minCustomer: 0,
  maxCustomer: 0,
  minQuantityPerCustomer: 0,
  maxQuantityPerCustomer: 0,
  productCondition: "",
  isProductConditionRequired: false,
  isStockRequired: false,
  isOfferPriceRequired: false,
  isDeliveryAfterRequired: false,
  isConsumerTypeRequired: false,
  isSellTypeRequired: false,
};

const ManageProductsPage = () => {
  const t = useTranslations();
  const { langDir } = useAuth();
  const router = useRouter();
  const hasPermission = checkPermission(PERMISSION_PRODUCTS);
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  
  // Tab state management
  const [activeTab, setActiveTab] = useState<'my-products' | 'existing-products' | 'dropship-products'>('my-products');
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [searchTermBrand, setSearchTermBrand] = useState("");
  
  // Dropship products state
  const [dropshipPage, setDropshipPage] = useState(1);
  const [dropshipStatus, setDropshipStatus] = useState<string>('');
  
  // Actual search terms used in queries (separate from input values)
  const [activeSearchTerm, setActiveSearchTerm] = useState("");
  const [activeSearchTermBrand, setActiveSearchTermBrand] = useState("");
  
  // Category filtering state
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  
  // Existing products state
  const [existingProductsPage, setExistingProductsPage] = useState(1);
  const [existingProductsLimit] = useState(8);
  const [existingProductsSearchTerm, setExistingProductsSearchTerm] = useState("");
  const [activeExistingProductsSearchTerm, setActiveExistingProductsSearchTerm] = useState("");
  const [existingProductsSelectedBrandIds, setExistingProductsSelectedBrandIds] = useState<number[]>([]);
  const [existingProductsSelectedCategoryIds, setExistingProductsSelectedCategoryIds] = useState<number[]>([]);
  const [existingProductsSelectedIds, setExistingProductsSelectedIds] = useState<number[]>([]);
  const [existingProductsSelectedType, setExistingProductsSelectedType] = useState<string>("");
  const [haveAccessToken, setHaveAccessToken] = useState(false);
  const accessToken = getCookie(PUREMOON_TOKEN_KEY);
  
  // Handle page change while preserving selections
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    // Don't clear selections when changing pages
  };

  const handleDropshipPageChange = (newPage: number) => {
    setDropshipPage(newPage);
  };

  // Handle limit change
  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1); // Reset to first page when changing limit
  };

  // Handle filter toggle
  const handleFilterToggle = () => {
    // Don't allow filter if no products are selected
    if (!showOnlySelected && globalSelectedIds.size === 0) {
      toast({
        title: t("no_products_selected"),
        description: t("please_select_products_first"),
        variant: "danger",
      });
      return;
    }
    
    setShowOnlySelected(!showOnlySelected);
    setPage(1); // Reset to first page when toggling filter
    
    // Force refetch when toggling filter to get fresh data
    setTimeout(() => {
      refetch();
    }, 100);
  };
  const [limit, setLimit] = useState(3);
  const [showOnlySelected, setShowOnlySelected] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [globalSelectedIds, setGlobalSelectedIds] = useState<Set<number>>(new Set());

  const me = useMe();
  const { data: currentAccount } = useCurrentAccount();

  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Existing products queries
  const existingProductsQueryParams = {
    page: existingProductsSelectedType ? 1 : existingProductsPage, // Always use page 1 when filtering
    limit: existingProductsSelectedType ? 100 : existingProductsLimit, // Fetch more when filtering
    sort: "desc",
    brandIds: existingProductsSelectedBrandIds.map((item) => item.toString()).join(",") || undefined,
    categoryIds: existingProductsSelectedCategoryIds.map((item) => item.toString()).join(",") || undefined,
    term: activeExistingProductsSearchTerm !== "" ? activeExistingProductsSearchTerm : undefined,
    brandAddedBy: me.data?.data?.id,
    productType: existingProductsSelectedType || undefined,
    type: existingProductsSelectedType || undefined
  };


  const existingProductsQuery = useExistingProduct(existingProductsQueryParams);

  // Dropship products query
  const dropshipProductsQuery = useDropshipProducts(
    {
      page: dropshipPage,
      limit: 12,
      status: dropshipStatus || undefined,
    },
    activeTab === 'dropship-products'
  );

  // Dropship delete mutation
  const deleteDropshipProductMutation = useDeleteDropshipProduct();

  // Handle dropship product deletion
  const handleDropshipProductDelete = async (productId: number) => {
    try {
      await deleteDropshipProductMutation.mutateAsync({ id: productId });
      toast({
        title: t("success"),
        description: t("dropship_product_deleted_successfully"),
        variant: "success",
      });
    } catch (error: any) {
      toast({
        title: t("error"),
        description: error.message || t("failed_to_delete_dropship_product"),
        variant: "destructive",
      });
    }
  };

  const existingProductsBrandsQuery = useBrands({ 
    term: activeSearchTermBrand, 
    addedBy: me.data?.data?.id, 
    type: 'BRAND' 
  });

  const categoriesQuery = useCategory(PRODUCT_CATEGORY_ID.toString());

  const addMultiplePriceForProductIds = useAddMultiplePriceForProduct();

  const [selectedBrandIds, setSelectedBrandIds] = useState<number[]>([]);
  const [displayStoreProducts, setDisplayStoreProducts] = useState(false);
  const [displayBuyGroupProducts, setDisplayBuyGroupProducts] = useState(false);
  const [displayTrialProducts, setDisplayTrialProducts] = useState(false);
  const [displayWholesaleProducts, setDisplayWholesaleProducts] = useState(false);
  const [displayExpiredProducts, setDisplayExpiredProducts] = useState(false);
  const [displayHiddenProducts, setDisplayHiddenProducts] = useState(false);
  const [displayDiscountedProducts, setDisplayDiscountedProducts] = useState(false);

  const brandsQuery = useBrands({
    term: activeSearchTermBrand,
  });

  const memoizedBrands = useMemo(() => {
    return (
      brandsQuery?.data?.data.map((item: IBrands) => {
        return { label: item.brandName, value: item.id };
      }) || []
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandsQuery?.data?.data?.length]);

  // Existing products memoized data
  const memoizedExistingProductsBrands = useMemo(() => {
    return (
      existingProductsBrandsQuery?.data?.data.map((item: IBrands) => {
        return { label: item.brandName, value: item.id };
      }) || []
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingProductsBrandsQuery?.data?.data?.length]);

  const memoizedCategories = useMemo(() => {
    if (categoriesQuery?.data?.data?.children) {
      return categoriesQuery.data.data.children.map((item: any) => {
        return { label: item.name, value: item.id };
      });
    }
    return [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Reset to page 1 when filter changes
  useEffect(() => {
    if (existingProductsSelectedType) {
      setExistingProductsPage(1);
    }
  }, [existingProductsSelectedType]);

  // Force refetch when categoryIds change
  useEffect(() => {
    if (existingProductsSelectedCategoryIds.length > 0) {
      existingProductsQuery.refetch();
    }
  }, [existingProductsSelectedCategoryIds, existingProductsQuery]);

  // Calculate filtered total count for pagination
  const filteredTotalCount = useMemo(() => {
    if (!existingProductsSelectedType) {
      return existingProductsQuery.data?.totalCount || 0;
    }
    
    // When filtering, we need to get all products and count the filtered ones
    // For now, we'll show the current filtered count and disable pagination
    return memoizedExistingProductList.length;
  }, [
    existingProductsSelectedType,
    memoizedExistingProductList.length,
    existingProductsQuery.data?.totalCount,
  ]);

  const handleBrandSearchChange = (event: any) => {
    setSearchTermBrand(event.target.value);
  };

  const handleBrandSearch = () => {
    setActiveSearchTermBrand(searchTermBrand);
    // Trigger refetch for brands
    if (brandsQuery.refetch) {
      brandsQuery.refetch();
    }
  };

  // Category filter handlers
  const handleCategoryChange = (categoryIds: number[]) => {
    setSelectedCategoryIds(categoryIds);
  };

  const handleCategoryClear = () => {
    setSelectedCategoryIds([]);
  };

  // Existing products category filter handlers
  const handleExistingProductsCategoryChange = (categoryIds: number[]) => {
    setExistingProductsSelectedCategoryIds(categoryIds);
  };


  const handleExistingProductsCategoryClear = () => {
    setExistingProductsSelectedCategoryIds([]);
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

  // Existing products handlers
  const handleExistingProductsSearchChange = (event: any) => {
    setExistingProductsSearchTerm(event.target.value);
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


  const handleExistingProductsSelection = (checked: boolean | string, id: number) => {
    let tempArr = existingProductsSelectedIds || [];
    if (checked && !tempArr.find((ele: number) => ele === id)) {
      tempArr = [...tempArr, id];
    }

    if (!checked && tempArr.find((ele: number) => ele === id)) {
      tempArr = tempArr.filter((ele: number) => ele !== id);
    }

    setExistingProductsSelectedIds(tempArr);
  };

  const handleAddExistingProducts = async () => {
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
      // Switch back to my products tab after successful addition
      setActiveTab('my-products');
      // Refetch my products to show the newly added products
      refetch();
    } else {
      toast({
        title: t("product_price_add_failed"),
        description: response.message,
        variant: "danger",
      });
    }
  };

  const form = useForm({
    resolver: zodResolver(schema(t)),
    defaultValues,
  });

  const sellType = () => {
    const selectedTypes = [];
    
    if (displayStoreProducts) selectedTypes.push("NORMALSELL");
    if (displayBuyGroupProducts) selectedTypes.push("BUYGROUP");
    if (displayTrialProducts) selectedTypes.push("TRIAL_PRODUCT");
    if (displayWholesaleProducts) selectedTypes.push("WHOLESALE_PRODUCT");
    
    return selectedTypes.length > 0 ? selectedTypes.join(",") : "";
  };

  const allManagedProductsQuery = useAllManagedProducts(
    {
      page: showOnlySelected ? 1 : page, // When filter is active, start from page 1
      limit: showOnlySelected ? 1000 : limit, // When filter is active, fetch a large number to get all selected products
      term: activeSearchTerm !== "" ? activeSearchTerm : undefined,
      selectedAdminId:
        me?.data?.data?.tradeRole == "MEMBER"
          ? me?.data?.data?.addedBy
          : undefined,
      brandIds: selectedBrandIds.join(","),
      categoryIds: selectedCategoryIds.length > 0 ? selectedCategoryIds.join(",") : undefined,
      status: displayHiddenProducts ? "INACTIVE" : "",
      expireDate: displayExpiredProducts ? "expired" : "",
      sellType: sellType(),
      discount: displayDiscountedProducts,
    },
    hasPermission,
  );


  const { data, refetch } = allManagedProductsQuery;
  const [products, setProducts] = useState(data?.data || []);
  const [totalCount, setTotalCount] = useState(data?.totalCount || 0);

  // Frontend filtering for My Products
  const filteredProducts = useMemo(() => {
    let filtered = products || [];
    
    // Filter by category if backend doesn't support it
    if (selectedCategoryIds.length > 0) {
      filtered = filtered.filter((product: any) => {
        // Check multiple possible category ID fields
        const categoryId = product.categoryId || 
                          product.category?.id || 
                          product.product?.categoryId || 
                          product.product?.category?.id ||
                          product.productPrice_product?.categoryId ||
                          product.productPrice_product?.category?.id;
        return selectedCategoryIds.includes(categoryId);
      });
    }
    
    return filtered;
  }, [products, selectedCategoryIds]);

  // Update total count based on filtered products
  const displayTotalCount = selectedCategoryIds.length > 0 ? filteredProducts.length : totalCount;

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

  // const selectAllProducts = () => {
  //   // Select all products across all pages
  //   if (data?.data) {
  //     const allProductIds = data.data.map((product: any) => product.id);
  //     setSelectedProductIds(allProductIds);
  //     setGlobalSelectedIds(new Set(allProductIds));
  //   }
  // };

  // const clearAllProductSelections = () => {
  //   // Clear all product selections across all pages
  //   setSelectedProductIds([]);
  //   setGlobalSelectedIds(new Set());
    
  //   // Disable the filter if it was active
  //   if (showOnlySelected) {
  //     setShowOnlySelected(false);
  //   }
  // };

  const clearFilter = () => {
    setSelectedBrandIds([]);
    setDisplayStoreProducts(false);
    setDisplayBuyGroupProducts(false);
    setDisplayExpiredProducts(false);
    setDisplayHiddenProducts(false);
    setDisplayDiscountedProducts(false);
    
    // Clear search terms
    setSearchTerm("");
    setActiveSearchTerm("");
    setSearchTermBrand("");
    setActiveSearchTermBrand("");
    
    // Clear category filters
    setSelectedCategoryIds([]);
    setExistingProductsSelectedCategoryIds([]);

    if (searchInputRef?.current) searchInputRef.current.value = "";
  };

  // Update state when new data is available
  useEffect(() => {
    if (data?.data) {
      // Debug: Log the actual data structure
      let filteredProducts = [...data.data];
      
      // Apply "Show Only Selected" filter if enabled
      if (showOnlySelected && globalSelectedIds.size > 0) {
        // When filter is active, we show ALL selected products from the fetched data
        filteredProducts = data.data.filter((product: any) => globalSelectedIds.has(product.id));
        
        // Update total count to show how many selected products we found
        setTotalCount(filteredProducts.length);
      } else {
        // When filter is not active, show all products from current page
        filteredProducts = [...data.data];
        setTotalCount(data.totalCount);
      }
      
      setProducts(filteredProducts);
      
      // Sync current page selections with global selections
      const currentPageIds = filteredProducts.map((product: any) => product.id);
      const currentPageSelections = currentPageIds.filter((id: number) => globalSelectedIds.has(id));
      setSelectedProductIds(currentPageSelections);
    }
  }, [data, globalSelectedIds, showOnlySelected]);

  // Handle filter state changes and refetch data when needed
  useEffect(() => {
    if (showOnlySelected && globalSelectedIds.size > 0) {
      // When filter becomes active, refetch to get all products for filtering
      refetch();
    }
  }, [showOnlySelected, globalSelectedIds, refetch]);

  // Function to remove a product from the state
  const handleRemoveFromList = (removedProductId: number) => {
    setProducts((prevProducts: any[]) =>
      prevProducts.filter((product) => product.id !== removedProductId),
    );
    setTotalCount((prevCount: number) => prevCount - 1);
    
    // Remove from global selections if it exists there
    setGlobalSelectedIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(removedProductId);
      return newSet;
    });
    
    // Disable filter if no more selected products
    if (globalSelectedIds.size === 0 && showOnlySelected) {
      setShowOnlySelected(false);
    }
    
    // If the last product on the page is removed, adjust pagination
    if (products.length === 1 && page > 1) {
      setPage(page - 1); // Move to previous page
    } else {
      refetch(); // Otherwise, just refresh the data
    }
  };

  const handleSearchChange = (event: any) => {
    setSearchTerm(event.target.value);
  };

  const handleSearch = () => {
    setActiveSearchTerm(searchTerm);
    refetch();
  };

  const handleExistingProductsSearch = () => {
    setActiveExistingProductsSearchTerm(existingProductsSearchTerm);
    // Trigger refetch for existing products
    if (existingProductsQuery.refetch) {
      existingProductsQuery.refetch();
    }
  };




  const handleProductIds = (checked: boolean | string, id: number) => {
    let tempArr = selectedProductIds || [];
    if (checked && !tempArr.find((ele: number) => ele === id)) {
      tempArr = [...tempArr, id];
      // Add to global selection
      setGlobalSelectedIds(prev => new Set(Array.from(prev).concat([id])));
    }

    if (!checked && tempArr.find((ele: number) => ele === id)) {
      tempArr = tempArr.filter((ele: number) => ele !== id);
      // Remove from global selection
      setGlobalSelectedIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }

    setSelectedProductIds(tempArr);
  };

  const onSubmit = async (formData: any) => {
    // Use global selections if available, otherwise use current page selections
    const productsToUpdate = Array.from(globalSelectedIds).length > 0 
      ? Array.from(globalSelectedIds) 
      : selectedProductIds;
      
    if (!productsToUpdate.length) {
      toast({
        title: t("update_failed"),
        description: t("please_select_at_least_one_product"),
        variant: "danger",
      });
      return;
    }
    const updatedFormData = {
      ...formData,
      productPrice:
        formData.offerPrice && formData.offerPrice !== 0
          ? formData.offerPrice
          : undefined,
      status: "ACTIVE",
    };

    const formatData = productsToUpdate.map((ele: number) => {
      return {
        productPriceId: ele,
        ...updatedFormData,
        stock: updatedFormData.isStockRequired
          ? 0
          : updatedFormData.stock && updatedFormData.stock !== 0
            ? updatedFormData.stock
            : 0,
        offerPrice: updatedFormData.isOfferPriceRequired
          ? 0
          : updatedFormData.offerPrice
            ? updatedFormData.offerPrice
            : undefined,
        productPrice: updatedFormData.isOfferPriceRequired
          ? 0
          : updatedFormData.offerPrice
            ? updatedFormData.offerPrice
            : undefined,
        deliveryAfter:
          updatedFormData.deliveryAfter && updatedFormData.deliveryAfter !== 0
            ? updatedFormData.deliveryAfter
            : undefined,
        timeOpen:
          updatedFormData.timeOpen && updatedFormData.timeOpen !== 0
            ? updatedFormData.timeOpen
            : undefined,
        timeClose:
          updatedFormData.timeClose && updatedFormData.timeClose !== 0
            ? updatedFormData.timeClose
            : undefined,
        minQuantity:
          updatedFormData.minQuantity && updatedFormData.minQuantity !== 0
            ? updatedFormData.minQuantity
            : undefined,
        maxQuantity:
          updatedFormData.maxQuantity && updatedFormData.maxQuantity !== 0
            ? updatedFormData.maxQuantity
            : undefined,
        minCustomer:
          updatedFormData.minCustomer && updatedFormData.minCustomer !== 0
            ? updatedFormData.minCustomer
            : undefined,
        maxCustomer:
          updatedFormData.maxCustomer && updatedFormData.maxCustomer !== 0
            ? updatedFormData.maxCustomer
            : undefined,
        minQuantityPerCustomer:
          updatedFormData.minQuantityPerCustomer &&
          updatedFormData.minQuantityPerCustomer !== 0
            ? updatedFormData.minQuantityPerCustomer
            : undefined,
        maxQuantityPerCustomer:
          updatedFormData.maxQuantityPerCustomer &&
          updatedFormData.maxQuantityPerCustomer !== 0
            ? updatedFormData.maxQuantityPerCustomer
            : undefined,
        vendorDiscount:
          updatedFormData.vendorDiscount && updatedFormData.vendorDiscount !== 0
            ? updatedFormData.vendorDiscount
            : undefined,
        consumerDiscount:
          updatedFormData.consumerDiscount &&
          updatedFormData.consumerDiscount !== 0
            ? updatedFormData.consumerDiscount
            : undefined,
        vendorDiscountType:
          updatedFormData.vendorDiscountType 
          ? updatedFormData.vendorDiscountType
          : undefined,
        consumerDiscountType:
          updatedFormData.consumerDiscountType
            ? updatedFormData.consumerDiscountType
            : undefined,
        productCondition:
          updatedFormData.productCondition &&
          updatedFormData.productCondition !== ""
            ? updatedFormData.productCondition
            : undefined,
        consumerType:
          updatedFormData.consumerType && updatedFormData.consumerType !== ""
            ? updatedFormData.consumerType
            : undefined,
        sellType:
          updatedFormData.sellType && updatedFormData.sellType !== ""
            ? updatedFormData.sellType
            : undefined,
        status:
          updatedFormData.offerPrice || updatedFormData.isOfferPriceRequired
            ? "ACTIVE"
            : undefined,
        askForStock: updatedFormData.isStockRequired ? "true" : undefined,
        askForPrice: updatedFormData.isOfferPriceRequired ? "true" : undefined,
      };
    });

    const finalData = formatData.map((item) => {
      delete item.isConsumerDiscountRequired,
        delete item.isConsumerTypeRequired,
        delete item.isDeliveryAfterRequired,
        delete item.isHiddenRequired,
        delete item.isMaxCustomerRequired,
        delete item.isMaxQuantityPerCustomerRequired,
        delete item.isMaxQuantityRequired,
        delete item.isMinCustomerRequired,
        delete item.isMinQuantityPerCustomerRequired,
        delete item.isMinQuantityRequired,
        delete item.isProductConditionRequired,
        delete item.isSellTypeRequired,
        delete item.isOfferPriceRequired;
      delete item.isStockRequired;
      delete item.isVendorDiscountRequired;

      return item;
    });


    // Note: updateMultipleProductPrice is not imported, need to add the import
    // const response = await updateMultipleProductPrice.mutateAsync({
    //   productPrice: [...finalData],
    // });

    // if (response.status) {
    //   toast({
    //     title: t("update_successful"),
    //     description: t("products_updated_successfully"),
    //     variant: "success",
    //   });
    //   // **Trigger refetch to update the product list**
    //   await refetch();

    //   form.reset();
    //   setSelectedProductIds([]);
    //   setGlobalSelectedIds(new Set()); // Clear global selections after successful update
    //   router.push("/manage-products");
    // } else {
    //   toast({
    //     title: t("update_failed"),
    //     description: response.message,
    //     variant: "danger",
    //   });
    // }
  };

  useEffect(() => {
    if (!hasPermission) router.push("/home");
  }, []);

  useEffect(() => {
    if (accessToken) {
      setHaveAccessToken(true);
    } else {
      setHaveAccessToken(false);
    }
  }, [accessToken]);

  if (!hasPermission) return <div></div>;

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <div className="w-full px-8 lg:px-12 py-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Store className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h1 className="text-xl font-semibold text-gray-900 capitalize">
                      {(() => {
                        const account = currentAccount?.data?.account;
                        if (currentAccount?.data?.isMainAccount) {
                          return account?.firstName || account?.name || "Main Account";
                        } else {
                          return account?.accountName || account?.companyName || "Account";
                        }
                      })()}
                    </h1>
                    <p className="text-sm text-gray-500">
                      {currentAccount?.data?.account?.tradeRole || "User"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {activeTab === 'my-products' && (
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder={t("search_product")}
                      className="w-64 h-10"
                      onChange={handleSearchChange}
                      ref={searchInputRef}
                      dir={langDir}
                      translate="no"
                    />
                    <Button
                      type="button"
                      onClick={handleSearch}
                      disabled={!searchTerm.trim()}
                      className="h-10 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
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
                      className="h-10 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {t("search")}
                    </Button>
                  </div>
                )}

                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center gap-2"
                  onClick={() => router.push('/product')}
                  dir={langDir}
                >
                  <IoMdAdd size={20} />
                  <span>{t("add_product")}</span>
                </button>
                {/* <button
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  onClick={selectAllProducts}
                  dir={langDir}
                  translate="no"
                >
                  Select All Products
                </button> */}
                {/* <button
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                  onClick={clearAllProductSelections}
                  dir={langDir}
                  translate="no"
                >
                  Clear All
                </button> */}
                {Array.from(globalSelectedIds).length > 0 && (
                  <button
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                    onClick={() => router.push(`/manage-products/bulk-action?ids=${Array.from(globalSelectedIds).join(',')}`)}
                    dir={langDir}
                  >
                    Bulk Update ({Array.from(globalSelectedIds).length})
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('my-products')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'my-products'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {t("my_products")}
                </button>
                <button
                  onClick={() => setActiveTab('dropship-products')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'dropship-products'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {t("my_dropship_products")}
                </button>
                <button
                  onClick={() => setActiveTab('existing-products')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'existing-products'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {t("existing_products")}
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          {activeTab === 'my-products' ? (
            <FormProvider {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Filters - Left Side */}
                  <div className="lg:w-1/4">
                    <div className="bg-white rounded-lg shadow-xs p-6">
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
                                    id={item.label}
                                    className="border border-gray-300 data-[state=checked]:bg-blue-600!"
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

                    {/* Product Conditions Filter */}
                    <Accordion
                      type="multiple"
                      defaultValue={["product_conditions"]}
                    >
                      <AccordionItem value="product_conditions">
                        <AccordionTrigger className="text-base hover:no-underline!">
                          {t("by_menu")}
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-3">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="displayStoreProducts"
                                className="border border-gray-300 data-[state=checked]:bg-blue-600!"
                                onCheckedChange={(checked: boolean) =>
                                  setDisplayStoreProducts(checked)
                                }
                                checked={displayStoreProducts}
                              />
                              <label
                                htmlFor="displayStoreProducts"
                                className="text-sm font-medium cursor-pointer"
                                dir={langDir}
                                translate="no"
                              >
                                {t("store")}
                              </label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="displayBuyGroupProducts"
                                className="border border-gray-300 data-[state=checked]:bg-blue-600!"
                                onCheckedChange={(checked: boolean) => {
                                  setDisplayBuyGroupProducts(checked);
                                  setDisplayExpiredProducts(
                                    checked
                                      ? displayExpiredProducts
                                      : false,
                                  );
                                }}
                                checked={displayBuyGroupProducts}
                              />
                              <label
                                htmlFor="displayBuyGroupProducts"
                                className="text-sm font-medium cursor-pointer"
                                dir={langDir}
                                translate="no"
                              >
                                {t("buy_group")}
                              </label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="displayTrialProducts"
                                className="border border-gray-300 data-[state=checked]:bg-blue-600!"
                                onCheckedChange={(checked: boolean) =>
                                  setDisplayTrialProducts(checked)
                                }
                                checked={displayTrialProducts}
                              />
                              <label
                                htmlFor="displayTrialProducts"
                                className="text-sm font-medium cursor-pointer"
                                dir={langDir}
                                translate="no"
                              >
                                {t("trial_product")}
                              </label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="displayWholesaleProducts"
                                className="border border-gray-300 data-[state=checked]:bg-blue-600!"
                                onCheckedChange={(checked: boolean) =>
                                  setDisplayWholesaleProducts(checked)
                                }
                                checked={displayWholesaleProducts}
                              />
                              <label
                                htmlFor="displayWholesaleProducts"
                                className="text-sm font-medium cursor-pointer"
                                dir={langDir}
                                translate="no"
                              >
                                {t("wholesale_product")}
                              </label>
                            </div>
                            {displayBuyGroupProducts ? (
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="displayExpiredProducts"
                                  className="border border-gray-300 data-[state=checked]:bg-blue-600!"
                                  onCheckedChange={(checked: boolean) =>
                                    setDisplayExpiredProducts(checked)
                                  }
                                  checked={displayExpiredProducts}
                                />
                                <label
                                  htmlFor="displayExpiredProducts"
                                  className="text-sm font-medium cursor-pointer"
                                  dir={langDir}
                                  translate="no"
                                >
                                  {t("expired")}
                                </label>
                              </div>
                            ) : null}
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="displayHiddenProducts"
                                className="border border-gray-300 data-[state=checked]:bg-blue-600!"
                                onCheckedChange={(checked: boolean) =>
                                  setDisplayHiddenProducts(checked)
                                }
                                checked={displayHiddenProducts}
                              />
                              <label
                                htmlFor="displayHiddenProducts"
                                className="text-sm font-medium cursor-pointer"
                                dir={langDir}
                                translate="no"
                              >
                                {t("hidden")}
                              </label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="displayDiscountedProducts"
                                className="border border-gray-300 data-[state=checked]:bg-blue-600!"
                                onCheckedChange={(checked: boolean) =>
                                  setDisplayDiscountedProducts(checked)
                                }
                                checked={displayDiscountedProducts}
                              />
                              <label
                                htmlFor="displayDiscountedProducts"
                                className="text-sm font-medium cursor-pointer"
                                dir={langDir}
                                translate="no"
                              >
                                {t("discounted")}
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
                  <div className="bg-white rounded-lg shadow-xs p-6">
                    <div className="mb-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold">
                          {t("products")} ({displayTotalCount})
                        </h2>
                        <div className="flex items-center gap-4">
                          {/* Show Only Selected Filter */}
                          <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-700">Show Selected :</label>
                            <button
                              type="button"
                              onClick={handleFilterToggle}
                              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                                showOnlySelected ? 'bg-blue-600' : 'bg-gray-200'
                              }`}
                            >
                              <span
                                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                                  showOnlySelected ? 'translate-x-5' : 'translate-x-1'
                                }`}
                              />
                            </button>
                            {showOnlySelected && (
                              <span className="text-xs text-blue-600 font-medium">
                                ({Array.from(globalSelectedIds).length} selected)
                              </span>
                            )}
                          </div>
                          {/* Page Limit Selector */}
                          <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-700">Show:</label>
                            <select
                              value={limit}
                              onChange={(e) => handleLimitChange(Number(e.target.value))}
                              className="h-8 px-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                            >
                              <option value={3}>3</option>
                              <option value={6}>6</option>
                              <option value={12}>12</option>
                              <option value={24}>24</option>
                              <option value={50}>50</option>
                            </select>
                          </div>



                          {/* <div className="text-sm text-gray-600">
                            <span className="font-medium">Current Page:</span> {selectedProductIds.length} selected
                            {Array.from(globalSelectedIds).length > 0 && (
                              <span className="ml-3">
                                <span className="font-medium">Total:</span> {Array.from(globalSelectedIds).length} selected
                              </span>
                            )}
                          </div> */}
                        </div>
                      </div>
                    </div>

                      {allManagedProductsQuery.isLoading ? (
                       <div className="space-y-4">
                         {Array.from({ length: 6 }).map((_, index) => (
                           <Skeleton key={index} className="h-24 w-full" />
                         ))}
                       </div>
                     ) : null}

                    {!allManagedProductsQuery.data?.data?.length &&
                    !allManagedProductsQuery.isLoading ? (
                      <div className="text-center py-16">
                        <p className="text-gray-500 text-lg">
                          {t("no_product_found")}
                        </p>
                      </div>
                    ) : null}

                    {/* Show message when filter is active but no products match */}
                    {showOnlySelected && products.length === 0 && allManagedProductsQuery.data?.data?.length > 0 ? (
                      <div className="text-center py-16">
                        <p className="text-gray-500 text-lg">
                          No selected products found in the current data
                        </p>
                        <p className="text-gray-400 text-sm mt-2">
                          Try refreshing the page or check if your selections are still valid
                        </p>
                        <button
                          onClick={() => setShowOnlySelected(false)}
                          className="mt-3 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                        >
                          Show All Products
                        </button>
                      </div>
                    ) : null}

                                         <div className="space-y-4">
                       {filteredProducts.map(
                         (product: {
                           id: number;
                           productId: number;
                           status: string;
                           askForPrice: string;
                           askForStock: string;
                           productPrice_product: {
                             productImages: {
                               id: number;
                               image: string | null;
                               video: string | null;
                             }[];
                             productName: string;
                           };
                           productPrice_productSellerImage: {
                             id: number;
                             image: string | null;
                             video: string | null;
                           }[];
                           productPrice: string;
                           offerPrice: string;
                           stock: number;
                           consumerType: string;
                           sellType: string;
                           deliveryAfter: number;
                           timeOpen: number | null;
                           timeClose: number | null;
                           vendorDiscount: number | null;
                           vendorDiscountType: string | null;
                           consumerDiscount: number | null;
                           consumerDiscountType: string | null;
                           minQuantity: number | null;
                           maxQuantity: number | null;
                           minCustomer: number | null;
                           maxCustomer: number | null;
                           minQuantityPerCustomer: number | null;
                           maxQuantityPerCustomer: number | null;
                           productCondition: string;
                         }) => {
                           
                           return (
                           <ManageProductCard
                             key={product?.id}
                             selectedIds={selectedProductIds}
                             onSelectedId={handleProductIds}
                             id={product?.id}
                             productId={product?.productId}
                             status={product?.status}
                             askForPrice={product?.askForPrice}
                             askForStock={product?.askForStock}
                             productImage={
                               product?.productPrice_productSellerImage
                                 ?.length
                                 ? product
                                     ?.productPrice_productSellerImage?.[0]
                                     ?.image
                                   : product?.productPrice_product
                                       ?.productImages?.[0]?.image
                             }
                             productName={
                               product?.productPrice_product?.productName
                             }
                             productPrice={product?.productPrice_product?.productPrice || product?.productPrice || "0"}
                             offerPrice={product?.productPrice_product?.offerPrice || product?.offerPrice || "0"}
                             deliveryAfter={product?.deliveryAfter || 0}
                             stock={product?.stock || 0}
                             consumerType={product?.consumerType || "CONSUMER"}
                             sellType={product?.sellType || "NORMALSELL"}
                             timeOpen={product?.timeOpen || 0}
                             timeClose={product?.timeClose || 0}
                             vendorDiscount={product?.vendorDiscount || 0}
                             vendorDiscountType={product?.vendorDiscountType || "PERCENTAGE"}
                             consumerDiscount={product?.consumerDiscount || 0}
                             consumerDiscountType={product?.consumerDiscountType || "PERCENTAGE"}
                             minQuantity={product?.minQuantity || 0}
                             maxQuantity={product?.maxQuantity || 0}
                             minCustomer={product?.minCustomer || 0}
                             maxCustomer={product?.maxCustomer || 0}
                             minQuantityPerCustomer={product?.minQuantityPerCustomer || 0}
                             maxQuantityPerCustomer={product?.maxQuantityPerCustomer || 0}
                             productCondition={product?.productCondition || ""}
                             onRemove={handleRemoveFromList}
                             productType={product?.productPrice_product?.productType}
                             isDropshipped={product?.productPrice_product?.isDropshipped || false}
                           />
                         );
                       })}
                     </div>

                    {!showOnlySelected && displayTotalCount > limit ? (
                      <div className="mt-8">
                        <Pagination
                          page={page}
                          setPage={handlePageChange}
                          totalCount={displayTotalCount}
                          limit={limit}
                        />
                      </div>
                    ) : null}
                    {showOnlySelected && (
                      <div className="mt-8 text-center text-gray-500">
                        Showing {products.length} selected products from all pages
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </form>
          </FormProvider>
          ) : activeTab === 'existing-products' ? (
            /* Existing Products Tab */
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Filters - Left Side */}
              <div className="lg:w-1/4">
                <div className="bg-white rounded-lg shadow-xs p-6">
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
                        className="px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors text-sm"
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
                        className="px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-sm"
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
                              className="h-8 px-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-xs"
                            >
                              {t("search")}
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {!memoizedExistingProductsBrands.length ? (
                            <p className="text-center text-sm text-gray-500">
                              {t("no_data_found")}
                            </p>
                          ) : null}
                          {memoizedExistingProductsBrands.map((item: ISelectOptions) => (
                            <div key={item.value} className="flex items-center space-x-2">
                              <Checkbox
                                id={`existing-${item.label}`}
                                className="border border-gray-300 data-[state=checked]:bg-blue-600!"
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
                              className="border border-gray-300 data-[state=checked]:bg-blue-600!"
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
                              className="border border-gray-300 data-[state=checked]:bg-blue-600!"
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
                <div className="bg-white rounded-lg shadow-xs p-6">
                  <div className="mb-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-semibold">
                        {t("existing_products")} ({filteredTotalCount})
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
                      <p className="text-gray-500 text-lg">
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
                        selectedIds={existingProductsSelectedIds}
                        onSelectedId={handleExistingProductsSelection}
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
          ) : activeTab === 'dropship-products' ? (
            /* Dropship Products Tab */
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Filters - Left Side */}
              <div className="lg:w-1/4">
                <div className="bg-white rounded-lg shadow-xs p-6">
                  <h3 className="text-lg font-semibold mb-4">{t("filters")}</h3>
                  
                  {/* Status Filter */}
                  <div className="mb-4">
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      {t("status")}
                    </Label>
                    <select
                      value={dropshipStatus}
                      onChange={(e) => setDropshipStatus(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">{t("all_statuses")}</option>
                      <option value="ACTIVE">{t("active")}</option>
                      <option value="INACTIVE">{t("inactive")}</option>
                    </select>
                  </div>

                  {/* Stats */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-700 mb-2">{t("dropship_stats")}</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>{t("total_products")}:</span>
                        <span className="font-medium">{dropshipProductsQuery.data?.totalCount || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t("active_products")}:</span>
                        <span className="font-medium text-green-600">
                          {dropshipProductsQuery.data?.data?.filter((p: any) => p.status === 'ACTIVE').length || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Products Grid - Right Side */}
              <div className="lg:w-3/4">
                <div className="bg-white rounded-lg shadow-xs p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold">{t("dropship_products")}</h3>
                    <Button
                      onClick={() => router.push('/product?tab=dropship')}
                      className="flex items-center gap-2"
                    >
                      <IoMdAdd className="h-4 w-4" />
                      {t("create_dropship_product")}
                    </Button>
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
                      {dropshipProductsQuery.data.data.map((product: any) => (
                        <DropshipProductCard
                          key={product.id}
                          id={product.id}
                          productId={product.id}
                          status={product.status}
                          productImage={
                            product.productImages?.find(img => 
                              img.variant?.type === 'marketing'
                            )?.image || product.productImages?.[0]?.image
                          }
                          productImages={product.productImages}
                          productName={product.productName}
                          productPrice={product.productPrice}
                          offerPrice={product.offerPrice}
                          deliveryAfter={product.originalProduct?.product_productPrice?.[0]?.deliveryAfter || product.productPrices?.[0]?.deliveryAfter || 1}
                          stock={product.originalProduct?.product_productPrice?.[0]?.stock || product.productPrices?.[0]?.stock || 0}
                          consumerType={product.productPrices?.[0]?.consumerType || 'EVERYONE'}
                          sellType={product.productPrices?.[0]?.sellType || 'NORMALSELL'}
                          timeOpen={product.productPrices?.[0]?.timeOpen}
                          timeClose={product.productPrices?.[0]?.timeClose}
                          vendorDiscount={product.productPrices?.[0]?.vendorDiscount}
                          vendorDiscountType={product.productPrices?.[0]?.vendorDiscountType}
                          consumerDiscount={product.productPrices?.[0]?.consumerDiscount}
                          consumerDiscountType={product.productPrices?.[0]?.consumerDiscountType}
                          minQuantity={product.productPrices?.[0]?.minQuantity}
                          maxQuantity={product.productPrices?.[0]?.maxQuantity}
                          minCustomer={product.productPrices?.[0]?.minCustomer}
                          maxCustomer={product.productPrices?.[0]?.maxCustomer}
                          minQuantityPerCustomer={product.productPrices?.[0]?.minQuantityPerCustomer}
                          maxQuantityPerCustomer={product.productPrices?.[0]?.maxQuantityPerCustomer}
                          productCondition={product.productCondition}
                          onRemove={handleDropshipProductDelete}
                          originalProduct={product.originalProduct}
                          dropshipMarkup={product.dropshipMarkup}
                          customMarketingContent={product.customMarketingContent}
                          additionalMarketingImages={product.additionalMarketingImages}
                          isDropshipped={product.isDropshipped}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-gray-400 mb-4">
                        <Store className="h-16 w-16 mx-auto" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {t("no_dropship_products")}
                      </h3>
                      <p className="text-gray-500 mb-6">
                        {t("no_dropship_products_description")}
                      </p>
                      <Button
                        onClick={() => router.push('/product?tab=dropship')}
                        className="flex items-center gap-2"
                      >
                        <IoMdAdd className="h-4 w-4" />
                        {t("create_first_dropship_product")}
                      </Button>
                    </div>
                  )}

                  {/* Pagination */}
                  {dropshipProductsQuery.data?.totalCount > 12 && (
                    <div className="mt-8">
                      <Pagination
                        page={dropshipPage}
                        setPage={handleDropshipPageChange}
                        totalCount={dropshipProductsQuery.data?.totalCount}
                        limit={12}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Fixed bottom bar for existing products */}
      {activeTab === 'existing-products' && existingProductsSelectedIds.length > 0 && (
        <div className="fixed bottom-0 left-0 z-10 flex w-full items-center justify-between border-t border-solid border-gray-300 bg-blue-600 px-10 py-3">
          <div className="flex items-center gap-4">
            {/* <p className="text-base font-medium text-white" translate="no">
              {t("n_products_selected").replace("{n}", String(existingProductsSelectedIds.length))}
            </p> */}
            <Button
              type="button"
              onClick={() => setExistingProductsSelectedIds([])}
              size="sm"
              className="flex items-center rounded-sm bg-transparent border border-white text-sm font-bold text-white hover:bg-white hover:text-blue-600"
              dir={langDir}
              translate="no"
            >
              {t("clear_selection")}
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              onClick={() => {
                const selectedIds = existingProductsSelectedIds.join(',');
                router.push(`/manage-products/bulk-add-existing?ids=${selectedIds}`);
              }}
              size="lg"
              className="flex items-center rounded-sm bg-transparent border border-white text-sm font-bold text-white hover:bg-white hover:text-blue-600"
              dir={langDir}
              translate="no"
            >
              {t("bulk_add_products")}
            </Button>
          </div>
        </div>
      )}

      
    </>
  );
};

export default withActiveUserGuard(ManageProductsPage);
