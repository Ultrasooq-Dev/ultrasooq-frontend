import { DELIVERY_STATUS, formattedDate } from "@/utils/constants";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { BiSolidCircle, BiCircle } from "react-icons/bi";
import { PiStarFill } from "react-icons/pi";
// import { Dialog, DialogContent } from "@/components/ui/dialog";
// import ReviewForm from "@/components/shared/ReviewForm";
import PlaceholderImage from "@/public/images/product-placeholder.png";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";

type OrderCardProps = {
  id: number;
  orderProductType?: string;
  productId: number;
  purchasePrice: string;
  productName: string;
  produtctImage?: { id: number; image: string }[];
  productColor?: string;
  orderQuantity?: number;
  orderId: string;
  orderStatus: string;
  orderProductDate: string;
  updatedAt: string;
  serviceFeature?: any;
};

const OrderCard: React.FC<OrderCardProps> = ({
  id,
  orderProductType,
  productId,
  purchasePrice,
  productName,
  produtctImage,
  productColor,
  orderQuantity,
  orderId,
  orderStatus,
  orderProductDate,
  updatedAt,
  serviceFeature
}) => {
  // const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  // const [reviewId, setReviewId] = useState<number>();

  // const handleToggleReviewModal = () =>
  // setIsReviewModalOpen(!isReviewModalOpen);

  // const reviewExists = useMemo(() => {
  //   return productReview?.some(
  //     (item: { productId: number }) => item.productId === id,
  //   );
  // }, [productReview?.length, id]);

  const t = useTranslations();
  const { langDir, currency } = useAuth();

  return (
    <div className="my-order-card">
      <h5 className="mb-2" dir={langDir} translate="no">
        {t("order_id")}: <span className="font-semibold" dir={langDir}>{orderId}</span>
      </h5>
      <div className="my-order-box">
        <Link href={`/my-orders/${id}`}>
          {orderProductType == 'SERVICE' ? (
            <figure>
              <div className="image-container rounded border border-gray-300">
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
              <div className="image-container rounded border border-gray-300">
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
          <p className="text-gray-500" translate="no">{t("quantity")} x {orderQuantity || 0}</p>
        </div>
        <div className="right-info" dir={langDir}>
          <h4 translate="no">
            {orderStatus === "RECEIVED" || orderStatus === "PLACED" ? (
              <>
                <BiCircle color="green" />
                {t("placed_on")}{" "}
                {orderProductDate ? formattedDate(orderProductDate) : ""}
              </>
            ) : null}
            {orderStatus === "CONFIRMED" ? (
              <>
                <BiCircle color="green" /> {t("confirmed_on")}{" "}
                {updatedAt ? formattedDate(updatedAt) : ""}
              </>
            ) : null}
            {orderStatus === "SHIPPED" ? (
              <>
                <BiCircle color="green" /> {t("shipped_on")}{" "}
                {updatedAt ? formattedDate(updatedAt) : ""}
              </>
            ) : null}
            {orderStatus === "OFD" ? (
              <>
                <BiCircle color="green" /> {t("out_for_delivery")}{" "}
                {updatedAt ? formattedDate(updatedAt) : ""}
              </>
            ) : null}
            {orderStatus === "DELIVERED" ? (
              <>
                <BiSolidCircle color="green" /> {t("delivered_on")}{" "}
                {updatedAt ? formattedDate(updatedAt) : ""}
              </>
            ) : null}
            {orderStatus === "CANCELLED" ? (
              <>
                <BiSolidCircle color="red" /> {t("cancelled_on")}{" "}
                {updatedAt ? formattedDate(updatedAt) : ""}
              </>
            ) : null}
          </h4>
          <p dir={langDir}>
            {orderStatus == 'RECEIVED' || orderStatus == 'PLACED' ? (
              t("order_placed")
            ) : orderStatus == 'CONFIRMED' ? (
              t("order_confirmed_info")
            ) : (
              t(DELIVERY_STATUS[orderStatus])
            )}
          </p>

          {orderStatus === "DELIVERED" ? (
            <Link
              href={`/trending/${productId}?type=reviews`}
              className="ratingLink"
              dir={langDir}
              translate="no"
            >
              <PiStarFill />
              {t("rate_n_review_product")}
            </Link>
          ) : null}
        </div>
      </div>
      {/* <Dialog open={isReviewModalOpen} onOpenChange={handleToggleReviewModal}>
        <DialogContent>
          <ReviewForm
            onClose={() => {
              setReviewId(undefined);
              handleToggleReviewModal();
            }}
            reviewId={reviewId}
          />
        </DialogContent>
      </Dialog> */}
    </div>
  );
};

export default OrderCard;
