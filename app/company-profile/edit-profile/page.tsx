"use client";
import { Button } from "@/components/ui/button";
import React, { useEffect, useMemo, useState } from "react";
import { useUpdateCompanyProfile, useCreateCompanyProfile } from "@/apis/queries/company.queries";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { useTags } from "@/apis/queries/tags.queries";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { useUniqueUser } from "@/apis/queries/user.queries";
import { useUploadFile } from "@/apis/queries/upload.queries";
import { getLastTwoHundredYears, handleDescriptionParse } from "@/utils/helper";
import ControlledTextInput from "@/components/shared/Forms/ControlledTextInput";
import ControlledSelectInput from "@/components/shared/Forms/ControlledSelectInput";
import { useCountries } from "@/apis/queries/masters.queries";
import { ICountries, OptionProps } from "@/utils/types/common.types";
import { NO_OF_EMPLOYEES_LIST } from "@/utils/constants";
import ControlledRichTextEditor from "@/components/shared/Forms/ControlledRichTextEditor";
import BackgroundImage from "@/public/images/before-login-bg.png";
import ControlledPhoneInput from "@/components/shared/Forms/ControlledPhoneInput";
import QuillEditor from "@/components/shared/Quill/QuillEditor";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const formSchema = (t: any) => {
  return z.object({
    uploadImage: z.any().optional(),
    logo: z.string().trim().optional(),
    companyName: z.string().trim().optional()
      .refine((val) => !val || val.length >= 2, { message: t("company_name_must_be_50_chars_only") })
      .refine((val) => !val || val.length <= 50, { message: t("company_name_must_be_less_than_50_chars") }),
    businessTypeList: z.string().optional().transform((value) => value ? [{ businessTypeId: Number(value) }] : []),
    annualPurchasingVolume: z.string().trim().optional()
      .refine((val) => !val || val.length >= 2, { message: t("annual_purchasing_volume_required") })
      .refine((val) => !val || val.length <= 50, { message: t("annual_purchasing_volume_must_be_less_than_20_digits") }),
    address: z.string().trim().optional()
      .refine((val) => !val || val.length >= 2, { message: t("address_must_be_less_than_n_chars", { n: 50 }) })
      .refine((val) => !val || val.length <= 50, { message: t("address_must_be_less_than_n_chars", { n: 50 }) }),
    city: z.string().trim().optional()
      .refine((val) => !val || val.length >= 2, { message: t("city_required") }),
    province: z.string().trim().optional()
      .refine((val) => !val || val.length >= 2, { message: t("province_required") }),
    country: z.string().trim().optional()
      .refine((val) => !val || val.length >= 2, { message: t("country_required") }),
    yearOfEstablishment: z.string().trim().optional()
      .transform((value) => value ? Number(value) : undefined),
    totalNoOfEmployee: z.string().trim().optional()
      .refine((val) => !val || val.length >= 2, { message: t("total_no_of_employees_required") }),
    aboutUs: z.string().trim().optional(),
    aboutUsJson: z.any().optional(),
    cc: z.string().trim().optional(),
    phoneNumber: z.string().trim().optional()
      .refine((val) => !val || val.length >= 8, { message: t("phone_number_must_be_min_8_digits") })
      .refine((val) => !val || val.length <= 20, { message: t("phone_number_cant_be_more_than_20_digits") }),
  });
};

