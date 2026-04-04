"use client";

import React, { useState } from "react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input, InputProps } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { useFormContext } from "react-hook-form";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { EyeIcon, EyeOffIcon } from "lucide-react";

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
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = props.type === "password";

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
            {isPassword ? (
              <InputGroup className="theme-form-control-s1 h-auto">
                <InputGroupInput
                  {...restProps}
                  {...field}
                  type={showPassword ? "text" : "password"}
                  className="theme-form-control-s1 border-0 ring-0 focus-visible:ring-0"
                />
                <InputGroupAddon align="inline-end">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOffIcon className="size-4" />
                    ) : (
                      <EyeIcon className="size-4" />
                    )}
                  </button>
                </InputGroupAddon>
              </InputGroup>
            ) : (
              <Input {...restProps} className="theme-form-control-s1" {...field} />
            )}
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default ControlledTextInput;
