"use client";
import React from "react";
import { Controller, UseFormReturn } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import { GroupBase } from "react-select";
import { IOption } from "@/utils/types/common.types";
import { BulkEditFormValues } from "./bulkEditTypes";
import BulkEditWhereToSell from "./BulkEditWhereToSell";

interface BulkEditLocationTabProps {
  form: UseFormReturn<BulkEditFormValues>;
  watchUpdateWarehouse: boolean;
  watchUpdateWhereToSell: boolean;
  memoizedBranches: IOption[];
  memoizedAllCountries: IOption[];
  selectedCountries: IOption[];
  setSelectedCountries: (v: IOption[]) => void;
  selectedStates: IOption[];
  setSelectedStates: (v: IOption[]) => void;
  selectedCities: IOption[];
  setSelectedCities: (v: IOption[]) => void;
  statesByCountry: Record<string, IOption[]>;
  citiesByState: Record<string, IOption[]>;
  groupedStateOptions: GroupBase<IOption>[];
  groupedCityOptions: GroupBase<IOption>[];
  onUpdateWhereToSell: () => void;
}

const BulkEditLocationTab: React.FC<BulkEditLocationTabProps> = ({
  form,
  watchUpdateWarehouse,
  watchUpdateWhereToSell,
  memoizedBranches,
  memoizedAllCountries,
  selectedCountries,
  setSelectedCountries,
  selectedStates,
  setSelectedStates,
  selectedCities,
  setSelectedCities,
  statesByCountry,
  citiesByState,
  groupedStateOptions,
  groupedCityOptions,
  onUpdateWhereToSell,
}) => {
  const t = useTranslations();

  return (
    <>
      {/* Warehouse Section */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2 mb-2">
          <div className="h-px bg-muted flex-1"></div>
          <div className="flex items-center space-x-2 px-3 bg-card">
            <Controller
              name="updateWarehouse"
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
              Warehouse
            </span>
          </div>
          <div className="h-px bg-muted flex-1"></div>
        </div>

        <div className={`space-y-2 ${!watchUpdateWarehouse ? "opacity-50 pointer-events-none" : ""}`}>
          <div className="p-3 bg-muted rounded border border-border">
            <Label className="text-xs font-medium text-foreground mb-2 block" translate="no">
              Select Branch
            </Label>
            <Controller
              name="branchId"
              control={form.control}
              render={({ field }) => (
                <select
                  {...field}
                  disabled={!watchUpdateWarehouse}
                  className="w-full h-8 capitalize rounded border border-border px-2 text-xs focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-transparent disabled:bg-muted disabled:cursor-not-allowed"
                >
                  <option value="">{t("select")}</option>
                  {memoizedBranches.map((branch: IOption) => (
                    <option key={branch.value} value={branch.value}>
                      {branch.label}
                    </option>
                  ))}
                </select>
              )}
            />
          </div>
        </div>
      </div>

      {/* Where to Sell Section */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2 mb-2">
          <div className="h-px bg-muted flex-1"></div>
          <div className="flex items-center space-x-2 px-3 bg-card">
            <Controller
              name="updateWhereToSell"
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
              Where to Sell
            </span>
          </div>
          <div className="h-px bg-muted flex-1"></div>
        </div>

        <BulkEditWhereToSell
          form={form}
          watchUpdateWhereToSell={watchUpdateWhereToSell}
          memoizedAllCountries={memoizedAllCountries}
          selectedCountries={selectedCountries}
          setSelectedCountries={setSelectedCountries}
          selectedStates={selectedStates}
          setSelectedStates={setSelectedStates}
          selectedCities={selectedCities}
          setSelectedCities={setSelectedCities}
          statesByCountry={statesByCountry}
          citiesByState={citiesByState}
          groupedStateOptions={groupedStateOptions}
          groupedCityOptions={groupedCityOptions}
          onUpdate={onUpdateWhereToSell}
        />
      </div>
    </>
  );
};

export default BulkEditLocationTab;
