import React from "react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFormContext } from "react-hook-form";
import Image from "next/image";
import { ControlledSelectOptions } from "@/utils/types/common.types";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";

interface ControlledSelectInputProps {
  label: string;
  name: string;
  options: ControlledSelectOptions[];
  placeholder?: string
}

const ControlledSelectInput: React.FC<ControlledSelectInputProps> = ({
  label,
  name,
  options,
  placeholder,
  ...props
}) => {
  const t = useTranslations();
  const { langDir } = useAuth();
  const formContext = useFormContext();

  return (
    <FormField
      control={formContext.control}
      name={name}
      render={({ field }) => (
        <FormItem className="mb-4" dir={langDir}>
          <FormLabel>{label}</FormLabel>
          <Select 
            onValueChange={(value: any) => {
              if (value) formContext.setValue(field.name, value);
            }} 
            value={field.value} 
            {...props} 
            // @ts-ignore
            dir={langDir}
          >
            <FormControl>
              <SelectTrigger className="theme-form-control-s1 data-placeholder:text-muted-foreground">
                <SelectValue placeholder={placeholder || `${t('select')} ${label}`} translate="no" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((item) => (
                <SelectItem key={item.value} value={item.value} dir={langDir}>
                  <div className="flex flex-row items-center py-2" dir={langDir}>
                    {item.icon ? (
                      <Image
                        src={item.icon}
                        className="mr-2"
                        width={20}
                        height={20}
                        alt="social-icon"
                      />
                    ) : null}

                    <span>{item.label}</span>
                  </div>
                </SelectItem>
              ))}

              {!options.length ? (
                <div className="flex flex-row justify-center py-3">
                  <span>No data available</span>
                </div>
              ) : null}
            </SelectContent>
          </Select>

          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default ControlledSelectInput;
