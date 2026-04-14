"use client";
import React from "react";
import { Controller, UseFormReturn } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { BulkEditFormValues } from "./bulkEditTypes";

interface BulkEditAskForTabProps {
  form: UseFormReturn<BulkEditFormValues>;
  watchUpdateAskFor: boolean;
  watchAskForPrice: string;
  watchAskForStock: string;
  onUpdate: () => void;
}

const BulkEditAskForTab: React.FC<BulkEditAskForTabProps> = ({
  form,
  watchUpdateAskFor,
  watchAskForPrice,
  watchAskForStock,
  onUpdate,
}) => {
  const hasValue =
    (watchAskForPrice && watchAskForPrice !== "") ||
    (watchAskForStock && watchAskForStock !== "");

  return (
    <div className="space-y-2">
      {/* Section header with checkbox */}
      <div className="flex items-center space-x-2 mb-2">
        <div className="h-px bg-muted flex-1"></div>
        <div className="flex items-center space-x-2 px-3 bg-card">
          <Controller
            name="updateAskFor"
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
            Ask For Settings
          </span>
        </div>
        <div className="h-px bg-muted flex-1"></div>
      </div>

      <div className={`space-y-2 ${!watchUpdateAskFor ? "opacity-50 pointer-events-none" : ""}`}>
        {/* Ask for Price */}
        <div className="p-3 bg-muted rounded border border-border">
          <Label className="text-xs font-medium text-foreground mb-2 block" translate="no">
            Ask for Price
          </Label>
          <Controller
            name="askForPrice"
            control={form.control}
            render={({ field }) => (
              <select
                {...field}
                disabled={!watchUpdateAskFor}
                className="w-full h-8 capitalize rounded border border-border px-2 text-xs focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-transparent disabled:bg-muted disabled:cursor-not-allowed"
              >
                <option value="">Select</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            )}
          />
        </div>

        {/* Ask for Stock */}
        <div className="p-3 bg-muted rounded border border-border">
          <Label className="text-xs font-medium text-foreground mb-2 block" translate="no">
            Ask for Stock
          </Label>
          <Controller
            name="askForStock"
            control={form.control}
            render={({ field }) => (
              <select
                {...field}
                disabled={!watchUpdateAskFor}
                className="w-full h-8 capitalize rounded border border-border px-2 text-xs focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-transparent disabled:bg-muted disabled:cursor-not-allowed"
              >
                <option value="">Select</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            )}
          />
        </div>

        {/* Update Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onUpdate}
            disabled={!watchUpdateAskFor || !hasValue}
            className={`w-full px-3 py-1.5 text-xs font-medium rounded focus:outline-hidden focus:ring-1 focus:ring-offset-1 transition-colors ${
              watchUpdateAskFor && hasValue
                ? "bg-warning text-white hover:bg-warning/90 focus:ring-warning"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            }`}
          >
            Update Ask For Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkEditAskForTab;
