import React from "react";
import { useFormContext } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";

interface ControlledCheckboxInputProps {
  label: string;
  name: string;
  options: {
    label: string;
    value: string;
  }[];
}

const ControlledCheckboxInput: React.FC<ControlledCheckboxInputProps> = ({
  label,
  name,
  options,
}) => {
  const formContext = useFormContext();

  return (
    <FormField
      control={formContext.control}
      name={name}
      render={() => (
        <FormItem>
          <div className="mb-4">
            <FormLabel className="text-base">{label}</FormLabel>
          </div>
          {options.map((item) => (
            <FormField
              key={item.value}
              control={formContext.control}
              name={name}
              render={({ field }) => {
                return (
                  <FormItem
                    key={item.value}
                    className="flex flex-row items-start space-x-3 space-y-0"
                  >
                    <FormControl>
                      <Checkbox
                        className="border border-solid border-border data-[state=checked]:bg-dark-orange!"
                        checked={field.value?.includes(item.value)}
                        onCheckedChange={(checked) => {
                          // return;
                          // return checked
                          //   ? field.onChange([...field.value, item.value])
                          //   : field.onChange(
                          //       field.value?.filter(
                          //         (value: string) => value !== item.value,
                          //       ),
                          //     );
                          return checked
                            ? field.onChange([item.value])
                            : field.onChange([]);
                        }}
                      />
                    </FormControl>
                    <FormLabel className="font-normal">{item.label}</FormLabel>
                  </FormItem>
                );
              }}
            />
          ))}
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default ControlledCheckboxInput;
