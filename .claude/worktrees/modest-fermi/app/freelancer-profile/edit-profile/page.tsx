"use client";
import { useUpdateFreelancerProfile } from "@/apis/queries/freelancer.queries";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { useMe } from "@/apis/queries/user.queries";
import ControlledRichTextEditor from "@/components/shared/Forms/ControlledRichTextEditor";
import { handleDescriptionParse } from "@/utils/helper";
import BackgroundImage from "@/public/images/before-login-bg.png";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";

const formSchema = z.object({
  aboutUs: z.string().trim().optional(),
  aboutUsJson: z.array(z.any()).optional(),
});

export default function EditProfilePage() {
  const t = useTranslations();
  const { langDir } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      aboutUs: "",
      aboutUsJson: undefined,
    },
  });

  const me = useMe();
  const updateFreelancerProfile = useUpdateFreelancerProfile();

  const onSubmit = async (formData: z.infer<typeof formSchema>) => {
    const data = {
      aboutUs: formData.aboutUsJson
        ? JSON.stringify(formData.aboutUsJson)
        : undefined,
      profileType: "FREELANCER",
      userProfileId: me.data?.data?.userProfile?.[0]?.id as number,
    };

    // return;
    const response = await updateFreelancerProfile.mutateAsync(data);

    if (response.status && response.data) {
      toast({
        title: t("profile_edit_successful"),
        description: response.message,
        variant: "success",
      });
      form.reset();
      router.push("/freelancer-profile-details");
    } else {
      toast({
        title: t("profile_edit_failed"),
        description: response.message,
        variant: "danger",
      });
    }
  };

  useEffect(() => {
    if (me.data?.data) {
      form.reset({
        aboutUs: me.data?.data?.userProfile?.[0]?.aboutUs || "",
        aboutUsJson: me.data?.data?.userProfile?.[0]?.aboutUs
          ? handleDescriptionParse(me.data?.data?.userProfile?.[0]?.aboutUs)
          : undefined,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me.data?.data, me.data?.status]);

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
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="m-auto mb-12 w-11/12 rounded-lg border border-solid border-border bg-card p-6 shadow-xs sm:p-8 md:w-10/12 lg:w-10/12 lg:p-12"
            >
              <div className="text-normal m-auto mb-7 w-full text-center text-sm leading-6 text-light-gray">
                <h2 className="mb-3 text-center text-3xl font-semibold leading-8 text-color-dark sm:text-4xl sm:leading-10" dir={langDir} translate="no">
                  {t("my_profile")}
                </h2>
              </div>
              <div className="mb-5">
                <div className="mb-4 w-full">
                  <div className="mt-2.5 w-full border-b-2 border-dashed border-border">
                    <label className="mb-3.5 block text-left text-lg font-medium capitalize leading-5 text-color-dark" dir={langDir} translate="no">
                      {t("freelancer_information")}
                    </label>
                  </div>
                </div>

                <ControlledRichTextEditor label="About Us" name="aboutUsJson" />
              </div>

              <Button
                disabled={updateFreelancerProfile.isPending}
                type="submit"
                className="h-12 w-full rounded bg-dark-orange text-center text-lg font-bold leading-6 text-white hover:bg-dark-orange hover:opacity-90"
                dir={langDir}
                translate="no"
              >
                {updateFreelancerProfile.isPending ? (
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
                  "Edit changes"
                )}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </section>
  );
}
