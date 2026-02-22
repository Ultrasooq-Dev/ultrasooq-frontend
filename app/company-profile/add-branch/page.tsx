"use client";
import { useCreateCompanyBranch } from "@/apis/queries/company.queries";
import { useCountries } from "@/apis/queries/masters.queries";
import { useTags } from "@/apis/queries/tags.queries";
import { useUploadFile } from "@/apis/queries/upload.queries";
import { useMe } from "@/apis/queries/user.queries";
import AccordionMultiSelectV2 from "@/components/shared/AccordionMultiSelectV2";
import ControlledPhoneInput from "@/components/shared/Forms/ControlledPhoneInput";
import ControlledSelectInput from "@/components/shared/Forms/ControlledSelectInput";
import ControlledTextInput from "@/components/shared/Forms/ControlledTextInput";
import MultiSelectCategory from "@/components/shared/MultiSelectCategory";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import BackgroundImage from "@/public/images/before-login-bg.png";
import { DAYS_OF_WEEK, HOURS_24_FORMAT } from "@/utils/constants";
import { getAmPm } from "@/utils/helper";
import { ICountries } from "@/utils/types/common.types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = (t: any) => {
  return z
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
          {
            message: t("business_type_required"),
          },
        )
        .min(1, {
          message: t("business_type_required"),
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
          message: t("branch_contact_number_must_be_min_n_digits", { n: 8 }),
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
      if (startTime && endTime && startTime > endTime) {
        ctx.addIssue({
          code: "custom",
          message: t("start_time_must_be_less_than_end_time"),
          path: ["startTime"],
        });
      }
    });
};

