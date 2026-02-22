"use client";
import React, { useEffect, useMemo, useRef } from "react";
import {
  useFormContext,
  useWatch,
  useFieldArray,
} from "react-hook-form";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";

/** Cartesian product of arrays: [[a,b],[c,d]] → [[a,c],[a,d],[b,c],[b,d]] */
function cartesianProduct<T>(arrays: T[][]): T[][] {
  if (arrays.length === 0) return [];
  return arrays.reduce<T[][]>(
    (acc, curr) => acc.flatMap((a) => curr.map((c) => [...a, c])),
    [[]],
  );
}

const VariantPricingSection: React.FC = () => {
  const t = useTranslations();
  const { langDir } = useAuth();
  const form = useFormContext();

  // Watch variant definitions from Step 2
  const productVariants = useWatch({
    control: form.control,
    name: "productVariants",
  });

  const { fields, replace } = useFieldArray({
    control: form.control,
    name: "variantPricingList",
  });

  // Filter to valid variant types (type filled + at least one value filled)
  const validVariantTypes = useMemo(() => {
    if (!productVariants || !Array.isArray(productVariants)) return [];
    return productVariants.filter(
      (vt: any) =>
        vt.type?.trim() &&
        vt.variants?.some((v: any) => v.value?.trim()),
    );
  }, [productVariants]);

  // Compute all variant combinations via cartesian product
  const combinations = useMemo(() => {
    if (validVariantTypes.length === 0) return [];

    const valueArrays = validVariantTypes.map((vt: any) =>
      vt.variants
        .filter((v: any) => v.value?.trim())
        .map((v: any) => ({ type: vt.type.trim(), value: v.value.trim() })),
    );

    const product = cartesianProduct(valueArrays);

    return product.map((combo) => ({
      combinationKey: combo.map((c) => c.value).join("|"),
      combinationLabel: combo
        .map((c) => `${c.type}: ${c.value}`)
        .join(" / "),
    }));
  }, [validVariantTypes]);

  // Track the stringified combinations to avoid infinite loops
  const combinationsKey = useMemo(
    () => JSON.stringify(combinations.map((c) => c.combinationKey)),
    [combinations],
  );
  const prevCombinationsKey = useRef(combinationsKey);

  // Sync combinations into the form field array, preserving existing pricing
  useEffect(() => {
    if (combinationsKey === prevCombinationsKey.current) return;
    prevCombinationsKey.current = combinationsKey;

    if (combinations.length === 0) {
      if (fields.length > 0) replace([]);
      return;
    }

    const currentFields = form.getValues("variantPricingList") || [];
    const currentMap = new Map(
      currentFields.map((f: any) => [f.combinationKey, f]),
    );

    const newFields = combinations.map((combo) => {
      const existing = currentMap.get(combo.combinationKey);
      return {
        combinationKey: combo.combinationKey,
        combinationLabel: combo.combinationLabel,
        price: existing?.price ?? "",
        stock: existing?.stock ?? "",
      };
    });

    replace(newFields);
  }, [combinationsKey, combinations, fields.length, form, replace]);

  // Nothing to show if no variant combinations exist
  if (combinations.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* Header row */}
      <div
        className="grid grid-cols-[1fr_120px_120px] gap-3 px-3 text-sm font-semibold text-gray-500"
        dir={langDir}
      >
        <div>{t("variant") || "Variant"}</div>
        <div>{t("price") || "Price"}</div>
        <div>{t("stock") || "Stock"}</div>
      </div>

      {/* Variant rows */}
      {fields.map((field, index) => (
        <div
          key={field.id}
          className="grid grid-cols-[1fr_120px_120px] items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3"
          dir={langDir}
        >
          {/* Combination label */}
          <div className="text-sm font-medium text-gray-800">
            {form.getValues(
              `variantPricingList.${index}.combinationLabel`,
            )}
          </div>

          {/* Price input */}
          <FormField
            control={form.control}
            name={`variantPricingList.${index}.price`}
            render={({ field: inputField }) => (
              <FormItem>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    onWheel={(e) => e.currentTarget.blur()}
                    placeholder="0.00"
                    className="h-9 rounded-lg border-gray-300 text-sm focus-visible:ring-0"
                    {...inputField}
                    dir={langDir}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Stock input */}
          <FormField
            control={form.control}
            name={`variantPricingList.${index}.stock`}
            render={({ field: inputField }) => (
              <FormItem>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    step="1"
                    onWheel={(e) => e.currentTarget.blur()}
                    placeholder="0"
                    className="h-9 rounded-lg border-gray-300 text-sm focus-visible:ring-0"
                    {...inputField}
                    dir={langDir}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      ))}
    </div>
  );
};

export default VariantPricingSection;
