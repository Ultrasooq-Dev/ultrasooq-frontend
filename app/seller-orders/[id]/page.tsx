"use client";
import React, { useEffect, useState } from "react";
import { BiSolidCircle, BiCircle } from "react-icons/bi";
import { LiaFileInvoiceSolid } from "react-icons/lia";
import { MdHelpCenter } from "react-icons/md";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useOrderBySellerId } from "@/apis/queries/orders.queries";
import { useParams } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import OtherItemCard from "@/components/modules/sellerOrderDetails/OtherItemCard";
import UpdateProductStatusForm from "@/components/modules/myOrderDetails/UpdateProductStatusForm";
import { Skeleton } from "@/components/ui/skeleton";
import Footer from "@/components/shared/Footer";
import Link from "next/link";
import { MONTHS, formattedDate } from "@/utils/constants";
import { cn } from "@/lib/utils";
import PlaceholderImage from "@/public/images/product-placeholder.png";
import { PERMISSION_ORDERS, checkPermission } from "@/helpers/permission";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { convertDate, convertTime } from "@/utils/helper";
import AddReceipt from "@/components/modules/sellerOrderDetails/AddReceipt";

const MyOrderDetailsPage = ({ }) => {
  const t = useTranslations();
  const { langDir, currency, selectedLocale } = useAuth();
  const router = useRouter();
  const hasPermission = checkPermission(PERMISSION_ORDERS);
  const searchParams = useParams();

  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const handleToggleStatusModal = () =>
    setIsStatusModalOpen(!isStatusModalOpen);

  const [isAddReceiptModalOpen, setIsAddReceiptModalOpen] = useState(false);
  const handleToggleAddReceiptModal = () =>
    setIsAddReceiptModalOpen(!isAddReceiptModalOpen);

  const orderByIdQuery = useOrderBySellerId(
    {
      orderProductId: searchParams?.id ? (searchParams.id as string) : "",
    },
    !!searchParams?.id && hasPermission,
  );

  const orderDetails = orderByIdQuery.data?.data;
  const shippingDetails =
    orderByIdQuery.data?.data?.orderProduct_order?.order_orderAddress?.find(
      (item) => item?.addressType === "SHIPPING",
    );
  const billingDetails =
    orderByIdQuery.data?.data?.orderProduct_order?.order_orderAddress?.find(
      (item) => item?.addressType === "BILLING",
    );
  const otherOrderDetails =
    orderByIdQuery.data?.otherData?.[0]?.order_orderProducts;

  function formatDate(inputDate: string | undefined): string {
    if (!inputDate) return "-";
    const dateObj = new Date(inputDate);
    return dateObj.toLocaleDateString(selectedLocale || "ar", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  }

  useEffect(() => {
    if (!hasPermission) router.push("/home");
  }, []);

  if (!hasPermission) return <div></div>;

  return (
    <>
      <div className="my-order-main">
        <div className="container m-auto px-3">
          <div className="my-order-wrapper">
            <div className="right-div mx-w-100">
              <div className="my-order-lists for-delivery-address">
                <ul className="page-indicator-s1 mb-0!">
                  <li>
                    <Link href="/home" dir={langDir} translate="no">
                      {t("home")}
                    </Link>
                  </li>
                  <li>
                    <Link href="/seller-orders" dir={langDir} translate="no">
                      {t("my_orders")}
                    </Link>
                  </li>
                  <li>
                    <h5>
                      <span className="font-semibold">
                        {orderDetails?.sellerOrderNo}
                      </span>
                    </h5>
                  </li>
                </ul>

                {orderByIdQuery.isLoading ? (
                  <Skeleton className="h-44" />
                ) : (
                  <div className="my-order-item">
                    <div className="my-order-card">
                      <div className="delivery-address">
                        <div className="delivery-address-col deliveryAddress">
                          <h2 dir={langDir} translate="no">
                            {t("delivery_address")}
                          </h2>
                          <h3 dir={langDir}>
                            {shippingDetails?.firstName}{" "}
                            {shippingDetails?.lastName}
                          </h3>
                          <address dir={langDir}>
                            {shippingDetails?.address}, <br /> pin -{" "}
                            {shippingDetails?.postCode}
                          </address>
                          <p dir={langDir}>
                            <span translate="no">{t("phone_number")} </span>
                            <span className="text-destructive!" dir={langDir}>
                              {shippingDetails?.phone}
                            </span>
                          </p>
                        </div>
                        <div className="delivery-address-col deliveryAddress">
                          <h2 translate="no">{t("billing_address")}</h2>
                          <h3>
                            {billingDetails?.firstName}{" "}
                            {billingDetails?.lastName}
                          </h3>
                          <address>
                            {billingDetails?.address}, <br /> pin -{" "}
                            {billingDetails?.postCode}
                          </address>
                          <p>
                            <span translate="no">{t("phone_number")} </span>
                            <span className="text-destructive!" dir={langDir}>
                              {billingDetails?.phone}
                            </span>
                          </p>
                        </div>
                        <div className="delivery-address-col moreActions">
                          <h2 dir={langDir} translate="no">
                            {t("more_actions")}
                          </h2>
                          <figure className="downloadInvoice">
                            <figcaption>
                              <Button
                                className="downloadInvoice-btn theme-primary-btn"
                                dir={langDir}
                                translate="no"
                              >
                                <LiaFileInvoiceSolid /> {t("download_invoice")}
                              </Button>
                            </figcaption>
                          </figure>
                          {orderDetails?.orderShippingDetail?.receipt ? (
                            <figure className="downloadInvoice mt-4">
                              <figcaption>
                                <Link
                                  className="text-destructive"
                                  href={orderDetails?.orderShippingDetail?.receipt}
                                  target="_blank"
                                  translate="no"
                                >
                                  {t("download_receipt")}
                                </Link>
                              </figcaption>
                            </figure>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {orderDetails?.orderShippingDetail && orderDetails?.orderProductType != 'SERVICE' ? (
                  <div className="my-order-item">
                    <div className="my-order-card">
                      <div className="mb-2 w-full gap-2 sm:grid sm:grid-cols-3">
                        <div className="gap-2 sm:flex">
                          <h3 className="font-bold!" translate="no">
                            {t("shipping_mode")}:
                          </h3>
                          <span>
                            {
                              orderDetails?.orderShippingDetail
                                ?.orderShippingType
                            }
                          </span>
                        </div>
                        <div className="gap-2 sm:flex">
                          <h3 className="font-bold!" translate="no">
                            {t("delivery_charge")}:
                          </h3>
                          <span>
                            {currency.symbol}
                            {orderDetails?.orderShippingDetail?.shippingCharge}
                          </span>
                        </div>
                      </div>
                      {orderDetails?.orderShippingDetail?.orderShippingType ==
                      "PICKUP" ? (
                        <div className="w-full gap-2 sm:grid sm:grid-cols-3">
                          <div className="gap-2 sm:flex">
                            <h3 className="font-bold!" translate="no">
                              {t("shipping_date")}:
                            </h3>
                            <span>
                              {convertDate(
                                orderDetails?.orderShippingDetail?.shippingDate,
                              )}
                            </span>
                          </div>
                          <div className="gap-2 sm:flex">
                            <h3 className="font-bold!" translate="no">
                              {t("from_time")}:
                            </h3>
                            <span>
                              {convertTime(
                                orderDetails?.orderShippingDetail?.fromTime,
                              )}
                            </span>
                          </div>
                          <div className="gap-2 sm:flex">
                            <h3 className="font-bold!" translate="no">
                              {t("to_time")}:
                            </h3>
                            <span>
                              {convertTime(
                                orderDetails?.orderShippingDetail?.toTime,
                              )}
                            </span>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                {orderByIdQuery.isLoading ? (
                  <Skeleton className="h-44" />
                ) : (
                  <div className="my-order-item">
                    <div className="my-order-card">
                      <div className="my-order-box">
                        <Link
                          href={`/trending/${orderDetails?.orderProduct_product?.id}`}
                        >
                          {orderDetails?.orderProductType == 'SERVICE' ? (
                            <figure>
                              <div className="image-container rounded border border-border">
                                <Image
                                  src={PlaceholderImage}
                                  alt="preview-product"
                                  width={120}
                                  height={120}
                                  placeholder="blur"
                                  blurDataURL="/images/product-placeholder.png"
                                />
                              </div>
                              <figcaption>
                                <h3>
                                  {
                                    orderDetails?.serviceFeatures
                                      ?.[0]?.serviceFeature?.name
                                  }
                                </h3>
                                {/* <p className="mt-1">
                                  Seller:{" "}
                                  {
                                    orderDetails?.orderProduct_productPrice
                                      ?.adminDetail?.firstName
                                  }{" "}
                                  {
                                    orderDetails?.orderProduct_productPrice
                                      ?.adminDetail?.lastName
                                  }
                                </p> */}
                                <h4 className="mt-1">
                                  {currency.symbol}
                                  {Number(orderDetails?.purchasePrice || 0) * (orderDetails?.orderQuantity || 0)}
                                </h4>
                                <p className="text-muted-foreground" translate="no">
                                  {t("quantity")} x {orderDetails?.orderQuantity || 0}
                                </p>
                              </figcaption>
                            </figure>
                          ) : (
                            <figure>
                              <div className="image-container rounded border border-border">
                                <Image
                                  src={
                                    orderDetails?.orderProduct_productPrice
                                      ?.productPrice_product?.productImages?.[0]
                                      ?.image || PlaceholderImage
                                  }
                                  alt="preview-product"
                                  width={120}
                                  height={120}
                                  placeholder="blur"
                                  blurDataURL="/images/product-placeholder.png"
                                />
                              </div>
                              <figcaption>
                                <h3>
                                  {
                                    orderDetails?.orderProduct_productPrice
                                      ?.productPrice_product?.productName
                                  }
                                </h3>
                                <p className="mt-1" dir={langDir} translate="no">
                                  {t("seller")}:{" "}
                                  {
                                    orderDetails?.orderProduct_productPrice
                                      ?.adminDetail?.firstName
                                  }{" "}
                                  {
                                    orderDetails?.orderProduct_productPrice
                                      ?.adminDetail?.lastName
                                  }
                                </p>
                                <h4 className="mt-1" dir={langDir}>
                                  {currency.symbol}
                                  {orderDetails?.orderProduct_productPrice
                                    ?.offerPrice
                                    ? Number(
                                      (orderDetails?.orderProduct_productPrice
                                        ?.offerPrice ?? 0) *
                                      (orderDetails?.orderQuantity ?? 0),
                                    )
                                    : 0}
                                </h4>
                                <p
                                  className="text-muted-foreground"
                                  dir={langDir}
                                  translate="no"
                                >
                                  {t("quantity")} x{" "}
                                  {orderDetails?.orderQuantity || 0}
                                </p>
                                {orderDetails?.orderProductType == 'PRODUCT' && orderDetails?.object ? (
                                  (() => {
                                    const object = orderDetails?.object as { type?: string; value?: string } | { type?: string; value?: string }[];

                                    if (Array.isArray(object)) {
                                      return object.map((obj, index: number) => {
                                        return (
                                          <p className="text-muted-foreground" dir={langDir} key={index}>
                                            {obj.type}: {obj.value}
                                          </p>
                                        );
                                      });
                                    }

                                    return (
                                      <p className="text-muted-foreground" dir={langDir}>
                                        {object.type}: {object.value}
                                      </p>
                                    );
                                  })()
                                ) : null}
                              </figcaption>
                            </figure>
                          )}
                        </Link>
                        <div className="center-div">
                          <div className="order-delivery-progess-s1">
                            <ul>
                              <li className="complted">
                                <div
                                  className="orderStatusText"
                                  dir={langDir}
                                  translate="no"
                                >
                                  {t("order_received")}
                                </div>
                                <div className="dot">
                                  <small></small>
                                </div>
                                <div className="orderDateText">
                                  {formatDate(orderDetails?.orderProductDate)}
                                </div>
                              </li>
                              <li
                                className={cn(
                                  orderDetails?.orderProductStatus ===
                                    "CANCELLED" ||
                                    orderDetails?.orderProductStatus ===
                                    "DELIVERED" ||
                                    orderDetails?.orderProductStatus ===
                                    "OFD" ||
                                    orderDetails?.orderProductStatus ===
                                    "SHIPPED"
                                    ? "complted"
                                    : orderDetails?.orderProductStatus ===
                                      "CONFIRMED"
                                      ? "current"
                                      : "",
                                )}
                              >
                                <div
                                  className="orderStatusText"
                                  dir={langDir}
                                  translate="no"
                                >
                                  {t("order_confirmed")}
                                </div>
                                <div className="dot">
                                  <small></small>
                                </div>
                                <div className="orderDateText">
                                  {formatDate(orderDetails?.orderProductDate)}
                                </div>
                              </li>
                              <li
                                className={cn(
                                  orderDetails?.orderProductStatus ===
                                    "CANCELLED" ||
                                    orderDetails?.orderProductStatus ===
                                    "DELIVERED" ||
                                    orderDetails?.orderProductStatus === "OFD"
                                    ? "complted"
                                    : orderDetails?.orderProductStatus ===
                                      "SHIPPED"
                                      ? "current"
                                      : "",
                                )}
                                dir={langDir}
                              >
                                <div className="orderStatusText" translate="no">
                                  {t("shipped")}
                                </div>
                                <div className="dot">
                                  <small></small>
                                </div>
                                <div className="orderDateText">
                                  {orderDetails?.orderProductStatus ===
                                    "SHIPPED"
                                    ? formatDate(orderDetails?.updatedAt)
                                    : "-"}
                                </div>
                              </li>
                              <li
                                className={cn(
                                  orderDetails?.orderProductStatus ===
                                    "CANCELLED" ||
                                    orderDetails?.orderProductStatus ===
                                    "DELIVERED"
                                    ? "complted"
                                    : orderDetails?.orderProductStatus === "OFD"
                                      ? "current"
                                      : "",
                                )}
                                dir={langDir}
                              >
                                <div
                                  className="orderStatusText"
                                  dir={langDir}
                                  translate="no"
                                >
                                  {t("out_for_delivery")}
                                </div>
                                <div className="dot">
                                  <small></small>
                                </div>
                                <div className="orderDateText">
                                  {orderDetails?.orderProductStatus === "OFD"
                                    ? formatDate(orderDetails?.updatedAt)
                                    : "-"}
                                </div>
                              </li>
                              <li
                                className={cn(
                                  orderDetails?.orderProductStatus ===
                                    "CANCELLED"
                                    ? "complted"
                                    : orderDetails?.orderProductStatus ===
                                      "DELIVERED"
                                      ? "complted"
                                      : "",
                                )}
                                dir={langDir}
                              >
                                <div
                                  className={cn(
                                    orderDetails?.orderProductStatus ===
                                      "CANCELLED"
                                      ? "orderStatusCancelledText"
                                      : "orderStatusText",
                                  )}
                                  translate="no"
                                >
                                  {orderDetails?.orderProductStatus ===
                                    "CANCELLED"
                                    ? t("cancelled")
                                    : t("delivered")}
                                </div>
                                <div className="dot">
                                  <small
                                    className={cn(
                                      orderDetails?.orderProductStatus ===
                                        "CANCELLED"
                                        ? "bg-destructive!"
                                        : "",
                                    )}
                                  ></small>
                                </div>
                                <div className="orderDateText">
                                  {orderDetails?.orderProductStatus ===
                                    "CANCELLED" ||
                                    orderDetails?.orderProductStatus ===
                                    "DELIVERED"
                                    ? formatDate(orderDetails?.updatedAt)
                                    : "-"}
                                </div>
                              </li>
                            </ul>
                          </div>
                        </div>
                        <div className="right-info">
                          <h4 className="mb-2" dir={langDir} translate="no">
                            {orderDetails?.orderProductStatus ===
                              "CONFIRMED" ? (
                              <>
                                <BiCircle color="green" />
                                {t("placed_on")}{" "}
                                {orderDetails?.orderProductDate
                                  ? formattedDate(orderDetails.orderProductDate, selectedLocale)
                                  : ""}
                              </>
                            ) : null}

                            {orderDetails?.orderProductStatus === "SHIPPED" ? (
                              <>
                                <BiCircle color="green" />
                                {t("shipped_on")}{" "}
                                {orderDetails?.updatedAt
                                  ? formattedDate(orderDetails.updatedAt, selectedLocale)
                                  : ""}
                              </>
                            ) : null}

                            {orderDetails?.orderProductStatus === "OFD" ? (
                              <>
                                <BiCircle color="green" />{" "}
                                {t("out_for_delivery")}{" "}
                                {orderDetails?.updatedAt
                                  ? formattedDate(orderDetails.updatedAt, selectedLocale)
                                  : ""}
                              </>
                            ) : null}

                            {orderDetails?.orderProductStatus ===
                              "DELIVERED" ? (
                              <>
                                <BiSolidCircle color="green" />{" "}
                                {t("delivered_on")}{" "}
                                {orderDetails?.updatedAt
                                  ? formattedDate(orderDetails.updatedAt, selectedLocale)
                                  : ""}
                              </>
                            ) : null}

                            {orderDetails?.orderProductStatus ===
                              "CANCELLED" ? (
                              <>
                                <BiSolidCircle color="red" />{" "}
                                {t("cancelled_on")}{" "}
                                {orderDetails?.updatedAt
                                  ? formattedDate(orderDetails.updatedAt, selectedLocale)
                                  : ""}
                              </>
                            ) : null}
                          </h4>

                          <a
                            href="#"
                            className="ratingLink"
                            dir={langDir}
                            translate="no"
                          >
                            <MdHelpCenter />
                            {t("need_help")}
                          </a>

                          {orderDetails?.orderProductStatus != 'DELIVERED' ? (
                            <div className="more-actions">
                              <button
                                type="button"
                                className="theme-primary-btn update-status-btn"
                                onClick={handleToggleStatusModal}
                                dir={langDir}
                                translate="no"
                              >
                                {t("update_status")}
                              </button>
                            </div>
                          ) : null}

                          <div className="more-actions">
                            <button
                              type="button"
                              className="theme-primary-btn update-status-btn px-2 py-1"
                              onClick={handleToggleAddReceiptModal}
                              dir={langDir}
                              translate="no"
                            >
                              {t("add_receipt")}
                            </button>
                          </div>

                          {/* {orderDetails?.orderProductStatus === "DELIVERED" ? (
                            // <div className="more-actions">
                            //   <button
                            //     type="button"
                            //     className="theme-primary-btn update-status-btn"
                            //     onClick={handleToggleReviewModal}
                            //   >
                            //     <PiStarFill />
                            //     Rate & Review Product
                            //   </button>
                            // </div>
                            <Link
                              href={
                                orderDetails?.orderProduct_productPrice
                                  ?.adminDetail?.tradeRole === "COMPANY"
                                  ? `/company-profile-details?userId=${orderDetails?.orderProduct_productPrice?.adminDetail?.id}&productPriceId=${orderDetails?.orderProduct_productPrice?.id}&productId=${orderDetails?.orderProduct_productPrice?.productId}&type=ratings`
                                  : orderDetails?.orderProduct_productPrice
                                        ?.adminDetail?.tradeRole ===
                                      "FREELANCER"
                                    ? `/freelancer-profile-details?userId=${orderDetails?.orderProduct_productPrice?.adminDetail?.id}&productPriceId=${orderDetails?.orderProduct_productPrice?.id}&productId=${orderDetails?.orderProduct_productPrice?.productId}&type=ratings`
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
                  </div>
                )}

                {orderByIdQuery.isLoading ? (
                  <Skeleton className="h-52" />
                ) : null}

                {otherOrderDetails?.map((item: any) => (
                  <OtherItemCard
                    key={item?.id}
                    id={item?.id}
                    orderProductType={item?.orderProductType}
                    productName={
                      item.orderProduct_productPrice?.productPrice_product
                        ?.productName
                    }
                    offerPrice={item?.purchasePrice}
                    orderQuantity={
                      item?.orderProduct_productPrice?.orderQuantity
                    }
                    variant={item?.object}
                    serviceFeature={item?.serviceFeatures?.[0]?.serviceFeature}
                    productImages={
                      item.orderProduct_productPrice?.productPrice_product
                        ?.productImages
                    }
                    sellerName={`${item?.orderProduct_productPrice?.adminDetail?.firstName} ${item?.orderProduct_productPrice?.adminDetail?.lastName}`}
                    orderNo={orderDetails?.orderProduct_order?.orderNo ?? ""}
                    orderProductDate={item?.orderProductDate}
                    orderProductStatus={item?.orderProductStatus}
                    updatedAt={item?.updatedAt}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />

      <Dialog open={isStatusModalOpen} onOpenChange={handleToggleStatusModal}>
        <DialogContent className="customModal-s1">
          <DialogHeader className="modal-header">
            <DialogTitle className="modal-title" translate="no">
              {t("update_delivery_status")}
            </DialogTitle>
          </DialogHeader>

          <UpdateProductStatusForm
            orderProductId={searchParams?.id as string}
            onClose={handleToggleStatusModal}
            orderProductStatus={orderDetails?.orderProductStatus}
            orderProductDate={orderDetails?.orderProductDate ? orderDetails?.orderProductDate : ""}
            deliveryAfter={orderDetails?.orderProduct_productPrice?.deliveryAfter || 1}
          />
        </DialogContent>
      </Dialog>

      {orderDetails?.orderShippingDetail ? (
        <Dialog
          open={isAddReceiptModalOpen}
          onOpenChange={handleToggleAddReceiptModal}
        >
          <DialogContent className="customModal-s1">
            <DialogHeader className="modal-header">
              <DialogTitle className="modal-title" translate="no">
                {t("add_receipt")}
              </DialogTitle>
            </DialogHeader>

            <AddReceipt
              orderProductId={Number(searchParams?.id)}
              orderShippingId={orderDetails.orderShippingDetail.id ?? 0}
              onClose={handleToggleAddReceiptModal}
            />
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  );
};

export default MyOrderDetailsPage;
