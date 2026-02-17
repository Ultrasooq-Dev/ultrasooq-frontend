import React, { useEffect, useMemo, useState } from "react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import ReactSelect from "react-select";
import { Label } from "@/components/ui/label";
import CounterTextInputField from "./CounterTextInputField";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { CONSUMER_TYPE_LIST, SELL_TYPE_LIST } from "@/utils/constants";
import { cn } from "@/lib/utils";
import ControlledDatePicker from "@/components/shared/Forms/ControlledDatePicker";
import ControlledTimePicker from "@/components/shared/Forms/ControlledTimePicker";
import { format } from "date-fns";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { useSearchParams } from "next/navigation";

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

type PriceSectionProps = {
  activeProductType?: string;
};

const PriceSection: React.FC<PriceSectionProps> = ({ activeProductType }) => {
  const t = useTranslations();
  const { langDir, currency } = useAuth();
  const formContext = useFormContext();
  const searchParams = useSearchParams();

  const watchSetUpPrice = formContext.watch("setUpPrice");
  const watchIsOfferPriceRequired = formContext.watch("isOfferPriceRequired");
  const watchIsStockRequired = formContext.watch("isStockRequired");

  const watchDateOpen = formContext.watch("productPriceList.[0].dateOpen"); // Watch the Time Open value

  const watchConsumerType = formContext.watch(
    "productPriceList.[0].consumerType",
  );
  const watchSellType = formContext.watch("productPriceList.[0].sellType");
  const watchConsumerDiscount = formContext.watch(
    "productPriceList.[0].consumerDiscount",
  );
  const watchVendorDiscount = formContext.watch(
    "productPriceList.[0].vendorDiscount",
  );

  const errors = formContext.formState.errors;

  const consumerTypeMessage =
    errors && typeof errors["0"] === "object" && "consumerType" in errors["0"]
      ? errors["0"].consumerType?.message
      : undefined;

  const sellTypeMessage =
    errors && typeof errors["0"] === "object" && "sellType" in errors["0"]
      ? errors["0"].sellType?.message
      : undefined;

  const minCustomerMessage =
    errors && typeof errors["0"] === "object" && "minCustomer" in errors["0"]
      ? errors["0"].minCustomer?.message
      : undefined;

  const maxCustomerMessage =
    errors && typeof errors["0"] === "object" && "maxCustomer" in errors["0"]
      ? errors["0"].maxCustomer?.message
      : undefined;

  const minQuantityPerCustomerMessage =
    errors &&
    typeof errors["0"] === "object" &&
    "minQuantityPerCustomer" in errors["0"]
      ? errors["0"].minQuantityPerCustomer?.message
      : undefined;

  const maxQuantityPerCustomerMessage =
    errors &&
    typeof errors["0"] === "object" &&
    "maxQuantityPerCustomer" in errors["0"]
      ? errors["0"].maxQuantityPerCustomer?.message
      : undefined;

  const minQuantityMessage =
    errors && typeof errors["0"] === "object" && "minQuantity" in errors["0"]
      ? errors["0"].minQuantity?.message
      : undefined;

  const maxQuantityMessage =
    errors && typeof errors["0"] === "object" && "maxQuantity" in errors["0"]
      ? errors["0"].maxQuantity?.message
      : undefined;

  const timeOpenMessage =
    errors && typeof errors["0"] === "object" && "timeOpen" in errors["0"]
      ? errors["0"].timeOpen?.message
      : undefined;

  const timeCloseMessage =
    errors && typeof errors["0"] === "object" && "timeClose" in errors["0"]
      ? errors["0"].timeClose?.message
      : undefined;

  const deliveryAfterMessage =
    errors && typeof errors["0"] === "object" && "deliveryAfter" in errors["0"]
      ? errors["0"].deliveryAfter?.message
      : undefined;

  const vendorDiscountMessage =
    errors && typeof errors["0"] === "object" && "vendorDiscount" in errors["0"]
      ? errors["0"].vendorDiscount?.message
      : undefined;

  const consumerDiscountMessage =
    errors && typeof errors["0"] === "object" && "consumerDiscount" in errors["0"]
      ? errors["0"].consumerDiscount?.message
      : undefined;

  const { setValue } = formContext;

  useEffect(() => {
    if (watchSellType === "BUYGROUP") {
      setValue("isCustomProduct", false);
      setValue("isOfferPriceRequired", false);
      setValue("isStockRequired", false);
    }
    
    // No auto-set behavior - user can choose any consumer type
  }, [watchSellType, setValue]);

  const [localTime, setLocalTime] = useState<string>("");

  // Set the local time on component mount
  useEffect(() => {
    const currentLocalTime = format(new Date(), "MMMM dd, yyyy hh:mm a"); // Desired format
    setLocalTime(currentLocalTime); // Update local time state
  }, []);

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

  return (
    <div className="space-y-8">
      {/* Price Section Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
          <span className="text-orange-600 text-sm font-semibold">6</span>
        </div>
        <div>
          <h4 className="text-lg font-semibold text-gray-900">
            {t("price")}
          </h4>
          <p className="text-sm text-gray-600">
            {t("price_section_description")}
          </p>
        </div>
      </div>
      {activeProductType !== "R" ? (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <FormField
            control={formContext.control}
            name="setUpPrice"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="border-2 border-gray-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-sm font-medium text-gray-700" dir={langDir} translate="no">
                    {t("set_up_price")}
                  </FormLabel>
                </div>
              </FormItem>
            )}
          />
        </div>
      ) : null}

      {watchSetUpPrice ? (
        <>
          {activeProductType !== "R" ? (
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
              <h5 className="text-md font-semibold text-gray-900">{t("pricing_options")}</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700 flex items-center gap-2" dir={langDir} translate="no">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {t("consumer_type")}
                  </Label>
                  <Controller
                    name="productPriceList.[0].consumerType"
                    control={formContext.control}
                    render={({ field }) => (
                      <ReactSelect
                        {...field}
                        onChange={(newValue) => {
                          field.onChange(newValue?.value);
                        }}
                        options={consumerTypes()}
                        value={consumerTypes().find(
                          (item: Option) => item.value === field.value,
                        )}
                        styles={{
                          control: (base: any) => ({
                            ...base,
                            height: 48,
                            minHeight: 48,
                            borderRadius: '0.75rem',
                            borderColor: '#d1d5db',
                            boxShadow: 'none',
                            '&:hover': {
                              borderColor: '#f97316',
                            },
                            '&:focus-within': {
                              borderColor: '#f97316',
                              boxShadow: '0 0 0 2px rgba(249, 115, 22, 0.2)',
                            },
                          }),
                          menu: (base: any) => ({
                            ...base,
                            zIndex: 20,
                            borderRadius: '0.75rem',
                          }),
                          option: (base: any, state: any) => ({
                            ...base,
                            backgroundColor: state.isSelected ? '#f97316' : state.isFocused ? '#fed7aa' : 'white',
                            color: state.isSelected ? 'white' : '#374151',
                          }),
                        }}
                        instanceId="productPriceList.[0].consumerType"
                        placeholder={t("select")}
                      />
                    )}
                  />
                  {!watchConsumerType && consumerTypeMessage ? (
                    <p className="text-sm text-red-500 flex items-center gap-1" dir={langDir}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {consumerTypeMessage.toString()}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700 flex items-center gap-2" dir={langDir} translate="no">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    {t("sell_type")}
                  </Label>
                  <Controller
                    name="productPriceList.[0].sellType"
                    control={formContext.control}
                    render={({ field }) => (
                      <ReactSelect
                        {...field}
                        onChange={(newValue) => {
                          field.onChange(newValue?.value);
                        }}
                        options={sellTypes()}
                        value={sellTypes().find(
                          (item: Option) => item.value === field.value,
                        )}
                        styles={{
                          control: (base: any) => ({
                            ...base,
                            height: 48,
                            minHeight: 48,
                            borderRadius: '0.75rem',
                            borderColor: '#d1d5db',
                            boxShadow: 'none',
                            '&:hover': {
                              borderColor: '#f97316',
                            },
                            '&:focus-within': {
                              borderColor: '#f97316',
                              boxShadow: '0 0 0 2px rgba(249, 115, 22, 0.2)',
                            },
                          }),
                          menu: (base: any) => ({
                            ...base,
                            zIndex: 20,
                            borderRadius: '0.75rem',
                          }),
                          option: (base: any, state: any) => ({
                            ...base,
                            backgroundColor: state.isSelected ? '#f97316' : state.isFocused ? '#fed7aa' : 'white',
                            color: state.isSelected ? 'white' : '#374151',
                          }),
                        }}
                        instanceId="productPriceList.[0].sellType"
                        placeholder={t("sell_type")}
                      />
                    )}
                  />

                  {!watchSellType && sellTypeMessage ? (
                    <p className="text-sm text-red-500 flex items-center gap-1" dir={langDir}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {sellTypeMessage.toString()}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          {/* Discount Settings - Only show when consumer type and sell type are selected */}
          {watchConsumerType && watchSellType && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
              <h5 className="text-md font-semibold text-gray-900">{t("discount_settings")}</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {watchConsumerType === "EVERYONE" ||
                watchConsumerType === "CONSUMER" ? (
                <>
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-gray-700 flex items-center gap-2" dir={langDir} translate="no">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      {t("consumer_discount")}
                    </Label>
                    <CounterTextInputField
                      label={t("consumer_discount")}
                      name="productPriceList.[0].consumerDiscount"
                      placeholder={t("discount")}
                    />
                  </div>
                  {watchConsumerDiscount > 0 ? (
                    <div className="space-y-3">
                      <Label className="text-sm font-medium text-gray-700 flex items-center gap-2" dir={langDir} translate="no">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                        {t("discount_type")}
                      </Label>
                      <Controller
                        name="productPriceList.[0].consumerDiscountType"
                        control={formContext.control}
                        render={({ field }) => (
                          <select
                            {...field}
                            className="w-full h-12 px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 appearance-none cursor-pointer"
                          >
                            <option value="" dir={langDir}></option>
                            <option value="FLAT" dir={langDir}>
                              {t("flat").toUpperCase()}
                            </option>
                            <option value="PERCENTAGE" dir={langDir}>
                              {t("percentage").toUpperCase()}
                            </option>
                          </select>
                        )}
                      />
                    </div>
                  ) : null}
                </>
              ) : null}

              {watchConsumerType === "EVERYONE" ||
              watchConsumerType === "VENDORS" ? (
                <>
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-gray-700 flex items-center gap-2" dir={langDir} translate="no">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      {t("vendor_discount")}
                    </Label>
                    <CounterTextInputField
                      label={t("vendor_discount")}
                      name="productPriceList.[0].vendorDiscount"
                      placeholder={t("discount")}
                    />
                  </div>
                  {watchVendorDiscount > 0 ? (
                    <div className="space-y-3">
                      <Label className="text-sm font-medium text-gray-700 flex items-center gap-2" dir={langDir} translate="no">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                        {t("discount_type")}
                      </Label>
                      <Controller
                        name="productPriceList.[0].vendorDiscountType"
                        control={formContext.control}
                        render={({ field }) => (
                          <select
                            {...field}
                            className="w-full h-12 px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 appearance-none cursor-pointer"
                          >
                            <option value="" dir={langDir}></option>
                            <option value="FLAT" dir={langDir} translate="no">
                              {t("flat").toUpperCase()}
                            </option>
                            <option
                              value="PERCENTAGE"
                              dir={langDir}
                              translate="no"
                            >
                              {t("percentage").toUpperCase()}
                            </option>
                          </select>
                        )}
                      />
                    </div>
                  ) : null}
                </>
              ) : null}
              </div>
            </div>
          )}

            {watchSellType === "BUYGROUP" ? (
              <>
                <div className="mb-4 w-full">
                  <label dir={langDir} translate="no">
                    {t("add_time")}
                  </label>
                  <Input
                    value={localTime} // Show the local time
                    readOnly // Make it read-only
                    className="theme-form-control-s1"
                    dir={langDir}
                  />
                </div>

                <CounterTextInputField
                  label={t("min_customer")}
                  name="productPriceList.[0].minCustomer"
                  placeholder={t("min")}
                  errorMessage={
                    minCustomerMessage
                      ? minCustomerMessage.toString()
                      : undefined
                  }
                />

                <CounterTextInputField
                  label={t("max_customer")}
                  name="productPriceList.[0].maxCustomer"
                  placeholder={t("max")}
                  errorMessage={
                    maxCustomerMessage
                      ? maxCustomerMessage.toString()
                      : undefined
                  }
                />
              </>
            ) : null}

            {watchSellType === "BUYGROUP" ? (
              <>
                <CounterTextInputField
                  label={t("min_quantity")}
                  name="productPriceList.[0].minQuantity"
                  placeholder={t("min")}
                  errorMessage={
                    minQuantityMessage
                      ? minQuantityMessage.toString()
                      : undefined
                  }
                />

                <CounterTextInputField
                  label={t("max_quantity")}
                  name="productPriceList.[0].maxQuantity"
                  placeholder={t("max")}
                  errorMessage={
                    maxQuantityMessage
                      ? maxQuantityMessage.toString()
                      : undefined
                  }
                />
              </>
            ) : null}

            {/* Trial Product Fields - Show for TRIAL_PRODUCT sell type with any consumer type */}
            {watchSellType === "TRIAL_PRODUCT" ? (
              <>
                <CounterTextInputField
                  label={t("max_quantity_per_customer")}
                  name="productPriceList.[0].maxQuantityPerCustomer"
                  placeholder={t("max")}
                  errorMessage={
                    maxQuantityPerCustomerMessage
                      ? maxQuantityPerCustomerMessage.toString()
                      : undefined
                  }
                />
              </>
            ) : null}


            {/* Min/Max Quantity Per Customer - Show for NORMALSELL, BUYGROUP, or WHOLESALE_PRODUCT sell types */}
            {watchSellType === "NORMALSELL" || watchSellType === "BUYGROUP" || watchSellType === "WHOLESALE_PRODUCT" ? (
              <>
                <CounterTextInputField
                  label={t("min_quantity_per_customer")}
                  name="productPriceList.[0].minQuantityPerCustomer"
                  placeholder={t("min")}
                  errorMessage={
                    minQuantityPerCustomerMessage
                      ? minQuantityPerCustomerMessage.toString()
                      : undefined
                  }
                />

                <CounterTextInputField
                  label={t("max_quantity_per_customer")}
                  name="productPriceList.[0].maxQuantityPerCustomer"
                  placeholder={t("max")}
                  errorMessage={
                    maxQuantityPerCustomerMessage
                      ? maxQuantityPerCustomerMessage.toString()
                      : undefined
                  }
                />
              </>
            ) : null}

            {/* Date and Time Section - Only show when consumer type and sell type are selected */}
            {watchConsumerType && watchSellType && (
              <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
                <h5 className="text-md font-semibold text-gray-900">{t("availability_period")}</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700 flex items-center gap-2" dir={langDir} translate="no">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {t("date_open")}
                  </Label>
                  <ControlledDatePicker
                    label={t("date_open")}
                    name="productPriceList.[0].dateOpen"
                    isFuture
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700 flex items-center gap-2" dir={langDir} translate="no">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {t("time_open")}
                  </Label>
                  <ControlledTimePicker
                    label={t("time_open")}
                    name="productPriceList.[0].startTime"
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700 flex items-center gap-2" dir={langDir} translate="no">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {t("date_close")}
                  </Label>
                  <ControlledDatePicker
                    label={t("date_close")}
                    name="productPriceList.[0].dateClose"
                    isFuture
                    minDate={watchDateOpen} // Pass timeOpen as minDate to disable past dates
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700 flex items-center gap-2" dir={langDir} translate="no">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {t("time_close")}
                  </Label>
                  <ControlledTimePicker
                    label={t("time_close")}
                    name="productPriceList.[0].endTime"
                  />
                </div>
              </div>
            </div>
            )}

          {activeProductType !== "R" ? (
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
              <h5 className="text-md font-semibold text-gray-900">{t("delivery_settings")}</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700 flex items-center gap-2" dir={langDir} translate="no">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    {t("deliver_after")}
                  </Label>
                  <CounterTextInputField
                    label={t("deliver_after")}
                    name="productPriceList.[0].deliveryAfter"
                    placeholder={t("after")}
                    errorMessage={
                      deliveryAfterMessage
                        ? deliveryAfterMessage.toString()
                        : undefined
                    }
                  />
                </div>
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
};

export default PriceSection;



