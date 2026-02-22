import React from "react";
import Image from "next/image";
import moment from "moment";
import { cn } from "@/lib/utils";
import AvatarPlaceholder from "@/public/images/no-user-image.png";
import { useAuth } from "@/context/AuthContext";

type VendorCardProps = {
  offerPrice: string;
  name: string;
  profilePicture: string;
  onClick?: () => void;
  isSelected?: boolean;
  seller: {
    firstName: string;
    lastName: string;
    profilePicture: string;
  };
  vendor: {
    lastUnreadMessage: {
      content: string;
      createdAt: string;
    };
    unreadMsgCount: number;
  };
};

const VendorCard: React.FC<VendorCardProps> = ({
  offerPrice,
  name,
  profilePicture,
  onClick,
  isSelected,
  vendor,
}) => {
  const { currency } = useAuth();
  const hasPrice = offerPrice && offerPrice !== "-" && offerPrice !== "";
  const hasMessage = vendor?.lastUnreadMessage?.createdAt;
  const hasUnread = vendor?.unreadMsgCount > 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative flex w-full items-start gap-1.5 rounded-lg border-2 bg-white p-1.5 text-left transition-all duration-200",
        isSelected
          ? "border-dark-orange bg-white shadow-md shadow-orange-100/50"
          : "border-gray-200 hover:border-gray-300 hover:shadow-sm",
      )}
    >
      {/* Profile Picture with Status Indicator */}
      <div className="relative flex-shrink-0">
        <div className="relative h-8 w-8 overflow-hidden rounded-full border border-white shadow-sm ring-0.5 ring-gray-100 group-hover:ring-gray-200">
          <Image
            src={profilePicture || AvatarPlaceholder}
            alt={name || "Vendor"}
            fill
            className="object-cover"
          />
        </div>
        {hasUnread && (
          <div className="absolute -right-0.5 -top-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-white shadow-md ring-1 ring-white">
            {vendor.unreadMsgCount > 9 ? "9+" : vendor.unreadMsgCount}
          </div>
        )}
        {hasPrice && !hasUnread && (
          <div className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-success shadow-sm ring-1 ring-white">
            <svg className="h-1.5 w-1.5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        {/* Vendor Name */}
        <div className="flex items-center justify-between gap-2">
          <h4 className="truncate text-xs font-semibold text-gray-900 group-hover:text-dark-orange transition-colors">
            {name || "Unknown Vendor"}
          </h4>
        </div>

        {/* Offer Price */}
        <div className="flex items-center gap-1">
          <span className="text-[9px] font-medium text-gray-500 whitespace-nowrap">Offer Price:</span>
          {hasPrice ? (
            <span className="inline-flex items-center gap-0.5 rounded bg-success/5 px-1 py-0.5 text-[10px] font-bold text-success ring-0.5 ring-green-200">
              <svg className="h-2 w-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.154 1.154c.562.649 1.413 1.076 2.346 1.076V17a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 15.766 14 14.991 14 14c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 11.092V9.151c.391.127.68.317.843.504a1 1 0 101.154-1.154c-.562-.649-1.413-1.076-2.346-1.076V7a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 8.234 6 9.009 6 10c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.154 1.154c.562.649 1.413 1.076 2.346 1.076V17a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 15.766 14 14.991 14 14c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 11.092V9.151c.391.127.68.317.843.504a1 1 0 101.154-1.154c-.562-.649-1.413-1.076-2.346-1.076V7a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 8.234 6 9.009 6 10c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.154 1.154c.562.649 1.413 1.076 2.346 1.076V17a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 15.766 14 14.991 14 14c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 11.092V9.151c.391.127.68.317.843.504a1 1 0 101.154-1.154c-.562-.649-1.413-1.076-2.346-1.076V7a1 1 0 10-2 0v.092z" clipRule="evenodd" />
              </svg>
              {currency.symbol}{offerPrice}
            </span>
          ) : (
            <span className="text-[9px] font-medium text-gray-400">Not quoted yet</span>
          )}
        </div>

        {/* Last Message Preview */}
        {hasMessage && (
          <div className="mt-0.5 space-y-0.5">
            <p className="line-clamp-2 text-[9px] text-gray-600">
              {vendor.lastUnreadMessage.content}
            </p>
            <div className="flex items-center gap-1 text-[8px] text-gray-400">
              <svg className="h-2 w-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{moment(vendor.lastUnreadMessage.createdAt).fromNow()}</span>
            </div>
          </div>
        )}

        {/* Action Hint */}
        {!hasMessage && !hasPrice && (
          <div className="mt-0.5 flex items-center gap-1 text-[9px] text-gray-400">
            <svg className="h-2 w-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>Click to start conversation</span>
          </div>
        )}
      </div>

      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute right-1 top-1">
          <div className="flex h-3 w-3 items-center justify-center rounded-full bg-dark-orange text-white shadow-md">
            <svg className="h-2 w-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      )}
    </button>
  );
};

export default VendorCard;
