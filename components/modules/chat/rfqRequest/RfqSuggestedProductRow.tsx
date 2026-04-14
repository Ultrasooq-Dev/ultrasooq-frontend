import React from "react";
import Image from "next/image";
import PlaceholderImage from "@/public/images/product-placeholder.png";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { useDynamicTranslation } from "@/hooks/useDynamicTranslation";

interface RfqSuggestedProductRowProps {
  suggestion: any;
}

const RfqSuggestedProductRow: React.FC<RfqSuggestedProductRowProps> = ({
  suggestion: s,
}) => {
  const t = useTranslations();
  const { currency } = useAuth();
  const { translate } = useDynamicTranslation();

  const p = s.suggestedProduct;
  const imageUrl =
    p?.product_productPrice?.[0]?.productPrice_productSellerImage?.[0]?.image ||
    p?.productImages?.[0]?.image ||
    PlaceholderImage;
  const unitPrice =
    s.offerPrice ||
    p?.product_productPrice?.[0]?.offerPrice ||
    p?.product_productPrice?.[0]?.productPrice ||
    0;
  const price = parseFloat(unitPrice.toString()) * (s.quantity || 1);

  return (
    <div className="grid grid-cols-4 items-center gap-2 py-1.5 pl-8 text-[11px]">
      {/* Component column */}
      <div className="flex items-center gap-2 min-w-0">
        <div className="relative h-7 w-7 flex-shrink-0 overflow-hidden rounded border border-border bg-card">
          <Image
            src={imageUrl}
            alt={p?.productName || "Product"}
            fill
            className="object-cover"
          />
        </div>
        <div className="min-w-0 flex-1">
          <span className="truncate block text-[11px]">
            {translate(p?.productName || "-")}
          </span>
          {s.quantity && s.quantity > 0 && (
            <span className="text-[9px] text-muted-foreground">
              Qty: {s.quantity}
            </span>
          )}
        </div>
      </div>

      {/* Selection badge */}
      <div className="flex justify-center">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-success/10 text-success text-[9px] font-medium">
          <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          {t("selected") || "Selected"}
        </span>
      </div>

      {/* Price column */}
      <div className="text-center text-[10px] text-muted-foreground">
        {price ? `${currency.symbol}${price}` : "-"}
      </div>

      {/* Address column */}
      <div className="text-center text-[10px] text-muted-foreground">-</div>
    </div>
  );
};

export default RfqSuggestedProductRow;
