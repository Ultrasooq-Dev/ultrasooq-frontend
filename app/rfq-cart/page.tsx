"use client";
import { useAllUserAddress } from "@/apis/queries/address.queries";
import {
  useAddRfqQuotes,
  useDeleteRfqCartItem,
  useRfqCartListByUserId,
  useUpdateRfqCartWithLogin,
} from "@/apis/queries/rfq.queries";
import {
  useAllCountries,
  useFetchStatesByCountry,
  useFetchCitiesByState,
} from "@/apis/queries/masters.queries";
import { useMe } from "@/apis/queries/user.queries";
import RfqProductCard from "@/components/modules/rfqCart/RfqProductCard";
import ControlledDatePicker from "@/components/shared/Forms/ControlledDatePicker";
import ControlledTextInput from "@/components/shared/Forms/ControlledTextInput";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/components/ui/use-toast";
import { AddressItem } from "@/utils/types/address.types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useMemo, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { MdOutlineChevronLeft } from "react-icons/md";
import { z } from "zod";
import Footer from "@/components/shared/Footer";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import ReactSelect from "react-select";
import { IAllCountries, IState, ICity } from "@/utils/types/common.types";

const formSchema = (t: any) => {
  return z.object({
    address: z
      .string()
      .trim()
      .min(1, { message: t("address_required") || "Address is required" }),
    countryId: z
      .string()
      .trim()
      .min(1, { message: t("country_required") }),
    stateId: z.string().optional(),
    cityId: z.string().optional(),
    rfqDate: z.date().optional().nullable(),
  });
};

