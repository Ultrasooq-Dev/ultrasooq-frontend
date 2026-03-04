"use client";
import { useCreateFreelancerProfile } from "@/apis/queries/freelancer.queries";
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
import React, { useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useTags } from "@/apis/queries/tags.queries";
import { useRouter } from "next/navigation";
import { useMe } from "@/apis/queries/user.queries";
import { useCurrentAccount } from "@/apis/queries/auth.queries";
import { getAmPm, handleDescriptionParse } from "@/utils/helper";
import ControlledTextInput from "@/components/shared/Forms/ControlledTextInput";
import { ICountries } from "@/utils/types/common.types";
import { useCountries } from "@/apis/queries/masters.queries";
import ControlledPhoneInput from "@/components/shared/Forms/ControlledPhoneInput";
import ControlledRichTextEditor from "@/components/shared/Forms/ControlledRichTextEditor";
import ControlledSelectInput from "@/components/shared/Forms/ControlledSelectInput";
import BackgroundImage from "@/public/images/before-login-bg.png";
import MultiSelectCategory from "@/components/shared/MultiSelectCategory";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";

const createFormSchema = (t: (key: string, values?: Record<string, any>) => string) => z
  .object({
    aboutUs: z.string().trim().optional(),
    aboutUsJson: z.array(z.any()).optional(),
    businessTypeList: z
      .array(
        z.object({
          label: z.string().trim(),
          value: z.number(),
        }),
      )
      .min(1, {
        message: t("business_type_required"),
      })
      .transform((value) => {
        const temp: any = [];
        value.forEach((item) => {
          temp.push({ businessTypeId: item.value });
        });
        return temp;
      }),
    address: z
      .string()
      .trim()
      .min(2, { message: t("address_required") })
      .max(50, {
        message: t("address_max_50_chars"),
      }),
    city: z.string().trim().min(2, { message: t("city_required") }),
    province: z.string().trim().min(2, { message: t("province_required") }),
    country: z.string().trim().min(2, { message: t("country_required") }),
    cc: z.string().trim(),
    contactNumber: z
      .string()
      .trim()
      .min(2, { message: t("branch_contact_number_required") })
      .min(8, {
        message: t("branch_contact_min_8_digits"),
      })
      .max(20, {
        message: t("branch_contact_max_20_digits"),
      }),
    contactName: z
      .string()
      .trim()
      .min(2, { message: t("branch_contact_name_required") }),
    startTime: z.string().trim().min(1, {
      message: t("start_time_required"),
    }),
    endTime: z.string().trim().min(1, {
      message: t("end_time_required"),
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
    if (startTime && endTime && startTime >= endTime) {
      ctx.addIssue({
        code: "custom",
        message: t("end_time_must_be_greater"),
        path: ["endTime"],
      });
    }
  });

export default function FreelancerProfilePage() {
  const t = useTranslations();
  const { langDir } = useAuth();
  const formSchema = useMemo(() => createFormSchema(t), [t]);
  const router = useRouter();
  const { toast } = useToast();
  const form = useForm({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      aboutUs: "",
      aboutUsJson: undefined,
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
      // tagList: undefined,
      categoryList: undefined,
    },
  });

  const me = useMe();
  const currentAccount = useCurrentAccount();
  const countriesQuery = useCountries();
  const tagsQuery = useTags();
  const createFreelancerProfile = useCreateFreelancerProfile();

  // Get the current account data
  const currentAccountData = currentAccount?.data?.data?.account;
  const currentTradeRole = currentAccountData?.tradeRole;

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
  }, [tagsQuery?.data]);

  // Redirect if user is not on a FREELANCER account
  React.useEffect(() => {
    if (currentTradeRole && currentTradeRole !== 'FREELANCER') {
      if (currentTradeRole === 'BUYER') {
        router.replace("/buyer-profile-details");
      } else if (currentTradeRole === 'COMPANY') {
        router.replace("/company-profile");
      }
    }
  }, [currentTradeRole, router]);

  useEffect(() => {
    if (me.data?.data) {
      const businessTypeList = me.data?.data?.userBranch?.[0]
        ?.userBranchBusinessType
        ? me.data?.data?.userBranch?.[0]?.userBranchBusinessType?.map(
            (item: any) => {
              return {
                label: item?.userBranch_BusinessType_Tag?.tagName,
                value: item?.userBranch_BusinessType_Tag?.id,
              };
            },
          )
        : [];

      const workingDays = me.data?.data?.userBranch?.[0]?.workingDays
        ? JSON.parse(me.data.data.userBranch[0].workingDays)
        : {
            sun: 0,
            mon: 0,
            tue: 0,
            wed: 0,
            thu: 0,
            fri: 0,
            sat: 0,
          };

      // const tagList = me.data?.data?.userBranch?.[0]?.userBranchTags
      //   ? me.data?.data?.userBranch?.[0]?.userBranchTags?.map((item: any) => {
      //       return {
      //         label: item?.userBranchTagsTag?.tagName,
      //         value: item?.userBranchTagsTag?.id,
      //       };
      //     })
      //   : [];

      const categoryList = me.data?.data?.userBranch?.[0]
        ?.userBranch_userBranchCategory
        ? me.data?.data?.userBranch?.[0]?.userBranch_userBranchCategory?.map(
            (item: any) => {
              return {
                categoryId: item?.categoryId,
                categoryLocation: item?.categoryLocation,
              };
            },
          )
        : undefined;

      form.reset({
        aboutUs: me.data?.data?.userProfile?.[0]?.aboutUs || "",
        aboutUsJson: me.data?.data?.userProfile?.[0]?.aboutUs
          ? handleDescriptionParse(me.data?.data?.userProfile?.[0]?.aboutUs)
          : undefined,
        // aboutUsJson: me.data?.data?.userProfile?.[0]?.aboutUs || undefined,
        businessTypeList: businessTypeList || undefined,
        startTime: me.data?.data?.userBranch?.[0]?.startTime || "",
        endTime: me.data?.data?.userBranch?.[0]?.endTime || "",
        address: me.data?.data?.userBranch?.[0]?.address || "",
        city: me.data?.data?.userBranch?.[0]?.city || "",
        province: me.data?.data?.userBranch?.[0]?.province || "",
        country: me.data?.data?.userBranch?.[0]?.country || "",
        contactNumber: me.data?.data?.userBranch?.[0]?.contactNumber || "",
        contactName: me.data?.data?.userBranch?.[0]?.contactName || "",
        workingDays,
        // tagList: tagList || undefined,
        categoryList: categoryList || undefined,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me.data?.data, me.data?.status]);

  // Show loading while account data is being fetched
  if (currentAccount.isLoading || !currentTradeRole) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-lg">{t("loading_account_information")}</p>
        </div>
      </div>
    );
  }

  const onSubmit = async (formData: any) => {
    const data = {
      aboutUs: formData.aboutUsJson.length
        ? JSON.stringify(formData.aboutUsJson)
        : undefined,
      profileType: "FREELANCER",
      branchList: [
        {
          ...formData,
          profileType: "FREELANCER",
          mainOffice: 1,
        },
      ],
    };

    delete data.branchList[0].aboutUs;
    delete data.branchList[0].aboutUsJson;

    // return;
    const response = await createFreelancerProfile.mutateAsync(data);

    if (response.status && response.data) {
      toast({
        title: t("profile_create_successful"),
        description: response.message,
        variant: "success",
      });
      form.reset();
      router.push("/freelancer-profile-details");
    } else {
      toast({
        title: t("profile_create_failed"),
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
              className="form-groups-common-sec-s1 m-auto mb-12 w-11/12 rounded-lg border border-solid border-border bg-card p-6 shadow-xs sm:p-8 md:w-10/12 lg:w-10/12 lg:p-12"
            >
              <div className="text-normal m-auto mb-7 w-full text-center text-sm leading-6 text-light-gray">
                <h2 className="mb-3 text-center text-3xl font-semibold leading-8 text-color-dark sm:text-4xl sm:leading-10">
                  {t("freelancer_profile")}
                </h2>
              </div>
              <div className="flex w-full flex-wrap">
                <div className="mb-4 w-full">
                  <div className="mt-2.5 w-full border-b-2 border-dashed border-border">
                    <label className="mb-3.5 block text-left text-lg font-medium capitalize leading-5 text-color-dark">
                      {t("freelancer_information")}
                    </label>
                  </div>
                </div>
                <div className="mb-3.5 w-full space-y-5">
                  <ControlledRichTextEditor
                    label={t("about_us")}
                    name="aboutUsJson"
                  />

                  <AccordionMultiSelectV2
                    label={t("business_type")}
                    name="businessTypeList"
                    options={memoizedTags || []}
                    placeholder={t("business_type")}
                    error={form.formState.errors.businessTypeList?.message}
                  />
                </div>
                <div className="mb-3.5 w-full">
                  <div className="flex flex-wrap">
                    <div className="mb-4 w-full">
                      <div className="mt-2.5 w-full border-b-2 border-dashed border-border">
                        <label className="mb-3.5 block text-left text-lg font-medium capitalize leading-5 text-color-dark">
                          {t("address")}
                        </label>
                      </div>
                    </div>

                    <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-2">
                      <div className="relative w-full">
                        <ControlledTextInput
                          label={t("address")}
                          name="address"
                          showLabel={true}
                          placeholder={t("address")}
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
                        showLabel={true}
                        placeholder={t("city")}
                      />
                    </div>

                    <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-2">
                      <ControlledTextInput
                        label={t("province")}
                        name="province"
                        showLabel={true}
                        placeholder={t("province")}
                      />

                      <ControlledSelectInput
                        label={t("country")}
                        name="country"
                        options={memoizedCountries}
                      />
                    </div>

                    <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-2">
                      <ControlledPhoneInput
                        label={t("branch_contact_number")}
                        name="contactNumber"
                        countryName="cc"
                        placeholder={t("branch_contact_number")}
                      />

                      <ControlledTextInput
                        className="mt-0"
                        label={t("branch_contact_name")}
                        name="contactName"
                        showLabel={true}
                        placeholder={t("branch_contact_name")}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex w-full flex-wrap">
                <div className="mb-4 w-full">
                  <div className="mt-2.5 w-full border-b-2 border-dashed border-border">
                    <label className="mb-3.5 block text-left text-lg font-medium capitalize leading-5 text-color-dark">
                      {t("working_hours")}
                    </label>
                  </div>
                </div>
                <div className="grid w-full grid-cols-1 gap-x-6 md:grid-cols-2">
                  <div className="mb-4 flex w-full flex-col gap-y-3">
                    <Label htmlFor="startTime" className="text-color-dark">
                      {t("start_time")}
                    </Label>
                    <Controller
                      name="startTime"
                      control={form.control}
                      render={({ field }) => (
                        <select
                          {...field}
                          className="h-12! w-full rounded border border-border! px-3 text-base focus-visible:ring-0!"
                        >
                          <option value="">{t("select")}</option>
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
                    <Label htmlFor="endTime" className="text-color-dark">
                      {t("end_time")}
                    </Label>
                    <Controller
                      name="endTime"
                      control={form.control}
                      render={({ field }) => (
                        <select
                          {...field}
                          className="h-12! w-full rounded border border-border! px-3 text-base focus-visible:ring-0!"
                        >
                          <option value="">{t("select")}</option>
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
                <div className="mb-3.5 w-full border-b-2 border-dashed border-border pb-4">
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
                                className="border border-solid border-border data-[state=checked]:border-dark-orange! data-[state=checked]:bg-dark-orange!"
                                checked={
                                  !!field.value[
                                    item.value as keyof typeof field.value
                                  ]
                                }
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="text-light-gray">
                                {t(item.label)}
                              </FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>

                  {form.formState.errors.workingDays?.message ? (
                    <p className="text-[13px] text-destructive" dir={langDir}>
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

              <MultiSelectCategory name="categoryList" />

              <Button
                disabled={createFreelancerProfile.isPending}
                type="submit"
                className="h-12 w-full rounded bg-dark-orange text-center text-lg font-bold leading-6 text-white hover:bg-dark-orange hover:opacity-90"
              >
                {createFreelancerProfile.isPending ? (
                  <>
                    <Image
                      src="/images/load.png"
                      alt="loader-icon"
                      width={20}
                      height={20}
                      className="mr-2 animate-spin"
                    />
                    Please wait
                  </>
                ) : (
                  "Save changes"
                )}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </section>
  );
}
