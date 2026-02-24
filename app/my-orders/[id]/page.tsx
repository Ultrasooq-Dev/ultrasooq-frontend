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
    } catch (_) { console.error(_); }
  };

  const orderByIdQuery = useOrderById(
    {
      orderProductId: searchParams?.id ? (searchParams.id as string) : "",
    },
    !!searchParams?.id,
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
        return "bg-muted text-foreground";
      case "CONFIRMED":
        return "bg-primary/10 text-primary";
      case "SHIPPED":
        return "bg-info/10 text-info";
      case "OFD":
        return "bg-warning/10 text-warning";
      case "DELIVERED":
        return "bg-success/10 text-success";
      case "CANCELLED":
        return "bg-destructive/10 text-destructive";
      default:
        return "bg-muted text-foreground";
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
      <div className="min-h-screen bg-muted">
        <div className="w-full px-6 py-8 lg:px-12">
          {/* Breadcrumb Navigation */}
          <nav className="mb-8">
            <ol className="flex items-center space-x-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/home"
                  className="transition-colors hover:text-foreground"
                  dir={langDir}
                >
                  {t("home")}
                </Link>
              </li>
              <li className="flex items-center">
                <span className="mx-2">/</span>
                <Link
                  href="/my-orders"
                  className="transition-colors hover:text-foreground"
                  dir={langDir}
                >
                  {t("my_orders")}
                </Link>
              </li>
              <li className="flex items-center">
                <span className="mx-2">/</span>
                <span className="font-medium text-foreground">
                  {orderDetails?.orderProduct_order?.orderNo || "Loading..."}
                </span>
              </li>
            </ol>
          </nav>

          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-indigo-600 shadow-lg">
                  <ShoppingBag className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1
                    className="text-3xl font-bold text-foreground"
                    dir={langDir}
                  >
                    Order Details
                  </h1>
                  <p className="mt-1 text-muted-foreground" dir={langDir}>
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
                <CardHeader className="bg-gradient-to-r from-primary/5 to-info/5">
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    Delivery Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-semibold text-foreground" dir={langDir}>
                        {shippingDetails?.firstName} {shippingDetails?.lastName}
                      </h3>
                    </div>
                    <address
                      className="leading-relaxed text-muted-foreground not-italic"
                      dir={langDir}
                    >
                      {shippingDetails?.address}
                      <br />
                      <span className="text-muted-foreground">
                        Pin: {shippingDetails?.postCode}
                      </span>
                    </address>
                    <div className="flex items-center gap-2 border-t pt-2 text-muted-foreground">
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
                    <CreditCard className="h-5 w-5 text-success" />
                    Billing Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-semibold text-foreground" dir={langDir}>
                        {billingDetails?.firstName} {billingDetails?.lastName}
                      </h3>
                    </div>
                    <address
                      className="leading-relaxed text-muted-foreground not-italic"
                      dir={langDir}
                    >
                      {billingDetails?.address}
                      <br />
                      <span className="text-muted-foreground">
                        Pin: {billingDetails?.postCode}
                      </span>
                    </address>
                    <div className="flex items-center gap-2 border-t pt-2 text-muted-foreground">
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
                    <FileText className="h-5 w-5 text-info" />
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
              <CardHeader className="bg-gradient-to-r from-primary/5 to-info/5">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Order Number
                    </label>
                    <p className="text-lg font-semibold text-foreground">
                      {orderDetails.orderProduct_order.orderNo || "N/A"}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Order Status
                    </label>
                    <p className="text-lg font-semibold text-foreground">
                      {orderDetails.orderProduct_order.orderStatus || "N/A"}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Date & Time
                    </label>
                    <p className="text-lg font-semibold text-foreground">
                      {orderDetails.orderProduct_order.orderDate
                        ? formatDate(orderDetails.orderProduct_order.orderDate)
                        : orderDetails.orderProduct_order.createdAt
                          ? formatDate(orderDetails.orderProduct_order.createdAt)
                          : "N/A"}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Subtotal
                    </label>
                    <p className="text-lg font-semibold text-foreground">
                      {currency.symbol}
                      {orderDetails.orderProduct_order.totalPrice || 0}
                    </p>
                  </div>
                  {(orderDetails.orderProduct_order.totalDiscount ?? 0) > 0 && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">
                        Discount
                      </label>
                      <p className="text-lg font-semibold text-success">
                        -{currency.symbol}
                        {orderDetails.orderProduct_order.totalDiscount || 0}
                      </p>
                    </div>
                  )}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Total Amount
                    </label>
                    <p className="text-xl font-bold text-primary">
                      {currency.symbol}
                      {orderDetails.orderProduct_order.totalCustomerPay || 0}
                    </p>
                  </div>
                  {orderDetails.orderProduct_order.paymentType !== 'DIRECT' && 
                   (orderDetails.orderProduct_order.dueAmount ?? 0) > 0 && (
                    <>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">
                          Advance Paid
                        </label>
                        <p className="text-lg font-semibold text-foreground">
                          {currency.symbol}
                          {orderDetails.orderProduct_order.advanceAmount || 0}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">
                          Remaining Due
                        </label>
                        <p className="text-lg font-semibold text-warning">
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
                  <CardHeader className="bg-gradient-to-r from-warning/5 to-warning/5">
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="h-5 w-5 text-warning" />
                      Shipping Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <h4 className="flex items-center gap-2 font-medium text-foreground">
                          <Truck className="h-4 w-4 text-muted-foreground" />
                          Shipping Mode
                        </h4>
                        <p className="text-muted-foreground">
                          {orderDetails?.orderShippingDetail?.orderShippingType}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <h4 className="flex items-center gap-2 font-medium text-foreground">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          Delivery Charge
                        </h4>
                        <p className="text-muted-foreground">
                          {currency.symbol}
                          {orderDetails?.orderShippingDetail?.shippingCharge}
                        </p>
                      </div>
                      {orderDetails?.orderShippingDetail?.orderShippingType ===
                        "PICKUP" && (
                        <>
                          <div className="space-y-2">
                            <h4 className="flex items-center gap-2 font-medium text-foreground">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              Shipping Date
                            </h4>
                            <p className="text-muted-foreground">
                              {convertDate(
                                orderDetails?.orderShippingDetail?.shippingDate,
                              )}
                            </p>
                          </div>
                          <div className="space-y-2">
                            <h4 className="flex items-center gap-2 font-medium text-foreground">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              From Time
                            </h4>
                            <p className="text-muted-foreground">
                              {convertTime(
                                orderDetails?.orderShippingDetail?.fromTime,
                              )}
                            </p>
                          </div>
                          <div className="space-y-2">
                            <h4 className="flex items-center gap-2 font-medium text-foreground">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              To Time
                            </h4>
                            <p className="text-muted-foreground">
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
                        <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-xl border-2 border-border bg-card shadow-md transition-shadow hover:shadow-lg">
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
                        <h3 className="mb-2 text-xl font-bold text-foreground">
                          {orderDetails?.orderProductType === "SERVICE"
                            ? orderDetails?.serviceFeatures
                                ?.[0]?.serviceFeature?.name
                            : orderDetails?.orderProduct_productPrice
                                ?.productPrice_product?.productName ||
                              orderDetails?.orderProduct_product?.productName ||
                              "Unknown Product"}
                        </h3>
                        <div className="mb-3 flex items-center gap-6 text-sm text-muted-foreground">
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
                        <div className="text-2xl font-bold text-primary">
                          {currency.symbol}
                          {orderDetails?.orderProductType === "SERVICE"
                            ? Number(orderDetails?.purchasePrice || 0) *
                              (orderDetails?.orderQuantity ?? 0)
                            : orderDetails?.orderProduct_productPrice
                                  ?.offerPrice
                              ? Number(
                                  orderDetails?.orderProduct_productPrice
                                    ?.offerPrice * (orderDetails?.orderQuantity ?? 0),
                                )
                              : orderDetails?.purchasePrice
                                ? Number(
                                    orderDetails?.purchasePrice *
                                      (orderDetails?.orderQuantity ?? 0),
                                  )
                                : orderDetails?.salePrice
                                  ? Number(
                                      orderDetails?.salePrice *
                                        (orderDetails?.orderQuantity ?? 0),
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
                    <RotateCcw className="h-5 w-5 text-success" />
                    Order Tracking
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                  {(() => {
                    const tracking = (
                      orderDetails?.breakdown?.tracking ||
                      (orderDetails as Record<string, unknown>)?.tracking
                    ) as import("@/types/order").OrderTrackingInfo | undefined;
                    const showTracking = [
                      "SHIPPED",
                      "OFD",
                      "DELIVERED",
                    ].includes(orderDetails?.orderProductStatus || "");
                    if (!showTracking || !tracking) return null;
                    return (
                      <div className="mb-8 rounded-lg border bg-card p-4">
                        <h4 className="mb-3 font-semibold text-foreground">
                          Tracking details
                        </h4>
                        <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
                          <div>
                            <div className="text-muted-foreground">Tracking Number</div>
                            <div className="flex items-center gap-2 font-medium text-foreground">
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
                            <div className="text-muted-foreground">Carrier</div>
                            <div className="font-medium text-foreground">
                              {tracking?.carrier || "-"}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Added</div>
                            <div className="font-medium text-foreground">
                              {tracking?.addedAt
                                ? formattedDate(tracking.addedAt)
                                : "-"}
                            </div>
                          </div>
                        </div>
                        {tracking?.notes ? (
                          <div className="mt-3 text-sm">
                            <div className="text-muted-foreground">Notes</div>
                            <div className="text-foreground">
                              {tracking.notes}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    );
                  })()}
                  <div className="relative">
                    {/* Timeline */}
                    <div className="absolute top-0 bottom-0 left-6 w-0.5 bg-muted"></div>

                    <div className="space-y-6">
                      {/* Order Placed */}
                      <div className="relative flex items-start gap-6">
                        <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-success/10 shadow-md">
                          <CheckCircle className="h-6 w-6 text-success" />
                        </div>
                        <div className="flex-1 pt-1">
                          <h4 className="mb-1 font-semibold text-foreground">
                            {t("placed")}
                          </h4>
                          <p className="text-sm text-muted-foreground">
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
                              ? "bg-primary/10"
                              : "bg-muted",
                          )}
                        >
                          {[
                            "CANCELLED",
                            "DELIVERED",
                            "OFD",
                            "SHIPPED",
                            "CONFIRMED",
                          ].includes(orderDetails?.orderProductStatus || "") ? (
                            <CheckCircle className="h-6 w-6 text-primary" />
                          ) : (
                            <Clock className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 pt-1">
                          <h4 className="mb-1 font-semibold text-foreground">
                            {t("order_confirmed")}
                          </h4>
                          <p className="text-sm text-muted-foreground">
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
                              ? "bg-info/10"
                              : "bg-muted",
                          )}
                        >
                          {[
                            "CANCELLED",
                            "DELIVERED",
                            "OFD",
                            "SHIPPED",
                          ].includes(orderDetails?.orderProductStatus || "") ? (
                            <Truck className="h-6 w-6 text-info" />
                          ) : (
                            <Clock className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 pt-1">
                          <h4 className="mb-1 font-semibold text-foreground">
                            {t("shipped")}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {[
                              "CANCELLED",
                              "DELIVERED",
                              "OFD",
                              "SHIPPED",
                            ].includes(orderDetails?.orderProductStatus || "")
                              ? formatDate(orderDetails?.updatedAt ?? "")
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
                              ? "bg-warning/10"
                              : "bg-muted",
                          )}
                        >
                          {["CANCELLED", "DELIVERED", "OFD"].includes(
                            orderDetails?.orderProductStatus || "",
                          ) ? (
                            <Truck className="h-6 w-6 text-warning" />
                          ) : (
                            <Clock className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 pt-1">
                          <h4 className="mb-1 font-semibold text-foreground">
                            {t("out_for_delivery")}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {["CANCELLED", "DELIVERED", "OFD"].includes(
                              orderDetails?.orderProductStatus || "",
                            )
                              ? formatDate(orderDetails?.updatedAt ?? "")
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
                                ? "bg-destructive/10"
                                : "bg-success/10"
                              : "bg-muted",
                          )}
                        >
                          {["CANCELLED", "DELIVERED"].includes(
                            orderDetails?.orderProductStatus || "",
                          ) ? (
                            orderDetails?.orderProductStatus === "CANCELLED" ? (
                              <XCircle className="h-6 w-6 text-destructive" />
                            ) : (
                              <CheckCircle className="h-6 w-6 text-success" />
                            )
                          ) : (
                            <Clock className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 pt-1">
                          <h4 className="mb-1 font-semibold text-foreground">
                            {orderDetails?.orderProductStatus === "CANCELLED"
                              ? t("cancelled")
                              : t("delivered")}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {["CANCELLED", "DELIVERED"].includes(
                              orderDetails?.orderProductStatus || "",
                            )
                              ? formatDate(orderDetails?.updatedAt ?? "")
                              : "Pending"}
                          </p>
                          {orderDetails?.orderProductStatus === "CANCELLED" &&
                            orderDetails?.cancelReason && (
                              <div className="mt-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                                <p className="mb-1 text-xs font-medium text-destructive">
                                  Cancellation Reason:
                                </p>
                                <p className="text-sm text-destructive">
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
                <CardHeader className="border-b bg-gradient-to-r from-indigo-50 to-info/5">
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-info" />
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
                          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl border-2 border-border bg-card shadow-md transition-shadow hover:shadow-lg">
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
                          <h3 className="mb-1 line-clamp-2 text-lg font-bold text-foreground">
                            {item?.orderProductType === "SERVICE"
                              ? item?.serviceFeatures?.serviceFeatures?.[0]
                                  ?.name
                              : item?.orderProduct_productPrice
                                  ?.productPrice_product?.productName ||
                                item?.orderProduct_product?.productName ||
                                "Unknown Product"}
                          </h3>
                          <div className="mb-2 flex items-center gap-4 text-sm text-muted-foreground">
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
                            <div className="text-xl font-bold text-primary">
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
