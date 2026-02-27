"use client";
import { Button } from "@/components/ui/button";
import React, { useMemo, useState } from "react";
import { useCreateCompanyProfile } from "@/apis/queries/company.queries";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DAYS_OF_WEEK,
  HOURS_24_FORMAT,
  NO_OF_EMPLOYEES_LIST,
} from "@/utils/constants";
import AccordionMultiSelectV2 from "@/components/shared/AccordionMultiSelectV2";
import { useTags } from "@/apis/queries/tags.queries";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { getAmPm, getLastTwoHundredYears } from "@/utils/helper";
import { useUploadFile } from "@/apis/queries/upload.queries";
import ControlledPhoneInput from "@/components/shared/Forms/ControlledPhoneInput";
import ControlledTextInput from "@/components/shared/Forms/ControlledTextInput";
import ControlledRichTextEditor from "@/components/shared/Forms/ControlledRichTextEditor";
import { ICountries, OptionProps } from "@/utils/types/common.types";
import { useCountries } from "@/apis/queries/masters.queries";
import ControlledSelectInput from "@/components/shared/Forms/ControlledSelectInput";
import BackgroundImage from "@/public/images/before-login-bg.png";
import MultiSelectCategory from "@/components/shared/MultiSelectCategory";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { useCurrentAccount } from "@/apis/queries/auth.queries";

