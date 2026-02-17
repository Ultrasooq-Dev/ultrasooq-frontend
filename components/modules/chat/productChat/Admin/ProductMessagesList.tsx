"use client";

import React, { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useGetAllProductsWithMessages } from "@/apis/queries/chat.queries";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import moment from "moment";
import AvatarPlaceholder from "@/public/images/no-user-image.png";
import { useGetProductDetails } from "@/apis/queries/chat.queries";
import { useTranslations } from "next-intl";
import { useSocket } from "@/context/SocketContext";
import { useQueryClient } from "@tanstack/react-query";

interface ProductMessagesListProps {
  onSelectProduct: (productId: number, roomId: number, userId?: number) => void;
  layoutMode?: "grid" | "column";
  selectedCustomerId?: number | null;
}

const ProductMessagesList: React.FC<ProductMessagesListProps> = ({ 
  onSelectProduct,
  layoutMode = "grid",
  selectedCustomerId = null,
}) => {
  const t = useTranslations();
  const { user, langDir } = useAuth();
  const queryClient = useQueryClient();
  const { newMessage } = useSocket();
  const { data, isLoading } = useGetAllProductsWithMessages(user?.id || 0, !!user?.id);

  // Refetch when new message arrives
  useEffect(() => {
    if (newMessage && newMessage.rfqId) {
      queryClient.invalidateQueries({
        queryKey: ["allProductsWithMessages", user?.id],
      });
    }
  }, [newMessage, queryClient, user?.id]);

  const productsWithMessages = data?.data || [];

  if (isLoading) {
    return (
      <div className={layoutMode === "column" ? "flex h-full flex-col" : "w-full"}>
        {layoutMode === "grid" && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{t("product_messages") || "Product Messages"}</h2>
            <p className="mt-1 text-sm text-gray-500">{t("view_product_messages") || "View and respond to product inquiries"}</p>
          </div>
        )}
        <div className={layoutMode === "column" ? "flex-1 overflow-y-auto p-4" : ""}>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-20 w-20 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (productsWithMessages.length === 0) {
    return (
      <div className={layoutMode === "column" ? "flex h-full flex-col" : "w-full"}>
        {layoutMode === "grid" && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{t("product_messages") || "Product Messages"}</h2>
            <p className="mt-1 text-sm text-gray-500">{t("view_product_messages") || "View and respond to product inquiries"}</p>
          </div>
        )}
        <div className={layoutMode === "column" ? "flex-1 overflow-y-auto p-4" : "flex h-[400px] w-full items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50"}>
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-gray-700">
              {t("no_product_messages") || "No product messages yet"}
            </p>
            <p className="mt-2 text-sm text-gray-500">
              {t("messages_will_appear_here") || "Messages from buyers will appear here"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={layoutMode === "column" ? "flex h-full flex-col" : "w-full"}>
      {layoutMode === "grid" && (
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900" dir={langDir}>
            {t("product_messages") || "Product Messages"}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {t("view_product_messages") || "View and respond to product inquiries"}
          </p>
        </div>
      )}
      <div className={layoutMode === "column" ? "flex-1 overflow-y-auto p-4" : ""}>
        <div className="space-y-3">
          {productsWithMessages.map((item: any) => (
            <ProductMessageItem
              key={`${item.productId}-${item.userId}`}
              item={item}
              onSelect={() => onSelectProduct(item.productId, item.roomId, item.userId)}
              isSelected={layoutMode === "column" && selectedCustomerId === item.roomId}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

interface ProductMessageItemProps {
  item: {
    productId: number;
    roomId: number;
    userId: number;
    user: {
      firstName?: string | null;
      lastName?: string | null;
      accountName?: string | null;
      email?: string | null;
      profilePicture?: string | null;
    };
    lastMessage: string;
    lastMessageTime: string;
    unreadMsgCount: number;
  };
  onSelect: () => void;
  isSelected?: boolean;
}

const ProductMessageItem: React.FC<ProductMessageItemProps> = ({ item, onSelect, isSelected = false }) => {
  const t = useTranslations();
  const { data: productData } = useGetProductDetails(item.productId, !!item.productId);
  const product = productData?.data;
  const productName = product?.productName || `Product #${item.productId}`;
  const productImage = product?.productImages?.[0]?.image || product?.product_productPrice?.[0]?.productPrice_productSellerImage?.[0]?.image;

  return (
    <button
      onClick={onSelect}
      className={`group relative flex w-full items-center gap-4 rounded-xl border-2 bg-white p-5 text-left transition-all duration-200 active:scale-[0.99] ${
        isSelected
          ? "border-red-600 bg-red-50 hover:border-red-600 hover:bg-red-50"
          : "border-gray-200 hover:border-red-600 hover:bg-red-50 hover:shadow-lg hover:shadow-gray-100"
      }`}
    >
      {/* Product Image */}
      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border-2 border-gray-100 shadow-sm group-hover:border-gray-200 transition-colors">
        {productImage ? (
          <Image
            src={productImage}
            alt={productName}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
            <svg className="h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="flex flex-1 flex-col gap-2 min-w-0">
        {/* Header Row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="truncate text-base font-bold text-gray-900 group-hover:text-dark-orange transition-colors">
              {productName}
            </h3>
          </div>
          {item.unreadMsgCount > 0 && (
            <div className="flex shrink-0 items-center">
              <span className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-blue-600 px-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/30">
                {item.unreadMsgCount > 99 ? "99+" : item.unreadMsgCount}
              </span>
            </div>
          )}
        </div>
        
        {/* User Info */}
        <div className="flex items-center gap-2.5">
          <div className="relative h-7 w-7 overflow-hidden rounded-full border-2 border-white shadow-sm ring-1 ring-gray-200">
            <Image
              src={item.user?.profilePicture || AvatarPlaceholder}
              alt={(() => {
                const accountName = item.user?.accountName;
                const cleanAccountName = accountName 
                  ? accountName.replace(/\s*buyer\s*/gi, "").trim()
                  : null;
                
                return cleanAccountName || 
                  (item.user?.firstName || item.user?.lastName 
                    ? `${item.user?.firstName || ""} ${item.user?.lastName || ""}`.trim()
                    : item.user?.email || "User");
              })()}
              fill
              className="object-cover"
            />
          </div>
          <span className="text-sm font-semibold text-gray-700 truncate">
            {(() => {
              const accountName = item.user?.accountName;
              // Remove "buyer" and dashes from account name if they exist
              const cleanAccountName = accountName 
                ? accountName.replace(/\s*buyer\s*/gi, "").replace(/^\s*-\s*|\s*-\s*$/g, "").replace(/\s*-\s*/g, " ").trim()
                : null;
              
              return cleanAccountName || 
                (item.user?.firstName || item.user?.lastName 
                  ? `${item.user?.firstName || ""} ${item.user?.lastName || ""}`.trim()
                  : item.user?.email || "User");
            })()}
          </span>
        </div>
        
        {/* Last Message */}
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm text-gray-600 flex-1 min-w-0">
            {item.lastMessage || t("no_message") || "No message"}
          </p>
        </div>
        
        {/* Timestamp */}
        <div className="flex items-center gap-2">
          <svg className="h-3.5 w-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs font-medium text-gray-400">
            {moment(item.lastMessageTime).fromNow()}
          </span>
        </div>
      </div>

      {/* Arrow Indicator */}
      <div className="flex shrink-0 items-center">
        <svg className="h-5 w-5 text-gray-300 transition-all duration-200 group-hover:text-dark-orange group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  );
};

export default ProductMessagesList;

