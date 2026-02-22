"use client";
import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAllRfqQuotesByBuyerId,
  useAllRfqQuotesUsersByBuyerId,
} from "@/apis/queries/rfq.queries";
import validator from "validator";
import PlaceholderImage from "@/public/images/product-placeholder.png";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import moment from "moment";

interface BuyerChatProps {
  layoutMode?: "grid" | "column";
  viewMode?: "rfqRequests" | "vendors" | "details";
  selectedRfqId?: number | null;
  selectedVendorId?: number | null;
  onSelectRfq?: (rfq: any) => void;
  onSelectVendor?: (vendor: any) => void;
}

const BuyerChat: React.FC<BuyerChatProps> = ({
  layoutMode = "grid",
  viewMode = "rfqRequests",
  selectedRfqId = null,
  selectedVendorId = null,
  onSelectRfq,
  onSelectVendor,
}) => {
  const t = useTranslations();
  const { langDir, currency } = useAuth();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const rfqQuotesByBuyerIdQuery = useAllRfqQuotesByBuyerId(
    {
      page,
      limit,
    },
    true,
  );

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
          createdAt: item?.createdAt,
          productCount: item?.rfqQuotesProducts?.length || 0,
        };
      }) || []
    );
  }, [rfqQuotesByBuyerIdQuery.data?.data]);

  // Column layout - RFQ Requests List
  if (layoutMode === "column" && viewMode === "rfqRequests") {
    return (
      <div className="flex h-full flex-col">
        {rfqQuotesByBuyerIdQuery?.isLoading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        ) : !memoizedRfqQuotesProducts.length ? (
          <div className="flex h-full flex-col items-center justify-center p-8">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <svg
                className="h-8 w-8 text-muted-foreground"
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
            <p className="text-center text-sm font-medium text-muted-foreground">
              {t("no_product_found")}
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {memoizedRfqQuotesProducts.map((item: any) => {
              const firstImage = item?.productImages?.[0];
              const imageUrl =
                firstImage && validator.isURL(firstImage)
                  ? firstImage
                  : PlaceholderImage;

              return (
                <div
                  key={item?.id}
                  onClick={() => onSelectRfq?.(item)}
                  className={cn(
                    "cursor-pointer rounded-lg border-2 p-3 transition-all hover:shadow-md",
                    selectedRfqId === item?.id
                      ? "border-warning bg-warning/5"
                      : "border-border bg-card hover:border-border",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                      <Image
                        src={imageUrl}
                        alt="Product"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-foreground truncate">
                        RFQ{String(item?.id || "").padStart(5, "0")}
                      </h4>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item?.productCount} {t("products")}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDate(item?.rfqDate)}
                      </p>
                    </div>
                    {selectedRfqId === item?.id && (
                      <div className="flex-shrink-0">
                        <div className="h-2 w-2 rounded-full bg-warning"></div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Default grid layout (fallback)
  return null;
};

export default BuyerChat;

