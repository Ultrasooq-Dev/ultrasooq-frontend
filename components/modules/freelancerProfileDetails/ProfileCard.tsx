import React, { useMemo } from "react";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FREELANCER_UNIQUE_ID } from "@/utils/constants";
import {
  getCurrentDay,
  getCurrentTime,
  getInitials,
  parsedDays,
} from "@/utils/helper";
import { cn } from "@/lib/utils";
import { useUpdatFreelancerActiveStatus } from "@/apis/queries/freelancer.queries";
import { useToast } from "@/components/ui/use-toast";
import EditIcon from "@/public/images/edit-icon.svg";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";

type ProfileCardProps = {
  userDetails: any;
};

const ProfileCard: React.FC<ProfileCardProps> = ({ userDetails }) => {
  const t = useTranslations();
  const { langDir } = useAuth();
  const { toast } = useToast();
  const updateFeelancerAvailabilityStatus = useUpdatFreelancerActiveStatus();

  const memoizedInitials = useMemo(
    () => getInitials(userDetails?.firstName, userDetails?.lastName),
    [userDetails?.firstName, userDetails?.lastName],
  );

  const workingDays = userDetails?.userBranch?.[0]?.workingDays;
  const startTime = userDetails?.userBranch?.[0]?.startTime;
  const endTime = userDetails?.userBranch?.[0]?.endTime;

  const isOnlineToday = useMemo(() => {
    const getActiveDays = parsedDays(workingDays)?.includes(getCurrentDay())
      ? true
      : false;
    const isActiveInCurrentDay =
      startTime <= getCurrentTime && endTime >= getCurrentTime;

    // const lastOnlineDate = new Date("2024-03-25T09:20:42.901Z");
    const lastOnlineDate = new Date(userDetails?.onlineOfflineDateStatus);
    lastOnlineDate.setUTCHours(0, 0, 0, 0);
    const todaysDate = new Date();
    todaysDate.setUTCHours(0, 0, 0, 0);
    const isToday =
      userDetails?.onlineOffline === "1" &&
      todaysDate.getTime() === lastOnlineDate.getTime();

    return isToday || (getActiveDays && isActiveInCurrentDay);
  }, [
    workingDays,
    startTime,
    endTime,
    userDetails?.onlineOfflineDateStatus,
    userDetails?.onlineOffline,
  ]);

  const handleTimeChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!e.target.value) return;
    const getCurrentDateInISO = new Date().toISOString();

    const data: { onlineOffline: string; onlineOfflineDateStatus: string } = {
      onlineOffline: e.target.value,
      onlineOfflineDateStatus: getCurrentDateInISO,
    };

    const response = await updateFeelancerAvailabilityStatus.mutateAsync(data);
    if (response.status && response.data) {
      toast({
        title: t("branch_status_update_successful"),
        description: response.message,
        variant: "success",
      });
    } else {
      toast({
        title: t("branch_status_update_failed"),
        description: response.message,
        variant: "danger",
      });
    }
  };

  return (
    <div className="flex w-full flex-wrap rounded-3xl border border-solid border-gray-300 bg-white p-4 shadow-md md:p-9">
      <div className="relative mx-auto h-40 w-40 rounded-full">
        <Avatar className="h-40 w-40">
          <AvatarImage src={userDetails?.profilePicture} alt="image-icon" />
          <AvatarFallback className="text-5xl font-bold">
            {memoizedInitials}
          </AvatarFallback>
        </Avatar>
        {/* <div className="absolute bottom-2 right-0 z-10 h-11 w-11 rounded-full bg-gray-300">
          <div className="flex h-full w-full cursor-pointer flex-wrap items-center justify-center">
            <Image
              src="/images/camera-icon.png"
              width={20}
              height={20}
              alt="camera-icon"
            />
          </div>
          <input
            type="file"
            id="profile_impage_upload_input"
            accept="image/*"
            name="file"
            className="absolute left-0 top-0 z-10 h-full w-full cursor-pointer opacity-0"
          />
        </div> */}
      </div>
      <div className="w-full pl-3 md:w-[calc(100%-10rem)] md:pl-7">
        <div className="flex w-full flex-wrap items-center justify-between">
          <h2 className="left-8 text-3xl font-semibold text-color-dark" translate="no">
            {userDetails?.firstName || "NA"} {userDetails?.lastName}
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
        <div className="mt-3 h-auto w-full">
          <ul className="flex flex-wrap items-center justify-start">
            <li className="justify-starts my-1.5 mr-3.5 flex items-center text-base font-normal leading-5 text-color-dark">
              <Image
                src="/images/profile-mail-icon.svg"
                className="mr-1.5"
                height={14}
                width={17}
                alt="profile-mail-icon"
              />
              <a href="mailto:john.rosensky@gmail.com">
                {userDetails?.email || "NA"}
              </a>
            </li>
            <li className="justify-starts my-1.5 mr-3.5 flex items-center text-base font-normal leading-5 text-color-dark">
              <Image
                src="/images/profile-call-icon.svg"
                className="mr-1.5"
                height={14}
                width={15}
                alt="profile-mail-icon"
              />
              <a href="tel:1 000 0000 0000">
                {userDetails?.phoneNumber || "NA"}
              </a>
            </li>
          </ul>
        </div>
        <div className="text-normal mt-5 w-full text-sm font-normal leading-4 text-gray-500">
          <p dir={langDir} translate="no">{t("business_type")}</p>
          {userDetails?.userBranch?.[0]?.userBranchBusinessType?.map(
            (item: any) => (
              <span
                key={item?.id}
                className="mr-3 mt-4 inline-block rounded bg-gray-300 p-4 py-2.5 text-base font-medium leading-5 text-dark-cyan"
                dir={langDir}
              >
                {item?.userBranch_BusinessType_Tag?.tagName}
              </span>
            ),
          )}
        </div>
        <div className="mt-5 flex w-full flex-wrap items-center justify-between">
          <div className="my-2 text-sm font-normal leading-4 text-gray-500">
            <p dir={langDir} translate="no">
              {t("freelancer_id")}:
              <span className="text-base font-medium leading-4 text-gray-600" dir={langDir}>
                {userDetails?.uniqueId
                  ? `${FREELANCER_UNIQUE_ID}${userDetails?.uniqueId}`
                  : "NA"}
              </span>
            </p>
          </div>
          <div className="flex">
            <div className="my-2 flex flex-wrap items-center justify-between">
              <span
                className={cn(
                  "mr-2.5 text-sm font-bold leading-6",
                  isOnlineToday ? "text-light-green" : "text-destructive",
                )}
              >
                {isOnlineToday ? "Online" : "Offline"}
              </span>
            </div>
            <select
              className="h-12! w-full rounded border border-gray-300! px-3 text-sm focus-visible:ring-0!"
              onChange={handleTimeChange}
              value={userDetails?.onlineOffline || "0"}
            >
              <option value="" dir={langDir} translate="no">{t("select")}</option>
              <option value="0" disabled={userDetails?.onlineOffline === "0"} dir={langDir}>
                Offline
              </option>
              <option value="1" disabled={userDetails?.onlineOffline === "1"} dir={langDir}>
                Online
              </option>
              {/* <option value="">{isOnlineToday ? "Offline" : "Online"}</option>
              {HOURS_24_FORMAT.map((hour: string, index: number) => (
                <option
                  key={index}
                  value={hour}
                  disabled={
                    !isOnlineToday
                      ? getCurrentTime > hour
                      : isOnlineToday
                        ? getCurrentTime < hour
                        : false
                  }
                >
                  {getAmPm(hour)}
                </option>
              ))} */}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
