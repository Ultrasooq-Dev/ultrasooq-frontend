"use client";
import React from "react";
import { Controller, UseFormReturn } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { BulkEditFormValues } from "./bulkEditTypes";

interface BulkEditDiscountQuantitiesProps {
  form: UseFormReturn<BulkEditFormValues>;
  watchSellType: string;
}

/** Inline stepper for the quantity fields */
const StepperField: React.FC<{ field: any; placeholder: string }> = ({ field, placeholder }) => (
  <div className="relative">
    <button
      type="button"
      className="absolute left-2 top-[6px] z-10 flex h-[34px] w-[32px] items-center justify-center bg-muted!"
      onClick={() => {
        const newValue = Number(field.value) - 1;
        field.onChange(newValue >= 0 ? newValue : 0);
      }}
    >
      -
    </button>
    <Input
      {...field}
      type="number"
      placeholder={placeholder}
      className="pl-12 pr-12 text-center"
      value={field.value || 0}
      min="0"
    />
    <button
      type="button"
      className="absolute right-2 top-[6px] z-10 flex h-[34px] w-[32px] items-center justify-center bg-muted!"
      onClick={() => { field.onChange(Number(field.value) + 1); }}
    >
      +
    </button>
  </div>
);

/** Compact stepper used for qty-per-customer */
const CompactStepper: React.FC<{ field: any; placeholder: string }> = ({ field, placeholder }) => (
  <div className="flex items-center space-x-2">
    <button
      type="button"
      onClick={() => field.onChange(Math.max(Number(field.value) - 1, 0))}
      className="flex h-8 w-8 items-center justify-center rounded border border-border bg-card text-muted-foreground hover:bg-muted"
    >
      -
    </button>
    <Input
      type="number"
      value={field.value || 0}
      onChange={(e) => field.onChange(Number(e.target.value))}
      onBlur={field.onBlur}
      name={field.name}
      className="h-8 w-20 text-center"
      placeholder={placeholder}
      min="0"
    />
    <button
      type="button"
      onClick={() => field.onChange(Number(field.value) + 1)}
      className="flex h-8 w-8 items-center justify-center rounded border border-border bg-card text-muted-foreground hover:bg-muted"
    >
      +
    </button>
  </div>
);

const BulkEditDiscountQuantities: React.FC<BulkEditDiscountQuantitiesProps> = ({
  form,
  watchSellType,
}) => {
  const t = useTranslations();
  const showBuygroup = watchSellType === "BUYGROUP";
  const showQtyPerCustomer = watchSellType === "BUYGROUP" || watchSellType === "WHOLESALE_PRODUCT";
  const showTrial = watchSellType === "TRIAL_PRODUCT";

  return (
    <>
      {showBuygroup && (
        <>
          <div className="p-4 bg-muted rounded-lg border border-border">
            <Label className="text-sm font-medium text-foreground mb-3 block" translate="no">
              {t("min_quantity")}
            </Label>
            <Controller
              name="minQuantity"
              control={form.control}
              render={({ field }) => <StepperField field={field} placeholder={t("min")} />}
            />
          </div>
          <div className="p-4 bg-muted rounded-lg border border-border">
            <Label className="text-sm font-medium text-foreground mb-3 block" translate="no">
              {t("max_quantity")}
            </Label>
            <Controller
              name="maxQuantity"
              control={form.control}
              render={({ field }) => <StepperField field={field} placeholder={t("max")} />}
            />
          </div>
          <div className="p-4 bg-muted rounded-lg border border-border">
            <Label className="text-sm font-medium text-foreground mb-3 block" translate="no">
              {t("min_customer")}
            </Label>
            <Controller
              name="minCustomer"
              control={form.control}
              render={({ field }) => <StepperField field={field} placeholder={t("min")} />}
            />
          </div>
          <div className="p-4 bg-muted rounded-lg border border-border">
            <Label className="text-sm font-medium text-foreground mb-3 block" translate="no">
              {t("max_customer")}
            </Label>
            <Controller
              name="maxCustomer"
              control={form.control}
              render={({ field }) => <StepperField field={field} placeholder={t("max")} />}
            />
          </div>
        </>
      )}

      {showQtyPerCustomer && (
        <>
          <div className="p-4 bg-muted rounded-lg border border-border">
            <Label className="text-sm font-medium text-foreground mb-3 block" translate="no">
              {t("min_quantity_per_customer")}
            </Label>
            <Controller
              name="minQuantityPerCustomer"
              control={form.control}
              render={({ field }) => <CompactStepper field={field} placeholder={t("min")} />}
            />
          </div>
          <div className="p-4 bg-muted rounded-lg border border-border">
            <Label className="text-sm font-medium text-foreground mb-3 block" translate="no">
              {t("max_quantity_per_customer")}
            </Label>
            <Controller
              name="maxQuantityPerCustomer"
              control={form.control}
              render={({ field }) => <CompactStepper field={field} placeholder={t("max")} />}
            />
          </div>
        </>
      )}

      {showTrial && (
        <div className="p-4 bg-muted rounded-lg border border-border">
          <Label className="text-sm font-medium text-foreground mb-3 block" translate="no">
            {t("max_quantity_per_customer")}
          </Label>
          <Controller
            name="maxQuantityPerCustomer"
            control={form.control}
            render={({ field }) => <CompactStepper field={field} placeholder={t("max")} />}
          />
        </div>
      )}
    </>
  );
};

export default BulkEditDiscountQuantities;
