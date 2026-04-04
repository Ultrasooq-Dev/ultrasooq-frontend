import { useBrands, useCreateBrand } from "@/apis/queries/masters.queries";
import { IBrands, IOption } from "@/utils/types/common.types";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

  // Track brands created in this session so they appear immediately in the
  // dropdown even when the server-side filter (e.g. type=BRAND → brandType
  // ADMIN only) would otherwise exclude them.
  const [localBrands, setLocalBrands] = useState<IOption[]>([]);

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

    // Merge in locally-created brands that the server query may not return
    for (const lb of localBrands) {
      if (!base.some((b) => b.value === lb.value)) {
        base = [...base, lb];
      }
    }

    return base;
  }, [brandsQuery?.data?.data, brandType, formContext, brandNameFromForm, localBrands]);

  // Update brandType when typeOfProduct changes
  useEffect(() => {
    if (typeOfProduct) {
      setBrandType(typeOfProduct);
    } else if (selectedBrandType) {
      setBrandType(selectedBrandType);
      formContext.setValue("typeOfProduct", selectedBrandType);
    }
  }, [typeOfProduct, selectedBrandType, formContext]);


  const handleCreate = useCallback(async (inputValue: string) => {
    try {
      const response = await createBrand.mutateAsync({ brandName: inputValue });

      if (response.status && response.data) {
        const newBrand: IOption = {
          label: (response.data as any).brandName,
          value: (response.data as any).id,
        };

        // Add to local brands so it appears in the dropdown immediately,
        // even if the server-side filter would exclude it.
        setLocalBrands((prev) => [...prev, newBrand]);

        toast({
          title: t("brand_create_successful"),
          description: response.message,
          variant: "success",
        });

        // Select the newly created brand in the form
        setValue(newBrand);
        formContext.setValue("brandId", newBrand.value);
        formContext.setValue("brandName", newBrand.label);
      } else {
        toast({
          title: t("brand_create_failed"),
          description: response.message,
          variant: "danger",
        });
      }
    } catch (error: any) {
      toast({
        title: t("brand_create_failed"),
        description: error?.response?.data?.message || error?.message || "Something went wrong",
        variant: "danger",
      });
    }
  }, [createBrand, formContext, t, toast]);

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
        <p className="text-[13px] text-destructive" dir={langDir}>
          {formContext.formState.errors["typeOfProduct"]?.message as string}
        </p>
      </div>
      <div className="mt-2 flex flex-col gap-y-3">
        <div className="flex w-full items-center gap-1.5">
          <Label dir={langDir} translate="no">{t("brand")}</Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 cursor-pointer text-muted-foreground" />
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
        <p className="text-[13px] text-destructive" dir={langDir}>
          {formContext.formState.errors["brandId"]?.message as string}
        </p>
      </div>
    </>
  );
};

export default ReactSelectInput;