const formSchema = (t: any) => {
  return z.object({
    uploadImage: z.any().optional(),
    logo: z.string().trim().optional(),
    companyName: z
      .string()
      .trim()
      .min(2, { message: t("company_name_required") })
      .max(50, { message: t("company_name_must_be_less_than_50_chars") }),
    businessTypeList: z
      .string({ error: t("business_type_required") })
      .transform((value) => [{ businessTypeId: Number(value) }]),
    annualPurchasingVolume: z
      .string()
      .trim()
      .min(2, { message: t("annual_purchasing_volume_required") })
      .max(50, {
        message: t("annual_purchasing_volume_must_be_less_than_20_digits"),
      }),
    address: z
      .string()
      .trim()
      .min(2, { message: t("address_required") })
      .max(50, {
        message: t("address_must_be_less_than_n_chars", { n: 50 }),
      }),
    city: z
      .string()
      .trim()
      .min(2, { message: t("city_required") }),
    province: z
      .string()
      .trim()
      .min(2, { message: t("province_required") }),
    country: z
      .string()
      .trim()
      .min(2, { message: t("country_required") }),
    yearOfEstablishment: z
      .string()
      .trim()
      .min(2, { message: t("year_of_establishment_required") })
      .transform((value) => Number(value)),
    totalNoOfEmployee: z
      .string()
      .trim()
      .min(2, { message: t("total_no_of_employees_required") }),
    aboutUs: z.string().trim().optional(),
    aboutUsJson: z.array(z.any()).optional().or(z.literal("")),
    branchList: z.array(
      z
        .object({
          branchFrontPicture: z.string().trim().optional(),
          proofOfAddress: z.string().trim().optional(),
          businessTypeList: z
            .array(
              z.object({
                label: z.string().trim(),
                value: z.number(),
              }),
              {
                error: t("business_type_required"),
              },
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
              message: t("address_must_be_less_than_n_chars", { n: 50 }),
            }),
          city: z
            .string()
            .trim()
            .min(2, { message: t("city_required") }),
          province: z
            .string()
            .trim()
            .min(2, { message: t("province_required") }),
          country: z
            .string()
            .trim()
            .min(2, { message: t("country_required") }),
          cc: z.string().trim(),
          contactNumber: z
            .string()
            .trim()
            .min(2, { message: t("branch_contact_number_required") })
            .min(8, {
              message: t("branch_contact_number_must_be_min_n_digits", {
                n: 8,
              }),
            })
            .max(20, {
              message: t("branch_contact_number_cant_be_nore_than_n_digits", {
                n: 20,
              }),
            }),
          contactName: z
            .string()
            .trim()
            .min(2, { message: t("branch_contact_name_required") }),
          startTime: z
            .string()
            .trim()
            .min(1, {
              message: t("start_time_required"),
            }),
          endTime: z
            .string()
            .trim()
            .min(1, {
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
          categoryList: z.any().optional(),
          mainOffice: z
            .boolean()
            .transform((value) => (value ? 1 : 0))
            .optional(),
        })
        .superRefine(({ startTime, endTime }, ctx) => {
          if (startTime && endTime && startTime >= endTime) {
            ctx.addIssue({
              code: "custom",
              message: t("start_time_must_be_less_than_end_time"),
              path: ["startTime"],
            });
          }
        }),
    ),
  });
};

export default function CompanyProfilePage() {
  const t = useTranslations();
  const { langDir } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const form = useForm({
    resolver: zodResolver(formSchema(t)) as any,
    defaultValues: {
      uploadImage: undefined,
      logo: "",
      profileType: "COMPANY", // dont remove value
      companyLogo: "",
      companyName: "",
      annualPurchasingVolume: "",
      businessTypeList: undefined,
      address: "",
      city: "",
      province: "",
      country: "",
      yearOfEstablishment: "",
      totalNoOfEmployee: "",
      aboutUs: "",
      aboutUsJson: undefined,
      branchList: [
        {
          profileType: "COMPANY",
          businessTypeList: undefined,
          branchFrontPicture: "",
          proofOfAddress: "",
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
          mainOffice: false,
        },
      ],
    },
  });
  const [imageFile, setImageFile] = useState<FileList | null>();
  const currentAccount = useCurrentAccount();
  const countriesQuery = useCountries();
  const tagsQuery = useTags();
  const upload = useUploadFile();
  const createCompanyProfile = useCreateCompanyProfile();

  // Get the current account data
  const currentAccountData = currentAccount?.data?.data?.account;
  const currentTradeRole = currentAccountData?.tradeRole;

  const fieldArray = useFieldArray({
    control: form.control,
    name: "branchList",
  });

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

  const memoizedLastTwoHundredYears = useMemo(() => {
    return getLastTwoHundredYears() || [];
  }, []);

  // Redirect if user is not on a COMPANY account
  React.useEffect(() => {
    if (currentTradeRole && currentTradeRole !== 'COMPANY') {
      if (currentTradeRole === 'BUYER') {
        router.replace("/buyer-profile-details");
      } else if (currentTradeRole === 'FREELANCER') {
        router.replace("/freelancer-profile");
      }
    }
  }, [currentTradeRole, router]);

  // Show loading while account data is being fetched
  if (currentAccount.isLoading || !currentTradeRole) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-lg">Loading account information...</p>
        </div>
      </div>
    );
  }

  const appendBranchList = () =>
    fieldArray.append({
      profileType: "COMPANY",
      businessTypeList: undefined,
      branchFrontPicture: "",
      proofOfAddress: "",
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
      mainOffice: false,
    });

  const removeBranchList = (index: number) => fieldArray.remove(index);

  const handleUploadedFile = async (files: FileList | null) => {
    if (files) {
      const formData = new FormData();
      formData.append("content", files[0]);
      const response = await upload.mutateAsync(formData);
      if (response.status && response.data) {
        return response.data;
      }
    }
  };

  const onSubmit = async (formData: any) => {
    const data = {
      ...formData,
      aboutUs: formData.aboutUsJson?.length
        ? JSON.stringify(formData.aboutUsJson)
        : undefined,
      profileType: "COMPANY",
    };

    if (data.branchList) {
      if (
        data.branchList.filter((item: any) => item.mainOffice === 1).length < 1
      ) {
        toast({
          title: t("please_select_atleast_one_main_office"),
          variant: "danger",
        });
        return;
      }

      if (
        data.branchList.filter((item: any) => item.mainOffice === 1).length > 1
      ) {
        toast({
          title: t("please_select_only_one_main_office"),
          variant: "danger",
        });
        return;
      }

      const updatedBranchList = data.branchList.map((item: any) => ({
        ...item,
        profileType: "COMPANY",
      }));
      data.branchList = updatedBranchList;
    }

    formData.uploadImage = imageFile;
    let getImageUrl;
    if (formData.uploadImage) {
      getImageUrl = await handleUploadedFile(formData.uploadImage);
    }
    delete data.uploadImage;
    if (getImageUrl) {
      data.logo = getImageUrl;
    }

    delete data.aboutUsJson;

    const response = await createCompanyProfile.mutateAsync(data);

    if (response.status && response.data) {
      toast({
        title: t("profile_create_successful"),
        description: response.message,
        variant: "success",
      });
      form.reset();
      router.push("/company-profile-details");
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
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="m-auto mb-12 w-11/12 rounded-lg border border-solid border-border bg-card p-6 shadow-xs sm:p-8 md:w-10/12 lg:w-10/12 lg:p-12"
          >
            <div className="text-normal m-auto mb-7 w-full text-center text-sm leading-6 text-light-gray">
              <h2
                className="mb-3 text-center text-3xl font-semibold leading-8 text-color-dark sm:text-4xl sm:leading-10"
                dir={langDir}
                translate="no"
              >
                {t("company_profile")}
              </h2>
            </div>
            <div className="flex w-full flex-wrap">
              <div className="mb-4 w-full">
                <div className="mt-2.5 w-full border-b-2 border-dashed border-border">
                  <label
                    className="mb-3.5 block text-left text-lg font-medium capitalize leading-5 text-color-dark"
                    dir={langDir}
                    translate="no"
                  >
                    {t("company_information")}
                  </label>
                </div>
              </div>
              <div className="mb-3.5 w-full">
                <div className="flex flex-wrap">
                  <FormField
                    control={form.control}
                    name="uploadImage"
                    render={({ field }) => (
                      <FormItem className="mb-3.5 w-full md:w-6/12 md:pr-3.5">
                        <FormLabel dir={langDir} translate="no">
                          {t("upload_company_logo")}
                        </FormLabel>
                        <FormControl>
                          <div className="relative m-auto h-64 w-full border-2 border-dashed border-border">
                            <div className="relative h-full w-full">
                              {imageFile ? (
                                <Image
                                  src={
                                    imageFile
                                      ? URL.createObjectURL(imageFile[0])
                                      : "/images/no-image.jpg"
                                  }
                                  alt="profile"
                                  fill
                                  priority
                                  className="object-contain"
                                />
                              ) : (
                                <div className="absolute my-auto h-full w-full text-center text-sm font-medium leading-4 text-color-dark">
                                  <div className="flex h-full flex-col items-center justify-center">
                                    <Image
                                      src="/images/upload.png"
                                      className="mb-3"
                                      width={30}
                                      height={30}
                                      alt="camera"
                                    />
                                    <span dir={langDir} translate="no">
                                      {t("drop_your_company_logo")}{" "}
                                    </span>
                                    <span className="text-primary">
                                      browse
                                    </span>
                                    <p
                                      className="text-normal mt-3 text-xs leading-4 text-muted-foreground"
                                      dir={langDir}
                                      translate="no"
                                    >
                                      ({t("company_logo_spec")})
                                    </p>
                                  </div>
                                </div>
                              )}

                              <Input
                                type="file"
                                accept="image/*"
                                multiple={false}
                                className="bottom-0! h-64 w-full! opacity-0"
                                {...field}
                                onChange={(event) => {
                                  if (event.target.files?.[0]) {
                                    if (
                                      event.target.files[0].size > 524288000
                                    ) {
                                      toast({
                                        title: t(
                                          "image_size_should_be_less_than_size",
                                          { size: "500MB" },
                                        ),
                                        variant: "danger",
                                      });
                                      return;
                                    }
                                    setImageFile(event.target.files);
                                  }
                                }}
                                id="uploadImage"
                              />
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="mb-3.5 w-full md:w-6/12 md:pl-3.5">
                    <ControlledTextInput
                      label={t("company_name")}
                      name="companyName"
                      placeholder={t("company_name")}
                      dir={langDir}
                      translate="no"
                    />

                    {/* TODO:fix this */}
                    <ControlledSelectInput
                      label={t("business_type")}
                      name="businessTypeList"
                      options={memoizedTags.map((item: OptionProps) => ({
                        value: item.value?.toString(),
                        label: item.label,
                      }))}
                    />

                    <ControlledTextInput
                      label={t("annual_purchasing_volume")}
                      name="annualPurchasingVolume"
                      placeholder={t("annual_purchasing_volume")}
                      type="number"
                      onWheel={(e) => e.currentTarget.blur()}
                      dir={langDir}
                      translate="no"
                    />
                  </div>
                </div>
              </div>

              <div className="mb-3.5 w-full">
                <div className="mb-4 w-full border-y border-solid border-border py-2.5">
                  <label
                    className="m-0 block text-left text-base font-medium leading-5 text-color-dark"
                    dir={langDir}
                    translate="no"
                  >
                    {t("registration_address")}
                  </label>
                </div>
                <div className="flex flex-wrap">
                  <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-2">
                    <div className="relative w-full">
                      <ControlledTextInput
                        label={t("address")}
                        name="address"
                        placeholder={t("address")}
                        dir={langDir}
                        translate="no"
                      />

                      <Image
                        src="/images/location.svg"
                        alt="location-icon"
                        height={16}
                        width={16}
                        className="absolute right-6 top-[24px]"
                      />
                    </div>

                    <ControlledTextInput
                      label={t("city")}
                      name="city"
                      placeholder={t("city")}
                      dir={langDir}
                      translate="no"
                    />
                  </div>

                  <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-2">
                    <ControlledTextInput
                      label={t("province")}
                      name="province"
                      placeholder={t("province")}
                      dir={langDir}
                      translate="no"
                    />

                    <ControlledSelectInput
                      label={t("country")}
                      name="country"
                      options={memoizedCountries}
                    />
                  </div>
                </div>
              </div>

              <div className="mb-5 w-full">
                <div className="mb-4 w-full border-y border-solid border-border py-2.5">
                  <label
                    className="m-0 block text-left text-base font-medium leading-5 text-color-dark"
                    dir={langDir}
                    translate="no"
                  >
                    {t("more_information")}
                  </label>
                </div>

                <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-2">
                  {/* TODO: fix submit value type */}
                  <ControlledSelectInput
                    label={t("year_of_establishment")}
                    name="yearOfEstablishment"
                    options={memoizedLastTwoHundredYears?.map((item: any) => ({
                      label: item?.toString(),
                      value: item?.toString(),
                    }))}
                  />

                  <ControlledSelectInput
                    label={t("total_no_of_employees")}
                    name="totalNoOfEmployee"
                    options={NO_OF_EMPLOYEES_LIST}
                  />
                </div>

                <ControlledRichTextEditor
                  label={t("about_us")}
                  name="aboutUsJson"
                />
              </div>
            </div>

            <div className="mb-3.5 w-full">
              <div className="mb-4 flex w-full items-center justify-between border-y border-solid border-border py-2.5">
                <label
                  className="m-0 block text-left text-base font-medium leading-5 text-color-dark"
                  dir={langDir}
                  translate="no"
                >
                  {t("branch")}
                </label>
                <Button
                  type="button"
                  onClick={appendBranchList}
                  className="flex cursor-pointer items-center bg-transparent p-0 text-sm font-semibold capitalize text-dark-orange shadow-none hover:bg-transparent"
                  dir={langDir}
                  translate="no"
                >
                  <Image
                    src="/images/add-icon.svg"
                    className="mr-1"
                    width={14}
                    height={14}
                    alt="add-icon"
                  />
                  <span>{t("add_new_branch")}</span>
                </Button>
              </div>
            </div>

            {fieldArray.fields.map((field, index) => (
              <div key={field.id}>
                <div className="mb-3.5 w-full">
                  <AccordionMultiSelectV2
                    label={t("business_type")}
                    name={`branchList.${index}.businessTypeList`}
                    options={memoizedTags || []}
                    placeholder={t("business_type")}
                    error={String(
                      form.formState.errors?.branchList?.[index]
                        ?.businessTypeList?.message || "",
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`branchList.${index}.branchFrontPicture`}
                    render={({ field }) => (
                      <FormItem className="mb-3.5 w-full">
                        <FormLabel dir={langDir} translate="no">
                          {t("upload_branch_front_picture")}
                        </FormLabel>
                        <FormControl>
                          <div className="relative m-auto h-64 w-full border-2 border-dashed border-border">
                            <div className="relative h-full w-full">
                              {form.getValues()?.branchList[index]
                                ?.branchFrontPicture ? (
                                <Image
                                  src={
                                    form.getValues()?.branchList[index]
                                      ?.branchFrontPicture ||
                                    "/images/no-image.jpg"
                                  }
                                  alt="profile"
                                  fill
                                  priority
                                  className="object-contain"
                                />
                              ) : (
                                <div className="absolute my-auto h-full w-full text-center text-sm font-medium leading-4 text-color-dark">
                                  <div
                                    className="flex h-full flex-col items-center justify-center"
                                    dir={langDir}
                                  >
                                    <Image
                                      src="/images/upload.png"
                                      className="mb-3"
                                      width={30}
                                      height={30}
                                      alt="camera"
                                    />
                                    <span translate="no">
                                      {t("drop_your_branch_front_picture")}{" "}
                                    </span>
                                    <span className="text-primary">
                                      browse
                                    </span>
                                    <p className="text-normal mt-3 text-xs leading-4 text-muted-foreground" translate="no">
                                      ({t("branch_front_picture_spec")})
                                    </p>
                                  </div>
                                </div>
                              )}

                              <Input
                                type="file"
                                accept="image/*"
                                multiple={false}
                                className="bottom-0! h-64 w-full! opacity-0"
                                // {...field}
                                value=""
                                onChange={async (event) => {
                                  if (event.target.files?.[0]) {
                                    if (
                                      event.target.files[0].size > 524288000
                                    ) {
                                      toast({
                                        title: t(
                                          "image_size_should_be_less_than_size",
                                          { size: "500MB" },
                                        ),
                                        variant: "danger",
                                      });
                                      return;
                                    }
                                    const response = await handleUploadedFile(
                                      event.target.files,
                                    );
                                    field.onChange(response);
                                  }
                                }}
                                id={`branchList.${index}.branchFrontPicture`}
                              />
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`branchList.${index}.proofOfAddress`}
                    render={({ field }) => (
                      <FormItem className="mb-3.5 w-full">
                        <FormLabel dir={langDir} translate="no">
                          {t("proof_of_address")}
                        </FormLabel>
                        <FormControl>
                          <div className="relative m-auto h-64 w-full border-2 border-dashed border-border">
                            <div className="relative h-full w-full">
                              {form.getValues()?.branchList[index]
                                ?.proofOfAddress ? (
                                <Image
                                  src={
                                    form.getValues()?.branchList[index]
                                      ?.proofOfAddress || "/images/no-image.jpg"
                                  }
                                  alt="profile"
                                  fill
                                  priority
                                  className="object-contain"
                                />
                              ) : (
                                <div className="absolute my-auto h-full w-full text-center text-sm font-medium leading-4 text-color-dark">
                                  <div
                                    className="flex h-full flex-col items-center justify-center"
                                    dir={langDir}
                                  >
                                    <Image
                                      src="/images/upload.png"
                                      className="mb-3"
                                      width={30}
                                      height={30}
                                      alt="camera"
                                    />
                                    <span translate="no">{t("drop_your_address_proof")}</span>
                                    <span className="text-primary">
                                      browse
                                    </span>
                                    <p className="text-normal mt-3 text-xs leading-4 text-muted-foreground" translate="no">
                                      ({t("address_proof_spec")})
                                    </p>
                                  </div>
                                </div>
                              )}

                              <Input
                                type="file"
                                accept="image/*"
                                multiple={false}
                                className="bottom-0! h-64 w-full! opacity-0"
                                // {...field}
                                value=""
                                onChange={async (event) => {
                                  if (event.target.files?.[0]) {
                                    if (
                                      event.target.files[0].size > 524288000
                                    ) {
                                      toast({
                                        title: t(
                                          "image_size_should_be_less_than_size",
                                          { size: "500MB" },
                                        ),
                                        variant: "danger",
                                      });
                                      return;
                                    }
                                    const response = await handleUploadedFile(
                                      event.target.files,
                                    );

                                    field.onChange(response);
                                  }
                                }}
                                id={`branchList.${index}.proofOfAddress`}
                              />
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex w-full flex-wrap">
                  <div className="mb-4 w-full">
                    <div className="mt-2.5 w-full border-b-2 border-dashed border-border">
                      <label
                        className="mb-3.5 block text-left text-lg font-medium capitalize leading-5 text-color-dark"
                        dir={langDir}
                        translate="no"
                      >
                        {t("branch_location")}
                      </label>
                    </div>
                  </div>

                  <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-2">
                    <div className="relative w-full">
                      <ControlledTextInput
                        label={t("address")}
                        name={`branchList.${index}.address`}
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
                      name={`branchList.${index}.city`}
                      placeholder={t("city")}
                      showLabel={true}
                      dir={langDir}
                      translate="no"
                    />
                  </div>

                  <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-2">
                    <ControlledTextInput
                      label={t("province")}
                      name={`branchList.${index}.province`}
                      placeholder={t("province")}
                      showLabel={true}
                      dir={langDir}
                      translate="no"
                    />

                    <ControlledSelectInput
                      label={t("country")}
                      name={`branchList.${index}.country`}
                      options={memoizedCountries}
                    />
                  </div>

                  <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-2">
                    <ControlledPhoneInput
                      label={t("branch_contact_number")}
                      name={`branchList.${index}.contactNumber`}
                      countryName="cc"
                      placeholder={t("branch_contact_number")}
                    />

                    <ControlledTextInput
                      className="mt-0"
                      label={t("branch_contact_name")}
                      name={`branchList.${index}.contactName`}
                      placeholder={t("branch_contact_name")}
                      showLabel={true}
                      dir={langDir}
                      translate="no"
                    />
                  </div>
                </div>

                <div className="flex w-full flex-wrap">
                  <div className="mb-4 w-full">
                    <div className="mt-2.5 w-full border-b-2 border-dashed border-border">
                      <label
                        className="mb-3.5 block text-left text-lg font-medium capitalize leading-5 text-color-dark"
                        dir={langDir}
                        translate="no"
                      >
                        {t("branch_working_hours")}
                      </label>
                    </div>
                  </div>
                  <div className="w-full">
                    <div className="flex flex-wrap">
                      <div className="mb-4 flex w-full flex-col gap-y-3 md:w-6/12 md:pr-3.5">
                        <Label
                          htmlFor="startTime"
                          className="text-color-dark"
                          dir={langDir}
                          translate="no"
                        >
                          {t("start_time")}
                        </Label>
                        <Controller
                          name={`branchList.${index}.startTime`}
                          control={form.control}
                          render={({ field }) => (
                            <select
                              {...field}
                              className="h-12! w-full rounded border border-border! px-3 text-base focus-visible:ring-0!"
                            >
                              <option value="" dir={langDir} translate="no">
                                {t("select")}
                              </option>
                              {HOURS_24_FORMAT.map(
                                (hour: string, index: number) => (
                                  <option
                                    key={index}
                                    value={hour}
                                    dir={langDir}
                                  >
                                    {getAmPm(hour)}
                                  </option>
                                ),
                              )}
                            </select>
                          )}
                        />
                        <p className="text-[13px] text-destructive" dir={langDir}>
                          {
                            form.formState.errors.branchList?.[index]?.startTime
                              ?.message
                          }
                        </p>
                      </div>

                      <div className="mb-4 flex w-full flex-col gap-y-3 md:w-6/12 md:pl-3.5">
                        <Label
                          htmlFor="endTime"
                          className="text-color-dark"
                          dir={langDir}
                          translate="no"
                        >
                          {t("end_time")}
                        </Label>
                        <Controller
                          name={`branchList.${index}.endTime`}
                          control={form.control}
                          render={({ field }) => (
                            <select
                              {...field}
                              className="h-12! w-full rounded border border-border! px-3 text-base focus-visible:ring-0!"
                            >
                              <option value="" dir={langDir} translate="no">
                                {t("select")}
                              </option>
                              {HOURS_24_FORMAT.map(
                                (hour: string, index: number) => (
                                  <option
                                    key={index}
                                    value={hour}
                                    dir={langDir}
                                  >
                                    {getAmPm(hour)}
                                  </option>
                                ),
                              )}
                            </select>
                          )}
                        />
                        <p className="text-[13px] text-destructive" dir={langDir}>
                          {
                            form.formState.errors.branchList?.[index]?.endTime
                              ?.message
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mb-3.5 w-full border-b-2 border-dashed border-border pb-4">
                    <div className="flex flex-wrap">
                      {DAYS_OF_WEEK.map((item) => (
                        <FormField
                          key={item.value}
                          control={form.control}
                          name={`branchList.${index}.workingDays`}
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
                                  checked={
                                    !!field.value[
                                    item.value as keyof typeof field.value
                                    ]
                                  }
                                  className="border border-solid border-border data-[state=checked]:bg-dark-orange!"
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
                    {form.formState.errors.branchList?.[index]?.workingDays
                      ?.message ? (
                      <p className="text-[13px] text-destructive" dir={langDir} translate="no">
                        {t("working_day_required")}
                      </p>
                    ) : null}
                  </div>

                  {/* <AccordionMultiSelectV2
                    label="Tag"
                    name={`branchList.${index}.tagList`}
                    options={memoizedTags || []}
                    placeholder="Tag"
                    error={
                      form.formState.errors.branchList?.[index]?.tagList
                        ?.message
                    }
                  /> */}
                </div>

                <MultiSelectCategory
                  name={`branchList.${index}.categoryList`}
                />

                <div className="mb-3.5 flex w-full justify-end border-b-2 border-dashed border-border pb-4">
                  <div className="mb-3.5 flex w-full border-b-2 border-dashed border-border pb-4">
                    <FormField
                      control={form.control}
                      name={`branchList.${index}.mainOffice`}
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between gap-x-2 rounded-lg">
                          <FormLabel dir={langDir} translate="no">
                            {t("main_office")}:
                          </FormLabel>
                          <FormControl>
                            <Switch
                              checked={!!field.value}
                              onCheckedChange={field.onChange}
                              className="mt-0! data-[state=checked]:bg-dark-orange!"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  {index !== 0 ? (
                    <Button
                      type="button"
                      onClick={() => removeBranchList(index)}
                      className="flex cursor-pointer items-center bg-transparent p-0 text-sm font-semibold capitalize text-dark-orange shadow-none hover:bg-transparent"
                    >
                      <Image
                        src="/images/social-delete-icon.svg"
                        height={35}
                        width={35}
                        alt="social-delete-icon"
                      />
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}

            <Button
              disabled={createCompanyProfile.isPending || upload.isPending}
              type="submit"
              className="h-12 w-full rounded bg-dark-orange text-center text-lg font-bold leading-6 text-white hover:bg-dark-orange hover:opacity-90"
              dir={langDir}
              translate="no"
            >
              {createCompanyProfile.isPending || upload.isPending ? (
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
                t("save_changes")
              )}
            </Button>
          </form>
        </Form>
      </div>
    </section>
  );
}