export default function EditProfilePage() {
  const t = useTranslations();
  const { langDir } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(formSchema(t)) as any,
    defaultValues: {
      cc: "",
      phoneNumber: "",
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
      aboutUsJson: "",
    },
  });

  const [imageFile, setImageFile] = useState<FileList | null>();
  const [activeUserId, setActiveUserId] = useState<string | null>();

  const uniqueUser = useUniqueUser(
    { userId: activeUserId ? Number(activeUserId) : undefined },
    !!activeUserId,
  );

  const countriesQuery = useCountries();
  const tagsQuery = useTags();
  const upload = useUploadFile();
  const updateCompanyProfile = useUpdateCompanyProfile();
  const createCompanyProfile = useCreateCompanyProfile();

  const memoizedLastTwoHundredYears = useMemo(() => {
    return getLastTwoHundredYears() || [];
  }, []);

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
    
    const existingProfile = uniqueUser.data?.data?.userProfile?.[0];
    
    const data = { ...formData, aboutUs: JSON.stringify(formData.aboutUsJson || ''), profileType: "COMPANY" };
    
    // Clean up empty strings and convert them to null for the backend
    Object.keys(data).forEach(key => {
      if (data[key] === '' || data[key] === undefined) {
        data[key] = null;
      }
    });
    
    // Handle businessTypeList specially
    if (data.businessTypeList && Array.isArray(data.businessTypeList) && data.businessTypeList.length === 0) {
      data.businessTypeList = null;
    }

    // If there's no existing profile, we need to create one first
    if (!existingProfile) {
      // Remove userProfileId since we're creating a new profile
      delete data.userProfileId;
    } else {
      data.userProfileId = existingProfile.id;
    }


    formData.uploadImage = imageFile;
    let getImageUrl;
    if (formData.uploadImage) {
      getImageUrl = await handleUploadedFile(formData.uploadImage);
    }
    if (getImageUrl) {
      data.logo = getImageUrl;
    }
    delete data.uploadImage;
    delete data.aboutUsJson;


    try {
      let response;
      
      if (!existingProfile) {
        // Create new profile
        response = await createCompanyProfile.mutateAsync(data);
      } else {
        // Update existing profile
        response = await updateCompanyProfile.mutateAsync(data);
      }
      
      
      if (response.status && response.data) {
        toast({ title: t("profile_edit_successful"), description: response.message, variant: "success", });
        form.reset();
        router.push("/company-profile-details");
      } else {
        toast({ title: t("profile_edit_failed"), description: response.message, variant: "danger", });
      }
    } catch (error) {
      toast({ title: t("profile_edit_failed"), description: "An error occurred while updating the profile", variant: "danger", });
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(document.location.search);
    const userId = params.get("userId");
    setActiveUserId(userId);
  }, []);

  useEffect(() => {
    
    if (uniqueUser.data?.data) {
      const userProfile = uniqueUser.data?.data?.userProfile?.[0];
      
      let abountUsJson = "";
      if (userProfile?.aboutUs) {
        try {
          abountUsJson = JSON.parse(userProfile?.aboutUs);
        } catch (error) { console.error(error); }
      }
      
      const formData = {
        logo: userProfile?.logo || "",
        address: userProfile?.address || "",
        city: userProfile?.city || "",
        province: userProfile?.province || "",
        country: userProfile?.country || "",
        yearOfEstablishment: userProfile?.yearOfEstablishment?.toString() || "",
        totalNoOfEmployee: userProfile?.totalNoOfEmployee?.toString() || "",
        annualPurchasingVolume: userProfile?.annualPurchasingVolume || "",
        aboutUs: userProfile?.aboutUs || "",
        aboutUsJson: abountUsJson,
        companyName: userProfile?.companyName || "",
        businessTypeList: userProfile?.userProfileBusinessType?.[0]?.businessTypeId?.toString() || undefined,
        cc: userProfile?.cc,
        phoneNumber: userProfile?.phoneNumber,
      };
      
      form.reset(formData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uniqueUser.data?.data?.userProfile?.length, memoizedTags?.length, memoizedCountries?.length, memoizedLastTwoHundredYears?.length]);
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
                {t("profile")}
              </h2>
            </div>
            <div className="flex w-full flex-wrap">
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
                      <FormItem className="mb-3.5 w-full md:w-6/12 md:pr-3.5" dir={langDir}>
                        <FormLabel translate="no">{t("upload_company_logo")}</FormLabel>
                        <FormControl>
                          <div className="relative m-auto h-64 w-full border-2 border-dashed border-border">
                            <div className="relative h-full w-full">
                              {imageFile ||
                                uniqueUser.data?.data?.userProfile?.[0]?.logo ? (
                                <Image
                                  src={
                                    imageFile
                                      ? URL.createObjectURL(imageFile[0])
                                      : uniqueUser.data?.data?.userProfile?.[0]
                                        ?.logo
                                        ? uniqueUser.data?.data
                                          ?.userProfile?.[0]?.logo
                                        : "/images/company-logo.png"
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
                                    <span translate="no">
                                      {t("drop_your_company_logo")}{" "}
                                    </span>
                                    <span className="text-primary">
                                      browse
                                    </span>
                                    <p className="text-normal mt-3 text-xs leading-4 text-muted-foreground" translate="no">
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
                                        title: t("image_size_should_be_less_than_size", { size: "500MB" }),
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
                    className={cn(
                      "mb-0 block",
                      langDir == "rtl" ? "text-right" : "text-left",
                      "text-base font-medium leading-5 text-color-dark"
                    )}
                    translate="no"
                  >
                    {t("registration_address")}
                  </label>
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

                  <ControlledSelectInput label={t("country")} name="country" options={memoizedCountries} />
                </div>

                <ControlledPhoneInput
                  name={"phoneNumber"}
                  countryName={"cc"}
                  placeholder={t("enter_phone_number")}
                />

              </div>

              <div className="mb-5 w-full">
                <div className="mb-4 w-full border-y border-solid border-border py-2.5">
                  <label
                    className={cn(
                      "mb-0 block",
                      langDir == "rtl" ? "text-right" : "text-left",
                      "text-base font-medium leading-5 text-color-dark"
                    )}
                    translate="no"
                  >
                    {t("more_information")}
                  </label>
                </div>

                <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-2">
                  <ControlledSelectInput
                    label={t("year_of_establishment")}
                    name="yearOfEstablishment"
                    options={memoizedLastTwoHundredYears?.map((item: any) => ({ label: item?.toString(), value: item?.toString(), }))}
                  />

                  <ControlledSelectInput
                    label={t("total_no_of_employees")}
                    name="totalNoOfEmployee"
                    options={NO_OF_EMPLOYEES_LIST}
                  />
                </div>

                {/* <QuillEditor label={t("about_us")} name="aboutUsJson" /> */}
                <ControlledRichTextEditor
                  label={t("about_us")}
                  name="aboutUsJson"
                />
              </div>
            </div>

            <Button
              disabled={updateCompanyProfile.isPending || upload.isPending}
              type="submit"
              className="h-12 w-full rounded bg-dark-orange text-center text-lg font-bold leading-6 text-white hover:bg-dark-orange hover:opacity-90"
              translate="no"
            >
              {
                updateCompanyProfile.isPending || upload.isPending ? (
                  <>
                    <Image src="/images/load.png" alt="loader-icon" width={20} height={20} className="mr-2 animate-spin" />
                    {t("please_wait")}
                  </>
                ) : (
                  t("edit_changes")
                )
              }
            </Button>
          </form>
        </Form>
      </div>
    </section>
  );
}
