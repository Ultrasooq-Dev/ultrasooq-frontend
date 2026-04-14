import React from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";

interface SellerChatDetailHeaderProps {
  quoteProducts: any[];
  selectedRfqQuote: any;
}

/**
 * The compact header bar in the detail view showing the current offering price.
 */
const SellerChatDetailHeader: React.FC<SellerChatDetailHeaderProps> = ({
  quoteProducts,
  selectedRfqQuote,
}) => {
  const t = useTranslations();
  const { langDir, currency } = useAuth();

  const computeDisplayPrice = () => {
    if (!quoteProducts || quoteProducts.length === 0) {
      return selectedRfqQuote?.offerPrice ? `${currency.symbol}${selectedRfqQuote?.offerPrice}` : "-";
    }
    const calculatedTotal = quoteProducts.reduce((total: number, product: any) => {
      if (product?.priceRequest && product?.priceRequest?.status === "APPROVED" && product?.offerPrice) {
        const price = parseFloat(product.offerPrice || "0");
        const quantity = product.quantity || 1;
        return total + price * quantity;
      }
      return total;
    }, 0);
    const hasApprovedPrices = quoteProducts.some(
      (product: any) => product?.priceRequest && product?.priceRequest?.status === "APPROVED",
    );
    return hasApprovedPrices && calculatedTotal > 0
      ? `${currency.symbol}${calculatedTotal}`
      : selectedRfqQuote?.offerPrice
        ? `${currency.symbol}${selectedRfqQuote?.offerPrice}`
        : "-";
  };

  return (
    <div className="flex w-full items-center justify-between border-b border-border bg-muted px-4 py-2">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded bg-success/10">
          <svg className="h-4 w-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="flex flex-row items-center gap-2">
          <p className="text-xs font-medium text-muted-foreground whitespace-nowrap" dir={langDir} translate="no">
            {t("offering_price")}
          </p>
          <p className="text-base font-bold text-success" dir={langDir} translate="no">
            {computeDisplayPrice()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SellerChatDetailHeader;
