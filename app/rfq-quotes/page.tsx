"use client";
import React, { useEffect, useMemo, useState } from "react";
import Pagination from "@/components/shared/Pagination";
import {
  useAllRfqQuotesByBuyerId,
  useDeleteRfqQuote,
  useAllRfqQuotesUsersByBuyerId,
} from "@/apis/queries/rfq.queries";
import { Skeleton } from "@/components/ui/skeleton";
import Footer from "@/components/shared/Footer";
import { MONTHS } from "@/utils/constants";
import validator from "validator";
import Image from "next/image";
import PlaceholderImage from "@/public/images/product-placeholder.png";
import Link from "next/link";
import { Dialog } from "@/components/ui/dialog";
import DeleteContent from "@/components/shared/DeleteContent";
import { useToast } from "@/components/ui/use-toast";
import { PERMISSION_RFQ_QUOTES, checkPermission } from "@/helpers/permission";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { IoMdArrowDown, IoMdArrowUp } from "react-icons/io";
import moment from "moment";

const RfqQuotesPage = () => {
  const t = useTranslations();
  const { langDir } = useAuth();
  const router = useRouter();
  const hasPermission = checkPermission(PERMISSION_RFQ_QUOTES);
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [limit] = useState(5);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number>();

  const rfqQuotesByBuyerIdQuery = useAllRfqQuotesByBuyerId(
    {
      page,
      limit,
    },
    hasPermission,
  );
  const deleteRfqQuote = useDeleteRfqQuote();

  const memoizedRfqQuotesProducts = useMemo(() => {
    return (
      rfqQuotesByBuyerIdQuery.data?.data?.map((item: any) => {
        return {
          id: item?.id,
          productImages:
            item?.rfqQuotesProducts?.map(
              (ele: any) => ele?.rfqProductDetails?.productImages?.[0]?.image,
            ) || [],
          rfqDate: item?.rfqQuotes_rfqQuoteAddress?.rfqDate || "-",
          address: item?.rfqQuotes_rfqQuoteAddress?.address || "-",
          countryId: item?.rfqQuotes_rfqQuoteAddress?.countryId,
          stateId: item?.rfqQuotes_rfqQuoteAddress?.stateId,
          cityId: item?.rfqQuotes_rfqQuoteAddress?.cityId,
          createdAt: item?.createdAt,
          productCount: item?.rfqQuotesProducts?.length || 0,
        };
      }) || []
    );
  }, [rfqQuotesByBuyerIdQuery.data?.data]);

  const formatDate = useMemo(
    () => (originalDateString: string) => {
      if (!originalDateString || originalDateString === "-") return "-";
      const originalDate = new Date(originalDateString);

      if (!originalDate || originalDate.toString() === "Invalid Date")
        return "-";

      return moment(originalDate).format("MMM DD, YYYY hh:mm A");
    },
    [],
  );

  const handleToggleDeleteModal = () => {
    setIsDeleteModalOpen(!isDeleteModalOpen);
    setSelectedProductId(undefined);
  };

  const handleConfirmation = async (isConfirmed: boolean) => {
    if (!isConfirmed) {
      setIsDeleteModalOpen(false);
      setSelectedProductId(undefined);
      return;
    }

    if (!selectedProductId) return;

    const response = await deleteRfqQuote.mutateAsync({
      rfqQuotesId: selectedProductId,
    });
    if (response.status && response.data) {
      setIsDeleteModalOpen(false);
    }
    if (response.status && response.data) {
      toast({
        title: t("product_delete_successful"),
        description: response.message,
        variant: "success",
      });
      setIsDeleteModalOpen(false);
      setSelectedProductId(undefined);
    } else {
      toast({
        title: t("product_delete_failed"),
        description: response.message,
        variant: "danger",
      });
    }
  };

  useEffect(() => {
    if (!hasPermission) router.push("/home");
  }, []);

  if (!hasPermission) return <div></div>;

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <div className="container m-auto max-w-7xl px-4 py-8">
          {/* Header */}
          <div className="mb-6">
            <h1
              className="text-3xl font-bold text-gray-900"
              dir={langDir}
              translate="no"
            >
              {t("rfq_product")}
            </h1>
            <p
              className="mt-2 text-sm text-gray-600"
              dir={langDir}
              translate="no"
            >
              {t("manage_your_rfq_requests") ||
                "Manage your RFQ requests and quotes"}
            </p>
          </div>

          {/* Loading State */}
          {rfqQuotesByBuyerIdQuery?.isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-48 w-full rounded-xl" />
              ))}
            </div>
          ) : null}

          {/* Empty State */}
          {!memoizedRfqQuotesProducts.length &&
          !rfqQuotesByBuyerIdQuery.isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
                <svg
                  className="h-10 w-10 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <p
                className="text-center text-lg font-medium text-gray-500"
                dir={langDir}
                translate="no"
              >
                {t("no_product_found")}
              </p>
            </div>
          ) : null}

          {/* RFQ Quote Cards */}
          {!rfqQuotesByBuyerIdQuery.isLoading &&
            memoizedRfqQuotesProducts.length > 0 && (
              <div className="space-y-4">
                {memoizedRfqQuotesProducts.map((item: any) => (
                  <RfqQuoteCard
                    key={item?.id}
                    item={item}
                    formatDate={formatDate}
                    onDelete={() => {
                      handleToggleDeleteModal();
                      setSelectedProductId(item?.id);
                    }}
                    langDir={langDir}
                    t={t}
                  />
                ))}
              </div>
            )}

          {/* Pagination */}
          {rfqQuotesByBuyerIdQuery.data?.totalCount > limit && (
            <div className="mt-8">
              <Pagination
                page={page}
                setPage={setPage}
                totalCount={rfqQuotesByBuyerIdQuery.data?.totalCount}
                limit={limit}
              />
            </div>
          )}
        </div>

        <Dialog open={isDeleteModalOpen} onOpenChange={handleToggleDeleteModal}>
          <DeleteContent
            onClose={() => handleConfirmation(false)}
            onConfirm={() => handleConfirmation(true)}
            isLoading={deleteRfqQuote.isPending}
          />
        </Dialog>
      </div>
      <Footer />
    </>
  );
};

// RFQ Quote Card Component
interface RfqQuoteCardProps {
  item: any;
  formatDate: (date: string) => string;
  onDelete: () => void;
  langDir: string;
  t: (key: string) => string;
}

const RfqQuoteCard: React.FC<RfqQuoteCardProps> = ({
  item,
  formatDate,
  onDelete,
  langDir,
  t,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { currency } = useAuth();

  // Fetch vendor data for this RFQ quote (always fetch to show counts in compact view)
  const vendorsQuery = useAllRfqQuotesUsersByBuyerId(
    {
      page: 1,
      limit: 100,
      rfqQuotesId: item?.id,
    },
    !!item?.id,
  );

  const vendorCount = vendorsQuery.data?.data?.length || 0;

  const totalUnreadMessages = useMemo(() => {
    if (!vendorsQuery.data?.data || !Array.isArray(vendorsQuery.data.data))
      return 0;
    return vendorsQuery.data.data.reduce((total: number, vendor: any) => {
      const count = vendor.unreadMsgCount || vendor.unreadMessageCount || 0;
      return total + (typeof count === "number" ? count : 0);
    }, 0);
  }, [vendorsQuery.data?.data]);

  // Calculate actual vendor offer price from price requests
  const getVendorOfferPrice = (vendor: any) => {
    const products = vendor?.rfqQuotesUser_rfqQuotes?.rfqQuotesProducts || [];

    // Check if vendor has provided any price requests
    const hasPriceRequests =
      vendor?.rfqProductPriceRequests &&
      vendor.rfqProductPriceRequests.length > 0;

    if (hasPriceRequests && products.length > 0) {
      // Vendor has provided price requests - calculate total from those
      const calculatedTotal = products.reduce((total: number, product: any) => {
        const priceRequest = vendor.rfqProductPriceRequests?.find(
          (request: any) => request.rfqQuoteProductId === product.id,
        );

        if (priceRequest) {
          // Use the price from the price request (vendor's actual offer)
          const price = parseFloat(priceRequest.requestedPrice || "0");
          const quantity = product.quantity || 1;
          return total + price * quantity;
        }

        return total;
      }, 0);

      return calculatedTotal > 0 ? calculatedTotal.toString() : null;
    }

    // No price requests from vendor - check if offerPrice is from customer's budget range
    if (products.length > 0) {
      // Check if all products have budget range
      const allHaveBudgetRange = products.every(
        (product: any) =>
          product.offerPriceFrom &&
          product.offerPriceTo &&
          product.offerPriceFrom > 0 &&
          product.offerPriceTo > 0,
      );

      if (allHaveBudgetRange) {
        // Calculate total budget range maximum
        const budgetMaxTotal = products.reduce(
          (total: number, product: any) => {
            const maxPrice = parseFloat(product.offerPriceTo || "0");
            const quantity = product.quantity || 1;
            return total + maxPrice * quantity;
          },
          0,
        );

        // If offerPrice matches the budget range maximum, it's not a vendor offer
        const currentOfferPrice = parseFloat(vendor?.offerPrice || "0");
        if (Math.abs(currentOfferPrice - budgetMaxTotal) < 0.01) {
          // This is the customer's budget range, not vendor's offer
          return null;
        }
      }
    }

    // Return original offerPrice if it exists and is not from budget range
    return vendor?.offerPrice || null;
  };

  const vendorsWithOffers = useMemo(() => {
    if (!vendorsQuery.data?.data) return [];
    return vendorsQuery.data.data
      .map((vendor: any) => ({
        ...vendor,
        calculatedOfferPrice: getVendorOfferPrice(vendor),
      }))
      .filter(
        (vendor: any) =>
          vendor.calculatedOfferPrice &&
          vendor.calculatedOfferPrice !== "-" &&
          vendor.calculatedOfferPrice !== "" &&
          vendor.calculatedOfferPrice !== null &&
          vendor.calculatedOfferPrice !== undefined,
      );
  }, [vendorsQuery.data?.data]);

  const vendorsWithOffersCount = vendorsWithOffers.length;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md">
      {/* Compact View */}
      <div className="flex items-center gap-4 p-6">
        {/* Product Images */}
        <div className="flex-shrink-0">
          <div className="flex gap-2">
            {item?.productImages?.slice(0, 3).map((ele: any, index: number) => (
              <div
                key={`${ele}_${index}`}
                className="relative h-20 w-20 overflow-hidden rounded-lg border border-gray-200 bg-gray-100"
              >
                <Image
                  src={ele && validator.isURL(ele) ? ele : PlaceholderImage}
                  fill
                  alt={`Product ${index + 1}`}
                  className="object-cover"
                />
              </div>
            ))}
            {item?.productImages?.length > 3 && (
              <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
                <span className="text-sm font-bold text-gray-600">
                  +{item.productImages.length - 3}
                </span>
              </div>
            )}
            {(!item?.productImages || item.productImages.length === 0) && (
              <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
                <svg
                  className="h-8 w-8 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <Link
                href={`/rfq-request?rfqQuotesId=${item?.id}`}
                className="hover:text-dark-orange text-xl font-bold text-gray-900 transition-colors"
              >
                RFQ{String(item?.id || "").padStart(5, "0")}
              </Link>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                {item?.productCount} {t("products")}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1.5">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span>{formatDate(item?.rfqDate)}</span>
              </div>
              {vendorsQuery.data?.data && (
                <>
                  <div className="flex items-center gap-1.5">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    <span className="font-medium">
                      {vendorCount} {t("vendors")}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    <span
                      className={`font-medium ${totalUnreadMessages > 0 ? "text-primary" : "text-gray-500"}`}
                    >
                      {totalUnreadMessages} {t("unread_messages")}
                    </span>
                  </div>
                  {vendorsWithOffersCount > 0 && (
                    <div className="flex items-center gap-1.5">
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="font-medium text-success">
                        {vendorsWithOffersCount} {t("offers")}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Link
              href={`/rfq-request?rfqQuotesId=${item?.id}`}
              className="hover:border-dark-orange hover:text-dark-orange inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              {t("view")}
            </Link>
            <button
              type="button"
              onClick={onDelete}
              className="inline-flex items-center gap-2 rounded-lg border border-destructive/30 bg-white px-4 py-2 text-sm font-medium text-destructive transition-all hover:bg-destructive/5"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              {t("delete")}
            </button>
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-600 transition-all hover:bg-gray-50"
              title={isExpanded ? t("collapse") : t("expand")}
            >
              {isExpanded ? (
                <IoMdArrowUp size={20} />
              ) : (
                <IoMdArrowDown size={20} />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded View */}
      {isExpanded && (
        <div className="border-t border-gray-200 bg-gray-50 p-6">
          {vendorsQuery.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-lg" />
              ))}
            </div>
          ) : vendorsWithOffers && vendorsWithOffers.length > 0 ? (
            <div className="space-y-4">
              <div className="mb-4 flex items-center justify-between">
                <h3
                  className="text-lg font-semibold text-gray-900"
                  dir={langDir}
                  translate="no"
                >
                  {t("vendor_quotes") || "Vendor Quotes"} (
                  {vendorsWithOffersCount})
                </h3>
                {totalUnreadMessages > 0 && (
                  <div className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1">
                    <svg
                      className="h-4 w-4 text-primary"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    <span className="text-sm font-bold text-primary">
                      {totalUnreadMessages}{" "}
                      {t("unread_messages") || "Unread Messages"}
                    </span>
                  </div>
                )}
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {vendorsWithOffers.map((vendor: any) => (
                  <Link
                    key={vendor.id}
                    href={`/rfq-request?rfqQuotesId=${item?.id}`}
                    className="group hover:border-dark-orange rounded-lg border border-gray-200 bg-white p-4 transition-all hover:shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-12 overflow-hidden rounded-full border-2 border-white ring-2 ring-gray-100">
                          <Image
                            src={
                              vendor.sellerIDDetail?.profilePicture ||
                              PlaceholderImage
                            }
                            alt={vendor.sellerIDDetail?.accountName || "Vendor"}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <h4 className="group-hover:text-dark-orange font-semibold text-gray-900 transition-colors">
                            {vendor.sellerIDDetail?.accountName ||
                              `${vendor.sellerIDDetail?.firstName || ""} ${vendor.sellerIDDetail?.lastName || ""}`.trim() ||
                              "Vendor"}
                          </h4>
                          {vendor.calculatedOfferPrice &&
                          vendor.calculatedOfferPrice !== "-" ? (
                            <p className="mt-1 text-sm font-bold text-success">
                              {t("offer_price")}: {currency.symbol}
                              {vendor.calculatedOfferPrice}
                            </p>
                          ) : (
                            <p className="mt-1 text-sm text-gray-500">
                              {t("no_offer_yet") || "No offer yet"}
                            </p>
                          )}
                        </div>
                      </div>
                      {vendor.unreadMsgCount > 0 && (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                          {vendor.unreadMsgCount > 9
                            ? "9+"
                            : vendor.unreadMsgCount}
                        </div>
                      )}
                    </div>
                    {vendor.lastUnreadMessage?.content && (
                      <p className="mt-2 line-clamp-2 text-xs text-gray-600">
                        {vendor.lastUnreadMessage.content}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <svg
                className="h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p
                className="mt-3 text-sm font-medium text-gray-500"
                dir={langDir}
                translate="no"
              >
                {t("no_offers_yet") || "No vendors have submitted offers yet"}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RfqQuotesPage;
