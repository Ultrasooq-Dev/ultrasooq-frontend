import React, { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import ControlledTextInput from "@/components/shared/Forms/ControlledTextInput";
import { DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import ControlledPhoneInput from "@/components/shared/Forms/ControlledPhoneInput";
import { useTranslations } from "next-intl";
import { ALPHABETS_REGEX } from "@/utils/constants";
import { useAuth } from "@/context/AuthContext";
import Select, { SingleValue } from "react-select";
import { Label } from "@/components/ui/label";
import { useAllCountries, useFetchCitiesByState, useFetchStatesByCountry } from "@/apis/queries/masters.queries";

const customStyles = {
  control: (base: any) => ({ ...base, height: 48, minHeight: 48 }),
};

type GuestAddressFormProps = {
  onClose: () => void;
  addressType?: "shipping" | "billing";
  setGuestShippingAddress: (address: any) => void;
  setGuestBillingAddress: (address: any) => void;
  guestShippingAddress?: any;
  guestBillingAddress?: any;
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
      .number()
      .min(1, { message: t("country_required") }),
    stateId: z.coerce
      .number()
      .min(1, { message: t("province_required") }),
    cityId: z.coerce
      .number()
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

const GuestAddressForm: React.FC<GuestAddressFormProps> = ({
  onClose,
  addressType,
  setGuestShippingAddress,
  setGuestBillingAddress,
  guestShippingAddress,
  guestBillingAddress,
}) => {
  const t = useTranslations();
  const { langDir } = useAuth();
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

  const [states, setStates] = useState<{ label: string; value: number; }[]>([]);
  const [cities, setCities] = useState<{ label: string; value: number; }[]>([]);
  const [selectedCountryId, setSelectedCountryId] = useState<number>();
  const [selectedStateId, setSelectedStateId] = useState<number>();
  const countriesQuery = useAllCountries();
  const statesQuery = useFetchStatesByCountry();
  const citiesQuery = useFetchCitiesByState();

  const memoizedCountries = useMemo(() => {
    return countriesQuery?.data?.data?.map((country: any) => {
      return { label: country.name, value: country.id }
    }) || [];
  }, [countriesQuery?.data?.data]);

  const fetchStatesByCountry = async () => {
    if (selectedCountryId) {
      let data = await statesQuery.mutateAsync({ countryId: selectedCountryId });
      setStates(data?.data?.map((state: any) => {
        return { label: state.name, value: state.id };
      }) || []);
    }
  };

  useEffect(() => {
    fetchStatesByCountry();
  }, [selectedCountryId]);

  const fetchCitiesByState = async () => {
    if (selectedStateId) {
      let data = await citiesQuery.mutateAsync({ stateId: selectedStateId });
      setCities(data?.data?.map((city: any) => {
        return { label: city.name, value: city.id };
      }) || []);
    }
  };

  useEffect(() => {
    fetchCitiesByState();
  }, [selectedStateId]);

  useEffect(() => {
    if (guestBillingAddress?.countryId || guestShippingAddress?.countryId) {
      setSelectedCountryId(guestBillingAddress?.countryId || guestShippingAddress?.countryId)
    }
    if (guestBillingAddress?.stateId || guestShippingAddress?.stateId) {
      setSelectedStateId(guestBillingAddress?.stateId || guestShippingAddress?.stateId)
    }
  }, []);

  const onSubmit = async (formData: typeof defaultValues) => {
    let data: {[key: string]: any} = formData;
    data.country = memoizedCountries.find((country: any) => country.value == formData.countryId)?.label || '';
    data.state = states.find((state: any) => state.value == formData.stateId)?.label || '';
    data.city = cities.find((city: any) => city.value == formData.cityId)?.label || '';

    if (addressType === "shipping") {
      setGuestShippingAddress(data);
    } else if (addressType === "billing") {
      setGuestBillingAddress(data);
    }

    form.reset();
    onClose();
  };

  useEffect(() => {
    if (addressType === "shipping" && guestShippingAddress) {
      form.reset(guestShippingAddress);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guestShippingAddress, addressType]);

  useEffect(() => {
    if (addressType === "billing" && guestBillingAddress) {
      form.reset(guestBillingAddress);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guestBillingAddress, addressType]);

  return (
    <>
      <div className="modal-header">
        <DialogTitle className="text-center text-xl font-bold" translate="no">
          {`${(addressType === "shipping" && guestShippingAddress) || (addressType === "billing" && guestBillingAddress) ? t("edit_address") : t("add_address")}`}
        </DialogTitle>
      </div>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="card-item card-payment-form px-5 pb-5 pt-3"
        >
          <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-2">
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

          <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-1">
            <ControlledPhoneInput
              label={t("phone_number")}
              name="phoneNumber"
              countryName="cc"
              placeholder={t("enter_phone_number")}
            />
          </div>

          <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-1">
            <ControlledTextInput
              label={t("address")}
              name="address"
              placeholder={t("address")}
              dir={langDir}
              translate="no"
            />
          </div>

          <div className="grid w-full grid-cols-1 gap-1 md:grid-cols-2 mt-3">
            <div style={{ zIndex: 9999999 }}>
              <Label translate="no">{t("country")}</Label>
              <Controller
                name="countryId"
                control={form.control}
                render={({ field }) => (
                  <Select
                    options={memoizedCountries}
                    value={memoizedCountries.find((country: any) => country.value == field.value)}
                    onChange={(selectedOption: SingleValue<{ label: string, value: string }>) => {
                      field.onChange(selectedOption?.value);
                      setSelectedCountryId(Number(selectedOption?.value));
                    }}
                    instanceId="countryId"
                    placeholder={t("select")}
                    styles={customStyles}
                    isRtl={langDir == 'rtl'}
                    // @ts-ignore
                    onFocus={(e) => e.target.autocomplete = 'none'}
                  />
                )}
              />
              <p className="text-[13px] text-destructive" dir={langDir}>
                {form.formState.errors?.countryId?.message || ''}
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
                    value={states.find(state => state.value == field.value)}
                    onChange={(selectedOption: SingleValue<{ label: string, value: string }>) => {
                      field.onChange(selectedOption?.value);
                      setSelectedStateId(Number(selectedOption?.value));
                    }}
                    instanceId="stateId"
                    placeholder={t("select")}
                    styles={customStyles}
                    isRtl={langDir == 'rtl'}
                    // @ts-ignore
                    onFocus={(e) => e.target.autocomplete = 'none'}
                  />
                )}
              />
              <p className="text-[13px] text-destructive" dir={langDir}>
                {form.formState.errors?.stateId?.message || ''}
              </p>
            </div>
          </div>

          <div className="grid w-full grid-cols-1 gap-1 md:grid-cols-2 mt-3">
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
                    value={cities.find(city => city.value == field.value)}
                    onChange={(selectedOption: SingleValue<{ label: string, value: string }>) =>
                      field.onChange(selectedOption?.value)
                    }
                    instanceId="cityId"
                    placeholder={t("select")}
                    styles={customStyles}
                    isRtl={langDir == 'rtl'}
                    // @ts-ignore
                    onFocus={(e) => e.target.autocomplete = 'none'}
                  />
                )}
              />
              <p className="text-[13px] text-destructive" dir={langDir}>
                {form.formState.errors?.cityId?.message || ''}
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

          <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-2 mt-2">
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
            type="submit"
            className="theme-primary-btn h-12 w-full rounded bg-dark-orange text-center text-lg font-bold leading-6 mt-3"
            dir={langDir}
            translate="no"
          >
            {(addressType === "shipping" && guestShippingAddress) ||
              (addressType === "billing" && guestBillingAddress)
              ? t("edit_address")
              : t("add_address")}
          </Button>
        </form>
      </Form>
    </>
  );
};

export default GuestAddressForm;
