"use client";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useResendOtp, useVerifyOtp } from "@/apis/queries/auth.queries";
import { useToast } from "@/components/ui/use-toast";
import { setCookie } from "cookies-next";
import Image from "next/image";
import { PUREMOON_TOKEN_KEY } from "@/utils/constants";
import BackgroundImage from "@/public/images/before-login-bg.png";
import LoaderWithMessage from "@/components/shared/LoaderWithMessage";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { fetchMe, fetchUserPermissions } from "@/apis/requests/user.requests";

export default function OtpVerifyPage() {
  const t = useTranslations();
  const { langDir, setUser, setPermissions } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [otp, setOtp] = useState(new Array(4).fill(""));
  const [count, setCount] = useState(120);
  const refs = useRef<HTMLInputElement[]>([]);
  const form = useForm({
    defaultValues: {
      email: "",
      otp: "",
    },
  });

  const verifyOtp = useVerifyOtp();
  const resendOtp = useResendOtp();

  const formatTime = useMemo(
    () =>
      (time: number): string => {
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
      },
    [],
  );

  const startTimer = useCallback(() => {
    if (count === 0) {
      return;
    }
    return setInterval(() => {
      setCount((prevCount) => prevCount - 1);
    }, 1000);
  }, [count]);

  const onSubmit = async (formData: any) => {
    if (otp.join("") === "") {
      toast({
        title: t("otp_is_required"),
        variant: "danger",
      });
      return;
    }
    // TODO: fix z.infer for formvalue
    const combinedOtp = otp.join("");

    if (combinedOtp.length !== 4) {
      toast({
        title: t("otp_length_should_be_n_digits", { n: 4 }),
        variant: "danger",
      });
      return;
    }
    const data = {
      email: formData.email?.toLowerCase(),
      otp: Number(combinedOtp),
    };
    const response = await verifyOtp.mutateAsync(data);

    if (response?.status && response?.accessToken) {
      // store in cookie
      // setCookie(PUREMOON_TOKEN_KEY, response.accessToken);
      setCookie(PUREMOON_TOKEN_KEY, response.accessToken, {
        // 3 days
        expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      });
      
      // Fetch user data and update AuthContext (same as login page)
      try {
        const userRes = await fetchMe();
        if (userRes?.data?.data?.id) {
          setUser({
            id: userRes.data.data.id,
            firstName: userRes.data.data.firstName || '',
            lastName: userRes.data.data.lastName || '',
            tradeRole: userRes.data.data.tradeRole || '',
          });
        }
      } catch (e) {
        // If fetchMe fails, the AuthContext useEffect will try to recover
        console.error("Failed to fetch user after OTP verification:", e);
      }

      // Fetch permissions (optional, same as login page)
      try {
        const permissions = await fetchUserPermissions();
        setPermissions([
          ...(permissions?.data?.data?.userRoleDetail?.userRolePermission || []),
        ]);
      } catch (e) {
        // Silent fail - permissions are optional
      }

      toast({
        title: t("verification_successful"),
        description: response.message,
        variant: "success",
      });
      form.reset();
      setOtp(new Array(4).fill(""));
      sessionStorage.clear();
      router.push("/profile?fromRegister=1");
    } else {
      setOtp(new Array(4).fill(""));
      toast({
        title: t("verification_failed"),
        description: response.message,
        variant: "danger",
      });
    }
  };

  const handleResendOtp = async () => {
    const email = sessionStorage.getItem("email") || "";
    const data = {
      email: email.toLowerCase(),
    };

    if (!data.email) {
      toast({
        title: t("email_is_required"),
        variant: "danger",
      });
      return;
    }
    const response = await resendOtp.mutateAsync(data);

    if (response.status && response.otp) {
      toast({
        title: t("verification_code_sent"),
        description: response.message,
        variant: "success",
      });
      setCount(120);
      setOtp(new Array(4).fill(""));
    } else {
      toast({
        title: t("verification_error"),
        description: response.message,
        variant: "danger",
      });
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number,
  ) => {
    const regex = /[^0-9]/g;
    if (regex.test(e.target.value)) {
      return;
    }
    const { value } = e.target;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp([...newOtp]);
    // Move to next input if current input is filled
    if (value && index < otp.length - 1 && refs.current[index + 1]) {
      refs.current[index + 1].focus();
    }
  };

  const handleClick = (index: number) => {
    if (refs.current[index]) {
      refs.current[index].setSelectionRange(1, 1);
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    // Move to the previous input field on backspace
    if (
      e.key === "Backspace" &&
      !otp[index] &&
      index > 0 &&
      refs.current[index - 1]
    ) {
      refs.current[index - 1].focus();
    }
  };

  useEffect(() => {
    if (window) {
      const storedEmail = sessionStorage.getItem("email");

      if (storedEmail) {
        form.setValue("email", storedEmail.toLowerCase());
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const countDown = startTimer();

    return () => clearInterval(countDown);
  }, [count, startTimer]);

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
              <h2 className="mb-3 text-center text-3xl font-semibold leading-8 text-color-dark sm:text-4xl sm:leading-10" dir={langDir} translate="no">
                {t("verify_otp")}
              </h2>
              <p dir={langDir} translate="no">{t("enter_otp")}</p>
            </div>
            <div className="w-full">
              <Form {...form}>
                <form
                  className="flex flex-wrap"
                  onSubmit={form.handleSubmit(onSubmit)}
                >
                  <div className="mb-4 w-full">
                    <div className="m-auto flex h-auto w-3/4 items-center justify-center gap-x-5 border-0">
                      {otp?.map((value, index) => (
                        <Input
                          value={value}
                          ref={(el) => {
                            if (el) refs.current[index] = el;
                          }}
                          type="text"
                          onChange={(e) => handleChange(e, index)}
                          onClick={() => handleClick(index)}
                          onKeyDown={(e) => handleKeyDown(e, index)}
                          className="h-16 w-16! rounded-lg border-border text-center text-2xl focus-visible:ring-0!"
                          autoFocus={index === 0}
                          key={index}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="mb-4 w-full text-center">
                    <Button
                      disabled={verifyOtp.isPending || resendOtp.isPending}
                      type="submit"
                      className="theme-primary-btn m-auto h-12 rounded bg-dark-orange px-10 text-center text-lg font-bold leading-6"
                      dir={langDir}
                      translate="no"
                    >
                      {verifyOtp.isPending ? (
                        <LoaderWithMessage message={t("please_wait")} />
                      ) : (
                        t("verify")
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
              <div className="mb-4 w-full space-x-2 text-center">
                <span className="text-sm font-medium leading-4 text-light-gray" dir={langDir} translate="no">
                  {t("didnt_receive_otp")}
                </span>
                <Button
                  type="button"
                  variant="link"
                  disabled={
                    verifyOtp.isPending || resendOtp.isPending || count !== 0
                  }
                  onClick={handleResendOtp}
                  className="cursor-pointer p-0 font-medium text-dark-orange"
                  dir={langDir}
                  translate="no"
                >
                  {t("resend")}
                </Button>
              </div>
              {count !== 0 ? (
                <p className="text-center text-sm font-medium leading-4 text-dark-orange" dir={langDir} translate="no">
                  {t("otp_will_expire_in_min_minutes", { min: formatTime(count) })}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
