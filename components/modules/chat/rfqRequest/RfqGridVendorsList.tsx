import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import RfqRequestVendorCard from "./RfqRequestVendorCard";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { RfqRequestVendorDetailsProps } from "./rfqChatTypes";
import { getVendorName, getVendorOfferPrice } from "./rfqChatUtils";

interface RfqGridVendorsListProps {
  isLoading: boolean;
  vendorList: RfqRequestVendorDetailsProps[];
  activeSellerId?: number;
  onSelectVendor: (item: RfqRequestVendorDetailsProps) => void;
}

const RfqGridVendorsList: React.FC<RfqGridVendorsListProps> = ({
  isLoading,
  vendorList,
  activeSellerId,
  onSelectVendor,
}) => {
  const t = useTranslations();
  const { langDir } = useAuth();

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-lg shadow-border/50">
      {/* Section Header */}
      <div className="flex min-h-[50px] w-full items-center justify-between border-b border-border bg-card px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-warning/10">
            <svg
              className="h-4 w-4 text-warning"
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
          <div>
            <h2
              className="text-sm font-bold text-foreground"
              dir={langDir}
              translate="no"
            >
              {t("vendor_lists")}
            </h2>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              {t("select_vendor_to_chat") ||
                "Select a vendor to view details and chat"}
            </p>
          </div>
        </div>
        {vendorList?.length > 0 && (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-warning text-[10px] font-bold text-white shadow-md">
            {vendorList.length}
          </span>
        )}
      </div>

      <div className="p-3">
        {isLoading && (
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-40 w-full rounded-xl" />
            ))}
          </div>
        )}

        {!isLoading && !vendorList?.length && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <svg
                className="h-10 w-10 text-muted-foreground"
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
              className="text-center text-base font-medium text-muted-foreground"
              dir={langDir}
              translate="no"
            >
              {t("no_data_found")}
            </p>
          </div>
        )}

        {!isLoading && vendorList?.length > 0 && (
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {vendorList.map((item) => (
              <RfqRequestVendorCard
                key={item?.id}
                name={getVendorName(item)}
                profilePicture={item?.sellerIDDetail?.profilePicture}
                offerPrice={getVendorOfferPrice(item)}
                onClick={() => onSelectVendor(item)}
                seller={item.sellerIDDetail}
                isSelected={activeSellerId === item?.sellerID}
                vendor={item}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RfqGridVendorsList;
