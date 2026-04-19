"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";

import { Checkbox } from "@/components/ui/checkbox";
import { useRegister, useSocialLogin, useVerifyOtp, useResendOtp, useCreateAccount } from "@/apis/queries/auth.queries";
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
import { Input } from "@/components/ui/input";
import { ULTRASOOQ_TOKEN_KEY, ULTRASOOQ_REFRESH_TOKEN_KEY } from "@/utils/constants";
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
import {
  ArrowRight,
  Briefcase,
  Building2,
  Check,
  Clock,
  Mail,
  ShieldCheck,
  User,
  Zap,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------
const formSchema = (t: any) => {
  return z
    .object({
      firstName: z
        .string()
        .trim()
        .min(2, { message: t("first_name_required") })
        .max(50, { message: t("first_name_must_be_50_chars_only") }),
      lastName: z
        .string()
        .trim()
        .min(2, { message: t("last_name_requierd") })
        .max(50, { message: t("last_name_must_be_50_chars_only") }),
      email: z
        .string()
        .trim()
        .min(5, { message: t("email_is_required") })
        .email()
        .transform((val) => val.toLowerCase()),
      initialPassword: z
        .string()
        .trim()
        .min(1, { message: t("password_is_required") })
        .min(8, { message: t("password_characters_limit_n", { n: 8 }) }),
      password: z.string().trim().min(1, {
        message: t("confirm_password_is_required"),
      }),
      cc: z.string().trim(),
      phoneNumber: z
        .string()
        .trim()
        .min(2, { message: t("phone_number_required") })
        .min(8, { message: t("phone_number_must_be_min_8_digits") })
        .max(20, { message: t("phone_number_cant_be_more_than_20_digits") }),
      acceptTerms: z.boolean().refine((val) => val, {
        message: t("accept_terms_required"),
      }),
    })
    .superRefine(({ initialPassword, password }, ctx) => {
      if (initialPassword !== password) {
        ctx.addIssue({
          code: "custom",
          message: t("passwords_do_not_match"),
          path: ["password"],
        });
      }
    });
};

// ---------------------------------------------------------------------------
// Stepper Component
// ---------------------------------------------------------------------------
const STEP_KEYS = [
  { key: 1, labelKey: "step_information", icon: "user" },
  { key: 2, labelKey: "step_verification", icon: "shield" },
  { key: 3, labelKey: "step_account_type", icon: "building" },
] as const;

function StepIcon({ icon, isCompleted }: { icon: string; isActive: boolean; isCompleted: boolean }) {
  if (isCompleted) return <Check className="h-5 w-5" strokeWidth={2.5} />;
  switch (icon) {
    case "user":
      return <User className="h-5 w-5" />;
    case "shield":
      return <ShieldCheck className="h-5 w-5" />;
    case "building":
      return <Building2 className="h-5 w-5" />;
    default:
      return null;
  }
}

function RegistrationStepper({
  currentStep,
  langDir,
  t,
}: {
  currentStep: number;
  langDir: string;
  t: (key: string) => string;
}) {
  return (
    <div className="flex items-center justify-between" dir={langDir}>
      {STEP_KEYS.map((step, idx) => {
        const isActive = currentStep === step.key;
        const isCompleted = currentStep > step.key;
        return (
          <React.Fragment key={step.key}>
            {idx > 0 && (
              <div className="relative mx-2 flex-1 sm:mx-3">
                <div className="bg-muted h-[2px] w-full rounded-full" />
                <div
                  className="bg-primary absolute start-0 top-0 h-[2px] rounded-full transition-all duration-700 ease-out"
                  style={{ width: isCompleted ? "100%" : isActive ? "50%" : "0%" }}
                />
              </div>
            )}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`relative flex h-10 w-10 items-center justify-center rounded-full transition-all duration-500 sm:h-11 sm:w-11 ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-primary/30 shadow-lg"
                    : isCompleted
                      ? "bg-success text-success-foreground shadow-success/20 shadow-lg"
                      : "border-border bg-card text-muted-foreground/60 border-2"
                }`}
              >
                {isActive && (
                  <div className="bg-primary absolute inset-0 animate-ping rounded-full opacity-20" />
                )}
                <StepIcon icon={step.icon} isActive={isActive} isCompleted={isCompleted} />
              </div>
              <span
                className={`text-[11px] font-semibold transition-colors duration-300 sm:text-xs ${
                  isActive ? "text-primary" : isCompleted ? "text-success" : "text-muted-foreground/60"
                }`}
                dir={langDir}
                translate="no"
              >
                {t(step.labelKey)}
              </span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export default function RegisterPage() {
  const t = useTranslations();
  const { langDir, setUser, setPermissions } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { data: session } = useSession();
  const deviceId = getOrCreateDeviceId() || "";

  // -- Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const [registrationEmail, setRegistrationEmail] = useState("");
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // -- Step 2: OTP state
  const [otp, setOtp] = useState(new Array(4).fill(""));
  const [otpCount, setOtpCount] = useState(120);
  const otpRefs = useRef<HTMLInputElement[]>([]);

  // -- Step 3: Role state
  const [selectedRole, setSelectedRole] = useState<"BUYER" | "COMPANY" | "FREELANCER">("BUYER");
  const [companyName, setCompanyName] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [companyTaxId, setCompanyTaxId] = useState("");
  const [freelancerName, setFreelancerName] = useState("");

  // -- Form
  const form = useForm({
    resolver: zodResolver(formSchema(t)),
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

  // -- API hooks
  const register = useRegister();
  const socialLogin = useSocialLogin();
  const verifyOtp = useVerifyOtp();
  const resendOtp = useResendOtp();
  const createAccount = useCreateAccount();
  const updateCart = useUpdateUserCartByDeviceId();

  // -- Helpers
  const handleToggleTermsModal = () => setIsTermsModalOpen(!isTermsModalOpen);
  const handleTogglePrivacyModal = () => setIsPrivacyModalOpen(!isPrivacyModalOpen);

  const formatTime = useMemo(
    () =>
      (time: number): string => {
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
      },
    [],
  );

  const storeTokenAndFetchUser = useCallback(
    async (accessToken: string, refreshToken?: string) => {
      setCookie(ULTRASOOQ_TOKEN_KEY, accessToken, {
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
      if (refreshToken) {
        setCookie(ULTRASOOQ_REFRESH_TOKEN_KEY, refreshToken, {
          expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });
      }

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
        console.error("Failed to fetch user:", e);
      }

      try {
        const permissions = await fetchUserPermissions();
        setPermissions([
          ...(permissions?.data?.data?.userRoleDetail?.userRolePermission || []),
        ]);
      } catch (e) {
        // Silent fail
      }
    },
    [setUser, setPermissions],
  );

  // -- Step 1: Submit Registration
  const onSubmitStep1 = async (formData: any) => {
    try {
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
        setRegistrationEmail(formData.email.toLowerCase());
        sessionStorage.setItem("email", formData.email.toLowerCase());
        setOtpCount(120);
        setOtp(new Array(4).fill(""));
        setCurrentStep(2);
      } else if (response?.status && response?.accessToken) {
        await storeTokenAndFetchUser(response.accessToken, response.refreshToken);
        toast({
          title: t("registration_successful"),
          description: response.message,
          variant: "success",
        });
        setCurrentStep(3);
      } else {
        toast({
          title: t("registration_failed"),
          description: response?.message || t("something_went_wrong"),
          variant: "danger",
        });
      }
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || error?.message || t("something_went_wrong");
      toast({
        title: t("registration_failed"),
        description: errorMessage,
        variant: "danger",
      });
    }
  };

  // -- Step 2: OTP Verification
  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const regex = /[^0-9]/g;
    if (regex.test(e.target.value)) return;
    const { value } = e.target;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp([...newOtp]);
    if (value && index < otp.length - 1 && otpRefs.current[index + 1]) {
      otpRefs.current[index + 1].focus();
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0 && otpRefs.current[index - 1]) {
      otpRefs.current[index - 1].focus();
    }
  };

  const handleOtpClick = (index: number) => {
    if (otpRefs.current[index]) {
      otpRefs.current[index].setSelectionRange(1, 1);
    }
  };

  const onSubmitOtp = async () => {
    const combinedOtp = otp.join("");
    if (combinedOtp.length !== 4) {
      toast({ title: t("otp_length_should_be_n_digits", { n: 4 }), variant: "danger" });
      return;
    }

    try {
      const response = await verifyOtp.mutateAsync({
        email: registrationEmail,
        otp: Number(combinedOtp),
      });

      if (response?.status && response?.accessToken) {
        await storeTokenAndFetchUser(response.accessToken, response.refreshToken);
        toast({
          title: t("verification_successful"),
          description: response.message,
          variant: "success",
        });
        setCurrentStep(3);
      } else {
        setOtp(new Array(4).fill(""));
        toast({
          title: t("verification_failed"),
          description: response.message,
          variant: "danger",
        });
      }
    } catch (error: any) {
      setOtp(new Array(4).fill(""));
      toast({
        title: t("verification_failed"),
        description: error?.response?.data?.message || t("something_went_wrong"),
        variant: "danger",
      });
    }
  };

  const handleResendOtp = async () => {
    const email = registrationEmail || sessionStorage.getItem("email") || "";
    if (!email) {
      toast({ title: t("email_is_required"), variant: "danger" });
      return;
    }
    try {
      const response = await resendOtp.mutateAsync({ email: email.toLowerCase() });
      if (response.status && response.otp) {
        toast({
          title: t("verification_code_sent"),
          description: response.message,
          variant: "success",
        });
        setOtpCount(120);
        setOtp(new Array(4).fill(""));
      } else {
        toast({ title: t("verification_error"), description: response.message, variant: "danger" });
      }
    } catch {
      toast({ title: t("verification_error"), variant: "danger" });
    }
  };

  // -- Step 3: Complete Registration
  const onCompleteStep3 = async () => {
    if (selectedRole === "BUYER") {
      router.push("/profile?fromRegister=1");
      return;
    }

    if (selectedRole === "COMPANY" && !companyName.trim()) {
      toast({ title: t("company_name") || "Company name is required", variant: "danger" });
      return;
    }
    if (selectedRole === "FREELANCER" && !freelancerName.trim()) {
      toast({ title: t("account_name") || "Account name is required", variant: "danger" });
      return;
    }

    try {
      const payload: any = {
        tradeRole: selectedRole,
        accountName: selectedRole === "COMPANY" ? companyName : freelancerName,
      };

      if (selectedRole === "COMPANY") {
        payload.companyName = companyName;
        if (companyAddress) payload.companyAddress = companyAddress;
        if (companyPhone) payload.companyPhone = companyPhone;
        if (companyWebsite) payload.companyWebsite = companyWebsite;
        if (companyTaxId) payload.companyTaxId = companyTaxId;
      }

      await createAccount.mutateAsync(payload);
      toast({
        title: t("registration_successful"),
        description: t("account_created_successfully") || "Account created successfully",
        variant: "success",
      });
      router.push("/profile?fromRegister=1");
    } catch (error: any) {
      toast({
        title: t("registration_failed"),
        description: error?.response?.data?.message || error?.message || t("something_went_wrong"),
        variant: "danger",
      });
    }
  };

  // -- Google OAuth
  const handleSocialRegister = useCallback(
    async (userData: { name?: string | null; email?: string | null; image?: string | null }) => {
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
            description: t("you_have_successfully_registered") || response.message,
            variant: "success",
          });
          await storeTokenAndFetchUser(response.accessToken, response.refreshToken);
          await updateCart.mutateAsync({ deviceId });
          localStorage.removeItem("loginType");
          setIsGoogleLoading(false);
          setCurrentStep(3);
        } else {
          toast({
            title: t("registration_failed"),
            description: response?.message || t("something_went_wrong"),
            variant: "danger",
          });
          setIsGoogleLoading(false);
          await signOut({ redirect: false, callbackUrl: "/register" });
        }
      } catch {
        setIsGoogleLoading(false);
        toast({ title: t("registration_failed"), description: t("something_went_wrong"), variant: "danger" });
      }
    },
    [socialLogin, storeTokenAndFetchUser, updateCart, deviceId, toast, t],
  );

  // -- Effects
  useEffect(() => {
    if (session?.user) {
      const loginType = getLoginType();
      if (loginType === "GOOGLE" && session.user.email && session.user.name) {
        handleSocialRegister(session.user);
      } else {
        form.reset({
          firstName: session.user.name?.split(" ")[0] || "",
          lastName: session.user.name?.split(" ")[1] || "",
          email: session.user.email || "",
        });
      }
    } else {
      setIsGoogleLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  // OTP countdown timer
  useEffect(() => {
    if (currentStep !== 2 || otpCount <= 0) return;
    const timer = setInterval(() => {
      setOtpCount((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [currentStep, otpCount]);

  // -- RENDER
  return (
    <>
      <title dir={langDir} translate="no">{`${t("register")} | Ultrasooq`}</title>

      {/* Inline keyframes for animations */}
      <style jsx global>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(3deg); }
        }
        @keyframes float-reverse {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(15px) rotate(-2deg); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.05); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-float-slow { animation: float-slow 6s ease-in-out infinite; }
        .animate-float-reverse { animation: float-reverse 7s ease-in-out infinite; }
        .animate-pulse-glow { animation: pulse-glow 4s ease-in-out infinite; }
        .animate-slide-up { animation: slide-up 0.5s ease-out forwards; }
        .animate-fade-in { animation: fade-in 0.4s ease-out forwards; }
      `}</style>

      <section className="flex min-h-screen w-full">
        {/* ════════════════════════════════════════════════════════════
            LEFT BRANDING PANEL (hidden on mobile, shown lg+)
            ════════════════════════════════════════════════════════════ */}
        <div
          className="bg-primary relative hidden w-[45%] overflow-hidden lg:block xl:w-[42%]"
          style={{ direction: "ltr" }}
        >
          {/* Decorative blobs */}
          <div className="bg-primary-foreground/15 animate-float-slow absolute left-[8%] top-[10%] h-36 w-36 rounded-full blur-2xl" />
          <div className="bg-primary-foreground/10 animate-float-reverse absolute bottom-[15%] left-[12%] h-32 w-32 rounded-full blur-2xl" />
          <div className="bg-primary-foreground/15 animate-pulse-glow absolute left-[50%] top-[55%] h-20 w-20 rounded-full" />
          <div className="bg-primary-foreground/10 animate-float-slow absolute right-[15%] top-[25%] h-16 w-16 rotate-12 rounded-2xl" />
          <div className="bg-primary-foreground/10 animate-float-reverse absolute bottom-[30%] right-[10%] h-12 w-12 rounded-full" />

          {/* Dot pattern */}
          <div
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage:
                "radial-gradient(circle, currentColor 1px, transparent 1px)",
              backgroundSize: "28px 28px",
              color: "var(--primary-foreground)",
            }}
          />

          {/* Branding content */}
          <div className="relative z-10 flex h-full flex-col items-center justify-center px-10 xl:px-14">
            {/* Ultrasooq logo */}
            <Link
              href="/home"
              className="border-primary-foreground/20 bg-primary-foreground/15 mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border p-3 backdrop-blur-sm transition-transform hover:scale-105"
            >
              <Image
                src="/images/logoicon.png"
                alt="Ultrasooq"
                width={56}
                height={56}
                className="h-full w-full object-contain"
              />
            </Link>

            <h1 className="text-primary-foreground mb-3 text-center text-3xl font-bold xl:text-4xl">
              {t("welcome_to")}
              <br />
              Ultrasooq
            </h1>
            <p className="text-primary-foreground/80 mb-8 max-w-[300px] text-center text-sm leading-relaxed">
              {t("join_marketplace_desc")}
            </p>

            {/* Tags */}
            <div className="mb-10 flex flex-wrap justify-center gap-2">
              {[
                { Icon: ShieldCheck, label: t("secure") },
                { Icon: Zap, label: t("fast") },
                { Icon: Check, label: t("trusted") },
              ].map(({ Icon, label }) => (
                <span
                  key={label}
                  className="bg-primary-foreground/15 text-primary-foreground border-primary-foreground/20 inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-semibold backdrop-blur-sm"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </span>
              ))}
            </div>

            {/* Stats card */}
            <div className="border-primary-foreground/15 bg-primary-foreground/10 flex items-center gap-6 rounded-2xl border p-5 backdrop-blur-sm xl:gap-8">
              <div className="text-center">
                <p className="text-primary-foreground text-2xl font-bold xl:text-3xl">
                  10K+
                </p>
                <p className="text-primary-foreground/70 text-xs">
                  {t("products")}
                </p>
              </div>
              <div className="bg-primary-foreground/20 h-10 w-px" />
              <div className="text-center">
                <p className="text-primary-foreground text-2xl font-bold xl:text-3xl">
                  5K+
                </p>
                <p className="text-primary-foreground/70 text-xs">
                  {t("sellers")}
                </p>
              </div>
              <div className="bg-primary-foreground/20 h-10 w-px" />
              <div className="text-center">
                <p className="text-primary-foreground text-2xl font-bold xl:text-3xl">
                  20+
                </p>
                <p className="text-primary-foreground/70 text-xs">
                  {t("countries")}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════
            RIGHT SIDE — Form Panel
            ════════════════════════════════════════════════════════════ */}
        <div className="bg-background relative flex min-h-screen flex-1 items-start justify-center overflow-y-auto px-4 py-6 sm:items-center sm:px-6 lg:px-10">
          {/* Mobile-only top accent bar */}
          <div className="bg-primary absolute start-0 top-0 h-1.5 w-full lg:hidden" />

          <div className="w-full max-w-[480px]">
            {/* Card */}
            <div className="animate-slide-up border-border bg-card overflow-hidden rounded-2xl border shadow-xl">
              {/* Card Header */}
              <div className="border-border bg-muted/30 border-b px-6 py-5 sm:px-8">
                <div className="mb-4 text-center">
                  <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl" dir={langDir} translate="no">
                    {currentStep === 1 && (t("create_your_account") || "Create your account")}
                    {currentStep === 2 && (t("verify_otp") || "Verify your email")}
                    {currentStep === 3 && t("account_type")}
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground sm:text-sm" dir={langDir} translate="no">
                    {currentStep === 1 && (t("fill_in_your_details") || "Fill in your details to get started")}
                    {currentStep === 2 && (t("enter_otp") || "Enter the code sent to your email")}
                    {currentStep === 3 && t("choose_account_type")}
                  </p>
                </div>

                {/* Stepper */}
                <RegistrationStepper currentStep={currentStep} langDir={langDir} t={t} />
              </div>

              {/* Card Body */}
              <div className="p-6 sm:p-8">
                {/* ═══════════ STEP 1: Information ═══════════ */}
                {currentStep === 1 && (
                  <div className="animate-fade-in">
                    {/* Google Sign-Up */}
                    <div className="mb-5">
                      <Button
                        variant="outline"
                        className="group h-11 w-full rounded-xl border-2 border-border text-sm font-semibold text-muted-foreground transition-all duration-300 hover:border-border hover:bg-muted/50 hover:shadow-md sm:h-12"
                        onClick={() => { setIsGoogleLoading(true); localStorage.setItem("loginType", "GOOGLE"); signIn("google"); }}
                        disabled={socialLogin.isPending || isGoogleLoading}
                        dir={langDir}
                        translate="no"
                      >
                        {(socialLogin.isPending || isGoogleLoading) && getLoginType() === "GOOGLE" ? (
                          <span className="flex items-center justify-center gap-2">
                            <Image src={LoaderPrimaryIcon} alt="loading" width={18} height={18} className="animate-spin" />
                            <span>{t("please_wait")}</span>
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-3">
                            <Image src={GoogleIcon} alt="google" height={22} width={22} className="object-contain" />
                            <span>{t("google_sign_up")}</span>
                          </span>
                        )}
                      </Button>
                    </div>

                    {/* Divider */}
                    <div className="relative my-5">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border" />
                      </div>
                      <div className="relative flex justify-center">
                        <span className="bg-card px-4 text-xs font-medium text-muted-foreground/60" dir={langDir} translate="no">
                          {t("or")}
                        </span>
                      </div>
                    </div>

                    {/* Form */}
                    <Form {...form}>
                      <form className="space-y-3.5" onSubmit={form.handleSubmit(onSubmitStep1)}>
                        <div className="grid grid-cols-2 gap-3">
                          <ControlledTextInput label={t("first_name")} name="firstName" placeholder={t("enter_first_name")} dir={langDir} translate="no" />
                          <ControlledTextInput label={t("last_name")} name="lastName" placeholder={t("enter_last_name")} dir={langDir} translate="no" />
                        </div>
                        <ControlledTextInput
                          label={t("email")}
                          name="email"
                          placeholder={t("enter_email")}
                          disabled={getLoginType() === "GOOGLE" ? !!session?.user?.email : false}
                          dir={langDir}
                          translate="no"
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <ControlledTextInput label={t("login_password")} name="initialPassword" placeholder="••••••••" type="password" dir={langDir} translate="no" />
                          <ControlledTextInput label={t("confirm_password")} name="password" placeholder="••••••••" type="password" dir={langDir} translate="no" />
                        </div>
                        <ControlledPhoneInput label={t("phone_number")} name="phoneNumber" countryName="cc" placeholder={t("enter_phone_number")} />

                        {/* Terms */}
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
                                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary mt-0.5 h-4 w-4 rounded border-border transition-all"
                                  />
                                </FormControl>
                                <div className="flex flex-col leading-none">
                                  <div className="text-xs text-muted-foreground sm:text-sm">
                                    <span dir={langDir} translate="no">{t("i_agree")} </span>
                                    <Button onClick={handleToggleTermsModal} type="button" className="h-auto bg-transparent p-0 text-xs font-semibold text-primary underline-offset-2 shadow-none hover:bg-transparent hover:text-primary hover:underline sm:text-sm" dir={langDir} translate="no">
                                      {t("terms_of_use")}
                                    </Button>
                                    <span className="mx-1"> & </span>
                                    <Button onClick={handleTogglePrivacyModal} type="button" className="h-auto bg-transparent p-0 text-xs font-semibold text-primary underline-offset-2 shadow-none hover:bg-transparent hover:text-primary hover:underline sm:text-sm" dir={langDir} translate="no">
                                      {t("privacy_policy")}
                                    </Button>
                                  </div>
                                  <FormMessage />
                                </div>
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Submit */}
                        <Button
                          disabled={register.isPending}
                          type="submit"
                          className="h-11 w-full rounded-xl bg-primary text-sm font-bold text-white shadow-lg shadow-primary/25 transition-all duration-300 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:h-12 sm:text-base"
                          dir={langDir}
                          translate="no"
                        >
                          {register.isPending ? (
                            <LoaderWithMessage message={t("please_wait")} />
                          ) : (
                            <span className="flex items-center justify-center gap-2">
                              {t("agree_n_register")}
                              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 rtl:rotate-180 sm:h-5 sm:w-5" />
                            </span>
                          )}
                        </Button>
                      </form>
                    </Form>

                    {/* Sign In Link */}
                    <div className="mt-5 text-center">
                      <span className="text-xs font-medium text-muted-foreground sm:text-sm" dir={langDir} translate="no">
                        {t("already_have_an_account")}{" "}
                        <Link href="/login" className="font-bold text-primary underline-offset-2 transition-colors duration-200 hover:text-primary hover:underline" dir={langDir}>
                          {t("sign_in")}
                        </Link>
                      </span>
                    </div>
                  </div>
                )}

                {/* ═══════════ STEP 2: OTP Verification ═══════════ */}
                {currentStep === 2 && (
                  <div className="animate-fade-in space-y-6">
                    {/* Email badge */}
                    <div className="text-center">
                      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-success/10 shadow-inner">
                        <Mail className="h-8 w-8 text-success" />
                      </div>
                      <p className="text-sm text-muted-foreground" dir={langDir} translate="no">{t("enter_otp")}</p>
                      <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-4 py-1.5">
                        <Mail className="h-3.5 w-3.5 text-primary" />
                        <span className="text-xs font-semibold text-primary">{registrationEmail}</span>
                      </div>
                    </div>

                    {/* OTP Inputs */}
                    <div className="flex items-center justify-center gap-3 sm:gap-4">
                      {otp.map((value, index) => (
                        <Input
                          key={index}
                          value={value}
                          ref={(el) => { if (el) otpRefs.current[index] = el; }}
                          type="text"
                          onChange={(e) => handleOtpChange(e, index)}
                          onClick={() => handleOtpClick(index)}
                          onKeyDown={(e) => handleOtpKeyDown(e, index)}
                          className="h-14 w-14 rounded-xl border-2 border-border bg-muted/50 text-center text-2xl font-bold text-foreground transition-all duration-200 focus:border-primary focus:bg-card focus:shadow-lg focus:shadow-primary/10 focus-visible:ring-0! sm:h-16 sm:w-16"
                          autoFocus={index === 0}
                        />
                      ))}
                    </div>

                    {/* Timer */}
                    {otpCount > 0 && (
                      <div className="flex items-center justify-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                          <Clock className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-sm font-semibold text-primary" dir={langDir} translate="no">
                          {t("otp_will_expire_in_min_minutes", { min: formatTime(otpCount) })}
                        </span>
                      </div>
                    )}

                    {/* Verify Button */}
                    <Button
                      onClick={onSubmitOtp}
                      disabled={verifyOtp.isPending || otp.join("").length !== 4}
                      className="h-11 w-full rounded-xl bg-success text-sm font-bold text-white shadow-lg shadow-success/25 transition-all duration-300 hover:bg-success/90 hover:shadow-xl active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:h-12 sm:text-base"
                      dir={langDir}
                      translate="no"
                    >
                      {verifyOtp.isPending ? (
                        <LoaderWithMessage message={t("please_wait")} />
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <ShieldCheck className="h-5 w-5" />
                          {t("verify")}
                        </span>
                      )}
                    </Button>

                    {/* Resend */}
                    <div className="text-center">
                      <span className="text-sm text-muted-foreground" dir={langDir} translate="no">
                        {t("didnt_receive_otp")}{" "}
                      </span>
                      <Button
                        type="button"
                        variant="link"
                        disabled={verifyOtp.isPending || resendOtp.isPending || otpCount !== 0}
                        onClick={handleResendOtp}
                        className="cursor-pointer p-0 font-bold text-primary hover:text-primary"
                        dir={langDir}
                        translate="no"
                      >
                        {t("resend")}
                      </Button>
                    </div>
                  </div>
                )}

                {/* ═══════════ STEP 3: Account Type Selection ═══════════ */}
                {currentStep === 3 && (
                  <div className="animate-fade-in space-y-5">
                    {/* Role Cards */}
                    <div className="space-y-3">
                      {/* Personal / Buyer */}
                      <button
                        type="button"
                        onClick={() => setSelectedRole("BUYER")}
                        className={`group w-full rounded-xl border-2 p-4 text-left transition-all duration-300 ${
                          selectedRole === "BUYER"
                            ? "border-primary bg-primary/10 shadow-lg shadow-primary/10"
                            : "border-border bg-card hover:border-border hover:shadow-md"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-300 ${selectedRole === "BUYER" ? "bg-primary text-white shadow-lg shadow-primary/30" : "bg-muted text-muted-foreground/60 group-hover:bg-muted"}`}>
                            <User className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-foreground">{t("personal") || "Personal"}</p>
                            <p className="text-xs text-muted-foreground">{t("personal_account_desc") || "Buy products and request quotations"}</p>
                          </div>
                          <div className={`flex h-6 w-6 items-center justify-center rounded-full transition-all duration-300 ${selectedRole === "BUYER" ? "bg-primary text-white" : "border-2 border-border"}`}>
                            {selectedRole === "BUYER" && (
                              <Check className="h-3.5 w-3.5" strokeWidth={3} />
                            )}
                          </div>
                        </div>
                      </button>

                      {/* Company */}
                      <button
                        type="button"
                        onClick={() => setSelectedRole("COMPANY")}
                        className={`group w-full rounded-xl border-2 p-4 text-left transition-all duration-300 ${
                          selectedRole === "COMPANY"
                            ? "border-primary bg-primary/10 shadow-lg shadow-primary/10"
                            : "border-border bg-card hover:border-border hover:shadow-md"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-300 ${selectedRole === "COMPANY" ? "bg-primary text-white shadow-lg shadow-primary/30" : "bg-muted text-muted-foreground/60 group-hover:bg-muted"}`}>
                            <Building2 className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-foreground">{t("company") || "Company"}</p>
                            <p className="text-xs text-muted-foreground">{t("company_account_desc") || "Sell products and manage your business"}</p>
                          </div>
                          <div className={`flex h-6 w-6 items-center justify-center rounded-full transition-all duration-300 ${selectedRole === "COMPANY" ? "bg-primary text-white" : "border-2 border-border"}`}>
                            {selectedRole === "COMPANY" && (
                              <Check className="h-3.5 w-3.5" strokeWidth={3} />
                            )}
                          </div>
                        </div>
                      </button>

                      {/* Freelancer */}
                      <button
                        type="button"
                        onClick={() => setSelectedRole("FREELANCER")}
                        className={`group w-full rounded-xl border-2 p-4 text-left transition-all duration-300 ${
                          selectedRole === "FREELANCER"
                            ? "border-primary bg-primary/10 shadow-lg shadow-primary/10"
                            : "border-border bg-card hover:border-border hover:shadow-md"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-300 ${selectedRole === "FREELANCER" ? "bg-primary text-white shadow-lg shadow-primary/30" : "bg-muted text-muted-foreground/60 group-hover:bg-muted"}`}>
                            <Briefcase className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-foreground">{t("freelancer") || "Freelancer"}</p>
                            <p className="text-xs text-muted-foreground">{t("freelancer_account_desc") || "Offer services and find work opportunities"}</p>
                          </div>
                          <div className={`flex h-6 w-6 items-center justify-center rounded-full transition-all duration-300 ${selectedRole === "FREELANCER" ? "bg-primary text-white" : "border-2 border-border"}`}>
                            {selectedRole === "FREELANCER" && (
                              <Check className="h-3.5 w-3.5" strokeWidth={3} />
                            )}
                          </div>
                        </div>
                      </button>
                    </div>

                    {/* Company Details (conditional) */}
                    {selectedRole === "COMPANY" && (
                      <div className="animate-slide-up space-y-3 rounded-xl border border-primary/30 bg-primary/5 p-5">
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/15">
                            <Building2 className="h-3.5 w-3.5 text-primary" />
                          </div>
                          <p className="text-sm font-bold text-foreground">{t("company_details") || "Company Details"}</p>
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                            {t("company_name") || "Company Name"} <span className="text-destructive">*</span>
                          </label>
                          <Input
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            placeholder={t("enter_company_name") || "Enter company name"}
                            className="h-10 rounded-lg border-border bg-card transition-all focus:border-primary focus:shadow-md"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                            {t("company_address") || "Company Address"}
                          </label>
                          <Input
                            value={companyAddress}
                            onChange={(e) => setCompanyAddress(e.target.value)}
                            placeholder={t("enter_company_address") || "Enter company address"}
                            className="h-10 rounded-lg border-border bg-card transition-all focus:border-primary focus:shadow-md"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                              {t("company_phone") || "Phone"}
                            </label>
                            <Input
                              value={companyPhone}
                              onChange={(e) => setCompanyPhone(e.target.value)}
                              placeholder={t("enter_phone") || "Phone"}
                              className="h-10 rounded-lg border-border bg-card transition-all focus:border-primary focus:shadow-md"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                              {t("company_tax_id") || "Tax ID"}
                            </label>
                            <Input
                              value={companyTaxId}
                              onChange={(e) => setCompanyTaxId(e.target.value)}
                              placeholder={t("enter_tax_id") || "Tax ID"}
                              className="h-10 rounded-lg border-border bg-card transition-all focus:border-primary focus:shadow-md"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                            {t("company_website") || "Website"}
                          </label>
                          <Input
                            value={companyWebsite}
                            onChange={(e) => setCompanyWebsite(e.target.value)}
                            placeholder="https://..."
                            className="h-10 rounded-lg border-border bg-card transition-all focus:border-primary focus:shadow-md"
                          />
                        </div>
                      </div>
                    )}

                    {/* Freelancer Details (conditional) */}
                    {selectedRole === "FREELANCER" && (
                      <div className="animate-slide-up space-y-3 rounded-xl border border-primary/30 bg-primary/5 p-5">
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/15">
                            <Briefcase className="h-3.5 w-3.5 text-primary" />
                          </div>
                          <p className="text-sm font-bold text-foreground">{t("freelancer_details") || "Freelancer Details"}</p>
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                            {t("account_name") || "Account Name"} <span className="text-destructive">*</span>
                          </label>
                          <Input
                            value={freelancerName}
                            onChange={(e) => setFreelancerName(e.target.value)}
                            placeholder={t("enter_account_name") || "Enter your freelancer name"}
                            className="h-10 rounded-lg border-border bg-card transition-all focus:border-primary focus:shadow-md"
                          />
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-1">
                      {selectedRole === "BUYER" && (
                        <Button
                          variant="outline"
                          onClick={() => router.push("/profile?fromRegister=1")}
                          className="h-11 flex-1 rounded-xl border-2 border-border text-sm font-semibold text-muted-foreground transition-all hover:bg-muted/50 sm:h-12"
                          dir={langDir}
                          translate="no"
                        >
                          {t("skip") || "Skip"}
                        </Button>
                      )}
                      <Button
                        onClick={onCompleteStep3}
                        disabled={createAccount.isPending}
                        className="h-11 flex-1 rounded-xl bg-primary text-sm font-bold text-white shadow-lg shadow-primary/25 transition-all duration-300 hover:bg-primary/90 hover:shadow-xl active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:h-12 sm:text-base"
                        dir={langDir}
                        translate="no"
                      >
                        {createAccount.isPending ? (
                          <LoaderWithMessage message={t("please_wait")} />
                        ) : (
                          <span className="flex items-center justify-center gap-2">
                            {selectedRole === "BUYER" ? (t("complete") || "Complete") : (t("create_account") || "Create Account")}
                            <ArrowRight className="h-4 w-4 rtl:rotate-180 sm:h-5 sm:w-5" />
                          </span>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom subtle text */}
            <p className="mt-4 text-center text-[11px] text-muted-foreground/60">
              {t("secure_registration") || "Your data is encrypted and secure"}
            </p>
          </div>
        </div>
      </section>

      {/* Terms Modal */}
      <Dialog open={isTermsModalOpen} onOpenChange={handleToggleTermsModal}>
        <DialogContent className="max-h-[93vh] max-w-[90%] gap-0 p-0 md:max-w-[90%]! lg:max-w-5xl!">
          <DialogHeader className="border-light-gray border-b py-4">
            <DialogTitle className="text-center text-xl font-bold" dir={langDir} translate="no">
              {t("terms_of_use")}
            </DialogTitle>
          </DialogHeader>
          <DialogDescription className="term-policy-modal-content text-color-dark max-h-[82vh] overflow-y-scroll p-4 text-sm leading-7 font-normal">
            <TermsContent />
          </DialogDescription>
        </DialogContent>
      </Dialog>

      {/* Privacy Modal */}
      <Dialog open={isPrivacyModalOpen} onOpenChange={handleTogglePrivacyModal}>
        <DialogContent className="max-h-[93vh] max-w-[90%] gap-0 p-0 md:max-w-[90%]! lg:max-w-5xl!">
          <DialogHeader className="border-light-gray border-b py-4">
            <DialogTitle className="text-center text-xl font-bold" dir={langDir} translate="no">
              {t("privacy_policy")}
            </DialogTitle>
          </DialogHeader>
          <DialogDescription className="term-policy-modal-content text-color-dark max-h-[82vh] overflow-y-scroll p-4 text-sm leading-7 font-normal">
            <PolicyContent />
          </DialogDescription>
        </DialogContent>
      </Dialog>
    </>
  );
}
