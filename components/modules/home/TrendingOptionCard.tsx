import { cn } from "@/lib/utils";
import Image from "next/image";
// import Link from "next/link";
import React from "react";
import { MdOutlineImageNotSupported } from "react-icons/md";

type TrendingOptionCardProps = {
  item: any;
  isActiveIndex?: boolean;
  onActiveCategory?: () => void;
};

const TrendingOptionCard: React.FC<TrendingOptionCardProps> = ({
  item,
  isActiveIndex,
  onActiveCategory,
}) => {
  return (
    <button
      type="button"
      className="flex flex-col items-center justify-start border-b border-solid border-transparent p-2 text-xs font-normal capitalize text-light-gray lg:text-sm"
      onClick={onActiveCategory}
    >
      <div className="relative mb-3 h-9 w-9">
        {item?.path ? (
          <Image
            src={item?.path}
            className="mb-3 object-contain"
            fill
            alt={item?.name}
          />
        ) : (
          <MdOutlineImageNotSupported size={36} className="mb-3" />
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

export default TrendingOptionCard;
