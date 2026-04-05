import Image from "next/image";
import React, { useMemo } from "react";
import { FaStar } from "react-icons/fa";
import { FaRegStar } from "react-icons/fa";
import { Button } from "../ui/button";
import AvatarPlaceholder from "@/public/images/no-user-image.png";
import EditIcon from "@/public/images/edit-rfq.png";

type UserRatingCardProps = {
  rating: number;
  title: string;
  review: string;
  date: string;
  name: string;
  profilePicture: string;
  isBuyer: boolean;
  onEdit: () => void;
};

const UserRatingCard: React.FC<UserRatingCardProps> = ({
  rating,
  title,
  review,
  date,
  name,
  profilePicture,
  isBuyer,
  onEdit,
}) => {
  function getRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMilliseconds = now.getTime() - date.getTime();

    // Define time intervals in milliseconds
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;
    const week = 7 * day;
    const month = 30 * day;
    const year = 365 * day;

    // Calculate the difference in terms of years, months, days, weeks, hours, and minutes
    const yearsAgo = Math.floor(diffInMilliseconds / year);
    const monthsAgo = Math.floor(diffInMilliseconds / month);
    const weeksAgo = Math.floor(diffInMilliseconds / week);
    const daysAgo = Math.floor(diffInMilliseconds / day);
    const hoursAgo = Math.floor(diffInMilliseconds / hour);
    const minutesAgo = Math.floor(diffInMilliseconds / minute);

    // Get the relative time format
    const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

    // Convert to relative time string
    if (yearsAgo >= 2) {
      return rtf.format(-yearsAgo, "year");
    } else if (yearsAgo === 1) {
      return "1 year ago";
    } else if (monthsAgo >= 2) {
      return rtf.format(-monthsAgo, "month");
    } else if (monthsAgo === 1) {
      return "1 month ago";
    } else if (weeksAgo >= 2) {
      return rtf.format(-weeksAgo, "week");
    } else if (weeksAgo === 1) {
      return "1 week ago";
    } else if (daysAgo >= 2) {
      return rtf.format(-daysAgo, "day");
    } else if (daysAgo === 1) {
      return "1 day ago";
    } else if (hoursAgo >= 2) {
      return rtf.format(-hoursAgo, "hour");
    } else if (hoursAgo === 1) {
      return "1 hour ago";
    } else if (minutesAgo >= 2) {
      return rtf.format(-minutesAgo, "minute");
    } else if (minutesAgo === 1) {
      return "1 minute ago";
    } else {
      return "just now";
    }
  }

  const calculateRatings = useMemo(
    () => (rating: number) => {
      const stars = [];
      for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
          stars.push(<FaStar key={i} color="#FFC107" size={20} />);
        } else {
          stars.push(<FaRegStar key={i} color="#FFC107" size={20} />);
        }
      }
      return stars;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rating],
  );

  return (
    <div className="w-full rounded-2xl border border-solid border-border px-5 py-5">
      <div className="flex w-full flex-wrap items-start justify-between">
        <div className="relative h-12 w-12 rounded-full">
          <Image
            src={profilePicture || AvatarPlaceholder}
            alt="review-icon"
            fill
            className="rounded-full"
          />
        </div>
        <div className="w-[calc(100%-3rem)] pl-3.5 text-sm font-normal leading-5 text-muted-foreground">
          <div className="flex w-full items-start justify-between">
            <h4 className="text-base font-semibold text-color-dark">{name}</h4>
            {isBuyer ? (
              <Button variant="ghost" className="p-2" onClick={onEdit}>
                <Image
                  src={EditIcon}
                  alt="review-dot-icon"
                  height={21}
                  width={21}
                />
              </Button>
            ) : null}
          </div>
          <div className="w-full">
            <h5 className="mb-1 text-xs font-normal text-muted-foreground">1 review</h5>
            <div className="flex w-full flex-wrap items-start gap-2 text-xs leading-5 text-muted-foreground">
              <div className="flex">{calculateRatings(rating)}</div>
              <span className="ml-1">{getRelativeTime(date)}</span>
            </div>
          </div>
        </div>
        <div className="w-full pt-3 ">
          <h3>{title}</h3>
          <p className="text-sm font-normal leading-6 text-muted-foreground">
            {review}
            {/* <a href="#" className="font-semibold">
              More.
            </a> */}
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserRatingCard;
