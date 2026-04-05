 "use client";

import React, { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";

import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/use-toast";
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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { TRADE_ROLE_LIST } from "@/utils/constants";
import { useCreateAccount, useSwitchAccount } from "@/apis/queries/auth.queries";
import { useUpdateProfile } from "@/apis/queries/user.queries";
import { useUploadFile } from "@/apis/queries/upload.queries";
import AddImageContent from "@/components/modules/profile/AddImageContent";
import ClostIcon from "@/public/images/close-white.svg";

const createAccountSchemaFn = (t: any) => {
  return z.object({
    // Basic account info
    accountName: z
      .string()
      .trim()
      .min(2, { message: t("account_name_is_required") })
      .refine(
        (val) => {
          const trimmed = val.trim().toLowerCase();
          return (
            trimmed !== "undefined" &&
            trimmed !== "undefined account" &&
            trimmed !== "null"
          );
        },
        {
          message: t("enter_valid_account_name"),
        },
      ),
    tradeRole: z.enum(["COMPANY", "FREELANCER"], {
      error: t("select_trade_role"),
    }),

    // Company-specific fields (only for COMPANY role)
    companyName: z.string().optional(),
    companyAddress: z.string().optional(),
    companyPhone: z.string().optional(),
    companyWebsite: z.string().optional(),
    companyTaxId: z.string().optional(),

    // Identity card uploads (mandatory for COMPANY and FREELANCER)
    uploadIdentityFrontImage: z
      .any()
      .refine((files) => files && files.length > 0, {
        message: t("identity_card_front_required"),
      }),
    uploadIdentityBackImage: z
      .any()
      .refine((files) => files && files.length > 0, {
        message: t("identity_card_back_required"),
      }),
  });
};

type CreateSubAccountDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccountCreated?: () => void;
};

