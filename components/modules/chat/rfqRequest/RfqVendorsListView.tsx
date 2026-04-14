import React from "react";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import PlaceholderImage from "@/public/images/product-placeholder.png";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { RfqRequestVendorDetailsProps } from "./rfqChatTypes";
import { getVendorName, getVendorOfferPrice } from "./rfqChatUtils";

interface RfqVendorsListViewProps {
  isLoading: boolean;
  vendorList: RfqRequestVendorDetailsProps[];
  selectedVendorId?: number | null;
  onSelectVendor: (item: RfqRequestVendorDetailsProps) => void;
}

const RfqVendorsListView: React.FC<RfqVendorsListViewProps> = ({
  isLoading,
  vendorList,
  selectedVendorId,
  onSelectVendor,
}) => {
  const t = useTranslations();
  const { langDir, currency } = useAuth();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!vendorList?.length) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8">
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
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
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

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {vendorList.map((item) => {
          const name = getVendorName(item);
          const offerPrice = getVendorOfferPrice(item);
          const isSelected =
            selectedVendorId === item?.id ||
            selectedVendorId === item?.sellerID;

          return (
            <div
              key={item?.id}
              onClick={() => onSelectVendor(item)}
              className={cn(
                "cursor-pointer rounded-lg border-2 p-1.5 transition-all hover:shadow-md",
                isSelected
                  ? "border-warning bg-warning/5"
                  : "border-border bg-card hover:border-border",
              )}
            >
              <div className="flex items-center gap-2">
                <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-full border border-white ring-1 ring-gray-100">
                  <Image
                    src={item?.sellerIDDetail?.profilePicture || PlaceholderImage}
                    alt={name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-semibold text-foreground truncate">
                    {name}
                  </h4>
                  {offerPrice && offerPrice !== "-" ? (
                    <p className="mt-0.5 text-[10px] font-bold text-success">
                      {t("offer_price")}: {currency.symbol}
                      {offerPrice}
                    </p>
                  ) : (
                    <p className="mt-0.5 text-[9px] text-muted-foreground">
                      {t("no_offer_yet") || "No offer yet"}
                    </p>
                  )}
                  {item.unreadMsgCount > 0 && (
                    <div className="mt-0.5 flex items-center gap-1">
                      <span className="text-[9px] text-primary font-medium">
                        {item.unreadMsgCount} {t("unread_messages")}
                      </span>
                    </div>
                  )}
                </div>
                {isSelected && (
                  <div className="flex-shrink-0">
                    <div className="h-1.5 w-1.5 rounded-full bg-warning" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RfqVendorsListView;
