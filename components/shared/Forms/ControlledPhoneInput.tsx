import React from "react";
import { Controller, useFormContext } from "react-hook-form";
import { cn } from "@/lib/utils";
import PhoneInput, { CountryData, PhoneInputProps } from "react-phone-input-2";
import "react-phone-input-2/lib/bootstrap.css";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";

interface ControlledPhoneInputProps extends PhoneInputProps {
  label?: string;
  name: string;
  countryName: string;
}

const ControlledPhoneInput: React.FC<ControlledPhoneInputProps> = ({
  label,
  name,
  countryName,
  ...props
}) => {
  const { langDir } = useAuth();
  const formContext = useFormContext();

  const getError = () => {
    if (name.includes(".")) {
      const nameArray = name.split(".");

      // TODO: Fix type error
      let error: any = formContext.formState.errors;

      nameArray.forEach((item) => {
        if (item) {
          error = error?.[item];
        }
      });

      return error?.message;
    }

    return formContext.formState.errors?.[name]?.message;
  };

  return (
    <div className="mt-0 flex w-full flex-col justify-between space-y-3">
      <Label dir={langDir}>
        {label}
      </Label>
      <Controller
        control={formContext.control}
        name={name}
        render={({ field }) => (
          <PhoneInput
            {...props}
            country={"eg"}
            enableSearch={true}
            value={field.value}
            onChange={(phone: string, country: CountryData) => {
              formContext.setValue(countryName, `+${country.dialCode}`);
              field.onChange(`+${phone}`);
            }}
            inputClass="theme-form-control-s1 w-full!"
          />
        )}
      />
      <p className="text-[13px] font-medium text-destructive" dir={langDir}>
        {getError() as string}
      </p>
    </div>
  );
};

export default ControlledPhoneInput;
