import React from "react";
import Image from "next/image";
import PlaceholderImage from "@/public/images/product-placeholder.png";
import validator from "validator";

type ManageProductImageProps = {
  productImage: string | null;
};

const ManageProductImage: React.FC<ManageProductImageProps> = ({ productImage }) => {
  return (
    <div className="relative h-24 w-24 overflow-hidden rounded-lg border border-border">
      {productImage && validator.isURL(productImage) ? (
        productImage.includes("ultrasooq.s3.amazonaws.com") ? (
          <Image
            src={productImage}
            alt="product-image"
            fill
            sizes="96px"
            className="object-cover"
            blurDataURL="/images/product-placeholder.png"
            placeholder="blur"
          />
        ) : (
          <img
            src={productImage}
            alt="product-image"
            className="h-full w-full object-cover"
            onError={(e) => {
              e.currentTarget.src = PlaceholderImage.src;
            }}
          />
        )
      ) : (
        <Image
          src={PlaceholderImage}
          alt="product-image"
          fill
          sizes="96px"
          className="object-cover"
          blurDataURL="/images/product-placeholder.png"
          placeholder="blur"
        />
      )}
    </div>
  );
};

export default ManageProductImage;
