import React, { useEffect, useMemo, useRef, useState } from "react";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { IoCloseSharp } from "react-icons/io5";
import ControlledTextInput from "@/components/shared/Forms/ControlledTextInput";
import { Controller, useForm, useFormContext } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import CreatableSelect from "react-select/creatable";
import Select from "react-select";
import { IOption, IUserRoles } from "@/utils/types/common.types";
import { useToast } from "@/components/ui/use-toast";
import {
  useUserRoles,
  useCreateUserRole,
} from "@/apis/queries/masters.queries";
import {
  useCreateMember,
  useUpdateMember,
} from "@/apis/queries/member.queries";
import { Label } from "@/components/ui/label";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";

const customStyles = {
  control: (base: any) => ({ ...base, height: 48, minHeight: 48 }),
};

type AddToMemberFormProps = {
  onClose: () => void;
  memberDetails: any;
};

const addFormSchema = (t: any) => {
  return z.object({
    firstName: z
      .string()
      .trim()
      .min(2, { message: t("first_name_required") })
      .regex(/^[A-Za-z\s]+$/, {
        message: t("first_name_must_only_contain_letters"),
      }),
  
    lastName: z
      .string()
      .trim()
      .regex(/^$|^[A-Za-z\s]+$/, { message: t("last_name_must_only_contain_letters") })
      .optional(), // Apply validation first, then make it optional
  
    email: z
      .string()
      .trim()
      .min(2, { message: t("email_is_required") })
      .email({ message: t("invalid_email_address") }),

    userRoleId: z.number({ required_error: t("user_role_required") })
      .min(1, { message: t("user_role_required") }), // Ensure it stays a number

    tradeRole: z.string().optional(),
    
    phoneNumber: z
      .string()
      .trim()
      .regex(/^[0-9]{10,15}$/, { message: t("phone_number_must_be_10_15_digits") })
      .optional(), // Apply validation first, then make it optional
  
    status: z.enum(["ACTIVE", "INACTIVE"], {
      message: t("status_must_be_active_inactive"),
    }), // ✅ Added status field
  })
};

