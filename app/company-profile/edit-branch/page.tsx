"use client";
import { Button } from "@/components/ui/button";
import React, { useEffect, useMemo, useState } from "react";
import {
  useFetchCompanyBranchById,
  useUpdateCompanyBranch,
} from "@/apis/queries/company.queries";
import { Controller, useForm } from "react-hook-form";
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
import { DAYS_OF_WEEK, HOURS_24_FORMAT } from "@/utils/constants";
import { useTags } from "@/apis/queries/tags.queries";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { getAmPm } from "@/utils/helper";
import AccordionMultiSelectV2 from "@/components/shared/AccordionMultiSelectV2";
import { useUploadFile } from "@/apis/queries/upload.queries";
import ControlledPhoneInput from "@/components/shared/Forms/ControlledPhoneInput";
import ControlledTextInput from "@/components/shared/Forms/ControlledTextInput";
import { ICountries } from "@/utils/types/common.types";
import { useCountries } from "@/apis/queries/masters.queries";
// import ControlledSelectInput from "@/components/shared/Forms/ControlledSelectInput";
import { useQueryClient } from "@tanstack/react-query";
import BackgroundImage from "@/public/images/before-login-bg.png";
import MultiSelectCategory from "@/components/shared/MultiSelectCategory";
import ReactSelect from "react-select";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

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
    uploadBranchImage: z.any().optional(),
    uploadProofOfAddress: z.any().optional(),
    branchFrontPicture: z.string().trim().optional(),
    proofOfAddress: z.string().trim().optional(),
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
        const temp: any = [];
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
    categoryList: z.any().optional(),
    mainOffice: z
      .boolean()
      .transform((value) => (value ? 1 : 0))
      .optional(),
  })
  .superRefine(({ startTime, endTime }, ctx) => {
    if (startTime && endTime && startTime > endTime) {
      ctx.addIssue({
        code: "custom",
        message: "End Time must be greater than Start Time",
        path: ["endTime"],
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
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      uploadBranchImage: undefined,
      uploadProofOfAddress: undefined,
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
      // tagList: [],
      categoryList: undefined,
      mainOffice: false,
    },
  });
  const [activeBranchId, setActiveBranchId] = useState<string | null>();
  const [branchImageFile, setBranchImageFile] = useState<FileList | null>();
  const [proofOfAddressImageFile, setProofOfAddressImageFile] =
    useState<FileList | null>();

  const countriesQuery = useCountries();
  const tagsQuery = useTags();
  const upload = useUploadFile();
  const branchQueryById = useFetchCompanyBranchById(
    activeBranchId ? activeBranchId : "",
    !!activeBranchId,
  );
  const updateCompanyBranch = useUpdateCompanyBranch();

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
      profileType: "COMPANY",
      branchId: Number(activeBranchId),
    };

    formData.uploadBranchImage = branchImageFile;
    formData.uploadProofOfAddress = proofOfAddressImageFile;

    let getBranchImageUrl;
    let getProofOfAddressImageUrl;
    if (formData.uploadBranchImage) {
      getBranchImageUrl = await handleUploadedFile(formData.uploadBranchImage);
    }

    if (formData.uploadProofOfAddress) {
      getProofOfAddressImageUrl = await handleUploadedFile(
        formData.uploadProofOfAddress,
      );
    }

    delete data.uploadBranchImage;
    delete data.uploadProofOfAddress;
    if (getBranchImageUrl) {
      data.branchFrontPicture = getBranchImageUrl;
    }
    if (getProofOfAddressImageUrl) {
      data.proofOfAddress = getProofOfAddressImageUrl;
    }

    // return;
    const response = await updateCompanyBranch.mutateAsync(data);

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
      router.push("/company-profile-details");
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
    const branchId = params.get("branchId");
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

      // const tagList = branch?.userBranchTags
      //   ? branch?.userBranchTags?.map((item: any) => {
      //       return {
      //         label: item?.userBranchTagsTag?.tagName,
      //         value: item?.userBranchTagsTag?.id,
      //       };
      //     })
      //   : [];

      const categoryList = branch?.userBranch_userBranchCategory
        ? branch?.userBranch_userBranchCategory?.map((item: any) => {
          return {
            categoryId: item?.categoryId,
            categoryLocation: item?.categoryLocation,
          };
        })
        : undefined;

      //TODO: main office prefilled but not working. API issue
      form.reset({
        mainOffice:
          branch?.mainOffice && branch?.mainOffice === 1 ? true : false,
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
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="m-auto mb-12 w-11/12 rounded-lg border border-solid border-border bg-card p-6 shadow-xs sm:p-8 md:w-10/12 lg:w-10/12 lg:p-12"
          >
            <div className="text-normal m-auto mb-7 w-full text-center text-sm leading-6 text-light-gray">
              <h2 className="mb-3 text-center text-3xl font-semibold leading-8 text-color-dark sm:text-4xl sm:leading-10" translate="no">
                {t("edit_branch")}
              </h2>
            </div>

            <div className="mb-4 w-full">
              <div className="mt-2.5 w-full border-b-2 border-dashed border-border">
                <label
                  className={cn(
                    "mb-3.5 block",
                    langDir == "rtl" ? "text-right" : "text-left",
                    "text-lg font-medium capitalize leading-5 text-color-dark"
                  )}
                  translate="no"
                >
                  {t("branch_information")}
                </label>
              </div>
            </div>

            <div>
              <div className="mb-3.5 w-full">
                <AccordionMultiSelectV2
                  label={t("business_type")}
                  name="businessTypeList"
                  options={memoizedTags || []}
                  placeholder={t("business_type")}
                  error={String(form.formState.errors?.businessTypeList?.message || '')}
                />

                <FormField
                  control={form.control}
                  name="uploadBranchImage"
                  render={({ field }) => (
                    <FormItem className="mb-3.5 w-full" dir={langDir}>
                      <FormLabel translate="no">{t("upload_branch_front_picture")}</FormLabel>
                      <FormControl>
                        <div className="relative m-auto h-64 w-full border-2 border-dashed border-border">
                          <div className="relative h-full w-full">
                            {branchImageFile || branchQueryById.data?.data ? (
                              <Image
                                src={
                                  branchImageFile
                                    ? URL.createObjectURL(branchImageFile[0])
                                    : branchQueryById.data?.data
                                      ?.branchFrontPicture
                                      ? branchQueryById.data.data
                                        .branchFrontPicture
                                      : "/images/no-image.jpg"
                                }
                                alt="profile"
                                fill
                                priority
                                className="object-contain"
                              />
                            ) : (
                              <div className="absolute my-auto h-full w-full text-center text-sm font-medium leading-4 text-color-dark">
                                <div className="flex h-full flex-col items-center justify-center" dir={langDir}>
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
                                  <span className="text-primary">browse</span>
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
                              {...field}
                              onChange={(event) => {
                                if (event.target.files?.[0]) {
                                  if (event.target.files[0].size > 524288000) {
                                    toast({
                                      title: t("image_size_should_be_less_than_size", { size: "500MB" }),
                                      variant: "danger",
                                    });
                                    return;
                                  }
                                  setBranchImageFile(event.target.files);
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

                <FormField
                  control={form.control}
                  name="uploadProofOfAddress"
                  render={({ field }) => (
                    <FormItem className="mb-3.5 w-full" dir={langDir}>
                      <FormLabel translate="no">{t("address_proof")}</FormLabel>
                      <FormControl>
                        <div className="relative m-auto h-64 w-full border-2 border-dashed border-border">
                          <div className="relative h-full w-full">
                            {proofOfAddressImageFile ||
                              branchQueryById.data?.data ? (
                              <Image
                                src={
                                  proofOfAddressImageFile
                                    ? URL.createObjectURL(
                                      proofOfAddressImageFile[0],
                                    )
                                    : branchQueryById.data?.data?.proofOfAddress
                                      ? branchQueryById.data.data.proofOfAddress
                                      : "/images/no-image.jpg"
                                }
                                alt="profile"
                                fill
                                priority
                                className="object-contain"
                              />
                            ) : (
                              <div className="absolute my-auto h-full w-full text-center text-sm font-medium leading-4 text-color-dark">
                                <div className="flex h-full flex-col items-center justify-center" dir={langDir}>
                                  <Image
                                    src="/images/upload.png"
                                    className="mb-3"
                                    width={30}
                                    height={30}
                                    alt="camera"
                                  />
                                  <span translate="no">
                                    {t("drop_your_address_proof")}{" "}
                                  </span>
                                  <span className="text-primary">browse</span>
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
                              {...field}
                              onChange={(event) => {
                                if (event.target.files?.[0]) {
                                  if (event.target.files[0].size > 524288000) {
                                    toast({
                                      title: t("image_size_should_be_less_than_size", { size: "500MB" }),
                                      variant: "danger",
                                    });
                                    return;
                                  }
                                  setProofOfAddressImageFile(
                                    event.target.files,
                                  );
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
              </div>

              <div className="flex w-full flex-wrap">
                <div className="mb-4 w-full">
                  <div className="mt-2.5 w-full border-b-2 border-dashed border-border">
                    <label
                      className={cn(
                        "mb-3.5 block",
                        langDir == 'rtl' ? 'text-right' : 'text-left',
                        "text-lg font-medium capitalize leading-5 text-color-dark"
                      )}
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
                      name="address"
                      placeholder={t("address")}
                      showLabel={true}
                      dir={langDir}
                      translate="no"
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
                          isRtl={langDir == 'rtl'}
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

              <div className="flex w-full flex-wrap">
                <div className="mb-4 w-full">
                  <div className="mt-2.5 w-full border-b-2 border-dashed border-border">
                    <label className="mb-3.5 block text-left text-lg font-medium capitalize leading-5 text-color-dark" dir={langDir} translate="no">
                      {t("branch_working_hours")}
                    </label>
                  </div>
                </div>
                <div className="w-full">
                  <div className="flex flex-wrap">
                    <div className="mb-4 flex w-full flex-col gap-y-3 md:w-6/12 md:pr-3.5">
                      <Label htmlFor="startTime" className="text-color-dark" dir={langDir} translate="no">
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
                            <option value="" dir={langDir} translate="no">{t("select")}</option>
                            {HOURS_24_FORMAT.map(
                              (hour: string, index: number) => (
                                <option key={index} value={hour} dir={langDir}>
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

                    <div className="mb-4 flex w-full flex-col gap-y-3 md:w-6/12 md:pl-3.5">
                      <Label htmlFor="endTime" className="text-color-dark" dir={langDir} translate="no">
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
                            <option value="" dir={langDir} translate="no">{t("select")}</option>
                            {HOURS_24_FORMAT.map(
                              (hour: string, index: number) => (
                                <option key={index} value={hour} dir={langDir}>
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

              <div className="mb-3.5 flex w-full border-b-2 border-dashed border-border pb-4" dir={langDir}>
                <FormField
                  control={form.control}
                  name="mainOffice"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between gap-x-2 rounded-lg">
                      <FormLabel translate="no">{t("main_branch")}:</FormLabel>
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
            </div>

            <Button
              disabled={updateCompanyBranch.isPending || upload.isPending}
              type="submit"
              className="h-12 w-full rounded bg-dark-orange text-center text-lg font-bold leading-6 text-white hover:bg-dark-orange hover:opacity-90"
              dir={langDir}
              translate="no"
            >

              {updateCompanyBranch.isPending || upload.isPending ? (
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
    </section>
  );
}
