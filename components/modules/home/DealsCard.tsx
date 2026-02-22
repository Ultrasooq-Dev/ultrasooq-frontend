import React from "react";
import Image from "next/image";
import StarIcon from "@/public/images/star.png";
import { useAuth } from "@/context/AuthContext";

type DealsCardProps = {
  item: any;
};

const DealsCard: React.FC<DealsCardProps> = ({ item }) => {
  const { currency } = useAuth();

  return (
    <div className="relative border border-solid border-transparent px-2 py-1 pt-7 hover:border-border">
      {item?.discount ? (
        <div className="absolute right-2.5 top-2.5 inline-block rounded bg-dark-orange px-2.5 py-2 text-lg font-medium capitalize leading-5 text-white">
          <span>{item?.discount}</span>
        </div>
      ) : null}
      <div className="flex h-40 w-full items-center justify-center lg:h-52">
        <Image
          src={item?.path}
          alt={item?.path}
          height={0}
          width={0}
          className="h-36 w-36 object-contain"
        />
      </div>
      <div className="relative w-full text-sm font-normal capitalize text-color-blue lg:text-base">
        <h6 className="mb-2.5 border-b border-solid border-border pb-2.5 text-xs font-normal uppercase text-color-dark">
          {item?.name}
        </h6>
        <div className="mt-2.5 w-full">
          <h4 className="font-lg font-normal uppercase text-olive-green">
            {currency.symbol}{item?.offerPrice}
          </h4>
        </div>
        <p>
          <a href="#">{item?.description}</a>
        </p>
        <Image
          src={StarIcon}
          className="mt-3"
          width={85}
          height={15}
          alt="star-icon"
        />
        <div className="mt-3 h-3 w-full bg-muted">
          <div className="h-full w-4/5 bg-color-yellow"></div>
        </div>
        <span className="w-full text-sm font-normal capitalize text-light-gray">
          Sold: 10
        </span>
      </div>
    </div>
  );
};

export default DealsCard;
