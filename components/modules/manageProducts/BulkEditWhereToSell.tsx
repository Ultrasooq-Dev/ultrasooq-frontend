"use client";
import React from "react";
import { Controller, UseFormReturn } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import ReactSelect, { MultiValue, GroupBase } from "react-select";
import { IOption } from "@/utils/types/common.types";
import { BulkEditFormValues } from "./bulkEditTypes";
import { reactSelectCustomStyles } from "./bulkEditUtils";

interface BulkEditWhereToSellProps {
  form: UseFormReturn<BulkEditFormValues>;
  watchUpdateWhereToSell: boolean;
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
  onUpdate: () => void;
}

const BulkEditWhereToSell: React.FC<BulkEditWhereToSellProps> = ({
  form,
  watchUpdateWhereToSell,
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
  onUpdate,
}) => {
  const t = useTranslations();
  const hasSelection =
    selectedCountries.length > 0 || selectedStates.length > 0 || selectedCities.length > 0;

  return (
    <div className={`space-y-2 ${!watchUpdateWhereToSell ? "opacity-50 pointer-events-none" : ""}`}>
      {/* Country */}
      <div className="p-3 bg-muted rounded border border-border">
        <Label className="text-xs font-medium text-foreground mb-2 block" translate="no">
          {t("select_multiple_country")}
        </Label>
        <Controller
          name="sellCountryIds"
          control={form.control}
          render={({ field }) => (
            <ReactSelect
              isMulti
              isDisabled={!watchUpdateWhereToSell}
              onChange={(newValues: MultiValue<IOption>) => {
                const newCountries = newValues || [];
                setSelectedCountries([...newCountries]);
                field.onChange(newCountries);
                const updatedStates = selectedStates.filter((state) =>
                  newCountries.some((country) =>
                    statesByCountry[country.value]?.some((s) => s.value === state.value),
                  ),
                );
                setSelectedStates(updatedStates);
                form.setValue("sellStateIds", updatedStates);
                const updatedCities = selectedCities.filter((city) =>
                  updatedStates.some((state) =>
                    citiesByState[state.value]?.some((c) => c.value === city.value),
                  ),
                );
                setSelectedCities(updatedCities);
                form.setValue("sellCityIds", updatedCities);
              }}
              options={memoizedAllCountries}
              value={selectedCountries}
              styles={reactSelectCustomStyles}
              instanceId="sellCountryIds"
              placeholder={t("select")}
              menuPortalTarget={typeof document !== "undefined" ? document.body : null}
              menuPosition="fixed"
              onBlur={field.onBlur}
              name={field.name}
              ref={field.ref}
            />
          )}
        />
      </div>

      {/* State */}
      <div className="p-3 bg-muted rounded border border-border">
        <Label className="text-xs font-medium text-foreground mb-2 block" translate="no">
          {t("select_multiple_state")}
        </Label>
        <Controller
          name="sellStateIds"
          control={form.control}
          render={({ field }) => (
            <ReactSelect
              isMulti
              isDisabled={!watchUpdateWhereToSell}
              onChange={(newValues: MultiValue<IOption>) => {
                const newStates = newValues || [];
                field.onChange(newStates);
                setSelectedStates([...newStates]);
                const updatedCities = selectedCities.filter((city) =>
                  newStates.some((state) =>
                    citiesByState[state.value]?.some((c) => c.value === city.value),
                  ),
                );
                setSelectedCities(updatedCities);
                form.setValue("sellCityIds", updatedCities);
              }}
              options={selectedCountries.length > 0 ? groupedStateOptions : []}
              value={selectedStates}
              styles={reactSelectCustomStyles}
              instanceId="sellStateIds"
              placeholder={selectedCountries.length > 0 ? t("select") : "Select countries first"}
              menuPortalTarget={typeof document !== "undefined" ? document.body : null}
              menuPosition="fixed"
              onBlur={field.onBlur}
              name={field.name}
              ref={field.ref}
            />
          )}
        />
      </div>

      {/* City */}
      <div className="p-3 bg-muted rounded border border-border">
        <Label className="text-xs font-medium text-foreground mb-2 block" translate="no">
          {t("select_multiple_city")}
        </Label>
        <Controller
          name="sellCityIds"
          control={form.control}
          render={({ field }) => (
            <ReactSelect
              isMulti
              isDisabled={!watchUpdateWhereToSell}
              onChange={(newValues: MultiValue<IOption>) => {
                const newCities = newValues || [];
                field.onChange(newCities);
                setSelectedCities([...newCities]);
              }}
              options={selectedStates.length > 0 ? groupedCityOptions : []}
              value={selectedCities}
              styles={reactSelectCustomStyles}
              instanceId="sellCityIds"
              placeholder={selectedStates.length > 0 ? t("select") : "Select states first"}
              menuPortalTarget={typeof document !== "undefined" ? document.body : null}
              menuPosition="fixed"
              onBlur={field.onBlur}
              name={field.name}
              ref={field.ref}
            />
          )}
        />
      </div>

      {/* Place of Origin */}
      <div className="p-3 bg-muted rounded border border-border">
        <Label className="text-xs font-medium text-foreground mb-2 block" translate="no">
          {t("place_of_origin")}
        </Label>
        <Controller
          name="placeOfOriginId"
          control={form.control}
          render={({ field }) => (
            <ReactSelect
              isDisabled={!watchUpdateWhereToSell}
              onChange={(newValue) => { field.onChange(newValue?.value || ""); }}
              options={memoizedAllCountries}
              value={memoizedAllCountries.find((item: IOption) => item.value === field.value)}
              styles={reactSelectCustomStyles}
              instanceId="placeOfOriginId"
              placeholder={memoizedAllCountries.length > 0 ? t("select") : "Loading countries..."}
              menuPortalTarget={typeof document !== "undefined" ? document.body : null}
              menuPosition="fixed"
              onBlur={field.onBlur}
              name={field.name}
              ref={field.ref}
            />
          )}
        />
      </div>

      {/* Update Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onUpdate}
          disabled={!watchUpdateWhereToSell || !hasSelection}
          className={`w-full px-3 py-1.5 text-xs font-medium rounded focus:outline-hidden focus:ring-1 focus:ring-offset-1 transition-colors ${
            watchUpdateWhereToSell && hasSelection
              ? "bg-info text-white hover:bg-info/90 focus:ring-info"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          }`}
        >
          Update Where to Sell
        </button>
      </div>
    </div>
  );
};

export default BulkEditWhereToSell;
