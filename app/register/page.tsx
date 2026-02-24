"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { Checkbox } from "@/components/ui/checkbox";
import { useRegister, useSocialLogin } from "@/apis/queries/auth.queries";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/components/ui/use-toast";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EMAIL_REGEX_LOWERCASE, PUREMOON_TOKEN_KEY } from "@/utils/constants";
import { setCookie } from "cookies-next";
import PolicyContent from "@/components/shared/PolicyContent";
import TermsContent from "@/components/shared/TermsContent";
import ControlledTextInput from "@/components/shared/Forms/ControlledTextInput";
import ControlledPhoneInput from "@/components/shared/Forms/ControlledPhoneInput";
import GoogleIcon from "@/public/images/google-icon.png";
import LoaderPrimaryIcon from "@/public/images/load-primary.png";
import { useSession, signIn, signOut } from "next-auth/react";
import { getLoginType, getOrCreateDeviceId } from "@/utils/helper";
import Link from "next/link";
import LoaderWithMessage from "@/components/shared/LoaderWithMessage";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { fetchMe, fetchUserPermissions } from "@/apis/requests/user.requests";
import { useUpdateUserCartByDeviceId } from "@/apis/queries/cart.queries";

const formSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(2, {
        message: "First Name is required",
      })
      .max(50, {
        message: "First Name must be less than 50 characters",
      }),
    lastName: z
      .string()
      .trim()
      .min(2, { message: "Last Name is required" })
      .max(50, {
        message: "Last Name must be less than 50 characters",
      }),
    email: z
      .string()
      .trim()
      .min(5, { message: "Email Address is required" })
      .email({
        message: "Invalid Email Address",
      })
      .refine((val) => (EMAIL_REGEX_LOWERCASE.test(val) ? true : false), {
        message: "Email must be in lower case",
      }),
    initialPassword: z
      .string()
      .trim()
      .min(1, {
        message: "Login Password is required",
      })
      .min(8, {
        message: "Password must be longer than or equal to 8 characters",
      }),
    password: z.string().trim().min(1, {
      message: "Confirm Password is required",
    }),
    cc: z.string().trim(),
    phoneNumber: z
      .string()
      .trim()
      .min(2, {
        message: "Phone Number is required",
      })
      .min(8, {
        message: "Phone Number must be minimum of 8 digits",
      })
      .max(20, {
        message: "Phone Number cannot be more than 20 digits",
      }),

    acceptTerms: z.boolean().refine((val) => val, {
      message: "You must accept the Terms Of Use & Privacy Policy",
    }),
  })
  .superRefine(({ initialPassword, password }, ctx) => {
    if (initialPassword !== password) {
      ctx.addIssue({
        code: "custom",
        message: "Passwords do not match",
        path: ["password"],
      });
    }
  });

