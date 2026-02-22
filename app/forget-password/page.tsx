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
import { EMAIL_REGEX_LOWERCASE } from "@/utils/constants";
import ControlledTextInput from "@/components/shared/Forms/ControlledTextInput";
import BackgroundImage from "@/public/images/before-login-bg.png";
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
      .refine((val) => (EMAIL_REGEX_LOWERCASE.test(val) ? true : false), {
        message: t("email_must_be_lower_case"),
      }),
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
            <div className="text-normal m-auto mb-7 w-full text-center text-sm leading-6 text-light-gray">
              <h2
                className="mb-3 text-center text-3xl font-semibold leading-8 text-color-dark sm:text-4xl sm:leading-10"
                dir={langDir}
                translate="no"
              >
                {t("forgot_your_password")}
              </h2>
              <p dir={langDir} translate="no">
                {t("forgot_password_instruction")}
              </p>
            </div>
            <div className="w-full">
              <Form {...form}>
                <form
                  className="flex flex-wrap"
                  onSubmit={form.handleSubmit(onSubmit)}
                >
                  <ControlledTextInput
                    label={t("email_phone_id")}
                    name="email"
                    placeholder={t("enter_email_phone_id")}
                    dir={langDir}
                    translate="no"
                  />

                  <div className="mb-4 mt-3 w-full">
                    <Button
                      disabled={forgotPassword.isPending}
                      type="submit"
                      className="theme-primary-btn h-12 w-full rounded bg-dark-orange text-center text-lg font-bold leading-6"
                      dir={langDir}
                      translate="no"
                    >
                      {forgotPassword.isPending ? (
                        <LoaderWithMessage message={t("please_wait")} />
                      ) : (
                        t("reset_password")
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
