"use client";
import React from "react";
import { useForm } from "react-hook-form";
import { Form } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/components/ui/use-toast";
import { useForgotPassword } from "@/apis/queries/auth.queries";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import ControlledTextInput from "@/components/shared/Forms/ControlledTextInput";
import LoaderWithMessage from "@/components/shared/LoaderWithMessage";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";

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
  });
};

export default function ForgetPasswordPage() {
  const t = useTranslations();
  const { langDir } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const defaultValues = {
    email: "",
  };
  const form = useForm({
    resolver: zodResolver(formSchema(t)),
    defaultValues: defaultValues,
  });
  const forgotPassword = useForgotPassword();

  const onSubmit = async (values: typeof defaultValues) => {
    const response = await forgotPassword.mutateAsync(values);

    if (response?.status && response?.otp) {
      toast({
        title: t("verification_code_sent"),
        description: response?.message,
        variant: "success",
      });

      sessionStorage.setItem("email", values.email.toLowerCase());
      form.reset();
      router.push("/password-reset-verify");
    } else {
      toast({
        title: t("verification_error"),
        description: response?.message,
        variant: "danger",
      });
    }
  };

  return (
    <>
      <title dir={langDir} translate="no">{`${t("forgot_your_password")} | Ultrasooq`}</title>

      <section className="flex min-h-screen w-full" dir={langDir}>
        {/* ═══════════════════════════════════════════════════════
            LEFT BRANDING PANEL (hidden on mobile, shown lg+)
            ═══════════════════════════════════════════════════════ */}
        <div className="relative hidden overflow-hidden lg:flex lg:w-[48%] xl:w-[50%]" style={{direction: 'ltr'}}>
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-600 via-orange-500 to-amber-400" />

          {/* Decorative pattern overlay */}
          <div className="absolute inset-0 opacity-10">
            <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="fp-grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#fp-grid-pattern)" />
            </svg>
          </div>

          {/* Decorative circles */}
          <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-white/10 blur-xl" />
          <div className="absolute -right-16 bottom-10 h-80 w-80 rounded-full bg-white/5 blur-2xl" />
          <div className="absolute top-1/2 left-1/4 h-40 w-40 rounded-full bg-white/5 blur-lg" />

          {/* Content */}
          <div className="relative z-10 flex w-full flex-col justify-between p-10 xl:p-14">
            {/* Logo & Brand */}
            <div>
              <Link href="/home" className="group inline-flex items-center gap-3">
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

            {/* Center content */}
            <div className="flex flex-1 flex-col items-center justify-center py-10">
              {/* Lock icon */}
              <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>

              <h1 className="mb-4 text-center text-3xl font-bold text-white xl:text-4xl">
                {t("dont_worry") || "Don't Worry!"}
              </h1>
              <p className="mb-8 max-w-[300px] text-center text-sm leading-relaxed text-white/80 xl:text-base">
                {t("reset_password_help") || "We'll help you reset your password and get back to your account in no time."}
              </p>

              {/* Steps */}
              <div className="space-y-4 text-left">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/20 text-sm font-bold text-white">1</div>
                  <p className="text-sm text-white/80">{t("enter_your_email") || "Enter your email address"}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/20 text-sm font-bold text-white">2</div>
                  <p className="text-sm text-white/80">{t("receive_verification_code") || "Receive a verification code"}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/20 text-sm font-bold text-white">3</div>
                  <p className="text-sm text-white/80">{t("set_new_password") || "Set your new password"}</p>
                </div>
              </div>
            </div>

            {/* Bottom */}
            <p className="text-xs text-white/50">
              © {new Date().getFullYear()} Ultrasooq. {t("all_rights_reserved") || "All rights reserved."}
            </p>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            RIGHT SIDE — Form Panel
            ═══════════════════════════════════════════════════════ */}
        <div className="relative flex min-h-screen flex-1 items-center justify-center overflow-y-auto bg-gradient-to-b from-gray-50 to-white px-4 py-8 sm:px-6 lg:px-10">
          {/* Mobile-only top gradient bar */}
          <div className="absolute left-0 top-0 h-1.5 w-full bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 lg:hidden" />

          <div className="w-full max-w-[440px]">
            {/* Card */}
            <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-xl shadow-gray-200/50">
              {/* Card Header */}
              <div className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-orange-50/50 px-6 py-6 sm:px-8">
                {/* Lock icon — mobile only */}
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg shadow-orange-500/25 lg:hidden">
                  <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div className="text-center">
                  <h2 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl" dir={langDir} translate="no">
                    {t("forgot_your_password")}
                  </h2>
                  <p className="mt-1.5 text-xs text-gray-500 sm:text-sm" dir={langDir} translate="no">
                    {t("forgot_password_instruction")}
                  </p>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 sm:p-8">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    <ControlledTextInput
                      label={t("email_phone_id")}
                      name="email"
                      placeholder={t("enter_email_phone_id")}
                      dir={langDir}
                      translate="no"
                    />

                    <Button
                      disabled={forgotPassword.isPending}
                      type="submit"
                      className="h-12 w-full rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-base font-bold text-white shadow-lg shadow-orange-500/25 transition-all duration-300 hover:from-orange-600 hover:to-amber-600 hover:shadow-xl active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                      dir={langDir}
                      translate="no"
                    >
                      {forgotPassword.isPending ? (
                        <LoaderWithMessage message={t("please_wait")} />
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          {t("reset_password")}
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </span>
                      )}
                    </Button>
                  </form>
                </Form>

                {/* Divider */}
                <div className="my-5 flex items-center gap-3">
                  <div className="h-px flex-1 bg-gray-200" />
                  <span className="text-xs text-gray-400">{t("or") || "or"}</span>
                  <div className="h-px flex-1 bg-gray-200" />
                </div>

                {/* Back to login link */}
                <Link
                  href="/login"
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-600 transition-all duration-300 hover:border-gray-300 hover:bg-gray-50 hover:shadow-md"
                  dir={langDir}
                  translate="no"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                  </svg>
                  {t("back_to_login") || "Back to Login"}
                </Link>
              </div>
            </div>

            {/* Bottom subtle text */}
            <p className="mt-4 text-center text-[11px] text-gray-400">
              {t("secure_registration") || "Your data is encrypted and secure"}
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
