"use client";
import {
  useMe,
  useUniqueUser,
  useUpdateProfile,
  useUserBusinessCategories,
} from "@/apis/queries/user.queries";
import { useCurrentAccount, useMyAccounts } from "@/apis/queries/auth.queries";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import {
  GENDER_LIST,
  ULTRASOOQ_TOKEN_KEY,
  SOCIAL_MEDIA_ICON,
  SOCIAL_MEDIA_LIST,
} from "@/utils/constants";
import { useToast } from "@/components/ui/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { UsersIcon, ArrowRightIcon } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { getCookie } from "cookies-next";
import { useUploadFile } from "@/apis/queries/upload.queries";
import validator from "validator";
import ControlledTextInput from "@/components/shared/Forms/ControlledTextInput";
import ControlledDatePicker from "@/components/shared/Forms/ControlledDatePicker";
import ControlledSelectInput from "@/components/shared/Forms/ControlledSelectInput";
import ControlledPhoneInput from "@/components/shared/Forms/ControlledPhoneInput";
import AddImageContent from "@/components/modules/profile/AddImageContent";
import ClostIcon from "@/public/images/close-white.svg";
import BackgroundImage from "@/public/images/before-login-bg.png";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import AccordionMultiSelectV2 from "@/components/shared/AccordionMultiSelectV2";
import { CreateSubAccountDialog } from "@/components/modules/accounts/CreateSubAccountDialog";

const formSchema = (t: any) => {
  return z.object({
    uploadImage: z.any().optional(),
    uploadIdentityFrontImage: z.any().optional(),
    uploadIdentityBackImage: z.any().optional(),
    profilePicture: z.string().trim().optional(),
    identityProof: z.string().trim().optional(),
    identityProofBack: z.string().trim().optional(),
    firstName: z
      .string()
      .trim()
      .min(2, { message: t("first_name_required") })
      .max(50, { message: t("first_name_must_be_50_chars_only") })
      .regex(/^[A-Za-z\s]+$/, {
        message: t("first_name_must_only_contain_letters"),
      }),
    lastName: z
      .string()
      .trim()
      .min(2, { message: t("last_name_requierd") })
      .max(50, { message: t("last_name_must_be_50_chars_only") })
      .regex(/^[A-Za-z\s]+$/, {
        message: t("last_name_must_only_contain_letters"),
      }),
    gender: z
      .string()
      .trim()
      .min(2, { message: t("gender_required") }),
    userName: z
      .string({ error: t("username_required") })
      .trim()
      .min(5, { message: t("username_required") }),
    email: z
      .string()
      .trim()
      .min(5, { message: t("email_is_required") })
      .email({
        message: t("invalid_email_address"),
      })
      .transform((val) => val.toLowerCase()),
    phoneNumberList: z.array(
      z.object({
        cc: z.string().trim(),
        phoneNumber: z
          .string()
          .trim()
          .min(2, {
            message: t("phone_number_required"),
          })
          .min(8, {
            message: t("phone_number_must_be_min_8_digits"),
          })
          .max(20, {
            message: t("phone_number_cant_be_more_than_20_digits"),
          }),
      }),
    ),
    socialLinkList: z.array(
      z.object({
        linkType: z.string().trim(),
        link: z.string().trim(),
      }),
    ),
    dateOfBirth: z.date({ error: t("dob_required") }),
    userBusinessCategoryList: z.any().optional(),
  });
};

