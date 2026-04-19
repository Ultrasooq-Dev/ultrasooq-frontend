"use client";
import React from "react";
import { Controller } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { DAYS_OF_WEEK, HOURS_24_FORMAT } from "@/utils/constants";
import { getAmPm } from "@/utils/helper";
import { UseFormReturn } from "react-hook-form";

interface BranchWorkingHoursProps {
  form: UseFormReturn<any>;
  index: number;
  langDir: string;
}

export default function BranchWorkingHours({ form, index, langDir }: BranchWorkingHoursProps) {
  const t = useTranslations();

  return (
    <div className="flex w-full flex-wrap">
      <div className="mb-4 w-full">
        <div className="mt-2.5 w-full border-b-2 border-dashed border-border">
          <label
            className="mb-3.5 block text-left text-lg font-medium capitalize leading-5 text-color-dark"
            dir={langDir}
            translate="no"
          >
            {t("branch_working_hours")}
          </label>
        </div>
      </div>

      <div className="w-full">
        <div className="flex flex-wrap">
          {/* Start Time */}
          <div className="mb-4 flex w-full flex-col gap-y-3 md:w-6/12 md:pr-3.5">
            <Label htmlFor="startTime" className="text-color-dark" dir={langDir} translate="no">
              {t("start_time")}
            </Label>
            <Controller
              name={`branchList.${index}.startTime`}
              control={form.control}
              render={({ field }) => (
                <select
                  {...field}
                  className="h-12! w-full rounded border border-border! px-3 text-base focus-visible:ring-0!"
                >
                  <option value="" dir={langDir} translate="no">{t("select")}</option>
                  {HOURS_24_FORMAT.map((hour: string, i: number) => (
                    <option key={i} value={hour} dir={langDir}>{getAmPm(hour)}</option>
                  ))}
                </select>
              )}
            />
            <p className="text-[13px] text-destructive" dir={langDir}>
              {(form.formState.errors.branchList as any)?.[index]?.startTime?.message}
            </p>
          </div>

          {/* End Time */}
          <div className="mb-4 flex w-full flex-col gap-y-3 md:w-6/12 md:pl-3.5">
            <Label htmlFor="endTime" className="text-color-dark" dir={langDir} translate="no">
              {t("end_time")}
            </Label>
            <Controller
              name={`branchList.${index}.endTime`}
              control={form.control}
              render={({ field }) => (
                <select
                  {...field}
                  className="h-12! w-full rounded border border-border! px-3 text-base focus-visible:ring-0!"
                >
                  <option value="" dir={langDir} translate="no">{t("select")}</option>
                  {HOURS_24_FORMAT.map((hour: string, i: number) => (
                    <option key={i} value={hour} dir={langDir}>{getAmPm(hour)}</option>
                  ))}
                </select>
              )}
            />
            <p className="text-[13px] text-destructive" dir={langDir}>
              {(form.formState.errors.branchList as any)?.[index]?.endTime?.message}
            </p>
          </div>
        </div>
      </div>

      {/* Working Days */}
      <div className="mb-3.5 w-full border-b-2 border-dashed border-border pb-4">
        <div className="flex flex-wrap">
          {DAYS_OF_WEEK.map((item) => (
            <FormField
              key={item.value}
              control={form.control}
              name={`branchList.${index}.workingDays`}
              render={({ field }) => (
                <FormItem className="mb-4 mr-4 flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      onCheckedChange={(e) => {
                        field.onChange({ ...field.value, [item.value]: e ? 1 : 0 });
                      }}
                      checked={!!field.value[item.value as keyof typeof field.value]}
                      className="border border-solid border-border data-[state=checked]:bg-dark-orange!"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-light-gray">{t(item.label)}</FormLabel>
                  </div>
                </FormItem>
              )}
            />
          ))}
        </div>
        {(form.formState.errors.branchList as any)?.[index]?.workingDays?.message ? (
          <p className="text-[13px] text-destructive" dir={langDir} translate="no">
            {t("working_day_required")}
          </p>
        ) : null}
      </div>
    </div>
  );
}
