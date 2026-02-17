import React from "react";
import { Form } from "@/components/ui/form";
import { DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { IoCloseSharp } from "react-icons/io5";
import ControlledTextInput from "@/components/shared/Forms/ControlledTextInput";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/components/ui/use-toast";
import {
  useCreateUserRole,
  useUpdateUserRole
} from "@/apis/queries/masters.queries";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";

type AddToRoleFormProps = {
  onClose: () => void;
  updatePermission: (roleId: number) => void;
  roleDetails: any;
};

const addFormSchema = (t: any) => {
  return z.object({
    userRoleName: z
      .string()
      .trim()
      .min(2, { message: t("role_name_required") })
      .regex(/^[A-Za-z\s]+$/, { message: t("role_number_must_only_contain_letters") }),
  });
};


const AddToRoleForm: React.FC<AddToRoleFormProps> = ({ onClose, updatePermission, roleDetails }) => {
  const t = useTranslations();
  const { langDir } = useAuth();
  const createUserRole = useCreateUserRole();
  const updateUserRole = useUpdateUserRole();
  const { toast } = useToast();

  const addDefaultValues = {
    userRoleName: roleDetails?.label || "",
  };

  const form = useForm({
    resolver: zodResolver(addFormSchema(t)),
    defaultValues: addDefaultValues,
  });

  const onSubmit = async (formData: any) => {
    const updatedFormData = { ...formData };
    let response;
    if (roleDetails) {
      response = await updateUserRole.mutateAsync({ userRoleId: roleDetails.value, ...formData });
    } else {
      response = await createUserRole.mutateAsync(formData);
    }
    if (response.status) {
      onClose();
      updatePermission(response.data.id);
      toast({
        title: response.message,
        description: response.message,
        variant: "success",
      });
    } else {
      toast({
        title: t("role_add_failed"),
        description: response.message,
        variant: "danger",
      });
    }
  };
  return (
    <>
      <div className="modal-header justify-between!" dir={langDir}>
        <DialogTitle className="text-center text-xl font-bold" translate="no">
          {roleDetails ? t('edit_role') : t('add_role') }
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
            type="text"
            label={t("role_name")}
            name="userRoleName"
            placeholder={t("name_placeholder")}
            dir={langDir}
            translate="no"
          />

          <Button
            type="submit"
            className="theme-primary-btn mt-2 h-12 w-full rounded bg-dark-orange text-center text-lg font-bold leading-6"
            translate="no"
          >
             {roleDetails ? t('edit_role') : t("add_role") }
          </Button>
        </form>
      </Form>
    </>
  );
};

export default AddToRoleForm;
