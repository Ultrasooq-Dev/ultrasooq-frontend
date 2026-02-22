import React, { useEffect, useMemo, useState } from "react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import ReactSelect, { MultiValue } from "react-select";
import { Label } from "@/components/ui/label";
import CounterTextInputField from "./CounterTextInputField";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { CONSUMER_TYPE_LIST, SELL_TYPE_LIST } from "@/utils/constants";
import {
  IAllCountries,
  ICity,
  ICountries,
  ILocations,
  IOption,
  IState,
} from "@/utils/types/common.types";
import {
  useCountries,
  useLocation,
  useAllCountries,
  useFetchStatesByCountry,
  useFetchCitiesByState,
} from "@/apis/queries/masters.queries";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import ControlledDatePicker from "@/components/shared/Forms/ControlledDatePicker";
import ControlledTimePicker from "@/components/shared/Forms/ControlledTimePicker";
import ControlledTextInput from "@/components/shared/Forms/ControlledTextInput";
import { format } from "date-fns";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";

interface Option {
  readonly label: string;
  readonly value: string;
}

interface OptionType {
  label: string;
  value: string | number;
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

  const countriesQuery = useCountries();
  const locationsQuery = useLocation();
  const countriesNewQuery = useAllCountries();

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
  // TODO: validation remove when user types
  // const watchMinCustomer = formContext.watch(
  //   "productPriceList.[0].minCustomer",
  // );
  // const watchMaxCustomer = formContext.watch(
  //   "productPriceList.[0].maxCustomer",
  // );
  // const watchMinQuantityPerCustomer = formContext.watch(
  //   "productPriceList.[0].minQuantityPerCustomer",
  // );
  // const watchMaxQuantityPerCustomer = formContext.watch(
  //   "productPriceList.[0].maxQuantityPerCustomer",
  // );
  // const watchMinQuantity = formContext.watch(
  //   "productPriceList.[0].minQuantity",
  // );
  // const watchMaxQuantity = formContext.watch(
  //   "productPriceList.[0].maxQuantity",
  // );
  // const watchTimeOpen = formContext.watch("productPriceList.[0].timeOpen");
  // const watchTimeClose = formContext.watch("productPriceList.[0].timeClose");
  // const watchDeliveryAfter = formContext.watch(
  //   "productPriceList.[0].deliveryAfter",
  // );

  const [selectedCountry, setSelectedCountry] = useState<any | null>(null);
  const [selectedState, setSelectedState] = useState<any | null>(null);
  const [states, setStates] = useState<IOption[]>([]);
  const [cities, setCities] = useState<IOption[]>([]);
  const fetchStatesByCountry = useFetchStatesByCountry();
  const fetchCitiesByState = useFetchCitiesByState();

  // For multiple selction country, state, city
  const [selectedCountries, setSelectedCountries] = useState<OptionType[]>([]);
  const [statesByCountry, setStatesByCountry] = useState<
    Record<string, OptionType[]>
  >({});
  const [citiesByState, setCitiesByState] = useState<
    Record<string, OptionType[]>
  >({});

  const [selectedStates, setSelectedStates] = useState<OptionType[]>([]);
  const [selectedCities, setSelectedCities] = useState<OptionType[]>([]);

