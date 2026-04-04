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

interface ControlledNumberInputProps extends InputProps {
    label?: string;
    name: string;
    showLabel?: boolean
}

const ControlledNumberInput: React.FC<ControlledNumberInputProps> = ({
    label,
    name,
    showLabel = false,
    ...props
}) => {
    const formContext = useFormContext();

    // Destructure value and defaultValue from props to prevent conflicts with field
    const { value: _value, defaultValue: _defaultValue, onChange: propsOnChange, ...restProps } = props;

    return (
        <FormField
            control={formContext.control}
            name={name}
            render={({ field }) => (
                <FormItem className={cn(
                    "mt-2 flex w-full flex-col gap-y-1",
                    props.className || ""
                )}>
                    {showLabel ? <FormLabel>{label}</FormLabel> : null}
                    <FormControl>
                        <Input
                            {...restProps}
                            className="theme-form-control-s1"
                            {...field}
                            onChange={(e) => {
                                let value = e.target.value.replace(/[^0-9.]/g, "");

                                // Remove extra decimal points
                                const parts = value.split(".");
                                if (parts.length > 2) {
                                    value = parts[0] + "." + parts.slice(1).join(""); // only first dot remains
                                }

                                // Call your custom onChange if provided
                                propsOnChange?.({
                                    ...e,
                                    target: {
                                        ...e.target,
                                        value,
                                    },
                                });

                                // Also update the field value via react-hook-form
                                field.onChange(value);
                            }}
                        />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
    );
};

export default ControlledNumberInput;
