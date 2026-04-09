"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import SellerChat from "@/components/modules/chat/seller/SellerChat";
import {
  PERMISSION_RFQ_SELLER_REQUESTS,
  checkPermission,
} from "@/helpers/permission";

const SellerRfqListPage = () => {
  const t = useTranslations();
  const { langDir } = useAuth();
  const router = useRouter();
  const hasPermission = checkPermission(PERMISSION_RFQ_SELLER_REQUESTS);

  useEffect(() => {
    if (!hasPermission) {
      router.push("/home");
    }
  }, [hasPermission, router]);

  if (!hasPermission) {
    return <div></div>;
  }

  return (
    <div className="min-h-screen bg-muted">
      <div className="mx-auto w-full max-w-[1600px] px-4 py-6 lg:px-6">
        {/* Grid View of RFQ Requests */}
        <SellerChat
          layoutMode="grid"
          viewMode="rfqRequests"
          displayMode="list"
          onSelectRfq={(rfq, rfqGroup) => {
            // Navigate to seller-rfq-request page with selected RFQ
            router.push(`/seller-rfq-request?rfqId=${rfq.rfqQuotesId}&tab=rfq`);
          }}
        />
      </div>
    </div>
  );
};

export default SellerRfqListPage;

