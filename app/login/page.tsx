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
import { Input } from "@/components/ui/input";
import _ from "lodash";
import { useLogin, useSocialLogin } from "@/apis/queries/auth.queries";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/components/ui/use-toast";
import { PUREMOON_TOKEN_KEY } from "@/utils/constants";
import { setCookie } from "cookies-next";
import Image from "next/image";
import { Checkbox } from "@/components/ui/checkbox";
import ControlledTextInput from "@/components/shared/Forms/ControlledTextInput";
import { useUpdateUserCartByDeviceId } from "@/apis/queries/cart.queries";
import { getLoginType, getOrCreateDeviceId } from "@/utils/helper";
import GoogleIcon from "@/public/images/google-icon.png";
import LoaderPrimaryIcon from "@/public/images/load-primary.png";
import { useSession, signIn, signOut } from "next-auth/react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { CheckedState } from "@radix-ui/react-checkbox";
import LoaderWithMessage from "@/components/shared/LoaderWithMessage";
import { fetchUserPermissions } from "@/apis/requests/user.requests";
import { useTranslations } from "next-intl";

const formSchema = (t: any) => {
  return z.object({
    email: z
      .string()
      .trim()
      .min(5, { message: t("email_is_required") })
      .email({
        message: t("invalid_email_address"),
      })
      .transform((val) => val.toLowerCase()),
    password: z
      .string()
      .trim()
      .min(2, {
        message: t("password_is_required"),
      })
      .min(8, {
        message: t("password_characters_limit_n", { n: 8 }),
      }),
  });
};

export default function LoginPage() {
  const t = useTranslations();
  const { langDir } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { data: session } = useSession();
  const { setUser, setPermissions } = useAuth();
  const [rememberMe, setRememberMe] = useState<CheckedState>(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const defaultValues = {
    email: "",
    password: "",
  };
  const form = useForm({
    resolver: zodResolver(formSchema(t)),
    defaultValues: defaultValues,
  });
  const deviceId = getOrCreateDeviceId() || "";

  const socialLogin = useSocialLogin();
  const login = useLogin();
  const updateCart = useUpdateUserCartByDeviceId();

  const onSubmit = async (values: typeof defaultValues) => {
    const response: any = await login.mutateAsync(values);

    if (response?.status && response?.accessToken) {
      // store in cookie
      // setCookie(PUREMOON_TOKEN_KEY, response.accessToken);
      if (rememberMe) {
        setCookie(PUREMOON_TOKEN_KEY, response.accessToken, {
          // 7 days
          expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });
      } else {
        setCookie(PUREMOON_TOKEN_KEY, response.accessToken, {
          // 1 days
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });
      }

      // TODO: delete cart for trade role freelancer and company if logged in using device id
      // update cart
      await updateCart.mutateAsync({ deviceId });
      setUser({
        id: response.data?.id,
        firstName: response?.data?.firstName,
        lastName: response?.data?.lastName,
        tradeRole: response?.data?.tradeRole,
      });

      try {
        const permissions = await fetchUserPermissions();
        setPermissions([
          ...(permissions?.data?.data?.userRoleDetail?.userRolePermission ||
            []),
        ]);
      } catch (e) {}

      toast({
        title: t("login_successful"),
        description: t("you_have_successfully_logged_in"),
        variant: "success",
      });
      form.reset();
      router.push("/home");
      return;
    }

    if (response?.status && response?.data?.status === "INACTIVE") {
      toast({
        title: t("login_in_progress"),
        description: response.message,
        variant: "success",
      });
      sessionStorage.setItem("email", values.email.toLowerCase());
      form.reset();
      router.push("/otp-verify");
      return;
    }

    toast({
      title: t("login_failed"),
      description: response.message,
      variant: "danger",
    });
  };

  const handleSocialLogin = async (userData: {
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
      });
      if (response?.status && response?.data) {
        toast({
          title: t("login_successful"),
          description: t("you_have_successfully_logged_in"),
          variant: "success",
        });
        setCookie(PUREMOON_TOKEN_KEY, response.accessToken);

        // TODO: delete cart for trade role freelancer and company if logged in using device id
        // update cart
        await updateCart.mutateAsync({ deviceId });
        form.reset();
        localStorage.removeItem("loginType");
        setIsGoogleLoading(false);
        router.push("/home");
      } else {
        toast({
          title: t("login_failed"),
          description: response?.message,
          variant: "danger",
        });
        setIsGoogleLoading(false);
        const data = await signOut({
          redirect: false,
          callbackUrl: "/login",
        });

        router.push(data.url);
      }
    } catch (error) {
      setIsGoogleLoading(false);
      toast({
        title: t("login_failed"),
        description: t("something_went_wrong"),
        variant: "danger",
      });
    }
  };

  useEffect(() => {
    if (session && session?.user) {
      if (session?.user?.email && session?.user?.name) {
        handleSocialLogin(session.user);
      }
    } else {
      // Reset loading state if no session (user cancelled or error)
      setIsGoogleLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  return (
    <>
      <title dir={langDir} translate="no">{`${t("login")} | Ultrasooq`}</title>
      <section className="relative flex min-h-screen w-full items-center justify-center bg-white px-4 py-4 sm:py-6">
        {/* Main Content */}
        <div className="relative z-10 mx-auto w-full max-w-md">
          {/* Login Card */}
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
            {/* Decorative Header */}
            <div className="from-dark-orange via-dark-orange h-1.5 bg-gradient-to-r to-orange-600"></div>

            <div className="p-6 sm:p-8">
              {/* Header Section */}
              <div className="mb-6 text-center">
                <div className="from-dark-orange mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br to-orange-600 shadow-md">
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
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <h2
                  className="mb-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl"
                  dir={langDir}
                  translate="no"
                >
                  {t("login")}
                </h2>
                <p
                  className="text-xs text-gray-600 sm:text-sm"
                  dir={langDir}
                  translate="no"
                >
                  {t("login_to_your_account")}
                </p>
              </div>

              {/* Form Section */}
              <div className="w-full">
                <Form {...form}>
                  <form
                    className="space-y-3.5"
                    onSubmit={form.handleSubmit(onSubmit)}
                  >
                    <div className="space-y-1">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem className="mt-2 flex w-full flex-col gap-y-1">
                            <FormLabel dir={langDir}>{t("email_phone_id")}</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                className="theme-form-control-s1"
                                placeholder={t("enter_email_phone_id")}
                                dir={langDir}
                                onChange={(e) => {
                                  field.onChange(e.target.value.toLowerCase());
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-1">
                      <ControlledTextInput
                        label={t("password")}
                        name="password"
                        placeholder="**********"
                        type="password"
                        dir={langDir}
                        translate="no"
                      />
                    </div>

                    {/* Remember Me & Forgot Password */}
                    <div className="flex items-center justify-between pt-0.5">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="remember"
                          className="data-[state=checked]:bg-dark-orange data-[state=checked]:border-dark-orange h-3.5 w-3.5 rounded border-gray-300 transition-all"
                          onCheckedChange={(val) => setRememberMe(val)}
                        />
                        <label
                          htmlFor="remember"
                          className="cursor-pointer text-xs font-medium text-gray-700 transition-colors select-none hover:text-gray-900 sm:text-sm"
                          dir={langDir}
                          translate="no"
                        >
                          {t("remember_me")}
                        </label>
                      </div>
                      <Link
                        className="text-dark-orange text-xs font-semibold underline-offset-2 transition-colors duration-200 hover:text-orange-700 hover:underline sm:text-sm"
                        href="/forget-password"
                        dir={langDir}
                        translate="no"
                      >
                        {t("forgot_password")}
                      </Link>
                    </div>

                    {/* Login Button */}
                    <Button
                      disabled={login.isPending}
                      type="submit"
                      className="from-dark-orange hover:to-dark-orange h-11 w-full transform rounded-lg bg-gradient-to-r to-orange-600 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:from-orange-700 hover:shadow-xl active:scale-[0.98] disabled:transform-none disabled:cursor-not-allowed disabled:opacity-70 sm:h-12 sm:text-base"
                      dir={langDir}
                      translate="no"
                    >
                      {login.isPending ? (
                        <LoaderWithMessage message={t("please_wait")} />
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          {t("login")}
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

                {/* Sign Up Link */}
                <div className="mt-4 text-center">
                  <span
                    className="text-xs font-medium text-gray-600 sm:text-sm"
                    dir={langDir}
                    translate="no"
                  >
                    {t("dont_have_an_account")}{" "}
                    <Link
                      href="/register"
                      className="text-dark-orange font-semibold underline-offset-2 transition-colors duration-200 hover:text-orange-700 hover:underline"
                      dir={langDir}
                    >
                      {t("signup")}
                    </Link>
                  </span>
                </div>
              </div>

              {/* Divider */}
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-xs sm:text-sm">
                  <span
                    className="bg-white px-3 font-medium text-gray-500"
                    dir={langDir}
                    translate="no"
                  >
                    {t("or")}
                  </span>
                </div>
              </div>

              {/* Social Login Buttons */}
              <div className="space-y-2.5">
                <Button
                  variant="outline"
                  className="h-10 w-full rounded-lg border-2 border-gray-200 text-xs font-semibold text-gray-700 shadow-sm transition-all duration-200 hover:border-red-500 hover:bg-red-50 hover:text-red-700 hover:shadow-md sm:h-11 sm:text-sm"
                  onClick={() => {
                    setIsGoogleLoading(true);
                    localStorage.setItem("loginType", "GOOGLE");
                    signIn("google");
                  }}
                  disabled={socialLogin.isPending || isGoogleLoading}
                  dir={langDir}
                  translate="no"
                >
                  {(socialLogin.isPending || isGoogleLoading) && getLoginType() === "GOOGLE" ? (
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
                      <span>{t("google_sign_in")}</span>
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