  const memoizedCountries = useMemo(() => {
    return (
      countriesQuery?.data?.data.map((item: ICountries) => {
        return { label: item.countryName, value: item.id };
      }) || []
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countriesQuery?.data?.data?.length]);

  const memoizedLocations = useMemo(() => {
    return (
      locationsQuery?.data?.data.map((item: ILocations) => {
        return { label: item.locationName, value: item.id };
      }) || []
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationsQuery?.data?.data?.length]);

  const memoizedAllCountries = useMemo(() => {
    return (
      countriesNewQuery?.data?.data.map((item: IAllCountries) => {
        return { label: item.name, value: item.id };
      }) || []
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countriesNewQuery?.data?.data?.length]);

  // Fetch States When Country is Selected

  useEffect(() => {
    if (selectedCountry) {
      fetchStates(selectedCountry);
    } else {
      setStates([]);
      setSelectedState(null);
    }
  }, [selectedCountry]);

  const fetchStates = async (countryId: number) => {
    try {
      const response = await fetchStatesByCountry.mutateAsync({ countryId }); // Call your API
      setStates(
        response.data.map((state: IState) => ({
          label: state.name,
          value: state.id,
        })),
      );
    } catch (error) {
    }
  };

  // Fetch Cities When State is Selected

  useEffect(() => {
    if (selectedState) {
      fetchCities(selectedState);
    } else {
      setCities([]);
    }
  }, [selectedState]);

  useEffect(() => {
    let ipInfo = JSON.parse(window.localStorage.ipInfo ?? "{}");
    if (ipInfo.country_name) {
      let country = countriesQuery?.data?.data?.find((item: any) => item.countryName.toLowerCase() == ipInfo.country_name.toLowerCase());
      formContext.setValue('placeOfOriginId', country?.id);
    }
  }, [countriesQuery?.data?.data]);

  useEffect(() => {
    let ipInfo = JSON.parse(window.localStorage.ipInfo ?? "{}");
    if (ipInfo.country_name) {
      let country = countriesNewQuery?.data?.data?.find((item: any) => item.name.toLowerCase() == ipInfo.country_name.toLowerCase());
      if (activeProductType != "R") {
        formContext.setValue('productCountryId', country?.id);
        setSelectedCountry(country?.id);
      }
      if (country?.id) {
        formContext.setValue('sellCountryIds', [{
          label: country.name,
          value: country.id
        }]);
        setSelectedCountries([{
          label: country.name,
          value: country.id
        }]);
      };
    }
  }, [countriesNewQuery?.data?.data]);

  const fetchCities = async (stateId: number) => {
    try {
      const response = await fetchCitiesByState.mutateAsync({ stateId }); // ✅ Pass as an object
      setCities(
        response.data.map((city: ICity) => ({
          label: city.name,
          value: city.id,
        })),
      );
    } catch (error) {
    }
  };

  // {/* For latitude and longitude */}

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const latLng = `${latitude}, ${longitude}`;

          setValue("productLatLng", latLng);
        },
        (error) => {
        },
      );
    } else {
    }
  }); // ✅ Add setValue as dependency

  // Whenever selectedCountries change, fetch states for all selected countries.

  useEffect(() => {
    if (selectedCountries.length > 0) {
      const fetchStates = async () => {
        const statesData: Record<string, OptionType[]> = {};

        try {
          const responses = await Promise.all(
            selectedCountries.map(async (country) => {
              const response = await fetchStatesByCountry.mutateAsync({
                countryId: Number(country.value),
              });
              return { countryId: country.value, data: response.data };
            }),
          );

          responses.forEach(({ countryId, data }) => {
            statesData[countryId] = data.map((state: any) => ({
              label: state.name,
              value: state.id,
            }));
          });

          setStatesByCountry(statesData);
        } catch (error) {
        }
      };

      fetchStates();
    }
  }, [selectedCountries]);

  // Fetch Cities When States Change

  useEffect(() => {
    if (selectedStates.length > 0) {
      const fetchCities = async () => {
        const citiesData: Record<string, OptionType[]> = {};

        try {
          const responses = await Promise.all(
            selectedStates.map(async (state) => {
              const response = await fetchCitiesByState.mutateAsync({
                stateId: Number(state.value),
              });
              return { stateId: state.value, data: response.data };
            }),
          );

          responses.forEach(({ stateId, data }) => {
            citiesData[stateId] = data.map((city: any) => ({
              label: city.name,
              value: city.id,
            }));
          });

          setCitiesByState(citiesData);
        } catch (error) {
        }
      };

      fetchCities();
    }
  }, [selectedStates]);

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

  const { setValue } = formContext;

  useEffect(() => {
    if (watchSellType === "BUYGROUP") {
      setValue("isCustomProduct", false);
      setValue("isOfferPriceRequired", false);
      setValue("isStockRequired", false);
    }
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
        value: SELL_TYPE_LIST[index].value
      };
    });
  };

  const consumerTypes = () => {
    return Object.keys(CONSUMER_TYPE_LIST).map((value: string, index: number) => {
      return {
        label: t(CONSUMER_TYPE_LIST[index].label),
        value: CONSUMER_TYPE_LIST[index].value
      };
    });
  };

  return (
    <div className="form-groups-common-sec-s1">
      <h3 className={cn(activeProductType === "R" ? "mb-0!" : "")} dir={langDir} translate="no">
        {t("price")}
      </h3>
      {activeProductType !== "R" ? (
        <div className="mb-4 flex w-full flex-row items-center gap-x-5">
          <div className="text-with-checkagree">
            <FormField
              control={formContext.control}
              name="setUpPrice"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border bg-card p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="border border-solid border-border data-[state=checked]:bg-dark-orange!"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel dir={langDir} translate="no">{t("set_up_price")}</FormLabel>
                  </div>
                </FormItem>
              )}
            />
          </div>
        </div>
      ) : null}

      {watchSetUpPrice ? (
        <>
          {activeProductType !== "R" ? (
            <div className="mb-4 grid w-full grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-2">
              <div className="mt-2 flex flex-col gap-y-3">
                <Label dir={langDir} translate="no">{t("consumer_type")}</Label>
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
                      styles={customStyles}
                      instanceId="productPriceList.[0].consumerType"
                      placeholder={t("select")}
                    />
                  )}
                />
                {!watchConsumerType && consumerTypeMessage ? (
                  <p className="text-[13px] text-destructive" dir={langDir}>
                    {consumerTypeMessage.toString()}
                  </p>
                ) : null}
              </div>

              <div className="mt-2 flex flex-col gap-y-3">
                <Label dir={langDir} translate="no">{t("sell_type")}</Label>
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
                      styles={customStyles}
                      instanceId="productPriceList.[0].sellType"
                      placeholder={t("sell_type")}
                    />
                  )}
                />

                {!watchSellType && sellTypeMessage ? (
                  <p className="text-[13px] text-destructive" dir={langDir}>
                    {sellTypeMessage.toString()}
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="mb-4 grid w-full grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-4">
            <div className="col-span-2 grid w-full grid-cols-2 gap-x-5 gap-y-4">
              {watchConsumerType === "EVERYONE" ||
                watchConsumerType === "CONSUMER" ? (
                <>
                  <CounterTextInputField
                    label={t("consumer_discount")}
                    name="productPriceList.[0].consumerDiscount"
                    placeholder={t("discount")}
                  />
                  {watchConsumerDiscount > 0 ? (
                    <div className="flex w-full flex-col gap-y-2">
                      <Label dir={langDir} translate="no">{t("discount_type")}</Label>
                      <Controller
                        name="productPriceList.[0].consumerDiscountType"
                        control={formContext.control}
                        render={({ field }) => (
                          <select
                            {...field}
                            className="h-[48px]! w-full rounded border border-border! px-3 text-sm focus-visible:ring-0!"
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
                    </div>
                  ) : null}
                </>
              ) : null}

              {watchConsumerType === "EVERYONE" ||
                watchConsumerType === "VENDORS" ? (
                <>
                  <CounterTextInputField
                    label={t("vendor_discount")}
                    name="productPriceList.[0].vendorDiscount"
                    placeholder={t("discount")}
                  />
                  {watchVendorDiscount > 0 ? (
                    <div className="flex w-full flex-col gap-y-2">
                      <Label dir={langDir} translate="no">{t("discount_type")}</Label>
                      <Controller
                        name="productPriceList.[0].vendorDiscountType"
                        control={formContext.control}
                        render={({ field }) => (
                          <select
                            {...field}
                            className="h-[48px]! w-full rounded border border-border! px-3 text-sm focus-visible:ring-0!"
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
                    </div>
                  ) : null}
                </>
              ) : null}
            </div>

            {watchSellType === "BUYGROUP" ? (
              <>
                <div className="mb-4 w-full">
                  <label dir={langDir} translate="no">{t("add_time")}</label>
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

            {watchSellType === "NORMALSELL" || watchSellType === "BUYGROUP" ? (
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

            {watchSellType === "BUYGROUP" ? (
              <>
                {/* <CounterTextInputField
                  label="Time Open"
                  name="productPriceList.[0].timeOpen"
                  placeholder="Open"
                  errorMessage={
                    timeOpenMessage ? timeOpenMessage.toString() : undefined
                  }
                /> */}

                <ControlledDatePicker
                  label={t("date_open")}
                  name="productPriceList.[0].dateOpen"
                  isFuture
                />

                <ControlledTimePicker
                  label={t("time_open")}
                  name="productPriceList.[0].startTime"
                />

                <ControlledDatePicker
                  label={t("date_close")}
                  name="productPriceList.[0].dateClose"
                  isFuture
                  minDate={watchDateOpen} // Pass timeOpen as minDate to disable past dates
                />

                <ControlledTimePicker
                  label={t("time_close")}
                  name="productPriceList.[0].endTime"
                />

                {/* <CounterTextInputField
                  label="Time Close"
                  name="productPriceList.[0].timeClose"
                  placeholder="Close"
                  errorMessage={
                    timeCloseMessage ? timeCloseMessage.toString() : undefined
                  }
                /> */}
              </>
            ) : null}
          </div>

          {activeProductType !== "R" ? (
            <div className="mb-4 grid w-full grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-2">
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
          ) : null}
          <div className="mb-6">
            <label className="block text-sm font-medium text-muted-foreground mb-2" translate="no">
              {t("confirm_order_type")}
            </label>
            <div className="flex items-center space-x-6">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="auto"
                  name="orderType"
                  value="auto"
                  className="h-4 w-4 text-primary focus:ring-primary border-border"
                />
                <label htmlFor="auto" className="ml-2 text-sm text-muted-foreground" translate="no">
                  {t("auto_confirm")}
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="manual"
                  name="orderType"
                  value="manual"
                  className="h-4 w-4 text-primary focus:ring-primary border-border"
                />
                <label htmlFor="manual" className="ml-2 text-sm text-muted-foreground" translate="no">
                  {t("manual")}
                </label>
              </div>
            </div>
          </div>

          {activeProductType !== "R" &&
            watchSetUpPrice &&
            watchSellType !== "BUYGROUP" ? (
            <div className="mb-4 flex w-full flex-col items-start gap-5 md:flex-row md:items-center">
              <>
                <div className="flex flex-row items-center gap-x-3">
                  <Controller
                    name="isCustomProduct"
                    control={formContext.control}
                    render={({ field }) => (
                      <Switch
                        checked={!!field.value}
                        onCheckedChange={field.onChange}
                        className="data-[state=checked]:bg-dark-orange!"
                      />
                    )}
                  />
                  <Label dir={langDir} translate="no">{t("customize_product")}</Label>
                </div>

                <div className="flex flex-row items-center gap-x-3">
                  <Controller
                    name="isOfferPriceRequired"
                    control={formContext.control}
                    render={({ field }) => (
                      <Switch
                        checked={!!field.value}
                        onCheckedChange={field.onChange}
                        className="data-[state=checked]:bg-dark-orange!"
                      />
                    )}
                  />
                  <Label dir={langDir} translate="no">{t("ask_for_the_price")}</Label>
                </div>

                <div className="flex flex-row items-center gap-x-3">
                  <Controller
                    name="isStockRequired"
                    control={formContext.control}
                    render={({ field }) => (
                      <Switch
                        checked={!!field.value}
                        onCheckedChange={field.onChange}
                        className="data-[state=checked]:bg-dark-orange!"
                      />
                    )}
                  />
                  <Label dir={langDir} translate="no">{t("ask_for_the_stock")}</Label>
                </div>
              </>
            </div>
          ) : null}

          <div className="mb-4 grid w-full grid-cols-1 gap-x-5 md:grid-cols-2">
            {activeProductType !== "R" && !watchIsOfferPriceRequired ? (
              <FormField
                control={formContext.control}
                name="productPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel dir={langDir} translate="no">{t("service_price")}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <div className="absolute left-2 top-[6px] flex h-[34px] w-[32px] items-center justify-center bg-[#F6F6F6]!">
                          {currency.symbol}
                        </div>
                        <Input
                          type="number"
                          onWheel={(e) => e.currentTarget.blur()}
                          placeholder={t("service_price")}
                          className="h-[48px]! rounded border-border pl-12 pr-10 focus-visible:ring-0!"
                          disabled={watchIsOfferPriceRequired}
                          {...field}
                          dir={langDir}
                          translate="no"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}
            {activeProductType === "R" && !watchIsOfferPriceRequired ? (
              <FormField
                control={formContext.control}
                name="offerPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel dir={langDir} translate="no">{t("offer_price")}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <div className="absolute left-2 top-[6px] flex h-[34px] w-[32px] items-center justify-center bg-[#F6F6F6]!">
                          {currency.symbol}
                        </div>
                        <Input
                          type="number"
                          onWheel={(e) => e.currentTarget.blur()}
                          placeholder={t("offer_price")}
                          className="h-[48px]! rounded border-border pl-12 pr-10 focus-visible:ring-0!"
                          disabled={watchIsOfferPriceRequired}
                          {...field}
                          dir={langDir}
                          translate="no"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}

            {activeProductType !== "R" && !watchIsStockRequired ? (
              <FormField
                control={formContext.control}
                name="productPriceList.[0].stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel dir={langDir} translate="no">{t("stock")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        onWheel={(e) => e.currentTarget.blur()}
                        placeholder={t("stock")}
                        className="h-[48px]! rounded border-border focus-visible:ring-0!"
                        disabled={watchIsStockRequired}
                        {...field}
                        dir={langDir}
                        translate="no"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}
          </div>
        </>
      ) : null}

      <div className="mb-3 grid w-full grid-cols-1 gap-x-5 md:grid-cols-2">
        {activeProductType !== "R" ? (
          // <div className="mt-2 flex flex-col gap-y-3">
          //   <Label>Product Location</Label>
          //   <Controller
          //     name="productLocationId"
          //     control={formContext.control}
          //     render={({ field }) => (
          //       <ReactSelect
          //         {...field}
          //         onChange={(newValue) => {
          //           field.onChange(newValue?.value);
          //         }}
          //         options={memoizedLocations}
          //         value={memoizedLocations.find(
          //           (item: IOption) => item.value === field.value,
          //         )}
          //         styles={customStyles}
          //         instanceId="productLocationId"
          //       />
          //     )}
          //   />

          //   <p className="text-[13px] text-destructive" dir={langDir}>
          //     {
          //       formContext.formState.errors["productLocationId"]
          //         ?.message as string
          //     }
          //   </p>
          // </div>
          <>
            <div className="mt-2 flex flex-col gap-y-3">
              <Label dir={langDir} translate="no">{t("select_country")}</Label>
              <Controller
                name="productCountryId"
                control={formContext.control}
                render={({ field }) => (
                  <ReactSelect
                    {...field}
                    onChange={(newValue) => {
                      setSelectedCountry(newValue?.value || null);
                      setSelectedState(null); // Reset state when country changes
                      setCities([]); // Clear cities when country changes
                      field.onChange(newValue?.value);
                    }}
                    options={memoizedAllCountries}
                    value={memoizedAllCountries.find(
                      (item: any) => item.value === field.value,
                    )}
                    styles={customStyles}
                    instanceId="productCountryId"
                    placeholder={t("select")}
                  />
                )}
              />
              <p className="text-[13px] text-destructive" dir={langDir}>
                {
                  formContext.formState.errors["productCountryId"]
                    ?.message as string
                }
              </p>
            </div>
            <div className="mt-2 flex flex-col gap-y-3">
              {/* State Dropdown - Visible only if country is selected */}
              {selectedCountry ? (
                <>
                  <Label dir={langDir} translate="no">{t("select_state")}</Label>
                  <Controller
                    name="productStateId"
                    control={formContext.control}
                    render={({ field }) => (
                      <ReactSelect
                        {...field}
                        onChange={(newValue) => {
                          setSelectedState(newValue?.value || null);
                          setCities([]); // Clear cities when state changes
                          field.onChange(newValue?.value);
                        }}
                        options={states}
                        value={states.find(
                          (item) => item.value === field.value,
                        )}
                        styles={customStyles}
                        instanceId="productStateId"
                        placeholder={t("select")}
                      />
                    )}
                  />
                  <p className="text-[13px] text-destructive" dir={langDir}>
                    {
                      formContext.formState.errors["productStateId"]
                        ?.message as string
                    }
                  </p>
                </>
              ) : null}
            </div>
            {/* City Dropdown - Visible only if state is selected */}
            {selectedState ? (
              <>
                <div className="mt-2 flex flex-col gap-y-3">
                  <Label dir={langDir} translate="no">{t("select_city")}</Label>
                  <Controller
                    name="productCityId"
                    control={formContext.control}
                    render={({ field }) => (
                      <ReactSelect
                        {...field}
                        onChange={(newValue) => {
                          field.onChange(newValue?.value);
                        }}
                        options={cities}
                        value={cities.find(
                          (item) => item.value === field.value,
                        )}
                        styles={customStyles}
                        instanceId="productCityId"
                        placeholder={t("select")}
                      />
                    )}
                  />
                  <p className="text-[13px] text-destructive" dir={langDir}>
                    {
                      formContext.formState.errors["productCityId"]
                        ?.message as string
                    }
                  </p>
                </div>
                <div className="mt-2 flex flex-col gap-y-3">
                  {/* For Location */}
                  {/* <label>Location</label> */}
                  <ControlledTextInput
                    name="productTown"
                    placeholder={t("enter_location")}
                    label={t("location")}
                    dir={langDir}
                    translate="no"
                  />
                </div>
                <div className="mt-2 flex flex-col gap-y-3">
                  {/* For latitude and longitude */}
                  {/* <label>Latitude and Longitude</label> */}
                  <Controller
                    name="productLatLng"
                    render={({ field }) => (
                      <ControlledTextInput
                        {...field}
                        placeholder={t("enter_lat_long")}
                        label={t("latitude_n_longitude")}
                        readOnly
                        dir={langDir}
                        translate="no"
                      />
                    )}
                  />
                </div>
              </>
            ) : null}
            <div className="mt-2 flex flex-col gap-y-3"></div>
          </>
        ) : null}
      </div>
      <div className="mb-3 grid w-full grid-cols-1 gap-x-5 md:grid-cols-1">
        <Label className="text-[16px] font-semibold" dir={langDir} translate="no">
          {t("where_to_sell")}
        </Label>
      </div>
      <div className="mb-3 grid w-full grid-cols-1 gap-x-5 md:grid-cols-2">
        <div className="mt-2 flex flex-col gap-y-3">
          <Label dir={langDir} translate="no">{t("select_multiple_country")}</Label>
          <Controller
            name="sellCountryIds"
            control={formContext.control}
            render={({ field }) => (
              <ReactSelect
                isMulti
                {...field} // ✅ Ensures value is controlled
                onChange={(newValues: MultiValue<OptionType>) => {
                  setSelectedCountries([...newValues]);
                  field.onChange(newValues);

                  // 🔥 Remove states that belong to the removed country
                  const updatedStates = selectedStates.filter((state) =>
                    newValues.some((country) =>
                      statesByCountry[country.value]?.some(
                        (s) => s.value === state.value,
                      ),
                    ),
                  );
                  setSelectedStates(updatedStates);
                  formContext.setValue("sellStateIds", updatedStates); // ✅ Sync with form state

                  // 🔥 Remove cities that belong to removed states
                  const updatedCities = selectedCities.filter((city) =>
                    updatedStates.some((state) =>
                      citiesByState[state.value]?.some(
                        (c) => c.value === city.value,
                      ),
                    ),
                  );
                  setSelectedCities(updatedCities);
                  formContext.setValue("sellCityIds", updatedCities); // ✅ Sync with form state
                }}
                options={memoizedAllCountries}
                value={selectedCountries}
                styles={customStyles}
                instanceId="sellCountryIds"
                placeholder={t("select")}
              />
            )}
          />
        </div>

        {/* Show States when at least one country is selected */}
        {selectedCountries.length > 0 ? (
          <div className="mt-2 flex flex-col gap-y-3">
            <Label dir={langDir} translate="no">{t("select_multiple_state")}</Label>
            <Controller
              name="sellStateIds"
              control={formContext.control}
              render={({ field }) => (
                <ReactSelect
                  isMulti
                  {...field} // ✅ Ensures value is controlled
                  onChange={(newValues: MultiValue<OptionType>) => {
                    setSelectedStates([...newValues]);
                    field.onChange(newValues);

                    // 🔥 Remove cities that belong to the removed state
                    const updatedCities = selectedCities.filter((city) =>
                      newValues.some((state) =>
                        citiesByState[state.value]?.some(
                          (c) => c.value === city.value,
                        ),
                      ),
                    );
                    setSelectedCities(updatedCities);
                    formContext.setValue("sellCityIds", updatedCities); // ✅ Sync with form state
                  }}
                  options={selectedCountries.flatMap(
                    (country) => statesByCountry[country.value] || [],
                  )}
                  value={selectedStates}
                  styles={customStyles}
                  instanceId="sellStateIds"
                  placeholder={t("select")}
                />
              )}
            />
          </div>
        ) : null}

        {/* Show Cities when at least one state is selected */}
        {selectedStates.length > 0 ? (
          <div className="mt-2 flex flex-col gap-y-3">
            <Label dir={langDir} translate="no">{t("select_multiple_city")}</Label>
            <Controller
              name="sellCityIds"
              control={formContext.control}
              render={({ field }) => (
                <ReactSelect
                  isMulti
                  {...field} // ✅ Ensures value is controlled
                  onChange={(newValues: MultiValue<OptionType>) => {
                    field.onChange(newValues);
                    setSelectedCities([...newValues]);
                  }}
                  options={selectedStates.flatMap(
                    (state) => citiesByState[state.value] || [],
                  )}
                  value={selectedCities}
                  styles={customStyles}
                  instanceId="sellCityIds"
                />
              )}
            />
          </div>
        ) : null}

        <div className="mt-2 flex flex-col gap-y-3">
          <Label dir={langDir} translate="no">{t("place_of_origin")}</Label>
          <Controller
            name="placeOfOriginId"
            control={formContext.control}
            render={({ field }) => (
              <ReactSelect
                {...field}
                onChange={(newValue) => {
                  field.onChange(newValue?.value);
                }}
                options={memoizedCountries}
                value={memoizedCountries.find(
                  (item: IOption) => item.value === field.value,
                )}
                styles={customStyles}
                instanceId="placeOfOriginId"
                placeholder={t("select")}
              />
            )}
          />

          <p className="text-[13px] text-destructive" dir={langDir}>
            {formContext.formState.errors["placeOfOriginId"]?.message as string}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PriceSection;
