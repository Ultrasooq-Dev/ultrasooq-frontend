import React, { useMemo } from "react";
import Image from "next/image";
import EditIcon from "@/public/images/edit-icon.svg";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";

type InformationSectionProps = {
  userDetails: any;
};

const InformationSection: React.FC<InformationSectionProps> = ({
  userDetails,
}) => {
  const t = useTranslations();
  const { langDir } = useAuth();

  const getSocialLinks = useMemo(() => {
    if (userDetails?.userSocialLink?.length > 0) {
      const socialLinks = userDetails?.userSocialLink?.map(
        (item: any, index: number, array: any[]) => {
          return (
            <div className="flex flex-row items-center" key={item?.id}>
              <a href={item?.link} target="_blank" rel="noreferrer">
                <Image
                  src="/images/share.png"
                  height={20}
                  width={20}
                  alt="share-icon"
                  className="mr-1"
                />
              </a>
              {`${item?.linkType}${index !== array.length - 1 ? ", " : ""}`}
            </div>
          );
        },
      );
      return socialLinks;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userDetails?.userSocialLink?.length]);

  return (
    <div className="w-full border-b-2 border-dashed border-border py-4">
      <div className="flex w-full flex-wrap items-center justify-between pb-5">
        <h2
          className="left-8 text-2xl font-semibold text-color-dark"
          dir={langDir}
          translate="no"
        >
          {t("contact_information")}
        </h2>
        <div className="w-auto">
          <Link
            href="/profile"
            className="flex items-center rounded-md border-0 bg-dark-orange px-3 py-2 text-sm font-medium capitalize leading-6 text-white"
            dir={langDir}
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
      <div className="w-full">
        <div className="w-full">
          <div className="flex w-full flex-wrap py-3.5">
            <div className="mr-1 flex w-4/12 items-center justify-start sm:mr-0 md:w-2/12">
              <span
                className="text-sm font-normal capitalize leading-4 text-muted-foreground"
                dir={langDir}
                translate="no"
              >
                {t("email")}:
              </span>
            </div>
            <div
              className="mr-0 flex w-8/12 items-center justify-start md:w-10/12"
              dir={langDir}
            >
              <p className="text-base font-medium leading-4 text-color-dark">
                {userDetails?.email || "NA"}
              </p>
            </div>
          </div>
          <div className="flex w-full flex-wrap py-3.5">
            <div
              className="mr-0 flex w-2/12 items-center justify-start"
              dir={langDir}
            >
              <span
                className="text-sm font-normal capitalize leading-4 text-muted-foreground"
                translate="no"
              >
                {t("phone")}:
              </span>
            </div>
            <div
              className="mr-0 flex  w-10/12 items-center justify-start"
              dir={langDir}
            >
              <p className="text-base font-medium leading-4 text-color-dark">
                {userDetails?.phoneNumber || "NA"}
              </p>
            </div>
          </div>
          <div className="flex w-full flex-wrap py-3.5">
            <div className="mr-1 flex w-2/12 items-center justify-start sm:mr-0">
              <span
                className="text-sm font-normal capitalize leading-4 text-muted-foreground"
                dir={langDir}
                translate="no"
              >
                {t("social_links")}:
              </span>
            </div>
            <div
              className="mr-0 flex  w-10/12 items-center justify-start"
              dir={langDir}
            >
              <div className="flex gap-x-3 text-base font-medium capitalize leading-4 text-color-dark">
                {getSocialLinks}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InformationSection;
