import React, { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";

type CounterTextInputFieldProps = {
  name: string;
  label?: string;
  placeholder: string;
  errorMessage?: string;
};

const CounterTextInputField: React.FC<CounterTextInputFieldProps> = ({
  name,
  label,
  placeholder,
  errorMessage,
}) => {
  const formContext = useFormContext();
  const [counter, setCounter] = useState(0);
  const { langDir } = useAuth();

  useEffect(() => {
    setCounter(formContext.watch(name));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formContext.watch(name), name]);

  return (
    <FormField
      control={formContext.control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-col">
          <FormLabel dir={langDir}>{label}</FormLabel>
          <FormControl>
            <div className="relative">
              <button
                type="button"
                className="absolute left-2 top-[6px] z-10 flex h-[34px] w-[32px] items-center justify-center bg-[#F6F6F6]!"
                onClick={() => {
                  setCounter(Number(counter) - 1);
                  field.onChange(Number(counter) - 1);
                }}
                disabled={counter === 0}
              >
                -
              </button>
              <Input
                type="number"
                onWheel={(e) => e.currentTarget.blur()}
                placeholder={placeholder}
                className="h-[48px]! rounded border-gray-300 px-12 text-center focus-visible:ring-0!"
                {...field}
                value={counter}
                onChange={(e) => {
                  setCounter(Number(e.target.value));
                  field.onChange(e);
                }}
              />
              <button
                type="button"
                className="absolute right-2 top-[6px] z-10 flex h-[34px] w-[32px] items-center justify-center bg-[#F6F6F6]!"
                onClick={() => {
                  setCounter(Number(counter) + 1);
                  field.onChange(Number(counter) + 1);
                }}
              >
                +
              </button>
            </div>
          </FormControl>
          <FormMessage />
          <p className="text-[13px] text-red-500" dir={langDir}>{errorMessage}</p>
        </FormItem>
      )}
    />
  );
};

export default CounterTextInputField;
