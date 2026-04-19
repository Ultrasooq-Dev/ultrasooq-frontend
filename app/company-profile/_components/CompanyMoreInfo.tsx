"use client";
import React from "react";
import { useTranslations } from "next-intl";
import { NO_OF_EMPLOYEES_LIST } from "@/utils/constants";
import ControlledSelectInput from "@/components/shared/Forms/ControlledSelectInput";
import ControlledRichTextEditor from "@/components/shared/Forms/ControlledRichTextEditor";
import { CompanyMoreInfoProps } from "./types";

export default function CompanyMoreInfo({ langDir, memoizedLastTwoHundredYears }: CompanyMoreInfoProps) {
  const t = useTranslations();

  return (
    <div className="mb-5 w-full">
      <div className="mb-4 w-full border-y border-solid border-border py-2.5">
        <label
          className="m-0 block text-left text-base font-medium leading-5 text-color-dark"
          dir={langDir}
          translate="no"
        >
          {t("more_information")}
        </label>
      </div>

      <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-2">
        {/* TODO: fix submit value type */}
        <ControlledSelectInput
          label={t("year_of_establishment")}
          name="yearOfEstablishment"
          options={memoizedLastTwoHundredYears?.map((item: any) => ({
            label: item?.toString(),
            value: item?.toString(),
          }))}
        />

        <ControlledSelectInput
          label={t("total_no_of_employees")}
          name="totalNoOfEmployee"
          options={NO_OF_EMPLOYEES_LIST}
        />
      </div>

      <ControlledRichTextEditor
        label={t("about_us")}
        name="aboutUsJson"
      />
    </div>
  );
}
