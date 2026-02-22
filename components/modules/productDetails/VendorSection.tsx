import React, { useEffect } from "react";
import Image from "next/image";
import EmailIcon from "@/public/images/email.svg";
import { useVendorDetails } from "@/apis/queries/product.queries";
import { COMPANY_UNIQUE_ID } from "@/utils/constants";
import NoImagePlaceholder from "@/public/images/no-image.jpg";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { useQueryClient } from "@tanstack/react-query";

type VendorSectionProps = {
  adminId?: string;
};

const VendorSection: React.FC<VendorSectionProps> = ({ adminId }) => {
  const t = useTranslations();
  const { langDir } = useAuth();
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
    <div className="mx-auto min-h-[240px] w-full rounded-2xl border border-border p-4">
      <div className="flex animate-pulse space-x-4">
        <div className="h-[89px] w-[89px] rounded-full bg-muted"></div>
        <div className="max-w-sm flex-1 space-y-6 py-1">
          <div className="h-2 rounded bg-muted"></div>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 h-2 rounded bg-muted"></div>
              <div className="col-span-1 h-2 rounded bg-muted"></div>
            </div>
            <div className="h-2 rounded bg-muted"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-1 h-2 rounded bg-muted"></div>
              <div className="col-span-1 h-2 rounded bg-muted"></div>
            </div>
            <div className="h-2 rounded bg-muted"></div>
          </div>
        </div>
      </div>
    </div>
  ) : (
    <div className="vendor-information-card-ui">
      <div className="vendor-image relative">
        <Image
          src={
            vendor?.profilePicture || 
            vendor?.masterAccount?.profilePicture || 
            NoImagePlaceholder
          }
          alt="vendor-image"
          className="rounded-2xl object-cover"
          fill
          sizes="(100vw, 100vh)"
        />
      </div>
      <div className="vendor-info">
        <Link
          href={
            vendor?.tradeRole === "COMPANY"
              ? `/company-profile-details?userId=${adminId}`
              : vendor?.tradeRole === "FREELANCER"
                ? `/freelancer-profile-details?userId=${adminId}`
                : "#"
          }
        >
          <h2>
            {vendor?.accountName || 
             vendor?.userProfile?.[0]?.companyName || 
             `${vendor?.firstName || ''} ${vendor?.lastName || ''}`.trim() || 
             'Unknown Seller'}
          </h2>
        </Link>
        <ul className="vendor-contact-info">
          <li>
            <a href={`mailto:${vendor?.masterAccount?.email || vendor?.email || 'test@gmail.com'}`}>
              <span className="icon">
                <Image src={EmailIcon} alt="email-icon" />
              </span>
              <span className="text">{vendor?.masterAccount?.email || vendor?.email || "-"}</span>
            </a>
          </li>
        </ul>
        
        {/* Trust Indicators for Customers */}
        <div className="vendor-trust-indicators mt-4">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <svg className="h-4 w-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Verified Seller</span>
            </div>
            <div className="flex items-center gap-1">
              <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>24/7 Support</span>
            </div>
          </div>
        </div>
        
        <div className="tagLists mt-8">
          <div className="tagItem">
            {vendor?.userProfile
              ?.map((item: any) => item?.userProfileBusinessType)
              ?.flat()
              ?.map((item: any) => (
                <div key={item?.id} className="tagIbox mr-2">
                  {item?.userProfileBusinessTypeTag?.tagName}
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorSection;
