"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import PlaceholderImage from "@/public/images/product-placeholder.png";
import {
  MapPin, CreditCard, FileText, Download, Star,
  AlertTriangle, ReceiptText, HelpCircle, Clock,
  ArrowLeft, Copy, ExternalLink,
} from "lucide-react";
import {
  useOrderById,
  useConfirmReceipt,
  usePickupCode,
} from "@/apis/queries/orders.queries";
import ConfirmReceiptButton from "@/components/modules/delivery/ConfirmReceiptButton";
import PickupCodeDisplay from "@/components/modules/delivery/PickupCodeDisplay";
import OrderTimeline from "@/components/modules/orders/OrderTimeline";
import AddressCard from "@/components/modules/orders/AddressCard";
import TrackingChatPanel from "@/components/modules/orders/TrackingChatPanel";
import OtherOrderItems from "@/components/modules/orders/OtherOrderItems";
import ComplaintModal from "@/components/modules/orders/ComplaintModal";
import RefundModal from "@/components/modules/orders/RefundModal";
import OrderDetailSkeleton from "@/components/modules/orders/OrderDetailSkeleton";
import type {
  OrderAddressRecord,
  OrderProductDetail,
  OrderTrackingInfo,
} from "@/components/modules/orders/types";

async function copyText(text: string) {
  try {
    if (navigator?.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
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
  } catch { /* noop */ }
}

export default function OrderDetailPage() {
  const t = useTranslations();
  const { langDir, currency, selectedLocale } = useAuth();
  const params = useParams();
  const router = useRouter();

  const orderQuery = useOrderById(
    { orderProductId: params?.id ? (params.id as string) : "" },
    !!params?.id,
  );

  const order = orderQuery.data?.data as OrderProductDetail | undefined;
  const orderInfo = order?.orderProduct_order;
  const addresses = orderInfo?.order_orderAddress as OrderAddressRecord[] | undefined;
  const shipping = addresses?.find((a) => a?.addressType === "SHIPPING");
  const billing = addresses?.find((a) => a?.addressType === "BILLING");
  const otherItems = (orderQuery.data?.otherData as Record<string, unknown>[] | undefined)?.[0]?.order_orderProducts as OrderProductDetail[] | undefined;
  const shippingDetail = order?.orderShippingDetail;
  const tracking = (order?.breakdown?.tracking || (order as Record<string, unknown>)?.tracking) as OrderTrackingInfo | undefined;
  const shippingType = shippingDetail?.orderShippingType;

  const confirmMutation = useConfirmReceipt();
  const pickupQuery = usePickupCode(
    Number(params?.id) || 0,
    shippingType === "PICKUP" &&
      ["CONFIRMED", "SHIPPED", "OFD", "DELIVERED"].includes(order?.orderProductStatus || ""),
  );

  const product =
    order?.orderProduct_productPrice?.productPrice_product ||
    order?.orderProduct_product ||
    {} as Record<string, unknown>;
  const ppd = order?.orderProduct_productPrice || {} as Record<string, unknown>;

  const [liveStatus, setLiveStatus] = useState("");
  const [showComplainModal, setShowComplainModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);

  const status = liveStatus || order?.orderProductStatus || "CONFIRMED";
  const isService = order?.orderProductType === "SERVICE";

  const adminDetail = ppd.adminDetail as Record<string, string> | undefined;
  const sellerName = adminDetail
    ? `${adminDetail.firstName || ""} ${adminDetail.lastName || ""}`.trim()
    : "Seller";

  const productImage =
    (product as Record<string, unknown>).productImages
      ? ((product as Record<string, unknown>).productImages as { image?: string }[])?.[0]?.image
      : null;

  const offerPrice = ppd.offerPrice as number | undefined;
  const totalPrice = isService
    ? Number(order?.purchasePrice || 0) * (order?.orderQuantity ?? 0)
    : offerPrice
      ? Number(offerPrice) * (order?.orderQuantity ?? 0)
      : Number(order?.purchasePrice || order?.salePrice || 0) * (order?.orderQuantity ?? 0);

  const orderDate =
    order?.orderProductDate ||
    orderInfo?.orderDate ||
    orderInfo?.createdAt ||
    order?.createdAt;

  const [liveDates, setLiveDates] = useState<Record<string, string>>({});

  const timelineDates: Record<string, string> = {
    ...(orderDate ? { placed: orderDate } : {}),
    ...((order as Record<string, unknown>)?.confirmedAt || orderDate
      ? { confirmed: ((order as Record<string, unknown>)?.confirmedAt as string) || orderDate! }
      : {}),
    ...((order as Record<string, unknown>)?.shippedAt
      ? { shipped: (order as Record<string, unknown>).shippedAt as string }
      : {}),
    ...((order as Record<string, unknown>)?.ofdAt
      ? { ofd: (order as Record<string, unknown>).ofdAt as string }
      : {}),
    ...((order as Record<string, unknown>)?.deliveredAt
      ? { delivered: (order as Record<string, unknown>).deliveredAt as string }
      : {}),
    ...liveDates,
  };

  const formatDateShort = (d: string) =>
    new Date(d).toLocaleDateString(selectedLocale || "en", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  if (orderQuery.isLoading) {
    return <OrderDetailSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/home" className="transition-colors hover:text-foreground">
            {t("home")}
          </Link>
          <span>/</span>
          <Link href="/orders" className="transition-colors hover:text-foreground">
            {t("my_orders")}
          </Link>
          <span>/</span>
          <span className="font-semibold text-foreground">
            {orderInfo?.orderNo || `#${params?.id}`}
          </span>
        </nav>

        {/* Row 1: Address + Actions */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <AddressCard
            title={t("delivery_address")}
            icon={MapPin}
            iconColor="text-red-500"
            name={`${shipping?.firstName || ""} ${shipping?.lastName || ""}`.trim() || "—"}
            address={shipping?.address || "—"}
            phone={shipping?.phone || "—"}
            pin={shipping?.postCode}
          />
          <AddressCard
            title={t("billing_address") || "Billing Address"}
            icon={CreditCard}
            iconColor="text-blue-500"
            name={`${billing?.firstName || ""} ${billing?.lastName || ""}`.trim() || "—"}
            address={billing?.address || "—"}
            phone={billing?.phone || "—"}
            pin={billing?.postCode}
          />
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
              <FileText className="h-4 w-4 text-violet-500" />
              {t("more_actions") || "More actions"}
            </h3>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  const api =
                    typeof window !== "undefined"
                      ? `http://${window.location.hostname}:3000/api/v1`
                      : "";
                  window.open(
                    `${api}/order/invoice?orderProductId=${params?.id}`,
                    "_blank",
                  );
                }}
                className="flex w-full items-center gap-2 rounded-lg bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-600"
              >
                <Download className="h-4 w-4" />
                {t("download_invoice")}
              </button>
              {status === "DELIVERED" && (
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/5"
                >
                  <Star className="h-4 w-4" />
                  {t("write_review") || "Write a Review"}
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowComplainModal(true)}
                className="flex w-full items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-400"
              >
                <AlertTriangle className="h-4 w-4" />
                {t("file_complaint") || "File a Complaint"}
              </button>
              {["DELIVERED", "CONFIRMED", "SHIPPED", "OFD"].includes(status) && (
                <button
                  type="button"
                  onClick={() => setShowRefundModal(true)}
                  className="flex w-full items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 dark:border-red-800 dark:bg-red-950/20 dark:text-red-400"
                >
                  <ReceiptText className="h-4 w-4" />
                  {t("refund")}
                </button>
              )}
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
              >
                <HelpCircle className="h-4 w-4" />
                {t("need_help")}
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Product + Timeline */}
        <div className="mb-6 rounded-xl border border-border bg-card">
          <div className="flex flex-col gap-5 p-5 md:flex-row md:items-start">
            <Link
              href={`/trending/${(product as Record<string, unknown>).id || order?.orderProduct_product?.id}`}
              className="h-28 w-28 shrink-0 overflow-hidden rounded-xl border border-border bg-muted transition-opacity hover:opacity-80"
            >
              <Image
                src={productImage || PlaceholderImage}
                alt={(product as Record<string, unknown>).productName as string || "Product"}
                width={112}
                height={112}
                className="h-full w-full object-cover"
              />
            </Link>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="line-clamp-2 text-base font-bold leading-snug">
                    {isService
                      ? order?.serviceFeatures?.[0]?.serviceFeature?.name
                      : (product as Record<string, unknown>).productName as string || t("unknown_product") || "Product"}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t("seller") || "Seller"}:{" "}
                    <span className="font-medium text-foreground">
                      {sellerName}
                    </span>
                  </p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-xl font-bold text-primary">
                      {currency.symbol}{totalPrice.toFixed(2)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {t("quantity") || "Quantity"} x {order?.orderQuantity || 1}
                    </span>
                  </div>
                </div>
                <div className="shrink-0 text-end">
                  {orderDate && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {formatDateShort(orderDate)}
                    </div>
                  )}
                  <button
                    type="button"
                    className="mt-1 flex items-center gap-1 text-xs font-medium text-red-500 hover:underline"
                  >
                    <HelpCircle className="h-3 w-3" />
                    {t("need_help")}
                  </button>
                </div>
              </div>

              <div className="mt-5 rounded-lg border border-border/50 bg-muted/20 p-4">
                <OrderTimeline status={status} dates={timelineDates} />
              </div>
            </div>
          </div>

          {/* Tracking details */}
          {tracking && ["SHIPPED", "OFD", "DELIVERED"].includes(status) && (
            <div className="border-t border-border px-5 py-4">
              <div className="flex flex-wrap items-center gap-6 text-sm">
                {tracking.trackingNumber && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">
                      {t("tracking") || "Tracking"}:
                    </span>
                    <span className="font-mono font-medium">
                      {tracking.trackingNumber}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyText(tracking.trackingNumber!)}
                      className="rounded border border-border px-1.5 py-0.5 text-[10px] hover:bg-muted"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  </div>
                )}
                {tracking.carrier && (
                  <div>
                    <span className="text-muted-foreground">
                      {t("carrier") || "Carrier"}:
                    </span>{" "}
                    <span className="font-medium">{tracking.carrier}</span>
                  </div>
                )}
                {!!(shippingDetail as Record<string, unknown>)?.carrierTrackingUrl && (
                  <a
                    href={
                      String((shippingDetail as Record<string, unknown>).carrierTrackingUrl)
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary hover:underline"
                  >
                    {t("track_your_order")} <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Pickup code */}
          {shippingType === "PICKUP" && pickupQuery.data?.data && (
            <div className="border-t border-border px-5 py-4">
              <PickupCodeDisplay
                code={pickupQuery.data.data.code}
                status={pickupQuery.data.data.status || "PENDING"}
              />
            </div>
          )}

          {/* Confirm receipt */}
          {["OFD", "DELIVERED"].includes(status) && status !== "RECEIVED" && (
            <div className="border-t border-border px-5 py-4">
              <ConfirmReceiptButton
                orderProductId={Number(params?.id)}
                onConfirm={async () => {
                  await confirmMutation.mutateAsync({
                    orderProductId: Number(params?.id),
                  });
                }}
                isLoading={confirmMutation.isPending}
              />
            </div>
          )}
        </div>

        {/* Row 3: Order Summary */}
        {orderInfo && (
          <div className="mb-6 rounded-xl border border-border bg-card p-5">
            <h3 className="mb-4 text-sm font-bold">{t("order_summary")}</h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm md:grid-cols-4">
              <div>
                <span className="text-muted-foreground">{t("order_number")}</span>
                <p className="font-semibold">{orderInfo.orderNo}</p>
              </div>
              <div>
                <span className="text-muted-foreground">{t("order_status")}</span>
                <p className="font-semibold">{orderInfo.orderStatus}</p>
              </div>
              <div>
                <span className="text-muted-foreground">{t("subtotal")}</span>
                <p className="font-semibold">
                  {currency.symbol}{orderInfo.totalPrice || 0}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">{t("total_amount")}</span>
                <p className="text-lg font-bold text-primary">
                  {currency.symbol}{orderInfo.totalCustomerPay || 0}
                </p>
              </div>
              {orderInfo.paymentType !== "DIRECT" &&
                (orderInfo.dueAmount ?? 0) > 0 && (
                  <>
                    <div>
                      <span className="text-muted-foreground">
                        {t("advance_paid")}
                      </span>
                      <p className="font-semibold">
                        {currency.symbol}{orderInfo.advanceAmount || 0}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        {t("remaining_due")}
                      </span>
                      <p className="font-semibold text-amber-600">
                        {currency.symbol}{orderInfo.dueAmount || 0}
                      </p>
                    </div>
                  </>
                )}
              {shippingDetail && !isService && (
                <>
                  <div>
                    <span className="text-muted-foreground">
                      {t("shipping_mode") || "Shipping Mode"}
                    </span>
                    <p className="font-semibold">
                      {shippingDetail.orderShippingType}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      {t("delivery_charge")}
                    </span>
                    <p className="font-semibold">
                      {currency.symbol}{shippingDetail.shippingCharge || 0}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Row 4: Tracking Chat */}
        <div className="mb-6">
          <TrackingChatPanel
            sellerName={sellerName}
            langDir={langDir}
            status={status}
            orderId={orderInfo?.orderNo || String(params?.id)}
            onStatusChange={(newStatus) => {
              const now = new Date().toISOString();
              setLiveStatus(newStatus);
              const statusToDateKey: Record<string, string> = {
                CONFIRMED: "confirmed",
                SHIPPED: "shipped",
                OFD: "ofd",
                DELIVERED: "delivered",
              };
              const dateKey = statusToDateKey[newStatus];
              if (dateKey) {
                setLiveDates((prev) => {
                  const next = { ...prev, [dateKey]: now };
                  const order = ["confirmed", "shipped", "ofd", "delivered"];
                  const idx = order.indexOf(dateKey);
                  for (let i = 0; i < idx; i++) {
                    if (!next[order[i]] && !timelineDates[order[i]]) {
                      next[order[i]] = now;
                    }
                  }
                  return next;
                });
              }
            }}
          />
        </div>

        {/* Row 5: Other items */}
        {otherItems && otherItems.length > 1 && (
          <OtherOrderItems
            items={otherItems}
            currentItemId={Number(params?.id)}
          />
        )}

        {/* Back button */}
        <div className="pb-8">
          <button
            type="button"
            onClick={() => router.push("/orders")}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("back_to_orders") || "Back to My Orders"}
          </button>
        </div>
      </div>

      {/* Modals */}
      <ComplaintModal
        open={showComplainModal}
        onOpenChange={setShowComplainModal}
        orderProductId={Number(params?.id)}
        orderNo={orderInfo?.orderNo}
        productName={(product as Record<string, unknown>).productName as string || "Product"}
      />
      <RefundModal
        open={showRefundModal}
        onOpenChange={setShowRefundModal}
        orderProductId={Number(params?.id)}
        orderNo={orderInfo?.orderNo}
        amount={totalPrice}
        currencySymbol={currency.symbol}
      />
    </div>
  );
}
