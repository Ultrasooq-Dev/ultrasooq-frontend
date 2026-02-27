import AccordionMultiSelectV2 from "@/components/shared/AccordionMultiSelectV2";
import { FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import Image from "next/image";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
// import { useUploadFile } from "@/apis/queries/upload.queries";
import {
  // useCategories,
  useCategory,
  useSubCategoryById,
} from "@/apis/queries/category.queries";
import { fetchSubCategoriesById } from "@/apis/requests/category.requests";
import BrandSelect from "@/components/shared/BrandSelect";
import ControlledTextInput from "@/components/shared/Forms/ControlledTextInput";
import { useAuth } from "@/context/AuthContext";
import CloseWhiteIcon from "@/public/images/close-white.svg";
import { PRODUCT_CONDITION_LIST } from "@/utils/constants";
import { isImage, isVideo } from "@/utils/helper";
import { ISelectOptions } from "@/utils/types/common.types";
import { useTranslations } from "next-intl";
import ReactPlayer from "react-player";
import ReactSelect from "react-select";
import { v4 as uuidv4 } from "uuid";
import DescriptionSection from "../createProduct/DescriptionSection";
import DynamicFormViewSection from "../createProduct/DynamicFormViewSection";
import PriceSection from "../createProduct/PriceSection";
import AddImageContent from "../profile/AddImageContent";

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

type ProductImageProps = {
  path: string;
  id: string;
};

type BasicInformationProps = {
  tagsList: any;
  isEditable?: boolean;
  activeProductType?: string;
  hasId?: boolean;
};

const BasicInformationSection: React.FC<BasicInformationProps> = ({
  tagsList,
  isEditable,
  activeProductType,
  hasId,
}) => {
  const formContext = useFormContext();
  const t = useTranslations();
  const { langDir } = useAuth();
  const { toast } = useToast();
  const photosRef = useRef<HTMLInputElement>(null);
  const [listIds, setListIds] = useState<string[]>([]);
  const [catList, setCatList] = useState<any[]>([]);
  const [currentId, setCurrentId] = useState<string>("");
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // const upload = useUploadFile();
  const categoryQuery = useCategory();
  const subCategoryById = useSubCategoryById(currentId, !!currentId);

  const watchProductImages = formContext.watch("productImages");

  const memoizedCategories = useMemo(() => {
    return (
      categoryQuery?.data?.data?.children.map((item: any) => {
        return { label: item.name, value: item.id };
      }) || []
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryQuery?.data?.data?.children?.length]);

  const handleEditPreviewImage = (id: string, item: FileList) => {
    const tempArr = watchProductImages || [];
    const filteredFormItem = tempArr.filter(
      (item: ProductImageProps) => item.id === id,
    );
    if (filteredFormItem.length) {
      filteredFormItem[0].path = item[0];
      formContext.setValue("productImages", [...tempArr]);
    }
  };

  const handleRemovePreviewImage = (id: string) => {
    formContext.setValue("productImages", [
      ...(watchProductImages || []).filter(
        (item: ProductImageProps) => item.id !== id,
      ),
    ]);
  };

  useEffect(() => {
    if (catList[currentIndex]) {
      let tempList = catList;
      if (subCategoryById.data?.data?.children?.length) {
        tempList[currentIndex] = subCategoryById.data?.data;
        tempList = tempList.slice(0, currentIndex + 1);
      }
      setCatList([...tempList]);
      return;
    }

    if (subCategoryById.data?.data?.children?.length) {
      setCatList([...catList, subCategoryById.data?.data]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId, subCategoryById.data?.data?.children?.length, currentIndex]);

  useEffect(() => {
    if (formContext.getValues("categoryLocation")) {
      const tempArr = formContext.getValues("categoryLocation")?.split(",");
      const promises = tempArr
        .slice(0, tempArr.length - 1)
        .map(async (categoryId: string) => {
          const res = await fetchSubCategoriesById({ categoryId });
          return res.data?.data;
        });
      Promise.all(promises).then((values) => {
        setListIds(tempArr);
        setCatList(values);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditable]);

  useEffect(
    () => formContext.setValue("categoryId", Number(currentId)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentId],
  );

  useEffect(
    () => formContext.setValue("categoryLocation", listIds.join(",")),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [listIds?.length],
  );

  return (
    <>
      <div className="grid w-full grid-cols-4 gap-x-5">
        <div className="col-span-4 mx-auto mb-3 w-full max-w-[950px] rounded-lg border border-solid border-border bg-card p-6 shadow-xs sm:p-4 lg:p-8">
          <div className="flex w-full flex-wrap">
            <div className="w-full">
              <div className="flex flex-wrap">
                <div className="form-groups-common-sec-s1">
                  <h3 dir={langDir} translate="no">
                    {t("basic_information")}
                  </h3>
                  {!hasId ? (
                    <div className="mb-3 grid w-full grid-cols-1 gap-x-5 gap-y-3 md:grid-cols-2">
                      <div className="flex w-full flex-col justify-between gap-y-2">
                        <Label>Product Category</Label>
                        <Controller
                          name="categoryId"
                          control={formContext.control}
                          render={({ field }) => (
                            <select
                              {...field}
                              className="h-[48px]! w-full rounded border border-border! px-3 text-sm focus-visible:ring-0!"
                              onChange={(e) => {
                                if (e.target.value === "") {
                                  return;
                                }
                                setCurrentId(e.target.value);
                                setCurrentIndex(0);

                                if (listIds[0]) {
                                  let tempIds = listIds;
                                  tempIds[0] = e.target.value;
                                  tempIds = tempIds.slice(0, 1);

                                  setListIds([...tempIds]);
                                  return;
                                }
                                setListIds([...listIds, e.target.value]);
                              }}
                              value={catList[0]?.id || ""}
                            >
                              <option value="">Select Category</option>
                              {memoizedCategories.map(
                                (item: ISelectOptions) => (
                                  <option
                                    value={item.value?.toString()}
                                    key={item.value}
                                  >
                                    {item.label}
                                  </option>
                                ),
                              )}
                            </select>
                          )}
                        />
                        <p
                          className="text-[13px] font-medium text-destructive"
                          dir={langDir}
                        >
                          {
                            formContext.formState.errors["categoryId"]
                              ?.message as string
                          }
                        </p>
                      </div>

                      {catList.length > 0
                        ? catList.map((item, index) => (
                            <div
                              key={item?.id}
                              className="mb-3 grid w-full grid-cols-1 gap-x-5 gap-y-3"
                            >
                              <div className="flex w-full flex-col justify-between gap-y-2">
                                <Label>Sub Category</Label>
                                <select
                                  className="h-[48px]! w-full rounded border border-border! px-3 text-sm focus-visible:ring-0!"
                                  onChange={(e) => {
                                    if (e.target.value === "") {
                                      return;
                                    }

                                    setCurrentId(e.target.value);
                                    setCurrentIndex(index + 1);

                                    if (listIds[index + 1]) {
                                      let tempIds = listIds;
                                      tempIds[index + 1] = e.target.value;
                                      tempIds = tempIds.slice(0, index + 2);
                                      setListIds([...tempIds]);
                                      return;
                                    }
                                    setListIds([...listIds, e.target.value]);
                                  }}
                                  value={item?.children
                                    ?.find((item: any) =>
                                      listIds.includes(item.id?.toString())
                                        ? item
                                        : "",
                                    )
                                    ?.id?.toString()}
                                >
                                  <option value="">Select Sub Category</option>
                                  {item?.children?.map((item: any) => (
                                    <option
                                      value={item.id?.toString()}
                                      key={item.id}
                                    >
                                      {item.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          ))
                        : null}
                    </div>
                  ) : null}

                  <ControlledTextInput
                    label="Product Name"
                    name="productName"
                    placeholder="Product Name"
                    // disabled={hasId}
                  />

                  {!hasId ? (
                    <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-2">
                      <BrandSelect />
                      <div className="mt-2 flex flex-col gap-y-3">
                        <Label>{t("product_condition")}</Label>
                        <Controller
                          name="productCondition"
                          control={formContext.control}
                          render={({ field }) => (
                            <ReactSelect
                              {...field}
                              onChange={(newValue) => {
                                field.onChange(newValue?.value);
                              }}
                              options={PRODUCT_CONDITION_LIST.map((item) => ({ ...item, label: t(item.label) }))}
                              value={PRODUCT_CONDITION_LIST.map((item) => ({ ...item, label: t(item.label) })).find(
                                (item: any) => item.value === field.value,
                              )}
                              styles={customStyles}
                              instanceId="productCondition"
                            />
                          )}
                        />

                        <p className="text-[13px] text-destructive" dir={langDir}>
                          {
                            formContext.formState.errors["productCondition"]
                              ?.message as string
                          }
                        </p>
                      </div>
                    </div>
                  ) : null}

                  {!hasId ? (
                    <AccordionMultiSelectV2
                      label="Tag"
                      name="productTagList"
                      options={tagsList || []}
                      placeholder="Tag"
                      error={
                        formContext.formState.errors["productTagList"]
                          ?.message as string
                      }
                    />
                  ) : null}

                  <div className="relative mb-4 w-full">
                    <div className="space-y-2">
                      <label
                        className="text-color-dark text-sm leading-none font-medium"
                        translate="no"
                      >
                        {t("product_image")}
                      </label>
                      <div className="flex w-full flex-wrap">
                        <div className="grid grid-cols-1 md:grid-cols-5">
                          {watchProductImages?.map(
                            (item: any, index: number) => (
                              <FormField
                                control={formContext.control}
                                name="productImages"
                                key={index}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <div className="relative mb-3 w-full px-2">
                                        <div className="relative m-auto flex h-48 w-full flex-wrap items-center justify-center rounded-xl border-2 border-dashed border-border text-center">
                                          {watchProductImages?.length ? (
                                            <button
                                              type="button"
                                              className="common-close-btn-uploader-s1"
                                              onClick={() => {
                                                handleRemovePreviewImage(
                                                  item?.id,
                                                );
                                                if (photosRef.current)
                                                  photosRef.current.value = "";
                                              }}
                                            >
                                              <Image
                                                src={CloseWhiteIcon}
                                                alt="close-icon"
                                                height={22}
                                                width={22}
                                              />
                                            </button>
                                          ) : null}

                                          {item?.path && isImage(item.path) ? (
                                            <div className="relative h-44">
                                              <Image
                                                src={
                                                  typeof item.path === "object"
                                                    ? URL.createObjectURL(
                                                        item.path,
                                                      )
                                                    : typeof item.path ===
                                                        "string"
                                                      ? item.path
                                                      : "/images/no-image.jpg"
                                                }
                                                alt="profile"
                                                fill
                                                priority
                                              />
                                              <Input
                                                type="file"
                                                accept="image/*"
                                                multiple={false}
                                                className="bottom-0! h-44 w-full! cursor-pointer opacity-0"
                                                onChange={(event) => {
                                                  if (event.target.files) {
                                                    if (
                                                      event.target.files[0]
                                                        .size > 524288000
                                                    ) {
                                                      toast({
                                                        title: t(
                                                          "one_of_file_should_be_less_than_size",
                                                          { size: "500MB" },
                                                        ),
                                                        variant: "danger",
                                                      });
                                                      return;
                                                    }
                                                    handleEditPreviewImage(
                                                      item?.id,
                                                      event.target.files,
                                                    );
                                                  }
                                                }}
                                                id="productImages"
                                              />
                                            </div>
                                          ) : item?.path &&
                                            isVideo(item.path) ? (
                                            <div className="relative h-44">
                                              <div className="player-wrapper px-2">
                                                <ReactPlayer
                                                  url={
                                                    typeof item.path ===
                                                    "object"
                                                      ? URL.createObjectURL(
                                                          item.path,
                                                        )
                                                      : typeof item.path ===
                                                          "string"
                                                        ? item.path
                                                        : "/images/no-image.jpg"
                                                  }
                                                  width="100%"
                                                  height="100%"
                                                  // playing
                                                  controls
                                                  {...({} as any)}
                                                />
                                              </div>

                                              <div className="absolute h-20 w-full p-5">
                                                <p className="rounded-lg border border-border bg-muted py-2 text-sm font-semibold">
                                                  Upload Video
                                                </p>
                                              </div>
                                              <Input
                                                type="file"
                                                accept="video/*"
                                                multiple={false}
                                                className="bottom-0! h-20 w-full! cursor-pointer opacity-0"
                                                onChange={(event) => {
                                                  if (event.target.files) {
                                                    if (
                                                      event.target.files[0]
                                                        .size > 524288000
                                                    ) {
                                                      toast({
                                                        title: t(
                                                          "one_of_file_should_be_less_than_size",
                                                          { size: "500MB" },
                                                        ),
                                                        variant: "danger",
                                                      });
                                                      return;
                                                    }

                                                    handleEditPreviewImage(
                                                      item?.id,
                                                      event.target.files,
                                                    );
                                                  }
                                                }}
                                                id="productImages"
                                              />
                                            </div>
                                          ) : (
                                            <AddImageContent description="Drop your File , or " />
                                          )}
                                        </div>
                                      </div>
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            ),
                          )}
                          <div className="relative mb-3 w-full pl-2">
                            <div className="absolute m-auto flex h-48 w-full cursor-pointer flex-wrap items-center justify-center rounded-xl border-2 border-dashed border-border bg-card text-center">
                              <div className="text-color-dark text-sm leading-4 font-medium">
                                <Image
                                  src="/images/plus.png"
                                  className="m-auto mb-3"
                                  alt="camera-icon"
                                  width={29}
                                  height={28}
                                />
                                <span>Add More</span>
                              </div>
                            </div>

                            <Input
                              type="file"
                              accept="image/*, video/*"
                              multiple
                              className="bottom-0! h-48 w-full! cursor-pointer opacity-0"
                              onChange={(event) => {
                                if (event.target.files) {
                                  const filesArray = Array.from(
                                    event.target.files,
                                  );

                                  if (
                                    filesArray.some(
                                      (file) => file.size > 524288000,
                                    )
                                  ) {
                                    toast({
                                      title: t(
                                        "one_of_file_should_be_less_than_size",
                                        { size: "500MB" },
                                      ),
                                      variant: "danger",
                                    });
                                    return;
                                  }

                                  const newImages = filesArray.map((file) => ({
                                    path: file,
                                    id: uuidv4(),
                                  }));
                                  const updatedProductImages = [
                                    ...(watchProductImages || []),
                                    ...newImages,
                                  ];
                                  formContext.setValue(
                                    "productImages",
                                    updatedProductImages,
                                  );
                                }
                              }}
                              id="productImages"
                              ref={photosRef}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* imported from create product module */}
                {!hasId ? (
                  <PriceSection activeProductType={activeProductType} />
                ) : null}

                {/* imported from create product module */}
                <DescriptionSection />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* imported from create product module */}
      {subCategoryById.data?.data?.category_dynamicFormCategory?.length ? (
        <DynamicFormViewSection
          dynamicFormList={
            subCategoryById.data?.data?.category_dynamicFormCategory
          }
        />
      ) : null}
    </>
  );
};

export default BasicInformationSection;
