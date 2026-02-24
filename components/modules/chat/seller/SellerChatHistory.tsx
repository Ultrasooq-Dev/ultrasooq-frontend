import React, { useEffect, useRef } from "react";
import Image from "next/image";
import moment from "moment";
import validator from "validator";
import { useAuth } from "@/context/AuthContext";
import { RfqProductPriceRequestStatus } from "@/utils/types/chat.types";
import { useSocket } from "@/context/SocketContext";
import { updateUnreadMessages } from "@/apis/requests/chat.requests";
import DownloadIconButton from "../DownloadIconButton";
import { useTranslations } from "next-intl";
import PlaceholderImage from "@/public/images/product-placeholder.png";
import { sanitizeHtml } from "@/utils/sanitize";

interface SellerChatHistoryProps {
  roomId: number | null;
  selectedChatHistory: any[];
  chatHistoryLoading: boolean;
  updateRfqMessageCount: () => void;
  buyerId: number | undefined;
  rfqUserId: number;
  unreadMsgCount: number | 0;
  isUploadingCompleted?: boolean | null;
}

const SellerChatHistory: React.FC<SellerChatHistoryProps> = ({
  roomId,
  selectedChatHistory,
  chatHistoryLoading,
  updateRfqMessageCount,
  buyerId,
  unreadMsgCount,
  rfqUserId,
  isUploadingCompleted,
}) => {
  const t = useTranslations();
  const { user, currency, langDir } = useAuth();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { updateRfqRequestStatus } = useSocket();

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [selectedChatHistory]);

  useEffect(() => {
    if (unreadMsgCount) handleUnreadMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buyerId, roomId]);

  const handlePriceStatus = async (
    chat: { id: number; requestedPrice: number; rfqQuoteProductId: number },
    status: RfqProductPriceRequestStatus,
  ) => {
    try {
      const payload = {
        id: chat.id,
        status,
        roomId: roomId,
        rfqUserId,
        requestedPrice: chat.requestedPrice,
        rfqQuoteProductId: chat.rfqQuoteProductId,
      };
      updateRfqRequestStatus(payload);
    } catch (error) { console.error(error); }
  };

  const handleUnreadMessages = async () => {
    try {
      if (user?.id && roomId && buyerId) {
        const payload = {
          userId: buyerId,
          roomId: roomId,
        };
        await updateUnreadMessages(payload);
        updateRfqMessageCount();
      }
    } catch (error) { console.error(error); }
  };

  // Helper function to get user initials
  const getUserInitials = (chatUser: any) => {
    if (!chatUser) return "";
    
    // Prioritize accountName (new account system)
    if (chatUser.accountName) {
      const cleanAccountName = chatUser.accountName.trim();
      if (cleanAccountName.length > 0) {
        // Get first letter, or first two letters if single word
        const words = cleanAccountName.split(/\s+/).filter((w: any) => w.length > 0);
        if (words.length >= 2) {
          return `${words[0][0]}${words[1][0]}`.toUpperCase();
        } else if (words.length === 1) {
          return words[0][0].toUpperCase();
        }
      }
    }
    
    // Fallback to firstName + lastName
    if (chatUser.firstName || chatUser.lastName) {
      const firstInitial = chatUser.firstName?.[0] || "";
      const lastInitial = chatUser.lastName?.[0] || "";
      return `${firstInitial}${lastInitial}`.toUpperCase();
    }
    
    // Fallback to email
    if (chatUser.email) {
      return chatUser.email[0].toUpperCase();
    }
    
    return "U"; // Default fallback
  };

  return (
    <div className="flex h-full flex-col overflow-hidden min-h-0">
      {/* Chat Header - Reduced Size */}
      <div className="flex items-center border-b border-border bg-card px-3 py-2 shadow-sm flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/10">
            <svg
              className="h-3.5 w-3.5 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-foreground" translate="no">
            {t("messages") || "Messages"}
          </h3>
        </div>
      </div>
      
      {/* Chat Messages - Scrollable */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto bg-muted px-4 py-3 min-h-0">
        <div className="d-flex w-full space-y-1">
        {selectedChatHistory.length > 0 ? (
          <div>
            {selectedChatHistory
              .filter((chat: any) => {
                // Filter out messages with empty content (silent updates)
                // Only show messages that have actual chat content
                const hasContent = chat?.content && chat.content.trim().length > 0;
                // Also filter out messages that have rfqProductPriceRequest or rfqSuggestedProducts but no content
                // (these are silent backend updates that shouldn't appear in chat)
                if (!hasContent && (chat?.rfqProductPriceRequest || (chat?.rfqSuggestedProducts && chat.rfqSuggestedProducts.length > 0))) {
                  return false;
                }
                return hasContent;
              })
              .map((chat: any, index: number) => (
              <div key={index}>
                {chat?.userId === user?.id ? (
                  <div className="mb-2 flex w-full items-end justify-end gap-2">
                    {/* Message Content */}
                    <div className="flex min-w-0 max-w-[75%] flex-col items-end gap-1">
                      {chat?.attachments?.length > 0 ? (
                        <div className="mb-1.5 w-full space-y-1.5">
                          {chat?.attachments.map((file: any, index: any) => (
                            <div
                              key={index}
                              className="flex items-center gap-1.5 rounded-lg border border-border bg-card p-2 shadow-sm transition-shadow hover:shadow-md"
                            >
                              <div className="flex-1">
                                {file?.fileType.includes("imag") &&
                                file?.presignedUrl ? (
                                  <img
                                    src={file?.presignedUrl}
                                    className="h-auto w-full max-w-sm rounded-lg"
                                  />
                                ) : (
                                  file?.fileType.includes("video") &&
                                  file?.presignedUrl ? (
                                    <video
                                      src={file?.presignedUrl}
                                      className="h-auto w-full max-w-sm rounded-lg"
                                      controls
                                    />
                                  ) : null
                                )}
                                <p className="mt-1 truncate text-xs font-medium text-muted-foreground">
                                  {file.fileName}
                                </p>
                                {file?.status === "UPLOADING" ? (
                                  <p className="truncate text-[10px] italic text-muted-foreground" translate="no">
                                    {t("uploading")}
                                  </p>
                                ) : (
                                  <p className="truncate text-[10px] italic text-muted-foreground">
                                    {file?.status}
                                  </p>
                                )}
                              </div>
                              <DownloadIconButton
                                attachmentId={file?.id}
                                filePath={file?.filePath}
                              />
                            </div>
                          ))}
                        </div>
                      ) : null}
                      {chat?.content ? (
                        <div className="rounded-xl rounded-br-sm bg-primary px-3 py-2 text-xs text-white shadow-md ring-1 ring-blue-700/20">
                          <p
                            dangerouslySetInnerHTML={{
                              __html: sanitizeHtml(chat?.content || ''),
                            }}
                          />

                          {chat?.rfqProductPriceRequest ? (
                            <div className="mt-2 space-y-1.5 rounded-lg bg-primary/90/40 p-2 ring-1 ring-primary/30">
                              <div className="flex items-center gap-1.5">
                                <div className="flex h-5 w-5 items-center justify-center rounded bg-primary/50">
                                  <svg
                                    className="h-3 w-3 text-white"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                  </svg>
                                </div>
                                <p className="text-[10px] font-medium text-blue-100" translate="no">
                                  {t("requested_for_offer_price")}
                                </p>
                              </div>
                              <p className="text-sm font-bold text-white" translate="no">
                                {t("requested_price")}: {currency.symbol}
                                {chat.rfqProductPriceRequest?.requestedPrice}
                              </p>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-blue-100" translate="no">
                                  {t("status")}:
                                </span>
                                {chat.rfqProductPriceRequest?.status ===
                                "APPROVED" ? (
                                  <span className="inline-flex items-center gap-0.5 rounded-full bg-success/90 px-2 py-0.5 text-[10px] font-semibold text-white ring-1 ring-green-400/50" translate="no">
                                    <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    {t("approved")}
                                  </span>
                                ) : chat.rfqProductPriceRequest?.status ===
                                  "REJECTED" ? (
                                  <span className="inline-flex items-center gap-0.5 rounded-full bg-destructive/90 px-2 py-0.5 text-[10px] font-semibold text-white ring-1 ring-red-400/50" translate="no">
                                    <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                    {t("rejected")}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-0.5 rounded-full bg-warning/90 px-2 py-0.5 text-[10px] font-semibold text-white ring-1 ring-amber-400/50" translate="no">
                                    <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                    </svg>
                                    {t("pending")}
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : null}

                          {/* NEW: Display Suggested Products */}
                          {chat?.rfqSuggestedProducts && chat.rfqSuggestedProducts.length > 0 && (
                            <div className="mt-2 space-y-2 rounded-lg bg-info/5 p-2.5 border border-info/20">
                              <div className="flex items-center gap-1.5 mb-2">
                                <svg className="h-4 w-4 text-info" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-[10px] font-semibold text-purple-900" translate="no">
                                  {t("suggested_alternative_products") || "Suggested Alternative Products"} ({chat.rfqSuggestedProducts.length})
                                </p>
                              </div>
                              <div className="grid grid-cols-1 gap-2">
                                {chat.rfqSuggestedProducts
                                  .filter((suggestion: any) => (suggestion.quantity ?? 0) > 0)
                                  .map((suggestion: any) => {
                                  const product = suggestion.suggestedProduct;
                                  const imageUrl = product?.product_productPrice?.[0]?.productPrice_productSellerImage?.[0]?.image ||
                                                  product?.productImages?.[0]?.image;
                                  const isSelected = suggestion.isSelectedByBuyer;
                                  const displayPrice = suggestion.offerPrice || 
                                                      product?.product_productPrice?.[0]?.offerPrice || 
                                                      product?.product_productPrice?.[0]?.productPrice || 
                                                      0;

                                  return (
                                    <div
                                      key={suggestion.id}
                                      className={`p-2 rounded-lg border transition-all ${
                                        isSelected ? "border-success bg-success/5" : "border-border bg-card"
                                      }`}
                                    >
                                      <div className="flex gap-2 items-start">
                                        <div className="relative w-12 h-12 flex-shrink-0 rounded overflow-hidden border border-border">
                                          <Image
                                            src={imageUrl && validator.isURL(imageUrl) ? imageUrl : PlaceholderImage}
                                            alt={product?.productName || "Product"}
                                            fill
                                            className="object-cover"
                                          />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-xs font-medium truncate mb-1">{product?.productName || "-"}</p>
                                          <p className="text-[10px] text-muted-foreground mb-1">
                                            {currency.symbol}{displayPrice}
                                            {suggestion.quantity > 1 && ` × ${suggestion.quantity}`}
                                          </p>
                                          {isSelected && (
                                            <span className="inline-flex items-center gap-0.5 mt-1 px-1.5 py-0.5 rounded-full bg-success/10 text-success text-[9px]">
                                              <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                              </svg>
                                              {t("selected") || "Selected"}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : null}
                      {/* Timestamp */}
                      <div className="mr-1 text-[10px] font-normal text-muted-foreground">
                        {chat?.status === "SD" ? (
                          <span translate="no">{t("sending")}</span>
                        ) : (
                          <span>
                            {chat.createdAt
                              ? moment(chat.createdAt)
                                  .startOf("seconds")
                                  .fromNow()
                              : ""}
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Avatar */}
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-xs font-semibold text-white shadow-md ring-2 ring-white">
                      {getUserInitials(chat?.user)}
                    </div>
                  </div>
                ) : (
                  (chat?.attachments?.length > 0 || chat?.content) ? (
                    <div className="mb-2 flex w-full items-start gap-2">
                      {/* Avatar */}
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-primary/90 text-xs font-semibold text-white shadow-md ring-2 ring-white">
                        {getUserInitials(chat?.user)}
                      </div>
                      
                      {/* Message Content */}
                      <div className="flex min-w-0 max-w-[65%] flex-col gap-1">
                        {chat?.attachments?.length > 0 ? (
                          <div className="mb-1.5 w-full space-y-1.5">
                            {chat?.attachments.map(
                              (file: any, index: any) => (
                                <div
                                  key={index}
                                  className="flex items-center gap-1.5 rounded-lg border border-border bg-card p-2 shadow-sm transition-shadow hover:shadow-md"
                                >
                                  <div className="flex-1">
                                    {file?.fileType.includes("imag") &&
                                    file?.presignedUrl ? (
                                      <img
                                        src={file?.presignedUrl}
                                        className="h-auto w-full max-w-sm rounded-lg"
                                      />
                                    ) : (
                                      file?.fileType.includes("video") &&
                                      file?.presignedUrl ? (
                                        <video
                                          src={file?.presignedUrl}
                                          className="h-auto w-full max-w-sm rounded-lg"
                                          controls
                                        />
                                      ) : null
                                    )}
                                    <p className="mt-1 truncate text-xs font-medium text-muted-foreground">
                                      {file.fileName}
                                    </p>
                                    {file?.status === "UPLOADING" ? (
                                      <p className="truncate text-[10px] italic text-muted-foreground" translate="no">
                                        {t("uploading")}
                                      </p>
                                    ) : (
                                      <p className="truncate text-[10px] italic text-muted-foreground">
                                        {file?.status}
                                      </p>
                                    )}
                                  </div>
                                  <DownloadIconButton
                                    attachmentId={file?.id}
                                    filePath={file?.filePath}
                                  />
                                </div>
                              ),
                            )}
                          </div>
                        ) : null}
                        
                        {/* Regular Message or Price Request */}
                        {chat?.content ? (
                          chat?.rfqProductPriceRequest ? (
                            /* Price Request Card */
                            <div className="overflow-hidden rounded-xl rounded-tl-sm bg-card shadow-sm ring-1 ring-border">
                              {/* Price Request Content */}
                              {chat?.content && !chat?.content.match(/^\s*$/) && (
                                <div className="border-b border-border px-3 py-2">
                                  <p
                                    className="text-xs text-foreground"
                                    dangerouslySetInnerHTML={{
                                      __html: sanitizeHtml(chat?.content || ''),
                                    }}
                                  />
                                </div>
                              )}
                              
                              {/* Price Request Details */}
                              <div className="bg-gradient-to-br from-gray-50 to-white p-3">
                                <div className="mb-2 flex items-center gap-1.5">
                                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10">
                                    <svg
                                      className="h-4 w-4 text-primary"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                      />
                                    </svg>
                                  </div>
                                  <p className="text-xs font-semibold text-foreground" translate="no">
                                    {t("requested_for_offer_price")}
                                  </p>
                                </div>
                                
                                <div className="mb-2 rounded-lg bg-card p-2 shadow-sm">
                                  <p className="mb-1 text-[10px] font-medium text-muted-foreground" translate="no">
                                    {t("requested_price")}
                                  </p>
                                  <p className="text-sm font-bold text-foreground" translate="no">
                                    {currency.symbol}
                                    {chat.rfqProductPriceRequest?.requestedPrice}
                                  </p>
                                </div>
                                
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] font-medium text-muted-foreground" translate="no">
                                      {t("status")}:
                                    </span>
                                    {chat.rfqProductPriceRequest?.status ===
                                    "APPROVED" ? (
                                      <span className="inline-flex items-center gap-0.5 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success ring-1 ring-green-200" translate="no">
                                        <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        {t("approved")}
                                      </span>
                                    ) : chat.rfqProductPriceRequest?.status ===
                                      "REJECTED" ? (
                                      <span className="inline-flex items-center gap-0.5 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive ring-1 ring-red-200" translate="no">
                                        <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                        {t("rejected")}
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-0.5 rounded-full bg-warning/10 px-2 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-amber-200" translate="no">
                                        <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                        </svg>
                                        {t("pending")}
                                      </span>
                                    )}
                                  </div>
                                  
                                  {/* Action Buttons for Pending Status - Only show if current user is NOT the one who requested */}
                                  {/* First vendor price is auto-approved, so it won't show as PENDING */}
                                  {chat.rfqProductPriceRequest?.status ===
                                    "PENDING" &&
                                    chat.rfqProductPriceRequest?.requestedById &&
                                    chat.rfqProductPriceRequest?.requestedById !== user?.id ? (
                                    <div className="flex gap-1.5">
                                      <button
                                        onClick={() =>
                                          handlePriceStatus(
                                            chat.rfqProductPriceRequest,
                                            RfqProductPriceRequestStatus.APPROVED,
                                          )
                                        }
                                        type="button"
                                        className="flex items-center gap-1 rounded-lg bg-success px-3 py-1.5 text-[10px] font-semibold text-white shadow-sm transition-all hover:bg-success/90 hover:shadow-md"
                                        translate="no"
                                      >
                                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        {t("accept")}
                                      </button>
                                      <button
                                        onClick={() =>
                                          handlePriceStatus(
                                            chat.rfqProductPriceRequest,
                                            RfqProductPriceRequestStatus.REJECTED,
                                          )
                                        }
                                        type="button"
                                        className="flex items-center gap-1 rounded-lg bg-destructive px-3 py-1.5 text-[10px] font-semibold text-white shadow-sm transition-all hover:bg-destructive/90 hover:shadow-md"
                                        translate="no"
                                      >
                                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                        {t("reject")}
                                      </button>
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          ) : (
                            /* Regular Text Message */
                            <div className="rounded-xl rounded-tl-sm bg-card px-3 py-2 text-xs text-foreground shadow-sm ring-1 ring-border">
                              <p
                                dangerouslySetInnerHTML={{
                                  __html: sanitizeHtml(chat?.content || ''),
                                }}
                              />
                            </div>
                          )
                        ) : null}

                        {/* NEW: Display Suggested Products (from buyer messages) */}
                        {chat?.rfqSuggestedProducts && chat.rfqSuggestedProducts.length > 0 && (
                          <div className="mt-2 space-y-2 rounded-lg bg-info/5 p-2.5 border border-info/20">
                            <div className="flex items-center gap-1.5 mb-2">
                              <svg className="h-4 w-4 text-info" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <p className="text-[10px] font-semibold text-purple-900" translate="no">
                                {t("suggested_alternative_products") || "Suggested Alternative Products"} ({chat.rfqSuggestedProducts.length})
                              </p>
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                              {chat.rfqSuggestedProducts.map((suggestion: any) => {
                                const product = suggestion.suggestedProduct;
                                const imageUrl = product?.product_productPrice?.[0]?.productPrice_productSellerImage?.[0]?.image ||
                                                product?.productImages?.[0]?.image;
                                const isSelected = suggestion.isSelectedByBuyer;
                                const displayPrice = suggestion.offerPrice || 
                                                    product?.product_productPrice?.[0]?.offerPrice || 
                                                    product?.product_productPrice?.[0]?.productPrice || 
                                                    0;

                                return (
                                  <div
                                    key={suggestion.id}
                                    className={`p-2 rounded-lg border transition-all ${
                                      isSelected ? "border-success bg-success/5" : "border-border bg-card"
                                    }`}
                                  >
                                    <div className="flex gap-2 items-start">
                                      <div className="relative w-12 h-12 flex-shrink-0 rounded overflow-hidden border border-border">
                                        <Image
                                          src={imageUrl && validator.isURL(imageUrl) ? imageUrl : PlaceholderImage}
                                          alt={product?.productName || "Product"}
                                          fill
                                          className="object-cover"
                                        />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium truncate mb-1">{product?.productName || "-"}</p>
                                        <p className="text-[10px] text-muted-foreground mb-1">
                                          {currency.symbol}{displayPrice}
                                          {suggestion.quantity > 1 && ` × ${suggestion.quantity}`}
                                        </p>
                                        {isSelected && (
                                          <span className="inline-flex items-center gap-0.5 mt-1 px-1.5 py-0.5 rounded-full bg-success/10 text-success text-[9px]">
                                            <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 20 20">
                                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                            {t("selected") || "Selected"}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        
                        {/* Timestamp */}
                        <div className="ml-1 text-[10px] font-normal text-muted-foreground">
                          {chat?.status === "SD" ? (
                            <span translate="no">{t("sending")}</span>
                          ) : (
                            <span>
                              {chat.createdAt
                                ? moment(chat.createdAt)
                                    .startOf("seconds")
                                    .fromNow()
                                : ""}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : null
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-3 flex w-full flex-wrap items-end text-xs text-muted-foreground" dir={langDir} translate="no">
            {chatHistoryLoading ? t("loading") : t("no_chat_history_found")}
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default SellerChatHistory;
