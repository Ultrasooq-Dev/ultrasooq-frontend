import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "next-intl";
import Image from "next/image";
import React, { useMemo } from "react";

type VendorInformationSectionProps = {
  vendor: any;
};

const VendorInformationSection: React.FC<VendorInformationSectionProps> = ({
  vendor,
}) => {
  const t = useTranslations();
  const { langDir } = useAuth();
  
  const getSocialLinks = useMemo(() => {
    if (vendor?.userSocialLink?.length > 0) {
      const socialLinks = vendor?.userSocialLink?.map(
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
  }, [vendor?.userSocialLink?.length]);

  return (
    <div className="w-full border-b-2 border-dashed border-gray-200 py-4">
      <div className="flex w-full flex-wrap items-center justify-between pb-5">
        <h2 className="left-8 text-2xl font-semibold text-color-dark" dir={langDir} translate="no">
          {t("company_information")}
        </h2>
      </div>
      <div className="w-full">
        <div className="w-full">
          <div className="mb-4 w-full">
            <label className="text-lg font-bold text-color-dark" dir={langDir} translate="no">
              {t("registration_address")}
            </label>
          </div>
          <div className="flex w-full flex-wrap">
            <div className="w-7/12">
              <div className="flex w-full flex-wrap py-4">
                <div className="mr-1 flex w-4/12 items-center justify-start sm:mr-0">
                  <span className="text-sm font-normal capitalize leading-4 text-gray-500" dir={langDir} translate="no">
                    {t("email")}:
                  </span>
                </div>
                <div className="mr-1 flex w-8/12  items-center justify-start sm:mr-0">
                  <p className="text-base font-medium leading-4 text-color-dark" dir={langDir}>
                    {vendor?.email || "N/A"}
                  </p>
                </div>
              </div>
            </div>
            <div className="w-5/12">
              <div className="flex w-full flex-wrap py-4">
                <div className="mr-1 flex w-5/12 items-center justify-start sm:mr-0">
                  <span className="text-sm font-normal capitalize leading-4 text-gray-500" dir={langDir} translate="no">
                    {t("phone")}:
                  </span>
                </div>
                <div className="mr-1 flex w-7/12  items-center justify-start sm:mr-0">
                  <p className="text-base font-medium leading-4 text-color-dark" dir={langDir}>
                    {vendor?.phoneNumber || "N/A"}
                  </p>
                </div>
              </div>
            </div>
            <div className="w-7/12">
              <div className="flex w-full flex-wrap py-4">
                <div className="mr-1 flex w-4/12 items-center justify-start sm:mr-0">
                  <span className="text-sm font-normal capitalize leading-4 text-gray-500" dir={langDir} translate="no">
                    {t("social_links")}:
                  </span>
                </div>
                <div className="mr-1 flex w-8/12  items-center justify-start sm:mr-0">
                  <div className="flex gap-x-3 text-base font-medium capitalize leading-4 text-color-dark" dir={langDir}>
                    {getSocialLinks}
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

export default VendorInformationSection;
