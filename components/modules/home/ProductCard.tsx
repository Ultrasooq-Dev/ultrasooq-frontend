import React from "react";
import Image from "next/image";
import StarIcon from "@/public/images/star.png";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

type ProductCardProps = {
  item: any;
};

const ProductCard: React.FC<ProductCardProps> = ({ item }) => {
  const { currency } = useAuth();
  return (
    <div className="relative border border-solid border-transparent px-2 py-1 pt-7 hover:border-gray-300">
      {item?.discount ? (
        <div className="absolute right-2.5 top-2.5 inline-block rounded bg-dark-orange px-2.5 py-2 text-lg font-medium capitalize leading-5 text-white">
          <span>{currency.symbol}{item?.discount}</span>
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
        <h6 className="mb-2.5 border-b border-solid border-gray-300 pb-2.5 text-xs font-normal uppercase text-color-dark">
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
        <span
          className={cn(
            item?.discount ? "text-dark-orange" : "text-light-gray",
            "mr-1 w-auto text-base font-normal",
          )}
        >
          {currency.symbol}{item?.productPrice}
        </span>
        {item?.discount ? (
          <span className="w-auto text-base font-normal text-light-gray line-through">
            {currency.symbol}{item?.productPrice}
          </span>
        ) : null}
      </div>
    </div>
  );
};

export default ProductCard;
