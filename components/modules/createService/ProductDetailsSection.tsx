import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import CustomFieldContent from "@/components/shared/CustomFieldContent";
import { Input } from "@/components/ui/input";
import { v4 as uuidv4 } from "uuid";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import ControlledTextInput from "@/components/shared/Forms/ControlledTextInput";
import ControlledTextareaInput from "@/components/shared/Forms/ControlledTextareaInput";
import ControlledDatePicker from "@/components/shared/Forms/ControlledDatePicker";
import ControlledSelectInput from "@/components/shared/Forms/ControlledSelectInput";
import SelectInput from "@/components/shared/SelectInput";
import { INPUT_TYPE_LIST, SIZE_LIST } from "@/utils/constants";
import ControlledRadioInput from "@/components/shared/Forms/ControlledRadioInput";
import ControlledCheckboxInput from "@/components/shared/Forms/ControlledCheckboxInput";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";

type ProductDetailsSectionProps = Record<string, never>;

type Field = {
  key: string;
  type: string;
  field: React.JSX.Element;
  size?: string;
  isRequired?: boolean;
};

const ProductDetailsSection: React.FC<ProductDetailsSectionProps> = () => {
  const t = useTranslations();
  const { langDir } = useAuth();
  const [selectOption, setSelectOption] = useState<string>();
  const [isCustomFieldModalOpen, setIsCustomFieldModalOpen] = useState(false);
  const [customfields, setCustomFields] = useState<Field[]>([]);
  const [customFieldType, setCustomFieldType] = useState<{
    type: string;
    key: string | undefined;
  }>();

  const handleToggleCustomFieldModal = () => {
    setIsCustomFieldModalOpen(!isCustomFieldModalOpen);
  };

  const deleteCustomField = (key: string) => {
    setCustomFields(customfields.filter((item) => item.key !== key));
    setCustomFieldType(undefined);
  };

  const handleCustomFields = (type: string) => {
    const tempArr: Field[] = [];

    switch (type) {
      case "text":
        tempArr.push({
          key: uuidv4(),
          type: "text",
          field: (
            <ControlledTextInput
              key={uuidv4()}
              label="Input Name"
              name="textInput"
              placeholder="Write Here..."
            />
          ),
        });
        break;
      case "textarea":
        tempArr.push({
          key: uuidv4(),
          type: "textarea",
          field: (
            <ControlledTextareaInput
              key={uuidv4()}
              label="Input Name"
              name="textarea"
              placeholder="Write Here..."
              rows={6}
            />
          ),
        });
        break;
      case "dropdown":
        tempArr.push({
          key: uuidv4(),
          type: "dropdown",
          field: (
            <ControlledSelectInput
              key={uuidv4()}
              label="Input Name"
              name="select"
              options={[]}
            />
          ),
        });
        break;
      case "checkbox":
        tempArr.push({
          key: uuidv4(),
          type: "checkbox",
          field: (
            <ControlledCheckboxInput
              key={uuidv4()}
              label="Input Name"
              name="checkbox"
              options={[]}
            />
          ),
        });
        break;
      case "radio":
        tempArr.push({
          key: uuidv4(),
          type: "radio",
          field: (
            <ControlledRadioInput
              key={uuidv4()}
              label="Input Name"
              name="radio"
              options={[]}
            />
          ),
        });
        break;
      case "date":
        tempArr.push({
          key: uuidv4(),
          type: "date",
          field: (
            <ControlledDatePicker
              key={uuidv4()}
              label="Input Name"
              name="datePicker"
            />
          ),
        });

        break;
      default:
        break;
    }
    setCustomFields((prevState) => [...prevState, ...tempArr]);
  };

  const handleRequiredField = (e: boolean) => {
    const updatedTempCustomFields: Field[] = customfields.map((item) => {
      if (item.key === customFieldType?.key) {
        return { ...item, isRequired: e };
      }

      return item;
    });

    setCustomFields(updatedTempCustomFields);
  };

  const handleItemSize = (e: string) => {
    const updatedTempCustomFields: Field[] = customfields.map((item) => {
      if (item.key === customFieldType?.key) {
        return { ...item, size: e };
      }

      return item;
    });

    setCustomFields(updatedTempCustomFields);
  };

  const handleItemInputType = (e: string) => {
    const fieldIndex = customfields.findIndex(
      (item) => item.key === customFieldType?.key && item.type === "text",
    );

    if (fieldIndex !== -1) {
      const tempFields = [...customfields];

      tempFields[fieldIndex] = {
        ...tempFields[fieldIndex],
        field: (
          <ControlledTextInput
            key={tempFields[fieldIndex].key}
            label={tempFields[fieldIndex].field.props.label || "Enter Label"}
            name={tempFields[fieldIndex].field.props.name || "customFields"}
            placeholder={
              tempFields[fieldIndex].field.props.placeholder ||
              "Enter Placeholder"
            }
            type={e}
          />
        ),
      };

      setCustomFields(tempFields);
    }
  };

  return (
    <div className="mx-auto grid  w-full max-w-[950px] grid-cols-4 gap-x-5">
      <div className="col-span-4 mb-3 w-full rounded-lg border border-solid border-border bg-card p-2 shadow-xs sm:p-3 lg:p-4">
        <div className="flex w-full flex-wrap">
          <div className="form-groups-common-sec-s1">
            <h3 dir={langDir} translate="no">{t("product_details")}</h3>

            <div className="mb-3.5 w-full">
              <div className="flex flex-wrap">
                {customfields.map((item) => (
                  <div
                    key={uuidv4()}
                    className={cn(
                      "relative my-2 flex w-full items-start px-2",
                      item.size === "small" ? "w-1/2" : "",
                      customFieldType?.key === item.key ? "bg-[#F9F9F9]" : "",
                    )}
                  >
                    <div className="w-full flex-1 py-2 text-left">
                      {item.field}
                    </div>

                    <div className="absolute right-0 flex gap-x-2">
                      <button
                        type="button"
                        onClick={() =>
                          setCustomFieldType({ type: item.type, key: item.key })
                        }
                        className="flex cursor-pointer items-center bg-transparent p-0 text-sm font-semibold capitalize text-dark-orange shadow-none hover:bg-transparent"
                      >
                        <Image
                          src="/images/edit-pencil.png"
                          height={24}
                          width={24}
                          alt="edit-icon"
                        />
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteCustomField(item.key)}
                        className="flex cursor-pointer items-center bg-transparent p-0 text-sm font-semibold capitalize text-dark-orange shadow-none hover:bg-transparent"
                      >
                        <Image
                          src="/images/remove-pencil.png"
                          height={23}
                          width={23}
                          alt="remove-icon"
                        />
                      </button>
                    </div>
                  </div>
                ))}

                <div className="relative w-full">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={handleToggleCustomFieldModal}
                    className="border-0 text-sm font-semibold capitalize text-dark-orange shadow-none hover:text-dark-orange"
                    dir={langDir}
                    translate="no"
                  >
                    <Image
                      src="/images/plus-orange.png"
                      className="mr-2"
                      alt="plus-orange-icon"
                      height={14}
                      width={14}
                    />
                    {t("add_custom_field")}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <Dialog
            open={isCustomFieldModalOpen}
            onOpenChange={handleToggleCustomFieldModal}
          >
            <DialogContent className="gap-0 p-0">
              <CustomFieldContent
                setFieldType={handleCustomFields}
                onClose={handleToggleCustomFieldModal}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="col-span-1 w-full">
        {customFieldType?.type === "text" ? (
          <Card className="w-full pt-6">
            <CardContent>
              <div className="mb-4 space-y-2">
                <Label className="text-sm font-normal" dir={langDir} translate="no">{t("label")}</Label>
                <Input
                  onChange={(e) => {
                    const fieldIndex = customfields.findIndex(
                      (item) =>
                        item.key === customFieldType?.key &&
                        item.type === "text",
                    );

                    if (fieldIndex !== -1) {
                      const tempFields = [...customfields];

                      tempFields[fieldIndex] = {
                        ...tempFields[fieldIndex],
                        field: (
                          <ControlledTextInput
                            key={tempFields[fieldIndex].key}
                            label={e.target.value || t("enter_label")}
                            name={
                              tempFields[fieldIndex].field.props.name ||
                              "customFields"
                            }
                            placeholder={
                              tempFields[fieldIndex].field.props.placeholder ||
                              "Enter Placeholder"
                            }
                          />
                        ),
                      };
                      setCustomFields(tempFields);
                    }
                  }}
                  defaultValue={
                    customfields.filter(
                      (item) => item.key === customFieldType?.key,
                    )?.[0]?.field?.props?.label || t("enter_label")
                  }
                  translate="no"
                />
              </div>

              <div className="mb-4 mr-4 flex flex-row items-start space-x-3 space-y-0">
                <Checkbox
                  className="border border-solid border-border data-[state=checked]:bg-dark-orange!"
                  onCheckedChange={handleRequiredField}
                />
                <Label className="text-sm font-normal" dir={langDir} translate="no">{t("required")}</Label>
              </div>

              <div className="mb-4 flex w-full flex-col gap-y-2">
                <Label dir={langDir} translate="no">{t("size")}</Label>
                <SelectInput
                  label={t("size")}
                  options={SIZE_LIST}
                  onValueChange={handleItemSize}
                />
              </div>

              <div className="mb-4 flex w-full flex-col gap-y-2">
                <Label dir={langDir} translate="no">{t("input_type")}</Label>
                <SelectInput
                  label={t("input_type")}
                  options={INPUT_TYPE_LIST}
                  onValueChange={handleItemInputType}
                />
              </div>

              <div className="mb-4 space-y-2">
                <Label className="text-sm font-normal" dir={langDir} translate="no">{t("placeholder")}</Label>
                <Input
                  onChange={(e) => {
                    const fieldIndex = customfields.findIndex(
                      (item) =>
                        item.key === customFieldType?.key &&
                        item.type === "text",
                    );

                    if (fieldIndex !== -1) {
                      const tempFields = [...customfields];

                      tempFields[fieldIndex] = {
                        ...tempFields[fieldIndex],
                        field: (
                          <ControlledTextInput
                            key={tempFields[fieldIndex].key}
                            label={
                              tempFields[fieldIndex].field.props.label ||
                              "Enter Label"
                            }
                            name={
                              tempFields[fieldIndex].field.props.name ||
                              "customFields"
                            }
                            placeholder={e.target.value}
                          />
                        ),
                      };

                      setCustomFields(tempFields);
                    }
                  }}
                  defaultValue={
                    customfields.filter(
                      (item) => item.key === customFieldType?.key,
                    )?.[0]?.field?.props?.placeholder || t("enter_label")
                  }
                  translate="no"
                />
              </div>
            </CardContent>
          </Card>
        ) : customFieldType?.type === "textarea" ? (
          <Card className="w-full pt-6">
            <CardContent>
              <div className="mb-4 space-y-2">
                <Label className="text-sm font-normal" dir={langDir} translate="no">{t("label")}</Label>
                <Input
                  onChange={(e) => {
                    const fieldIndex = customfields.findIndex(
                      (item) =>
                        item.key === customFieldType?.key &&
                        item.type === "textarea",
                    );

                    if (fieldIndex !== -1) {
                      const tempFields = [...customfields];

                      tempFields[fieldIndex] = {
                        ...tempFields[fieldIndex],
                        field: (
                          <ControlledTextareaInput
                            key={tempFields[fieldIndex].key}
                            label={e.target.value || t("enter_label")}
                            name={
                              tempFields[fieldIndex].field.props.name ||
                              "customFields"
                            }
                            placeholder={
                              tempFields[fieldIndex].field.props.placeholder ||
                              t("enter_placeholder")
                            }
                          />
                        ),
                      };
                      setCustomFields(tempFields);
                    }
                  }}
                  defaultValue={
                    customfields.filter(
                      (item) => item.key === customFieldType?.key,
                    )?.[0]?.field?.props?.label || t("enter_label")
                  }
                  translate="no"
                />
              </div>

              <div className="mb-4 mr-4 flex flex-row items-start space-x-3 space-y-0">
                <Checkbox
                  className="border border-solid border-border data-[state=checked]:bg-dark-orange!"
                  onCheckedChange={handleRequiredField}
                />
                <Label className="text-sm font-normal">Required</Label>
              </div>

              <div className="mb-4 flex w-full flex-col gap-y-2">
                <Label dir={langDir} translate="no">{t("size")}</Label>
                <SelectInput
                  label={t("size")}
                  options={SIZE_LIST}
                  onValueChange={handleItemSize}
                />
              </div>

              <div className="mb-4 space-y-2">
                <Label className="text-sm font-normal" dir={langDir} translate="no">{t("placeholder")}</Label>
                <Input
                  onChange={(e) => {
                    const fieldIndex = customfields.findIndex(
                      (item) =>
                        item.key === customFieldType?.key &&
                        item.type === "textarea",
                    );

                    if (fieldIndex !== -1) {
                      const tempFields = [...customfields];

                      tempFields[fieldIndex] = {
                        ...tempFields[fieldIndex],
                        field: (
                          <ControlledTextareaInput
                            key={tempFields[fieldIndex].key}
                            label={
                              tempFields[fieldIndex].field.props.label ||
                              "Enter Label"
                            }
                            name={
                              tempFields[fieldIndex].field.props.name ||
                              "customFields"
                            }
                            placeholder={e.target.value}
                          />
                        ),
                      };

                      setCustomFields(tempFields);
                    }
                  }}
                />
              </div>
            </CardContent>
          </Card>
        ) : customFieldType?.type === "dropdown" ? (
          <Card className="w-full pt-6">
            <CardContent>
              <div className="mb-4 space-y-2">
                <Label className="text-sm font-normal" dir={langDir} translate="no">{t("label")}</Label>
                <Input
                  onChange={(e) => {
                    const fieldIndex = customfields.findIndex(
                      (item) =>
                        item.key === customFieldType?.key &&
                        item.type === "dropdown",
                    );

                    if (fieldIndex !== -1) {
                      const tempFields = [...customfields];

                      tempFields[fieldIndex] = {
                        ...tempFields[fieldIndex],
                        field: (
                          <ControlledSelectInput
                            key={tempFields[fieldIndex].key}
                            label={e.target.value || t("enter_label")}
                            name={
                              tempFields[fieldIndex].field.props.name ||
                              "customFields"
                            }
                            options={tempFields[fieldIndex].field.props.options}
                          />
                        ),
                      };
                      setCustomFields(tempFields);
                    }
                  }}
                  translate="no"
                />
              </div>

              <div className="mb-4 mr-4 flex flex-row items-start space-x-3 space-y-0">
                <Checkbox
                  className="border border-solid border-border data-[state=checked]:bg-dark-orange!"
                  onCheckedChange={handleRequiredField}
                />
                <Label className="text-sm font-normal" dir={langDir} translate="no">{t("required")}</Label>
              </div>

              <div className="mb-4 flex w-full flex-col gap-y-2">
                <Label dir={langDir} translate="no">{t("size")}</Label>
                <SelectInput
                  label={t("size")}
                  options={SIZE_LIST}
                  onValueChange={handleItemSize}
                />
              </div>

              <div className="mb-4 flex flex-row">
                <Input
                  className="rounded-none"
                  onChange={(e) => setSelectOption(e.target.value)}
                  value={selectOption}
                />
                <Button
                  type="button"
                  className="rounded-none bg-dark-orange"
                  onClick={() => {
                    const tempList: { label?: string, value?: string }[] = [];
                    tempList.push({ label: selectOption, value: uuidv4() });

                    const fieldIndex = customfields.findIndex((item) => item.key === customFieldType?.key && item.type === "dropdown",);

                    if (fieldIndex !== -1) {
                      const tempFields = [...customfields];
                      tempFields[fieldIndex] = {
                        ...tempFields[fieldIndex],
                        field: (
                          <ControlledSelectInput
                            key={tempFields[fieldIndex].key}
                            label={
                              tempFields[fieldIndex].field.props.label ||
                              "Enter Label"
                            }
                            name={
                              tempFields[fieldIndex].field.props.name ||
                              "customFields"
                            }
                            options={[
                              ...tempFields[fieldIndex].field.props.options,
                              ...tempList,
                            ]}
                          />
                        ),
                      };

                      setCustomFields(tempFields);
                      setSelectOption("");
                    }
                  }}
                  dir={langDir}
                  translate="no"
                >
                  {t("add")}
                </Button>
              </div>
              <div>
                <ul>
                  {customfields.map((item) => {
                    if (
                      item.key === customFieldType?.key &&
                      item.type === "dropdown"
                    ) {
                      return item.field.props.options.map(
                        (
                          item: { label: string; value: string },
                          index: number,
                        ) => (
                          <li key={index}>
                            <Card className="mb-2 flex items-center justify-between rounded-sm bg-muted p-3">
                              {item.label}
                              <div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const fieldIndex = customfields.findIndex(
                                      (item) =>
                                        item.key === customFieldType?.key &&
                                        item.type === "dropdown",
                                    );

                                    if (fieldIndex !== -1) {
                                      const tempFields = [...customfields];
                                      tempFields[fieldIndex] = {
                                        ...tempFields[fieldIndex],
                                        field: (
                                          <ControlledSelectInput
                                            key={tempFields[fieldIndex].key}
                                            label={
                                              tempFields[fieldIndex].field.props
                                                .label || "Enter Label"
                                            }
                                            name={
                                              tempFields[fieldIndex].field.props
                                                .name || "customFields"
                                            }
                                            options={[
                                              ...tempFields[
                                                fieldIndex
                                              ].field.props.options.filter(
                                                (option: {
                                                  label: string;
                                                  value: string;
                                                }) =>
                                                  option.value !== item.value,
                                              ),
                                            ]}
                                          />
                                        ),
                                      };

                                      setCustomFields(tempFields);
                                    }
                                  }}
                                  className="flex cursor-pointer items-center bg-transparent p-0 text-sm font-semibold capitalize text-dark-orange shadow-none hover:bg-transparent"
                                >
                                  <Image
                                    src="/images/social-delete-icon.svg"
                                    height={35}
                                    width={35}
                                    alt="social-delete-icon"
                                  />
                                </button>
                              </div>
                            </Card>
                          </li>
                        ),
                      );
                    }
                  })}
                </ul>
              </div>
            </CardContent>
          </Card>
        ) : customFieldType?.type === "checkbox" ? (
          <Card className="w-full pt-6">
            <CardContent>
              <div className="mb-4 space-y-2">
                <Label className="text-sm font-normal" dir={langDir} translate="no">{t("label")}</Label>
                <Input
                  onChange={(e) => {
                    const fieldIndex = customfields.findIndex(
                      (item) =>
                        item.key === customFieldType?.key &&
                        item.type === "checkbox",
                    );

                    if (fieldIndex !== -1) {
                      const tempFields = [...customfields];

                      tempFields[fieldIndex] = {
                        ...tempFields[fieldIndex],
                        field: (
                          <ControlledCheckboxInput
                            key={tempFields[fieldIndex].key}
                            label={e.target.value || t("enter_label")}
                            name={
                              tempFields[fieldIndex].field.props.name ||
                              "customFields"
                            }
                            options={tempFields[fieldIndex].field.props.options}
                          />
                        ),
                      };
                      setCustomFields(tempFields);
                    }
                  }}
                  translate="no"
                />
              </div>

              <div className="mb-4 mr-4 flex flex-row items-start space-x-3 space-y-0">
                <Checkbox
                  className="border border-solid border-border data-[state=checked]:bg-dark-orange!"
                  onCheckedChange={handleRequiredField}
                />
                <Label className="text-sm font-normal" dir={langDir} translate="no">{t("required")}</Label>
              </div>

              <div className="mb-4 flex flex-row">
                <Input
                  className="rounded-none"
                  onChange={(e) => setSelectOption(e.target.value)}
                  value={selectOption}
                />
                <Button
                  type="button"
                  className="rounded-none bg-dark-orange"
                  onClick={() => {
                    const tempList: { label?: string, value?: string }[] = [];
                    tempList.push({ label: selectOption, value: uuidv4() });

                    const fieldIndex = customfields.findIndex(
                      (item) =>
                        item.key === customFieldType?.key &&
                        item.type === "checkbox",
                    );

                    if (fieldIndex !== -1) {
                      const tempFields = [...customfields];
                      tempFields[fieldIndex] = {
                        ...tempFields[fieldIndex],
                        field: (
                          <ControlledCheckboxInput
                            key={tempFields[fieldIndex].key}
                            label={
                              tempFields[fieldIndex].field.props.label ||
                              "Enter Label"
                            }
                            name={
                              tempFields[fieldIndex].field.props.name ||
                              "customFields"
                            }
                            options={[
                              ...tempFields[fieldIndex].field.props.options,
                              ...tempList,
                            ]}
                          />
                        ),
                      };

                      setCustomFields(tempFields);
                      setSelectOption("");
                    }
                  }}
                >
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : customFieldType?.type === "radio" ? (
          <Card className="w-full pt-6">
            <CardContent>
              <div className="mb-4 space-y-2">
                <Label className="text-sm font-normal" dir={langDir} translate="no">{t("label")}</Label>
                <Input
                  onChange={(e) => {
                    const fieldIndex = customfields.findIndex(
                      (item) =>
                        item.key === customFieldType?.key &&
                        item.type === "radio",
                    );

                    if (fieldIndex !== -1) {
                      const tempFields = [...customfields];

                      tempFields[fieldIndex] = {
                        ...tempFields[fieldIndex],
                        field: (
                          <ControlledRadioInput
                            key={tempFields[fieldIndex].key}
                            label={e.target.value || "Enter Label"}
                            name={
                              tempFields[fieldIndex].field.props.name ||
                              "customFields"
                            }
                            options={tempFields[fieldIndex].field.props.options}
                          />
                        ),
                      };
                      setCustomFields(tempFields);
                    }
                  }}
                />
              </div>

              <div className="mb-4 mr-4 flex flex-row items-start space-x-3 space-y-0">
                <Checkbox
                  className="border border-solid border-border data-[state=checked]:bg-dark-orange!"
                  onCheckedChange={handleRequiredField}
                />
                <Label className="text-sm font-normal" dir={langDir} translate="no">{t("required")}</Label>
              </div>

              <div className="mb-4 flex flex-row">
                <Input
                  className="rounded-none"
                  onChange={(e) => setSelectOption(e.target.value)}
                  value={selectOption}
                />
                <Button
                  type="button"
                  className="rounded-none bg-dark-orange"
                  onClick={() => {
                    const tempList: { label?: string, value?: string }[] = [];
                    tempList.push({ label: selectOption, value: uuidv4() });

                    const fieldIndex = customfields.findIndex(
                      (item) =>
                        item.key === customFieldType?.key &&
                        item.type === "radio",
                    );

                    if (fieldIndex !== -1) {
                      const tempFields = [...customfields];
                      tempFields[fieldIndex] = {
                        ...tempFields[fieldIndex],
                        field: (
                          <ControlledRadioInput
                            key={tempFields[fieldIndex].key}
                            label={
                              tempFields[fieldIndex].field.props.label ||
                              "Enter Label"
                            }
                            name={
                              tempFields[fieldIndex].field.props.name ||
                              "customFields"
                            }
                            options={[
                              ...tempFields[fieldIndex].field.props.options,
                              ...tempList,
                            ]}
                          />
                        ),
                      };

                      setCustomFields(tempFields);
                      setSelectOption("");
                    }
                  }}
                  dir={langDir}
                  translate="no"
                >
                  {t("add")}
                </Button>
              </div>
              <div>
                <ul>
                  {customfields.map((item) => {
                    if (
                      item.key === customFieldType?.key &&
                      item.type === "radio"
                    ) {
                      return item.field.props.options.map(
                        (
                          item: { label: string; value: string },
                          index: number,
                        ) => (
                          <li key={index}>
                            <Card className="mb-2 flex items-center justify-between rounded-sm bg-muted p-3">
                              {item.label}
                              <div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const fieldIndex = customfields.findIndex(
                                      (item) =>
                                        item.key === customFieldType?.key &&
                                        item.type === "radio",
                                    );

                                    if (fieldIndex !== -1) {
                                      const tempFields = [...customfields];
                                      tempFields[fieldIndex] = {
                                        ...tempFields[fieldIndex],
                                        field: (
                                          <ControlledRadioInput
                                            key={tempFields[fieldIndex].key}
                                            label={
                                              tempFields[fieldIndex].field.props
                                                .label || t("enter_label")
                                            }
                                            name={
                                              tempFields[fieldIndex].field.props
                                                .name || "customFields"
                                            }
                                            options={[
                                              ...tempFields[
                                                fieldIndex
                                              ].field.props.options.filter(
                                                (option: {
                                                  label: string;
                                                  value: string;
                                                }) =>
                                                  option.value !== item.value,
                                              ),
                                            ]}
                                          />
                                        ),
                                      };

                                      setCustomFields(tempFields);
                                    }
                                  }}
                                  className="flex cursor-pointer items-center bg-transparent p-0 text-sm font-semibold capitalize text-dark-orange shadow-none hover:bg-transparent"
                                >
                                  <Image
                                    src="/images/social-delete-icon.svg"
                                    height={35}
                                    width={35}
                                    alt="social-delete-icon"
                                  />
                                </button>
                              </div>
                            </Card>
                          </li>
                        ),
                      );
                    }
                  })}
                </ul>
              </div>
            </CardContent>
          </Card>
        ) : customFieldType?.type === "date" ? (
          <Card className="w-full pt-6">
            <CardContent>
              <div className="mb-4 space-y-2">
                <Label className="text-sm font-normal" dir={langDir} translate="no">{t("label")}</Label>
                <Input
                  onChange={(e) => {
                    const fieldIndex = customfields.findIndex(
                      (item) =>
                        item.key === customFieldType?.key &&
                        item.type === "date",
                    );

                    if (fieldIndex !== -1) {
                      const tempFields = [...customfields];

                      tempFields[fieldIndex] = {
                        ...tempFields[fieldIndex],
                        field: (
                          <ControlledDatePicker
                            key={tempFields[fieldIndex].key}
                            label={e.target.value || t("enter_label")}
                            name={
                              tempFields[fieldIndex].field.props.name ||
                              "customFields"
                            }
                          />
                        ),
                      };
                      setCustomFields(tempFields);
                    }
                  }}
                  translate="no"
                />
              </div>

              <div className="mb-4 mr-4 flex flex-row items-start space-x-3 space-y-0">
                <Checkbox
                  className="border border-solid border-border data-[state=checked]:bg-dark-orange!"
                  onCheckedChange={handleRequiredField}
                />
                <Label className="text-sm font-normal" dir={langDir} translate="no">{t("required")}</Label>
              </div>

              <div className="mb-4 flex w-full flex-col gap-y-2">
                <Label dir={langDir} translate="no">{t("size")}</Label>
                <SelectInput
                  label={t("size")}
                  options={SIZE_LIST}
                  onValueChange={handleItemSize}
                />
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
};

export default ProductDetailsSection;
