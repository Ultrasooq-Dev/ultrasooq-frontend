import React from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";

interface RfqGridVendorHeaderProps {
  selectedVendor: any;
  onCheckout: () => void;
  canCheckout: boolean;
}

const RfqGridVendorHeader: React.FC<RfqGridVendorHeaderProps> = ({
  selectedVendor,
  onCheckout,
  canCheckout,
}) => {
  const t = useTranslations();
  const { langDir, currency } = useAuth();

  const offerPriceDisplay = (() => {
    if (
      !selectedVendor?.rfqQuotesProducts ||
      selectedVendor.rfqQuotesProducts.length === 0
    ) {
      return selectedVendor?.offerPrice
        ? `${currency.symbol}${selectedVendor?.offerPrice}`
        : "-";
    }
    const calculatedTotal = selectedVendor.rfqQuotesProducts.reduce(
      (total: number, product: any) => {
        if (
          product?.priceRequest &&
          product?.priceRequest?.status === "APPROVED" &&
          product?.offerPrice
        ) {
          return total + parseFloat(product.offerPrice || "0") * (product.quantity || 1);
        }
        return total;
      },
      0,
    );
    const hasApprovedPrices = selectedVendor.rfqQuotesProducts.some(
      (product: any) =>
        product?.priceRequest && product?.priceRequest?.status === "APPROVED",
    );
    return hasApprovedPrices && calculatedTotal > 0
      ? `${currency.symbol}${calculatedTotal}`
      : selectedVendor?.offerPrice
        ? `${currency.symbol}${selectedVendor?.offerPrice}`
        : "-";
  })();

  const showCheckout = (() => {
    if (
      !selectedVendor?.rfqQuotesProducts ||
      selectedVendor.rfqQuotesProducts.length === 0
    ) {
      return !!selectedVendor?.offerPrice;
    }
    const hasApprovedPrices = selectedVendor.rfqQuotesProducts.some(
      (product: any) =>
        product?.priceRequest && product?.priceRequest?.status === "APPROVED",
    );
    return hasApprovedPrices || !!selectedVendor?.offerPrice;
  })();

  const vendorName =
    selectedVendor?.sellerIDDetail?.accountName ||
    `${selectedVendor?.sellerIDDetail?.firstName || ""} ${selectedVendor?.sellerIDDetail?.lastName || ""}`.trim() ||
    selectedVendor?.sellerIDDetail?.email ||
    `Vendor ${selectedVendor?.sellerID}`;

  return (
    <div className="border-b border-border bg-card px-6 py-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Vendor Info */}
        <div className="flex items-center gap-4">
          {selectedVendor?.sellerIDDetail?.profilePicture && (
            <div className="relative h-14 w-14 overflow-hidden rounded-full border-2 border-warning/20 shadow-md">
              <Image
                src={selectedVendor.sellerIDDetail.profilePicture}
                alt="Vendor"
                fill
                className="object-cover"
              />
            </div>
          )}
          <div>
            <h3 className="text-lg font-bold text-foreground">{vendorName}</h3>
            <p className="text-sm text-muted-foreground">
              {t("vendor_details") || "Vendor Details"}
            </p>
          </div>
        </div>

        {/* Price and Checkout */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3 rounded-xl border border-green-100 bg-success/5 px-5 py-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success shadow-md">
              <svg
                className="h-5 w-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="flex flex-row items-center gap-2">
              <span
                className="text-xs font-medium text-muted-foreground whitespace-nowrap"
                dir={langDir}
                translate="no"
              >
                {t("offering_price")}
              </span>
              <span className="text-xl font-bold text-foreground">
                {offerPriceDisplay}
              </span>
            </div>
          </div>

          {showCheckout && (
            <button
              onClick={onCheckout}
              disabled={!canCheckout}
              className="bg-dark-orange inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-500/30 transition-all duration-200 hover:scale-105 hover:shadow-xl hover:shadow-orange-500/40 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
              dir={langDir}
              translate="no"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              {t("checkout")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RfqGridVendorHeader;
