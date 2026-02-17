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
import {
  useChangeEmail,
  useChangeEmailVerify,
} from "@/apis/queries/auth.queries";
import { useToast } from "@/components/ui/use-toast";
import Image from "next/image";
import BackgroundImage from "@/public/images/before-login-bg.png";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";

export default function EmailChangeVerifyPage() {
  const t = useTranslations();
  const { langDir } = useAuth();
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

  const changeEmailVerify = useChangeEmailVerify();
  const resendChangeEmailVerify = useChangeEmail();

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
    const response = await changeEmailVerify.mutateAsync(data);

    if (response?.status) {
      toast({
        title: t("update_successful"),
        description: response.message,
        variant: "success",
      });
      form.reset();
      setOtp(new Array(4).fill(""));
      sessionStorage.clear();
      setTimeout(() => {
        router.push("/home");
      }, 3000);
    } else {
      toast({
        title: t("update_failed"),
        description: response.message,
        variant: "danger",
      });
    }
  };

  const handleChangeEmailResendVerify = async () => {
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
    const response = await resendChangeEmailVerify.mutateAsync(data);

    if (response.status && response.otp) {
      toast({
        title: t("verification_code_sent"),
        description: response?.message,
        variant: "success",
      });
      setCount(120);
      setOtp(new Array(4).fill(""));
    } else {
      toast({
        title: t("verification_error"),
        description: response?.message,
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
    //TODO: persist timeer in session storage
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
          <div className="m-auto mb-12 w-11/12 rounded-lg border border-solid border-gray-300 bg-white p-7 shadow-xs sm:p-12 md:w-9/12 lg:w-7/12">
            <div className="text-normal m-auto mb-7 w-full text-center text-sm leading-6 text-light-gray">
              <h2 className="mb-3 text-center text-3xl font-semibold leading-8 text-color-dark sm:text-4xl sm:leading-10" dir={langDir} translate="no">
                {t("verify_otp")}
              </h2>
              <p dir={langDir} translate="no">{t("enter_otp_text")}</p>
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
                          // ref={(el) => el && (refs.current[index] = el)}
                          ref={(el) => {
                            if (el) refs.current[index] = el;
                          }}
                          type="text"
                          onChange={(e) => handleChange(e, index)}
                          onClick={() => handleClick(index)}
                          onKeyDown={(e) => handleKeyDown(e, index)}
                          className="h-16 w-16! rounded-lg border-gray-300 text-center text-2xl focus-visible:ring-0!"
                          autoFocus={index === 0}
                          key={index}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="mb-4 w-full text-center">
                    <Button
                      disabled={
                        changeEmailVerify.isPending ||
                        resendChangeEmailVerify.isPending
                      }
                      type="submit"
                      className="m-auto h-12 rounded bg-dark-orange px-10 text-center text-lg font-bold leading-6 text-white hover:bg-dark-orange hover:opacity-90"
                      dir={langDir}
                      translate="no"
                    >
                      {changeEmailVerify.isPending ||
                      resendChangeEmailVerify.isPending ? (
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
                    changeEmailVerify.isPending ||
                    resendChangeEmailVerify.isPending ||
                    count !== 0
                  }
                  onClick={handleChangeEmailResendVerify}
                  className="cursor-pointer p-0 font-medium text-dark-orange"
                  dir={langDir}
                  translate="no"
                >
                  {t("resend")}
                </Button>
              </div>
              {count !== 0 ? (
                <p className="text-center text-sm font-medium leading-4 text-dark-orange">
                  OTP will expire in {formatTime(count)} minutes
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
