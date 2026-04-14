import { UseFormReturn } from "react-hook-form";
import { useTranslations } from "next-intl";
import { toast } from "@/components/ui/use-toast";
import { ULTRASOOQ_TOKEN_KEY } from "@/utils/constants";
import { getCookie } from "cookies-next";
import { IOption } from "@/utils/types/common.types";
import { BulkEditFormValues } from "./bulkEditTypes";
import { buildBulkUpdatePayload, buildDiscountData } from "./bulkEditSubmit";

interface UseBulkEditActionsProps {
  form: UseFormReturn<BulkEditFormValues>;
  selectedProducts: number[];
  onUpdate: () => void;
  onBulkUpdate: (data: any) => void;
  selectedCountries: IOption[];
  selectedStates: IOption[];
  selectedCities: IOption[];
  setSelectedCountries: (v: IOption[]) => void;
  setSelectedStates: (v: IOption[]) => void;
  setSelectedCities: (v: IOption[]) => void;
  watchAskForPrice: string;
  watchAskForStock: string;
}

/** Shared PATCH helper */
async function patchApi(url: string, body: object, token: any) {
  return fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
}

export function useBulkEditActions({
  form,
  selectedProducts,
  onUpdate,
  onBulkUpdate,
  selectedCountries,
  selectedStates,
  selectedCities,
  setSelectedCountries,
  setSelectedStates,
  setSelectedCities,
  watchAskForPrice,
  watchAskForStock,
}: UseBulkEditActionsProps) {
  const t = useTranslations();

  const executeHideShow = async (hide: boolean, onDone: () => void) => {
    try {
      const token = getCookie(ULTRASOOQ_TOKEN_KEY);
      const response = await patchApi(
        `${process.env.NEXT_PUBLIC_API_URL}/product/bulkHideShow`,
        { productPriceIds: selectedProducts, hide },
        token,
      );
      if (!response.ok) {
        toast({ title: t("error"), description: `HTTP ${response.status}: ${response.statusText}`, variant: "destructive" });
        return;
      }
      const result = await response.json();
      if (result.status) {
        toast({ title: t("success"), description: result.message, variant: "default" });
        onUpdate();
      } else {
        toast({ title: t("error"), description: result.message || t("failed_to_update_product_visibility"), variant: "destructive" });
      }
    } catch {
      toast({ title: t("error"), description: t("network_error_occurred"), variant: "destructive" });
    } finally {
      onDone();
    }
  };

  const handleBulkProductCondition = async () => {
    try {
      const condition = form.getValues("productCondition");
      if (!condition) {
        toast({ title: t("error"), description: t("please_select_product_condition"), variant: "destructive" });
        return;
      }
      const token = getCookie(ULTRASOOQ_TOKEN_KEY);
      const response = await patchApi(
        `${process.env.NEXT_PUBLIC_API_URL}/product/bulkProductCondition`,
        { productPriceIds: selectedProducts, productCondition: condition },
        token,
      );
      if (!response.ok) {
        toast({ title: t("error"), description: `HTTP ${response.status}: ${response.statusText}`, variant: "destructive" });
        return;
      }
      const result = await response.json();
      if (result.status) {
        toast({ title: t("success"), description: result.message, variant: "default" });
        onUpdate();
        form.setValue("productCondition", "");
      } else {
        toast({ title: t("error"), description: result.message || t("failed_to_update_product_condition"), variant: "destructive" });
      }
    } catch {
      toast({ title: t("error"), description: t("network_error_occurred"), variant: "destructive" });
    }
  };

  const handleBulkDiscountUpdate = async () => {
    try {
      const formData = form.getValues();
      if (!formData.consumerType || !formData.sellType) {
        toast({ title: t("error"), description: t("please_select_consumer_and_sell_type"), variant: "destructive" });
        return;
      }
      const token = getCookie(ULTRASOOQ_TOKEN_KEY);
      const response = await patchApi(
        `${process.env.NEXT_PUBLIC_API_URL}/product/bulkDiscountUpdate`,
        { productPriceIds: selectedProducts, discountData: buildDiscountData(formData) },
        token,
      );
      if (!response.ok) {
        toast({ title: t("error"), description: `HTTP ${response.status}: ${response.statusText}`, variant: "destructive" });
        return;
      }
      const result = await response.json();
      if (result.status) {
        toast({ title: t("success"), description: result.message, variant: "default" });
        onUpdate();
        (["consumerType", "sellType", "vendorDiscountType", "consumerDiscountType"] as const).forEach(
          (k) => form.setValue(k, ""),
        );
        (["deliveryAfter", "vendorDiscount", "consumerDiscount", "minQuantity", "maxQuantity",
          "minCustomer", "maxCustomer", "minQuantityPerCustomer", "maxQuantityPerCustomer",
          "timeOpen", "timeClose"] as const).forEach((k) => form.setValue(k, 0));
      } else {
        toast({ title: t("error"), description: result.message || t("failed_to_update_discounts"), variant: "destructive" });
      }
    } catch {
      toast({ title: t("error"), description: t("network_error_occurred"), variant: "destructive" });
    }
  };

  const handleBulkWhereToSellUpdate = async () => {
    try {
      if (!selectedCountries.length && !selectedStates.length && !selectedCities.length) {
        toast({ title: t("error"), description: t("please_select_at_least_one_location"), variant: "destructive" });
        return;
      }
      const locationData: any = {};
      if (selectedCountries.length > 0) locationData.sellCountryIds = selectedCountries;
      if (selectedStates.length > 0) locationData.sellStateIds = selectedStates;
      if (selectedCities.length > 0) locationData.sellCityIds = selectedCities;

      const token = getCookie(ULTRASOOQ_TOKEN_KEY);
      const response = await patchApi(
        `${process.env.NEXT_PUBLIC_API_URL}/product/bulkWhereToSellUpdate`,
        { productPriceIds: selectedProducts, locationData },
        token,
      );
      if (!response.ok) {
        toast({ title: t("error"), description: `HTTP ${response.status}: ${response.statusText}`, variant: "destructive" });
        return;
      }
      const result = await response.json();
      if (result.status) {
        toast({ title: t("success"), description: result.message, variant: "default" });
        onUpdate();
        setSelectedCountries([]);
        setSelectedStates([]);
        setSelectedCities([]);
        form.setValue("sellCountryIds", []);
        form.setValue("sellStateIds", []);
        form.setValue("sellCityIds", []);
      } else {
        toast({ title: t("error"), description: result.message || t("failed_to_update_where_to_sell"), variant: "destructive" });
      }
    } catch {
      toast({ title: t("error"), description: t("network_error_occurred"), variant: "destructive" });
    }
  };

  const handleBulkAskForUpdate = async () => {
    try {
      if ((!watchAskForPrice || watchAskForPrice === "") && (!watchAskForStock || watchAskForStock === "")) {
        toast({ title: t("error"), description: t("please_select_at_least_one_ask_for"), variant: "destructive" });
        return;
      }
      const askForData: any = {};
      if (watchAskForPrice && watchAskForPrice !== "") askForData.askForPrice = watchAskForPrice;
      if (watchAskForStock && watchAskForStock !== "") askForData.askForStock = watchAskForStock;

      const token = getCookie(ULTRASOOQ_TOKEN_KEY);
      const response = await patchApi(
        `${process.env.NEXT_PUBLIC_API_URL}/product/bulkAskForUpdate`,
        { productPriceIds: selectedProducts, askForData },
        token,
      );
      if (!response.ok) {
        toast({ title: t("error"), description: `HTTP ${response.status}: ${response.statusText}`, variant: "destructive" });
        return;
      }
      const result = await response.json();
      if (result.status) {
        toast({ title: t("success"), description: result.message, variant: "default" });
        onUpdate();
        form.setValue("askForPrice", "");
        form.setValue("askForStock", "");
      } else {
        toast({ title: t("error"), description: result.message || t("failed_to_update_ask_for"), variant: "destructive" });
      }
    } catch {
      toast({ title: t("error"), description: t("network_error_occurred"), variant: "destructive" });
    }
  };

  const onSubmit = (data: BulkEditFormValues) => {
    const updateData = buildBulkUpdatePayload(data);
    if (Object.keys(updateData).length === 0) return;
    onBulkUpdate(updateData);
  };

  return {
    executeHideShow,
    handleBulkProductCondition,
    handleBulkDiscountUpdate,
    handleBulkWhereToSellUpdate,
    handleBulkAskForUpdate,
    onSubmit,
  };
}
