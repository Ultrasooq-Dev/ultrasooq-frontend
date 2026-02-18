import React from "react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input, InputProps } from "@/components/ui/input";
import { useFormContext } from "react-hook-form";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

interface ControlledTextInputProps extends InputProps {
  label?: string;
  name: string;
  showLabel?: boolean;
  stableId?: string;
}

const ControlledTextInput: React.FC<ControlledTextInputProps> = ({
  label,
  name,
  showLabel,
  stableId,
  ...props
}) => {
  const formContext = useFormContext();
  const { langDir } = useAuth();

  // Destructure value and defaultValue from props to prevent conflicts with field
  const { value: _value, defaultValue: _defaultValue, ...restProps } = props;

  return (
    <FormField
      control={formContext.control}
      name={name}
      render={({ field }) => (
        <FormItem stableId={stableId} className={cn(
          "mt-2 flex w-full flex-col gap-y-1",
          props.className || ""
        )}>
          {showLabel ? <FormLabel dir={langDir}>{label}</FormLabel> : null}
          <FormControl>
            <Input {...restProps} className="theme-form-control-s1" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default ControlledTextInput;
