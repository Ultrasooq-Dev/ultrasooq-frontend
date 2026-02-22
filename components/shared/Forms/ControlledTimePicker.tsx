import React from "react";
import { useFormContext, Controller } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "next-intl";
import { Clock } from "lucide-react";

interface ControlledTimePickerProps {
  label?: string;
  name: string;
}

const generateTimeOptions = () => {
  const times = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const timeString = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
      const displayTime = new Date(`2000-01-01T${timeString}`).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      times.push({ value: timeString, label: displayTime });
    }
  }
  return times;
};

export const timeOptions = generateTimeOptions();

const ControlledTimePicker: React.FC<ControlledTimePickerProps> = ({
  label,
  name,
}) => {
  const t = useTranslations();
  const { control } = useFormContext();
  const { langDir } = useAuth();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <FormItem className="space-y-2">
          {label && (
            <FormLabel className="text-sm font-medium text-gray-700" dir={langDir}>
              {label}
            </FormLabel>
          )}
          <Popover>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full h-12 px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm text-left font-normal hover:bg-gray-50 focus:ring-2 focus:ring-warning focus:border-warning transition-all duration-200",
                    !field.value && "text-gray-500"
                  )}
                  dir={langDir}
                  translate="no"
                >
                  <div className="flex items-center justify-between w-full">
                    <span>
                  {field.value ? (
                        timeOptions.find(option => option.value === field.value)?.label || field.value
                  ) : (
                        t("select") + " " + (label || t("time"))
                      )}
                    </span>
                    <Clock className="h-5 w-5 text-gray-400" />
                  </div>
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent
              className="w-64 p-0 bg-white shadow-xl border border-gray-200 rounded-xl"
              align={langDir === 'rtl' ? 'end' : 'start'}
            >
              <div className="p-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-warning" />
                  {t("select_time")}
                </h4>
                <ScrollArea className="h-64">
                  <div className="space-y-1">
                    {timeOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => field.onChange(option.value)}
                        className={cn(
                          "w-full px-3 py-2 text-left text-sm rounded-lg transition-colors hover:bg-warning/5 hover:text-warning",
                          field.value === option.value
                            ? "bg-warning text-white hover:bg-warning hover:text-white"
                            : "text-gray-700"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span>{option.label}</span>
                          <span className="text-xs opacity-70">{option.value}</span>
                        </div>
                      </button>
                ))}
                  </div>
                </ScrollArea>
              </div>
            </PopoverContent>
          </Popover>
          <FormMessage className="text-sm text-destructive" />
        </FormItem>
      )}
    />
  );
};

export default ControlledTimePicker;