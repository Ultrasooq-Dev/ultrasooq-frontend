"use client";
import { useUpdateFreelancerBranch } from "@/apis/queries/freelancer.queries";
import AccordionMultiSelectV2 from "@/components/shared/AccordionMultiSelectV2";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { DAYS_OF_WEEK, HOURS_24_FORMAT } from "@/utils/constants";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import React, { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useTags } from "@/apis/queries/tags.queries";
import { useRouter } from "next/navigation";
import { getAmPm } from "@/utils/helper";
import ControlledTextInput from "@/components/shared/Forms/ControlledTextInput";
import { ICountries } from "@/utils/types/common.types";
import { useCountries } from "@/apis/queries/masters.queries";
import ControlledPhoneInput from "@/components/shared/Forms/ControlledPhoneInput";
// import ControlledSelectInput from "@/components/shared/Forms/ControlledSelectInput";
import { useFetchCompanyBranchById } from "@/apis/queries/company.queries";
import { useQueryClient } from "@tanstack/react-query";
import BackgroundImage from "@/public/images/before-login-bg.png";
import MultiSelectCategory from "@/components/shared/MultiSelectCategory";
import ReactSelect from "react-select";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";

const customStyles = {
  control: (base: any) => ({
    ...base,
    height: 48,
    minHeight: 48,
  }),
  menu: (base: any) => ({
    ...base,
    zIndex: 20,
  }),
};

const formSchema = z
  .object({
    businessTypeList: z
      .array(
        z.object({
          label: z.string().trim(),
          value: z.number(),
        }),
      )
      .min(1, {
        message: "Business Type is required",
      })
      .transform((value) => {
        let temp: any = [];
        value.forEach((item) => {
          temp.push({ businessTypeId: item.value });
        });
        return temp;
      }),
    address: z
      .string()
      .trim()
      .min(2, { message: "Address is required" })
      .max(50, {
        message: "Address must be less than 50 characters",
      }),
    city: z.string().trim().min(2, { message: "City is required" }),
    province: z.string().trim().min(2, { message: "Province is required" }),
    country: z.string().trim().min(2, { message: "Country is required" }),
    cc: z.string().trim(),
    contactNumber: z
      .string()
      .trim()
      .min(2, { message: "Branch Contact Number is required" })
      .min(8, {
        message: "Branch Contact Number must be minimum of 8 digits",
      })
      .max(20, {
        message: "Branch Contact Number cannot be more than 20 digits",
      }),
    contactName: z
      .string()
      .trim()
      .min(2, { message: "Branch Contact Name is required" }),
    startTime: z.string().trim().min(1, {
      message: "Start Time is required",
    }),
    endTime: z.string().trim().min(1, {
      message: "End Time is required",
    }),
    workingDays: z
      .object({
        sun: z.number(),
        mon: z.number(),
        tue: z.number(),
        wed: z.number(),
        thu: z.number(),
        fri: z.number(),
        sat: z.number(),
      })
      .refine((value) => {
        return (
          value.sun !== 0 ||
          value.mon !== 0 ||
          value.tue !== 0 ||
          value.wed !== 0 ||
          value.thu !== 0 ||
          value.fri !== 0 ||
          value.sat !== 0
        );
      }),
    // tagList: z
    //   .array(
    //     z.object({
    //       label: z.string().trim(),
    //       value: z.number(),
    //     }),
    //   )
    //   .min(1, {
    //     message: "Tag is required",
    //   })
    //   .transform((value) => {
    //     let temp: any = [];
    //     value.forEach((item) => {
    //       temp.push({ tagId: item.value });
    //     });
    //     return temp;
    //   }),
    categoryList: z.any().optional(),
  })
  .superRefine(({ startTime, endTime }, ctx) => {
    if (startTime && endTime && startTime > endTime) {
      ctx.addIssue({
        code: "custom",
        message: "Start Time must be less than End Time",
        path: ["startTime"],
      });
    }
  });

