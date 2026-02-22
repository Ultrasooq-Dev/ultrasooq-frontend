import React from "react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useFormContext } from "react-hook-form";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "@radix-ui/react-icons";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "next-intl";

interface ControlledDatePickerProps {
  label?: string;
  name: string;
  isFuture?: boolean;
  minDate?: Date;
  placeholder?: string;
}

// Helper function to convert Date to YYYY-MM-DD format
const formatDateForInput = (date: Date | string | undefined): string => {
  if (!date) return "";
  
  // If it's already a string in YYYY-MM-DD format, return it
  if (typeof date === "string") {
    // Check if it's a valid date string
    const parsed = new Date(date);
    if (!isNaN(parsed.getTime())) {
      return date.split('T')[0]; // Return just the date part if it includes time
    }
    return "";
  }
  
  // Ensure it's a Date object
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return "";
  }
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Helper function to convert YYYY-MM-DD string to Date
const parseDateFromInput = (dateString: string): Date | undefined => {
  if (!dateString) return undefined;
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? undefined : date;
};

const ControlledDatePicker: React.FC<ControlledDatePickerProps> = ({
  label,
  name,
  isFuture,
  minDate,
  placeholder
}) => {
  const t = useTranslations();
  const formContext = useFormContext();
  const { langDir } = useAuth();

  // Calculate min and max dates
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let min: Date | undefined;
  let max: Date | undefined;

  if (isFuture) {
    min = minDate || today;
    max = new Date(new Date().getFullYear() + 100, 11, 31);
  } else {
    // For past dates, allow from 1900 up to today
    min = minDate || new Date("1900-01-01");
    max = today;
  }

  return (
    <FormField
      control={formContext.control}
      name={name}
      render={({ field }) => (
        <FormItem className="space-y-2">
          {label && (
            <FormLabel className="text-sm font-medium text-gray-700" dir={langDir}>
              {label}
            </FormLabel>
          )}
          <FormControl>
            <div className="relative">
              <input
                type="date"
                value={formatDateForInput(field.value)}
                onChange={(e) => {
                  const date = parseDateFromInput(e.target.value);
                  field.onChange(date);
                }}
                min={formatDateForInput(min)}
                max={formatDateForInput(max)}
                placeholder={placeholder || t("enter") + " " + (label || t("date"))}
                className={cn(
                  "w-full h-12 px-4 py-3 pr-12 bg-white border border-gray-300 rounded-xl text-sm font-normal",
                  "hover:bg-gray-50 focus:ring-2 focus:ring-warning focus:border-warning",
                  "transition-all duration-200 outline-none",
                  "text-gray-900",
                  !field.value && "text-gray-500",
                  "[&::-webkit-calendar-picker-indicator]:cursor-pointer",
                  "[&::-webkit-calendar-picker-indicator]:opacity-0",
                  "[&::-webkit-calendar-picker-indicator]:absolute",
                  "[&::-webkit-calendar-picker-indicator]:right-4",
                  "[&::-webkit-calendar-picker-indicator]:w-5",
                  "[&::-webkit-calendar-picker-indicator]:h-5"
                )}
                dir={langDir}
                translate="no"
              />
              <CalendarIcon 
                className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" 
              />
            </div>
          </FormControl>
          <FormMessage className="text-sm text-destructive" />
        </FormItem>
      )}
    />
  );
};

export default ControlledDatePicker;