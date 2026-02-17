import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import AccordionMultiSelectV2 from "@/components/shared/AccordionMultiSelectV2";
import { Label } from "@/components/ui/label";
import { Controller, useFormContext } from "react-hook-form";
import { FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { useToast } from "@/components/ui/use-toast";
import { v4 as uuidv4 } from "uuid";
import { ISelectOptions } from "@/utils/types/common.types";
import { useCategory } from "@/apis/queries/category.queries";
import ControlledTextInput from "@/components/shared/Forms/ControlledTextInput";
import AddImageContent from "../profile/AddImageContent";
import CloseWhiteIcon from "@/public/images/close-white.svg";
import BrandSelect from "@/components/shared/BrandSelect";
import { PRODUCT_CATEGORY_ID, PRODUCT_CONDITION_LIST } from "@/utils/constants";
import { fetchSubCategoriesById } from "@/apis/requests/category.requests";
import ReactSelect from "react-select";
import DescriptionSection from "./DescriptionSection";
import { isImage, isVideo } from "@/utils/helper";
import { useCreateTag } from "@/apis/queries/tags.queries";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { IoMdAdd } from "react-icons/io";

const customStyles = {
  control: (base: any) => ({
    ...base,
    height: 48,
    minHeight: 48,
    borderRadius: "0.75rem",
    borderColor: "#d1d5db",
    boxShadow: "none",
    "&:hover": {
      borderColor: "#9ca3af",
    },
    "&:focus-within": {
      borderColor: "#f97316",
      boxShadow: "0 0 0 2px rgba(249, 115, 22, 0.2)",
    },
  }),
  menu: (base: any) => ({
    ...base,
    zIndex: 20,
    borderRadius: "0.75rem",
    boxShadow:
      "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
  }),
  option: (base: any, state: any) => ({
    ...base,
    backgroundColor: state.isSelected
      ? "#f97316"
      : state.isFocused
        ? "#fed7aa"
        : "white",
    color: state.isSelected ? "white" : "#374151",
    "&:hover": {
      backgroundColor: state.isSelected ? "#ea580c" : "#fed7aa",
    },
  }),
};

type ProductImageProps = {
  path: string;
  id: string;
};

type BasicInformationProps = {
  tagsList: any;
  activeProductType?: string;
  selectedCategoryIds?: string[];
  copy: boolean;
};

const VideoPlayer = ({ item }: { item: any }) => (
  <video
    controls
    style={{
      objectFit: "contain",
      width: "100%",
      height: "100%",
    }}
  >
    <source
      src={
        typeof item.path === "object"
          ? URL.createObjectURL(item.path)
          : item.path
      }
      type="video/mp4"
    />
    Your browser does not support the video tag.
  </video>
);

const BasicInformationSection: React.FC<BasicInformationProps> = ({
  tagsList,
  activeProductType,
  selectedCategoryIds,
  copy,
}) => {
  const formContext = useFormContext();
  const { toast } = useToast();
  const photosRef = useRef<HTMLInputElement>(null);
  const [categoryLevels, setCategoryLevels] = useState<
    { categories: any[]; selectedId: number | null }[]
  >([]);
  const [isCategoryPrefilled, setIsCategoryPrefilled] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const createTag = useCreateTag();
  const t = useTranslations();
  const { langDir } = useAuth();

  // Helper function to recursively find a category in the hierarchy
  const findCategoryInHierarchy = (
    categories: any[],
    targetId: string | number,
  ): any => {
    if (!categories || !Array.isArray(categories)) return null;

    for (const category of categories) {
      if (
        category.id?.toString() === targetId?.toString() ||
        Number(category.id) === Number(targetId)
      ) {
        return category;
      }
      if (category.children && category.children.length > 0) {
        const found = findCategoryInHierarchy(category.children, targetId);
        if (found) return found;
      }
    }
    return null;
  };

  // Helper function to find the root category that contains a target category
  const findRootCategoryForTarget = (
    categories: any[],
    targetId: string | number,
  ): any => {
    if (!categories || !Array.isArray(categories)) return null;

    for (const category of categories) {
      // Check if this category itself matches
      if (
        category.id?.toString() === targetId?.toString() ||
        Number(category.id) === Number(targetId)
      ) {
        return category;
      }
      // Check if target is in this category's children/descendants
      if (category.children && category.children.length > 0) {
        const found = findCategoryInHierarchy(category.children, targetId);
        if (found) {
          return category; // Return the root category that contains the target
        }
      }
    }
    return null;
  };

  const watchProductImages = formContext.watch("productImages");

  const categoryQuery = useCategory(PRODUCT_CATEGORY_ID.toString());

  // Load top-level categories when category query is ready
  useEffect(() => {
    const rootChildren = categoryQuery?.data?.data?.children;
    if (!rootChildren || !Array.isArray(rootChildren)) return;

    setCategoryLevels((prev) => {
      if (prev.length > 0) return prev; // keep existing (e.g., after prefill)
      return [{ categories: rootChildren, selectedId: null }];
    });
  }, [categoryQuery?.data?.data?.children]);

  // Prefill category levels from selectedCategoryIds (root -> ... -> leaf)
  useEffect(() => {
    const initFromPath = async () => {
      if (
        !selectedCategoryIds?.length ||
        !categoryQuery?.data?.data?.children ||
        isCategoryPrefilled
      ) {
        return;
      }

      try {
        const pathIds = selectedCategoryIds.map((id) => Number(id));
        let levels: { categories: any[]; selectedId: number | null }[] = [];
        let currentCategories = categoryQuery.data.data.children;

        for (let i = 0; i < pathIds.length; i++) {
          const id = pathIds[i];
          levels.push({
            categories: currentCategories,
            selectedId: id,
          });

          if (i < pathIds.length - 1) {
            const res = await fetchSubCategoriesById({
              categoryId: String(id),
            });
            const children = res.data?.data?.children || [];
            if (!children.length) break;
            currentCategories = children;
          }
        }

        if (levels.length) {
          setCategoryLevels(levels);
          const leafId = pathIds[pathIds.length - 1];
          formContext.setValue("categoryId", leafId);
          formContext.setValue("categoryLocation", pathIds.join(","));
          setIsCategoryPrefilled(true);
        }
      } catch (error) {
        console.error("Failed to prefill categories:", error);
      }
    };

    initFromPath();
  }, [
    selectedCategoryIds,
    categoryQuery?.data?.data?.children,
    isCategoryPrefilled,
    formContext,
  ]);

  const handleCategoryChange = async (levelIndex: number, value: string) => {
    if (!value) return;
    const id = Number(value);

    let pathIds: number[] = [];

    // Update selected id for this level and clear deeper levels
    setCategoryLevels((prev) => {
      const updated = prev.slice(0, levelIndex + 1);
      const currentLevel = updated[levelIndex] || { categories: [], selectedId: null };
      updated[levelIndex] = { ...currentLevel, selectedId: id };

      pathIds = [];
      updated.forEach((lvl) => {
        if (lvl.selectedId != null) {
          pathIds.push(lvl.selectedId);
        }
      });

      return updated;
    });

    formContext.setValue("categoryId", id);
    formContext.setValue("categoryLocation", pathIds.join(","));

    // Load children for next level
    try {
      const res = await fetchSubCategoriesById({ categoryId: String(id) });
      const children = res.data?.data?.children || [];
      if (children.length) {
        setCategoryLevels((prev) => {
          const base = prev.slice(0, levelIndex + 1);
          base.push({ categories: children, selectedId: null });
          return base;
        });
      } else {
        // No more children - trim deeper levels
        setCategoryLevels((prev) => prev.slice(0, levelIndex + 1));
      }
    } catch (error) {
      console.error("Failed to load subcategories:", error);
    }
  };

  const productConditions = () => {
    return PRODUCT_CONDITION_LIST.map((item) => {
      return {
        label: t(item.label),
        value: item.value,
      };
    });
  };

  const handleCreateTag = async (newTag: string) => {
    const response = await createTag.mutateAsync({ tagName: newTag });
    if (response.status) {
      toast({
        title: t("tag_created_successfully"),
        description: response.message,
        variant: "success",
      });
      return { label: response.data.tagName, value: response.data.id };
    } else {
      toast({
        title: t("tag_create_failed"),
        description: response.message,
        variant: "danger",
      });
      return null;
    }
  };

  // (legacy category cascade logic removed – replaced with categoryLevels system above)

  const handleEditPreviewImage = (id: string, item: FileList) => {
    const tempArr = formContext.getValues("productImages") || [];
    const filteredFormItem = tempArr.filter(
      (item: ProductImageProps) => item.id !== id,
    );
    formContext.setValue("productImages", [
      ...filteredFormItem,
      { path: item[0], id: uuidv4() },
    ]);
  };

  const handleRemovePreviewImage = (id: string) => {
    const tempArr = formContext.getValues("productImages") || [];
    const filteredFormItem = tempArr.filter(
      (item: ProductImageProps) => item.id !== id,
    );
    formContext.setValue("productImages", filteredFormItem);
  };

  return (
    <div className="space-y-8">
      {/* Category Selection Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500">
            <span className="text-sm font-semibold text-white">1</span>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-gray-900">
              {t("product_category")}
            </h4>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {categoryLevels.map((level, levelIndex) => {
            const pathLength = selectedCategoryIds?.length || 0;
            const hasPrefilledPath = pathLength > 0;

            // When we HAVE a prefilled path (copy/edit), consider the last 2 levels
            // as vendor-visible (parent + leaf) and hide the prefix.
            // Example: [1,2,4,99,101] → vendorStartIndex = 3 (99,101)
            // Example: [10,20,30]      → vendorStartIndex = 1 (20,30)
            const vendorStartIndex = hasPrefilledPath
              ? Math.max(0, pathLength - 2)
              : 0;

            // Hide prefix levels for prefilled paths (admin/internal)
            if (hasPrefilledPath && levelIndex < vendorStartIndex) return null;

            const relativeIndex = levelIndex - vendorStartIndex; // 0 = parent, >0 = subs
            const isParentLevel = relativeIndex === 0;

            const labelText = isParentLevel
              ? t("product_category")
              : `${t("sub_category")} ${relativeIndex}`;

            return (
              <div key={levelIndex} className="space-y-3">
                <Label
                  className="flex items-center gap-2 text-sm font-medium text-gray-700"
                  dir={langDir}
                  translate="no"
                >
                  <svg
                    className="h-4 w-4 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1994 1.994 0 013 12V7a4 4 0 014-4z"
                    />
                  </svg>
                  {labelText}
                </Label>
                <div className="relative">
                  <select
                    className="h-12 w-full cursor-pointer appearance-none rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 transition-all duration-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500"
                    value={level.selectedId?.toString() || ""}
                    onChange={(e) =>
                      handleCategoryChange(levelIndex, e.target.value)
                    }
                  >
                    <option value="" dir={langDir} translate="no">
                      {isParentLevel
                        ? t("select_category")
                        : t("select_sub_category")}
                    </option>
                    {level.categories.map((item: any) => (
                      <option
                        key={item.id}
                        value={item.id?.toString()}
                        dir={langDir}
                      >
                        {item.name}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            );
          })}
          {formContext.formState.errors["categoryId"] && (
            <p
              className="mt-1 flex items-center gap-1 text-sm text-red-500"
              dir={langDir}
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {formContext.formState.errors["categoryId"]?.message as string}
            </p>
          )}
        </div>
      </div>

      {/* Product Name Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500">
            <span className="text-sm font-semibold text-white">2</span>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-gray-900">
              {t("product_name")}
            </h4>
          </div>
        </div>

        <ControlledTextInput
          label={t("product_name")}
          name="productName"
          placeholder={t("product_name")}
          disabled={copy}
          dir={langDir}
          translate="no"
        />
      </div>

      {/* Product Details Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500">
            <span className="text-sm font-semibold text-white">3</span>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-gray-900">
              {t("product_details")}
            </h4>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <BrandSelect
            selectedBrandType={formContext.getValues("typeOfProduct")}
            productType={activeProductType}
          />

          <div className="space-y-3">
            <Label
              className="flex items-center gap-2 text-sm font-medium text-gray-700"
              dir={langDir}
              translate="no"
            >
              <svg
                className="h-4 w-4 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {t("product_condition")}
            </Label>
            <Controller
              name="productCondition"
              control={formContext.control}
              render={({ field }) => (
                <ReactSelect
                  {...field}
                  onChange={(newValue) => {
                    field.onChange(newValue?.value);
                  }}
                  options={productConditions()}
                  value={productConditions().find(
                    (item: any) => item.value === field.value,
                  )}
                  styles={customStyles}
                  instanceId="productCondition"
                  placeholder={t("select")}
                />
              )}
            />
            {formContext.formState.errors["productCondition"] && (
              <p
                className="mt-1 flex items-center gap-1 text-sm text-red-500"
                dir={langDir}
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {
                  formContext.formState.errors["productCondition"]
                    ?.message as string
                }
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Tags Section - temporarily disabled */}
      {/*
      <div className="space-y-6">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-500">
            <span className="text-sm font-semibold text-white">4</span>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-gray-900">{t("tags")}</h4>
          </div>
        </div>

        <AccordionMultiSelectV2
          label={t("tags")}
          name="productTagList"
          options={tagsList || []}
          placeholder={t("tags")}
          canCreate={true}
          createOption={handleCreateTag}
          error={
            formContext.formState.errors["productTagList"]?.message as string
          }
        />
      </div>
      */}

      {/* Product Images Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-500">
            <span className="text-sm font-semibold text-white">5</span>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-gray-900">
              {t("product_images")}
            </h4>
          </div>
        </div>

        <div className="space-y-4">
          <Label
            className="flex items-center gap-2 text-sm font-medium text-gray-700"
            dir={langDir}
            translate="no"
          >
            <svg
              className="h-4 w-4 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            {t("product_images")}
          </Label>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {watchProductImages?.map((item: any) => (
              <div
                key={item.id}
                className="group relative aspect-square overflow-hidden rounded-xl border-2 border-gray-200 bg-gray-50 transition-colors duration-200 hover:border-orange-300"
              >
                {isImage(item.path) ? (
                  <Image
                    src={
                      typeof item.path === "object"
                        ? URL.createObjectURL(item.path)
                        : item.path
                    }
                    alt="product-image"
                    fill
                    className="object-cover"
                  />
                ) : isVideo(item.path) ? (
                  <VideoPlayer item={item} />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <svg
                      className="h-12 w-12 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                )}

                {/* Overlay with actions */}
                <div className="bg-opacity-50 absolute inset-0 flex items-center justify-center gap-2 bg-black opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  <label
                    htmlFor="editImage"
                    className="cursor-pointer rounded-full bg-white p-2 transition-colors hover:bg-gray-100"
                    title={t("edit_image")}
                  >
                    <input
                      type="file"
                      id="editImage"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files) {
                          handleEditPreviewImage(item.id, e.target.files);
                        }
                      }}
                    />
                    <svg
                      className="h-4 w-4 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </label>
                  <button
                    type="button"
                    onClick={() => handleRemovePreviewImage(item.id)}
                    className="rounded-full bg-red-500 p-2 transition-colors hover:bg-red-600"
                    title={t("remove_image")}
                  >
                    <svg
                      className="h-4 w-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}

            {/* Add Image Button */}
            <div className="group flex aspect-square cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-gray-300 transition-colors duration-200 hover:border-orange-400 hover:bg-orange-50">
              <label
                htmlFor="productImages"
                className="flex cursor-pointer flex-col items-center justify-center text-gray-500 group-hover:text-orange-600"
              >
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 transition-colors duration-200 group-hover:bg-orange-100">
                  <IoMdAdd className="h-6 w-6" />
                </div>
                <span className="text-sm font-medium">{t("add_image")}</span>
                <span className="mt-1 text-xs text-gray-400">
                  {t("click_to_upload")}
                </span>
              </label>
              <input
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) {
                    const filesArray = Array.from(e.target.files).map(
                      (file) => ({
                        path: file,
                        id: uuidv4(),
                      }),
                    );
                    formContext.setValue("productImages", [
                      ...(formContext.getValues("productImages") || []),
                      ...filesArray,
                    ]);
                  }
                }}
                id="productImages"
                ref={photosRef}
                accept="image/*,video/*"
              />
            </div>
          </div>

          {formContext.formState.errors["productImages"] && (
            <p
              className="mt-2 flex items-center gap-1 text-sm text-red-500"
              dir={langDir}
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {formContext.formState.errors["productImages"]?.message as string}
            </p>
          )}
        </div>
      </div>

      {/* Include Description section (Price is rendered in DescriptionAndSpecificationSection) */}
      <DescriptionSection />
    </div>
  );
};

export default memo(BasicInformationSection);
