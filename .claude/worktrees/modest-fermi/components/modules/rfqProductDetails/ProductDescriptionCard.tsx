import React, { useEffect, useMemo, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { FaStar } from "react-icons/fa";
import { FaRegStar } from "react-icons/fa";
import SecurePaymentIcon from "@/public/images/securePaymenticon.svg";
import SupportIcon from "@/public/images/support-24hr.svg";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import MinusIcon from "@/public/images/upDownBtn-minus.svg";
import PlusIcon from "@/public/images/upDownBtn-plus.svg";
import { useTranslations } from "next-intl";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";

type ProductDescriptionCardProps = {
  productId: string;
  productName: string;
  productType?: string;
  brand: string;
  productPrice: string;
  offerPrice: string;
  skuNo: string;
  productTags: any[];
  category: string;
  productShortDescription: any[];
  productQuantity: number;
  offerPriceFrom?: number;
  offerPriceTo?: number;
  productNote?: string
  productReview: { rating: number }[];
  onAdd: (
    args0: number,
    args1: number,
    args2: "add" | "remove",
    args3?: number,
    args4?: number,
    args5?: string,
  ) => void;
  isLoading: boolean;
  soldBy: string;
  soldByTradeRole: string;
  userId?: number;
  sellerId?: number;
};

const ProductDescriptionCard: React.FC<ProductDescriptionCardProps> = ({
  productId,
  productName,
  productType,
  brand,
  productPrice,
  offerPrice,
  skuNo,
  productTags,
  category,
  productShortDescription,
  productQuantity = 0, // Default to 1 if undefined
  offerPriceFrom,
  offerPriceTo,
  productNote,
  productReview,
  onAdd,
  isLoading,
  soldBy,
  soldByTradeRole,
  userId,
  sellerId
}) => {
  const t = useTranslations();
  const { user, langDir, currency } = useAuth();
  const [quantity, setQuantity] = useState(productQuantity);

  const calculateAvgRating = useMemo(() => {
    const totalRating = productReview?.reduce(
      (acc: number, item: { rating: number }) => {
        return acc + item.rating;
      },
      0,
    );

    const result = totalRating / productReview?.length;
    return !isNaN(result) ? Math.floor(result) : 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productReview?.length]);

  const calculateRatings = useMemo(
    () => (rating: number) => {
      const stars: Array<React.ReactNode> = [];
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
    [productReview?.length],
  );

  useEffect(() => {
    if (productQuantity === -1) return;
    setQuantity(productQuantity || 0);
  }, [productQuantity]);

  return (
    <div className="product-view-s1-right">
      {isLoading ? <Skeleton className="mb-2 h-10 w-full" /> : null}
      <div className="info-col">
        <h2>{productName}</h2>
      </div>
      {isLoading ? (
        <Skeleton className="mb-2 h-28 w-full" />
      ) : (
        <div className="info-col mb-2">
          <div className="brand_sold_info items-start!">
            <div className="lediv w-full sm:w-1/2">
              <h5>
                <span className="inline-block w-20 sm:w-20!" translate="no">
                  {t("brand")}:
                </span>{" "}
                {brand}
              </h5>
            </div>

            <div className="rgdiv flex w-full flex-wrap gap-x-2 sm:w-1/2">
              <h5
                className="w-20 capitalize! text-dark-orange! sm:w-20!"
                translate="no"
              >
                {t("sold_by")}:
              </h5>
              <Link
                href={
                  soldByTradeRole === "COMPANY"
                    ? `/company-profile-details?userId=${sellerId}`
                    : soldByTradeRole === "FREELANCER"
                      ? `/freelancer-profile-details?userId=${sellerId}`
                      : "#"
                }
              >
                <h5>{soldBy}</h5>
              </Link>
            </div>
          </div>
          <div className="rating">
            {calculateRatings(calculateAvgRating)}
            <span className="mt-1">({productReview?.length} Reviews)</span>
          </div>
          <h3
            className="w-fit rounded bg-dark-orange! px-4 py-2 font-semibold! normal-case! text-white! no-underline! shadow-md"
            translate="no"
            onClick={() => {
              onAdd(
                quantity || 1,
                Number(productId),
                "add",
                offerPriceFrom,
                offerPriceTo,
                productNote,
              );
            }}
          >
            {t("ask_for_price")}
          </h3>
        </div>
      )}

      {isLoading ? (
        <Skeleton className="h-44 w-full" />
      ) : (
        <div className="info-col">
          <div className="row">
            <div className="col-12 col-md-12">
              <div className="col-12 col-md-12">
                <div className="form-group min-h-[60px] pl-8">
                  {productShortDescription?.length ? (
                    <ul className="list-disc">
                      {productShortDescription?.map((item) => (
                        <li key={item?.id}>{item?.shortDescription}</li>
                      ))}
                    </ul>
                  ) : (
                    <p dir={langDir} translate="no">
                      {t("no_description")}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-x-3">
        <Button
          variant="outline"
          className="relative hover:shadow-xs"
          onClick={() => {
            setQuantity(quantity - 1);
            onAdd(
              quantity - 1,
              Number(productId),
              "remove",
              offerPriceFrom,
              offerPriceTo,
              productNote,
            );
          }}
          disabled={quantity === 0}
        >
          <Image src={MinusIcon} alt="minus-icon" fill className="p-3" />
        </Button>
        {quantity}
        <Button
          variant="outline"
          className="relative hover:shadow-xs"
          onClick={() => {
            setQuantity(quantity + 1);
            onAdd(
              quantity + 1,
              Number(productId),
              "remove",
              offerPriceFrom,
              offerPriceTo,
              productNote,
            );
          }}
        >
          <Image src={PlusIcon} alt="plus-icon" fill className="p-3" />
        </Button>
      </div>

      <div className="info-col top-btm-border">
        <div className="form-group mb-0">
          <div className="quantity-with-right-payment-info">
            <div className="right-payment-info">
              <ul>
                <li>
                  <Image
                    src={SecurePaymentIcon}
                    alt="secure-payment-icon"
                    width={28}
                    height={22}
                  />
                  <span dir={langDir} translate="no">
                    {t("secure_payment")}
                  </span>
                </li>
                <li>
                  <Image
                    src={SupportIcon}
                    alt="support-24hr-icon"
                    width={28}
                    height={28}
                  />
                  <span dir={langDir} translate="no">
                    {t("secure_payment")}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-28 w-full" />
      ) : (
        <div className="info-col">
          <div className="row">
            <div className="col-12 col-md-12">
              <div className="form-group mb-0">
                <label dir={langDir} translate="no">
                  {t("report_abuse")}
                </label>
                <p>
                  <span className="color-text" dir={langDir} translate="no">
                    {t("sku")}:
                  </span>{" "}
                  {skuNo}
                </p>
                <p>
                  <span className="color-text" dir={langDir} translate="no">
                    {t("categories")}:
                  </span>{" "}
                  {category}
                </p>
                <p>
                  <span className="color-text" dir={langDir} translate="no">
                    {t("tags")}:
                  </span>{" "}
                  {productTags?.map((item) => item.productTagsTag?.tagName).join(", ")}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDescriptionCard;
