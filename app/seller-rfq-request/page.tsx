"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import validator from "validator";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import SellerChat from "@/components/modules/chat/seller/SellerChat";

const ProductChat = dynamic(
  () => import("@/components/modules/chat/productChat/ProductChat"),
  {
    loading: () => <div className="animate-pulse h-64 bg-gray-200 rounded-lg" />,
    ssr: false,
  },
);

import VendorOperations from "@/components/modules/vendorOperations/VendorOperations";
import ProductMessagesList from "@/components/modules/chat/productChat/Admin/ProductMessagesList";
import {
  PERMISSION_RFQ_SELLER_REQUESTS,
  checkPermission,
} from "@/helpers/permission";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import PlaceholderImage from "@/public/images/product-placeholder.png";
import { useAllRfqQuotesUsersBySellerId } from "@/apis/queries/rfq.queries";

const SellerRfqRequestPage = () => {
  const t = useTranslations();
  const { langDir } = useAuth();
  const router = useRouter();
  const hasPermission = checkPermission(PERMISSION_RFQ_SELLER_REQUESTS);
  const [currentTab, setCurrentTab] = useState<string>("RFQ");
  const [productId, setProductId] = useState<number | null>(null);
  const [roomId, setRoomId] = useState<number | null>(null);
  const [selectedRfqId, setSelectedRfqId] = useState<number | null>(null);
  const [selectedRfqData, setSelectedRfqData] = useState<any>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isRfqListCollapsed, setIsRfqListCollapsed] = useState<boolean>(false);
  const { user } = useAuth();

  // Fetch RFQ quotes to get product images when collapsed
  const allRfqQuotesQuery = useAllRfqQuotesUsersBySellerId({
    page: 1,
    limit: 100,
    showHidden: false,
  });

  useEffect(() => {
    if (!hasPermission) {
      router.push("/home");
      return;
    }

    const params = new URLSearchParams(document.location.search);
    let pId = params.get("product_id");
    if (pId) {
      setProductId(parseInt(pId));
      setCurrentTab("MSG");
    } else {
      // Check for tab parameter
      const tabParam = params.get("tab");
      if (
        tabParam === "product-messages" ||
        tabParam === "Product Messages" ||
        tabParam === "Product%20Messages"
      ) {
        setCurrentTab("Product Messages");
      } else if (tabParam === "rfq" || tabParam === "RFQ") {
        setCurrentTab("RFQ");
      } else {
        // Default to RFQ tab
        setCurrentTab("RFQ");
      }
    }

    // Check for rfqId parameter - if present, select that RFQ
    const rfqIdParam = params.get("rfqId");
    if (rfqIdParam) {
      const rfqId = parseInt(rfqIdParam);
      if (!isNaN(rfqId)) {
        setSelectedRfqId(rfqId);
        setIsSidebarCollapsed(true);
      }
    }
  }, [hasPermission, router]);

  if (!hasPermission) return <div></div>;

  const tabs = [
    {
      id: "RFQ",
      label: t("rfq"),
    },
    {
      id: "Vendor Operations",
      label: t("vendor_operations"),
    },
    {
      id: "Product Messages",
      label: t("product_messages") || "Product Messages",
    },
  ];

  if (productId) {
    tabs.push({
      id: "MSG",
      label: t("messages") || "Messages",
    });
  }

  // Four-column layout for RFQ tab with collapsible accordion
  if (currentTab === "RFQ") {
    return (
      <div className="flex h-screen flex-col bg-gray-50">
        {/* Four Column Layout for RFQ */}
        <div className="flex flex-1 overflow-hidden">
          {/* Column 1: Left Sidebar - Navigation (Collapsible) */}
          <div className={cn(
            "flex-shrink-0 border-r border-gray-200 bg-white transition-all duration-300 ease-in-out overflow-hidden",
            isSidebarCollapsed ? "w-16" : "w-56"
          )}>
            <div className="p-3">
              <div className="mb-4 flex items-center justify-between">
                {!isSidebarCollapsed && (
                  <h2 className="text-lg font-bold text-gray-900">Puremoon</h2>
                )}
                <button
                  onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                  className={cn(
                    "flex items-center justify-center p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors",
                    isSidebarCollapsed && "w-full"
                  )}
                  title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                  <svg 
                    className={cn(
                      "w-5 h-5 transition-transform duration-300",
                      isSidebarCollapsed && "rotate-180"
                    )} 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                  </svg>
                </button>
              </div>
              <nav className="space-y-1">
                <button
                  onClick={() => setCurrentTab("RFQ")}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors",
                    isSidebarCollapsed && "justify-center px-2",
                    currentTab === "RFQ"
                      ? "bg-red-50 text-red-600"
                      : "text-gray-600 hover:bg-gray-50"
                  )}
                  title={isSidebarCollapsed ? "RFQ" : undefined}
                >
                  <div className={cn(
                    "h-4 w-4 rounded flex-shrink-0",
                    currentTab === "RFQ" ? "bg-red-600" : "bg-gray-400"
                  )}></div>
                  {!isSidebarCollapsed && (
                    <span className="font-medium">RFQ</span>
                  )}
                </button>
                <button
                  onClick={() => setCurrentTab("Product Messages")}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors",
                    isSidebarCollapsed && "justify-center px-2",
                    currentTab === "Product Messages"
                      ? "bg-red-50 text-red-600"
                      : "text-gray-600 hover:bg-gray-50"
                  )}
                  title={isSidebarCollapsed ? "Message System" : undefined}
                >
                  <div className={cn(
                    "h-4 w-4 rounded flex-shrink-0",
                    currentTab === "Product Messages" ? "bg-red-600" : "bg-gray-400"
                  )}></div>
                  {!isSidebarCollapsed && (
                    <span className="font-medium">Message System</span>
                  )}
                </button>
              </nav>
            </div>
          </div>

          {/* Column 2: RFQ Requests List - Shows column list view */}
          <div className={cn(
            "flex-shrink-0 border-r border-gray-200 bg-white transition-all duration-300 ease-in-out overflow-hidden",
            isRfqListCollapsed ? "w-16" : "w-80" // Collapse to narrow when collapsed
          )}>
            {isRfqListCollapsed ? (
              // Collapsed view - show product images
              <div className="flex h-full flex-col">
                <div className="border-b border-gray-200 bg-gray-50 p-2">
                  <button
                    onClick={() => setIsRfqListCollapsed(false)}
                    className="flex items-center justify-center w-full p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                    title="Expand RFQ list"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {(() => {
                    // Get all product images from all quotes in the selected RFQ group
                    let rfqGroup: any[] = [];
                    
                    // First try to use selectedRfqData if available
                    if (selectedRfqData) {
                      rfqGroup = Array.isArray(selectedRfqData) 
                        ? selectedRfqData.filter(Boolean)
                        : [selectedRfqData];
                    }
                    
                    // If no data in selectedRfqData, try to get it from the query using selectedRfqId
                    if (rfqGroup.length === 0 && selectedRfqId && allRfqQuotesQuery.data?.data) {
                      const allQuotes = allRfqQuotesQuery.data.data || [];
                      // Group quotes by rfqQuotesId
                      const quotesByRfqId = new Map<number, any[]>();
                      allQuotes.forEach((quote: any) => {
                        const rfqId = quote.rfqQuotesId;
                        if (rfqId) {
                          if (!quotesByRfqId.has(rfqId)) {
                            quotesByRfqId.set(rfqId, []);
                          }
                          quotesByRfqId.get(rfqId)!.push(quote);
                        }
                      });
                      
                      // Get the group for the selected RFQ
                      rfqGroup = quotesByRfqId.get(selectedRfqId) || [];
                    }
                    
                    if (rfqGroup.length === 0) {
                      return (
                        <div className="relative w-full aspect-square rounded-lg overflow-hidden border-2 border-red-600 bg-gray-100">
                          <Image
                            src={PlaceholderImage}
                            alt="No product image"
                            fill
                            className="object-cover"
                          />
                        </div>
                      );
                    }
                    
                    // Extract all products from all quotes in the group
                    const allProducts = rfqGroup
                      .flatMap((quote: any) => {
                        const products = quote?.rfqQuotesUser_rfqQuotes?.rfqQuotesProducts || 
                                       quote?.rfqQuotesProducts || 
                                       [];
                        return products;
                      })
                      .filter(Boolean);
                    
                    // Get all product images - remove duplicates by product ID
                    const uniqueProducts = new Map();
                    allProducts.forEach((product: any) => {
                      const productId = product?.id || product?.rfqProductDetails?.id;
                      if (productId && !uniqueProducts.has(productId)) {
                        uniqueProducts.set(productId, product);
                      }
                    });
                    
                    const productImages = Array.from(uniqueProducts.values())
                      .map((product: any) => {
                        const image = product?.rfqProductDetails?.productImages?.[0]?.image ||
                                     product?.productImages?.[0]?.image;
                        return {
                          image,
                          name: product?.rfqProductDetails?.productName || 
                                product?.productName || 
                                "Product",
                          id: product?.id || product?.rfqProductDetails?.id
                        };
                      })
                      .filter((item: any) => item.image); // Only show items with images
                    
                    // If no images found, show placeholder
                    if (productImages.length === 0) {
                      return (
                        <div className="relative w-full aspect-square rounded-lg overflow-hidden border-2 border-red-600 bg-gray-100">
                          <Image
                            src={PlaceholderImage}
                            alt="No product image"
                            fill
                            className="object-cover"
                          />
                        </div>
                      );
                    }
                    
                    // Show all product images with red border
                    return productImages.map((item: any, index: number) => {
                      const imageUrl = item.image && validator.isURL(item.image) 
                        ? item.image 
                        : PlaceholderImage;
                      
                      return (
                        <div 
                          key={item.id || `product-${index}`}
                          className="relative w-full aspect-square rounded-lg overflow-hidden border-2 border-red-600 bg-red-50 transition-all"
                        >
                          <Image
                            src={imageUrl}
                            alt={item.name}
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
              // Expanded view - show list of RFQ requests
              <div className="flex h-full flex-col">
                <div className="border-b border-gray-200 bg-gray-50 p-3 flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-gray-700">Request For RFQ</h3>
                  <button
                    onClick={() => setIsRfqListCollapsed(true)}
                    className="flex items-center justify-center p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                    title="Collapse RFQ list"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <SellerChat
                    layoutMode="column"
                    viewMode="rfqRequests"
                    selectedRfqId={selectedRfqId}
                    onSelectRfq={(rfq, rfqGroup) => {
                      setSelectedRfqId(rfq.rfqQuotesId);
                      // Store the entire group to access all quotes and products
                      setSelectedRfqData(rfqGroup || [rfq]);
                      setSelectedCustomerId(null);
                      setIsSidebarCollapsed(true); // Collapse sidebar when RFQ is selected
                      // Update URL with rfqId
                      router.push(`/seller-rfq-request?rfqId=${rfq.rfqQuotesId}&tab=rfq`);
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Column 3: Customers List - Expands when RFQ selected, stays expanded when customer selected */}
          <div className={cn(
            "flex-shrink-0 border-r border-gray-200 bg-white transition-all duration-300 ease-in-out overflow-hidden",
            selectedRfqId 
              ? "w-72" // Always expanded when RFQ is selected (don't collapse when customer selected)
              : "w-0" // Hide if no RFQ selected
          )}>
            {selectedRfqId ? (
              // Always show expanded customers list
              <div className="flex h-full flex-col">
                <div className="border-b border-gray-200 bg-gray-50 p-3">
                  <h3 className="text-xs font-semibold text-gray-700">Customers</h3>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <SellerChat
                    layoutMode="column"
                    viewMode="customers"
                    selectedRfqId={selectedRfqId}
                    selectedCustomerId={selectedCustomerId}
                    onSelectCustomer={(customer) => {
                      setSelectedCustomerId(customer.id);
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

          {/* Column 4: Details/Chat - Expands when customer selected */}
          <div className={cn(
            "bg-white transition-all duration-300 ease-in-out overflow-hidden",
            selectedCustomerId ? "flex-1 min-w-0" : "w-0 flex-shrink-0"
          )}>
            {selectedCustomerId ? (
              <SellerChat
                layoutMode="column"
                viewMode="details"
                selectedRfqId={selectedRfqId}
                selectedCustomerId={selectedCustomerId}
              />
            ) : (
              <div className="flex h-full items-center justify-center p-8">
                <p className="text-center text-sm text-gray-500">
                  Select a customer to view details
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Three-column layout for Message System tab with collapsible accordion
  if (currentTab === "Product Messages") {
    return (
      <div className="flex h-screen flex-col bg-gray-50">
        {/* Three Column Layout for Message System */}
        <div className="flex flex-1 overflow-hidden">
          {/* Column 1: Left Sidebar (Collapsible) */}
          <div className={cn(
            "flex-shrink-0 border-r border-gray-200 bg-white transition-all duration-300 ease-in-out overflow-hidden",
            isSidebarCollapsed ? "w-16" : "w-56"
          )}>
            <div className="p-3">
              <div className="mb-4 flex items-center justify-between">
                {!isSidebarCollapsed && (
                  <h2 className="text-lg font-bold text-gray-900">Puremoon</h2>
                )}
                <button
                  onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                  className={cn(
                    "flex items-center justify-center p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors",
                    isSidebarCollapsed && "w-full"
                  )}
                  title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                  <svg 
                    className={cn(
                      "w-5 h-5 transition-transform duration-300",
                      isSidebarCollapsed && "rotate-180"
                    )} 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                  </svg>
                </button>
              </div>
              <nav className="space-y-1">
                <button
                  onClick={() => setCurrentTab("RFQ")}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors",
                    isSidebarCollapsed && "justify-center px-2",
                    currentTab === "RFQ"
                      ? "bg-red-50 text-red-600"
                      : "text-gray-600 hover:bg-gray-50"
                  )}
                  title={isSidebarCollapsed ? "RFQ" : undefined}
                >
                  <div className={cn(
                    "h-4 w-4 rounded flex-shrink-0",
                    currentTab === "RFQ" ? "bg-red-600" : "bg-gray-400"
                  )}></div>
                  {!isSidebarCollapsed && (
                    <span className="font-medium">RFQ</span>
                  )}
                </button>
                <button
                  onClick={() => setCurrentTab("Product Messages")}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors",
                    isSidebarCollapsed && "justify-center px-2",
                    currentTab === "Product Messages"
                      ? "bg-red-50 text-red-600"
                      : "text-gray-600 hover:bg-gray-50"
                  )}
                  title={isSidebarCollapsed ? "Message System" : undefined}
                >
                  <div className={cn(
                    "h-4 w-4 rounded flex-shrink-0",
                    currentTab === "Product Messages" ? "bg-red-600" : "bg-gray-400"
                  )}></div>
                  {!isSidebarCollapsed && (
                    <span className="font-medium">Message System</span>
                  )}
                </button>
              </nav>
            </div>
          </div>

          {/* Column 2: Customers List - Collapses when customer is selected */}
          <div className={cn(
            "flex-shrink-0 border-r border-gray-200 bg-white transition-all duration-300 ease-in-out overflow-hidden",
            selectedCustomerId && productId && roomId ? "w-16" : "w-72" // Collapse when customer selected
          )}>
            {selectedCustomerId && productId && roomId ? (
              // Collapsed view - show back button
              <div className="flex h-full flex-col">
                <div className="border-b border-gray-200 bg-gray-50 p-2">
                  <button
                    onClick={() => {
                      setProductId(null);
                      setRoomId(null);
                      setSelectedCustomerId(null);
                    }}
                    className="flex items-center justify-center w-full p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                    title="Back to customers"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                  <div className="text-xs text-gray-600 text-center break-words leading-tight">
                    Selected Customer
                  </div>
                </div>
              </div>
            ) : (
              // Expanded view - show customers list
              <div className="flex h-full flex-col">
                <div className="border-b border-gray-200 bg-gray-50 p-3">
                  <h3 className="text-xs font-semibold text-gray-700">Customers</h3>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <ProductMessagesList
                    layoutMode="column"
                    selectedCustomerId={selectedCustomerId}
                    onSelectProduct={(productId, roomId) => {
                      setProductId(productId);
                      setRoomId(roomId);
                      setSelectedCustomerId(roomId);
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Column 3: Message History - Expands when customer selected */}
          <div className={cn(
            "bg-white transition-all duration-300 ease-in-out overflow-hidden",
            selectedCustomerId && productId && roomId ? "flex-1 min-w-0" : "w-0 flex-shrink-0"
          )}>
            {selectedCustomerId && productId && roomId ? (
              <ProductChat productId={productId} roomId={roomId} />
            ) : (
              <div className="flex h-full items-center justify-center p-8">
                <p className="text-center text-sm text-gray-500">
                  Select a customer to view message history
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // For Vendor Operations and other tabs, use original layout
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto w-full max-w-[1600px] px-4 py-6 lg:px-6">
        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="rounded-t-xl border-b border-gray-200 bg-white shadow-sm">
            <nav
              className="scrollbar-hide flex space-x-1 overflow-x-auto"
              dir={langDir}
              aria-label="Tabs"
            >
              {tabs.map((tab) => {
                const isActive = currentTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      if (tab.id === "Product Messages") {
                        setProductId(null);
                        setRoomId(null);
                      }
                      setCurrentTab(tab.id);
                    }}
                    className={cn(
                      "group relative flex items-center gap-2 border-b-2 px-6 py-4 text-sm font-medium whitespace-nowrap transition-all duration-200",
                      isActive
                        ? "border-dark-orange text-dark-orange bg-orange-50/50"
                        : "border-transparent text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900",
                    )}
                    translate="no"
                  >
                    <span className="relative z-10">{tab.label}</span>
                    {isActive && (
                      <div className="bg-dark-orange absolute right-0 bottom-0 left-0 h-0.5 rounded-t-full" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="rounded-b-xl border border-t-0 border-gray-200 bg-white shadow-sm">
          <div className="p-4 lg:p-6">
            {productId && roomId && currentTab === "MSG" ? (
              <ProductChat productId={productId} roomId={roomId} />
            ) : currentTab === "Vendor Operations" ? (
              <VendorOperations />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerRfqRequestPage;
