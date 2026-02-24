"use client";
import { useChangePassword } from "@/apis/queries/auth.queries";
import PasswordChangeSuccessContent from "@/components/shared/PasswordChangeSuccessContent";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { useToast } from "@/components/ui/use-toast";
import { ULTRASOOQ_TOKEN_KEY } from "@/utils/constants";
import { zodResolver } from "@hookform/resolvers/zod";
import { deleteCookie } from "cookies-next";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";

const formSchema = (t: any) => {
  return z
    .object({
      password: z
        .string()
        .trim()
        .min(2, { message: t("password_is_required") })
        .min(8, { message: t("password_characters_limit_n", { n: 8 }) }),
      newPassword: z
        .string()
        .trim()
        .min(2, { message: t("password_is_required") })
        .min(8, { message: t("password_characters_limit_n", { n: 8 }) }),
      confirmPassword: z
        .string()
        .trim()
        .min(2, { message: t("password_is_required") })
        .min(8, { message: t("password_characters_limit_n", { n: 8 }) }),
    })
    .superRefine(({ newPassword, confirmPassword }, ctx) => {
      if (newPassword !== confirmPassword) {
        ctx.addIssue({
          code: "custom",
          message: t("passwords_do_not_match"),
          path: ["confirmPassword"],
        });
      }
    });
};

export default function ChangePasswordPage() {
  const t = useTranslations();
  const { langDir } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const form = useForm({
    resolver: zodResolver(formSchema(t)),
    defaultValues: {
      password: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const changePassword = useChangePassword();

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const onSubmit = async (values: any) => {
    const response = await changePassword.mutateAsync(values, {
      onError: (err) => {
        toast({
          title: t("password_change_failed"),
          description: err?.response?.data?.message,
          variant: "danger",
        });
        form.reset();
        deleteCookie(ULTRASOOQ_TOKEN_KEY);
      },
    });

    if (response?.status && response?.data) {
      toast({
        title: t("password_change_successful"),
        description: response?.message,
        variant: "success",
      });
      form.reset();
      deleteCookie(ULTRASOOQ_TOKEN_KEY);
      setShowSuccess(true);
      setTimeout(() => {
        router.push("/home");
        setShowSuccess(false);
      }, 3000);
    } else {
      toast({
        title: t("password_change_failed"),
        description: response?.message,
        variant: "danger",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="overflow-hidden rounded-xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
        <h2 className="text-2xl font-bold tracking-tight text-foreground" dir={langDir} translate="no">
          {t("change_password")}
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground" translate="no">
          {t("update_your_password_to_keep_your_account_secure")}
        </p>
      </div>

      {showSuccess ? (
        <div className="overflow-hidden rounded-xl border border-success/20 bg-card p-8 shadow-sm">
          <PasswordChangeSuccessContent />
        </div>
      ) : (
        <>
          {/* Form Section */}
          <div className="overflow-hidden rounded-xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
            <Form {...form}>
              <form
                className="space-y-6"
                onSubmit={form.handleSubmit(onSubmit)}
              >
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem dir={langDir}>
                      <FormLabel className="text-sm font-semibold text-muted-foreground" translate="no">
                        {t("old_password")}
                      </FormLabel>
                      <FormControl>
                        <InputGroup className="h-12 rounded-lg border-border focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-0">
                          <InputGroupInput
                            type={showOldPassword ? "text" : "password"}
                            placeholder="**********"
                            className="h-full border-0 ring-0 focus-visible:ring-0"
                            {...field}
                            dir={langDir}
                          />
                          <InputGroupAddon align="inline-end">
                            <button
                              type="button"
                              onClick={() => setShowOldPassword(!showOldPassword)}
                              className="text-muted-foreground hover:text-foreground transition-colors"
                              tabIndex={-1}
                            >
                              {showOldPassword ? (
                                <EyeOffIcon className="size-4" />
                              ) : (
                                <EyeIcon className="size-4" />
                              )}
                            </button>
                          </InputGroupAddon>
                        </InputGroup>
                      </FormControl>
                      <FormMessage className="text-sm" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem dir={langDir}>
                      <FormLabel className="text-sm font-semibold text-muted-foreground" translate="no">
                        {t("new_password")}
                      </FormLabel>
                      <FormControl>
                        <InputGroup className="h-12 rounded-lg border-border focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-0">
                          <InputGroupInput
                            type={showNewPassword ? "text" : "password"}
                            placeholder="**********"
                            className="h-full border-0 ring-0 focus-visible:ring-0"
                            {...field}
                            dir={langDir}
                          />
                          <InputGroupAddon align="inline-end">
                            <button
                              type="button"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              className="text-muted-foreground hover:text-foreground transition-colors"
                              tabIndex={-1}
                            >
                              {showNewPassword ? (
                                <EyeOffIcon className="size-4" />
                              ) : (
                                <EyeIcon className="size-4" />
                              )}
                            </button>
                          </InputGroupAddon>
                        </InputGroup>
                      </FormControl>
                      <FormMessage className="text-sm" />
                      <p className="mt-2 text-xs text-muted-foreground" translate="no">
                        {t("password_must_be_at_least_8_characters")}
                      </p>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem dir={langDir}>
                      <FormLabel className="text-sm font-semibold text-muted-foreground" translate="no">
                        {t("reenter_new_password")}
                      </FormLabel>
                      <FormControl>
                        <InputGroup className="h-12 rounded-lg border-border focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-0">
                          <InputGroupInput
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="**********"
                            className="h-full border-0 ring-0 focus-visible:ring-0"
                            {...field}
                            dir={langDir}
                          />
                          <InputGroupAddon align="inline-end">
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="text-muted-foreground hover:text-foreground transition-colors"
                              tabIndex={-1}
                            >
                              {showConfirmPassword ? (
                                <EyeOffIcon className="size-4" />
                              ) : (
                                <EyeIcon className="size-4" />
                              )}
                            </button>
                          </InputGroupAddon>
                        </InputGroup>
                      </FormControl>
                      <FormMessage className="text-sm" />
                    </FormItem>
                  )}
                />

                <div className="flex items-center gap-4 pt-4">
                  <Button
                    disabled={changePassword.isPending}
                    type="submit"
                    className="h-12 flex-1 rounded-lg bg-primary text-base font-semibold text-white shadow-sm transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 sm:flex-none sm:px-8"
                    translate="no"
                  >
                    {changePassword.isPending ? (
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
                      t("change_password")
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>

          {/* Security Tips Section */}
          <div className="overflow-hidden rounded-xl border border-warning/20 bg-warning/5 p-4 shadow-sm">
            <div className="flex gap-3">
              <svg
                className="h-5 w-5 flex-shrink-0 text-warning"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-amber-900" translate="no">
                  {t("security_tips")}
                </h3>
                <ul className="mt-2 space-y-1 text-sm text-amber-700">
                  <li translate="no">• {t("use_a_strong_unique_password")}</li>
                  <li translate="no">• {t("dont_reuse_passwords_from_other_sites")}</li>
                  <li translate="no">• {t("consider_using_a_password_manager")}</li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
