import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/components/ui/use-toast";
import BackgroundImage from "@/public/images/before-login-bg.png";
import AccordionMultiSelectV2 from "@/components/shared/AccordionMultiSelectV2";
import {
  usePermissions,
  useSetPermission,
  useGetPermission,
  useUpdatePermission,
} from "@/apis/queries/member.queries";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";

type PermissionFormProps = {
  roleId: number;
  onClose: () => void;
};

const addFormSchema = (t: any) => {
  return z.object({
    permissionIdList: z
      .array(
        z.object({
          label: z.string().trim(),
          value: z.number(),
        }),
      )
      .min(1, {
        message: t("permission_type_required"),
      })
      .transform((value) => {
        let temp: any = [];
        value.forEach((item) => {
          temp.push({ permissionId: item.value });
        });
        return temp;
      }),
  });
};

const PermissionForm: React.FC<PermissionFormProps> = ({
  roleId,
  onClose,
}) => {
  const t = useTranslations();
  const { langDir } = useAuth();
  const permissionsQuery = usePermissions();
  const addPermission = useSetPermission();
  const updatePermission = useUpdatePermission();
  const getPermissionquery = useGetPermission({ userRoleId: roleId });
  const { toast } = useToast();

  const memoizedPermissions = useMemo(() => {
    return (
      permissionsQuery?.data?.data.map((item: { id: string; name: string }) => {
        return { label: item.name, value: item.id };
      }) || []
    );
  }, [permissionsQuery?.data]);

  // Get Role Id wise Permissions

  const memoizedGetPermission = useMemo(() => {
    return getPermissionquery?.data?.data?.userRolePermission
      ? getPermissionquery.data.data.userRolePermission.map((item: any) => ({
          label: item?.permissionDetail.name,
          value: item.permissionId,
        }))
      : [];
  }, [getPermissionquery?.data?.data]);

  const form = useForm({
    resolver: zodResolver(addFormSchema(t)),
    defaultValues: { permissionIdList: [] },
  });

  useEffect(() => {
    if (memoizedGetPermission.length > 0) {
      form.setValue("permissionIdList", memoizedGetPermission);
    }
  }, [memoizedGetPermission, form]);

  const onSubmit = async (formData: any) => {
    let response;
    if (memoizedGetPermission) {
      response = await updatePermission.mutateAsync({
        userRoleId: roleId,
        ...formData,
      });
    } else {
      response = await addPermission.mutateAsync({
        userRoleId: roleId,
        ...formData,
      });
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
        title: t("permission_set_failed"),
        description: response.message,
        variant: "danger",
      });
    }
  };

  return (
    <section className="relative w-full py-7">
      <div className="absolute left-0 top-0 -z-10 h-full w-full">
        <Image
          src={BackgroundImage}
          className="h-full w-full object-cover object-center"
          alt="background"
          fill
          priority
        />
      </div>
      <div className="container relative z-10 m-auto">
        <div className="flex">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="m-auto mb-0 max-h-[95vh] w-11/12 overflow-y-auto rounded-lg border border-solid border-gray-300 bg-white p-6 shadow-xs sm:p-8 md:w-10/12 lg:w-10/12 lg:p-10"
            >
              <div className="text-normal m-auto mb-7 w-full text-center text-sm leading-6 text-light-gray">
                <h2 className="mb-3 text-center text-3xl font-semibold leading-8 text-color-dark sm:text-4xl sm:leading-10" translate="no">
                  {memoizedGetPermission.length
                    ? t("update_permission")
                    : t("add_permission")}
                </h2>
              </div>

              <div className="mb-4 w-full">
                <div className="mt-2.5 w-full border-b-2 border-dashed border-gray-300">
                  <label className="mb-3.5 block text-left text-lg font-medium capitalize leading-5 text-color-dark" dir={langDir} translate="no">
                    {t("permission_information")}
                  </label>
                </div>
              </div>

              <div>
                <div className="mb-3.5 w-full">
                  <AccordionMultiSelectV2
                    label={t("permission_type")}
                    name="permissionIdList"
                    options={memoizedPermissions || []}
                    // value={selectedValues} // Ensure checked state
                    error={
                      form.formState.errors?.permissionIdList?.message !==
                      undefined
                        ? String(
                            form.formState.errors?.permissionIdList?.message,
                          )
                        : ""
                    }
                  />
                </div>
              </div>

              <Button
                disabled={addPermission.isPending || updatePermission.isPending}
                type="submit"
                className="h-12 w-full rounded bg-dark-orange text-center text-lg font-bold leading-6 text-white hover:bg-dark-orange hover:opacity-90"
                dir={langDir}
                translate="no"
              >
                {addPermission.isPending || updatePermission.isPending ? (
                  <>
                    <Image
                      src="/images/load.png"
                      alt="loader-icon"
                      width={20}
                      height={20}
                      className="mr-2 animate-spin"
                    />
                    {t("please_wait")}
                  </>
                ) : memoizedGetPermission.length ? (
                  t("update_permission")
                ) : (
                  t("add_permission")
                )}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </section>
  );
};

export default PermissionForm;
