import React from "react";
import { Button } from "@/components/ui/button";
import ControlledTextInput from "@/components/shared/Forms/ControlledTextInput";
import Image from "next/image";
import AddIcon from "@/public/images/add-icon.svg";
import TrashIcon from "@/public/images/social-delete-icon.svg";
import { useFieldArray, useFormContext } from "react-hook-form";
import ControlledRichTextEditor from "@/components/shared/Forms/ControlledRichTextEditor";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";

const DescriptionSection = () => {
  const t = useTranslations();
  const { langDir } = useAuth();
  const formContext = useFormContext();

  const fieldArrayForShortDescription = useFieldArray({
    control: formContext.control,
    name: "productShortDescriptionList",
  });

  const appendShortDescription = () =>
    fieldArrayForShortDescription.append({
      shortDescription: "",
    });

  const removeShortDescription = (index: number) =>
    fieldArrayForShortDescription.remove(index);

  return (
    <div className="form-groups-common-sec-s1">
      <h3 dir={langDir} translate="no">{t("description")}</h3>
      <div className="grid w-full grid-cols-1">
        <div>
          <div className="flex w-full items-center justify-between">
            <label className="text-sm font-medium leading-none text-color-dark" dir={langDir} translate="no">
              {t("short_description")}
            </label>

            <Button
              type="button"
              onClick={appendShortDescription}
              className="flex cursor-pointer items-center bg-transparent p-0 text-sm font-semibold capitalize text-dark-orange shadow-none hover:bg-transparent"
              dir={langDir}
              translate="no"
            >
              <Image src={AddIcon} className="mr-1" alt="add-icon" />
              <span>{t("add_short_description")}</span>
            </Button>
          </div>

          {fieldArrayForShortDescription.fields.map((field, index) => (
            <div key={field.id} className="relative w-full">
              <div className="relative mb-4 w-full">
                <ControlledRichTextEditor
                  key={field.id}
                  label=""
                  name={`productShortDescriptionList.${index}.shortDescription`}
                  onChange={(e) => {
                    formContext.setValue(`productShortDescriptionList.${index}.shortDescription`, e?.[0]?.children?.[0]?.text || '');
                  }}
                  value={
                    formContext.getValues()?.productShortDescriptionList?.[index]?.shortDescriptionJson
                  }
                />
                <p className="text-[13px] font-medium text-destructive" dir={langDir}>
                  {/* @ts-ignore */}
                  {formContext?.formState?.errors?.productShortDescriptionList?.[index]?.shortDescription?.message || ''}
                </p>
              </div>

              {index !== 0 ? (
                <Button
                  type="button"
                  onClick={() => removeShortDescription(index)}
                  className="absolute right-2 top-6 flex -translate-y-2/4 cursor-pointer items-center bg-transparent p-0 text-sm font-semibold capitalize text-dark-orange shadow-none hover:bg-transparent"
                >
                  <Image src={TrashIcon} alt="social-delete-icon" />
                </Button>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DescriptionSection;
