"use client";
import React from "react";
import { Controller, UseFormReturn } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { BulkEditFormValues } from "./bulkEditTypes";
import { getDiscountTypes } from "./bulkEditUtils";
import BulkEditDiscountQuantities from "./BulkEditDiscountQuantities";

interface BulkEditDiscountFieldsProps {
  form: UseFormReturn<BulkEditFormValues>;
  watchSellType: string;
  watchConsumerType: string;
}

/** Simple stepper used for delivery/discount numeric fields */
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

const BulkEditDiscountFields: React.FC<BulkEditDiscountFieldsProps> = ({
  form,
  watchSellType,
  watchConsumerType,
}) => {
  const t = useTranslations();
  const discountTypes = getDiscountTypes(t);
  const showVendor =
    watchConsumerType === "EVERYONE" ||
    watchConsumerType === "VENDORS" ||
    watchConsumerType === "BUSINESS";
  const showConsumer =
    watchConsumerType === "EVERYONE" || watchConsumerType === "CONSUMER";

  return (
    <>
      {/* Delivery After */}
      <div className="p-4 bg-muted rounded-lg border border-border">
        <Label className="text-sm font-medium text-foreground mb-3 block" translate="no">
          {t("deliver_after")}
        </Label>
        <Controller
          name="deliveryAfter"
          control={form.control}
          render={({ field }) => <StepperField field={field} placeholder={t("after")} />}
        />
      </div>

      {/* Sell-type-driven quantity fields */}
      <BulkEditDiscountQuantities form={form} watchSellType={watchSellType} />

      {/* Time Open */}
      <div className="p-4 bg-muted rounded-lg border border-border">
        <Label className="text-sm font-medium text-foreground mb-3 block" translate="no">
          {t("time_open")}
        </Label>
        <Controller
          name="timeOpen"
          control={form.control}
          render={({ field }) => <StepperField field={field} placeholder={t("time_open")} />}
        />
      </div>

      {/* Time Close */}
      <div className="p-4 bg-muted rounded-lg border border-border">
        <Label className="text-sm font-medium text-foreground mb-3 block" translate="no">
          {t("time_close")}
        </Label>
        <Controller
          name="timeClose"
          control={form.control}
          render={({ field }) => <StepperField field={field} placeholder={t("time_close")} />}
        />
      </div>

      {/* Vendor Discount */}
      {showVendor && (
        <div className="p-4 bg-muted rounded-lg border border-border">
          <Label className="text-sm font-medium text-foreground mb-3 block" translate="no">
            {t("vendor_discount")}
          </Label>
          <Controller
            name="vendorDiscount"
            control={form.control}
            render={({ field }) => <StepperField field={field} placeholder="Discount" />}
          />
        </div>
      )}

      {/* Consumer Discount */}
      {showConsumer && (
        <div className="p-4 bg-muted rounded-lg border border-border">
          <Label className="text-sm font-medium text-foreground mb-3 block" translate="no">
            {t("consumer_discount")}
          </Label>
          <Controller
            name="consumerDiscount"
            control={form.control}
            render={({ field }) => <StepperField field={field} placeholder={t("discount")} />}
          />
        </div>
      )}

      {/* Vendor Discount Type */}
      {showVendor && (
        <div className="p-4 bg-muted rounded-lg border border-border">
          <Label className="text-sm font-medium text-foreground mb-3 block" translate="no">
            {t("vendor_discount_type")}
          </Label>
          <Controller
            name="vendorDiscountType"
            control={form.control}
            render={({ field }) => (
              <select
                value={field.value || ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                name={field.name}
                className="w-full h-10 rounded-md border border-border px-3 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Select Type</option>
                {discountTypes.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            )}
          />
        </div>
      )}

      {/* Consumer Discount Type */}
      {showConsumer && (
        <div className="p-4 bg-muted rounded-lg border border-border">
          <Label className="text-sm font-medium text-foreground mb-3 block" translate="no">
            {t("consumer_discount_type")}
          </Label>
          <Controller
            name="consumerDiscountType"
            control={form.control}
            render={({ field }) => (
              <select
                value={field.value || ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                name={field.name}
                className="w-full h-10 rounded-md border border-border px-3 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Select Type</option>
                {discountTypes.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            )}
          />
        </div>
      )}
    </>
  );
};

export default BulkEditDiscountFields;