const RfqCartPage = () => {
  const t = useTranslations();
  const { langDir } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const router = useRouter();
  const form = useForm({
    resolver: zodResolver(formSchema(t)),
    defaultValues: {
      address: "",
      countryId: "",
      stateId: "",
      cityId: "",
      rfqDate: undefined as Date | null | undefined,
    },
  });

  const [selectedCountry, setSelectedCountry] = useState<any | null>(null);
  const [selectedState, setSelectedState] = useState<any | null>(null);
  const [selectedCity, setSelectedCity] = useState<any | null>(null);
  const [states, setStates] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [showNewAddressInput, setShowNewAddressInput] =
    useState<boolean>(false);

  const me = useMe();
  const allUserAddressesQuery = useAllUserAddress({ page: 1, limit: 100 });
  const allCountriesQuery = useAllCountries();
  const fetchStatesByCountry = useFetchStatesByCountry();
  const fetchCitiesByState = useFetchCitiesByState();

  const customSelectStyles = {
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
  const rfqCartListByUser = useRfqCartListByUserId({
    page: 1,
    limit: 20,
  });
  const updateRfqCartWithLogin = useUpdateRfqCartWithLogin();
  const deleteRfqCartItem = useDeleteRfqCartItem();
  const addQuotes = useAddRfqQuotes();

  const memoizedCountryList = useMemo(() => {
    return (
      allCountriesQuery.data?.data?.map((item: IAllCountries) => ({
        label: item.name,
        value: item.id,
      })) || []
    );
  }, [allCountriesQuery.data?.data]);

  const memoizedStateList = useMemo(() => {
    return (
      states?.map((item: IState) => ({
        label: item.name,
        value: item.id,
      })) || []
    );
  }, [states]);

  const memoizedCityList = useMemo(() => {
    return (
      cities?.map((item: ICity) => ({
        label: item.name,
        value: item.id,
      })) || []
    );
  }, [cities]);

  // Fetch states when country is selected
  useEffect(() => {
    if (selectedCountry) {
      fetchStates(selectedCountry.value);
    } else {
      setStates([]);
      setSelectedState(null);
      setCities([]);
      setSelectedCity(null);
    }
  }, [selectedCountry]);

  // Fetch cities when state is selected
  useEffect(() => {
    if (selectedState) {
      fetchCities(selectedState.value);
    } else {
      setCities([]);
      setSelectedCity(null);
    }
  }, [selectedState]);

  const fetchStates = async (countryId: number) => {
    try {
      const response = await fetchStatesByCountry.mutateAsync({ countryId });
      if (response.status && response.data) {
        setStates(response.data);
      }
    } catch (error) {
      console.error("Error fetching states:", error);
    }
  };

  const fetchCities = async (stateId: number) => {
    try {
      const response = await fetchCitiesByState.mutateAsync({ stateId });
      if (response.status && response.data) {
        setCities(response.data);
      }
    } catch (error) {
      console.error("Error fetching cities:", error);
    }
  };

  const memoizedRfqCartList = useMemo(() => {
    if (rfqCartListByUser.data?.data) {
      return rfqCartListByUser.data?.data || [];
    }
    return [];
  }, [rfqCartListByUser.data?.data]);

  // Handle country selection
  const handleCountryChange = (selectedOption: any) => {
    setSelectedCountry(selectedOption);
    form.setValue(
      "countryId",
      selectedOption ? selectedOption.value.toString() : "",
    );
    form.setValue("stateId", "");
    form.setValue("cityId", "");
    setSelectedState(null);
    setSelectedCity(null);
  };

  // Handle state selection
  const handleStateChange = (selectedOption: any) => {
    setSelectedState(selectedOption);
    form.setValue(
      "stateId",
      selectedOption ? selectedOption.value.toString() : "",
    );
    form.setValue("cityId", "");
    setSelectedCity(null);
  };

  // Handle city selection
  const handleCityChange = (selectedOption: any) => {
    setSelectedCity(selectedOption);
    form.setValue(
      "cityId",
      selectedOption ? selectedOption.value.toString() : "",
    );
  };

  const handleAddToCart = async (
    quantity: number,
    productId: number,
    actionType: "add" | "remove",
    offerPriceFrom?: number,
    offerPriceTo?: number,
    note?: string,
  ) => {
    const response = await updateRfqCartWithLogin.mutateAsync({
      productId,
      quantity,
      offerPriceFrom: offerPriceFrom || 0,
      offerPriceTo: offerPriceTo || 0,
      note: note || "",
    });

    if (response.status) {
      toast({
        title:
          actionType == "add"
            ? t("item_added_to_cart")
            : t("item_removed_from_cart"),
        description: t("check_your_cart_for_more_details"),
        variant: "success",
      });
    }
  };

  const handleRemoveItemFromRfqCart = async (rfqCartId: number) => {
    const response = await deleteRfqCartItem.mutateAsync({ rfqCartId });
    if (response.status) {
      toast({
        title: t("item_removed_from_cart"),
        description: t("check_your_cart_for_more_details"),
        variant: "success",
      });
    }
  };

  const onSubmit = async (formData: any) => {
    const updatedFormData = {
      firstName: me.data?.data?.firstName || "",
      lastName: me.data?.data?.lastName || "",
      phoneNumber: me.data?.data?.phoneNumber || "",
      cc: me.data?.data?.cc || "",
      address: formData.address || "",
      city: "", // Keep for backward compatibility
      province: "", // Keep for backward compatibility
      postCode: "", // Keep for backward compatibility
      country: "", // Keep for backward compatibility
      countryId: formData.countryId,
      stateId: formData.stateId || undefined,
      cityId: formData.cityId || undefined,
      rfqCartIds: memoizedRfqCartList.map((item: any) => item.id),
      rfqDate: formData.rfqDate ? formData.rfqDate.toISOString() : undefined,
    };

    const response = await addQuotes.mutateAsync(updatedFormData);
    if (response.status) {
      toast({
        title: t("rfq_submitted_successfully"),
        description: t("vendors_will_respond_via_messages"),
        variant: "success",
      });
      queryClient.invalidateQueries({
        queryKey: ["rfq-cart-by-user", { page: 1, limit: 20 }],
      });
      form.reset();
      router.push("/rfq-request");
    } else {
      toast({
        title: t("something_went_wrong"),
        description: response.message,
        variant: "danger",
      });
    }
  };

  return (
    <>
      <div className="body-content-s1">
        <div className="min-h-screen w-full bg-white px-4 sm:px-6 lg:px-12">
          {/* Header Section */}
          {/* <div className="border-b border-gray-200 bg-white py-6 sm:py-8">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 transition-colors hover:border-gray-400 hover:bg-gray-50"
              >
                <MdOutlineChevronLeft className="h-6 w-6" />
              </button>
              <div>
                <h1
                  className="text-2xl font-bold text-gray-900 md:text-3xl"
                  dir={langDir}
                  translate="no"
                >
                  {t("rfq_cart_items")}
                </h1>
                <p
                  className="mt-1 text-sm text-gray-500"
                  dir={langDir}
                  translate="no"
                >
                  {memoizedRfqCartList.length}{" "}
                  {memoizedRfqCartList.length === 1 ? t("item") : t("items")}
                </p>
              </div>
            </div>
          </div> */}

          {/* Main Content */}
          <div className="py-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Left Column - Cart Items */}
              <div className="space-y-6 lg:col-span-2">
                {/* Cart Items Section */}
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                  <div className="border-b border-gray-200 bg-white px-6 py-4">
                    <h2
                      className="text-lg font-bold text-gray-900"
                      dir={langDir}
                      translate="no"
                    >
                      {t("rfq_cart_items")}
                    </h2>
                  </div>
                  <div className="p-6">
                    {!memoizedRfqCartList.length ? (
                      <div className="flex flex-col items-center justify-center py-16">
                        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
                          <svg
                            className="h-10 w-10 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                            />
                          </svg>
                        </div>
                        <h3
                          className="mb-2 text-lg font-semibold text-gray-900"
                          dir={langDir}
                          translate="no"
                        >
                          {t("no_cart_items")}
                        </h3>
                        <p
                          className="text-center text-sm text-gray-500"
                          dir={langDir}
                          translate="no"
                        >
                          {t("add_some_products_to_get_started")}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {memoizedRfqCartList.map((item: any) => (
                          <RfqProductCard
                            key={item?.id}
                            id={item?.id}
                            rfqProductId={item?.productId}
                            productName={
                              item?.rfqCart_productDetails?.productName
                            }
                            productQuantity={item.quantity}
                            productImages={
                              item?.rfqCart_productDetails?.productImages
                            }
                            offerPriceFrom={item?.offerPriceFrom}
                            offerPriceTo={item?.offerPriceTo}
                            onAdd={handleAddToCart}
                            onRemove={handleRemoveItemFromRfqCart}
                            note={item?.note}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column - Delivery Information */}
              <div className="lg:col-span-1">
                <div className="sticky top-6">
                  <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-200 bg-white px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
                          <svg
                            className="h-6 w-6 text-orange-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                        </div>
                        <div>
                          <h3
                            className="text-lg font-bold text-gray-900"
                            dir={langDir}
                            translate="no"
                          >
                            {t("select_location")}
                          </h3>
                          <p
                            className="text-xs text-gray-500"
                            dir={langDir}
                            translate="no"
                          >
                            {t("location_helps_find_vendors")}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                      <Form {...form}>
                        <form className="space-y-5">
                          <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel
                                  className="text-sm font-semibold text-gray-700"
                                  dir={langDir}
                                  translate="no"
                                >
                                  {t("address")} *
                                </FormLabel>
                                <FormControl>
                                  {allUserAddressesQuery.data?.data &&
                                  allUserAddressesQuery.data.data.length > 0 &&
                                  !showNewAddressInput ? (
                                    <ReactSelect
                                      options={[
                                        {
                                          label:
                                            t("select_saved_address") ||
                                            "Select saved address",
                                          value: "",
                                        },
                                        ...allUserAddressesQuery.data.data.map(
                                          (addr: AddressItem) => ({
                                            label:
                                              `${addr.address || ""}${addr.town ? `, ${addr.town}` : ""}${addr.postCode ? `, ${addr.postCode}` : ""}`.replace(
                                                /^,\s*|,\s*$/g,
                                                "",
                                              ),
                                            value: addr.address || "",
                                          }),
                                        ),
                                        {
                                          label:
                                            t("enter_new_address") ||
                                            "Enter new address",
                                          value: "__NEW__",
                                        },
                                      ]}
                                      value={
                                        field.value
                                          ? allUserAddressesQuery.data.data.find(
                                              (addr: AddressItem) =>
                                                addr.address === field.value,
                                            )
                                            ? (() => {
                                                const foundAddr =
                                                  allUserAddressesQuery.data.data.find(
                                                    (addr: AddressItem) =>
                                                      addr.address ===
                                                      field.value,
                                                  );
                                                return {
                                                  label:
                                                    `${field.value}${foundAddr?.town ? `, ${foundAddr.town}` : ""}${foundAddr?.postCode ? `, ${foundAddr.postCode}` : ""}`.replace(
                                                      /^,\s*|,\s*$/g,
                                                      "",
                                                    ),
                                                  value: field.value,
                                                };
                                              })()
                                            : {
                                                label: field.value,
                                                value: field.value,
                                              }
                                          : null
                                      }
                                      onChange={(selectedOption: any) => {
                                        if (
                                          selectedOption?.value === "__NEW__"
                                        ) {
                                          field.onChange("");
                                          setShowNewAddressInput(true);
                                        } else if (selectedOption?.value) {
                                          field.onChange(selectedOption.value);
                                          setShowNewAddressInput(false);
                                        } else {
                                          field.onChange("");
                                          setShowNewAddressInput(false);
                                        }
                                      }}
                                      placeholder={
                                        t("select_or_enter_address") ||
                                        "Select or enter address"
                                      }
                                      styles={customSelectStyles}
                                      isClearable
                                    />
                                  ) : (
                                    <div className="space-y-2">
                                      <ControlledTextInput
                                        {...field}
                                        placeholder={
                                          t("enter_address") ||
                                          "Enter your address"
                                        }
                                        dir={langDir}
                                      />
                                      {allUserAddressesQuery.data?.data &&
                                        allUserAddressesQuery.data.data.length >
                                          0 && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setShowNewAddressInput(false);
                                              field.onChange("");
                                            }}
                                            className="text-sm font-medium text-orange-600 hover:text-orange-800"
                                          >
                                            {t("select_from_saved_addresses") ||
                                              "Select from saved addresses"}
                                          </button>
                                        )}
                                    </div>
                                  )}
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="countryId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel
                                  className="text-sm font-semibold text-gray-700"
                                  dir={langDir}
                                  translate="no"
                                >
                                  {t("country")} *
                                </FormLabel>
                                <FormControl>
                                  <ReactSelect
                                    options={memoizedCountryList}
                                    value={memoizedCountryList.find(
                                      (option: any) =>
                                        option.value.toString() === field.value,
                                    )}
                                    onChange={(selectedOption) => {
                                      field.onChange(
                                        selectedOption
                                          ? selectedOption.value.toString()
                                          : "",
                                      );
                                      handleCountryChange(selectedOption);
                                    }}
                                    placeholder={t("select_country")}
                                    styles={customSelectStyles}
                                    isClearable
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="stateId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel
                                  className="text-sm font-semibold text-gray-700"
                                  dir={langDir}
                                  translate="no"
                                >
                                  {t("state")} ({t("optional")})
                                </FormLabel>
                                <FormControl>
                                  <ReactSelect
                                    options={memoizedStateList}
                                    value={memoizedStateList.find(
                                      (option) =>
                                        option.value.toString() === field.value,
                                    )}
                                    onChange={(selectedOption) => {
                                      field.onChange(
                                        selectedOption
                                          ? selectedOption.value.toString()
                                          : "",
                                      );
                                      handleStateChange(selectedOption);
                                    }}
                                    placeholder={t("select_state")}
                                    styles={customSelectStyles}
                                    isDisabled={
                                      !selectedCountry ||
                                      memoizedStateList.length === 0
                                    }
                                    isClearable
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="cityId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel
                                  className="text-sm font-semibold text-gray-700"
                                  dir={langDir}
                                  translate="no"
                                >
                                  {t("city")} ({t("optional")})
                                </FormLabel>
                                <FormControl>
                                  <ReactSelect
                                    options={memoizedCityList}
                                    value={memoizedCityList.find(
                                      (option) =>
                                        option.value.toString() === field.value,
                                    )}
                                    onChange={(selectedOption) => {
                                      field.onChange(
                                        selectedOption
                                          ? selectedOption.value.toString()
                                          : "",
                                      );
                                      handleCityChange(selectedOption);
                                    }}
                                    placeholder={t("select_city")}
                                    styles={customSelectStyles}
                                    isDisabled={
                                      !selectedState ||
                                      memoizedCityList.length === 0
                                    }
                                    isClearable
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div>
                            <ControlledDatePicker
                              name="rfqDate"
                              label={`${t("delivery_date")} (${t("optional")})`}
                              isFuture
                              placeholder={t("enter_date")}
                            />
                          </div>

                          <Button
                            type="submit"
                            disabled={
                              !memoizedRfqCartList.length || addQuotes.isPending
                            }
                            className="bg-dark-orange h-12 w-full text-base font-bold text-white shadow-lg shadow-orange-500/30 transition-all duration-200 hover:scale-[1.02] hover:shadow-xl hover:shadow-orange-500/40 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                            onClick={form.handleSubmit(onSubmit)}
                            translate="no"
                          >
                            {addQuotes.isPending ? (
                              <div className="flex items-center justify-center gap-2">
                                <Image
                                  src="/images/load.png"
                                  alt="loader-icon"
                                  width={20}
                                  height={20}
                                  className="animate-spin"
                                />
                                <span>{t("please_wait")}</span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-2">
                                <svg
                                  className="h-5 w-5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                  />
                                </svg>
                                <span>{t("request_for_rfq")}</span>
                              </div>
                            )}
                          </Button>
                        </form>
                      </Form>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default RfqCartPage;
