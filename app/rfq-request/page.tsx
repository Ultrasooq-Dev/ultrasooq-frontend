"use client";
import React, { useEffect, useState } from "react";
import RfqRequestChat from "@/components/modules/chat/rfqRequest/RfqRequestChat";
import BuyerChat from "@/components/modules/chat/buyer/BuyerChat";
import { useSearchParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import Image from "next/image";
import PlaceholderImage from "@/public/images/product-placeholder.png";
import validator from "validator";
import {
  useAllRfqQuotesByBuyerId,
} from "@/apis/queries/rfq.queries";

const RfqRequestPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedRfqId, setSelectedRfqId] = useState<number | null>(null);
  const [selectedVendorId, setSelectedVendorId] = useState<number | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [selectedRfqData, setSelectedRfqData] = useState<any>(null);

  // Fetch RFQ quotes to get product images for collapsed view
  const rfqQuotesByBuyerIdQuery = useAllRfqQuotesByBuyerId(
    {
      page: 1,
      limit: 10,
    },
    true,
  );

  useEffect(() => {
    const rfqId = searchParams?.get("rfqQuotesId");
    if (rfqId) {
      const rfqIdNum = parseInt(rfqId);
      setSelectedRfqId(rfqIdNum);
      setIsSidebarCollapsed(true);
      
      // Find the RFQ data from the query results
      if (rfqQuotesByBuyerIdQuery.data?.data) {
        const rfqData = rfqQuotesByBuyerIdQuery.data.data.find(
          (item: any) => item.id === rfqIdNum
        );
        if (rfqData) {
          setSelectedRfqData(rfqData);
        }
      }
    }
  }, [searchParams, rfqQuotesByBuyerIdQuery.data?.data]);

  // Get product images for selected RFQ (for collapsed view)
  const getSelectedRfqProductImages = () => {
    if (!selectedRfqData) return [];
    return (
      selectedRfqData?.rfqQuotesProducts?.map(
        (ele: any) => ele?.rfqProductDetails?.productImages?.[0]?.image,
      ) || []
    );
  };

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      <div className="flex flex-1 overflow-hidden">
        {/* Column 1: RFQ Requests List (Left Sidebar) - Collapsible */}
        <div
          className={cn(
            "flex-shrink-0 border-r border-gray-200 bg-white transition-all duration-300 ease-in-out overflow-hidden",
            isSidebarCollapsed ? "w-16" : "w-80"
          )}
        >
          <div className="flex h-full flex-col">
            <div className="border-b border-gray-200 bg-gray-50 p-3">
              <div className="flex items-center justify-between">
                {!isSidebarCollapsed && (
                  <h3 className="text-xs font-semibold text-gray-700">
                    My RFQ Requests
                  </h3>
                )}
                <button
                  onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                  className={cn(
                    "flex items-center justify-center p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors",
                    isSidebarCollapsed && "w-full"
                  )}
                  title={isSidebarCollapsed ? "Expand" : "Collapse"}
                >
                  <svg
                    className={cn(
                      "w-4 h-4 transition-transform duration-300",
                      isSidebarCollapsed && "rotate-180"
                    )}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                    />
                  </svg>
                </button>
              </div>
            </div>
            {selectedRfqId && isSidebarCollapsed ? (
              // Collapsed view - show product images
              <div className="flex h-full flex-col">
                <div className="border-b border-gray-200 bg-gray-50 p-2">
                  <button
                    onClick={() => {
                      setSelectedRfqId(null);
                      setSelectedRfqData(null);
                      setSelectedVendorId(null);
                      setIsSidebarCollapsed(false);
                      router.push("/rfq-request");
                    }}
                    className="flex items-center justify-center w-full p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                    title="Back to all RFQ requests"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {(() => {
                    const productImages = getSelectedRfqProductImages();
                    if (productImages.length === 0) {
                      return (
                        <div className="relative w-full aspect-square rounded-lg overflow-hidden border-2 border-orange-500 bg-gray-100">
                          <Image
                            src={PlaceholderImage}
                            alt="No product image"
                            fill
                            className="object-cover"
                          />
                        </div>
                      );
                    }
                    return productImages.map((image: any, index: number) => {
                      const imageUrl =
                        image && validator.isURL(image)
                          ? image
                          : PlaceholderImage;
                      return (
                        <div
                          key={index}
                          className="relative w-full aspect-square rounded-lg overflow-hidden border-2 border-orange-500 bg-orange-50 transition-all"
                        >
                          <Image
                            src={imageUrl}
                            alt={`Product ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            ) : (
              // Expanded view - show full RFQ requests list
              <BuyerChat
                layoutMode="column"
                viewMode="rfqRequests"
                selectedRfqId={selectedRfqId}
                onSelectRfq={(rfq) => {
                  setSelectedRfqId(rfq.id);
                  setSelectedRfqData(rfq);
                  setSelectedVendorId(null);
                  setIsSidebarCollapsed(true);
                  router.push(`/rfq-request?rfqQuotesId=${rfq.id}`);
                }}
              />
            )}
          </div>
        </div>

        {/* Column 2: Vendor Lists - Expands when RFQ selected */}
        <div
          className={cn(
            "flex-shrink-0 border-r border-gray-200 bg-white transition-all duration-300 ease-in-out overflow-hidden",
            selectedRfqId ? "w-56" : "w-0"
          )}
        >
          {selectedRfqId ? (
            <div className="flex h-full flex-col">
              <div className="border-b border-gray-200 bg-gray-50 p-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-gray-700">
                    Vendors
                  </h3>
                  <button
                    onClick={() => {
                      setSelectedRfqId(null);
                      setSelectedRfqData(null);
                      setSelectedVendorId(null);
                      setIsSidebarCollapsed(false);
                      router.push("/rfq-request");
                    }}
                    className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                    title="Back to RFQ requests"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                <RfqRequestChat
                  rfqQuoteId={selectedRfqId?.toString()}
                  layoutMode="column"
                  viewMode="vendors"
                  selectedVendorId={selectedVendorId}
                  onSelectVendor={(vendor) => {
                    setSelectedVendorId(vendor.id || vendor.sellerID);
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center p-8">
              <p className="text-center text-xs text-gray-500">
                Select an RFQ request
              </p>
            </div>
          )}
        </div>

        {/* Column 3: Chat with Product Card - Expands when vendor selected */}
        <div
          className={cn(
            "bg-white transition-all duration-300 ease-in-out overflow-hidden flex flex-col",
            selectedVendorId && selectedRfqId ? "flex-1 min-w-0" : "w-0 flex-shrink-0"
          )}
        >
          {selectedVendorId && selectedRfqId ? (
            <RfqRequestChat
              rfqQuoteId={selectedRfqId?.toString()}
              layoutMode="column"
              viewMode="details"
              selectedVendorId={selectedVendorId}
            />
          ) : (
            <div className="flex h-full items-center justify-center p-8">
              <p className="text-center text-sm text-gray-500">
                Select a vendor to view chat and product details
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RfqRequestPage;