export default function EditBranchPage() {
  const t = useTranslations();
  const { langDir } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      businessTypeList: undefined,
      address: "",
      city: "",
      province: "",
      country: "",
      cc: "",
      contactNumber: "",
      contactName: "",
      startTime: "",
      endTime: "",
      workingDays: {
        sun: 0,
        mon: 0,
        tue: 0,
        wed: 0,
        thu: 0,
        fri: 0,
        sat: 0,
      },
      // tagList: [],
      categoryList: undefined,
    },
  });
  const [activeBranchId, setActiveBranchId] = useState<string | null>();

  const countriesQuery = useCountries();
  const tagsQuery = useTags();
  const branchQueryById = useFetchCompanyBranchById(
    activeBranchId ? activeBranchId : "",
    !!activeBranchId,
  );
  const updateFreelancerBranch = useUpdateFreelancerBranch();

  const memoizedCountries = useMemo(() => {
    return (
      countriesQuery?.data?.data.map((item: ICountries) => {
        return { label: item.countryName, value: item.countryName };
      }) || []
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countriesQuery?.data?.data?.length]);

  const memoizedTags = useMemo(() => {
    return (
      tagsQuery?.data?.data.map((item: { id: string; tagName: string }) => {
        return { label: item.tagName, value: item.id };
      }) || []
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tagsQuery?.data?.data?.length]);

  const onSubmit = async (formData: z.infer<typeof formSchema>) => {
    const data = {
      ...formData,
      profileType: "FREELANCER",
      mainOffice: 1,
      branchId: Number(activeBranchId),
    };

    // return;
    const response = await updateFreelancerBranch.mutateAsync(data);

    if (response.status && response.data) {
      toast({
        title: t("profile_edit_successful"),
        description: response.message,
        variant: "success",
      });
      form.reset();
      queryClient.invalidateQueries({
        queryKey: ["branch-by-id", activeBranchId],
      });
      router.push("/freelancer-profile-details");
    } else {
      toast({
        title: t("profile_edit_failed"),
        description: response.message,
        variant: "danger",
      });
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(document.location.search);
    let branchId = params.get("branchId");
    setActiveBranchId(branchId);
  }, []);

  useEffect(() => {
    if (branchQueryById.data?.data) {
      const branch = branchQueryById.data?.data;

      const businessTypeList = branch?.userBranchBusinessType
        ? branch?.userBranchBusinessType?.map((item: any) => {
            return {
              label: item?.userBranch_BusinessType_Tag?.tagName,
              value: item?.userBranch_BusinessType_Tag?.id,
            };
          })
        : [];

      const workingDays = branch?.workingDays
        ? JSON.parse(branch.workingDays)
        : {
            sun: 0,
            mon: 0,
            tue: 0,
            wed: 0,
            thu: 0,
            fri: 0,
            sat: 0,
          };

      const categoryList = branch?.userBranch_userBranchCategory
        ? branch?.userBranch_userBranchCategory?.map((item: any) => {
            return {
              categoryId: item?.categoryId,
              categoryLocation: item?.categoryLocation,
            };
          })
        : undefined;

      form.reset({
        businessTypeList: businessTypeList || undefined,
        startTime: branch?.startTime || "",
        endTime: branch?.endTime || "",
        address: branch?.address || "",
        city: branch?.city || "",
        province: branch?.province || "",
        country: branch?.country || "",
        cc: branch?.cc || "",
        contactNumber: branch?.contactNumber || "",
        contactName: branch?.contactName || "",
        workingDays,
        // tagList: tagList || undefined,
        categoryList: categoryList || undefined,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    branchQueryById.data?.data,
    memoizedTags?.length,
    memoizedCountries?.length,
  ]);

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
              className="m-auto mb-12 w-11/12 rounded-lg border border-solid border-gray-300 bg-white p-6 shadow-xs sm:p-8 md:w-10/12 lg:w-10/12 lg:p-12"
            >
              <div className="text-normal m-auto mb-7 w-full text-center text-sm leading-6 text-light-gray">
                <h2 className="mb-3 text-center text-3xl font-semibold leading-8 text-color-dark sm:text-4xl sm:leading-10" dir={langDir} translate="no">
                  {t("my_profile")}
                </h2>
              </div>
              <div className="flex w-full flex-wrap">
                <div className="mb-4 w-full">
                  <div className="mt-2.5 w-full border-b-2 border-dashed border-gray-300">
                    <label className="mb-3.5 block text-left text-lg font-medium capitalize leading-5 text-color-dark" dir={langDir} translate="no">
                      {t("freelancer_information")}
                    </label>
                  </div>
                </div>
                <div className="mb-3.5 w-full">
                  <div className="flex flex-wrap">
                    <AccordionMultiSelectV2
                      label={t("business_type")}
                      name="businessTypeList"
                      options={memoizedTags || []}
                      placeholder={t("business_type")}
                      error={form.formState.errors.businessTypeList?.message}
                    />
                  </div>
                </div>
                <div className="mb-3.5 w-full">
                  <div className="flex flex-wrap">
                    <div className="mb-4 w-full">
                      <div className="mt-2.5 w-full border-b-2 border-dashed border-gray-300">
                        <label className="mb-3.5 block text-left text-lg font-medium capitalize leading-5 text-color-dark" dir={langDir} translate="no">
                          {t("address")}
                        </label>
                      </div>
                    </div>

                    <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-2">
                      <div className="relative w-full">
                        <ControlledTextInput
                          label={t("address")}
                          name="address"
                          placeholder={t("address")}
                          showLabel={true}
                          dir={langDir}
                          translate="no"
                        />

                        <Image
                          src="/images/location.svg"
                          alt="location-icon"
                          height={16}
                          width={16}
                          className="absolute right-6 top-[50px]"
                        />
                      </div>

                      <ControlledTextInput
                        label={t("city")}
                        name="city"
                        placeholder={t("city")}
                        showLabel={true}
                        dir={langDir}
                        translate="no"
                      />
                    </div>

                    <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-2">
                      <ControlledTextInput
                        label={t("province")}
                        name="province"
                        placeholder={t("province")}
                        showLabel={true}
                        dir={langDir}
                        translate="no"
                      />

                      {/* <ControlledSelectInput
                        label="Country"
                        name="country"
                        options={memoizedCountries}
                      /> */}
                      <div className="mt-2 flex flex-col gap-y-3">
                        <Label dir={langDir} translate="no">{t("country")}</Label>
                        <Controller
                          name="country"
                          control={form.control}
                          render={({ field }) => (
                            <ReactSelect
                              {...field}
                              onChange={(newValue) => {
                                field.onChange(newValue?.value);
                              }}
                              options={memoizedCountries}
                              value={memoizedCountries.find(
                                (item: any) => item.value === field.value,
                              )}
                              styles={customStyles}
                              instanceId="country"
                            />
                          )}
                        />
                      </div>
                    </div>

                    <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-2">
                      <div className="mt-2">
                        <ControlledPhoneInput
                          label={t("branch_contact_number")}
                          name="contactNumber"
                          countryName="cc"
                          placeholder={t("branch_contact_number")}
                        />
                      </div>

                      <ControlledTextInput
                        label={t("branch_contact_name")}
                        name="contactName"
                        placeholder={t("branch_contact_name")}
                        showLabel={true}
                        dir={langDir}
                        translate="no"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex w-full flex-wrap">
                <div className="mb-4 w-full">
                  <div className="mt-2.5 w-full border-b-2 border-dashed border-gray-300">
                    <label className="mb-3.5 block text-left text-lg font-medium capitalize leading-5 text-color-dark" dir={langDir} translate="no">
                      {t("working_hours")}
                    </label>
                  </div>
                </div>
                <div className="grid w-full grid-cols-1 gap-x-6 md:grid-cols-2">
                  <div className="mb-4 flex w-full flex-col gap-y-3">
                    <Label htmlFor="startTime" className="text-color-dark" dir={langDir} translate="no">
                      {t("start_time")}
                    </Label>
                    <Controller
                      name="startTime"
                      control={form.control}
                      render={({ field }) => (
                        <select
                          {...field}
                          className="h-12! w-full rounded border border-gray-300! px-3 text-base focus-visible:ring-0!"
                        >
                          <option value="">Select</option>
                          {HOURS_24_FORMAT.map(
                            (hour: string, index: number) => (
                              <option key={index} value={hour}>
                                {getAmPm(hour)}
                              </option>
                            ),
                          )}
                        </select>
                      )}
                    />
                    <p className="text-[13px] text-destructive" dir={langDir}>
                      {form.formState.errors.startTime?.message}
                    </p>
                  </div>
                  <div className="mb-4 flex w-full flex-col gap-y-3">
                    <Label htmlFor="endTime" className="text-color-dark" dir={langDir} translate="no">
                      {t("end_time")}
                    </Label>
                    <Controller
                      name="endTime"
                      control={form.control}
                      render={({ field }) => (
                        <select
                          {...field}
                          className="h-12! w-full rounded border border-gray-300! px-3 text-base focus-visible:ring-0!"
                        >
                          <option value="">Select</option>
                          {HOURS_24_FORMAT.map(
                            (hour: string, index: number) => (
                              <option key={index} value={hour}>
                                {getAmPm(hour)}
                              </option>
                            ),
                          )}
                        </select>
                      )}
                    />
                    <p className="text-[13px] text-destructive" dir={langDir}>
                      {form.formState.errors.endTime?.message}
                    </p>
                  </div>
                </div>
                <div className="mb-3.5 w-full border-b-2 border-dashed border-gray-300 pb-4">
                  <div className="flex flex-wrap">
                    {DAYS_OF_WEEK.map((item) => (
                      <FormField
                        key={item.value}
                        control={form.control}
                        name="workingDays"
                        render={({ field }) => (
                          <FormItem className="mb-4 mr-4 flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                onCheckedChange={(e) => {
                                  field.onChange({
                                    ...field.value,
                                    [item.value]: e ? 1 : 0,
                                  });
                                }}
                                className="border border-solid border-gray-300 data-[state=checked]:bg-dark-orange!"
                                checked={
                                  !!field.value[
                                    item.value as keyof typeof field.value
                                  ]
                                }
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="text-light-gray">
                                {item.label}
                              </FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>

                  {form.formState.errors.workingDays?.message ? (
                    <p className="text-[13px] text-destructive" dir={langDir} translate="no">
                      {t("working_day_required")}
                    </p>
                  ) : null}
                </div>

                {/* <AccordionMultiSelectV2
                  label="Tag"
                  name="tagList"
                  options={memoizedTags || []}
                  placeholder="Tag"
                  error={form.formState.errors.tagList?.message}
                /> */}
              </div>

              <MultiSelectCategory
                name="categoryList"
                branchId={activeBranchId}
              />

              <Button
                disabled={updateFreelancerBranch.isPending}
                type="submit"
                className="h-12 w-full rounded bg-dark-orange text-center text-lg font-bold leading-6 text-white hover:bg-dark-orange hover:opacity-90"
                dir={langDir}
                translate="no"
              >
                {updateFreelancerBranch.isPending ? (
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
                ) : (
                  t("edit_changes")
                )}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </section>
  );
}
