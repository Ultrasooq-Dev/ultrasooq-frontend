import React from "react";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslations } from "next-intl";
import { useDynamicTranslation } from "@/hooks/useDynamicTranslation";
import validator from "validator";
import { cn } from "@/lib/utils";
import { RfqQuoteType } from "./sellerChatTypes";

interface SellerChatRfqListProps {
  isLoading: boolean;
  groupedRfqQuotes: RfqQuoteType[][];
  selectedRfqId?: number | null;
  onSelectRfq?: (rfq: any, rfqGroup?: any[]) => void;
}

/**
 * Column layout — Column 2: renders the list of distinct RFQ requests.
 */
const SellerChatRfqList: React.FC<SellerChatRfqListProps> = ({
  isLoading,
  groupedRfqQuotes,
  selectedRfqId,
  onSelectRfq,
}) => {
  const t = useTranslations();
  const { translate } = useDynamicTranslation();

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        ) : groupedRfqQuotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-muted-foreground">{t("no_data_found")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {groupedRfqQuotes.map((rfqGroup) => {
              const mainQuote = rfqGroup[0];
              const buyerInfo = mainQuote.buyerIDDetail;
              const buyerName =
                (buyerInfo as any)?.accountName ||
                `${buyerInfo?.firstName || ""} ${buyerInfo?.lastName || ""}`.trim() ||
                "Buyer";

              const allProductNames = rfqGroup
                .flatMap(
                  (quote) =>
                    quote.rfqQuotesUser_rfqQuotes?.rfqQuotesProducts?.map(
                      (product: any) => product?.rfqProductDetails?.productName || "Product",
                    ) || [],
                )
                .filter(Boolean);

              const firstProductImage = rfqGroup
                .flatMap(
                  (quote) =>
                    quote.rfqQuotesUser_rfqQuotes?.rfqQuotesProducts?.map(
                      (product: any) => product?.rfqProductDetails?.productImages?.[0]?.image,
                    ) || [],
                )
                .filter(Boolean)[0];

              const translatedProductNames = allProductNames.map((name) => translate(name));
              const productDisplayText =
                translatedProductNames.length > 0
                  ? translatedProductNames.length === 1
                    ? translatedProductNames[0]
                    : `${translatedProductNames[0]}${translatedProductNames.length > 1 ? ` +${translatedProductNames.length - 1} ${t("more")}` : ""}`
                  : t("no_products");

              return (
                <div
                  key={mainQuote.rfqQuotesId}
                  onClick={() => onSelectRfq?.(mainQuote, rfqGroup)}
                  className={cn(
                    "cursor-pointer rounded-lg border-2 bg-card p-4 transition-all hover:border-destructive hover:bg-destructive/5",
                    selectedRfqId === mainQuote.rfqQuotesId
                      ? "border-destructive bg-destructive/5"
                      : "border-border",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 overflow-hidden rounded bg-muted flex-shrink-0">
                      {firstProductImage && validator.isURL(firstProductImage) ? (
                        <Image src={firstProductImage} alt={productDisplayText} fill className="object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <svg className="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{productDisplayText}</p>
                      <p className="text-sm text-muted-foreground mt-1 truncate">
                        {buyerName} - {rfqGroup.length} request{rfqGroup.length > 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerChatRfqList;
