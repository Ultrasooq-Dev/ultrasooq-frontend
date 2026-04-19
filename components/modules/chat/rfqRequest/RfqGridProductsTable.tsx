import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import OfferPriceCard from "@/components/modules/rfqRequest/OfferPriceCard";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";

interface RfqGridProductsTableProps {
  selectedVendor: any;
  rfqQuoteDetailsById: any;
  isLoading: boolean;
  onRequestPrice: (productId: number, requestedPrice: number) => void;
}

const RfqGridProductsTable: React.FC<RfqGridProductsTableProps> = ({
  selectedVendor,
  rfqQuoteDetailsById,
  isLoading,
  onRequestPrice,
}) => {
  const t = useTranslations();
  const { langDir } = useAuth();

  if (
    !selectedVendor?.rfqQuotesProducts?.length &&
    !isLoading
  ) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
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
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
        </div>
        <p
          className="text-center text-sm font-medium text-muted-foreground"
          dir={langDir}
          translate="no"
        >
          {t("no_data_found")}
        </p>
      </div>
    );
  }

  if (!selectedVendor?.rfqQuotesProducts?.length) return null;

  return (
    <div className="mb-6 overflow-hidden rounded-xl border border-border bg-card shadow-md">
      {/* Table Header */}
      <div className="sticky top-0 z-10 grid grid-cols-6 gap-4 border-b border-border bg-card px-4 py-4">
        {[
          t("product"),
          t("delivery_date"),
          t("brand"),
          t("number_of_piece"),
          t("price"),
          t("address"),
        ].map((header, i) => (
          <div
            key={i}
            className="text-xs font-bold text-muted-foreground md:text-sm"
            dir={langDir}
            translate="no"
          >
            {header}
          </div>
        ))}
      </div>

      <div className="max-h-[300px] overflow-y-auto">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          selectedVendor?.rfqQuotesProducts?.map(
            (item: {
              id: number;
              priceRequest: any;
              offerPrice: string;
              note: string;
              quantity: number;
              offerPriceFrom?: number;
              offerPriceTo?: number;
              productType?: string;
              hasFirstVendorApproval?: boolean;
              rfqProductDetails: {
                productName: string;
                productImages: { id: number; image: string }[];
              };
            }) => (
              <OfferPriceCard
                key={item?.id}
                productId={item?.id}
                offerPrice={item?.offerPrice}
                note={item?.note}
                quantity={item?.quantity}
                productType={item?.productType}
                offerPriceFrom={item?.offerPriceFrom}
                offerPriceTo={item?.offerPriceTo}
                address={
                  rfqQuoteDetailsById?.rfqQuotes_rfqQuoteAddress?.address
                }
                deliveryDate={
                  rfqQuoteDetailsById?.rfqQuotes_rfqQuoteAddress?.rfqDate
                }
                productImage={
                  item?.rfqProductDetails?.productImages[0]?.image
                }
                productName={item?.rfqProductDetails?.productName}
                onRequestPrice={onRequestPrice}
                priceRequest={item?.priceRequest}
                isBuyer={true}
                hasFirstVendorApproval={item?.hasFirstVendorApproval || false}
              />
            ),
          )
        )}
      </div>
    </div>
  );
};

export default RfqGridProductsTable;
