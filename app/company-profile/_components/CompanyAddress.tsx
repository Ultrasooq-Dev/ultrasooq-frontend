"use client";
import React from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import ControlledTextInput from "@/components/shared/Forms/ControlledTextInput";
import ControlledSelectInput from "@/components/shared/Forms/ControlledSelectInput";
import { CompanyAddressProps } from "./types";

export default function CompanyAddress({ langDir, memoizedCountries }: CompanyAddressProps) {
  const t = useTranslations();

  return (
    <div className="mb-3.5 w-full">
      <div className="mb-4 w-full border-y border-solid border-border py-2.5">
        <label
          className="m-0 block text-left text-base font-medium leading-5 text-color-dark"
          dir={langDir}
          translate="no"
        >
          {t("registration_address")}
        </label>
      </div>
      <div className="flex flex-wrap">
        <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-2">
          <div className="relative w-full">
            <ControlledTextInput
              label={t("address")}
              name="address"
              placeholder={t("address")}
              dir={langDir}
              translate="no"
            />
            <Image
              src="/images/location.svg"
              alt="location-icon"
              height={16}
              width={16}
              className="absolute right-6 top-[24px]"
            />
          </div>

          <ControlledTextInput
            label={t("city")}
            name="city"
            placeholder={t("city")}
            dir={langDir}
            translate="no"
          />
        </div>

        <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-2">
          <ControlledTextInput
            label={t("province")}
            name="province"
            placeholder={t("province")}
            dir={langDir}
            translate="no"
          />

          <ControlledSelectInput
            label={t("country")}
            name="country"
            options={memoizedCountries}
          />
        </div>
      </div>
    </div>
  );
}
