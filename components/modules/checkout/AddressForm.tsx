import React, { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
// import ControlledSelectInput from "@/components/shared/Forms/ControlledSelectInput";
import ControlledTextInput from "@/components/shared/Forms/ControlledTextInput";
import { DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import ControlledPhoneInput from "@/components/shared/Forms/ControlledPhoneInput";
import {
  useAllCountries,
  useCountries,
  useFetchCitiesByState,
  useFetchStatesByCountry,
} from "@/apis/queries/masters.queries";
import { useToast } from "@/components/ui/use-toast";
import {
  useAddAddress,
  useAddressById,
  useUpdateAddress,
} from "@/apis/queries/address.queries";
import { IoCloseSharp } from "react-icons/io5";
import { ALPHABETS_REGEX } from "@/utils/constants";
import LoaderWithMessage from "@/components/shared/LoaderWithMessage";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import ControlledSelectInput from "@/components/shared/Forms/ControlledSelectInput";
import { Label } from "@/components/ui/label";
import Select, { SingleValue, InputProps } from "react-select";

const customStyles = {
  control: (base: any) => ({ ...base, height: 48, minHeight: 48 }),
};

type AddressFormProps = {
  addressId?: number;
  onClose: () => void;
};

const formSchema = (t: any) => {
  return z.object({
    firstName: z
      .string()
      .trim()
      .min(2, {
        message: t("first_name_required"),
      })
      .max(50, {
        message: t("first_name_must_be_50_chars_only"),
      }),
    lastName: z
      .string()
      .trim()
      .min(2, { message: t("last_name_requierd") })
      .max(50, {
        message: t("last_name_must_be_50_chars_only"),
      }),
    cc: z.string().trim(),
    phoneNumber: z
      .string()
      .trim()
      .min(2, {
        message: t("phone_number_required"),
      })
      .min(8, {
        message: t("phone_number_must_be_min_8_digits"),
      })
      .max(20, {
        message: t("phone_number_cant_be_more_than_20_digits"),
      }),
    address: z
      .string()
      .trim()
      .min(2, { message: t("address_required") })
      .max(50, {
        message: t("address_must_be_less_than_n_chars", { n: 50 }),
      }),
    countryId: z.coerce
      .number({ required_error: t("province_required") })
      .min(1, { message: t("country_required") }),
    stateId: z.coerce
      .number({ required_error: t("province_required") })
      .min(1, { message: t("province_required") }),
    cityId: z.coerce
      .number({ required_error: t("province_required") })
      .min(1, { message: t("city_required") }),
    town: z
      .string()
      .trim()
      .min(2, { message: t("town_required") })
      .max(50, {
        message: t("town_must_be_less_than_n_chars", { n: 50 }),
      })
      .refine((val) => ALPHABETS_REGEX.test(val), {
        message: t("town_must_contain_only_letters"),
      }),
    postCode: z
      .string()
      .trim()
      .min(2, { message: t("postcode_required") })
      .max(50, {
        message: t("postcode_must_be_less_than_n_chars", { n: 50 }),
      }),
  });
};

const AddressForm: React.FC<AddressFormProps> = ({ addressId, onClose }) => {
  const t = useTranslations();
  const { langDir } = useAuth();
  const { toast } = useToast();
  const defaultValues = {
    firstName: "",
    lastName: "",
    phoneNumber: "",
    cc: "",
    address: "",
    countryId: "",
    stateId: "",
    cityId: "",
    town: "",
    postCode: "",
  };
  const form = useForm({
    resolver: zodResolver(formSchema(t)),
    defaultValues: defaultValues,
  });

  const [states, setStates] = useState<{ label: string; value: number }[]>([]);
  const [cities, setCities] = useState<{ label: string; value: number }[]>([]);
  const [selectedCountryId, setSelectedCountryId] = useState<number>();
  const [selectedStateId, setSelectedStateId] = useState<number>();
  const countriesQuery = useAllCountries();
  const statesQuery = useFetchStatesByCountry();
  const citiesQuery = useFetchCitiesByState();

  const createAddress = useAddAddress();
  const updateAddress = useUpdateAddress();
  const addressByIdQuery = useAddressById(
    addressId ? String(addressId) : "",
    !!addressId,
  );

  const memoizedCountries = useMemo(() => {
    return (
      countriesQuery?.data?.data?.map((country: any) => {
        return { label: country.name, value: country.id };
      }) || []
    );
  }, [countriesQuery?.data?.data]);

  const fetchStatesByCountry = async () => {
    if (selectedCountryId) {
      let data = await statesQuery.mutateAsync({
        countryId: selectedCountryId,
      });
      setStates(
        data?.data?.map((state: any) => {
          return { label: state.name, value: state.id };
        }) || [],
      );
    }
  };

  useEffect(() => {
    fetchStatesByCountry();
  }, [selectedCountryId]);

  const fetchCitiesByState = async () => {
    if (selectedStateId) {
      let data = await citiesQuery.mutateAsync({ stateId: selectedStateId });
      setCities(
        data?.data?.map((city: any) => {
          return { label: city.name, value: city.id };
        }) || [],
      );
    }
  };

  useEffect(() => {
    fetchCitiesByState();
  }, [selectedStateId]);

  const onSubmit = async (formData: typeof defaultValues) => {
    if (addressId) {
      const updatedFormData = {
        ...formData,
        userAddressId: addressId,
      };
      const response = await updateAddress.mutateAsync(updatedFormData);

      if (response.status) {
        toast({
          title: t("address_edit_successful"),
          description: response.message,
          variant: "success",
        });
        form.reset();
        onClose();
      } else {
        toast({
          title: t("address_edit_failed"),
          description: response.message,
          variant: "danger",
        });
      }
    } else {
      const response = await createAddress.mutateAsync(formData);

      if (response.status) {
        toast({
          title: t("address_add_successful"),
          description: response.message,
          variant: "success",
        });
        form.reset();
        onClose();
      } else {
        toast({
          title: t("address_add_failed"),
          description: response.message,
          variant: "danger",
        });
      }
    }
  };

  useEffect(() => {
    if (addressId && addressByIdQuery.data?.data) {
      const addressDetails = addressByIdQuery.data?.data;
      form.reset({
        firstName: addressDetails?.firstName,
        lastName: addressDetails?.lastName,
        phoneNumber: addressDetails?.phoneNumber,
        cc: addressDetails?.cc,
        address: addressDetails?.address,
        countryId: addressDetails?.countryId,
        stateId: addressDetails?.stateId,
        cityId: addressDetails?.cityId,
        town: addressDetails?.town,
        postCode: addressDetails?.postCode,
      });
      if (addressDetails?.countryId)
        setSelectedCountryId(addressDetails.countryId);
      if (addressDetails?.stateId) setSelectedStateId(addressDetails.stateId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    addressByIdQuery.data?.data,
    countriesQuery?.data?.data?.length,
    addressId,
  ]);

  return (
    <>
      <div className="modal-header justify-between!" dir={langDir}>
        <DialogTitle className="text-center text-xl font-bold" translate="no">
          {`${addressId}` ? t("edit_address") : t("add_address")}
        </DialogTitle>
        <Button
          onClick={onClose}
          className={`${langDir == "ltr" ? "absolute" : ""} right-2 top-2 z-10 bg-card! text-foreground! shadow-none`}
        >
          <IoCloseSharp size={20} />
        </Button>
      </div>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="card-item card-payment-form px-5 pb-5 pt-3"
        >
          <input type="text" name="countryId" style={{ display: "none" }} />
          <div className="grid w-full grid-cols-1 gap-1 md:grid-cols-2">
            <ControlledTextInput
              label={t("first_name")}
              name="firstName"
              placeholder={t("enter_first_name")}
              dir={langDir}
              translate="no"
            />

            <ControlledTextInput
              label={t("last_name")}
              name="lastName"
              placeholder={t("enter_last_name")}
              dir={langDir}
              translate="no"
            />
          </div>

          <div className="relative z-99999999 mt-2 grid w-full grid-cols-1 gap-1 md:grid-cols-1">
            <ControlledPhoneInput
              label={t("phone_number")}
              name="phoneNumber"
              countryName="cc"
              placeholder={t("enter_phone_number")}
            />
          </div>

          <div className="grid w-full grid-cols-1 gap-1 md:grid-cols-1">
            <ControlledTextInput
              label={t("address")}
              name="address"
              placeholder={t("address")}
              dir={langDir}
              translate="no"
            />
          </div>

          <div className="mt-3 grid w-full grid-cols-1 gap-1 md:grid-cols-2">
            <div style={{ zIndex: 9999999 }}>
              <Label translate="no">{t("country")}</Label>
              <Controller
                name="countryId"
                control={form.control}
                render={({ field }) => (
                  <Select
                    options={memoizedCountries}
                    value={memoizedCountries.find(
                      (country: any) => country.value == field.value,
                    )}
                    onChange={(
                      selectedOption: SingleValue<{
                        label: string;
                        value: string;
                      }>,
                    ) => {
                      field.onChange(selectedOption?.value);
                      setSelectedCountryId(Number(selectedOption?.value));
                    }}
                    instanceId="countryId"
                    placeholder={t("select")}
                    styles={customStyles}
                    isRtl={langDir == "rtl"}
                    // @ts-ignore
                    onFocus={(e) => (e.target.autocomplete = "none")}
                  />
                )}
              />
              <p className="text-[13px] text-destructive" dir={langDir}>
                {form.formState.errors?.countryId?.message || ""}
              </p>
            </div>

            <div style={{ zIndex: 999999 }}>
              <Label translate="no">{t("state")}</Label>
              <Controller
                name="stateId"
                control={form.control}
                render={({ field }) => (
                  <Select
                    // @ts-ignore
                    options={states}
                    // @ts-ignore
                    value={states.find((state) => state.value == field.value)}
                    onChange={(
                      selectedOption: SingleValue<{
                        label: string;
                        value: string;
                      }>,
                    ) => {
                      field.onChange(selectedOption?.value);
                      setSelectedStateId(Number(selectedOption?.value));
                    }}
                    instanceId="stateId"
                    placeholder={t("select")}
                    styles={customStyles}
                    isRtl={langDir == "rtl"}
                    // @ts-ignore
                    onFocus={(e) => (e.target.autocomplete = "none")}
                  />
                )}
              />
              <p className="text-[13px] text-destructive" dir={langDir}>
                {form.formState.errors?.stateId?.message || ""}
              </p>
            </div>
          </div>

          <div className="mt-3 grid w-full grid-cols-1 gap-1 md:grid-cols-2">
            <div style={{ zIndex: 99999 }}>
              <Label translate="no">{t("city")}</Label>
              <Controller
                name="cityId"
                control={form.control}
                render={({ field }) => (
                  <Select
                    // @ts-ignore
                    options={cities}
                    // @ts-ignore
                    value={cities.find((city) => city.value == field.value)}
                    onChange={(
                      selectedOption: SingleValue<{
                        label: string;
                        value: string;
                      }>,
                    ) => field.onChange(selectedOption?.value)}
                    instanceId="cityId"
                    placeholder={t("select")}
                    styles={customStyles}
                    isRtl={langDir == "rtl"}
                    // @ts-ignore
                    onFocus={(e) => (e.target.autocomplete = "none")}
                  />
                )}
              />
              <p className="text-[13px] text-destructive" dir={langDir}>
                {form.formState.errors?.cityId?.message || ""}
              </p>
            </div>

            <div>
              <Label translate="no">{t("town")}</Label>
              <ControlledTextInput
                className="mt-0"
                label={t("town")}
                type="text"
                name="town"
                placeholder={t("town")}
                onWheel={(e) => e.currentTarget.blur()}
                dir={langDir}
                translate="no"
              />
            </div>
          </div>

          <div className="mt-3 grid w-full grid-cols-1 gap-1 md:grid-cols-2">
            <div>
              <Label translate="no">{t("postcode")}</Label>
              <ControlledTextInput
                className="mt-0"
                label={t("postcode")}
                type="number"
                name="postCode"
                placeholder={t("postcode")}
                onWheel={(e) => e.currentTarget.blur()}
                dir={langDir}
                translate="no"
              />
            </div>
          </div>

          <Button
            disabled={createAddress.isPending || updateAddress.isPending}
            type="submit"
            className="theme-primary-btn mt-3 h-12 w-full rounded bg-dark-orange text-center text-lg font-bold leading-6"
            dir={langDir}
            translate="no"
          >
            {createAddress.isPending || updateAddress.isPending ? (
              <LoaderWithMessage message="Please wait" />
            ) : addressId ? (
              t("edit_address")
            ) : (
              t("add_address")
            )}
          </Button>
        </form>
      </Form>
    </>
  );
};

export default AddressForm;
