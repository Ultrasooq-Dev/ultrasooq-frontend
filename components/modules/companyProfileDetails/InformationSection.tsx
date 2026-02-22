import Image from "next/image";
import React, { useMemo } from "react";
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
    <div className="w-full border-b-2 border-dashed border-border pb-4 sm:py-4">
      <div className="flex w-full flex-wrap items-center justify-between gap-2 pb-5 sm:gap-0">
        <h2 className="left-8 text-xl font-semibold text-color-dark sm:text-2xl" dir={langDir} translate="no">
          {t("company_information")}
        </h2>
        <div className="w-auto">
          <Link
            href={`/company-profile/edit-profile?userId=${userDetails?.id}`}
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
      
      {/* Registration Address Section */}
      <div className="w-full">
        <div className="w-full">
          <div className="mb-4 w-full">
            <label className="text-lg font-bold text-color-dark" dir={langDir} translate="no">
              {t("registration_address")}
            </label>
          </div>
          <div className="flex w-full flex-wrap">
            <div className="w-full sm:w-7/12">
              <div className="flex w-full flex-wrap py-4">
                <div className="mr-1 flex w-4/12 items-center justify-start sm:mr-0">
                  <span className="text-sm font-normal capitalize leading-4 text-muted-foreground" dir={langDir} translate="no">
                    {t("email")}:
                  </span>
                </div>
                <div className="mr-1 flex w-8/12  items-center justify-start sm:mr-0">
                  <p className="text-base font-medium leading-4 text-color-dark" dir={langDir}>
                    {userDetails?.email || "N/A"}
                  </p>
                </div>
              </div>
            </div>
            <div className="w-full sm:w-5/12">
              <div className="flex w-full flex-wrap py-4">
                <div className="mr-1 flex w-5/12 items-center justify-start sm:mr-0">
                  <span className="text-sm font-normal capitalize leading-4 text-muted-foreground" dir={langDir} translate="no">
                    {t("phone")}:
                  </span>
                </div>
                <div className="mr-1 flex w-7/12  items-center justify-start sm:mr-0" dir={langDir}>
                  <p className="text-base font-medium leading-4 text-color-dark">
                    {userDetails?.phoneNumber || "N/A"}
                  </p>
                </div>
              </div>
            </div>
            <div className="w-full sm:w-7/12">
              <div className="flex w-full flex-wrap py-4">
                <div className="mr-1 flex w-4/12 items-center justify-start sm:mr-0">
                  <span className="text-sm font-normal capitalize leading-4 text-muted-foreground" dir={langDir} translate="no">
                    {t("social_links")}:
                  </span>
                </div>
                <div className="mr-1 flex w-8/12  items-center justify-start sm:mr-0">
                  <div className="flex gap-x-3 text-base font-medium capitalize leading-4 text-color-dark" dir={langDir}>
                    {getSocialLinks || "N/A"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InformationSection;
