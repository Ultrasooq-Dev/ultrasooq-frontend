import React from "react";
import ControlledRichTextEditor from "@/components/shared/Forms/ControlledRichTextEditor";
import ControlledMarkdownEditor from "@/components/shared/Forms/ControlledMarkdownEditor";
import ControlledTextInput from "@/components/shared/Forms/ControlledTextInput";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useFieldArray, useFormContext } from "react-hook-form";
import AddIcon from "@/public/images/add-icon.svg";
import TrashIcon from "@/public/images/social-delete-icon.svg";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import ControlledNumberInput from "@/components/shared/Forms/ControlledNumberInput";

const DescriptionAndSpecificationSection = () => {
  const t = useTranslations();
  const { langDir } = useAuth();
  const formContext = useFormContext();

  const fieldArrayForSpecification = useFieldArray({
    control: formContext.control,
    name: "productSpecificationList",
  });
  const fieldArrayForFeatures = useFieldArray({
    control: formContext.control,
    name: "features",
  });
  const appendSpecification = () =>
    fieldArrayForSpecification.append({
      label: "",
      specification: "",
    });

  const removeSpecification = (index: number) => fieldArrayForSpecification.remove(index);

  const fieldArrayForVariants = useFieldArray({
    control: formContext.control,
    name: "productVariants",
  });

  const appendVariant = () =>
    fieldArrayForVariants.append({
      value: "",
    });

  const removeVariant = (index: number) => fieldArrayForVariants.remove(index);
  const descriptionError = formContext.formState.errors.description;
  return (
    <div className="flex w-full flex-wrap">
      <h3 dir={langDir} translate="no">{t("description_n_specification")}</h3>
      <div className="mb-3.5 w-full">
        <div className="relative mb-4 w-full">
          <ControlledMarkdownEditor
            label={t("description")}
            name="description"
            height={400}
          />
          <p className="text-red-500 text-sm mt-1">
            {typeof descriptionError?.message === "string" ? descriptionError.message : null}
          </p>
        </div>
        <div className="relative mb-4 w-full">
          <div className="grid w-full grid-cols-1">
            <div>
              <div className="flex w-full items-center justify-between">
                <label className="text-sm font-medium leading-none text-color-dark" dir={langDir} translate="no">
                  {t("service_details")}
                </label>

                <Button
                  type="button"
                  onClick={() =>
                    fieldArrayForFeatures.append({
                      name: "",
                      serviceCostType: "FLAT",
                      serviceCost: "",
                    })
                  }
                  className="flex cursor-pointer items-center bg-transparent p-0 text-sm font-semibold capitalize text-dark-orange shadow-none hover:bg-transparent"
                  dir={langDir}
                  translate="no"
                >
                  <Image src={AddIcon} className="mr-1" alt="add-icon" />
                  <span>{t("add_service")}</span>
                </Button>
              </div>

              {fieldArrayForFeatures.fields.map((field, index) => (
                <div
                  key={field.id}
                  className="relative grid w-full grid-cols-1 gap-5 md:grid-cols-3"
                >
                  {/* Feature Name */}
                  <ControlledTextInput
                    name={`features.${index}.name`}
                    placeholder={t("enter_service_name")}
                    label={t("service_name")}
                    dir={langDir}
                    translate="no"
                  />

                  {/* Service Cost Type */}
                  <div>
                    <label className="text-sm font-medium leading-none text-color-dark" dir={langDir} translate="no">
                      {t("service_cost_type")}
                    </label>
                    <select
                      {...formContext.register(`features.${index}.serviceCostType`)}
                      className="w-full rounded border border-gray-300 p-2"
                    >
                      <option value="FLAT" translate="no">{t("flat")}</option>
                      <option value="HOURLY" translate="no">{t("hourly")}</option>
                    </select>
                  </div>

                  {/* Service Cost */}
                  <ControlledNumberInput
                    name={`features.${index}.serviceCost`}
                    placeholder={t("enter_service_cost")}
                    label={t("service_cost")}
                    type="text"
                    dir={langDir}
                    translate="no"
                  />

                  {/* Remove Button */}
                  {index !== 0 ? (
                    <Button
                      type="button"
                      onClick={() => fieldArrayForFeatures.remove(index)}
                      className="absolute right-2 top-3 mt-5 flex -translate-y-2/4 cursor-pointer items-center bg-transparent p-0 text-sm font-semibold capitalize text-dark-orange shadow-none hover:bg-transparent"
                      dir={langDir}
                    >
                      <Image src={TrashIcon} alt="delete-icon" />
                    </Button>
                  ) : null}
                </div>
              ))}
              {/* <div className="flex w-full items-center justify-between">
                <label className="text-sm font-medium leading-none text-color-dark" dir={langDir} translate="no">
                  {t("specification")}
                </label>

                <Button
                  type="button"
                  onClick={appendSpecification}
                  className="flex cursor-pointer items-center bg-transparent p-0 text-sm font-semibold capitalize text-dark-orange shadow-none hover:bg-transparent"
                  dir={langDir}
                  translate="no"
                >
                  <Image src={AddIcon} className="mr-1" alt="add-icon" />
                  <span>{t("add_specification")}</span>
                </Button>
              </div>

              {fieldArrayForSpecification.fields.map((field, index) => (
                <div
                  key={field.id}
                  className="relative grid w-full grid-cols-1 gap-5 md:grid-cols-2"
                >
                  <ControlledTextInput
                    name={`productSpecificationList.${index}.label`}
                    placeholder={t("enter_label")}
                    label={t("label")}
                    dir={langDir}
                    translate="no"
                  />

                  <ControlledTextInput
                    name={`productSpecificationList.${index}.specification`}
                    placeholder={t("enter_value")}
                    label={t("value")}
                    dir={langDir}
                    translate="no"
                  />

                  {index !== 0 ? (
                    <Button
                      type="button"
                      onClick={() => removeSpecification(index)}
                      className="absolute right-2 top-3 mt-5 flex -translate-y-2/4 cursor-pointer items-center bg-transparent p-0 text-sm font-semibold capitalize text-dark-orange shadow-none hover:bg-transparent"
                      dir={langDir}
                    >
                      <Image src={TrashIcon} alt="social-delete-icon" />
                    </Button>
                  ) : null}
                </div>
              ))} */}

              {/* <div className="w-full mt-2">
                <label className="text-sm font-medium leading-none text-color-dark" dir={langDir} translate="no">
                  {t("variant_type")}
                </label>
                <ControlledTextInput
                  name={`productVariantType`}
                  label={t("variant_type")}
                  dir={langDir}
                  translate="no"
                />
              </div>

              <div className="flex w-full items-center justify-between">
                <label className="text-sm font-medium leading-none text-color-dark" dir={langDir} translate="no">
                  {t("variants")}
                </label>

                <Button
                  type="button"
                  onClick={appendVariant}
                  className="flex cursor-pointer items-center bg-transparent p-0 text-sm font-semibold capitalize text-dark-orange shadow-none hover:bg-transparent"
                  dir={langDir}
                  translate="no"
                >
                  <Image src={AddIcon} className="mr-1" alt="add-icon" />
                  <span>{t("add_variant")}</span>
                </Button>
              </div>

              {fieldArrayForVariants.fields.map((field, index) => (
                <div
                  key={field.id}
                  className="relative grid w-full grid-cols-1 gap-5 md:grid-cols-2"
                >
                  <ControlledTextInput
                    name={`productVariants.${index}.value`}
                    placeholder={t("enter_value")}
                    label={t("value")}
                    dir={langDir}
                    translate="no"
                  />

                  {index !== 0 ? (
                    <Button
                      type="button"
                      onClick={() => removeVariant(index)}
                      className="absolute right-2 top-3 mt-5 flex -translate-y-2/4 cursor-pointer items-center bg-transparent p-0 text-sm font-semibold capitalize text-dark-orange shadow-none hover:bg-transparent"
                      dir={langDir}
                    >
                      <Image src={TrashIcon} alt="social-delete-icon" />
                    </Button>
                  ) : null}
                </div>
              ))} */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DescriptionAndSpecificationSection;
