import React from "react";
import Image from "next/image";
import PlaceholderImage from "@/public/images/product-placeholder.png";
import { cn } from "@/lib/utils";
import validator from "validator";
import moment from "moment";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";

type RequestProductCardProps = {
  rfqId?: number;
  onClick?: () => void;
  isSelected?: boolean;
  productImages?: {
    id: number;
    image: string;
  }[];
  messageInfo?: {
    lastUnreadMessage: {
      content: string;
      createdAt: string;
    };
    unreadMsgCount: number;
  };
};

const RequestProductCard: React.FC<RequestProductCardProps> = ({
  rfqId,
  onClick,
  isSelected,
  productImages,
  messageInfo,
}) => {
  const t = useTranslations();
  const { langDir } = useAuth();

  return (
    <div
      className={cn(
        "flex w-full flex-col gap-3 rounded-xl bg-gray-50 p-4 shadow-sm",
        isSelected ? "ring-dark-orange ring-2 ring-offset-2" : "",
      )}
      dir={langDir}
    >
      {/* RFQ ID and Product Image in Row */}
      <div className="flex items-center justify-between gap-3">
        {/* RFQ ID Section */}
        <div className="flex flex-shrink-0 items-center gap-2">
          <div className="bg-dark-orange flex h-10 w-10 items-center justify-center rounded-lg shadow-md">
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-medium text-gray-500" translate="no">
              {t("rfq_id")}
            </span>
            <span
              className="text-dark-orange text-base font-bold"
              translate="no"
            >
              RFQ{String(rfqId || "").padStart(5, "0")}
            </span>
          </div>
        </div>

        {/* Product Image */}
        {productImages && productImages.length > 0 ? (
          productImages.length === 1 ? (
            // Single image - show next to RFQ ID
            <div className="relative min-w-0 flex-1 overflow-hidden rounded-lg">
              <div className="relative aspect-[3/2] max-h-24 w-full">
                <Image
                  src={
                    productImages[0]?.image &&
                    validator.isURL(productImages[0].image)
                      ? productImages[0].image
                      : PlaceholderImage
                  }
                  fill
                  alt="Product"
                  className="object-contain p-1 transition-transform duration-200 hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 120px"
                />
              </div>
            </div>
          ) : (
            // Multiple images - show first image next to RFQ ID
            <div className="relative min-w-0 flex-1 overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
              <div className="relative aspect-[3/2] max-h-24 w-full">
                <Image
                  src={
                    productImages[0]?.image &&
                    validator.isURL(productImages[0].image)
                      ? productImages[0].image
                      : PlaceholderImage
                  }
                  fill
                  alt="Product"
                  className="object-contain p-1 transition-transform duration-200 hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 120px"
                />
              </div>
            </div>
          )
        ) : (
          <div className="flex h-24 flex-1 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
            <svg
              className="h-6 w-6 text-gray-400"
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

      {/* Additional Images Grid (if multiple images) */}
      {productImages && productImages.length > 1 && (
        <div className="grid grid-cols-2 gap-2">
          {productImages.slice(1, 5).map((ele: any, index: number) => (
            <div
              key={ele?.id || index + 1}
              className="group hover:border-dark-orange relative aspect-square w-full overflow-hidden rounded-lg border border-gray-200 bg-gray-100 transition-all duration-200 hover:shadow-sm"
            >
              <Image
                src={
                  ele?.image && validator.isURL(ele.image)
                    ? ele.image
                    : PlaceholderImage
                }
                fill
                alt={`Product ${index + 2}`}
                className="object-contain p-1 transition-transform duration-200 group-hover:scale-105"
                sizes="(max-width: 768px) 50vw, 80px"
              />
              {index === 3 && productImages.length > 5 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                  <span className="text-xs font-bold text-white">
                    +{productImages.length - 5}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Message Info */}
      {messageInfo?.lastUnreadMessage?.createdAt && (
        <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
          <div className="flex items-start justify-between gap-2">
            <p className="line-clamp-2 flex-1 text-xs text-gray-600">
              {messageInfo.lastUnreadMessage.content}
            </p>
            {messageInfo?.unreadMsgCount > 0 && (
              <div className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-600 px-1.5 text-xs font-bold text-white shadow-sm">
                {messageInfo.unreadMsgCount > 9
                  ? "9+"
                  : messageInfo.unreadMsgCount}
              </div>
            )}
          </div>
          {messageInfo?.lastUnreadMessage?.createdAt && (
            <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
              <svg
                className="h-3 w-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>
                {moment(messageInfo.lastUnreadMessage.createdAt).fromNow()}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RequestProductCard;
