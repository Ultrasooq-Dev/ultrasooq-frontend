import React from "react";
import RequestProductCard from "@/components/modules/rfqRequest/RequestProductCard";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";

interface RfqGridRequestHeaderProps {
  rfqQuoteId: any;
  selectedVendor: any;
}

const RfqGridRequestHeader: React.FC<RfqGridRequestHeaderProps> = ({
  rfqQuoteId,
  selectedVendor,
}) => {
  const t = useTranslations();
  const { langDir } = useAuth();

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-lg shadow-border/50">
      <div className="bg-dark-orange flex min-h-[70px] w-full items-center px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-card/20 backdrop-blur-sm">
            <svg
              className="h-6 w-6 text-white"
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
          <div>
            <h2
              className="text-lg font-bold text-white"
              dir={langDir}
              translate="no"
            >
              {t("request_for_rfq")}
            </h2>
            <p className="mt-0.5 text-xs text-white/90">
              {t("view_request_details") || "View your request details"}
            </p>
          </div>
        </div>
      </div>
      <div className="p-6">
        <RequestProductCard
          rfqId={rfqQuoteId}
          productImages={selectedVendor?.rfqQuotesProducts
            ?.map((item: any) => item?.rfqProductDetails?.productImages)
            ?.map((item: any) => item?.[0])}
        />
      </div>
    </div>
  );
};

export default RfqGridRequestHeader;
