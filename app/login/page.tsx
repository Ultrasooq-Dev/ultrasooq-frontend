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
import { LANGUAGES, ULTRASOOQ_TOKEN_KEY, ULTRASOOQ_REFRESH_TOKEN_KEY } from "@/utils/constants";
import { getLoginType, getOrCreateDeviceId } from "@/utils/helper";
import { zodResolver } from "@hookform/resolvers/zod";
import { setCookie } from "cookies-next";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Globe,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
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
      // Cookie expiry aligned with backend refresh token (7 days max)
      setCookie(ULTRASOOQ_TOKEN_KEY, response.accessToken, {
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      });
      if (response.refreshToken) {
        setCookie(ULTRASOOQ_REFRESH_TOKEN_KEY, response.refreshToken, {
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
        if (response.refreshToken) {
          setCookie(ULTRASOOQ_REFRESH_TOKEN_KEY, response.refreshToken, {
            expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          });
        }

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
        <div className="bg-primary relative hidden overflow-hidden lg:flex lg:w-[48%] xl:w-[50%]">
          {/* Decorative gradient blobs */}
          <div className="bg-primary-foreground/15 absolute -top-32 -start-32 h-96 w-96 rounded-full blur-3xl" />
          <div className="bg-primary-foreground/10 absolute -end-32 bottom-0 h-[28rem] w-[28rem] rounded-full blur-3xl" />

          {/* Subtle dot pattern */}
          <div
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage:
                "radial-gradient(circle, currentColor 1px, transparent 1px)",
              backgroundSize: "28px 28px",
              color: "var(--primary-foreground)",
            }}
          />

          {/* Content */}
          <div className="relative z-10 flex w-full flex-col justify-between p-10 xl:p-14">
            {/* Logo & Brand */}
            <div>
              <Link
                href="/home"
                className="group inline-flex items-center gap-3"
              >
                <div className="bg-primary-foreground/15 border-primary-foreground/20 flex h-12 w-12 items-center justify-center rounded-xl border p-2 backdrop-blur-sm transition-transform group-hover:scale-105">
                  <Image
                    src="/images/logoicon.png"
                    alt="Ultrasooq"
                    width={36}
                    height={36}
                    className="h-full w-full object-contain"
                  />
                </div>
                <span className="text-primary-foreground text-2xl font-bold tracking-tight xl:text-3xl">
                  Ultrasooq
                </span>
              </Link>
            </div>

            {/* Value Propositions */}
            <div className="flex flex-1 flex-col justify-center py-10">
              <h1 className="text-primary-foreground mb-5 text-3xl leading-[1.1] font-bold xl:text-5xl">
                {s.headline || t("your_global_b2b")}
                <br />
                <span className="text-primary-foreground/90">
                  {s.headline_line2 || t("marketplace_word")}
                </span>
              </h1>
              <p className="text-primary-foreground/80 mb-10 max-w-md text-base leading-relaxed xl:text-lg">
                {s.subtitle || t("connect_with_verified_suppliers")}
              </p>

              {/* Feature Points */}
              <div className="space-y-5">
                {[
                  {
                    Icon: Globe,
                    title: s.feature_1_title || t("global_trade_network"),
                    desc:
                      s.feature_1_description ||
                      t("global_trade_network_description"),
                  },
                  {
                    Icon: ShieldCheck,
                    title: s.feature_2_title || t("secure_transactions"),
                    desc:
                      s.feature_2_description ||
                      t("secure_transactions_description"),
                  },
                  {
                    Icon: TrendingUp,
                    title: s.feature_3_title || t("grow_your_business"),
                    desc:
                      s.feature_3_description ||
                      t("grow_your_business_description"),
                  },
                ].map(({ Icon, title, desc }) => (
                  <div key={title} className="flex items-start gap-4">
                    <div className="bg-primary-foreground/15 border-primary-foreground/20 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border backdrop-blur-sm">
                      <Icon className="text-primary-foreground h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-primary-foreground text-sm font-semibold xl:text-base">
                        {title}
                      </h3>
                      <p className="text-primary-foreground/75 mt-0.5 text-xs xl:text-sm">
                        {desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Stats */}
            <div className="border-primary-foreground/15 bg-primary-foreground/10 flex items-center gap-6 rounded-2xl border p-5 backdrop-blur-sm xl:gap-8">
              <div>
                <div className="text-primary-foreground text-2xl font-bold xl:text-3xl">
                  {s.stat_1_value || "10K+"}
                </div>
                <div className="text-primary-foreground/70 text-xs xl:text-sm">
                  {s.stat_1_label || t("active_suppliers")}
                </div>
              </div>
              <div className="bg-primary-foreground/20 h-10 w-px" />
              <div>
                <div className="text-primary-foreground text-2xl font-bold xl:text-3xl">
                  {s.stat_2_value || "190+"}
                </div>
                <div className="text-primary-foreground/70 text-xs xl:text-sm">
                  {s.stat_2_label || t("countries")}
                </div>
              </div>
              <div className="bg-primary-foreground/20 h-10 w-px" />
              <div>
                <div className="text-primary-foreground text-2xl font-bold xl:text-3xl">
                  {s.stat_3_value || "50K+"}
                </div>
                <div className="text-primary-foreground/70 text-xs xl:text-sm">
                  {s.stat_3_label || t("products")}
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
                className="border-border bg-card text-muted-foreground hover:bg-muted flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors"
              >
                <span className="text-base">{currentLang.flag}</span>
                <span className="hidden sm:inline">{currentLang.name}</span>
                <ChevronDown
                  className={`text-muted-foreground h-4 w-4 transition-transform ${langDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {langDropdownOpen && (
                <div className="border-border bg-card absolute end-0 z-50 mt-2 max-h-72 w-56 overflow-y-auto rounded-xl border shadow-xl">
                  <div className="py-1">
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang.locale}
                        type="button"
                        onClick={() => {
                          applyTranslation(lang.locale);
                          setLangDropdownOpen(false);
                        }}
                        className={`hover:bg-primary/5 flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                          lang.locale === selectedLocale
                            ? "bg-primary/5 text-primary font-semibold"
                            : "text-muted-foreground"
                        }`}
                      >
                        <span className="text-lg">{lang.flag}</span>
                        <span>{lang.name}</span>
                        {lang.locale === selectedLocale && (
                          <Check className="text-primary ms-auto h-4 w-4" />
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
                      placeholder="••••••••"
                      type="password"
                      dir={langDir}
                      translate="no"
                    />

                    {/* Remember Me & Forgot Password */}
                    <div className="flex items-center justify-between pt-0.5">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="remember"
                          className="data-[state=checked]:bg-primary data-[state=checked]:border-primary border-border h-3.5 w-3.5 rounded transition-all"
                          onCheckedChange={(val) => setRememberMe(val)}
                        />
                        <label
                          htmlFor="remember"
                          className="text-muted-foreground hover:text-foreground cursor-pointer text-xs font-medium transition-colors select-none sm:text-sm"
                          dir={langDir}
                          translate="no"
                        >
                          {t("remember_me")}
                        </label>
                      </div>
                      <Link
                        className="text-primary hover:text-primary/80 text-xs font-semibold underline-offset-2 transition-colors duration-200 hover:underline sm:text-sm"
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
                      className="bg-primary text-primary-foreground hover:bg-primary/90 h-11 w-full rounded-lg text-sm font-semibold shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] disabled:transform-none disabled:cursor-not-allowed disabled:opacity-70 sm:h-12 sm:text-base"
                      dir={langDir}
                      translate="no"
                    >
                      {login.isPending ? (
                        <LoaderWithMessage message={t("please_wait")} />
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          {t("login")}
                          <ArrowRight className="h-4 w-4 rtl:rotate-180 sm:h-5 sm:w-5" />
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
                  className="border-border text-muted-foreground hover:border-primary hover:bg-primary/5 hover:text-primary h-10 w-full rounded-lg border-2 text-xs font-semibold shadow-sm transition-all duration-200 hover:shadow-md sm:h-11 sm:text-sm"
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
                    className="text-muted-foreground text-xs font-medium sm:text-sm"
                    dir={langDir}
                    translate="no"
                  >
                    {t("dont_have_an_account")}{" "}
                    <Link
                      href="/register"
                      className="text-primary hover:text-primary/80 font-semibold underline-offset-2 transition-colors duration-200 hover:underline"
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