const AddToMemberForm: React.FC<AddToMemberFormProps> = ({
  onClose,
  memberDetails,
}) => {
  const t = useTranslations();
  const { langDir } = useAuth();
  const createUserRole = useCreateUserRole();
  const { toast } = useToast();
  const [, setValue] = useState<IOption | null>();
  const userRolesQuery = useUserRoles();
  const createMember = useCreateMember();
  const updateMember = useUpdateMember();
  const [selectedOption, setSelectedOption] = useState<string>("ACTIVE");

  const memoizedUserRole = useMemo(() => {
    return userRolesQuery?.data?.data
      ? userRolesQuery.data.data.map((item: IUserRoles) => ({
          label: item.userRoleName,
          value: item.id,
        }))
      : [];
  }, [userRolesQuery?.data?.data]);

  const handleCreate = async (inputValue: string) => {
    const response = await createUserRole.mutateAsync({
      userRoleName: inputValue,
    });

    if (response.status && response.data) {
      toast({
        title: t("user_role_create_successful"),
        description: response.message,
        variant: "success",
      });
      setValue({ label: response.data.userRoleName, value: response.data.id });
      form.setValue("userRoleId", response.data.id);
    } else {
      toast({
        title: t("user_role_create_failed"),
        description: response.message,
        variant: "danger",
      });
    }
  };

  // Default values based on whether editing or adding a new member
  const addDefaultValues = {
    firstName: memberDetails?.firstName || "",
    lastName: memberDetails?.lastName || "",
    email: memberDetails?.email || "",
    userRoleId: Number(memberDetails?.userRoleId) || undefined,
    tradeRole: memberDetails?.tradeRole || "MEMBER",
    phoneNumber: memberDetails?.phoneNumber || "",
    status: memberDetails?.status || "ACTIVE",
  };

  const form = useForm({
    resolver: zodResolver(addFormSchema(t)),
    defaultValues: addDefaultValues,
  });

  const onSubmit = async (formData: any) => {
    const updatedFormData = { ...formData };
    
    let response;
    if (memberDetails) {
      response = await updateMember.mutateAsync({
        memberId: memberDetails.id,
        ...formData,
      });
    } else {
      response = await createMember.mutateAsync(formData);
    }

    if (response.status) {
      onClose();
      toast({
        title: response.message,
        description: response.message,
        variant: "success",
      });
    } else {
      toast({
        title: response.message,
        description: response.message,
        variant: "danger",
      });
    }
  };
  return (
    <>
      <div className="modal-header justify-between!" dir={langDir}>
        <DialogTitle className="text-center text-xl font-bold" translate="no">
          {memberDetails ? t("edit_member") : t("add_member")}
        </DialogTitle>
        <Button
          onClick={onClose}
          className={`${langDir == 'ltr' ? 'absolute' : ''} right-2 top-2 z-10 bg-white! text-black! shadow-none`}
        >
          <IoCloseSharp size={20} />
        </Button>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="card-item card-payment-form px-5 pb-5 pt-3"
        >
          <ControlledTextInput
            label={t("first_name")}
            name="firstName"
            placeholder={t("first_name_placeholder")}
            type="text"
            dir={langDir}
            translate="no"
          />

          <ControlledTextInput
            label={t("last_name")}
            name="lastName"
            placeholder={t("last_name_placeholder")}
            type="text"
            dir={langDir}
            translate="no"
          />

          <ControlledTextInput
            label={t("email")}
            name="email"
            placeholder={t("email_placeholder")}
            type="text"
            readOnly={memberDetails}
            dir={langDir}
            translate="no"
          />

          <ControlledTextInput
            label={t("phone_number")}
            name="phoneNumber"
            placeholder={t("phone_number_placeholder")}
            type="number"
            dir={langDir}
          />

          <div className="flex w-full items-center gap-1.5" dir={langDir}>
            <Label  dir={langDir} translate="no">{t("user_role")}</Label>
          </div>
          <Controller
            name="userRoleId"
            control={form.control} // ✅ Use form.control instead
            render={({ field }) => (
              <>
                <Select
                  name={field.name}
                  onChange={(newValue) => {
                    const numericValue = newValue ? Number(newValue.value) : 0; // Ensure it's a number
                    field.onChange(numericValue); // Pass the correct numeric value
                    setValue(newValue);
                  }}
                  options={memoizedUserRole}
                  value={
                    memoizedUserRole.find(
                      (item: IOption) => Number(item.value) === field.value, // Use form state value instead of fixed memberDetails value
                    ) ||
                    memoizedUserRole.find(
                      (item: IOption) =>
                        Number(item.value) === memberDetails?.userRoleId,
                    )
                  } // Default to memberDetails value if not set
                  styles={customStyles}
                  instanceId="userRoleId"
                  className="z-9999"
                  isSearchable={true} // Keep search enabled
                  placeholder={t("select")}
                  isRtl={langDir == 'rtl'}
                />
                {/* Validation Error Message */}
                {form.formState.errors.userRoleId ? (
                  <p className="text-sm text-destructive" dir={langDir}>
                    {form.formState.errors.userRoleId.message}
                  </p>
                ) : null}
              </>
            )}
          />

          <div className="flex w-full items-center gap-1.5" dir={langDir}>
            <Label dir={langDir} translate="no">{t("status")}</Label>
          </div>
          <Controller
            name="status"
            control={form.control}
            render={({ field }) => (
              <Select
                options={[
                  { value: "ACTIVE", label: t("active").toUpperCase(), },
                  { value: "INACTIVE", label: t("inactive").toUpperCase() },
                ]}
                onChange={(selectedOption) =>
                  field.onChange(selectedOption?.value)
                }
                className="z-999"
                instanceId="status"
                styles={customStyles}
                placeholder={t("select")}
                isRtl={langDir == 'rtl'}
              />
            )}
          />

          <Button
            type="submit"
            className="theme-primary-btn mt-2 h-12 w-full rounded bg-dark-orange text-center text-lg font-bold leading-6"
            dir={langDir}
            translate="no"
          >
            {memberDetails ? t("edit_member") : t("add_member")}
          </Button>
        </form>
      </Form>
    </>
  );
};

export default AddToMemberForm;
