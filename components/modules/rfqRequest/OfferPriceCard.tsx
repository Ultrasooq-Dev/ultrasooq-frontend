import React, { useEffect, useState } from "react";
import Image from "next/image";
import moment from "moment";
import PlaceholderImage from "@/public/images/product-placeholder.png";
import { capitalizeWord, formatDate, formatPrice } from "@/utils/helper";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "next-intl";

type OfferPriceCardProps = {
  offerPrice: string;
  note: string;
  quantity: number;
  productType?: string;
  address: string;
  deliveryDate: string;
  productImage: string;
  productName: string;
  productId: number;
  onRequestPrice: (productId: number, requestedPrice: number) => void;
  priceRequest: any;
  offerPriceFrom?: number;
  offerPriceTo?: number;
  isBuyer?: boolean;
  hasFirstVendorApproval?: boolean;
};

const OfferPriceCard: React.FC<OfferPriceCardProps> = ({
  offerPrice,
  note,
  quantity,
  productType,
  address,
  deliveryDate,
  productImage,
  productName,
  productId,
  onRequestPrice,
  priceRequest,
  offerPriceFrom,
  offerPriceTo,
  isBuyer = false,
  hasFirstVendorApproval = false,
}) => {
  const t = useTranslations();
  const { currency, langDir } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editedOfferPrice, setEditedOfferPrice] = useState("");

  useEffect(() => {
    setEditedOfferPrice(offerPrice);
  }, [offerPrice, priceRequest]);

  // Exit edit mode if price gets approved while editing, but only if buyer hasn't received first vendor approval
  // After first approval, both parties can continue editing even if current price is approved
  useEffect(() => {
    if (priceRequest?.status === "APPROVED" && isEditing && isBuyer && !hasFirstVendorApproval) {
      setIsEditing(false);
    }
  }, [priceRequest?.status, isEditing, isBuyer, hasFirstVendorApproval]);

  // Check if buyer can edit: only after first vendor approval
  const canBuyerEdit = !isBuyer || hasFirstVendorApproval;
  
  // After first vendor approval, both parties can edit even if current price is approved
  // This allows continued negotiation after the first approval
  // Only disable editing if buyer hasn't received first vendor approval yet
  const isEditDisabled = isBuyer && !hasFirstVendorApproval;

  const handleEditClick = () => {
    if (!isEditDisabled) {
      setIsEditing(true);
    }
  };

  const handleSaveClick = () => {
    if (!isEditDisabled) {
      setIsEditing(false);
      onRequestPrice(productId, parseInt(editedOfferPrice));
    }
  };

  const handleCancelClick = () => {
    setIsEditing(false);
    setEditedOfferPrice(offerPrice);
  };

  return (
    <div className="border-b border-solid border-gray-300 px-1.5 py-1">
      <div className="grid grid-cols-6 gap-1 items-start">
        {/* Product Column */}
        <div className="flex-shrink-0 min-w-0">
          <div className="flex items-center gap-1">
            <div className="relative h-6 w-6 flex-shrink-0 border border-gray-300 rounded overflow-hidden">
              <Image
                src={productImage || PlaceholderImage}
                alt="preview"
                fill
                className="object-cover"
              />
            </div>
            <p className="text-xs font-normal text-black leading-tight line-clamp-2 min-w-0">
              {productName || "-"}
            </p>
          </div>
        </div>
        
        {/* Delivery Date Column */}
        <div className="flex-shrink-0 px-0.5">
          {productType === "SAME" ? (
            <div className="flex flex-col gap-0" dir={langDir}>
              <span className="text-xs font-semibold text-blue-600 leading-tight" translate="no">
                {t("same_product")}
              </span>
              <span className="text-[10px] text-gray-500 leading-tight" translate="no">
                {t("same_product_required")}
              </span>
            </div>
          ) : productType === "SIMILAR" ? (
            <div className="flex flex-col gap-0" dir={langDir}>
              <span className="text-xs font-semibold text-green-600 leading-tight" translate="no">
                {t("similar_product")}
              </span>
              <span className="text-[10px] text-gray-500 leading-tight" translate="no">
                {t("similar_products_allowed")}
              </span>
            </div>
          ) : (
            <span className="text-xs text-gray-500">-</span>
          )}
        </div>
        
        {/* Brand Column */}
        <div className="flex-shrink-0 px-0.5">
          <span className="text-xs font-normal text-black leading-tight">
            {formatDate(deliveryDate) || "-"}
          </span>
        </div>
        
        {/* Number of Piece Column */}
        <div className="flex-shrink-0 px-0.5">
          <span className="text-xs font-normal text-black leading-tight">{quantity || "-"}</span>
        </div>
        
        {/* Price Column */}
        <div className="flex-shrink-0 px-0.5 min-w-0">
          {isEditing && !isEditDisabled ? (
            <div className="w-full">
              <input
                value={editedOfferPrice}
                onChange={(e) => setEditedOfferPrice(e.target.value)}
                className="w-full rounded border border-gray-300 px-1 py-0.5 text-xs"
                type="number"
                disabled={isEditDisabled}
              />
              <div className="mt-0.5 flex gap-1">
                <button
                  onClick={handleSaveClick}
                  disabled={isEditDisabled}
                  className="text-[10px] text-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                  translate="no"
                >
                  {t("save")}
                </button>
                <button
                  onClick={handleCancelClick}
                  className="text-[10px] text-red-500"
                  translate="no"
                >
                  {t("cancel")}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-0">
              {/* Show budget range if available */}
              {offerPriceFrom && offerPriceTo && offerPriceFrom > 0 && offerPriceTo > 0 && (
                <div className="text-[10px] mb-0.5">
                  <div className="text-gray-600 mb-0.5" translate="no">
                    {t("budget")}:
                  </div>
                  <div className="font-semibold text-green-600 leading-tight">
                    {currency.symbol}{offerPriceFrom} - {currency.symbol}{offerPriceTo}
                  </div>
                  <div className="mt-0.5 text-gray-500 text-[10px] leading-tight" translate="no">
                    {t("customer_budget_range")}
                  </div>
                </div>
              )}
              {/* Always show offer price and edit button */}
              <div className="flex flex-col gap-0">
                <div className="text-xs font-normal text-black leading-tight">
                  {editedOfferPrice ? `${currency.symbol}${editedOfferPrice}` : "-"}
                </div>
                {!isEditDisabled && (
                  <button
                    onClick={handleEditClick}
                    className="text-[10px] text-blue-500 leading-tight self-start"
                    translate="no"
                  >
                    {t("edit")}
                  </button>
                )}
                {priceRequest?.status === "APPROVED" && (
                  <span className="text-[10px] text-gray-500 leading-tight" translate="no">
                    ({t("approved")})
                  </span>
                )}
                {isBuyer && !hasFirstVendorApproval && (
                  <span className="text-[10px] text-gray-500 leading-tight" translate="no">
                    {t("waiting_for_vendor_offer") || "Waiting for vendor offer"}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Address Column */}
        <div className="flex-shrink-0 px-0.5 min-w-0">
          <span className="text-xs font-normal text-black leading-tight line-clamp-2">
            {address || "-"}
          </span>
        </div>
      </div>
      {priceRequest?.status === "PENDING" ? (
        <div className="mt-1 flex w-full flex-wrap rounded border border-gray-300 px-1.5 py-0.5 bg-gray-50">
          <p className="text-[10px] font-normal text-gray-500 leading-tight">
            <span translate="no">{t("requested_offer_price")}:</span>
            <span className="mx-1.5">
              <span translate="no">{t("requested_price")}:</span>{" "}
              {formatPrice(priceRequest?.requestedPrice, currency.symbol)}
            </span>
            <span className="mx-1.5">
              <span translate="no">{t("status")}:</span>{" "}
              {capitalizeWord(priceRequest?.status)}
            </span>
            <span>
              <span translate="no">{t("date")}:</span>{" "}
              {moment(priceRequest?.updatedAt).format("MM-DD HH:mm")}
            </span>
          </p>
        </div>
      ) : null}
      {note && (
        <div
          className="mt-1 flex w-full flex-wrap rounded border border-gray-300 px-1.5 py-0.5 bg-gray-50"
          dir={langDir}
        >
          <span className="text-[10px] font-normal text-gray-500 leading-tight" translate="no">
            {t("vendor_note")}:{" "}
          </span>
          <p className="text-[10px] font-normal text-black leading-tight inline"> {note || "-"}</p>
        </div>
      )}
    </div>
  );
};

export default OfferPriceCard;
