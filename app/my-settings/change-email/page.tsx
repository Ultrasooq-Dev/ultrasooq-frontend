"use client";
import React from "react";
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
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/components/ui/use-toast";
import { useChangeEmail } from "@/apis/queries/auth.queries";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { EMAIL_REGEX_LOWERCASE } from "@/utils/constants";
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

export default function ChangeEmailPage() {
  const t = useTranslations();
  const { langDir } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const form = useForm({
    resolver: zodResolver(formSchema(t)),
    defaultValues: {
      email: "",
    },
  });
  const changeEmail = useChangeEmail();

  const onSubmit = async (values: any) => {
    const response = await changeEmail.mutateAsync(values);

    if (response?.status && response?.otp) {
      toast({
        title: t("verification_code_sent"),
        description: response?.message,
        variant: "success",
      });

      sessionStorage.setItem("email", values.email.toLowerCase());
      form.reset();
      router.push("/email-change-verify");
    } else {
      toast({
        title: t("verification_error"),
        description: response?.message,
        variant: "danger",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900" dir={langDir} translate="no">
          {t("change_email")}
        </h2>
        <p className="mt-1.5 text-sm text-gray-600" translate="no">
          {t("update_your_account_email_address")}
        </p>
      </div>

      {/* Form Section */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
        <Form {...form}>
          <form
            className="space-y-6"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem dir={langDir}>
                  <FormLabel className="text-sm font-semibold text-gray-700" translate="no">
                    {t("new_email")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder={t("enter_email")}
                      className="h-12 rounded-lg border-gray-300 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0"
                      {...field}
                      dir={langDir}
                      translate="no"
                    />
                  </FormControl>
                  <FormMessage className="text-sm" />
                  <p className="mt-2 text-xs text-gray-500" translate="no">
                    {t("we_will_send_a_verification_code_to_this_email")}
                  </p>
                </FormItem>
              )}
            />

            <div className="flex items-center gap-4 pt-4">
              <Button
                disabled={changeEmail.isPending}
                type="submit"
                className="h-12 flex-1 rounded-lg bg-primary text-base font-semibold text-white shadow-sm transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 sm:flex-none sm:px-8"
                translate="no"
              >
                {changeEmail.isPending ? (
                  <>
                    <Image
                      src="/images/load.png"
                      alt="loader-icon"
                      width={20}
                      height={20}
                      className="mr-2 animate-spin"
                    />
                    {t("please_wait")}
                  </>
                ) : (
                  t("change_email")
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>

      {/* Info Section */}
      <div className="overflow-hidden rounded-xl border border-primary/20 bg-primary/5 p-4 shadow-sm">
        <div className="flex gap-3">
          <svg
            className="h-5 w-5 flex-shrink-0 text-primary"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-primary" translate="no">
              {t("important_information")}
            </h3>
            <p className="mt-1 text-sm text-primary" translate="no">
              {t("after_changing_your_email_you_will_need_to_verify_it")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
