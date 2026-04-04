import React, { useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import EditIcon from "@/public/images/edit-icon.svg";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import ControlledRichTextEditor from "@/components/shared/Forms/ControlledRichTextEditor";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form } from "@/components/ui/form";
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

type MoreInformationSectionProps = {
  userDetails: any;
};

const MoreInformationSection: React.FC<MoreInformationSectionProps> = ({
  userDetails,
}) => {
  const t = useTranslations();
  const { langDir } = useAuth();
  const formSchema = (t: any) => z.object({
    aboutUs: z.array(z.any()).optional(),
  })
  const form = useForm({
    resolver: zodResolver(formSchema(t)),
    defaultValues: {
      aboutUs: []
    },
  });
  useEffect(() => {
    const raw = userDetails?.userProfile?.[0]?.aboutUs;
    let parsed: any[] = [];
    try {
      parsed = raw ? JSON.parse(raw) : [];
    } catch (error) {
      parsed = [];
    }
    if (parsed) {
      form.reset({
        aboutUs: parsed
      });
    }
  }, [userDetails?.userProfile]);

  return (
    <div className="w-full py-4">
      <div className="flex w-full flex-wrap items-center justify-between pb-5">
        <div className="mb-4 flex w-full items-center justify-between">
          <h2 className="text-lg font-bold text-color-dark" dir={langDir} translate="no">
            {t("more_information")}
          </h2>
          <div className="w-auto">
            <Link
              href={`/company-profile/edit-profile?userId=${userDetails?.id}`}
              className="flex items-center rounded-md border-0 bg-dark-orange px-3 py-2 text-sm font-medium capitalize leading-6 text-white"
              translate="no"
            >
              <Image
                src={EditIcon}
                height={18}
                width={18}
                className="mr-1"
                alt="edit-icon"
              />
              {t("edit")}
            </Link>
          </div>
        </div>
      </div>
      <div className="w-full">
        <div className="flex w-full flex-wrap">
          <div className="w-7/12">
            <div className="flex w-full flex-wrap py-4">
              <div className="mr-1 flex w-4/12 items-center justify-start sm:mr-0">
                <span className="text-sm font-normal capitalize leading-4 text-muted-foreground" dir={langDir} translate="no">
                  {t("year_of_establishment")}:
                </span>
              </div>
              <div className="mr-1 flex w-8/12  items-center justify-start sm:mr-0">
                <p className="text-base font-medium leading-4 text-color-dark">
                  {userDetails?.userProfile?.[0]?.yearOfEstablishment || "NA"}
                </p>
              </div>
            </div>
          </div>
          <div className="w-5/12">
            <div className="flex w-full flex-wrap py-4">
              <div className="mr-1 flex w-5/12 items-center justify-start sm:mr-0">
                <span className="text-sm font-normal capitalize leading-4 text-muted-foreground" dir={langDir} translate="no">
                  {t("no_of_employees")}:
                </span>
              </div>
              <div className="mr-1 flex w-7/12  items-center justify-start sm:mr-0">
                <p className="text-base font-medium leading-4 text-color-dark">
                  {userDetails?.userProfile?.[0]?.totalNoOfEmployee || "NA"}
                </p>
              </div>
            </div>
          </div>
          <div className="w-full">
            <div className="flex w-full flex-wrap items-start py-4">
              <div className="mr-1 flex w-2/12 items-center justify-start sm:mr-0">
                <span className="text-sm font-normal capitalize leading-4 text-muted-foreground" dir={langDir} translate="no">
                  {t("about_us")}:
                </span>
              </div>
            </div>

            <Form {...form}>
              <ControlledRichTextEditor
                name="aboutUs"
                label=""
                readOnly={true}
              />
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoreInformationSection;
