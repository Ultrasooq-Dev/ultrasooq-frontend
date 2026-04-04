import React from "react";
import Image from "next/image";
import { MdOutlineImageNotSupported } from "react-icons/md";
// import Link from "next/link";
import { cn } from "@/lib/utils";

type TrendingCardProps = {
  item: any;
  isActiveIndex?: boolean;
  onActiveCategory?: () => void;
};

const TrendingCard: React.FC<TrendingCardProps> = ({
  item,
  isActiveIndex,
  onActiveCategory,
}) => {
  return (
    <button
      type="button"
      className="flex flex-col items-center justify-start p-2 text-xs font-normal capitalize text-light-gray lg:text-base"
      onClick={onActiveCategory}
    >
      <div className="relative mb-3 h-20 w-20">
        {item?.path ? (
          <Image
            src={item?.path}
            className="object-contain"
            fill
            alt={item?.name}
          />
        ) : (
          <MdOutlineImageNotSupported size={80} className="mb-3" />
        )}
      </div>
      <span
        className={cn(
          "text-beat text-center",
          isActiveIndex ? "text-dark-orange" : "",
        )}
      >
        {item?.name}
      </span>
    </button>
  );
};

export default TrendingCard;