export default function ProfilePage() {
  const t = useTranslations();
  const { langDir, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const currentAccount = useCurrentAccount();
  const frontIdentityRef = useRef<HTMLInputElement>(null);
  const backIdentityRef = useRef<HTMLInputElement>(null);
  const form = useForm({
    resolver: zodResolver(formSchema(t)),
    defaultValues: {
      uploadImage: undefined,
      uploadIdentityFrontImage: undefined,
      uploadIdentityBackImage: undefined,
      profilePicture: "",
      identityProof: "",
      identityProofBack: "",
      firstName: "",
      lastName: "",
      gender: "",
      email: "",
      userName: "",
      phoneNumberList: [
        {
          cc: "",
          phoneNumber: "",
        },
      ],
      dateOfBirth: undefined as unknown as Date,
      socialLinkList: [
        {
          linkType: "",
          link: "",
        },
      ],
      userBusinessCategoryList: [],
    },
  });
  const accessToken = getCookie(ULTRASOOQ_TOKEN_KEY);
  const [imageFile, setImageFile] = useState<FileList | null>();
  const [identityFrontImageFile, setIdentityFrontImageFile] =
    useState<FileList | null>();
  const [identityBackImageFile, setIdentityBackImageFile] =
    useState<FileList | null>();
  const [isUsernameManuallyEdited, setIsUsernameManuallyEdited] =
    useState(false);
  const me = useMe(!!accessToken);
  const uniqueUser = useUniqueUser(
    { userId: user?.id ? Number(user.id) : undefined },
    !!user?.id,
  );
  const businessCategoriesQuery = useUserBusinessCategories();
  const upload = useUploadFile();
  const updateProfile = useUpdateProfile();
  const { data: accountsData, refetch: refetchAccounts } = useMyAccounts();

  // Check if user has additional accounts (sub-accounts, excluding main account)
  const allAccounts = accountsData?.data?.allAccounts || [];
  const mainAccount = accountsData?.data?.mainAccount;
  const subAccounts = allAccounts.filter(
    (account: any) => account.id !== mainAccount?.id,
  );
  const hasAdditionalAccounts = subAccounts.length > 0;
  const [showSubAccountDialog, setShowSubAccountDialog] = useState(false);
  const fromRegister = searchParams?.get("fromRegister") === "1";

  useEffect(() => {
    if (uniqueUser?.data?.data) {
      form.setValue(
        "userBusinessCategoryList",
        uniqueUser?.data?.data?.userBusinesCategoryDetail?.map(
          (category: any) => {
            return {
              label: category.categoryDetail?.name,
              value: category.categoryId,
            };
          },
        ) || [],
      );
    }
  }, [uniqueUser?.data?.data]);

  const memoizedBusinessCategories = useMemo(() => {
    return (
      businessCategoriesQuery?.data?.data?.map((item: any) => {
        return { label: item.name, value: item.id };
      }) || []
    );
  }, [businessCategoriesQuery?.data?.data]);

  const fieldArrayForPhoneNumber = useFieldArray({
    control: form.control,
    name: "phoneNumberList",
  });

  const fieldArrayForSocialMedia = useFieldArray({
    control: form.control,
    name: "socialLinkList",
  });

  const appendPhoneNumber = () =>
    fieldArrayForPhoneNumber.append({
      cc: "",
      phoneNumber: "",
    });

  const appendSocialLinks = () =>
    fieldArrayForSocialMedia.append({
      linkType: "",
      link: "",
    });

  const removePhoneNumber = (index: number) =>
    fieldArrayForPhoneNumber.remove(index);

  const removeSocialLinks = (index: number) =>
    fieldArrayForSocialMedia.remove(index);

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
    formData.userBusinessCategoryList =
      formData.userBusinessCategoryList?.map((item: any) => {
        return { categoryId: item.value, categoryLocation: "" };
      }) || [];
    const data = {
      ...formData,
      phoneNumber: formData.phoneNumberList[0].phoneNumber,
      dateOfBirth: formData.dateOfBirth.toISOString(),
    };

    formData.uploadImage = imageFile;
    formData.uploadIdentityFrontImage = identityFrontImageFile;
    formData.uploadIdentityBackImage = identityBackImageFile;

    let getImageUrl;
    let getIdentityImageUrl;
    let getIdentityBackImageUrl;

    if (formData.uploadImage) {
      getImageUrl = await handleUploadedFile(formData.uploadImage);
    }
    if (
      formData.uploadIdentityFrontImage &&
      typeof formData.uploadIdentityFrontImage === "object"
    ) {
      getIdentityImageUrl = await handleUploadedFile(
        formData.uploadIdentityFrontImage,
      );
    }
    if (
      formData.uploadIdentityBackImage &&
      typeof formData.uploadIdentityBackImage === "object"
    ) {
      getIdentityBackImageUrl = await handleUploadedFile(
        formData.uploadIdentityBackImage,
      );
    }

    //TODO: identity image upload
    delete data.uploadImage;
    delete data.uploadIdentityFrontImage;
    delete data.uploadIdentityBackImage;
    if (getImageUrl) {
      data.profilePicture = getImageUrl;
    }
    if (getIdentityImageUrl) {
      data.identityProof = getIdentityImageUrl;
    }
    if (getIdentityBackImageUrl) {
      data.identityProofBack = getIdentityBackImageUrl;
    }

    data.socialLinkList = data.socialLinkList.filter(
      (link: any) => link.link.trim() !== "" && link.linkType.trim() !== "",
    );

    if (
      data.socialLinkList.length &&
      data.socialLinkList.some((link: any) => !validator.isURL(link.link))
    ) {
      form.setError("socialLinkList", {
        type: "custom",
        message: "Invalid URL",
      });
      return;
    }
    const response = await updateProfile.mutateAsync(data);
    if (response.status && response.data) {
      toast({
        title: t("profile_updated"),
        description: t("profile_update_info"),
        variant: "success",
      });
      form.reset();
      const tradeRole = response.data?.tradeRole;
      if (tradeRole === "BUYER") {
        router.push("/home");
      } else if (tradeRole === "COMPANY") {
        if (me.data?.data?.userBranch.length) {
          router.push("/company-profile-details");
        } else {
          router.push("/company-profile");
        }
      } else if (tradeRole === "FREELANCER") {
        if (me.data?.data?.userBranch.length) {
          router.push("/freelancer-profile-details");
        } else {
          router.push("/freelancer-profile");
        }
      } else if (tradeRole == "MEMBER") {
        router.push("/member-profile-details");
      }
    } else {
      toast({
        title: t("profile_update_failed"),
        description: response.message,
        variant: "danger",
      });
    }
  };

  const watchSocialMedia = form.watch("socialLinkList");
  const watchFirstName = form.watch("firstName");
  const watchUserName = form.watch("userName");
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Auto-generate username from firstName + numbers
  useEffect(() => {
    // Auto-generate when firstName changes (for both new and existing profiles)
    if (watchFirstName && !isUsernameManuallyEdited) {
      // Convert firstName to lowercase and remove spaces/special characters
      const cleanFirstName = watchFirstName
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]/g, "");

      if (cleanFirstName.length >= 2) {
        // Generate random 4-digit number
        const randomNumbers = Math.floor(1000 + Math.random() * 9000);
        const generatedUsername = `${cleanFirstName}${randomNumbers}`;

        // Only update if username is empty or matches the previous auto-generated pattern (firstname + 4 digits)
        const currentUsername = watchUserName || "";
        const autoGeneratedPattern = new RegExp(`^${cleanFirstName}\\d{4}$`);
        if (!currentUsername || autoGeneratedPattern.test(currentUsername)) {
          form.setValue("userName", generatedUsername, {
            shouldValidate: false,
          });
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchFirstName]);

  // Track if username is manually edited
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      if (name === "userName" && type === "change" && value.userName) {
        // Check if the username doesn't match the auto-generated pattern
        const currentFirstName =
          form
            .getValues("firstName")
            ?.toLowerCase()
            .trim()
            .replace(/[^a-z0-9]/g, "") || "";
        const usernamePattern = new RegExp(`^${currentFirstName}\\d{4}$`);
        if (!usernamePattern.test(value.userName)) {
          setIsUsernameManuallyEdited(true);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  useEffect(() => {
    if (me.data) {
      const {
        profilePicture,
        identityProof,
        identityProofBack,
        firstName,
        lastName,
        gender,
        email,
        cc,
        phoneNumber,
        dateOfBirth,
        userPhone,
        userSocialLink,
        userName,
      } = me.data?.data;

      const phoneNumberList = userPhone.length
        ? userPhone.map((item: any) => ({
            cc: item?.cc,
            phoneNumber: item?.phoneNumber,
          }))
        : [
            {
              cc: cc || "",
              phoneNumber: phoneNumber || "",
            },
          ];

      const socialLinkList = userSocialLink.length
        ? userSocialLink.map((item: any) => ({
            linkType: item?.linkType,
            link: item?.link,
          }))
        : [
            {
              linkType: "",
              link: "",
            },
          ];

      form.reset({
        profilePicture: profilePicture || "",
        identityProof: identityProof || "",
        identityProofBack: identityProofBack || "",
        firstName,
        lastName,
        gender,
        email,
        userName,
        phoneNumberList: phoneNumberList,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        socialLinkList: socialLinkList,
        userBusinessCategoryList: form.getValues("userBusinessCategoryList"),
      });
      setIdentityFrontImageFile(identityProof || "");
      setIdentityBackImageFile(identityProofBack || "");
      // Reset manual edit flag when loading existing data
      setIsUsernameManuallyEdited(!!userName);
      setIsDataLoaded(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me.data]);

  // Account type selection is now handled in the registration steps flow.
  // The sub-account dialog can still be opened manually from the profile page.
  // No longer auto-open after registration.

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
          <div className="m-auto mb-12 w-11/12 rounded-lg border border-solid border-border bg-card p-6 shadow-xs sm:p-8 md:w-9/12 lg:w-7/12 lg:p-12">
            <div className="text-normal text-light-gray m-auto mb-7 w-full text-center text-sm leading-6">
              <h2
                className="text-color-dark mb-3 text-center text-3xl leading-8 font-semibold sm:text-4xl sm:leading-10"
                dir={langDir}
                translate="no"
              >
                {t("profile")}
              </h2>
              <p dir={langDir} translate="no">
                {t("update_profile")}
              </p>
            </div>

            <div className="w-full">
              <Form {...form}>
                <form
                  className="flex flex-wrap"
                  onSubmit={form.handleSubmit(onSubmit)}
                >
                  <FormField
                    control={form.control}
                    name="uploadImage"
                    render={({ field }) => (
                      <FormItem className="mb-4 w-full">
                        <FormControl>
                          <div className="relative m-auto h-44 w-44 rounded-full border-2 border-dashed border-border">
                            <div className="relative h-full w-full">
                              {imageFile || me.data?.data?.profilePicture ? (
                                <>
                                  <Image
                                    src={
                                      imageFile
                                        ? URL.createObjectURL(imageFile[0])
                                        : me.data?.data?.profilePicture
                                          ? me.data?.data?.profilePicture
                                          : "/images/company-logo.png"
                                    }
                                    alt="profile"
                                    fill
                                    className="rounded-full object-contain"
                                    priority
                                  />
                                  <div className="absolute right-4 bottom-3 rounded-full bg-card p-1 shadow-md">
                                    <Image
                                      src="/images/camera.png"
                                      width={29}
                                      height={29}
                                      alt="camera"
                                      className=""
                                    />
                                  </div>
                                </>
                              ) : (
                                <div className="text-color-dark absolute my-auto h-full w-full text-center text-sm leading-4 font-medium">
                                  <div className="flex h-full flex-col items-center justify-center">
                                    <Image
                                      src="/images/camera.png"
                                      className="mb-3"
                                      width={29}
                                      height={29}
                                      alt="camera"
                                    />
                                    <span dir={langDir} translate="no">
                                      {t("upload_image")}
                                    </span>
                                  </div>
                                </div>
                              )}

                              <Input
                                type="file"
                                accept="image/*"
                                multiple={false}
                                className="bottom-0! h-44 w-full! opacity-0"
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

                  <ControlledTextInput
                    label={t("first_name")}
                    name="firstName"
                    placeholder={t("enter_first_name")}
                    dir={langDir}
                    translate="no"
                  />

                  <ControlledTextInput
                    label={t("last_name")}
                    name="lastName"
                    placeholder={t("enter_last_name")}
                    dir={langDir}
                    translate="no"
                  />

                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem
                        className="mt-3 mb-5 flex w-full flex-col items-start"
                        dir={langDir}
                      >
                        <FormLabel
                          className="mr-6 mb-3 capitalize"
                          translate="no"
                        >
                          {t("gender")}
                        </FormLabel>
                        <FormControl>
                          <RadioGroup
                            className="mt-0! flex items-center gap-4"
                            onValueChange={field.onChange}
                            defaultValue="MALE"
                            value={field.value}
                          >
                            {GENDER_LIST.map((type) => (
                              <FormItem
                                key={type.value}
                                className="flex items-center space-y-0 space-x-3"
                              >
                                <FormControl>
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem
                                      value={type.value}
                                      id={type.value}
                                    />
                                    <FormLabel htmlFor={type.value}>
                                      {t(type.label)}
                                    </FormLabel>
                                  </div>
                                </FormControl>
                              </FormItem>
                            ))}
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <ControlledDatePicker label={t("dob")} name="dateOfBirth" />

                  <ControlledTextInput
                    label={t("username")}
                    name="userName"
                    placeholder={t("enter_username")}
                    dir={langDir}
                    translate="no"
                  />
                  <ControlledTextInput
                    label={t("email")}
                    name="email"
                    placeholder={t("enter_email")}
                    dir={langDir}
                    translate="no"
                    disabled
                  />
                  <ControlledTextInput
                    label={t("new_password")}
                    name="newPassword"
                    placeholder="**********"
                    type="password"
                    dir={langDir}
                    translate="no"
                  />

                  <div className="w-full">
                    <div
                      className="flex w-full items-center justify-between"
                      dir={langDir}
                    >
                      <label
                        className={cn(
                          "text-color-dark block text-left text-sm leading-4 font-medium capitalize",
                          form.formState.errors.phoneNumberList
                            ? "text-destructive!"
                            : "",
                        )}
                        translate="no"
                      >
                        {t("phone_number")}
                      </label>

                      <Button
                        type="button"
                        onClick={appendPhoneNumber}
                        className="text-dark-orange flex cursor-pointer items-center bg-transparent p-0 text-sm font-semibold capitalize shadow-none hover:bg-transparent"
                        translate="no"
                      >
                        <Image
                          src="/images/add-icon.svg"
                          className="mr-1"
                          width={14}
                          height={14}
                          alt="add-icon"
                        />
                        <span>{t("add_phone_number")}</span>
                      </Button>
                    </div>
                  </div>

                  {fieldArrayForPhoneNumber.fields.map((field, index) => (
                    <div key={field.id} className="relative w-full">
                      <ControlledPhoneInput
                        name={`phoneNumberList.${index}.phoneNumber`}
                        countryName={`phoneNumberList.${index}.cc`}
                        placeholder="Enter Your Phone Number"
                      />

                      {index !== 0 ? (
                        <Button
                          type="button"
                          onClick={() => removePhoneNumber(index)}
                          className="text-dark-orange absolute top-9 right-2 flex -translate-y-2/4 cursor-pointer items-center bg-transparent p-0 text-sm font-semibold capitalize shadow-none hover:bg-transparent"
                        >
                          <Image
                            src="/images/social-delete-icon.svg"
                            height={32}
                            width={32}
                            alt="social-delete-icon"
                          />
                        </Button>
                      ) : null}
                    </div>
                  ))}

                  <div className="mb-1 w-full">
                    <div
                      className="flex w-full items-center justify-between"
                      dir={langDir}
                    >
                      <label
                        className="text-color-dark block text-left text-sm leading-4 font-medium capitalize"
                        translate="no"
                      >
                        {t("social_links")}
                      </label>

                      <Button
                        type="button"
                        onClick={appendSocialLinks}
                        className="text-dark-orange flex cursor-pointer items-center bg-transparent p-0 text-sm font-semibold capitalize shadow-none hover:bg-transparent"
                        translate="no"
                      >
                        <Image
                          src="/images/add-icon.svg"
                          className="mr-1"
                          width={14}
                          height={14}
                          alt="add-icon"
                        />
                        <span>{t("add_link")}</span>
                      </Button>
                    </div>
                  </div>

                  {fieldArrayForSocialMedia.fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="relative mb-3.5 h-auto min-h-[65px] w-full rounded border border-solid border-border p-3.5"
                    >
                      <Accordion type="single" collapsible>
                        <AccordionItem
                          value="item-1"
                          className="mt-2 border-b-0"
                          dir={langDir}
                        >
                          <AccordionTrigger className="flex justify-between py-0 hover:no-underline!">
                            <div className="text-color-dark mb-2 flex items-center text-sm leading-4 font-normal">
                              {watchSocialMedia[index]?.linkType !== "" ? (
                                <Image
                                  src={
                                    SOCIAL_MEDIA_ICON[
                                      watchSocialMedia[index]?.linkType
                                    ]
                                  }
                                  className="mr-1.5"
                                  width={20}
                                  height={20}
                                  alt="social-facebook-icon"
                                />
                              ) : (
                                <span className="capitalize" translate="no">
                                  {t("select_type")}
                                </span>
                              )}
                              <div className="wrap relative flex break-all">
                                <p
                                  className="flex max-w-[240px] min-w-auto items-center truncate overflow-hidden pr-1 pl-1 text-left"
                                  title={watchSocialMedia[index]?.link}
                                >
                                  {watchSocialMedia[index]?.link}
                                </p>
                                {watchSocialMedia[index]?.link !== "" ? (
                                  <a
                                    href={watchSocialMedia[index]?.link}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-2 py-0"
                                  >
                                    <Image
                                      src="/images/share.png"
                                      height={20}
                                      width={20}
                                      alt="share-icon"
                                    />
                                  </a>
                                ) : null}
                              </div>
                            </div>
                          </AccordionTrigger>

                          <AccordionContent className="pb-0">
                            <ControlledSelectInput
                              label={t("type")}
                              name={`socialLinkList.${index}.linkType`}
                              options={SOCIAL_MEDIA_LIST}
                            />

                            <ControlledTextInput
                              label={t("link")}
                              name={`socialLinkList.${index}.link`}
                              placeholder={t("enter_your_link")}
                              dir={langDir}
                              translate="no"
                            />
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                      <Button
                        type="button"
                        onClick={() => removeSocialLinks(index)}
                        className={`absolute ${langDir == "rtl" ? "ml-2" : "right-11"} text-dark-orange top-3.5 flex cursor-pointer items-center bg-transparent p-0 text-sm font-semibold capitalize shadow-none hover:bg-transparent`}
                      >
                        <Image
                          src="/images/social-delete-icon.svg"
                          height={35}
                          width={35}
                          alt="social-delete-icon"
                        />
                      </Button>
                    </div>
                  ))}

                  {/* Show identity proof upload only for COMPANY/FREELANCER subaccounts */}
                  {/* Show for COMPANY/FREELANCER accounts - subaccount check via multiple methods */}
                  {(me.data?.data?.tradeRole === "COMPANY" ||
                    me.data?.data?.tradeRole === "FREELANCER") &&
                  ((me.data?.data as any)?.isSubAccount === true ||
                    (me.data?.data as any)?.masterAccountId != null ||
                    (currentAccount?.data?.data as any)?.isSubAccount === true ||
                    (currentAccount?.data?.data?.account as any)?.isSubAccount ===
                      true ||
                    (currentAccount?.data?.data?.account &&
                      currentAccount.data.data.account.id !==
                        me.data?.data?.id) ||
                    // Fallback: if currentAccount is not available, show for all COMPANY/FREELANCER
                    !currentAccount?.data?.data) ? (
                    <FormField
                      control={form.control}
                      name="uploadIdentityFrontImage"
                      render={({ field }) => (
                        <FormItem className="mb-3.5 w-full">
                          <FormLabel
                            className="block"
                            dir={langDir}
                            translate="no"
                          >
                            {t("upload_identity_proof")}
                          </FormLabel>
                          <div className="upload-identity-proof-both-side">
                            <div className="upload-identity-proof-both-side-col">
                              <FormLabel
                                className="block"
                                dir={langDir}
                                translate="no"
                              >
                                {t("front")}
                              </FormLabel>
                              <FormControl>
                                <div className="upload-identity-proof-box relative w-full border-2 border-dashed border-border">
                                  <div className="relative h-full w-full">
                                    {identityFrontImageFile ? (
                                      <button
                                        type="button"
                                        className="common-close-btn-uploader-s1"
                                        onClick={() => {
                                          setIdentityFrontImageFile(null);
                                          form.setValue(
                                            "uploadIdentityFrontImage",
                                            undefined,
                                          );
                                          form.setValue("identityProof", "");
                                          if (frontIdentityRef.current)
                                            frontIdentityRef.current.value = "";
                                          // TODO: remove from S3
                                        }}
                                      >
                                        <Image
                                          src={ClostIcon}
                                          alt="close-icon"
                                        />
                                      </button>
                                    ) : null}
                                    {identityFrontImageFile ? (
                                      <Image
                                        src={
                                          identityFrontImageFile &&
                                          typeof identityFrontImageFile ===
                                            "object"
                                            ? URL.createObjectURL(
                                                identityFrontImageFile[0],
                                              )
                                            : me.data?.data?.identityProof
                                              ? me.data?.data?.identityProof
                                              : "/images/company-logo.png"
                                        }
                                        alt="profile"
                                        fill
                                        priority
                                        className="object-contain"
                                      />
                                    ) : (
                                      <AddImageContent
                                        description={t(
                                          "drop_your_identity_proof",
                                        )}
                                      />
                                    )}

                                    <Input
                                      type="file"
                                      accept="image/*"
                                      multiple={false}
                                      className="bottom-0! h-48 w-full! opacity-0"
                                      {...field}
                                      onChange={(event) => {
                                        if (event.target.files?.[0]) {
                                          if (
                                            event.target.files[0].size >
                                            524288000
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

                                          setIdentityFrontImageFile(
                                            event.target.files,
                                          );
                                        }
                                      }}
                                      id="uploadIdentityImage"
                                      ref={frontIdentityRef}
                                    />
                                  </div>
                                </div>
                              </FormControl>
                            </div>
                            <div className="upload-identity-proof-both-side-col">
                              <FormLabel
                                className="block"
                                dir={langDir}
                                translate="no"
                              >
                                {t("back")}
                              </FormLabel>
                              <FormControl>
                                <div className="upload-identity-proof-box relative w-full border-2 border-dashed border-border">
                                  <div className="relative h-full w-full">
                                    {identityBackImageFile ? (
                                      <button
                                        type="button"
                                        className="common-close-btn-uploader-s1"
                                        onClick={() => {
                                          setIdentityBackImageFile(null);
                                          form.setValue(
                                            "uploadIdentityBackImage",
                                            undefined,
                                          );
                                          form.setValue(
                                            "identityProofBack",
                                            "",
                                          );
                                          if (backIdentityRef.current)
                                            backIdentityRef.current.value = "";
                                          // TODO: remove from S3
                                        }}
                                      >
                                        <Image
                                          src={ClostIcon}
                                          alt="close-icon"
                                        />
                                      </button>
                                    ) : null}
                                    {identityBackImageFile ? (
                                      <Image
                                        src={
                                          identityBackImageFile &&
                                          typeof identityBackImageFile ===
                                            "object"
                                            ? URL.createObjectURL(
                                                identityBackImageFile[0],
                                              )
                                            : me.data?.data?.identityProofBack
                                              ? me.data?.data?.identityProofBack
                                              : "/images/company-logo.png"
                                        }
                                        alt="profile"
                                        fill
                                        priority
                                        className="object-contain"
                                      />
                                    ) : (
                                      <AddImageContent
                                        description={t(
                                          "drop_your_identity_proof",
                                        )}
                                      />
                                    )}

                                    <Input
                                      type="file"
                                      accept="image/*"
                                      multiple={false}
                                      className="bottom-0! h-48 w-full! opacity-0"
                                      {...field}
                                      onChange={(event) => {
                                        if (event.target.files?.[0]) {
                                          if (
                                            event.target.files[0].size >
                                            524288000
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

                                          setIdentityBackImageFile(
                                            event.target.files,
                                          );
                                        }
                                      }}
                                      id="uploadIdentityBackImage"
                                      ref={backIdentityRef}
                                    />
                                  </div>
                                </div>
                              </FormControl>
                            </div>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ) : null}

                  <p className="mb-3 text-[13px] text-destructive" dir={langDir}>
                    {form.formState.errors.socialLinkList?.message}
                  </p>

                  <AccordionMultiSelectV2
                    label={t("category")}
                    name="userBusinessCategoryList"
                    options={memoizedBusinessCategories || []}
                    placeholder={t("category")}
                    error={
                      form.formState.errors["userBusinessCategoryList"]
                        ?.message as string
                    }
                  />

                  <Button
                    disabled={updateProfile.isPending || upload.isPending}
                    type="submit"
                    className="theme-primary-btn bg-dark-orange h-12 w-full rounded text-center text-lg leading-6 font-bold"
                    dir={langDir}
                    translate="no"
                  >
                    {updateProfile.isPending || upload.isPending ? (
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
                      t("update_profile")
                    )}
                  </Button>
                </form>
              </Form>
            </div>
          </div>
        </div>
      </div>

      <CreateSubAccountDialog
        open={showSubAccountDialog}
        onOpenChange={setShowSubAccountDialog}
        onAccountCreated={() => {
          refetchAccounts();
        }}
      />
    </section>
  );
}