const AddBranchPage = () => {
  const t = useTranslations();
  const { langDir } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const form = useForm({
    resolver: zodResolver(formSchema(t)),
    defaultValues: {
      uploadBranchImage: undefined,
      uploadProofOfAddress: undefined,
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
  });
  const [branchImageFile, setBranchImageFile] = useState<FileList | null>();
  const [proofOfAddressImageFile, setProofOfAddressImageFile] =
    useState<FileList | null>();

  const me = useMe();
  const countriesQuery = useCountries();
  const tagsQuery = useTags();
  const upload = useUploadFile();
  const createCompanyBranch = useCreateCompanyBranch();

  const countriesData = countriesQuery?.data?.data || [];

  const memoizedCountries = useMemo(() => {
    return (
      countriesData.map((item: ICountries) => {
        return { label: item.countryName, value: item.countryName };
      }) || []
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countriesData?.length]);

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
    let data = {
      ...formData,
      profileType: "COMPANY",
      userProfileId: me.data?.data?.userProfile?.[0]?.id as number,
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
    const response = await createCompanyBranch.mutateAsync(data);

    if (response.status && response.data) {
      toast({
        title: t("branch_add_successful"),
        description: response.message,
        variant: "success",
      });
      form.reset();
      // Force a full page reload to ensure fresh data is fetched
      window.location.href = "/company-profile-details";
    } else {
      toast({
        title: t("branch_add_failed"),
        description: response.message,
        variant: "danger",
      });
    }
  };

  return (
    <section className="relative w-full py-7">
      <div className="absolute top-0 left-0 -z-10 h-full w-full">
        <Image
          src={BackgroundImage}
          className="h-full w-full object-cover object-center"
          alt="background"
          fill
          priority
        />
      </div>
      <div className="relative z-10 container m-auto">
        <div className="flex">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="m-auto mb-12 w-11/12 rounded-lg border border-solid border-gray-300 bg-white p-6 shadow-xs sm:p-8 md:w-10/12 lg:w-10/12 lg:p-10"
            >
              <div className="text-normal text-light-gray m-auto mb-7 w-full text-center text-sm leading-6">
                <h2
                  className="text-color-dark mb-3 text-center text-3xl leading-8 font-semibold sm:text-4xl sm:leading-10"
                  translate="no"
                >
                  {t("add_branch")}
                </h2>
              </div>

              <div className="mb-4 w-full">
                <div className="mt-2.5 w-full border-b-2 border-dashed border-gray-300">
                  <label
                    className={cn(
                      "mb-3.5 block",
                      langDir == "rtl" ? "text-right" : "text-left",
                      "text-color-dark text-lg leading-5 font-medium capitalize",
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
                    error={String(
                      form.formState.errors?.businessTypeList?.message || "",
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="uploadBranchImage"
                    render={({ field }) => (
                      <FormItem className="mb-3.5 w-full" dir={langDir}>
                        <FormLabel translate="no">
                          {t("upload_branch_front_picture")}
                        </FormLabel>
                        <FormControl>
                          <div className="relative m-auto h-64 w-full border-2 border-dashed border-gray-300">
                            <div className="relative h-full w-full">
                              {branchImageFile ? (
                                <Image
                                  src={
                                    branchImageFile
                                      ? URL.createObjectURL(branchImageFile[0])
                                      : "/images/no-image.jpg"
                                  }
                                  alt="profile"
                                  fill
                                  priority
                                  className="object-contain"
                                />
                              ) : (
                                <div className="text-color-dark absolute my-auto h-full w-full text-center text-sm leading-4 font-medium">
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
                                    <p
                                      className="text-normal mt-3 text-xs leading-4 text-gray-300"
                                      translate="no"
                                    >
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
                        <FormLabel translate="no">
                          {t("proof_of_address")}
                        </FormLabel>
                        <FormControl>
                          <div className="relative m-auto h-64 w-full border-2 border-dashed border-gray-300">
                            <div className="relative h-full w-full">
                              {proofOfAddressImageFile ? (
                                <Image
                                  src={
                                    proofOfAddressImageFile
                                      ? URL.createObjectURL(
                                          proofOfAddressImageFile[0],
                                        )
                                      : "/images/no-image.jpg"
                                  }
                                  alt="profile"
                                  fill
                                  priority
                                  className="object-contain"
                                />
                              ) : (
                                <div className="text-color-dark absolute my-auto h-full w-full text-center text-sm leading-4 font-medium">
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
                                      {t("drop_your_address_proof")}{" "}
                                    </span>
                                    <span className="text-primary">
                                      browse
                                    </span>
                                    <p
                                      className="text-normal mt-3 text-xs leading-4 text-gray-300"
                                      translate="no"
                                    >
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
                    <div className="mt-2.5 w-full border-b-2 border-dashed border-gray-300">
                      <label
                        className={cn(
                          "mb-3.5 block",
                          langDir == "rtl" ? "text-right" : "text-left",
                          "text-color-dark text-lg leading-5 font-medium capitalize",
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

                    <ControlledSelectInput
                      label={t("country")}
                      name="country"
                      options={memoizedCountries}
                    />
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
                    <div className="mt-2.5 w-full border-b-2 border-dashed border-gray-300">
                      <label
                        className="text-color-dark mb-3.5 block text-left text-lg leading-5 font-medium capitalize"
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
                          name="startTime"
                          control={form.control}
                          render={({ field }) => (
                            <select
                              {...field}
                              className="h-12! w-full rounded border border-gray-300! px-3 text-base focus-visible:ring-0!"
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
                          {form.formState.errors.startTime?.message}
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
                          name="endTime"
                          control={form.control}
                          render={({ field }) => (
                            <select
                              {...field}
                              className="h-12! w-full rounded border border-gray-300! px-3 text-base focus-visible:ring-0!"
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
                          {form.formState.errors.endTime?.message}
                        </p>
                      </div>
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
                            <FormItem className="mr-4 mb-4 flex flex-row items-start space-y-0 space-x-3">
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
                                  className="data-[state=checked]:bg-dark-orange! border border-solid border-gray-300"
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
                      <p
                        className="text-[13px] text-destructive"
                        dir={langDir}
                        translate="no"
                      >
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

                <div
                  className="mb-3.5 flex w-full border-b-2 border-dashed border-gray-300 pb-4"
                  dir={langDir}
                >
                  <FormField
                    control={form.control}
                    name="mainOffice"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between gap-x-2 rounded-lg">
                        <FormLabel translate="no">
                          {t("main_branch")}:
                        </FormLabel>
                        <FormControl>
                          <Switch
                            checked={!!field.value}
                            onCheckedChange={field.onChange}
                            className="data-[state=checked]:bg-dark-orange! mt-0!"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Button
                disabled={createCompanyBranch.isPending || upload.isPending}
                type="submit"
                className="bg-dark-orange hover:bg-dark-orange h-12 w-full rounded text-center text-lg leading-6 font-bold text-white hover:opacity-90"
                dir={langDir}
                translate="no"
              >
                {createCompanyBranch.isPending || upload.isPending ? (
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
                  t("add_branch")
                )}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </section>
  );
};

export default AddBranchPage;
