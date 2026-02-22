import React, { useEffect, useMemo, useRef } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  CONSUMER_TYPE_LIST,
  PRODUCT_CONDITION_LIST,
  SELL_TYPE_LIST,
} from "@/utils/constants";
import { Controller, useFormContext } from "react-hook-form";
import ReactSelect from "react-select";
import { Label } from "@/components/ui/label";
import CounterTextInputField from "../createProduct/CounterTextInputField";
import { ILocations, IOption } from "@/utils/types/common.types";
import { FiEyeOff } from "react-icons/fi";
// import { FiEye } from "react-icons/fi";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import LoaderWithMessage from "@/components/shared/LoaderWithMessage";
import { IoIosEyeOff } from "react-icons/io";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";

interface Option {
  readonly label: string;
  readonly value: string;
}

const customStyles = {
  control: (base: any) => ({
    ...base,
    height: 48,
    minHeight: 48,
  }),
  menu: (base: any) => ({
    ...base,
    zIndex: 20,
  }),
};

type ManageProductAsideProps = {
  isLoading?: boolean;
  prefilledData?: {[key: string]: any}
};

const ManageProductAside: React.FC<ManageProductAsideProps> = ({
  isLoading,
  prefilledData
}) => {
  const t = useTranslations();
  const { langDir } = useAuth();

  const formContext = useFormContext();

  const watchConsumerType = formContext.watch("consumerType");
  const watchSellType = formContext.watch("sellType");

  const watchIsHiddenRequired = formContext.watch("isHiddenRequired");
  const watchIsProductConditionRequired = formContext.watch(
    "isProductConditionRequired",
  );
  const watchIsStockRequired = formContext.watch("isStockRequired");
  const watchIsOfferPriceRequired = formContext.watch("isOfferPriceRequired");
  const watchIsConsumerTypeRequired = formContext.watch(
    "isConsumerTypeRequired",
  );
  const watchIsSellTypeRequired = formContext.watch("isSellTypeRequired");
  const watchIsDeliveryAfterRequired = formContext.watch(
    "isDeliveryAfterRequired",
  );
  const watchIsVendorDiscountRequired = formContext.watch(
    "isVendorDiscountRequired",
  );
  const watchVendorDiscount = formContext.watch("vendorDiscount")
  const watchIsConsumerDiscountRequired = formContext.watch(
    "isConsumerDiscountRequired",
  );
  const watchConsumerDiscount = formContext.watch("consumerDiscount")
  const watchIsMinQuantityRequired = formContext.watch("isMinQuantityRequired");
  const watchIsMaxQuantityRequired = formContext.watch("isMaxQuantityRequired");
  const watchIsMinCustomerRequired = formContext.watch("isMinCustomerRequired");
  const watchIsMaxCustomerRequired = formContext.watch("isMaxCustomerRequired");
  const watchIsMinQuantityPerCustomerRequired = formContext.watch(
    "isMinQuantityPerCustomerRequired",
  );
  const watchIsMaxQuantityPerCustomerRequired = formContext.watch(
    "isMaxQuantityPerCustomerRequired",
  );

  const errors = formContext.formState.errors;
  const productConditionMessage = errors?.productCondition?.message;
  const stockMessage = errors?.stock?.message;
  const offerPriceMessage = errors?.offerPrice?.message;
  const consumerTypeMessage = errors?.consumerType?.message;
  const sellTypeMessage = errors?.sellType?.message;

  const productConditions = () => {
    return Object.keys(PRODUCT_CONDITION_LIST).map(
      (value: string, index: number) => {
        return {
          label: t(PRODUCT_CONDITION_LIST[index].label),
          value: PRODUCT_CONDITION_LIST[index].value,
        };
      },
    );
  };

  const sellTypes = () => {
    return Object.keys(SELL_TYPE_LIST).map((value: string, index: number) => {
      return {
        label: t(SELL_TYPE_LIST[index].label),
        value: SELL_TYPE_LIST[index].value,
      };
    });
  };

  const consumerTypes = () => {
    return Object.keys(CONSUMER_TYPE_LIST).map(
      (value: string, index: number) => {
        return {
          label: t(CONSUMER_TYPE_LIST[index].label),
          value: CONSUMER_TYPE_LIST[index].value,
        };
      },
    );
  };

  useEffect(() => {
    if (prefilledData) {
      formContext.setValue('productCondition', prefilledData.productCondition);
      formContext.setValue('stock', prefilledData.stock);
      formContext.setValue('offerPrice', prefilledData.offerPrice);
      formContext.setValue('deliveryAfter', prefilledData.deliveryAfter);
      formContext.setValue('consumerType', prefilledData.consumerType);
      formContext.setValue('consumerDiscount', prefilledData.consumerDiscount);
      formContext.setValue('consumerDiscountType', prefilledData.consumerDiscountType);
      formContext.setValue('vendorDiscount', prefilledData.vendorDiscount);
      formContext.setValue('vendorDiscountType', prefilledData.vendorDiscountType);
      formContext.setValue('sellType', prefilledData.sellType);
      formContext.setValue('minQuantity', prefilledData.minQuantity);
      formContext.setValue('maxQuantity', prefilledData.maxQuantity);
      formContext.setValue('minCustomer', prefilledData.minCustomer);
      formContext.setValue('maxCustomer', prefilledData.maxCustomer);
      formContext.setValue('minQuantityPerCustomer', prefilledData.minQuantityPerCustomer);
      formContext.setValue('maxQuantityPerCustomer', prefilledData.maxQuantityPerCustomer);
      formContext.setValue('timeOpen', prefilledData.timeOpen);
      formContext.setValue('timeClose', prefilledData.timeClose);
    }
  }, [prefilledData])

  return (
    <aside className="manage_product_list h-fit">
      <div className="manage_product_list_wrap">
        <h2 dir={langDir} translate="no">{t("manage_product")}</h2>
        <div className="all_select_button" dir={langDir}>
          <button
            type="button"
            onClick={() => {
              formContext.setValue("isHiddenRequired", true);
              formContext.setValue("isProductConditionRequired", true);
              formContext.setValue("isStockRequired", true);
              formContext.setValue("isOfferPriceRequired", true);
              formContext.setValue("isConsumerTypeRequired", true);
              formContext.setValue("isSellTypeRequired", true);
              formContext.setValue("isDeliveryAfterRequired", true);
              formContext.setValue("isVendorDiscountRequired", true);
              formContext.setValue("isConsumerDiscountRequired", true);
              formContext.setValue("isTimeOpen", true);
              formContext.setValue("IsTimeClose", true);
              formContext.setValue("isMinQuantityRequired", true);
              formContext.setValue("isMaxQuantityRequired", true);
              formContext.setValue("isMinCustomerRequired", true);
              formContext.setValue("isMaxCustomerRequired", true);
              formContext.setValue("isMinQuantityPerCustomerRequired", true);
              formContext.setValue("isMaxQuantityPerCustomerRequired", true);
            }}
            translate="no"
          >
            {t("select_all")}
          </button>
          <button
            type="button"
            onClick={() => {
              formContext.setValue("isHiddenRequired", false);
              formContext.setValue("isProductConditionRequired", false);
              formContext.setValue("productCondition", null);
              formContext.setValue("isStockRequired", false);
              formContext.setValue("isOfferPriceRequired", false);
              formContext.setValue("isConsumerTypeRequired", false);
              formContext.setValue("isSellTypeRequired", false);
              formContext.setValue("isDeliveryAfterRequired", false);
              formContext.setValue("isVendorDiscountRequired", false);
              formContext.setValue("isConsumerDiscountRequired", false);
              formContext.setValue("isTimeOpen", false);
              formContext.setValue("IsTimeClose", false);
              formContext.setValue("isMinQuantityRequired", false);
              formContext.setValue("isMaxQuantityRequired", false);
              formContext.setValue("isMinCustomerRequired", false);
              formContext.setValue("isMaxCustomerRequired", false);
              formContext.setValue("isMinQuantityPerCustomerRequired", false);
              formContext.setValue("isMaxQuantityPerCustomerRequired", false);
            }}
            translate="no"
          >
            {t("clean_select")}
          </button>
        </div>

        <div className="select_main_wrap">
          <div className="flex items-center justify-start gap-[10px] py-2">
            <Controller
              name="isProductConditionRequired"
              control={formContext.control}
              render={({ field }) => (
                <input
                  type="checkbox"
                  className="h-[30px] w-[30px]"
                  checked={!!field.value}
                  onChange={field.onChange}
                  dir={langDir}
                />
              )}
            />
            <div
              className="flex w-[calc(100%-40px)] flex-wrap items-center justify-start border-[1px] border-[#ccc] border-[solid] p-2"
              dir={langDir}
            >
              <Label translate="no">{t("product_condition")}</Label>
              <div className="mt-2 flex w-full gap-2 space-y-2">
                <Controller
                  name="productCondition"
                  control={formContext.control}
                  render={({ field }) => (
                    <ReactSelect
                      className="w-full"
                      {...field}
                      onChange={(newValue) => {
                        field.onChange(newValue?.value);
                      }}
                      options={productConditions()}
                      value={
                        productConditions().find(
                          (item: any) => item.value === field.value,
                        ) || null
                      }
                      styles={customStyles}
                      instanceId="productCondition"
                      placeholder={t("select")}
                      isRtl={langDir == "rtl"}
                      // isDisabled={!watchIsProductConditionRequired}
                    />
                  )}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-start gap-[10px] py-2">
            <Controller
              name="isHiddenRequired"
              control={formContext.control}
              render={({ field }) => (
                <input
                  type="checkbox"
                  className="h-[30px] w-[30px]"
                  checked={!!field.value}
                  onChange={field.onChange}
                />
              )}
            />
            <div
              className="flex w-[calc(100%-40px)] items-center justify-start border-[1px] border-[#ccc] border-[solid] p-2"
              dir={langDir}
            >
              <IoIosEyeOff className="text-[20px] text-[#ccc]" />
              <Label translate="no">{t("hide_All_selected")}</Label>
            </div>
          </div>

          <div className="flex items-center justify-start gap-[10px] py-2">
            <Controller
              name="isStockRequired"
              control={formContext.control}
              render={({ field }) => (
                <input
                  type="checkbox"
                  className="h-[30px] w-[30px]"
                  checked={!!field.value}
                  onChange={field.onChange}
                />
              )}
            />
            <div
              className="flex w-[calc(100%-40px)] flex-wrap items-center justify-start border-[1px] border-[#ccc] border-[solid] p-2"
              dir={langDir}
            >
              <Label translate="no">{t("ask_for_the_stock")}</Label>
              <div className="mt-2 flex w-full gap-2 space-y-2">
                {!watchIsStockRequired ? (
                  <Controller
                    name="stock"
                    control={formContext.control}
                    render={({ field }) => (
                      <div className="space-y-2">
                        <Input
                          type="number"
                          className="theme-form-control-s1"
                          placeholder={t("ask_for_the_stock")}
                          {...field}
                          onWheel={(e) => e.currentTarget.blur()}
                          disabled={watchIsStockRequired}
                          dir={langDir}
                          translate="no"
                        />
                      </div>
                    )}
                  />
                ) : null}
                {stockMessage ? (
                  <p className="text-[13px] text-red-500" dir={langDir}>
                    {stockMessage.toString()}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-start gap-[10px] py-2">
            <Controller
              name="isOfferPriceRequired"
              control={formContext.control}
              render={({ field }) => (
                <input
                  type="checkbox"
                  className="h-[30px] w-[30px]"
                  checked={!!field.value}
                  onChange={field.onChange}
                />
              )}
            />
            <div
              className="flex w-[calc(100%-40px)] flex-wrap items-center justify-start border-[1px] border-[#ccc] border-[solid] p-2"
              dir={langDir}
            >
              <Label translate="no">{t("ask_for_the_price")}</Label>
              {!watchIsOfferPriceRequired ? (
                <Controller
                  name="offerPrice"
                  control={formContext.control}
                  render={({ field }) => (
                    <div className="mt-2 flex w-full gap-2 space-y-2">
                      <Input
                        type="number"
                        className="theme-form-control-s1"
                        placeholder={t("ask_for_the_price")}
                        {...field}
                        onWheel={(e) => e.currentTarget.blur()}
                        disabled={watchIsOfferPriceRequired}
                        dir={langDir}
                        translate="no"
                      />
                    </div>
                  )}
                />
              ) : null}
              {offerPriceMessage ? (
                <p className="text-[13px] text-red-500" dir={langDir}>
                  {offerPriceMessage.toString()}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex items-center justify-start gap-[10px] py-2">
            <Controller
              name="isDeliveryAfterRequired"
              control={formContext.control}
              render={({ field }) => (
                <input
                  type="checkbox"
                  className="h-[30px] w-[30px]"
                  checked={!!field.value}
                  onChange={field.onChange}
                />
              )}
            />
            <div
              className="flex w-[calc(100%-40px)] flex-wrap items-center justify-between border-[1px] border-[#ccc] border-[solid] p-2"
              dir={langDir}
            >
              <Label translate="no">{t("deliver_after")}</Label>
              <div className="flex w-full gap-2 space-y-2">
                {/* <div className="flex w-[90px] items-center justify-center rounded border-[1px] border-[#EBEBEB] border-[solid]"> */}
                <CounterTextInputField
                  name="deliveryAfter"
                  placeholder={t("after")}
                />
                {/* </div> */}
              </div>
            </div>
          </div>

          {watchSellType === "BUYGROUP" ? (
            <div className="flex items-center justify-start gap-[10px] py-2">
              <Controller
                name="isTimeOpen"
                control={formContext.control}
                render={({ field }) => (
                  <input
                    type="checkbox"
                    className="h-[30px] w-[30px]"
                    checked={!!field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              <div
                className="flex w-[calc(100%-40px)] items-center justify-between border-[1px] border-[#ccc] border-[solid] p-2"
                dir={langDir}
              >
                <Label translate="no">{t("time_open")}</Label>
                <CounterTextInputField
                  label=""
                  name="timeOpen"
                  placeholder={t("open")}
                />
              </div>
            </div>
          ) : null}

          {watchSellType === "BUYGROUP" ? (
            <div className="flex items-center justify-start gap-[10px] py-2">
              <Controller
                name="IsTimeClose"
                control={formContext.control}
                render={({ field }) => (
                  <input
                    type="checkbox"
                    className="h-[30px] w-[30px]"
                    checked={!!field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              <div
                className="flex w-[calc(100%-40px)] items-center justify-between border-[1px] border-[#ccc] border-[solid] p-2"
                dir={langDir}
              >
                <Label translate="no">{t("time_close")}</Label>
                <CounterTextInputField
                  label=""
                  name="timeClose"
                  placeholder={t("close")}
                />
              </div>
            </div>
          ) : null}

          <div className="flex items-center justify-start gap-[10px] py-2">
            <Controller
              name="isConsumerTypeRequired"
              control={formContext.control}
              render={({ field }) => (
                <input
                  type="checkbox"
                  className="h-[30px] w-[30px]"
                  checked={!!field.value}
                  onChange={field.onChange}
                />
              )}
            />
            <div
              className="flex w-[calc(100%-40px)] flex-wrap items-center justify-start border-[1px] border-[#ccc] border-[solid] p-2"
              dir={langDir}
            >
              <Label translate="no">{t("consumer_type")}</Label>
              <div className="mt-2 flex w-full gap-2 space-y-2">
                <Controller
                  name="consumerType"
                  control={formContext.control}
                  defaultValue="CONSUMER" // ✅ Set default inside Controller
                  render={({ field }) => (
                    <ReactSelect
                      className="w-full"
                      {...field}
                      onChange={(newValue) => {
                        field.onChange(newValue?.value);
                      }}
                      options={consumerTypes()}
                      value={consumerTypes().find(
                        (item: Option) => item.value === field.value,
                      )}
                      styles={customStyles}
                      instanceId="consumerType"
                      isRtl={langDir == "rtl"}
                      // isDisabled={!watchIsConsumerTypeRequired}
                    />
                  )}
                />
                {consumerTypeMessage ? (
                  <p className="text-[13px] text-red-500" dir={langDir}>
                    {consumerTypeMessage.toString()}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-start gap-[10px] py-2">
            <Controller
              name="isSellTypeRequired"
              control={formContext.control}
              render={({ field }) => (
                <input
                  type="checkbox"
                  className="h-[30px] w-[30px]"
                  checked={!!field.value}
                  onChange={field.onChange}
                />
              )}
            />
            <div
              className="flex w-[calc(100%-40px)] flex-wrap items-center justify-start border-[1px] border-[#ccc] border-[solid] p-2"
              dir={langDir}
            >
              <Label translate="no">{t("sell_type")}</Label>
              <div className="mt-2 flex w-full gap-2 space-y-2">
                <Controller
                  name="sellType"
                  control={formContext.control}
                  render={({ field }) => (
                    <ReactSelect
                      className="w-full"
                      {...field}
                      onChange={(newValue) => {
                        field.onChange(newValue?.value);
                      }}
                      options={sellTypes()}
                      value={sellTypes().find(
                        (item: Option) => item.value === field.value,
                      )}
                      styles={customStyles}
                      instanceId="sellType"
                      isRtl={langDir == "rtl"}
                      // isDisabled={!watchIsSellTypeRequired}
                    />
                  )}
                />
                {sellTypeMessage ? (
                  <p className="text-[13px] text-red-500" dir={langDir}>
                    {sellTypeMessage.toString()}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          {watchConsumerType === "EVERYONE" ||
          watchConsumerType === "VENDORS" ? (
            <div className="flex items-center justify-start gap-[10px] py-2">
              {/* <div className="select_type_checkbox"> */}
              <Controller
                name="isVendorDiscountRequired"
                control={formContext.control}
                render={({ field }) => (
                  <input
                    type="checkbox"
                    className="h-[30px] w-[30px]"
                    checked={!!field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              {/* </div> */}
              <div
                className="flex w-[calc(100%-40px)] flex-wrap items-center justify-between border-[1px] border-[#ccc] border-[solid] p-2"
                dir={langDir}
              >
                <Label translate="no">{t("vendor_discount")}</Label>
                <div className="flex w-full gap-2 space-y-2">
                  <CounterTextInputField
                    name="vendorDiscount"
                    placeholder="Discount"
                  />
                </div>

                {watchVendorDiscount ? (
                  <>
                    <Label dir={langDir} className="mb-1" translate="no">{t("discount_type")}</Label>
                    <Controller
                      name="vendorDiscountType"
                      control={formContext.control}
                      render={({ field }) => (
                        <select
                          {...field}
                          className="h-[48px]! w-full rounded border border-gray-300! px-3 text-sm focus-visible:ring-0!"
                        >
                          <option value="" dir={langDir}></option>
                          <option value="FLAT" dir={langDir} translate="no">
                            {t("flat").toUpperCase()}
                          </option>
                          <option value="PERCENTAGE" dir={langDir} translate="no">
                            {t("percentage").toUpperCase()}
                          </option>
                        </select>
                      )}
                    />
                  </>
                ) : null}
              </div>
            </div>
          ) : null}

          {watchConsumerType === "EVERYONE" ||
          watchConsumerType === "CONSUMER" ? (
            <div className="flex items-center justify-start gap-[10px] py-2">
              {/* <div className="select_type_checkbox"> */}
              <Controller
                name="isConsumerDiscountRequired"
                control={formContext.control}
                render={({ field }) => (
                  <input
                    type="checkbox"
                    className="h-[30px] w-[30px]"
                    checked={!!field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              {/* </div> */}
              <div
                className="flex w-[calc(100%-40px)] flex-wrap items-center justify-between border-[1px] border-[#ccc] border-[solid] p-2"
                dir={langDir}
              >
                <Label translate="no">{t("consumer_discount")}</Label>
                <CounterTextInputField
                  name="consumerDiscount"
                  placeholder={t("discount")}
                />

                {watchConsumerDiscount ? (
                  <>
                    <Label dir={langDir} className="mb-1" translate="no">{t("discount_type")}</Label>
                    <Controller
                      name="consumerDiscountType"
                      control={formContext.control}
                      render={({ field }) => (
                        <select
                          {...field}
                          className="h-[48px]! w-full rounded border border-gray-300! px-3 text-sm focus-visible:ring-0!"
                        >
                          <option value="" dir={langDir}></option>
                          <option value="FLAT" dir={langDir} translate="no">
                            {t("flat").toUpperCase()}
                          </option>
                          <option value="PERCENTAGE" dir={langDir} translate="no">
                            {t("percentage").toUpperCase()}
                          </option>
                        </select>
                      )}
                    />
                  </>
                ) : null}
              </div>
            </div>
          ) : null}

          {watchSellType === "EVERYONE" || watchSellType === "BUYGROUP" ? (
            <div className="flex items-center justify-start gap-[10px] py-2">
              {/* <div className="select_type_checkbox"> */}
              <Controller
                name="isMinQuantityRequired"
                control={formContext.control}
                render={({ field }) => (
                  <input
                    type="checkbox"
                    className="h-[30px] w-[30px]"
                    checked={!!field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              {/* </div> */}
              <div
                className="flex w-[calc(100%-40px)] flex-wrap items-center justify-between border-[1px] border-[#ccc] border-[solid] p-2"
                dir={langDir}
              >
                <Label translate="no">{t("min_quantity")}</Label>
                <CounterTextInputField
                  name="minQuantity"
                  placeholder={t("min")}
                />
              </div>
            </div>
          ) : null}

          {watchSellType === "EVERYONE" || watchSellType === "BUYGROUP" ? (
            <div className="flex items-center justify-start gap-[10px] py-2">
              <Controller
                name="isMaxQuantityRequired"
                control={formContext.control}
                render={({ field }) => (
                  <input
                    type="checkbox"
                    className="h-[30px] w-[30px]"
                    checked={!!field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              <div
                className="flex w-[calc(100%-40px)] flex-wrap items-center justify-between border-[1px] border-[#ccc] border-[solid] p-2"
                dir={langDir}
              >
                <Label translate="no">{t("max_quantity")}</Label>
                <CounterTextInputField
                  name="maxQuantity"
                  placeholder={t("max")}
                />
              </div>
            </div>
          ) : null}

          {watchSellType === "EVERYONE" || watchSellType === "BUYGROUP" ? (
            <div className="flex items-center justify-start gap-[10px] py-2">
              <Controller
                name="isMinCustomerRequired"
                control={formContext.control}
                render={({ field }) => (
                  <input
                    type="checkbox"
                    className="h-[30px] w-[30px]"
                    checked={!!field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              <div
                className="flex w-[calc(100%-40px)] flex-wrap flex-wrap items-center justify-between border-[1px] border-[#ccc] border-[solid] p-2"
                dir={langDir}
              >
                <Label translate="no">{t("min_customer")}</Label>
                <div className="flex w-full gap-2 space-y-2">
                  <CounterTextInputField
                    name="minCustomer"
                    placeholder={t("min")}
                  />
                </div>
              </div>
            </div>
          ) : null}

          {watchSellType === "EVERYONE" || watchSellType === "BUYGROUP" ? (
            <div className="flex items-center justify-start gap-[10px] py-2">
              <Controller
                name="isMaxCustomerRequired"
                control={formContext.control}
                render={({ field }) => (
                  <input
                    type="checkbox"
                    className="h-[30px] w-[30px]"
                    checked={!!field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              <div
                className="flex w-[calc(100%-40px)] flex-wrap items-center justify-between border-[1px] border-[#ccc] border-[solid] p-2"
                dir={langDir}
              >
                <Label translate="no">{t("max_customer")}</Label>
                <div className="flex w-full gap-2 space-y-2">
                  <CounterTextInputField
                    name="maxCustomer"
                    placeholder={t("max")}
                  />
                </div>
              </div>
            </div>
          ) : null}

          {watchSellType === "EVERYONE" ||
          watchSellType === "NORMALSELL" ||
          watchSellType === "BUYGROUP" ? (
            <div className="flex items-center justify-start gap-[10px] py-2">
              <Controller
                name="isMinQuantityPerCustomerRequired"
                control={formContext.control}
                render={({ field }) => (
                  <input
                    type="checkbox"
                    className="h-[30px] w-[30px]"
                    checked={!!field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              <div
                className="flex w-[calc(100%-40px)] flex-wrap items-center justify-between border-[1px] border-[#ccc] border-[solid] p-2"
                dir={langDir}
              >
                <Label translate="no">{t("min_quantity_per_customer")}</Label>
                <div className="flex w-full gap-2 space-y-2">
                  <CounterTextInputField
                    name="minQuantityPerCustomer"
                    placeholder={t("min")}
                  />
                </div>
              </div>
            </div>
          ) : null}

          {watchSellType === "EVERYONE" ||
          watchSellType === "NORMALSELL" ||
          watchSellType === "BUYGROUP" ? (
            <div className="flex items-center justify-start gap-[10px] py-2">
              <Controller
                name="isMaxQuantityPerCustomerRequired"
                control={formContext.control}
                render={({ field }) => (
                  <input
                    type="checkbox"
                    className="h-[30px] w-[30px]"
                    checked={!!field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              <div
                className="flex w-[calc(100%-40px)] flex-wrap items-center justify-between border-[1px] border-[#ccc] border-[solid] p-2"
                dir={langDir}
              >
                <Label translate="no">{t("max_quantity_per_customer")}</Label>
                <div className="flex w-full gap-2 space-y-2">
                  <CounterTextInputField
                    name="maxQuantityPerCustomer"
                    placeholder={t("max")}
                  />
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="mt-4">
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary!"
            translate="no"
          >
            {isLoading ? (
              <LoaderWithMessage message={t("please_wait")} />
            ) : (
              t("update")
            )}
          </Button>
        </div>
      </div>
    </aside>
  );
};

export default ManageProductAside;