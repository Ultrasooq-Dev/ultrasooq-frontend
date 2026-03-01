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

function StepIcon({ icon, isActive, isCompleted }: { icon: string; isActive: boolean; isCompleted: boolean }) {
  if (isCompleted) {
    return (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
      </svg>
    );
  }
  const color = isActive ? "currentColor" : "currentColor";
  switch (icon) {
    case "user":
      return (
        <svg className="h-5 w-5" fill="none" stroke={color} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      );
    case "shield":
      return (
        <svg className="h-5 w-5" fill="none" stroke={color} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      );
    case "building":
      return (
        <svg className="h-5 w-5" fill="none" stroke={color} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      );
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
                <div className="h-[2px] w-full rounded-full bg-gray-200" />
                <div
                  className="absolute left-0 top-0 h-[2px] rounded-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-700 ease-out"
                  style={{ width: isCompleted ? "100%" : isActive ? "50%" : "0%" }}
                />
              </div>
            )}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`relative flex h-10 w-10 items-center justify-center rounded-full transition-all duration-500 sm:h-11 sm:w-11 ${
                  isActive
                    ? "bg-gradient-to-br from-orange-500 to-amber-400 text-white shadow-lg shadow-orange-500/30"
                    : isCompleted
                      ? "bg-gradient-to-br from-emerald-500 to-emerald-400 text-white shadow-lg shadow-emerald-500/20"
                      : "border-2 border-gray-200 bg-white text-gray-400"
                }`}
              >
                {isActive && (
                  <div className="absolute inset-0 animate-ping rounded-full bg-orange-400 opacity-20" />
                )}
                <StepIcon icon={step.icon} isActive={isActive} isCompleted={isCompleted} />
              </div>
              <span
                className={`text-[11px] font-semibold transition-colors duration-300 sm:text-xs ${
                  isActive ? "text-orange-600" : isCompleted ? "text-emerald-600" : "text-gray-400"
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
        <div className="relative hidden w-[45%] overflow-hidden bg-gradient-to-br from-orange-600 via-orange-500 to-amber-400 lg:block xl:w-[42%]" style={{direction: 'ltr'}}>
          {/* Floating shapes */}
          <div className="animate-float-slow absolute left-[8%] top-[10%] h-28 w-28 rounded-full bg-white/10 blur-sm lg:h-36 lg:w-36" />
          <div className="animate-float-reverse absolute bottom-[15%] left-[12%] h-20 w-20 rounded-full bg-white/10 blur-sm lg:h-32 lg:w-32" />
          <div className="animate-pulse-glow absolute left-[50%] top-[55%] h-14 w-14 rounded-full bg-white/15 lg:h-20 lg:w-20" />
          <div className="animate-float-slow absolute right-[15%] top-[25%] h-10 w-10 rounded-xl bg-white/10 rotate-12 lg:h-16 lg:w-16" />
          <div className="animate-float-reverse absolute bottom-[30%] right-[10%] h-12 w-12 rounded-full bg-white/8" />
          <div className="animate-float-slow absolute bottom-[8%] right-[25%] h-10 w-10 rounded-2xl bg-white/8 rotate-45" />

          {/* Grid pattern overlay */}
          <div className="absolute inset-0 opacity-[0.05]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />

          {/* Branding content — vertically centered */}
          <div className="relative z-10 flex h-full flex-col items-center justify-center px-10 xl:px-14">
            {/* Logo icon */}
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
              <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>

            <h1 className="mb-3 text-center text-3xl font-bold text-white xl:text-4xl">
              {t("welcome_to") || "Welcome to"}<br />Ultrasooq
            </h1>
            <p className="mb-8 max-w-[280px] text-center text-sm leading-relaxed text-white/80">
              {t("join_marketplace_desc") || "Join the leading B2B & B2C marketplace in the Middle East. Connect, trade and grow your business."}
            </p>

            {/* Tags */}
            <div className="mb-10 flex flex-wrap justify-center gap-2">
              {[t("secure") || "Secure", t("fast") || "Fast", t("trusted") || "Trusted"].map((label) => (
                <span key={label} className="rounded-full bg-white/20 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
                  {label}
                </span>
              ))}
            </div>

            {/* Stats row */}
            <div className="flex gap-8">
              <div className="text-center">
                <p className="text-2xl font-bold text-white xl:text-3xl">10K+</p>
                <p className="text-xs text-white/60">{t("products") || "Products"}</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white xl:text-3xl">5K+</p>
                <p className="text-xs text-white/60">{t("sellers") || "Sellers"}</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white xl:text-3xl">20+</p>
                <p className="text-xs text-white/60">{t("countries") || "Countries"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════
            RIGHT SIDE — Form Panel
            ════════════════════════════════════════════════════════════ */}
        <div className="relative flex min-h-screen flex-1 items-start justify-center overflow-y-auto bg-gradient-to-b from-gray-50 to-white px-4 py-6 sm:items-center sm:px-6 lg:px-10">
          {/* Mobile-only top gradient bar */}
          <div className="absolute left-0 top-0 h-1.5 w-full bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 lg:hidden" />

          <div className="w-full max-w-[480px]">

            {/* Card */}
            <div className="animate-slide-up overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-xl shadow-gray-200/50">
              {/* Card Header */}
              <div className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-orange-50/50 px-6 py-5 sm:px-8">
                <div className="mb-4 text-center">
                  <h2 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl" dir={langDir} translate="no">
                    {currentStep === 1 && (t("create_your_account") || "Create your account")}
                    {currentStep === 2 && (t("verify_otp") || "Verify your email")}
                    {currentStep === 3 && t("account_type")}
                  </h2>
                  <p className="mt-1 text-xs text-gray-500 sm:text-sm" dir={langDir} translate="no">
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
                        className="group h-11 w-full rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-600 transition-all duration-300 hover:border-gray-300 hover:bg-gray-50 hover:shadow-md sm:h-12"
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
                        <div className="w-full border-t border-gray-200" />
                      </div>
                      <div className="relative flex justify-center">
                        <span className="bg-white px-4 text-xs font-medium text-gray-400" dir={langDir} translate="no">
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
                          <ControlledTextInput label={t("login_password")} name="initialPassword" placeholder="**********" type="password" dir={langDir} translate="no" />
                          <ControlledTextInput label={t("confirm_password")} name="password" placeholder="**********" type="password" dir={langDir} translate="no" />
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
                                    className="data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500 mt-0.5 h-4 w-4 rounded border-gray-300 transition-all"
                                  />
                                </FormControl>
                                <div className="flex flex-col leading-none">
                                  <div className="text-xs text-gray-500 sm:text-sm">
                                    <span dir={langDir} translate="no">{t("i_agree")} </span>
                                    <Button onClick={handleToggleTermsModal} type="button" className="h-auto bg-transparent p-0 text-xs font-semibold text-orange-600 underline-offset-2 shadow-none hover:bg-transparent hover:text-orange-700 hover:underline sm:text-sm" dir={langDir} translate="no">
                                      {t("terms_of_use")}
                                    </Button>
                                    <span className="mx-1"> & </span>
                                    <Button onClick={handleTogglePrivacyModal} type="button" className="h-auto bg-transparent p-0 text-xs font-semibold text-orange-600 underline-offset-2 shadow-none hover:bg-transparent hover:text-orange-700 hover:underline sm:text-sm" dir={langDir} translate="no">
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
                          className="h-11 w-full rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition-all duration-300 hover:from-orange-600 hover:to-amber-600 hover:shadow-xl hover:shadow-orange-500/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:h-12 sm:text-base"
                          dir={langDir}
                          translate="no"
                        >
                          {register.isPending ? (
                            <LoaderWithMessage message={t("please_wait")} />
                          ) : (
                            <span className="flex items-center justify-center gap-2">
                              {t("agree_n_register")}
                              <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                              </svg>
                            </span>
                          )}
                        </Button>
                      </form>
                    </Form>

                    {/* Sign In Link */}
                    <div className="mt-5 text-center">
                      <span className="text-xs font-medium text-gray-500 sm:text-sm" dir={langDir} translate="no">
                        {t("already_have_an_account")}{" "}
                        <Link href="/login" className="font-bold text-orange-600 underline-offset-2 transition-colors duration-200 hover:text-orange-700 hover:underline" dir={langDir}>
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
                      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 shadow-inner">
                        <svg className="h-8 w-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-sm text-gray-500" dir={langDir} translate="no">{t("enter_otp")}</p>
                      <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-4 py-1.5">
                        <svg className="h-3.5 w-3.5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                        </svg>
                        <span className="text-xs font-semibold text-orange-700">{registrationEmail}</span>
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
                          className="h-14 w-14 rounded-xl border-2 border-gray-200 bg-gray-50 text-center text-2xl font-bold text-gray-900 transition-all duration-200 focus:border-orange-400 focus:bg-white focus:shadow-lg focus:shadow-orange-500/10 focus-visible:ring-0! sm:h-16 sm:w-16"
                          autoFocus={index === 0}
                        />
                      ))}
                    </div>

                    {/* Timer */}
                    {otpCount > 0 && (
                      <div className="flex items-center justify-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-50">
                          <svg className="h-4 w-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <span className="text-sm font-semibold text-orange-600" dir={langDir} translate="no">
                          {t("otp_will_expire_in_min_minutes", { min: formatTime(otpCount) })}
                        </span>
                      </div>
                    )}

                    {/* Verify Button */}
                    <Button
                      onClick={onSubmitOtp}
                      disabled={verifyOtp.isPending || otp.join("").length !== 4}
                      className="h-11 w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:from-emerald-600 hover:to-teal-600 hover:shadow-xl active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:h-12 sm:text-base"
                      dir={langDir}
                      translate="no"
                    >
                      {verifyOtp.isPending ? (
                        <LoaderWithMessage message={t("please_wait")} />
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                          {t("verify")}
                        </span>
                      )}
                    </Button>

                    {/* Resend */}
                    <div className="text-center">
                      <span className="text-sm text-gray-500" dir={langDir} translate="no">
                        {t("didnt_receive_otp")}{" "}
                      </span>
                      <Button
                        type="button"
                        variant="link"
                        disabled={verifyOtp.isPending || resendOtp.isPending || otpCount !== 0}
                        onClick={handleResendOtp}
                        className="cursor-pointer p-0 font-bold text-orange-600 hover:text-orange-700"
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
                            ? "border-orange-400 bg-gradient-to-r from-orange-50 to-amber-50 shadow-lg shadow-orange-500/10"
                            : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-300 ${selectedRole === "BUYER" ? "bg-gradient-to-br from-orange-500 to-amber-400 text-white shadow-lg shadow-orange-500/30" : "bg-gray-100 text-gray-400 group-hover:bg-gray-200"}`}>
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-gray-900">{t("personal") || "Personal"}</p>
                            <p className="text-xs text-gray-500">{t("personal_account_desc") || "Buy products and request quotations"}</p>
                          </div>
                          <div className={`flex h-6 w-6 items-center justify-center rounded-full transition-all duration-300 ${selectedRole === "BUYER" ? "bg-orange-500 text-white" : "border-2 border-gray-300"}`}>
                            {selectedRole === "BUYER" && (
                              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
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
                            ? "border-orange-400 bg-gradient-to-r from-orange-50 to-amber-50 shadow-lg shadow-orange-500/10"
                            : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-300 ${selectedRole === "COMPANY" ? "bg-gradient-to-br from-orange-500 to-amber-400 text-white shadow-lg shadow-orange-500/30" : "bg-gray-100 text-gray-400 group-hover:bg-gray-200"}`}>
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-gray-900">{t("company") || "Company"}</p>
                            <p className="text-xs text-gray-500">{t("company_account_desc") || "Sell products and manage your business"}</p>
                          </div>
                          <div className={`flex h-6 w-6 items-center justify-center rounded-full transition-all duration-300 ${selectedRole === "COMPANY" ? "bg-orange-500 text-white" : "border-2 border-gray-300"}`}>
                            {selectedRole === "COMPANY" && (
                              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
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
                            ? "border-orange-400 bg-gradient-to-r from-orange-50 to-amber-50 shadow-lg shadow-orange-500/10"
                            : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-300 ${selectedRole === "FREELANCER" ? "bg-gradient-to-br from-orange-500 to-amber-400 text-white shadow-lg shadow-orange-500/30" : "bg-gray-100 text-gray-400 group-hover:bg-gray-200"}`}>
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-gray-900">{t("freelancer") || "Freelancer"}</p>
                            <p className="text-xs text-gray-500">{t("freelancer_account_desc") || "Offer services and find work opportunities"}</p>
                          </div>
                          <div className={`flex h-6 w-6 items-center justify-center rounded-full transition-all duration-300 ${selectedRole === "FREELANCER" ? "bg-orange-500 text-white" : "border-2 border-gray-300"}`}>
                            {selectedRole === "FREELANCER" && (
                              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </div>
                      </button>
                    </div>

                    {/* Company Details (conditional) */}
                    {selectedRole === "COMPANY" && (
                      <div className="animate-slide-up space-y-3 rounded-xl border border-orange-200 bg-gradient-to-br from-orange-50/80 to-amber-50/50 p-5">
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-orange-100">
                            <svg className="h-3.5 w-3.5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16" />
                            </svg>
                          </div>
                          <p className="text-sm font-bold text-gray-900">{t("company_details") || "Company Details"}</p>
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-gray-600">
                            {t("company_name") || "Company Name"} <span className="text-red-500">*</span>
                          </label>
                          <Input
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            placeholder={t("enter_company_name") || "Enter company name"}
                            className="h-10 rounded-lg border-gray-200 bg-white transition-all focus:border-orange-400 focus:shadow-md"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-gray-600">
                            {t("company_address") || "Company Address"}
                          </label>
                          <Input
                            value={companyAddress}
                            onChange={(e) => setCompanyAddress(e.target.value)}
                            placeholder={t("enter_company_address") || "Enter company address"}
                            className="h-10 rounded-lg border-gray-200 bg-white transition-all focus:border-orange-400 focus:shadow-md"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="mb-1 block text-xs font-semibold text-gray-600">
                              {t("company_phone") || "Phone"}
                            </label>
                            <Input
                              value={companyPhone}
                              onChange={(e) => setCompanyPhone(e.target.value)}
                              placeholder={t("enter_phone") || "Phone"}
                              className="h-10 rounded-lg border-gray-200 bg-white transition-all focus:border-orange-400 focus:shadow-md"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-semibold text-gray-600">
                              {t("company_tax_id") || "Tax ID"}
                            </label>
                            <Input
                              value={companyTaxId}
                              onChange={(e) => setCompanyTaxId(e.target.value)}
                              placeholder={t("enter_tax_id") || "Tax ID"}
                              className="h-10 rounded-lg border-gray-200 bg-white transition-all focus:border-orange-400 focus:shadow-md"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-gray-600">
                            {t("company_website") || "Website"}
                          </label>
                          <Input
                            value={companyWebsite}
                            onChange={(e) => setCompanyWebsite(e.target.value)}
                            placeholder="https://..."
                            className="h-10 rounded-lg border-gray-200 bg-white transition-all focus:border-orange-400 focus:shadow-md"
                          />
                        </div>
                      </div>
                    )}

                    {/* Freelancer Details (conditional) */}
                    {selectedRole === "FREELANCER" && (
                      <div className="animate-slide-up space-y-3 rounded-xl border border-orange-200 bg-gradient-to-br from-orange-50/80 to-amber-50/50 p-5">
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-orange-100">
                            <svg className="h-3.5 w-3.5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
                            </svg>
                          </div>
                          <p className="text-sm font-bold text-gray-900">{t("freelancer_details") || "Freelancer Details"}</p>
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-gray-600">
                            {t("account_name") || "Account Name"} <span className="text-red-500">*</span>
                          </label>
                          <Input
                            value={freelancerName}
                            onChange={(e) => setFreelancerName(e.target.value)}
                            placeholder={t("enter_account_name") || "Enter your freelancer name"}
                            className="h-10 rounded-lg border-gray-200 bg-white transition-all focus:border-orange-400 focus:shadow-md"
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
                          className="h-11 flex-1 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-600 transition-all hover:bg-gray-50 sm:h-12"
                          dir={langDir}
                          translate="no"
                        >
                          {t("skip") || "Skip"}
                        </Button>
                      )}
                      <Button
                        onClick={onCompleteStep3}
                        disabled={createAccount.isPending}
                        className="h-11 flex-1 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition-all duration-300 hover:from-orange-600 hover:to-amber-600 hover:shadow-xl active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:h-12 sm:text-base"
                        dir={langDir}
                        translate="no"
                      >
                        {createAccount.isPending ? (
                          <LoaderWithMessage message={t("please_wait")} />
                        ) : (
                          <span className="flex items-center justify-center gap-2">
                            {selectedRole === "BUYER" ? (t("complete") || "Complete") : (t("create_account") || "Create Account")}
                            <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                          </span>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom subtle text */}
            <p className="mt-4 text-center text-[11px] text-gray-400">
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
