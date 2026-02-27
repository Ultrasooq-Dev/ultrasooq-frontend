import Image from "next/image";
import Link from "next/link";
import React from "react";
import { SELLER_DELIVERY_STATUS, formattedDate } from "@/utils/constants";
import { BiSolidCircle, BiCircle } from "react-icons/bi";
import PlaceholderImage from "@/public/images/product-placeholder.png";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";

type OrderCardProps = {
  id: number;
  orderProductType?: string;
  purchasePrice: string;
  productName: string;
  produtctImage?: { id: number; image: string }[];
  productColor?: string;
  orderQuantity?: number;
  sellerOrderId: string;
  orderStatus: string;
  orderProductDate: string;
  updatedAt: string;
  tradeRole?: string;
  sellerId?: number;
  productPriceId?: number;
  productId?: number;
  serviceFeature?: any;
};

const OrderCard: React.FC<OrderCardProps> = ({
  id,
  orderProductType,
  purchasePrice,
  productName,
  produtctImage,
  productColor,
  orderQuantity,
  sellerOrderId,
  orderStatus,
  orderProductDate,
  updatedAt,
  tradeRole,
  sellerId,
  productPriceId,
  productId,
  serviceFeature
}) => {
  const t = useTranslations();
  const { langDir, currency, selectedLocale } = useAuth();

  return (
    <div className="my-order-card">
      <h5 className="mb-2" dir={langDir} translate="no">
        {t("order_id")}: <span className="font-semibold">{sellerOrderId}</span>
      </h5>
      <div className="my-order-box">
        <Link href={`/seller-orders/${id}`}>
          {orderProductType == 'SERVICE' ? (
            <figure>
              <div className="image-container rounded border border-border">
                <Image
                  src={PlaceholderImage}
                  alt="preview-product"
                  width={120}
                  height={120}
                />
              </div>
              <figcaption>
                <h3>
                  {serviceFeature?.name}
                </h3>
              </figcaption>
            </figure>
          ) : (
            <figure>
              <div className="image-container rounded border border-border">
                <Image
                  src={produtctImage?.[0]?.image || PlaceholderImage}
                  alt="preview-product"
                  width={120}
                  height={120}
                />
              </div>
              <figcaption>
                <h3>
                  {productName} {productColor ? productColor : ""}
                </h3>
                <p>{productColor ? `Color: ${productColor}` : ""}</p>
              </figcaption>
            </figure>
          )}
        </Link>
        <div className="center-price-info">
          <h4>{currency.symbol}{Number(purchasePrice) * (orderQuantity ?? 0)}</h4>
          <p className="text-muted-foreground" translate="no">{t("quantity")} x {orderQuantity || 0}</p>
        </div>
        <div className="right-info">
          <h4 dir={langDir} translate="no">
            {orderStatus === "RECEIVED" || orderStatus === "PLACED" ? (
              <>
                <BiCircle color="green" />
                {t("received_on")}{" "}
                {orderProductDate ? formattedDate(orderProductDate, selectedLocale) : ""}
              </>
            ) : null}
            {orderStatus === "CONFIRMED" ? (
              <>
                <BiCircle color="green" /> {t("confirmed_on")}{" "}
                {updatedAt ? formattedDate(updatedAt, selectedLocale) : ""}
              </>
            ) : null}
            {orderStatus === "SHIPPED" ? (
              <>
                <BiCircle color="green" /> {t("shipped_on")}{" "}
                {updatedAt ? formattedDate(updatedAt, selectedLocale) : ""}
              </>
            ) : null}
            {orderStatus === "OFD" ? (
              <>
                <BiCircle color="green" /> {t("out_for_delivery")}{" "}
                {updatedAt ? formattedDate(updatedAt, selectedLocale) : ""}
              </>
            ) : null}
            {orderStatus === "DELIVERED" ? (
              <>
                <BiSolidCircle color="green" /> {t("delivered_on")}{" "}
                {updatedAt ? formattedDate(updatedAt, selectedLocale) : ""}
              </>
            ) : null}
            {orderStatus === "CANCELLED" ? (
              <>
                <BiSolidCircle color="red" /> {t("cancelled_on")}{" "}
                {updatedAt ? formattedDate(updatedAt, selectedLocale) : ""}
              </>
            ) : null}
          </h4>
          <p dir={langDir}>
            {orderStatus === "RECEIVED" || orderStatus === "PLACED" ? (
              t("order_received_info")
            ) : orderStatus === "CONFIRMED" ? (
              t("order_confirmed_info")
            ) : (
              t(SELLER_DELIVERY_STATUS[orderStatus])
            )}
          </p>

          {/* {orderStatus === "DELIVERED" ? (
            <Link
              href={
                tradeRole === "COMPANY"
                  ? `/company-profile-details?userId=${sellerId}&productPriceId=${productPriceId}&productId=${productId}&type=ratings`
                  : tradeRole === "FREELANCER"
                    ? `/freelancer-profile-details?userId=${sellerId}&productPriceId=${productPriceId}&productId=${productId}&type=ratings`
                    : "#"
              }
              className="ratingLink"
            >
              <PiStarFill />
              Rate & Review Product
            </Link>
          ) : null} */}
        </div>
      </div>
    </div>
  );
};

export default OrderCard;
