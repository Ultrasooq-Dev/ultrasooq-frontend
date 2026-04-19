"use client";
import React from "react";
import { Controller, UseFormReturn } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import { BulkEditFormValues } from "./bulkEditTypes";
import { getSellTypes, getConsumerTypes } from "./bulkEditUtils";
import BulkEditDiscountFields from "./BulkEditDiscountFields";

interface BulkEditDiscountsTabProps {
  form: UseFormReturn<BulkEditFormValues>;
  watchUpdateDiscounts: boolean;
  watchConsumerType: string;
  watchSellType: string;
  onUpdate: () => void;
}

const BulkEditDiscountsTab: React.FC<BulkEditDiscountsTabProps> = ({
  form,
  watchUpdateDiscounts,
  watchConsumerType,
  watchSellType,
  onUpdate,
}) => {
  const t = useTranslations();
  const sellTypes = getSellTypes(t);
  const consumerTypes = getConsumerTypes(t);
  const bothSelected = watchConsumerType && watchSellType && watchUpdateDiscounts;

  return (
    <div className="space-y-2">
      {/* Section header with checkbox */}
      <div className="flex items-center space-x-2 mb-2">
        <div className="h-px bg-muted flex-1"></div>
        <div className="flex items-center space-x-2 px-3 bg-card">
          <Controller
            name="updateDiscounts"
            control={form.control}
            render={({ field }) => (
              <input
                type="checkbox"
                checked={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                name={field.name}
                ref={field.ref}
                className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
              />
            )}
          />
          <h3 className="text-sm font-semibold text-muted-foreground" translate="no">
            {t("discounts")}
          </h3>
        </div>
        <div className="h-px bg-muted flex-1"></div>
      </div>

      {/* Consumer Type */}
      <div className="p-4 rounded-lg border bg-muted border-border">
        <Label className="text-sm font-medium text-foreground mb-3 block" translate="no">
          {t("consumer_type")}
        </Label>
        <Controller
          name="consumerType"
          control={form.control}
          render={({ field }) => (
            <select
              {...field}
              disabled={!watchUpdateDiscounts}
              className={`w-full h-10 rounded-md border px-3 text-sm focus:outline-hidden focus:ring-2 focus:border-transparent ${
                watchUpdateDiscounts
                  ? "border-border focus:ring-primary"
                  : "border-border bg-muted cursor-not-allowed"
              }`}
            >
              <option value="">{t("select")}</option>
              {consumerTypes.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
        />
      </div>

      {/* Sell Type */}
      <div className="p-4 rounded-lg border bg-muted border-border">
        <Label className="text-sm font-medium text-foreground mb-3 block" translate="no">
          {t("sell_type")}
        </Label>
        <Controller
          name="sellType"
          control={form.control}
          render={({ field }) => (
            <select
              {...field}
              disabled={!watchUpdateDiscounts}
              className={`w-full h-10 rounded-md border px-3 text-sm focus:outline-hidden focus:ring-2 focus:border-transparent ${
                watchUpdateDiscounts
                  ? "border-border focus:ring-primary"
                  : "border-border bg-muted cursor-not-allowed"
              }`}
            >
              <option value="">{t("select")}</option>
              {sellTypes.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
        />
      </div>

      {bothSelected ? (
        <>
          <BulkEditDiscountFields
            form={form}
            watchSellType={watchSellType}
            watchConsumerType={watchConsumerType}
          />

          {/* Update Button */}
          <div className="pt-4">
            <button
              type="button"
              onClick={onUpdate}
              className="w-full px-4 py-2 bg-success text-white text-xs font-medium rounded-md hover:bg-success/90 focus:outline-hidden focus:ring-2 focus:ring-success focus:ring-offset-2 transition-colors"
            >
              Update Discounts
            </button>
          </div>
        </>
      ) : (
        watchUpdateDiscounts && (
          <div className="p-6 text-center">
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <div className="text-primary text-sm font-medium mb-2">
                {t("select_consumer_type_and_sell_type")}
              </div>
              <div className="text-primary text-xs">
                {t("choose_consumer_type_and_sell_type_to_see_options")}
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default BulkEditDiscountsTab;
