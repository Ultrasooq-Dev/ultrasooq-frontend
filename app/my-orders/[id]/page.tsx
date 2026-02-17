"use client";
import React from "react";
import {
  Package,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  Star,
  Download,
  HelpCircle,
  MapPin,
  CreditCard,
  Calendar,
  User,
  Phone,
  ArrowLeft,
  ShoppingBag,
  FileText,
  RotateCcw,
  Copy,
} from "lucide-react";
import { useOrderById } from "@/apis/queries/orders.queries";
import { useParams } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import OtherItemCard from "@/components/modules/myOrderDetails/OtherItemCard";
import { Skeleton } from "@/components/ui/skeleton";
import Footer from "@/components/shared/Footer";
import Link from "next/link";
import { MONTHS, formattedDate } from "@/utils/constants";
import { cn } from "@/lib/utils";
import PlaceholderImage from "@/public/images/product-placeholder.png";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { convertDate, convertTime } from "@/utils/helper";

const MyOrderDetailsPage = () => {
  const t = useTranslations();
  const { langDir, currency } = useAuth();
  const searchParams = useParams();

  // Safe copy helper for tracking number
  const copyToClipboard = async (text: string) => {
    try {
      if (
        typeof navigator !== "undefined" &&
        (navigator as any).clipboard &&
        (window as any).isSecureContext
      ) {
        await (navigator as any).clipboard.writeText(text);
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
    } catch (_) {}
  };

  const orderByIdQuery = useOrderById(
    {
      orderProductId: searchParams?.id ? (searchParams.id as string) : "",
    },
    !!searchParams?.id,
  );
  const orderDetails = orderByIdQuery.data?.data;
  const shippingDetails =
    orderByIdQuery.data?.data?.orderProduct_order?.order_orderAddress.find(
      (item: { addressType: "SHIPPING" | "BILLING" }) =>
        item?.addressType === "SHIPPING",
    );
  const billingDetails =
    orderByIdQuery.data?.data?.orderProduct_order?.order_orderAddress.find(
      (item: { addressType: "SHIPPING" | "BILLING" }) =>
        item?.addressType === "BILLING",
    );
  const otherOrderDetails =
    orderByIdQuery.data?.otherData?.[0]?.order_orderProducts;

  // Helper functions for status display
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PLACED":
        return <Clock className="h-4 w-4" />;
      case "CONFIRMED":
        return <CheckCircle className="h-4 w-4" />;
      case "SHIPPED":
        return <Truck className="h-4 w-4" />;
      case "OFD":
        return <Truck className="h-4 w-4" />;
      case "DELIVERED":
        return <CheckCircle className="h-4 w-4" />;
      case "CANCELLED":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PLACED":
        return "bg-gray-100 text-gray-800";
      case "CONFIRMED":
        return "bg-blue-100 text-blue-800";
      case "SHIPPED":
        return "bg-purple-100 text-purple-800";
      case "OFD":
        return "bg-orange-100 text-orange-800";
      case "DELIVERED":
        return "bg-green-100 text-green-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  function formatDate(inputDate: string): string {
    const dateObj = new Date(inputDate);
    const dayOfWeek = dateObj.toLocaleString("en", { weekday: "short" });
    const dayOfMonth = dateObj.getDate();
    const month = MONTHS[dateObj.getMonth()];

    // Function to add suffix to day of the month
    function getDaySuffix(day: number): string {
      if (day >= 11 && day <= 13) {
        return `${day}th`;
      }
      switch (day % 10) {
        case 1:
          return `${day}st`;
        case 2:
          return `${day}nd`;
        case 3:
          return `${day}rd`;
        default:
          return `${day}th`;
      }
    }

    const dayWithSuffix = getDaySuffix(dayOfMonth);

    return `${dayOfWeek}, ${dayWithSuffix} ${month}`;
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <div className="w-full px-6 py-8 lg:px-12">
          {/* Breadcrumb Navigation */}
          <nav className="mb-8">
            <ol className="flex items-center space-x-2 text-sm text-gray-600">
              <li>
                <Link
                  href="/home"
                  className="transition-colors hover:text-gray-900"
                  dir={langDir}
                >
                  {t("home")}
                </Link>
              </li>
              <li className="flex items-center">
                <span className="mx-2">/</span>
                <Link
                  href="/my-orders"
                  className="transition-colors hover:text-gray-900"
                  dir={langDir}
                >
                  {t("my_orders")}
                </Link>
              </li>
              <li className="flex items-center">
                <span className="mx-2">/</span>
                <span className="font-medium text-gray-900">
                  {orderDetails?.orderProduct_order?.orderNo || "Loading..."}
                </span>
              </li>
            </ol>
          </nav>

          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                  <ShoppingBag className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1
                    className="text-3xl font-bold text-gray-900"
                    dir={langDir}
                  >
                    Order Details
                  </h1>
                  <p className="mt-1 text-gray-600" dir={langDir}>
                    Order #
                    {orderDetails?.orderProduct_order?.orderNo || "Loading..."}
                  </p>
                </div>
              </div>
              {orderDetails?.orderProductStatus && (
                <Badge
                  className={`${getStatusColor(orderDetails.orderProductStatus)} flex items-center gap-2 px-4 py-2 text-sm font-semibold`}
                >
                  {getStatusIcon(orderDetails.orderProductStatus)}
                  {orderDetails.orderProductStatus}
                </Badge>
              )}
            </div>
          </div>

          {/* Address Information */}
          {orderByIdQuery.isLoading ? (
            <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
              <Skeleton className="h-48" />
              <Skeleton className="h-48" />
              <Skeleton className="h-48" />
            </div>
          ) : (
            <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Shipping Address */}
              <Card className="shadow-md transition-shadow hover:shadow-lg">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    Delivery Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <h3 className="font-semibold text-gray-900" dir={langDir}>
                        {shippingDetails?.firstName} {shippingDetails?.lastName}
                      </h3>
                    </div>
                    <address
                      className="leading-relaxed text-gray-600 not-italic"
                      dir={langDir}
                    >
                      {shippingDetails?.address}
                      <br />
                      <span className="text-gray-500">
                        Pin: {shippingDetails?.postCode}
                      </span>
                    </address>
                    <div className="flex items-center gap-2 border-t pt-2 text-gray-600">
                      <Phone className="h-4 w-4" />
                      <span dir={langDir}>{shippingDetails?.phone}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Billing Address */}
              <Card className="shadow-md transition-shadow hover:shadow-lg">
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-green-600" />
                    Billing Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <h3 className="font-semibold text-gray-900" dir={langDir}>
                        {billingDetails?.firstName} {billingDetails?.lastName}
                      </h3>
                    </div>
                    <address
                      className="leading-relaxed text-gray-600 not-italic"
                      dir={langDir}
                    >
                      {billingDetails?.address}
                      <br />
                      <span className="text-gray-500">
                        Pin: {billingDetails?.postCode}
                      </span>
                    </address>
                    <div className="flex items-center gap-2 border-t pt-2 text-gray-600">
                      <Phone className="h-4 w-4" />
                      <span dir={langDir}>{billingDetails?.phone}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <Card className="shadow-md transition-shadow hover:shadow-lg">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-purple-600" />
                    Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <Button
                      className="w-full justify-start"
                      variant="outline"
                      size="lg"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download Invoice
                    </Button>
                    {orderDetails?.orderShippingDetail?.receipt && (
                      <Button
                        className="w-full justify-start"
                        variant="outline"
                        size="lg"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download Receipt
                      </Button>
                    )}
                    <Button
                      className="w-full justify-start"
                      variant="outline"
                      size="lg"
                    >
                      <HelpCircle className="mr-2 h-4 w-4" />
                      Need Help ?
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Order Summary Section */}
          {orderDetails?.orderProduct_order && (
            <Card className="mb-8 shadow-md">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">
                      Order Number
                    </label>
                    <p className="text-lg font-semibold text-gray-900">
                      {orderDetails.orderProduct_order.orderNo || "N/A"}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">
                      Order Status
                    </label>
                    <p className="text-lg font-semibold text-gray-900">
                      {orderDetails.orderProduct_order.orderStatus || "N/A"}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">
                      Date & Time
                    </label>
                    <p className="text-lg font-semibold text-gray-900">
                      {orderDetails.orderProduct_order.orderDate
                        ? formatDate(orderDetails.orderProduct_order.orderDate)
                        : orderDetails.orderProduct_order.createdAt
                          ? formatDate(orderDetails.orderProduct_order.createdAt)
                          : "N/A"}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">
                      Subtotal
                    </label>
                    <p className="text-lg font-semibold text-gray-900">
                      {currency.symbol}
                      {orderDetails.orderProduct_order.totalPrice || 0}
                    </p>
                  </div>
                  {orderDetails.orderProduct_order.totalDiscount > 0 && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-600">
                        Discount
                      </label>
                      <p className="text-lg font-semibold text-green-600">
                        -{currency.symbol}
                        {orderDetails.orderProduct_order.totalDiscount || 0}
                      </p>
                    </div>
                  )}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">
                      Total Amount
                    </label>
                    <p className="text-xl font-bold text-blue-600">
                      {currency.symbol}
                      {orderDetails.orderProduct_order.totalCustomerPay || 0}
                    </p>
                  </div>
                  {orderDetails.orderProduct_order.paymentType !== 'DIRECT' && 
                   orderDetails.orderProduct_order.dueAmount > 0 && (
                    <>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-600">
                          Advance Paid
                        </label>
                        <p className="text-lg font-semibold text-gray-900">
                          {currency.symbol}
                          {orderDetails.orderProduct_order.advanceAmount || 0}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-600">
                          Remaining Due
                        </label>
                        <p className="text-lg font-semibold text-orange-600">
                          {currency.symbol}
                          {orderDetails.orderProduct_order.dueAmount || 0}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Shipping & Product Details Row */}
          <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Shipping Details */}
            {orderDetails?.orderShippingDetail &&
              orderDetails?.orderProductType != "SERVICE" && (
                <Card className="shadow-md">
                  <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50">
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="h-5 w-5 text-orange-600" />
                      Shipping Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <h4 className="flex items-center gap-2 font-medium text-gray-900">
                          <Truck className="h-4 w-4 text-gray-500" />
                          Shipping Mode
                        </h4>
                        <p className="text-gray-600">
                          {orderDetails?.orderShippingDetail?.orderShippingType}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <h4 className="flex items-center gap-2 font-medium text-gray-900">
                          <Package className="h-4 w-4 text-gray-500" />
                          Delivery Charge
                        </h4>
                        <p className="text-gray-600">
                          {currency.symbol}
                          {orderDetails?.orderShippingDetail?.shippingCharge}
                        </p>
                      </div>
                      {orderDetails?.orderShippingDetail?.orderShippingType ===
                        "PICKUP" && (
                        <>
                          <div className="space-y-2">
                            <h4 className="flex items-center gap-2 font-medium text-gray-900">
                              <Calendar className="h-4 w-4 text-gray-500" />
                              Shipping Date
                            </h4>
                            <p className="text-gray-600">
                              {convertDate(
                                orderDetails?.orderShippingDetail?.shippingDate,
                              )}
                            </p>
                          </div>
                          <div className="space-y-2">
                            <h4 className="flex items-center gap-2 font-medium text-gray-900">
                              <Clock className="h-4 w-4 text-gray-500" />
                              From Time
                            </h4>
                            <p className="text-gray-600">
                              {convertTime(
                                orderDetails?.orderShippingDetail?.fromTime,
                              )}
                            </p>
                          </div>
                          <div className="space-y-2">
                            <h4 className="flex items-center gap-2 font-medium text-gray-900">
                              <Clock className="h-4 w-4 text-gray-500" />
                              To Time
                            </h4>
                            <p className="text-gray-600">
                              {convertTime(
                                orderDetails?.orderShippingDetail?.toTime,
                              )}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

            {/* Product Details */}
            {orderByIdQuery.isLoading ? (
              <Card className="overflow-hidden border-0 shadow-lg">
                <CardContent className="p-8">
                  <div className="flex gap-6">
                    <Skeleton className="h-32 w-32 rounded-xl" />
                    <div className="flex-1 space-y-3">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-4 w-1/3" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="overflow-hidden border-0 shadow-lg">
                <CardContent className="p-8">
                  <div className="flex flex-col gap-8 lg:flex-row">
                    {/* Product Image & Basic Info */}
                    <div className="flex gap-6">
                      <Link
                        href={`/trending/${orderDetails?.orderProduct_product?.id}`}
                        className="flex-shrink-0"
                      >
                        <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-xl border-2 border-gray-200 bg-white shadow-md transition-shadow hover:shadow-lg">
                          {orderDetails?.orderProductType === "SERVICE" ? (
                            <Image
                              src={PlaceholderImage}
                              alt="service-preview"
                              width={128}
                              height={128}
                              className="h-full w-full object-contain p-2"
                            />
                          ) : (
                            <Image
                              src={
                                orderDetails?.orderProduct_productPrice
                                  ?.productPrice_product?.productImages?.[0]
                                  ?.image ||
                                orderDetails?.orderProduct_product
                                  ?.productImages?.[0]?.image ||
                                PlaceholderImage
                              }
                              alt="product-preview"
                              width={128}
                              height={128}
                              className="h-full w-full object-contain p-2"
                            />
                          )}
                        </div>
                      </Link>
                      <div className="flex-1">
                        <h3 className="mb-2 text-xl font-bold text-gray-900">
                          {orderDetails?.orderProductType === "SERVICE"
                            ? orderDetails?.serviceFeatures
                                ?.serviceFeatures?.[0]?.name
                            : orderDetails?.orderProduct_productPrice
                                ?.productPrice_product?.productName ||
                              orderDetails?.orderProduct_product?.productName ||
                              "Unknown Product"}
                        </h3>
                        <div className="mb-3 flex items-center gap-6 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Package className="h-4 w-4" />
                            Quantity: {orderDetails?.orderQuantity || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {orderDetails?.orderProductDate
                              ? formatDate(orderDetails.orderProductDate)
                              : orderDetails?.createdAt
                                ? formatDate(orderDetails.createdAt)
                                : "-"}
                          </span>
                        </div>
                        <div className="text-2xl font-bold text-blue-600">
                          {currency.symbol}
                          {orderDetails?.orderProductType === "SERVICE"
                            ? Number(orderDetails?.purchasePrice || 0) *
                              (orderDetails?.orderQuantity || 0)
                            : orderDetails?.orderProduct_productPrice
                                  ?.offerPrice
                              ? Number(
                                  orderDetails?.orderProduct_productPrice
                                    ?.offerPrice * orderDetails?.orderQuantity,
                                )
                              : orderDetails?.purchasePrice
                                ? Number(
                                    orderDetails?.purchasePrice *
                                      orderDetails?.orderQuantity,
                                  )
                                : orderDetails?.salePrice
                                  ? Number(
                                      orderDetails?.salePrice *
                                        orderDetails?.orderQuantity,
                                    )
                                  : 0}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Order Tracking & Other Items Row */}
          <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Order Tracking Section */}
            {orderByIdQuery.isLoading ? (
              <Card className="border-0 shadow-lg">
                <CardContent className="p-8">
                  <Skeleton className="h-64" />
                </CardContent>
              </Card>
            ) : (
              <Card className="border-0 shadow-lg">
                <CardHeader className="border-b bg-gradient-to-r from-green-50 to-emerald-50">
                  <CardTitle className="flex items-center gap-2">
                    <RotateCcw className="h-5 w-5 text-green-600" />
                    Order Tracking
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                  {(() => {
                    const tracking =
                      (orderDetails as any)?.breakdown?.tracking ||
                      (orderDetails as any)?.tracking;
                    const showTracking = [
                      "SHIPPED",
                      "OFD",
                      "DELIVERED",
                    ].includes(orderDetails?.orderProductStatus || "");
                    if (!showTracking || !tracking) return null;
                    return (
                      <div className="mb-8 rounded-lg border bg-white p-4">
                        <h4 className="mb-3 font-semibold text-gray-900">
                          Tracking details
                        </h4>
                        <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
                          <div>
                            <div className="text-gray-500">Tracking Number</div>
                            <div className="flex items-center gap-2 font-medium text-gray-900">
                              <span>{tracking?.trackingNumber || "-"}</span>
                              {tracking?.trackingNumber ? (
                                <button
                                  type="button"
                                  aria-label="Copy tracking"
                                  onClick={() =>
                                    copyToClipboard(
                                      String(tracking.trackingNumber),
                                    )
                                  }
                                  className="inline-flex items-center rounded border px-2 py-1 text-xs"
                                >
                                  <Copy className="mr-1 h-3 w-3" /> Copy
                                </button>
                              ) : null}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-500">Carrier</div>
                            <div className="font-medium text-gray-900">
                              {tracking?.carrier || "-"}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-500">Added</div>
                            <div className="font-medium text-gray-900">
                              {tracking?.addedAt
                                ? formattedDate(tracking.addedAt)
                                : "-"}
                            </div>
                          </div>
                        </div>
                        {tracking?.notes ? (
                          <div className="mt-3 text-sm">
                            <div className="text-gray-500">Notes</div>
                            <div className="text-gray-900">
                              {tracking.notes}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    );
                  })()}
                  <div className="relative">
                    {/* Timeline */}
                    <div className="absolute top-0 bottom-0 left-6 w-0.5 bg-gray-200"></div>

                    <div className="space-y-6">
                      {/* Order Placed */}
                      <div className="relative flex items-start gap-6">
                        <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 shadow-md">
                          <CheckCircle className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="flex-1 pt-1">
                          <h4 className="mb-1 font-semibold text-gray-900">
                            {t("placed")}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {orderDetails?.orderProductDate
                              ? formatDate(orderDetails.orderProductDate)
                              : orderDetails?.orderProduct_order?.orderDate
                                ? formatDate(orderDetails.orderProduct_order.orderDate)
                                : orderDetails?.orderProduct_order?.createdAt
                                  ? formatDate(orderDetails.orderProduct_order.createdAt)
                                  : orderDetails?.createdAt
                                    ? formatDate(orderDetails.createdAt)
                                    : "N/A"}
                          </p>
                        </div>
                      </div>

                      {/* Order Confirmed */}
                      <div className="relative flex items-start gap-6">
                        <div
                          className={cn(
                            "relative z-10 flex h-12 w-12 items-center justify-center rounded-full shadow-md",
                            [
                              "CANCELLED",
                              "DELIVERED",
                              "OFD",
                              "SHIPPED",
                              "CONFIRMED",
                            ].includes(orderDetails?.orderProductStatus || "")
                              ? "bg-blue-100"
                              : "bg-gray-100",
                          )}
                        >
                          {[
                            "CANCELLED",
                            "DELIVERED",
                            "OFD",
                            "SHIPPED",
                            "CONFIRMED",
                          ].includes(orderDetails?.orderProductStatus || "") ? (
                            <CheckCircle className="h-6 w-6 text-blue-600" />
                          ) : (
                            <Clock className="h-6 w-6 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 pt-1">
                          <h4 className="mb-1 font-semibold text-gray-900">
                            {t("order_confirmed")}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {[
                              "CANCELLED",
                              "DELIVERED",
                              "OFD",
                              "SHIPPED",
                              "CONFIRMED",
                            ].includes(orderDetails?.orderProductStatus || "")
                              ? (orderDetails?.orderProductDate
                                  ? formatDate(orderDetails.orderProductDate)
                                  : orderDetails?.orderProduct_order?.orderDate
                                    ? formatDate(orderDetails.orderProduct_order.orderDate)
                                    : orderDetails?.orderProduct_order?.createdAt
                                      ? formatDate(orderDetails.orderProduct_order.createdAt)
                                      : orderDetails?.createdAt
                                        ? formatDate(orderDetails.createdAt)
                                        : "N/A")
                              : "Pending"}
                          </p>
                        </div>
                      </div>

                      {/* Shipped */}
                      <div className="relative flex items-start gap-6">
                        <div
                          className={cn(
                            "relative z-10 flex h-12 w-12 items-center justify-center rounded-full shadow-md",
                            [
                              "CANCELLED",
                              "DELIVERED",
                              "OFD",
                              "SHIPPED",
                            ].includes(orderDetails?.orderProductStatus || "")
                              ? "bg-purple-100"
                              : "bg-gray-100",
                          )}
                        >
                          {[
                            "CANCELLED",
                            "DELIVERED",
                            "OFD",
                            "SHIPPED",
                          ].includes(orderDetails?.orderProductStatus || "") ? (
                            <Truck className="h-6 w-6 text-purple-600" />
                          ) : (
                            <Clock className="h-6 w-6 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 pt-1">
                          <h4 className="mb-1 font-semibold text-gray-900">
                            {t("shipped")}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {[
                              "CANCELLED",
                              "DELIVERED",
                              "OFD",
                              "SHIPPED",
                            ].includes(orderDetails?.orderProductStatus || "")
                              ? formatDate(orderDetails?.updatedAt)
                              : "Pending"}
                          </p>
                        </div>
                      </div>

                      {/* Out for Delivery */}
                      <div className="relative flex items-start gap-6">
                        <div
                          className={cn(
                            "relative z-10 flex h-12 w-12 items-center justify-center rounded-full shadow-md",
                            ["CANCELLED", "DELIVERED", "OFD"].includes(
                              orderDetails?.orderProductStatus || "",
                            )
                              ? "bg-orange-100"
                              : "bg-gray-100",
                          )}
                        >
                          {["CANCELLED", "DELIVERED", "OFD"].includes(
                            orderDetails?.orderProductStatus || "",
                          ) ? (
                            <Truck className="h-6 w-6 text-orange-600" />
                          ) : (
                            <Clock className="h-6 w-6 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 pt-1">
                          <h4 className="mb-1 font-semibold text-gray-900">
                            {t("out_for_delivery")}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {["CANCELLED", "DELIVERED", "OFD"].includes(
                              orderDetails?.orderProductStatus || "",
                            )
                              ? formatDate(orderDetails?.updatedAt)
                              : "Pending"}
                          </p>
                        </div>
                      </div>

                      {/* Delivered/Cancelled */}
                      <div className="relative flex items-start gap-6">
                        <div
                          className={cn(
                            "relative z-10 flex h-12 w-12 items-center justify-center rounded-full shadow-md",
                            ["CANCELLED", "DELIVERED"].includes(
                              orderDetails?.orderProductStatus || "",
                            )
                              ? orderDetails?.orderProductStatus === "CANCELLED"
                                ? "bg-red-100"
                                : "bg-green-100"
                              : "bg-gray-100",
                          )}
                        >
                          {["CANCELLED", "DELIVERED"].includes(
                            orderDetails?.orderProductStatus || "",
                          ) ? (
                            orderDetails?.orderProductStatus === "CANCELLED" ? (
                              <XCircle className="h-6 w-6 text-red-600" />
                            ) : (
                              <CheckCircle className="h-6 w-6 text-green-600" />
                            )
                          ) : (
                            <Clock className="h-6 w-6 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 pt-1">
                          <h4 className="mb-1 font-semibold text-gray-900">
                            {orderDetails?.orderProductStatus === "CANCELLED"
                              ? t("cancelled")
                              : t("delivered")}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {["CANCELLED", "DELIVERED"].includes(
                              orderDetails?.orderProductStatus || "",
                            )
                              ? formatDate(orderDetails?.updatedAt)
                              : "Pending"}
                          </p>
                          {orderDetails?.orderProductStatus === "CANCELLED" &&
                            orderDetails?.cancelReason && (
                              <div className="mt-2 rounded-lg border border-red-200 bg-red-50 p-3">
                                <p className="mb-1 text-xs font-medium text-red-800">
                                  Cancellation Reason:
                                </p>
                                <p className="text-sm text-red-700">
                                  {orderDetails.cancelReason}
                                </p>
                              </div>
                            )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Other Order Items */}
            {otherOrderDetails && otherOrderDetails.length > 0 && (
              <Card className="overflow-hidden border-0 shadow-lg">
                <CardHeader className="border-b bg-gradient-to-r from-indigo-50 to-purple-50">
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-indigo-600" />
                    Other Items in This Order
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="space-y-6">
                    {otherOrderDetails.map((item: any) => (
                      <div
                        key={item?.id}
                        className="flex gap-6 border-b pb-6 last:border-b-0 last:pb-0"
                      >
                        {/* Product Image */}
                        <Link
                          href={`/my-orders/${item?.id}`}
                          className="flex-shrink-0"
                        >
                          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl border-2 border-gray-200 bg-white shadow-md transition-shadow hover:shadow-lg">
                            {item?.orderProductType === "SERVICE" ? (
                              <Image
                                src={PlaceholderImage}
                                alt="service-preview"
                                width={96}
                                height={96}
                                className="h-full w-full object-contain p-2"
                              />
                            ) : (
                              <Image
                                src={
                                  item?.orderProduct_productPrice
                                    ?.productPrice_product?.productImages?.[0]
                                    ?.image ||
                                  item?.orderProduct_product?.productImages?.[0]
                                    ?.image ||
                                  PlaceholderImage
                                }
                                alt="product-preview"
                                width={96}
                                height={96}
                                className="h-full w-full object-contain p-2"
                              />
                            )}
                          </div>
                        </Link>

                        {/* Product Info */}
                        <div className="min-w-0 flex-1">
                          <h3 className="mb-1 line-clamp-2 text-lg font-bold text-gray-900">
                            {item?.orderProductType === "SERVICE"
                              ? item?.serviceFeatures?.serviceFeatures?.[0]
                                  ?.name
                              : item?.orderProduct_productPrice
                                  ?.productPrice_product?.productName ||
                                item?.orderProduct_product?.productName ||
                                "Unknown Product"}
                          </h3>
                          <div className="mb-2 flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Package className="h-3 w-3" />
                              Qty: {item?.orderQuantity || 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {item?.orderProductDate
                                ? formatDate(item.orderProductDate)
                                : item?.createdAt
                                  ? formatDate(item.createdAt)
                                  : "-"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="text-xl font-bold text-blue-600">
                              {currency.symbol}
                              {item?.orderProductType === "SERVICE"
                                ? Number(item?.purchasePrice || 0) *
                                  (item?.orderQuantity || 0)
                                : item?.orderProduct_productPrice?.offerPrice
                                  ? Number(
                                      item?.orderProduct_productPrice
                                        ?.offerPrice * item?.orderQuantity,
                                    )
                                  : item?.purchasePrice
                                    ? Number(
                                        item?.purchasePrice *
                                          item?.orderQuantity,
                                      )
                                    : item?.salePrice
                                      ? Number(
                                          item?.salePrice * item?.orderQuantity,
                                        )
                                      : 0}
                            </div>
                            <Badge
                              className={`${getStatusColor(item?.orderProductStatus || "")} flex items-center gap-1`}
                            >
                              {getStatusIcon(item?.orderProductStatus || "")}
                              {item?.orderProductStatus || "Loading..."}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default MyOrderDetailsPage;
