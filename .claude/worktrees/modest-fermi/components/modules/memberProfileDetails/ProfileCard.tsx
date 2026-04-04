import React, { useMemo } from "react";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MEMBER_UNIQUE_ID } from "@/utils/constants";
import {
    getCurrentDay,
    getCurrentTime,
    getInitials,
    parsedDays,
} from "@/utils/helper";
import { cn } from "@/lib/utils";
import EditIcon from "@/public/images/edit-icon.svg";
import Link from "next/link";

type ProfileCardProps = {
    userDetails: any;
};

const ProfileCard: React.FC<ProfileCardProps> = ({ userDetails }) => {
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

    return (
        <div className="flex w-full flex-wrap rounded-3xl border border-solid border-border bg-card p-4 shadow-md md:p-9">
            <div className="relative mx-auto h-40 w-40 rounded-full">
                <Avatar className="h-40 w-40">
                    <AvatarImage src={userDetails?.profilePicture} alt="image-icon" />
                    <AvatarFallback className="text-5xl font-bold">
                        {memoizedInitials}
                    </AvatarFallback>
                </Avatar>
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
                        >
                            <Image
                                src={EditIcon}
                                height={18}
                                width={18}
                                className="mr-1"
                                alt="edit-icon"
                            />
                            edit
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
                <div className="mt-5 flex w-full flex-wrap items-center justify-between">
                    <div className="my-2 text-sm font-normal leading-4 text-muted-foreground">
                        <p>
                            Member ID:&nbsp;
                            <span className="text-base font-medium leading-4 text-muted-foreground">
                                {userDetails?.uniqueId
                                    ? `${MEMBER_UNIQUE_ID}${userDetails?.uniqueId}`
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
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileCard;