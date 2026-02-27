import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Select as SelectPrimitive } from "radix-ui";
import { useTranslations } from "next-intl";

interface SelectInputProps extends SelectPrimitive.SelectProps {
  label: string;
  options: { label: string; value: string }[];
}

const SelectInput: React.FC<SelectInputProps> = ({
  label,
  options,
  ...props
}) => {
  const t = useTranslations();
  return (
    <Select {...props}>
      <SelectTrigger className="theme-form-control-s1 data-placeholder:text-muted-foreground">
        <SelectValue placeholder={`${t('select')} ${label}`} />
      </SelectTrigger>
      <SelectContent>
        {options.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            <div className="flex flex-row items-center py-2">
              <span>{t(item.label)}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default SelectInput;
