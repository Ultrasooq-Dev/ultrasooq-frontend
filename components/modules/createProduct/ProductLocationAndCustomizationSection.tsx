import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Controller, useFormContext } from "react-hook-form";
import ReactSelect, { MultiValue } from "react-select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  IAllCountries,
  ICity,
  ICountries,
  IOption,
  IState,
} from "@/utils/types/common.types";
import {
  useCountries,
  useAllCountries,
  useFetchStatesByCountry,
  useFetchCitiesByState,
} from "@/apis/queries/masters.queries";
import { Switch } from "@/components/ui/switch";
import ControlledTextInput from "@/components/shared/Forms/ControlledTextInput";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";

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

type ProductLocationAndCustomizationSectionProps = {
  activeProductType?: string;
};

const ProductLocationAndCustomizationSection: React.FC<
  ProductLocationAndCustomizationSectionProps
> = ({ activeProductType }) => {
  const t = useTranslations();
  const { langDir, currency } = useAuth();
  const formContext = useFormContext();

  const countriesQuery = useCountries();
  const countriesNewQuery = useAllCountries();

  const watchSetUpPrice = formContext.watch("setUpPrice");
  const watchIsOfferPriceRequired = formContext.watch("isOfferPriceRequired");
  const watchIsStockRequired = formContext.watch("isStockRequired");
  const watchSellType = formContext.watch("productPriceList.[0].sellType");

  const watchProductCountryId = formContext.watch("productCountryId");
  const watchProductStateId = formContext.watch("productStateId");

  const watchSellCountryIds = formContext.watch("sellCountryIds");
  const watchSellStateIds = formContext.watch("sellStateIds");
  const watchSellCityIds = formContext.watch("sellCityIds");

  const [selectedCountry, setSelectedCountry] = useState<any | null>(null);
  const [selectedState, setSelectedState] = useState<any | null>(null);
  const [states, setStates] = useState<IOption[]>([]);
  const [cities, setCities] = useState<IOption[]>([]);
  const fetchStatesByCountry = useFetchStatesByCountry();
  const fetchCitiesByState = useFetchCitiesByState();

  // For multiple selection country, state, city
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
      const response = await fetchStatesByCountry.mutateAsync({ countryId });
      setStates(
        response.data.map((state: IState) => ({
          label: state.name,
          value: state.id,
        })),
      );
    } catch (error) {
      // Silently handle errors
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
    if (ipInfo.country_name && countriesQuery?.data?.data) {
      let country = countriesQuery?.data?.data?.find(
        (item: any) =>
          item.countryName.toLowerCase() == ipInfo.country_name.toLowerCase(),
      );
      if (country?.id) {
        formContext.setValue("placeOfOriginId", country.id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countriesQuery?.data?.data?.length]);

  useEffect(() => {
    let ipInfo = JSON.parse(window.localStorage.ipInfo ?? "{}");
    if (ipInfo.country_name && countriesNewQuery?.data?.data) {
      let country = countriesNewQuery?.data?.data?.find(
        (item: any) =>
          item.name.toLowerCase() == ipInfo.country_name.toLowerCase(),
      );
      if (activeProductType != "R" && country?.id) {
        formContext.setValue("productCountryId", country.id);
        setSelectedCountry(country.id);
      }
      if (country?.id) {
        const countryOption = {
          label: country.name,
          value: country.id,
        };
        formContext.setValue("sellCountryIds", [countryOption]);
        setSelectedCountries([countryOption]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countriesNewQuery?.data?.data?.length, activeProductType]);

  const prevProductCountryIdRef = useRef(watchProductCountryId);
  useEffect(() => {
    if (watchProductCountryId !== prevProductCountryIdRef.current) {
      prevProductCountryIdRef.current = watchProductCountryId;
      setSelectedCountry(watchProductCountryId);
    }
  }, [watchProductCountryId]);

  const prevProductStateIdRef = useRef(watchProductStateId);
  useEffect(() => {
    if (watchProductStateId !== prevProductStateIdRef.current) {
      prevProductStateIdRef.current = watchProductStateId;
      setSelectedState(watchProductStateId);
    }
  }, [watchProductStateId]);

  const prevSellCountryIdsRef = useRef<string>("");
  useEffect(() => {
    const currentStr = JSON.stringify(watchSellCountryIds);
    if (currentStr !== prevSellCountryIdsRef.current) {
      prevSellCountryIdsRef.current = currentStr;
      setSelectedCountries([...watchSellCountryIds]);
    }
  }, [watchSellCountryIds]);

  const prevSellStateIdsRef = useRef<string>("");
  useEffect(() => {
    const currentStr = JSON.stringify(watchSellStateIds);
    if (currentStr !== prevSellStateIdsRef.current) {
      prevSellStateIdsRef.current = currentStr;
      setSelectedStates([...watchSellStateIds]);
    }
  }, [watchSellStateIds]);

  const prevSellCityIdsRef = useRef<string>("");
  useEffect(() => {
    const currentStr = JSON.stringify(watchSellCityIds);
    if (currentStr !== prevSellCityIdsRef.current) {
      prevSellCityIdsRef.current = currentStr;
      setSelectedCities([...watchSellCityIds]);
    }
  }, [watchSellCityIds]);

  const fetchCities = async (stateId: number) => {
    try {
      const response = await fetchCitiesByState.mutateAsync({ stateId });
      setCities(
        response.data.map((city: ICity) => ({
          label: city.name,
          value: city.id,
        })),
      );
    } catch (error) {
      // Silently handle errors
    }
  };

  // For latitude and longitude
  const { setValue } = formContext;

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const latLng = `${latitude}, ${longitude}`;
          setValue("productLatLng", latLng);
        },
        (error) => {
          // Silently handle geolocation errors
          try {
            let ipInfo = JSON.parse(
              window.localStorage.getItem("ipInfo") || "{}",
            );
            if (ipInfo.latitude && ipInfo.longitude) {
              setValue(
                "productLatLng",
                `${ipInfo.latitude}, ${ipInfo.longitude}`,
              );
            }
          } catch (parseError) {
            // Silently handle JSON parse errors
          }
        },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

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
          // Silently handle errors
        }
      };

      fetchStates();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCountries.length, selectedCountries.map(c => c.value).join(',')]);

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
          // Silently handle errors
        }
      };

      fetchCities();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStates.length, selectedStates.map(s => s.value).join(',')]);

  useEffect(() => {
    if (watchSellType === "BUYGROUP") {
      setValue("isCustomProduct", false);
      setValue("isOfferPriceRequired", false);
      setValue("isStockRequired", false);
    }
  }, [watchSellType, setValue]);

  return (
    <div className="space-y-8">
      {/* Customize Product Toggle */}
      {activeProductType !== "R" &&
      watchSetUpPrice &&
      watchSellType !== "BUYGROUP" ? (
        <div className="mb-4 flex w-full flex-col items-start gap-5 md:flex-row md:items-center">
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
            <Label dir={langDir} translate="no">
              {t("customize_product")}
            </Label>
          </div>
        </div>
      ) : null}

      {/* Product Price and Stock */}
      <div className="mb-4 grid w-full grid-cols-1 gap-x-5 md:grid-cols-2">
        {activeProductType !== "R" && !watchIsOfferPriceRequired ? (
          <FormField
            control={formContext.control}
            name="productPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel dir={langDir} translate="no">
                  {t("product_price")}
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <div className="absolute bottom-0 left-2 top-0 m-auto flex h-[34px] w-[32px] items-center justify-center bg-[#F6F6F6]!">
                      {currency.symbol}
                    </div>
                    <Input
                      type="number"
                      onWheel={(e) => e.currentTarget.blur()}
                      placeholder={t("product_price")}
                      className="h-[48px]! rounded border-gray-300 pl-12 pr-10 focus-visible:ring-0!"
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
                <FormLabel dir={langDir} translate="no">
                  {t("offer_price")}
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <div className="absolute left-2 top-[6px] flex h-[34px] w-[32px] items-center justify-center bg-[#F6F6F6]!">
                      {currency.symbol}
                    </div>
                    <Input
                      type="number"
                      onWheel={(e) => e.currentTarget.blur()}
                      placeholder={t("offer_price")}
                      className="h-[48px]! rounded border-gray-300 pl-12 pr-10 focus-visible:ring-0!"
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
                <FormLabel dir={langDir} translate="no">
                  {t("stock")}
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    onWheel={(e) => e.currentTarget.blur()}
                    placeholder={t("stock")}
                    className="h-[48px]! rounded border-gray-300 focus-visible:ring-0!"
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

      {/* Warehouse location */}
      {activeProductType !== "R" ? (
        <h3
          className="text-base font-bold text-gray-900 mb-3"
          dir={langDir}
          translate="no"
        >
          Warehouse location
        </h3>
      ) : null}

      <div className="mb-3 grid w-full grid-cols-1 gap-x-5 md:grid-cols-2">
        {activeProductType !== "R" ? (
          <>
            <div className="mt-2 flex flex-col gap-y-3">
              <Label dir={langDir} translate="no">
                {t("select_country")}
              </Label>
              <Controller
                name="productCountryId"
                control={formContext.control}
                render={({ field }) => (
                  <ReactSelect
                    {...field}
                    onChange={(newValue) => {
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
              <p className="text-[13px] text-red-500" dir={langDir}>
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
                  <Label dir={langDir} translate="no">
                    {t("select_state")}
                  </Label>
                  <Controller
                    name="productStateId"
                    control={formContext.control}
                    render={({ field }) => (
                      <ReactSelect
                        {...field}
                        onChange={(newValue) => {
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
                  <p className="text-[13px] text-red-500" dir={langDir}>
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
                  <Label dir={langDir} translate="no">
                    {t("select_city")}
                  </Label>
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
                  <p className="text-[13px] text-red-500" dir={langDir}>
                    {
                      formContext.formState.errors["productCityId"]
                        ?.message as string
                    }
                  </p>
                </div>
                <div className="flex flex-col gap-y-3">
                  <ControlledTextInput
                    name="productTown"
                    placeholder={t("enter_location")}
                    label={t("location")}
                    showLabel={true}
                    dir={langDir}
                    translate="no"
                  />
                </div>
                <div className="mt-2 flex flex-col gap-y-3">
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

      {/* Where to sell */}
      <div className="mb-3 grid w-full grid-cols-1 gap-x-5 md:grid-cols-1">
        <Label
          className="text-[16px] font-semibold"
          dir={langDir}
          translate="no"
        >
          {t("where_to_sell")}
        </Label>
      </div>
      <div className="mb-3 grid w-full grid-cols-1 gap-x-5 md:grid-cols-2">
        <div className="mt-2 flex flex-col gap-y-3">
          <Label dir={langDir} translate="no">
            {t("select_multiple_country")}
          </Label>
          <Controller
            name="sellCountryIds"
            control={formContext.control}
            render={({ field }) => (
              <ReactSelect
                isMulti
                {...field}
                onChange={(newValues: MultiValue<OptionType>) => {
                  setSelectedCountries([...newValues]);
                  field.onChange(newValues);

                  // Remove states that belong to the removed country
                  const updatedStates = selectedStates.filter((state) =>
                    newValues.some((country) =>
                      statesByCountry[country.value]?.some(
                        (s) => s.value === state.value,
                      ),
                    ),
                  );
                  setSelectedStates(updatedStates);
                  formContext.setValue("sellStateIds", updatedStates);

                  // Remove cities that belong to removed states
                  const updatedCities = selectedCities.filter((city) =>
                    updatedStates.some((state) =>
                      citiesByState[state.value]?.some(
                        (c) => c.value === city.value,
                      ),
                    ),
                  );
                  setSelectedCities(updatedCities);
                  formContext.setValue("sellCityIds", updatedCities);
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
            <Label dir={langDir} translate="no">
              {t("select_multiple_state")}
            </Label>
            <Controller
              name="sellStateIds"
              control={formContext.control}
              render={({ field }) => (
                <ReactSelect
                  isMulti
                  {...field}
                  onChange={(newValues: MultiValue<OptionType>) => {
                    setSelectedStates([...newValues]);
                    field.onChange(newValues);

                    // Remove cities that belong to the removed state
                    const updatedCities = selectedCities.filter((city) =>
                      newValues.some((state) =>
                        citiesByState[state.value]?.some(
                          (c) => c.value === city.value,
                        ),
                      ),
                    );
                    setSelectedCities(updatedCities);
                    formContext.setValue("sellCityIds", updatedCities);
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
            <Label dir={langDir} translate="no">
              {t("select_multiple_city")}
            </Label>
            <Controller
              name="sellCityIds"
              control={formContext.control}
              render={({ field }) => (
                <ReactSelect
                  isMulti
                  {...field}
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

        {/* Place of Origin */}
        <div className="mt-2 flex flex-col gap-y-3">
          <Label dir={langDir} translate="no">
            {t("place_of_origin")}
          </Label>
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

          <p className="text-[13px] text-red-500" dir={langDir}>
            {formContext.formState.errors["placeOfOriginId"]?.message as string}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProductLocationAndCustomizationSection;
