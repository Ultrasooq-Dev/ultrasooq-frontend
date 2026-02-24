"use client";
import { useLogin, useSocialLogin } from "@/apis/queries/auth.queries";
import { useUpdateUserCartByDeviceId } from "@/apis/queries/cart.queries";
import { usePageSettingBySlug } from "@/apis/queries/page-settings.queries";
import { fetchUserPermissions } from "@/apis/requests/user.requests";
import ControlledTextInput from "@/components/shared/Forms/ControlledTextInput";
import LoaderWithMessage from "@/components/shared/LoaderWithMessage";
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
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import GoogleIcon from "@/public/images/google-icon.png";
import LoaderPrimaryIcon from "@/public/images/load-primary.png";
import { LANGUAGES, ULTRASOOQ_TOKEN_KEY } from "@/utils/constants";
import { getLoginType, getOrCreateDeviceId } from "@/utils/helper";
import { zodResolver } from "@hookform/resolvers/zod";
import { setCookie } from "cookies-next";
import { signIn, signOut, useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CheckedState } from "@radix-ui/react-checkbox";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

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
  const { langDir, applyTranslation, selectedLocale } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { data: session } = useSession();
  const { setUser, setPermissions } = useAuth();
  const [rememberMe, setRememberMe] = useState<CheckedState>(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);

  const currentLang =
    LANGUAGES.find((l) => l.locale === selectedLocale) || LANGUAGES[0];

  // Fetch login page branding settings from admin CMS
  const { data: loginSettingsData } = usePageSettingBySlug("login");
  const s = loginSettingsData?.data?.setting || {};

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

  // Close language dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        langDropdownRef.current &&
        !langDropdownRef.current.contains(e.target as Node)
      ) {
        setLangDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const onSubmit = async (values: typeof defaultValues) => {
    const response: any = await login.mutateAsync(values);

    if (response?.status && response?.accessToken) {
      if (rememberMe) {
        setCookie(ULTRASOOQ_TOKEN_KEY, response.accessToken, {
          expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        });
      } else {
        setCookie(ULTRASOOQ_TOKEN_KEY, response.accessToken, {
          expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        });
      }

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
        provider: "",
        token: "",
      });
      if (response?.status && response?.data) {
        toast({
          title: t("login_successful"),
          description: t("you_have_successfully_logged_in"),
          variant: "success",
        });
        setCookie(ULTRASOOQ_TOKEN_KEY, response.accessToken, {
          expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        });

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
      setIsGoogleLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  return (
    <>
      <title dir={langDir} translate="no">{`${t("login")} | Ultrasooq`}</title>
      <section
        className="relative flex min-h-screen w-full bg-card"
        dir={langDir}
      >
        {/* ======================= LEFT PANEL - Company Branding (Desktop Only) ======================= */}
        <div className="relative hidden overflow-hidden lg:flex lg:w-[48%] xl:w-[50%]">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-warning via-warning to-amber-500" />

          {/* Decorative pattern overlay */}
          <div className="absolute inset-0 opacity-10">
            <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern
                  id="grid-pattern"
                  width="40"
                  height="40"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 40 0 L 0 0 0 40"
                    fill="none"
                    stroke="white"
                    strokeWidth="0.5"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid-pattern)" />
            </svg>
          </div>

          {/* Decorative circles */}
          <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-card/10 blur-xl" />
          <div className="absolute -right-16 bottom-10 h-80 w-80 rounded-full bg-card/5 blur-2xl" />
          <div className="absolute top-1/2 left-1/4 h-40 w-40 rounded-full bg-card/5 blur-lg" />

          {/* Content */}
          <div className="relative z-10 flex w-full flex-col justify-between p-10 xl:p-14">
            {/* Logo & Brand */}
            <div>
              <Link
                href="/home"
                className="group inline-flex items-center gap-3"
              >
                <Image
                  src="/images/logo-v2.png"
                  alt="Ultrasooq"
                  width={48}
                  height={48}
                  className="rounded-xl shadow-lg transition-transform group-hover:scale-105"
                />
                <span className="text-2xl font-bold tracking-tight text-white xl:text-3xl">
                  Ultrasooq
                </span>
              </Link>
            </div>

            {/* Value Propositions */}
            <div className="flex flex-1 flex-col justify-center py-10">
              <h1 className="mb-4 text-3xl leading-tight font-bold text-white xl:text-4xl">
                {s.headline || "Your Global B2B"}
                <br />
                <span className="text-warning-foreground">
                  {s.headline_line2 || "Marketplace"}
                </span>
              </h1>
              <p className="mb-10 max-w-md text-base leading-relaxed text-warning-foreground xl:text-lg">
                {s.subtitle ||
                  "Connect with verified suppliers and buyers worldwide. Trade smarter, grow faster."}
              </p>

              {/* Feature Points */}
              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-card/20 backdrop-blur-sm">
                    <svg
                      className="h-5 w-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white xl:text-base">
                      {s.feature_1_title || "Global Trade Network"}
                    </h3>
                    <p className="mt-0.5 text-xs text-warning-foreground/80 xl:text-sm">
                      {s.feature_1_description ||
                        "Access thousands of verified suppliers across 190+ countries"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-card/20 backdrop-blur-sm">
                    <svg
                      className="h-5 w-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white xl:text-base">
                      {s.feature_2_title || "Secure Transactions"}
                    </h3>
                    <p className="mt-0.5 text-xs text-warning-foreground/80 xl:text-sm">
                      {s.feature_2_description ||
                        "Trade with confidence using our verified payment protection"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-card/20 backdrop-blur-sm">
                    <svg
                      className="h-5 w-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white xl:text-base">
                      {s.feature_3_title || "Grow Your Business"}
                    </h3>
                    <p className="mt-0.5 text-xs text-warning-foreground/80 xl:text-sm">
                      {s.feature_3_description ||
                        "Expand your reach with powerful sourcing and selling tools"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Stats */}
            <div className="flex items-center gap-6 xl:gap-8">
              <div>
                <div className="text-2xl font-bold text-white xl:text-3xl">
                  {s.stat_1_value || "10K+"}
                </div>
                <div className="text-xs text-warning-foreground/70 xl:text-sm">
                  {s.stat_1_label || "Active Suppliers"}
                </div>
              </div>
              <div className="h-10 w-px bg-card/20" />
              <div>
                <div className="text-2xl font-bold text-white xl:text-3xl">
                  {s.stat_2_value || "190+"}
                </div>
                <div className="text-xs text-warning-foreground/70 xl:text-sm">
                  {s.stat_2_label || "Countries"}
                </div>
              </div>
              <div className="h-10 w-px bg-card/20" />
              <div>
                <div className="text-2xl font-bold text-white xl:text-3xl">
                  {s.stat_3_value || "50K+"}
                </div>
                <div className="text-xs text-warning-foreground/70 xl:text-sm">
                  {s.stat_3_label || "Products"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ======================= RIGHT PANEL - Login Form ======================= */}
        <div className="flex min-h-screen flex-1 flex-col">
          {/* Top Bar with Language Selector */}
          <div className="flex items-center justify-between px-4 py-4 sm:px-8">
            {/* Mobile Logo */}
            <Link
              href="/home"
              className="inline-flex items-center gap-2 lg:hidden"
            >
              <Image
                src="/images/logo-v2.png"
                alt="Ultrasooq"
                width={36}
                height={36}
                className="rounded-lg"
              />
              <span className="text-lg font-bold text-foreground">Ultrasooq</span>
            </Link>
            <div className="hidden lg:block" />

            {/* Language Selector */}
            <div className="relative" ref={langDropdownRef}>
              <button
                type="button"
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
              >
                <span className="text-base">{currentLang.flag}</span>
                <span className="hidden sm:inline">{currentLang.name}</span>
                <svg
                  className={`h-4 w-4 text-muted-foreground transition-transform ${langDropdownOpen ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {langDropdownOpen && (
                <div className="absolute right-0 z-50 mt-2 max-h-72 w-56 overflow-y-auto rounded-xl border border-border bg-card shadow-xl">
                  <div className="py-1">
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang.locale}
                        type="button"
                        onClick={() => {
                          applyTranslation(lang.locale);
                          setLangDropdownOpen(false);
                        }}
                        className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-warning/5 ${
                          lang.locale === selectedLocale
                            ? "bg-warning/5 font-semibold text-warning"
                            : "text-muted-foreground"
                        }`}
                      >
                        <span className="text-lg">{lang.flag}</span>
                        <span>{lang.name}</span>
                        {lang.locale === selectedLocale && (
                          <svg
                            className="ml-auto h-4 w-4 text-warning"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Login Form Centered */}
          <div className="flex flex-1 items-center justify-center px-4 pb-8 sm:px-8">
            <div className="w-full max-w-md">
              {/* Header Section */}
              <div className="mb-6 text-center">
                <h2
                  className="mb-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
                  dir={langDir}
                  translate="no"
                >
                  {t("login")}
                </h2>
                <p
                  className="text-sm text-muted-foreground"
                  dir={langDir}
                  translate="no"
                >
                  {t("login_to_your_account")}
                </p>
              </div>

              {/* Form Card */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
                {/* Form Section */}
                <Form {...form}>
                  <form
                    className="space-y-4"
                    onSubmit={form.handleSubmit(onSubmit)}
                  >
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem className="flex w-full flex-col gap-y-1">
                          <FormLabel dir={langDir}>
                            {t("email_phone_id")}
                          </FormLabel>
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

                    <ControlledTextInput
                      label={t("password")}
                      name="password"
                      placeholder="**********"
                      type="password"
                      dir={langDir}
                      translate="no"
                    />

                    {/* Remember Me & Forgot Password */}
                    <div className="flex items-center justify-between pt-0.5">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="remember"
                          className="data-[state=checked]:bg-dark-orange data-[state=checked]:border-dark-orange h-3.5 w-3.5 rounded border-border transition-all"
                          onCheckedChange={(val) => setRememberMe(val)}
                        />
                        <label
                          htmlFor="remember"
                          className="cursor-pointer text-xs font-medium text-muted-foreground transition-colors select-none hover:text-foreground sm:text-sm"
                          dir={langDir}
                          translate="no"
                        >
                          {t("remember_me")}
                        </label>
                      </div>
                      <Link
                        className="text-dark-orange text-xs font-semibold underline-offset-2 transition-colors duration-200 hover:text-warning hover:underline sm:text-sm"
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
                      className="from-dark-orange hover:to-primary h-11 w-full transform rounded-lg bg-gradient-to-r to-warning/90 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:from-warning/90 hover:shadow-xl active:scale-[0.98] disabled:transform-none disabled:cursor-not-allowed disabled:opacity-70 sm:h-12 sm:text-base"
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

                {/* Social Login Buttons */}
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
                      <span>{t("google_sign_in")}</span>
                    </span>
                  )}
                </Button>

                {/* Sign Up Link */}
                <div className="mt-5 text-center">
                  <span
                    className="text-xs font-medium text-muted-foreground sm:text-sm"
                    dir={langDir}
                    translate="no"
                  >
                    {t("dont_have_an_account")}{" "}
                    <Link
                      href="/register"
                      className="text-dark-orange font-semibold underline-offset-2 transition-colors duration-200 hover:text-warning hover:underline"
                      dir={langDir}
                    >
                      {t("signup")}
                    </Link>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
