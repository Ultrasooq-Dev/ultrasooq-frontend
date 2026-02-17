import { useBrands, useCreateBrand } from "@/apis/queries/masters.queries";
import { IBrands, IOption } from "@/utils/types/common.types";
import React, { useEffect, useMemo, useRef, useState } from "react";
import CreatableSelect from "react-select/creatable";
import { useToast } from "../ui/use-toast";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { Label } from "../ui/label";
import { useAuth } from "@/context/AuthContext";
import Select from "react-select/dist/declarations/src/Select";
import ReactSelect, { GroupBase } from "react-select";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react"; // Using Lucide React icons
import { useTranslations } from "next-intl";

const customStyles = {
  control: (base: any) => ({ ...base, height: 48, minHeight: 48 }),
};

const ReactSelectInput: React.FC<{
  selectedBrandType?: string,
  productType?: string;
}> = ({
  // Set default product type as "OWNBRAND"
  selectedBrandType = "OWNBRAND",
  productType = "P"
}) => {
  const t = useTranslations();
  const { langDir } = useAuth();
  const formContext = useFormContext();
  const { toast } = useToast();
  const [, setValue] = useState<IOption | null>();

  // Watch typeOfProduct from form to update brandType
  const typeOfProduct = useWatch({
    control: formContext.control,
    name: "typeOfProduct",
  });
  const brandNameFromForm = useWatch({
    control: formContext.control,
    name: "brandName",
  });

  // Use typeOfProduct from form if available, otherwise use selectedBrandType
  const [brandType, setBrandType] = useState<string>(
    typeOfProduct || selectedBrandType || "OWNBRAND"
  );

  const { user } = useAuth();

  const brandsQuery = useBrands({ addedBy: user?.id, type: brandType });
  const createBrand = useCreateBrand();

  const memoizedBrands = useMemo(() => {
    let base: IOption[] =
      brandType && brandsQuery?.data?.data
        ? brandsQuery.data.data.map((item: IBrands) => ({
            label: item.brandName,
            value: item.id,
          }))
        : [];

    const currentBrandId = formContext.getValues("brandId");

    // If we have a prefilled brand (from existing product) that isn't in the fetched list,
    // inject it so the dropdown can display it.
    if (
      currentBrandId &&
      brandNameFromForm &&
      !base.some((b) => b.value === currentBrandId)
    ) {
      base = [
        ...base,
        {
          label: brandNameFromForm,
          value: currentBrandId,
        },
      ];
    }

    return base;
  }, [brandsQuery?.data?.data, brandType, formContext, brandNameFromForm]);

  // Update brandType when typeOfProduct changes
  useEffect(() => {
    if (typeOfProduct) {
      setBrandType(typeOfProduct);
    } else if (selectedBrandType) {
      setBrandType(selectedBrandType);
      formContext.setValue("typeOfProduct", selectedBrandType);
    }
  }, [typeOfProduct, selectedBrandType, formContext]);


  const handleCreate = async (inputValue: string) => {
    const response = await createBrand.mutateAsync({ brandName: inputValue });

    if (response.status && response.data) {
      toast({
        title: t("brand_create_successful"),
        description: response.message,
        variant: "success",
      });
      setValue({ label: response.data.brandName, value: response.data.id });
      formContext.setValue("brandId", response.data.id);
    } else {
      toast({
        title: t("brand_create_failed"),
        description: response.message,
        variant: "danger",
      });
    }
  };

  const brandTypes = [
    { label: t("brand"), value: "BRAND" },
    { label: t("spare_part"), value: "SPAREPART" },
    { label: t("own_brand"), value: "OWNBRAND" }, 
  ];

  const brandSelect = useRef<Select<any, false, GroupBase<any>>>(null);

  return (
    <>
      <div className="mt-2 flex flex-col gap-y-3">
        <Label dir={langDir} translate="no">{t("product_type")}</Label>
        <Controller
          name="typeOfProduct"
          control={formContext.control}
          render={({ field }) => (
            <ReactSelect
              // {...field}
              options={brandTypes}
              filterOption={(option) => (option.value !== "OWNBRAND" && productType == 'R') || productType != 'R'}
              value={brandTypes.find(
                (item: IOption) => item.value === field.value,
              )}
              styles={customStyles}
              instanceId="typeOfProduct"
              onChange={(newValue) => {
                field.onChange(newValue?.value);
                if (newValue?.value) {
                  setBrandType(newValue?.value);
                  if (brandSelect.current) {
                    brandSelect?.current?.clearValue();
                  }
                }
              }}
              placeholder={t("select")}
            />
          )}
        />
        <p className="text-[13px] text-red-500" dir={langDir}>
          {formContext.formState.errors["typeOfProduct"]?.message as string}
        </p>
      </div>
      <div className="mt-2 flex flex-col gap-y-3">
        <div className="flex w-full items-center gap-1.5">
          <Label dir={langDir} translate="no">{t("brand")}</Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 cursor-pointer text-gray-500" />
              </TooltipTrigger>
              <TooltipContent side="right" dir={langDir} translate="no">
                {t("brand_input_info")}{" "}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Controller
          name="brandId"
          control={formContext.control}
          render={({ field }) => {
            const selectedBrand = memoizedBrands.find(
              (item: IOption) => item.value === field.value,
            );
            
            return (
            <CreatableSelect
              // {...field}
              name={field.name}
              ref={brandSelect}
              isClearable
              isDisabled={createBrand.isPending}
              isLoading={createBrand.isPending || brandsQuery.isLoading}
              onChange={(newValue) => {
                field.onChange(newValue?.value);
                setValue(newValue);
              }}
              onCreateOption={handleCreate}
              options={memoizedBrands}
              value={selectedBrand}
              styles={customStyles}
              instanceId="brandId"
              placeholder={t("select")}
            />
            );
          }}
        />
        <p className="text-[13px] text-red-500" dir={langDir}>
          {formContext.formState.errors["brandId"]?.message as string}
        </p>
      </div>
    </>
  );
};

export default ReactSelectInput;
