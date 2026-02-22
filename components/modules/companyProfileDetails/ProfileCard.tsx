import React, { useMemo } from "react";
import Image from "next/image";
import { getCurrentDay, getCurrentTime, parsedDays } from "@/utils/helper";
import { COMPANY_UNIQUE_ID } from "@/utils/constants";
import { cn } from "@/lib/utils";
import EditIcon from "@/public/images/edit-icon.svg";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";

type ProfileCardProps = {
  userDetails: any;
};

const ProfileCard: React.FC<ProfileCardProps> = ({ userDetails }) => {
  const t = useTranslations();
  const { langDir, currency } = useAuth();

  const isOnlineToday = useMemo(() => {
    const getActiveDays = userDetails?.userBranch
      ?.map((item: any) => {
        return parsedDays(item?.workingDays)?.includes(getCurrentDay());
      })
      .includes(true);

    const isActiveInCurrentDay = userDetails?.userBranch
      ?.map((item: any) => {
        return (
          item?.startTime <= getCurrentTime && item?.endTime >= getCurrentTime
        );
      })
      .includes(true);

    return getActiveDays && isActiveInCurrentDay;
  }, [
    userDetails?.userBranch,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    userDetails?.userBranch?.map((item: any) => item?.workingDays),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    userDetails?.userBranch?.map((item: any) => item?.startTime),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    userDetails?.userBranch?.map((item: any) => item?.endTime),
  ]);

  return (
    <div className="flex w-full flex-wrap rounded-3xl border border-solid border-gray-300 bg-white p-4 shadow-md md:p-9">
      <div className="relative h-24 w-24 rounded-2xl md:h-40 md:w-40">
        <Image
          src={
            userDetails?.profilePicture
              ? userDetails.profilePicture
              : "/images/no-image.jpg"
          }
          alt="image-icon"
          className="rounded-2xl object-cover"
          fill
          sizes="(100vw, 100vh)"
        />
      </div>
      {/* <div className="relative mt-4 h-40 w-40 rounded-full">
        <div className="h-full w-full overflow-hidden rounded-2xl">
          <img
            src="images/company-logo.png"
            className="h-full w-full object-cover"
          />
        </div>
      </div> */}
      <div className="w-full pl-0 md:w-[calc(100%-10rem)] md:pl-7">
        <div className="flex w-full flex-wrap items-center justify-between">
          <h2 className="left-8 text-xl font-semibold text-color-dark md:text-3xl" translate="no">
            {userDetails?.firstName || "NA"} {userDetails?.lastName}
          </h2>
          {userDetails?.userBranch?.length ? (
            <div className="w-auto">
              <Link
                // href={`/company-profile/edit-profile?userId=${userDetails?.id}`}
                href="/profile"
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
          ) : null}
        </div>
        <div className="mt-3 h-auto w-full"></div>
        <div className="text-normal md-2 w-full text-sm font-normal leading-4 text-gray-500 md:mt-4">
          <p dir={langDir}>
            <span translate="no">{t("annual_purchasing_volume")}:{" "}</span>
            <span className="font-bold text-dark-cyan">
              {userDetails?.userProfile?.[0]?.annualPurchasingVolume
                ? `${currency.symbol}${userDetails.userProfile[0].annualPurchasingVolume}`
                : "NA"}
            </span>
          </p>
        </div>
        <div className="text-normal mt-2 w-full text-sm font-normal leading-4 text-gray-500 md:mt-4">
          <p dir={langDir} translate="no">{t("business_type")}</p>
          {userDetails?.userProfile?.[0]?.userProfileBusinessType?.map(
            (item: any) => (
              <span
                key={item?.id}
                className="mr-3 mt-4 inline-block rounded bg-gray-300 p-2 text-sm font-semibold leading-5 text-dark-cyan md:p-4 md:py-2.5 md:text-base"
              >
                {item?.userProfileBusinessTypeTag?.tagName}
              </span>
            ),
          )}
        </div>
        <div className="mt-4 flex w-full flex-wrap items-center justify-between">
          <div className="my-2 text-sm font-normal leading-4 text-gray-500">
            <p dir={langDir}>
              <span translate="no">{t("company_id")}:</span>
              <span className="text-base font-medium leading-4 text-gray-600">
                {userDetails?.uniqueId
                  ? `${COMPANY_UNIQUE_ID}${userDetails?.uniqueId}`
                  : "NA"}
              </span>
            </p>
          </div>
          <div className="my-2 flex flex-wrap items-center justify-between">
            <span
              className={cn(
                "mr-2.5 text-sm font-bold leading-6",
                isOnlineToday ? "text-light-green" : "text-destructive",
              )}
              dir={langDir}
            >
              {isOnlineToday ? "Online" : "Offline"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
