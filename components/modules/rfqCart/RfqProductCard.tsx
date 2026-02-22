import { Button } from "@/components/ui/button";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import validator from "validator";
import PlaceholderImage from "@/public/images/product-placeholder.png";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
// import { useCartStore } from "@/lib/rfqStore";

type RfqProductCardProps = {
  id: number;
  rfqProductId: number;
  productName: string;
  productQuantity: number;
  productImages: {
    image: string;
  }[];
  offerPriceFrom: string;
  offerPriceTo: string;
  onAdd: (
    args0: number,
    args1: number,
    args2: "add" | "remove",
    args3?: number,
    args4?: number,
    args5?: string,
  ) => void;
  onRemove: (args0: number) => void;
  note: string;
};

const RfqProductCard: React.FC<RfqProductCardProps> = ({
  id,
  rfqProductId,
  productName,
  productQuantity,
  productImages,
  offerPriceFrom,
  offerPriceTo,
  onAdd,
  onRemove,
  note,
}) => {
  const t = useTranslations();
  const { langDir, currency } = useAuth();
  const [quantity, setQuantity] = useState(1);
  // const cart = useCartStore();

  useEffect(() => {
    setQuantity(productQuantity);
  }, [productQuantity]);

  return (
    <div className="group rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-gray-300">
      <div className="flex gap-4">
        {/* Product Image */}
        <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 md:h-32 md:w-32">
          <Image
            src={
              productImages?.[0]?.image &&
              validator.isURL(productImages?.[0]?.image)
                ? productImages[0].image
                : PlaceholderImage
            }
            alt={productName || "Product"}
            fill
            className="object-cover"
          />
        </div>

        {/* Product Details */}
        <div className="flex-1 min-w-0">
          <h3 className="mb-2 text-base font-semibold text-gray-900 line-clamp-2 md:text-lg">
            {productName}
          </h3>

          {/* Quantity Controls */}
          <div className="mb-3">
            <label
              className="mb-1.5 block text-xs font-medium text-gray-600"
              dir={langDir}
              translate="no"
            >
              {t("quantity")}
            </label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 w-8 rounded-lg border-gray-300 p-0 hover:bg-gray-50 disabled:opacity-50"
                onClick={() => {
                  const newQuantity = Math.max(quantity - 1, 0);
                  setQuantity(newQuantity);
                  onAdd(
                    newQuantity,
                    rfqProductId,
                    "remove",
                    Number(offerPriceFrom || 0),
                    Number(offerPriceTo || 0),
                    note,
                  );
                }}
                disabled={quantity === 0}
              >
                <Image
                  src="/images/upDownBtn-minus.svg"
                  alt="minus-icon"
                  width={14}
                  height={14}
                />
              </Button>
              <div className="flex h-8 w-12 items-center justify-center rounded-lg border border-gray-300 bg-white text-sm font-semibold text-gray-900">
                {quantity}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 w-8 rounded-lg border-gray-300 p-0 hover:bg-gray-50"
                onClick={() => {
                  const newQuantity = quantity + 1;
                  setQuantity(newQuantity);
                  onAdd(
                    newQuantity,
                    rfqProductId,
                    "add",
                    Number(offerPriceFrom || 0),
                    Number(offerPriceTo || 0),
                    note,
                  );
                }}
              >
                <Image
                  src="/images/upDownBtn-plus.svg"
                  alt="plus-icon"
                  width={14}
                  height={14}
                />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="ml-auto text-xs text-destructive hover:bg-destructive/5 hover:text-destructive"
                onClick={() => {
                  onRemove(id);
                }}
                dir={langDir}
                translate="no"
              >
                <svg
                  className="mr-1 h-4 w-4"
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
                {t("remove")}
              </Button>
            </div>
          </div>

          {/* Price Range */}
          <div className="mb-2 grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-2">
              <p
                className="mb-1 text-xs font-medium text-gray-600"
                dir={langDir}
                translate="no"
              >
                {t("offer_price_from")}
              </p>
              <p className="text-sm font-bold text-gray-900">
                {currency.symbol}
                {offerPriceFrom || "0"}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-2">
              <p
                className="mb-1 text-xs font-medium text-gray-600"
                dir={langDir}
                translate="no"
              >
                {t("offer_price_to")}
              </p>
              <p className="text-sm font-bold text-gray-900">
                {currency.symbol}
                {offerPriceTo || "0"}
              </p>
            </div>
          </div>

          {/* Note */}
          {note && (
            <div className="rounded-lg border border-primary/10 bg-primary/5 p-2">
              <p className="text-xs font-medium text-primary" dir={langDir}>
                <span translate="no">{t("note")}:</span>{" "}
                <span className="font-normal">{note}</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RfqProductCard;
