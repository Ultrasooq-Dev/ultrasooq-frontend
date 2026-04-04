import React, { useEffect } from "react";
import { useVendorDetails } from "@/apis/queries/product.queries";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";

type CompactVendorInfoProps = {
  adminId?: string;
};

const CompactVendorInfo: React.FC<CompactVendorInfoProps> = ({ adminId }) => {
  const queryClient = useQueryClient();

  // Clear vendor cache when adminId changes to force fresh data
  useEffect(() => {
    if (adminId) {
      queryClient.invalidateQueries({
        queryKey: ["vendor-details", { adminId }],
      });
    }
  }, [adminId, queryClient]);
  
  const vendorQuery = useVendorDetails(
    {
      adminId: adminId || "",
    },
    !!adminId,
  );

  const vendor = vendorQuery.data?.data;

  return vendorQuery.isLoading ? (
    <div className="flex items-center gap-4 animate-pulse">
      <div className="flex-1 space-y-2">
        <div className="h-4 w-32 rounded bg-muted"></div>
        <div className="h-3 w-48 rounded bg-muted"></div>
      </div>
    </div>
  ) : (
    <div className="flex items-center gap-4 py-3">
      {/* Vendor Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Sold By:</span>
          <Link
            href={
              vendor?.tradeRole === "COMPANY"
                ? `/company-profile-details?userId=${adminId}`
                : vendor?.tradeRole === "FREELANCER"
                  ? `/freelancer-profile-details?userId=${adminId}`
                  : "#"
            }
            className="text-base font-semibold text-foreground hover:text-primary transition-colors"
          >
            {vendor?.accountName || 
             vendor?.userProfile?.[0]?.companyName || 
             `${vendor?.firstName || ''} ${vendor?.lastName || ''}`.trim() || 
             'Unknown Seller'}
          </Link>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-sm font-medium text-muted-foreground">Email:</span>
          <a 
            href={`mailto:${vendor?.masterAccount?.email || vendor?.email || 'test@gmail.com'}`}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="truncate">{vendor?.masterAccount?.email || vendor?.email || "-"}</span>
          </a>
        </div>
      </div>

      {/* Verified Badge */}
      <div className="flex items-center gap-1 text-xs text-success flex-shrink-0">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Verified</span>
      </div>
    </div>
  );
};

export default CompactVendorInfo;