export default function RegisterPage() {
  const t = useTranslations();
  const { langDir, setUser, setPermissions } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { data: session } = useSession();
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const deviceId = getOrCreateDeviceId() || "";

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      initialPassword: "",
      password: "",
      phoneNumber: "",
      cc: "",
      acceptTerms: false,
    },
  });

  const handleToggleTermsModal = () => setIsTermsModalOpen(!isTermsModalOpen);
  const handleTogglePrivacyModal = () =>
    setIsPrivacyModalOpen(!isPrivacyModalOpen);

  const register = useRegister();
  const socialLogin = useSocialLogin();
  const updateCart = useUpdateUserCartByDeviceId();

  const onSubmit = async (formData: z.infer<typeof formSchema>) => {
    const loginType = session ? getLoginType() : "MANUAL";
    const response = await register.mutateAsync({
      ...formData,
      tradeRole: "BUYER",
      loginType: loginType as "MANUAL" | "GOOGLE" | "FACEBOOK",
    });

    if (response?.status && response?.otp) {
      toast({
        title: t("verification_code_sent"),
        description: t("verification_code_info"),
        variant: "success",
      });
      sessionStorage.setItem("email", formData.email.toLowerCase());
      form.reset();
      router.push("/otp-verify");
    } else if (response?.status && response?.accessToken) {
      // setCookie(PUREMOON_TOKEN_KEY, response.accessToken);
      setCookie(PUREMOON_TOKEN_KEY, response.accessToken, {
        // 7 days
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        secure: true,
        sameSite: 'strict',
        path: '/',
      });

      // Fetch user data and update AuthContext (same as login page)
      try {
        const userRes = await fetchMe();
        if (userRes?.data?.data?.id) {
          setUser({
            id: userRes.data.data.id,
            firstName: userRes.data.data.firstName || "",
            lastName: userRes.data.data.lastName || "",
            tradeRole: userRes.data.data.tradeRole || "",
          });
        }
      } catch (e) {
        // If fetchMe fails, the AuthContext useEffect will try to recover
        console.error("Failed to fetch user after registration:", e);
      }

      // Fetch permissions (optional, same as login page)
      try {
        const permissions = await fetchUserPermissions();
        setPermissions([
          ...(permissions?.data?.data?.userRoleDetail?.userRolePermission ||
            []),
        ]);
      } catch (e) {
        // Silent fail - permissions are optional
      }

      toast({
        title: t("registration_successful"),
        description: response.message,
        variant: "success",
      });
      form.reset();
      router.push("/profile?fromRegister=1");
    } else {
      toast({
        title: t("registration_failed"),
        description: response.message,
        variant: "danger",
      });
    }
  };

  const handleSocialRegister = async (userData: {
    name?: string | null | undefined;
    email?: string | null | undefined;
    image?: string | null | undefined;
  }) => {
    if (!userData?.email) {
      setIsGoogleLoading(false);
      return;
    }

    try {
      const response = await socialLogin.mutateAsync({
        firstName: userData.name?.split(" ")[0] || "User",
        lastName: userData.name?.split(" ")[1] || "",
        email: userData.email,
        tradeRole: "BUYER",
        loginType: getLoginType() || "GOOGLE",
        provider: "",
        token: "",
      });

      if (response?.status && response?.data) {
        toast({
          title: t("registration_successful"),
          description:
            t("you_have_successfully_registered") || response.message,
          variant: "success",
        });
        setCookie(PUREMOON_TOKEN_KEY, response.accessToken, {
          expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
        });

        // Update cart
        await updateCart.mutateAsync({ deviceId });

        // Fetch user data
        try {
          const userRes = await fetchMe();
          if (userRes?.data?.data?.id) {
            setUser({
              id: userRes.data.data.id,
              firstName: userRes.data.data.firstName || "",
              lastName: userRes.data.data.lastName || "",
              tradeRole: userRes.data.data.tradeRole || "",
            });
          }
        } catch (e) {
          console.error("Failed to fetch user after registration:", e);
        }

        // Fetch permissions
        try {
          const permissions = await fetchUserPermissions();
          setPermissions([
            ...(permissions?.data?.data?.userRoleDetail?.userRolePermission ||
              []),
          ]);
        } catch (e) { console.error(e); }

        localStorage.removeItem("loginType");
        setIsGoogleLoading(false);
        router.push("/profile?fromRegister=1");
      } else {
        toast({
          title: t("registration_failed"),
          description: response?.message || t("something_went_wrong"),
          variant: "danger",
        });
        setIsGoogleLoading(false);
        await signOut({
          redirect: false,
          callbackUrl: "/register",
        });
      }
    } catch (error) {
      setIsGoogleLoading(false);
      toast({
        title: t("registration_failed"),
        description: t("something_went_wrong"),
        variant: "danger",
      });
    }
  };

  useEffect(() => {
    if (session && session?.user) {
      const loginType = getLoginType();
      // Only auto-register if coming from Google OAuth
      if (loginType === "GOOGLE") {
        if (session?.user?.email && session?.user?.name) {
          handleSocialRegister(session.user);
        }
      } else {
        // Just populate form for manual registration
        form.reset({
          firstName: session?.user?.name?.split(" ")[0] || "",
          lastName: session?.user?.name?.split(" ")[1] || "",
          email: session?.user?.email || "",
        });
      }
    } else {
      // Reset loading state if no session (user cancelled or error)
      setIsGoogleLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  return (
    <>
      <title dir={langDir} translate="no">{`${t("register")} | Ultrasooq`}</title>
      <section className="relative flex min-h-screen w-full items-center justify-center bg-card px-4 py-4 sm:py-6">
        {/* Main Content */}
        <div className="relative z-10 mx-auto w-full max-w-md">
          {/* Register Card */}
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
            {/* Decorative Header */}
            <div className="from-dark-orange via-dark-orange h-1.5 bg-gradient-to-r to-warning/90"></div>

            <div className="p-6 sm:p-8">
              {/* Header Section */}
              <div className="mb-6 text-center">
                <div className="from-dark-orange mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br to-warning/90 shadow-md">
                  <svg
                    className="h-6 w-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                    />
                  </svg>
                </div>
                <h2
                  className="mb-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
                  dir={langDir}
                  translate="no"
                >
                  {t("registration")}
                </h2>
                <p
                  className="text-xs text-muted-foreground sm:text-sm"
                  dir={langDir}
                  translate="no"
                >
                  {t("create_your_account")}
                </p>
              </div>

              {/* Social Login Buttons */}
              <div className="mb-5">
                <Button
                  variant="outline"
                  className="h-10 w-full rounded-lg border-2 border-border text-xs font-semibold text-muted-foreground shadow-sm transition-all duration-200 hover:border-destructive hover:bg-destructive/5 hover:text-destructive hover:shadow-md sm:h-11 sm:text-sm"
                  onClick={() => {
                    setIsGoogleLoading(true);
                    localStorage.setItem("loginType", "GOOGLE");
                    signIn("google");
                  }}
                  disabled={socialLogin.isPending || isGoogleLoading}
                  dir={langDir}
                  translate="no"
                >
                  {(socialLogin.isPending || isGoogleLoading) &&
                  getLoginType() === "GOOGLE" ? (
                    <span className="flex items-center justify-center gap-2">
                      <Image
                        src={LoaderPrimaryIcon}
                        alt="loading"
                        width={18}
                        height={18}
                        className="animate-spin"
                      />
                      <span>{t("please_wait")}</span>
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2.5">
                      <Image
                        src={GoogleIcon}
                        alt="google"
                        height={20}
                        width={20}
                        className="object-contain sm:h-6 sm:w-6"
                      />
                      <span>{t("google_sign_up")}</span>
                    </span>
                  )}
                </Button>
              </div>

              {/* Divider */}
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-xs sm:text-sm">
                  <span
                    className="bg-card px-3 font-medium text-muted-foreground"
                    dir={langDir}
                    translate="no"
                  >
                    {t("or")}
                  </span>
                </div>
              </div>

              {/* Form Section */}
              <div className="w-full">
                <Form {...form}>
                  <form
                    className="space-y-3.5"
                    onSubmit={form.handleSubmit(onSubmit)}
                  >
                    <div className="space-y-1">
                      <ControlledTextInput
                        label={t("first_name")}
                        name="firstName"
                        placeholder={t("enter_first_name")}
                        dir={langDir}
                        translate="no"
                      />
                    </div>

                    <div className="space-y-1">
                      <ControlledTextInput
                        label={t("last_name")}
                        name="lastName"
                        placeholder={t("enter_last_name")}
                        dir={langDir}
                        translate="no"
                      />
                    </div>

                    <div className="space-y-1">
                      <ControlledTextInput
                        label={t("email")}
                        name="email"
                        placeholder={t("enter_email")}
                        disabled={
                          getLoginType() === "GOOGLE"
                            ? !!session?.user?.email
                            : false
                        }
                        dir={langDir}
                        translate="no"
                      />
                    </div>

                    <div className="space-y-1">
                      <ControlledTextInput
                        label={t("login_password")}
                        name="initialPassword"
                        placeholder="**********"
                        type="password"
                        dir={langDir}
                        translate="no"
                      />
                    </div>

                    <div className="space-y-1">
                      <ControlledTextInput
                        label={t("confirm_password")}
                        name="password"
                        placeholder="**********"
                        type="password"
                        dir={langDir}
                        translate="no"
                      />
                    </div>

                    <div className="space-y-1">
                      <ControlledPhoneInput
                        label={t("phone_number")}
                        name="phoneNumber"
                        countryName="cc"
                        placeholder={t("enter_phone_number")}
                      />
                    </div>

                    {/* Terms and Conditions */}
                    <div className="pt-1">
                      <FormField
                        control={form.control}
                        name="acceptTerms"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-y-0 space-x-3">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                className="data-[state=checked]:bg-dark-orange data-[state=checked]:border-dark-orange h-3.5 w-3.5 rounded border-border transition-all"
                              />
                            </FormControl>
                            <div className="flex flex-col leading-none">
                              <div className="text-xs text-muted-foreground sm:text-sm">
                                <span dir={langDir} translate="no">
                                  {t("i_agree")}{" "}
                                </span>
                                <Button
                                  onClick={handleToggleTermsModal}
                                  type="button"
                                  className="text-dark-orange h-auto bg-transparent p-0 text-xs font-semibold underline-offset-2 shadow-none transition-colors duration-200 hover:bg-transparent hover:text-warning hover:underline sm:text-sm"
                                  dir={langDir}
                                  translate="no"
                                >
                                  {t("terms_of_use")}
                                </Button>
                                <span className="mx-1"> & </span>
                                <Button
                                  onClick={handleTogglePrivacyModal}
                                  type="button"
                                  className="text-dark-orange h-auto bg-transparent p-0 text-xs font-semibold underline-offset-2 shadow-none transition-colors duration-200 hover:bg-transparent hover:text-warning hover:underline sm:text-sm"
                                  dir={langDir}
                                  translate="no"
                                >
                                  {t("privacy_policy")}
                                </Button>
                              </div>
                              <FormMessage />
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Register Button */}
                    <Button
                      disabled={register.isPending}
                      type="submit"
                      className="from-dark-orange hover:to-primary h-11 w-full transform rounded-lg bg-gradient-to-r to-warning/90 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:from-warning/90 hover:shadow-xl active:scale-[0.98] disabled:transform-none disabled:cursor-not-allowed disabled:opacity-70 sm:h-12 sm:text-base"
                      dir={langDir}
                      translate="no"
                    >
                      {register.isPending ? (
                        <LoaderWithMessage message={t("please_wait")} />
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          {t("agree_n_register")}
                          <svg
                            className="h-4 w-4 sm:h-5 sm:w-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 7l5 5m0 0l-5 5m5-5H6"
                            />
                          </svg>
                        </span>
                      )}
                    </Button>
                  </form>
                </Form>

                {/* Sign In Link */}
                <div className="mt-4 text-center">
                  <span
                    className="text-xs font-medium text-muted-foreground sm:text-sm"
                    dir={langDir}
                    translate="no"
                  >
                    {t("already_have_an_account")}{" "}
                    <Link
                      href="/login"
                      className="text-dark-orange font-semibold underline-offset-2 transition-colors duration-200 hover:text-warning hover:underline"
                      dir={langDir}
                    >
                      {t("sign_in")}
                    </Link>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Dialog open={isTermsModalOpen} onOpenChange={handleToggleTermsModal}>
          <DialogContent className="max-h-[93vh] max-w-[90%] gap-0 p-0 md:max-w-[90%]! lg:max-w-5xl!">
            <DialogHeader className="border-light-gray border-b py-4">
              <DialogTitle
                className="text-center text-xl font-bold"
                dir={langDir}
                translate="no"
              >
                {t("terms_of_use")}
              </DialogTitle>
            </DialogHeader>
            <DialogDescription className="term-policy-modal-content text-color-dark max-h-[82vh] overflow-y-scroll p-4 text-sm leading-7 font-normal">
              <TermsContent />
            </DialogDescription>
          </DialogContent>
        </Dialog>

        <Dialog
          open={isPrivacyModalOpen}
          onOpenChange={handleTogglePrivacyModal}
        >
          <DialogContent className="max-h-[93vh] max-w-[90%] gap-0 p-0 md:max-w-[90%]! lg:max-w-5xl!">
            <DialogHeader className="border-light-gray border-b py-4">
              <DialogTitle
                className="text-center text-xl font-bold"
                dir={langDir}
                translate="no"
              >
                {t("privacy_policy")}
              </DialogTitle>
            </DialogHeader>
            <DialogDescription className="term-policy-modal-content text-color-dark max-h-[82vh] overflow-y-scroll p-4 text-sm leading-7 font-normal">
              <PolicyContent />
            </DialogDescription>
          </DialogContent>
        </Dialog>
      </section>
    </>
  );
}
