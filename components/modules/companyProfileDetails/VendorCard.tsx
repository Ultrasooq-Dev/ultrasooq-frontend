import Image from "next/image";
import React from "react";
import NoImagePlaceholder from "@/public/images/no-image.jpg";
import { COMPANY_UNIQUE_ID } from "@/utils/constants";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";

type VendorCardProps = {
  vendor: any;
  isLoading: boolean;
};

const VendorCard: React.FC<VendorCardProps> = ({ vendor }) => {
  const t = useTranslations();
  const { langDir, currency } = useAuth();

  return (
    <div className="flex w-full flex-wrap rounded-3xl border border-solid border-gray-300 bg-white p-4 shadow-md md:p-9">
      <div className="relative h-40 w-40 rounded-2xl">
        <Image
          src={
            vendor?.profilePicture ? vendor.profilePicture : NoImagePlaceholder
          }
          alt="image-icon"
          className="rounded-2xl object-cover"
          fill
          sizes="(100vw, 100vh)"
        />
      </div>

      <div className="w-full pl-3 md:w-[calc(100%-10rem)] md:pl-7">
        <div className="flex w-full flex-wrap items-center justify-between">
          <h2 className="left-8 text-3xl font-semibold text-color-dark">
            {vendor?.firstName} {vendor?.lastName}
          </h2>
        </div>
        <div className="mt-3 h-auto w-full"></div>
        <div className="text-normal mt-4 w-full text-sm font-normal leading-4 text-gray-500">
          <p dir={langDir} translate="no">
            {t("annual_purchasing_volume")}:{" "}
            <span className="font-bold text-dark-cyan">
              {vendor?.userProfile?.[0]?.annualPurchasingVolume
                ? `${currency.symbol}${vendor.userProfile[0].annualPurchasingVolume}`
                : "0"}
            </span>
          </p>
        </div>
        <div className="text-normal mt-4 w-full text-sm font-normal leading-4 text-gray-500">
          <h5 dir={langDir} translate="no">{t("business_type")}</h5>
          <div className="tagLists">
            <div className="tagItem">
              {vendor?.userProfile
                ?.map((item: any) => item?.userProfileBusinessType)
                ?.flat()
                ?.map((item: any) => (
                  <div key={item?.id} className="tagIbox mr-2">
                    {item?.userProfileBusinessTypeTag?.tagName}
                  </div>
                ))}
            </div>
          </div>
        </div>
        <div className="mt-4 flex w-full flex-wrap items-center justify-between">
          <div className="my-2 text-sm font-normal leading-4 text-gray-500">
            <p dir={langDir} translate="no">
              {t("company_id")}:
              <span className="text-base font-medium leading-4 text-gray-600">
                {vendor?.uniqueId
                  ? `${COMPANY_UNIQUE_ID}${vendor?.uniqueId}`
                  : "NA"}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorCard;
