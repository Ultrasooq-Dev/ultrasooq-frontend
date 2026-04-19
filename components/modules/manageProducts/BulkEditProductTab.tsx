"use client";
import React from "react";
import { Controller, UseFormReturn } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import { BulkEditFormValues } from "./bulkEditTypes";
import { getProductConditions } from "./bulkEditUtils";

interface BulkEditProductTabProps {
  form: UseFormReturn<BulkEditFormValues>;
  watchUpdateBasic: boolean;
  watchProductCondition: string;
  onProductCondition: () => void;
  onShowConfirmation: (hide: boolean) => void;
}

const BulkEditProductTab: React.FC<BulkEditProductTabProps> = ({
  form,
  watchUpdateBasic,
  watchProductCondition,
  onProductCondition,
  onShowConfirmation,
}) => {
  const t = useTranslations();
  const productConditions = getProductConditions(t);

  return (
    <>
      {/* Product Condition Section */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2 mb-2">
          <div className="h-px bg-muted flex-1"></div>
          <div className="flex items-center space-x-2 px-3 bg-card">
            <span className="text-sm font-medium text-foreground" translate="no">
              Product Condition
            </span>
          </div>
          <div className="h-px bg-muted flex-1"></div>
        </div>

        <div className="p-4 bg-muted rounded-lg border border-border">
          <div className="space-y-3">
            <Label className="text-sm font-medium text-foreground mb-3 block" translate="no">
              Update Product Condition
            </Label>
            <Controller
              name="productCondition"
              control={form.control}
              render={({ field }) => (
                <select
                  {...field}
                  className="w-full h-10 rounded-md border border-border px-3 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">{t("select")}</option>
                  {productConditions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}
            />
            <button
              type="button"
              onClick={onProductCondition}
              disabled={!watchProductCondition}
              className={`w-full px-4 py-2 text-xs font-medium rounded-md focus:outline-hidden focus:ring-2 focus:ring-offset-2 transition-colors ${
                watchProductCondition
                  ? "bg-primary text-white hover:bg-primary/90 focus:ring-primary"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              }`}
            >
              Update Product Condition
            </button>
          </div>
        </div>
      </div>

      {/* Customer Visibility Section */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2 mb-2">
          <div className="h-px bg-muted flex-1"></div>
          <div className="flex items-center space-x-2 px-3 bg-card">
            <span className="text-sm font-medium text-foreground" translate="no">
              Customer Visibility
            </span>
          </div>
          <div className="h-px bg-muted flex-1"></div>
        </div>

        <div className="p-3 bg-muted rounded border border-border">
          <div className="space-y-2">
            <Label className="text-xs font-medium text-foreground" translate="no">
              Control Customer Visibility
            </Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onShowConfirmation(true)}
                className="flex-1 px-3 py-2 bg-destructive text-white text-xs font-medium rounded hover:bg-destructive/90 focus:outline-hidden focus:ring-1 focus:ring-destructive focus:ring-offset-1 transition-colors"
              >
                ⚠️ Hide from Customers
              </button>
              <button
                type="button"
                onClick={() => onShowConfirmation(false)}
                className="flex-1 px-3 py-2 bg-success text-white text-xs font-medium rounded hover:bg-success/90 focus:outline-hidden focus:ring-1 focus:ring-success focus:ring-offset-1 transition-colors"
              >
                ✅ Show to Customers
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Basic Settings Section */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2 mb-2">
          <div className="h-px bg-muted flex-1"></div>
          <div className="flex items-center space-x-2 px-3 bg-card">
            <Controller
              name="updateBasic"
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
            <span className="text-sm font-medium text-foreground" translate="no">
              Basic Settings
            </span>
          </div>
          <div className="h-px bg-muted flex-1"></div>
        </div>

        <div className={`space-y-2 ${!watchUpdateBasic ? "opacity-50 pointer-events-none" : ""}`}>
          <div className="p-3 bg-muted rounded border border-border">
            <div className="flex items-center space-x-3">
              <Controller
                name="enableChat"
                control={form.control}
                render={({ field }) => (
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                    disabled={!watchUpdateBasic}
                    className="h-4 w-4 text-primary focus:ring-primary border-border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                )}
              />
              <Label className="text-sm font-medium text-foreground" translate="no">
                Enable Chat
              </Label>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BulkEditProductTab;
