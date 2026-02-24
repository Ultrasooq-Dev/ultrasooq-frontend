"use client";
import { useResetPassword } from "@/apis/queries/auth.queries";
import ControlledTextInput from "@/components/shared/Forms/ControlledTextInput";
import PasswordChangeSuccessContent from "@/components/shared/PasswordChangeSuccessContent";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useToast } from "@/components/ui/use-toast";
import { PUREMOON_TOKEN_KEY } from "@/utils/constants";
import { zodResolver } from "@hookform/resolvers/zod";
import { deleteCookie, setCookie } from "cookies-next";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import BackgroundImage from "@/public/images/before-login-bg.png";
import LoaderWithMessage from "@/components/shared/LoaderWithMessage";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";

const formSchema = z
  .object({
    newPassword: z
      .string()
      .trim()
      .min(2, {
        message: "New Password is required",
      })
      .min(8, {
        message: "Password must be longer than or equal to 8 characters",
      }),
    confirmPassword: z
      .string()
      .trim()
      .min(2, {
        message: "Password is required",
      })
      .min(8, {
        message: "Password must be longer than or equal to 8 characters",
      }),
  })
  .superRefine(({ newPassword, confirmPassword }, ctx) => {
    if (newPassword !== confirmPassword) {
      ctx.addIssue({
        code: "custom",
        message: "Passwords do not match",
        path: ["confirmPassword"],
      });
    }
  });

export default function ResetPasswordPage() {
  const t = useTranslations();
  const { langDir } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const resetPassword = useResetPassword();

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const response = await resetPassword.mutateAsync(values, {
      onError: (err) => {
        toast({
          title: t("password_reset_failed"),
          description: err?.response?.data?.message,
          variant: "danger",
        });
        form.reset();
        deleteCookie(PUREMOON_TOKEN_KEY);
      },
    });

    if (response?.status && response?.data) {
      toast({
        title: t("password_reset_successful"),
        description: response?.message,
        variant: "success",
      });
      form.reset();
      deleteCookie(PUREMOON_TOKEN_KEY);
      setShowSuccess(true);
      setTimeout(() => {
        router.push("/login");
        setShowSuccess(false);
      }, 3000);
    } else {
      toast({
        title: t("password_reset_failed"),
        description: response?.message,
        variant: "danger",
      });
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(document.location.search);
    const accessToken = params.get("token");
    if (accessToken) {
      // setCookie(PUREMOON_TOKEN_KEY, accessToken);
      setCookie(PUREMOON_TOKEN_KEY, accessToken, {
        // 7 days
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
    }
  }, []);

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
        <div className="flex">
          <div className="m-auto mb-12 w-11/12 rounded-lg border border-solid border-border bg-card p-7 shadow-xs sm:p-12 md:w-9/12 lg:w-7/12">
            {showSuccess ? (
              <PasswordChangeSuccessContent />
            ) : (
              <>
                <div className="text-normal m-auto mb-7 w-full text-center text-sm leading-6 text-light-gray">
                  <h2 className="mb-3 text-center text-3xl font-semibold leading-8 text-color-dark sm:text-4xl sm:leading-10" dir={langDir} translate="no">
                    {t("reset_password")}
                  </h2>
                </div>
                <div className="w-full">
                  <Form {...form}>
                    <form
                      className="flex flex-wrap"
                      onSubmit={form.handleSubmit(onSubmit)}
                    >
                      <ControlledTextInput
                        label={t("new_password")}
                        name="newPassword"
                        placeholder="**********"
                        type="password"
                        dir={langDir}
                        translate="no"
                      />

                      <ControlledTextInput
                        label={t("reenter_new_password")}
                        name="confirmPassword"
                        placeholder="**********"
                        type="password"
                        dir={langDir}
                        translate="no"
                      />

                      <div className="mb-4 w-full">
                        <Button
                          disabled={resetPassword.isPending}
                          type="submit"
                          className="theme-primary-btn h-12 w-full rounded bg-dark-orange text-center text-lg font-bold leading-6"
                          translate="no"
                        >
                          {resetPassword.isPending ? (
                            <LoaderWithMessage message="Please wait" />
                          ) : (
                            t("change_password")
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