export const CreateSubAccountDialog: React.FC<CreateSubAccountDialogProps> = ({
  open,
  onOpenChange,
  onAccountCreated,
}) => {
  const t = useTranslations();
  const { langDir } = useAuth();
  const { toast } = useToast();

  const createAccount = useCreateAccount();
  const switchAccount = useSwitchAccount();
  const upload = useUploadFile();
  const updateProfile = useUpdateProfile();

  const [isCreatingAccount, setIsCreatingAccount] = useState(false);

  // Identity card upload state
  const [identityFrontImageFile, setIdentityFrontImageFile] =
    useState<FileList | null>(null);
  const [identityBackImageFile, setIdentityBackImageFile] =
    useState<FileList | null>(null);
  const frontIdentityRef = useRef<HTMLInputElement>(null);
  const backIdentityRef = useRef<HTMLInputElement>(null);

  const form = useForm<any>({
    resolver: zodResolver(createAccountSchemaFn(t)),
    defaultValues: {
      accountName: "",
      tradeRole: "FREELANCER",
      companyName: "",
      companyAddress: "",
      companyPhone: "",
      companyWebsite: "",
      companyTaxId: "",
      uploadIdentityFrontImage: undefined,
      uploadIdentityBackImage: undefined,
    },
  });

  const handleUploadedFile = async (files: FileList | null) => {
    if (files && files.length > 0) {
      const formData = new FormData();
      formData.append("content", files[0]);
      const response = await upload.mutateAsync(formData);
      if (response.status && response.data) {
        return response.data;
      }
    }
    return null;
  };

  const handleCreateAccount = async (
    formData: any,
  ) => {
    setIsCreatingAccount(true);
    try {
      // Upload identity card images first
      const identityProof = await handleUploadedFile(identityFrontImageFile);
      const identityProofBack = await handleUploadedFile(identityBackImageFile);

      if (!identityProof || !identityProofBack) {
        setIsCreatingAccount(false);
        toast({
          title: "Upload Failed",
          description:
            "Please upload both front and back sides of your identity card",
          variant: "danger",
        });
        return;
      }

      // Send simplified sub-account data (personal info inherited from Master Account)
      const cleanedData = {
        accountName: formData.accountName?.trim() || "New Account",
        tradeRole: formData.tradeRole as "COMPANY" | "FREELANCER",
        identityProof,
        identityProofBack,
        // Only include company fields if they have values
        ...(formData.companyName?.trim() && {
          companyName: formData.companyName.trim(),
        }),
        ...(formData.companyAddress?.trim() && {
          companyAddress: formData.companyAddress.trim(),
        }),
        ...(formData.companyPhone?.trim() && {
          companyPhone: formData.companyPhone.trim(),
        }),
        ...(formData.companyWebsite?.trim() && {
          companyWebsite: formData.companyWebsite.trim(),
        }),
        ...(formData.companyTaxId?.trim() && {
          companyTaxId: formData.companyTaxId.trim(),
        }),
      };

      const result = await createAccount.mutateAsync(cleanedData);

      if (result?.status) {
        // After account creation, update the profile with identity cards
        // The backend createAccount might not save identity cards, so we update the profile separately
        try {
          const createdAccount = result?.data;
          const createdAccountId = createdAccount?.id;

          if (createdAccountId) {
            // Switch to the newly created account to update its profile
            await switchAccount.mutateAsync({
              userAccountId: createdAccountId,
            });

            // Wait for the account switch to complete and backend to process
            await new Promise((resolve) => setTimeout(resolve, 1000));

            // Update the profile with identity cards for the newly created sub-account
            await updateProfile.mutateAsync({
              identityProof,
              identityProofBack,
            } as any);
          } else {
            // Fallback: try updating current account profile
            await updateProfile.mutateAsync({
              identityProof,
              identityProofBack,
            } as any);
          }
        } catch (profileError: any) {
          // Log error but don't fail the account creation
          console.error(
            "Failed to update profile with identity cards:",
            profileError,
          );
          toast({
            title: "Account Created",
            description:
              "Account created successfully. However, identity card update failed. Please update your profile manually from the profile page.",
            variant: "warning" as any,
          });
        }

        toast({
          title: "Account Created",
          description:
            result.message ||
            "Successfully created new account with identity cards",
          variant: "success",
        });
        setIsCreatingAccount(false);
        form.reset();
        setIdentityFrontImageFile(null);
        setIdentityBackImageFile(null);
        if (frontIdentityRef.current) frontIdentityRef.current.value = "";
        if (backIdentityRef.current) backIdentityRef.current.value = "";
        onOpenChange(false);

        if (onAccountCreated) {
          // Slight delay to allow backend transaction to commit
          setTimeout(() => {
            onAccountCreated();
          }, 500);
        }
      } else {
        setIsCreatingAccount(false);
        throw new Error(result?.message || "Account creation failed");
      }
    } catch (error: any) {
      setIsCreatingAccount(false);
      let errorMessage = "Failed to create account";

      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      // Special handling for freelancer accounts
      if (
        formData.tradeRole === "FREELANCER" &&
        errorMessage.toLowerCase().includes("already have") &&
        errorMessage.toLowerCase().includes("freelancer")
      ) {
        errorMessage =
          "The backend currently restricts multiple freelancer accounts. This appears to be a business rule limitation.";
      }

      toast({
        title: "Account Creation Failed",
        description: errorMessage,
        variant: "danger",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-md flex-col">
        <DialogHeader className="shrink-0 border-b border-border pb-4">
          <DialogTitle
            dir={langDir}
            className="text-dark-cyan text-xl font-semibold"
          >
            {t("create_new_account_title")}
          </DialogTitle>
          <DialogDescription
            dir={langDir}
            className="text-light-gray text-sm"
          >
            {t("create_new_account_description")}
          </DialogDescription>
        </DialogHeader>

        <div className="relative flex-1 overflow-y-auto pr-2">
          {(isCreatingAccount ||
            createAccount.isPending ||
            updateProfile.isPending) && (
            <div className="absolute inset-0 z-50 flex items-center justify-center rounded-lg bg-card/80 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-3">
                <svg
                  className="h-8 w-8 animate-spin text-primary"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <p className="text-sm font-medium text-muted-foreground">
                  {isCreatingAccount
                    ? t("creating_your_account")
                    : t("processing")}
                </p>
                <p className="text-xs text-muted-foreground">{t("please_wait")}</p>
              </div>
            </div>
          )}
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleCreateAccount)}
              className="space-y-4 pt-4"
            >
              <FormField
                control={form.control}
                name="accountName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-dark-cyan text-sm font-medium">
                      {t("account_name")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("enter_account_name")}
                        {...field}
                        className="focus:border-dark-orange focus:ring-dark-orange border-border"
                        dir={langDir}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tradeRole"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-dark-cyan text-sm font-medium">
                      {t("trade_role")}
                    </FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="flex flex-col space-y-2"
                      >
                        {TRADE_ROLE_LIST.filter(
                          (role) => role.value !== "BUYER",
                        ).map((role) => (
                          <FormItem
                            key={role.value}
                            className="flex items-center space-y-0 space-x-3 rounded-lg border border-border p-2 hover:bg-muted"
                          >
                            <FormControl>
                              <RadioGroupItem
                                value={role.value}
                                className="border-dark-cyan"
                              />
                            </FormControl>
                            <FormLabel className="text-dark-cyan cursor-pointer text-sm font-normal">
                              {role.label}
                            </FormLabel>
                          </FormItem>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Personal information is inherited from Master Account */}
              <div className="space-y-3 border-t border-border pt-4">
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                  <div className="flex items-start space-x-2">
                    <div className="shrink-0">
                      <svg
                        className="mt-0.5 h-5 w-5 text-primary"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div className="text-sm text-primary">
                      <p className="font-medium">
                        {t("personal_information_inherited")}
                      </p>
                      <p className="text-primary">
                        {t("personal_information_inherited_description")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Identity Card Upload - Mandatory for COMPANY and FREELANCER */}
              <div className="space-y-3 border-t border-border pt-4">
                <h4 className="text-dark-cyan text-sm font-medium">
                  {t("identity_card")} <span className="text-destructive">*</span>
                </h4>
                <p className="text-xs text-muted-foreground">
                  {t("identity_card_description")}
                </p>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Front Side */}
                  <FormField
                    control={form.control}
                    name="uploadIdentityFrontImage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-dark-cyan text-xs font-medium">
                          {t("front_side")}{" "}
                          <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <div className="relative w-full overflow-hidden rounded-lg border-2 border-dashed border-border">
                            <div className="relative h-48 w-full">
                              {identityFrontImageFile ? (
                                <>
                                  <button
                                    type="button"
                                    className="absolute top-2 right-2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-destructive transition-colors hover:bg-destructive"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setIdentityFrontImageFile(null);
                                      form.setValue(
                                        "uploadIdentityFrontImage",
                                        undefined,
                                      );
                                      if (frontIdentityRef.current)
                                        frontIdentityRef.current.value = "";
                                    }}
                                  >
                                    <Image
                                      src={ClostIcon}
                                      alt="close-icon"
                                      width={16}
                                      height={16}
                                    />
                                  </button>
                                  <Image
                                    src={
                                      identityFrontImageFile &&
                                      typeof identityFrontImageFile === "object"
                                        ? URL.createObjectURL(
                                            identityFrontImageFile[0],
                                          )
                                        : "/images/company-logo.png"
                                    }
                                    alt="Identity front"
                                    fill
                                    className="z-0 object-contain"
                                  />
                                </>
                              ) : (
                                <div className="absolute inset-0 z-0">
                                  <AddImageContent
                                    description={t("drop_identity_card_front")}
                                  />
                                </div>
                              )}
                              <input
                                type="file"
                                accept="image/*"
                                multiple={false}
                                className="absolute bottom-0 z-10 h-48 w-full cursor-pointer opacity-0"
                                onChange={(event) => {
                                  if (event.target.files?.[0]) {
                                    if (
                                      event.target.files[0].size > 5242880
                                    ) {
                                      toast({
                                        title: "File too large",
                                        description:
                                          "Image size should be less than 5MB",
                                        variant: "danger",
                                      });
                                      return;
                                    }
                                    setIdentityFrontImageFile(
                                      event.target.files,
                                    );
                                    form.setValue(
                                      "uploadIdentityFrontImage",
                                      event.target.files,
                                    );
                                  }
                                }}
                                id="uploadIdentityFrontImage"
                                ref={frontIdentityRef}
                              />
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Back Side */}
                  <FormField
                    control={form.control}
                    name="uploadIdentityBackImage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-dark-cyan text-xs font-medium">
                          {t("back_side")}{" "}
                          <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <div className="relative w-full overflow-hidden rounded-lg border-2 border-dashed border-border">
                            <div className="relative h-48 w-full">
                              {identityBackImageFile ? (
                                <>
                                  <button
                                    type="button"
                                    className="absolute top-2 right-2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-destructive transition-colors hover:bg-destructive"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setIdentityBackImageFile(null);
                                      form.setValue(
                                        "uploadIdentityBackImage",
                                        undefined,
                                      );
                                      if (backIdentityRef.current)
                                        backIdentityRef.current.value = "";
                                    }}
                                  >
                                    <Image
                                      src={ClostIcon}
                                      alt="close-icon"
                                      width={16}
                                      height={16}
                                    />
                                  </button>
                                  <Image
                                    src={
                                      identityBackImageFile &&
                                      typeof identityBackImageFile === "object"
                                        ? URL.createObjectURL(
                                            identityBackImageFile[0],
                                          )
                                        : "/images/company-logo.png"
                                    }
                                    alt="Identity back"
                                    fill
                                    className="z-0 object-contain"
                                  />
                                </>
                              ) : (
                                <div className="absolute inset-0 z-0">
                                  <AddImageContent
                                    description={t("drop_identity_card_back")}
                                  />
                                </div>
                              )}
                              <input
                                type="file"
                                accept="image/*"
                                multiple={false}
                                className="absolute bottom-0 z-10 h-48 w-full cursor-pointer opacity-0"
                                onChange={(event) => {
                                  if (event.target.files?.[0]) {
                                    if (
                                      event.target.files[0].size > 5242880
                                    ) {
                                      toast({
                                        title: "File too large",
                                        description:
                                          "Image size should be less than 5MB",
                                        variant: "danger",
                                      });
                                      return;
                                    }
                                    setIdentityBackImageFile(
                                      event.target.files,
                                    );
                                    form.setValue(
                                      "uploadIdentityBackImage",
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Company-specific fields - show only when COMPANY is selected */}
              {form.watch("tradeRole") === "COMPANY" && (
                <div className="space-y-3 border-t border-border pt-4">
                  <h4 className="text-dark-cyan text-sm font-medium">
                    {t("company_details")}
                  </h4>

                  <div className="grid grid-cols-1 gap-3">
                    <FormField
                      control={form.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-dark-cyan text-xs font-medium">
                            {t("company_name")}
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t("enter_company_name")}
                              {...field}
                              className="focus:border-dark-orange focus:ring-dark-orange border-border text-sm"
                              dir={langDir}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="companyAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-dark-cyan text-xs font-medium">
                            {t("company_address")}
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t("enter_company_address")}
                              {...field}
                              className="focus:border-dark-orange focus:ring-dark-orange border-border text-sm"
                              dir={langDir}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="companyPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-dark-cyan text-xs font-medium">
                            {t("company_phone")}
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t("enter_company_phone")}
                              {...field}
                              className="focus:border-dark-orange focus:ring-dark-orange border-border text-sm"
                              dir={langDir}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="companyWebsite"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-dark-cyan text-xs font-medium">
                            {t("company_website")}
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t("enter_company_website")}
                              {...field}
                              className="focus:border-dark-orange focus:ring-dark-orange border-border text-sm"
                              dir={langDir}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="companyTaxId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-dark-cyan text-xs font-medium">
                            {t("company_tax_id")}
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t("enter_company_tax_id")}
                              {...field}
                              className="focus:border-dark-orange focus:ring-dark-orange border-border text-sm"
                              dir={langDir}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Status Information */}
              <div className="space-y-3 border-t border-border pt-4">
                <div className="rounded-lg border border-warning/20 bg-warning/5 p-3">
                  <div className="flex items-start space-x-2">
                    <div className="shrink-0">
                      <svg
                        className="mt-0.5 h-5 w-5 text-warning"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                        />
                      </svg>
                    </div>
                    <div className="text-sm text-warning">
                      <p className="font-medium">{t("account_status")}</p>
                      <p className="text-warning">
                        {t("account_status_description")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </Form>
        </div>

        <div className="flex shrink-0 justify-end space-x-2 border-t border-border pt-4">
          <Button
            variant="outline"
            onClick={() => {
              form.reset();
              setIdentityFrontImageFile(null);
              setIdentityBackImageFile(null);
              if (frontIdentityRef.current) frontIdentityRef.current.value = "";
              if (backIdentityRef.current) backIdentityRef.current.value = "";
              onOpenChange(false);
            }}
          >
            {t("cancel")}
          </Button>
          <Button
            onClick={form.handleSubmit(handleCreateAccount)}
            disabled={
              isCreatingAccount ||
              createAccount.isPending ||
              updateProfile.isPending
            }
            className="bg-primary hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isCreatingAccount ||
            createAccount.isPending ||
            updateProfile.isPending ? (
              <>
                <svg
                  className="mr-2 -ml-1 h-4 w-4 animate-spin text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                {isCreatingAccount ? t("creating_account") : t("processing")}
              </>
            ) : (
              t("create_account")
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

