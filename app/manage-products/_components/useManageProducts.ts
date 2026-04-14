"use client";
import { useEffect, useState } from "react";
import { getCookie } from "cookies-next";
import { ULTRASOOQ_TOKEN_KEY } from "@/utils/constants";
import { PERMISSION_PRODUCTS, checkPermission } from "@/helpers/permission";
import { useCurrentAccount } from "@/apis/queries/auth.queries";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { useTranslations } from "next-intl";
import { VALID_TABS, ActiveTab } from "./manageProductsTypes";
import { useMyProductsState } from "./useMyProductsState";
import { useExistingProductsState } from "./useExistingProductsState";
import { useDropshipState } from "./useDropshipState";

export function useManageProducts() {
  const t = useTranslations();
  const router = useRouter();
  const { toast } = useToast();
  const hasPermission = checkPermission(PERMISSION_PRODUCTS);
  const { data: currentAccount } = useCurrentAccount();
  const accessToken = getCookie(ULTRASOOQ_TOKEN_KEY);
  const [haveAccessToken, setHaveAccessToken] = useState(false);

  const searchParams = useSearchParams();
  const tabParam = searchParams?.get("tab");
  const initialTab = VALID_TABS.includes(tabParam as any)
    ? (tabParam as ActiveTab)
    : "my-products";
  const [activeTab, setActiveTab] = useState<ActiveTab>(initialTab);

  // Sub-hooks
  const myProducts = useMyProductsState(hasPermission);
  const existingProducts = useExistingProductsState(
    myProducts.me.data?.data?.id,
    myProducts.activeSearchTermBrand ?? "",
  );
  const dropship = useDropshipState(activeTab);

  useEffect(() => {
    if (!hasPermission) router.push("/home");
  }, []);

  useEffect(() => {
    setHaveAccessToken(!!accessToken);
  }, [accessToken]);

  // Update products state when data arrives
  useEffect(() => {
    const { data, showOnlySelected, globalSelectedIds, setProducts, setTotalCount, setSelectedProductIds } = myProducts;
    if (data?.data) {
      let filteredData = [...data.data];
      if (showOnlySelected && globalSelectedIds.size > 0) {
        filteredData = data.data.filter((product: any) => globalSelectedIds.has(product.id));
        setTotalCount(filteredData.length);
      } else {
        filteredData = [...data.data];
        setTotalCount(data.totalCount);
      }
      myProducts.setProducts(filteredData);
      const currentPageIds = filteredData.map((product: any) => product.id);
      const currentPageSelections = currentPageIds.filter((id: number) =>
        globalSelectedIds.has(id),
      );
      setSelectedProductIds(currentPageSelections);
    }
  }, [myProducts.data, myProducts.globalSelectedIds, myProducts.showOnlySelected]);

  useEffect(() => {
    if (myProducts.showOnlySelected && myProducts.globalSelectedIds.size > 0) {
      myProducts.refetch();
    }
  }, [myProducts.showOnlySelected, myProducts.globalSelectedIds, myProducts.refetch]);

  const clearFilter = () => {
    myProducts.clearFilter(myProducts.searchInputRef, () => {
      existingProducts.setExistingProductsSelectedCategoryIds([]);
    });
  };

  const onSubmit = async (formData: any) => {
    const productsToUpdate =
      Array.from(myProducts.globalSelectedIds).length > 0
        ? Array.from(myProducts.globalSelectedIds)
        : myProducts.selectedProductIds;

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
      productPrice: formData.offerPrice && formData.offerPrice !== 0 ? formData.offerPrice : undefined,
      status: "ACTIVE",
    };

    const formatData = productsToUpdate.map((ele: number) => ({
      productPriceId: ele,
      ...updatedFormData,
      stock: updatedFormData.isStockRequired ? 0 : updatedFormData.stock && updatedFormData.stock !== 0 ? updatedFormData.stock : 0,
      offerPrice: updatedFormData.isOfferPriceRequired ? 0 : updatedFormData.offerPrice ? updatedFormData.offerPrice : undefined,
      productPrice: updatedFormData.isOfferPriceRequired ? 0 : updatedFormData.offerPrice ? updatedFormData.offerPrice : undefined,
      deliveryAfter: updatedFormData.deliveryAfter && updatedFormData.deliveryAfter !== 0 ? updatedFormData.deliveryAfter : undefined,
      timeOpen: updatedFormData.timeOpen && updatedFormData.timeOpen !== 0 ? updatedFormData.timeOpen : undefined,
      timeClose: updatedFormData.timeClose && updatedFormData.timeClose !== 0 ? updatedFormData.timeClose : undefined,
      minQuantity: updatedFormData.minQuantity && updatedFormData.minQuantity !== 0 ? updatedFormData.minQuantity : undefined,
      maxQuantity: updatedFormData.maxQuantity && updatedFormData.maxQuantity !== 0 ? updatedFormData.maxQuantity : undefined,
      minCustomer: updatedFormData.minCustomer && updatedFormData.minCustomer !== 0 ? updatedFormData.minCustomer : undefined,
      maxCustomer: updatedFormData.maxCustomer && updatedFormData.maxCustomer !== 0 ? updatedFormData.maxCustomer : undefined,
      minQuantityPerCustomer: updatedFormData.minQuantityPerCustomer && updatedFormData.minQuantityPerCustomer !== 0 ? updatedFormData.minQuantityPerCustomer : undefined,
      maxQuantityPerCustomer: updatedFormData.maxQuantityPerCustomer && updatedFormData.maxQuantityPerCustomer !== 0 ? updatedFormData.maxQuantityPerCustomer : undefined,
      vendorDiscount: updatedFormData.vendorDiscount && updatedFormData.vendorDiscount !== 0 ? updatedFormData.vendorDiscount : undefined,
      consumerDiscount: updatedFormData.consumerDiscount && updatedFormData.consumerDiscount !== 0 ? updatedFormData.consumerDiscount : undefined,
      vendorDiscountType: updatedFormData.vendorDiscountType ? updatedFormData.vendorDiscountType : undefined,
      consumerDiscountType: updatedFormData.consumerDiscountType ? updatedFormData.consumerDiscountType : undefined,
      productCondition: updatedFormData.productCondition && updatedFormData.productCondition !== "" ? updatedFormData.productCondition : undefined,
      consumerType: updatedFormData.consumerType && updatedFormData.consumerType !== "" ? updatedFormData.consumerType : undefined,
      sellType: updatedFormData.sellType && updatedFormData.sellType !== "" ? updatedFormData.sellType : undefined,
      status: updatedFormData.offerPrice || updatedFormData.isOfferPriceRequired ? "ACTIVE" : undefined,
      askForStock: updatedFormData.isStockRequired ? "true" : undefined,
      askForPrice: updatedFormData.isOfferPriceRequired ? "true" : undefined,
    }));

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

    // Note: updateMultipleProductPrice is not imported — preserved as-is
    void finalData;
  };

  return {
    t, router, hasPermission, currentAccount,
    haveAccessToken, activeTab, setActiveTab,
    ...myProducts,
    clearFilter,
    onSubmit,
    existingProducts,
    dropship,
  };
}
