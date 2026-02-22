import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import moment from "moment";
import validator from "validator";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import { RfqProductPriceRequestStatus } from "@/utils/types/chat.types";
import { updateUnreadMessages, selectSuggestedProducts } from "@/apis/requests/chat.requests";
import DownloadIconButton from "../DownloadIconButton";
import { useTranslations } from "next-intl";
import { useToast } from "@/components/ui/use-toast";
import PlaceholderImage from "@/public/images/product-placeholder.png";
import { sanitizeHtml } from "@/utils/sanitize";

interface RfqRequestChatHistoryProps {
  roomId: number | null;
  selectedChatHistory: any[];
  chatHistoryLoading: boolean;
  activeSellerId: number | undefined;
  unreadMsgCount: number | 0;
  rfqUserId: number;
  updateVendorMessageCount: () => void;
  isUploadingCompleted?: boolean | null;
  onProductSelected?: () => void; // NEW: Callback to refresh chat history after product selection
}

const RfqRequestChatHistory: React.FC<RfqRequestChatHistoryProps> = ({
  roomId,
  selectedChatHistory,
  chatHistoryLoading,
  activeSellerId,
  unreadMsgCount,
  updateVendorMessageCount,
  rfqUserId,
  isUploadingCompleted,
  onProductSelected,
}) => {
  const t = useTranslations();
  const { user, currency, langDir } = useAuth();
  const { toast } = useToast();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { updateRfqRequestStatus } = useSocket();
  const [selectingSuggestions, setSelectingSuggestions] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [selectedChatHistory]);

  useEffect(() => {
    if (unreadMsgCount) handleUnreadMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSellerId, roomId]);

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
    } catch (error) {}
  };

  const handleUnreadMessages = async () => {
    try {
      if (user?.id && roomId && activeSellerId) {
        const payload = {
          userId: activeSellerId,
          roomId: roomId,
        };
        await updateUnreadMessages(payload);
        updateVendorMessageCount();
      }
    } catch (error) {}
  };

  // NEW: Handle selecting suggested products (Buyer action)
  const handleSelectSuggestedProducts = async (
    suggestionIds: number[],
    rfqQuoteProductId: number,
    rfqQuotesUserId: number,
  ) => {
    if (!user?.id) return;

    // Allow empty array to deselect all products
    // Mark all suggestions in the message as "selecting" for better UX
    const allSuggestionIds = selectedChatHistory
      .flatMap((chat: any) => chat?.rfqSuggestedProducts?.map((s: any) => s.id) || [])
      .filter((id: number) => id);
    
    setSelectingSuggestions(new Set(allSuggestionIds));
    try {
      const response = await selectSuggestedProducts({
        selectedSuggestionIds: suggestionIds, // Can be empty array to deselect all
        rfqQuoteProductId,
        rfqQuotesUserId,
      });

      if (response.data?.status === 200) {
        toast({
          title: t("success") || "Success",
          description: suggestionIds.length > 0 
            ? (t("products_selected_successfully") || "Products selected successfully")
            : (t("products_deselected_successfully") || "Products deselected successfully"),
          variant: "success",
        });
        // Refresh chat history to see updated selection status
        if (onProductSelected) {
          onProductSelected();
        }
      }
    } catch (error: any) {
      toast({
        title: t("error") || "Error",
        description: error?.response?.data?.error || t("failed_to_select_products") || "Failed to select products",
        variant: "danger",
      });
    } finally {
      setSelectingSuggestions(new Set());
    }
  };

  return (
    <div
      ref={chatContainerRef}
      className="h-[500px] w-full overflow-y-auto px-4 py-4"
    >
      <div className="d-flex w-full">
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
                  <div className="mt-5 flex w-full flex-wrap items-end">
                    <div className="w-[calc(100%-2rem)] pr-2 text-right">
                      <div className="mb-1 inline-block w-auto rounded-xl p-3 text-right text-sm">
                        {chat?.attachments?.length > 0 ? (
                          <div className="mb-2 w-full">
                            {chat?.attachments.map((file: any, index: any) => (
                              <div
                                key={index}
                                className="mb-2 flex items-center justify-between rounded-md border border-gray-300 p-2"
                              >
                                <div className="flex-1">
                                  {file?.fileType.includes("imag") &&
                                  file?.presignedUrl ? (
                                    <img
                                      src={file?.presignedUrl}
                                      className="h-auto w-full max-w-sm"
                                    />
                                  ) : file?.fileType.includes("video") &&
                                    file?.presignedUrl ? (
                                    <video
                                      src={file?.presignedUrl}
                                      className="h-auto w-full max-w-sm"
                                      controls
                                    />
                                  ) : null}
                                  <p className="mr-2 truncate">
                                    {file.fileName}
                                  </p>
                                  {file?.status === "UPLOADING" ? (
                                    <p
                                      className="mr-2 truncate text-xs italic"
                                      translate="no"
                                    >
                                      {t("uploading")}
                                    </p>
                                  ) : (
                                    <p className="mr-2 truncate text-xs italic">
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
                        <span translate="no">
                          {isUploadingCompleted
                            ? t("attachments_uploading")
                            : ""}
                        </span>
                        {chat?.content ? (
                          <div className="inline-block w-auto rounded-xl bg-primary p-3 text-right text-sm text-white shadow-md">
                            <p
                              dangerouslySetInnerHTML={{
                                __html: sanitizeHtml(chat?.content || ''),
                              }}
                            />
                          </div>
                        ) : null}

                        {chat?.rfqProductPriceRequest ? (
                          <div className="mt-3 rounded-xl border-2 border-gray-200 bg-gray-50 p-4 shadow-md">
                            <div className="mb-3 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success shadow-sm">
                                  <svg
                                    className="h-4 w-4 text-white"
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
                                <div>
                                  <p
                                    className="text-xs font-medium text-gray-500"
                                    translate="no"
                                  >
                                    {t("requested_price")}
                                  </p>
                                  <p
                                    className="text-lg font-bold text-gray-900"
                                    translate="no"
                                  >
                                    {currency.symbol}
                                    {
                                      chat.rfqProductPriceRequest
                                        ?.requestedPrice
                                    }
                                  </p>
                                </div>
                              </div>
                              {chat.rfqProductPriceRequest?.status ===
                              "APPROVED" ? (
                                <div className="inline-flex items-center gap-1.5 rounded-full bg-success px-3 py-1.5 shadow-lg shadow-green-500/30">
                                  <svg
                                    className="h-4 w-4 text-white"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                  <span
                                    className="text-xs font-bold text-white"
                                    translate="no"
                                  >
                                    {t("approved")}
                                  </span>
                                </div>
                              ) : chat.rfqProductPriceRequest?.status ===
                                "REJECTED" ? (
                                <div className="inline-flex items-center gap-1.5 rounded-full bg-destructive px-3 py-1.5 shadow-lg shadow-red-500/30">
                                  <svg
                                    className="h-4 w-4 text-white"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                  <span
                                    className="text-xs font-bold text-white"
                                    translate="no"
                                  >
                                    {t("rejected")}
                                  </span>
                                </div>
                              ) : (
                                <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-600 px-3 py-1.5 shadow-lg shadow-amber-500/30">
                                  <svg
                                    className="h-4 w-4 animate-pulse text-white"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                  <span
                                    className="text-xs font-bold text-white"
                                    translate="no"
                                  >
                                    {t("pending")}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : null}

                        {/* NEW: Display Suggested Products (from vendor messages) */}
                        {chat?.rfqSuggestedProducts && chat.rfqSuggestedProducts.length > 0 && (
                          <div className="mt-3 rounded-xl border-2 border-info/20 bg-info/5 p-3 shadow-md">
                            <div className="flex items-center gap-2 mb-3">
                              <svg className="h-5 w-5 text-info" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <p className="text-xs font-semibold text-purple-900" translate="no">
                                {t("suggested_alternative_products") || "Suggested Alternative Products"} ({chat.rfqSuggestedProducts.length})
                              </p>
                            </div>
                            
                            {/* Table-like structure for suggested products */}
                            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                              {/* Header Row */}
                              <div className="grid grid-cols-[1fr_auto] gap-4 px-4 py-2 bg-gray-50 border-b border-gray-200">
                                <div className="text-xs font-semibold text-gray-700" translate="no">
                                  {t("component") || "Component"}
                                </div>
                                <div className="text-xs font-semibold text-gray-700 text-center" translate="no">
                                  {t("selection") || "Selection"}
                                </div>
                              </div>
                              
                              {/* Product Rows */}
                              <div className="divide-y divide-gray-200">
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
                                  const isSelecting = selectingSuggestions.has(suggestion.id);
                                  const rfqQuoteProductId = suggestion.rfqQuoteProductId;
                                  const rfqQuotesUserId = suggestion.rfqQuotesUserId;

                                  // Collect all currently selected product IDs for this RFQ product (from the same chat message)
                                  const allSelectedIds = chat.rfqSuggestedProducts
                                    .filter((s: any) => s.isSelectedByBuyer && s.rfqQuoteProductId === rfqQuoteProductId)
                                    .map((s: any) => s.id);

                                  return (
                                    <div
                                      key={suggestion.id}
                                      className="grid grid-cols-[1fr_auto] gap-4 px-4 py-3 hover:bg-gray-50 transition-colors"
                                    >
                                      {/* Left Side: Product Information */}
                                      <div className="flex items-center gap-3 min-w-0">
                                        <div className="relative w-12 h-12 flex-shrink-0 rounded overflow-hidden border border-gray-300 bg-gray-100">
                                          <Image
                                            src={imageUrl && validator.isURL(imageUrl) ? imageUrl : PlaceholderImage}
                                            alt={product?.productName || "Product"}
                                            fill
                                            className="object-cover"
                                          />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-medium text-gray-900 truncate mb-0.5">
                                            {product?.productName || "-"}
                                          </p>
                                          <p className="text-xs text-gray-600">
                                            {currency.symbol}{displayPrice}
                                            {suggestion.quantity > 1 && ` × ${suggestion.quantity}`}
                                          </p>
                                        </div>
                                      </div>

                                      {/* Right Side: Selection Button */}
                                      <div className="flex items-center justify-center">
                                        {isSelected ? (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              if (!isSelecting && rfqQuoteProductId && rfqQuotesUserId) {
                                                const newSelectionIds = allSelectedIds.filter((id: number) => id !== suggestion.id);
                                                handleSelectSuggestedProducts(
                                                  newSelectionIds,
                                                  rfqQuoteProductId,
                                                  rfqQuotesUserId,
                                                );
                                              }
                                            }}
                                            disabled={isSelecting}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-success text-white text-xs font-medium hover:bg-success/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            translate="no"
                                          >
                                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                            {t("selected") || "Selected"}
                                          </button>
                                        ) : (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              if (!isSelecting && rfqQuoteProductId && rfqQuotesUserId) {
                                                const newSelectionIds = [...allSelectedIds, suggestion.id];
                                                handleSelectSuggestedProducts(
                                                  newSelectionIds,
                                                  rfqQuoteProductId,
                                                  rfqQuotesUserId,
                                                );
                                              }
                                            }}
                                            disabled={isSelecting}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            translate="no"
                                          >
                                            {isSelecting ? (
                                              <>
                                                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                {t("selecting") || "Selecting..."}
                                              </>
                                            ) : (
                                              <>
                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                </svg>
                                                {t("choose") || "Choose"}
                                              </>
                                            )}
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="w-full text-right text-xs font-normal text-[#AEAFB8]">
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
                    <div className="h-[32px] w-[32px] rounded-full bg-[#F1F2F6]">
                      <span className="flex h-full w-full items-center justify-center">
                        {`${chat?.user?.firstName?.[0] ?? ""}${chat?.user?.lastName?.[0] ?? ""}`}
                      </span>
                    </div>
                  </div>
                ) : chat?.attachments?.length > 0 || chat?.content ? (
                  <div className="mt-5 flex w-full flex-wrap items-end">
                    <div className="h-[32px] w-[32px] rounded-full bg-[#F1F2F6]">
                      <span className="flex h-full w-full items-center justify-center">
                        {`${chat?.user?.firstName?.[0] ?? ""}${chat?.user?.lastName?.[0] ?? ""}`}
                      </span>
                    </div>
                    <div className="w-[calc(100%-2rem)] pl-2">
                      <div className="mb-1 inline-block w-auto rounded-xl p-3 text-left text-sm">
                        {chat?.attachments?.length > 0 ? (
                          <div className="mb-2 w-full">
                            {chat?.attachments.map((file: any, index: any) => (
                              <div
                                key={index}
                                className="mb-2 flex items-center justify-between rounded-md border border-gray-300 p-2"
                              >
                                <div className="flex-1">
                                  {file?.fileType.includes("imag") &&
                                  file?.presignedUrl ? (
                                    <img
                                      src={file?.presignedUrl}
                                      className="h-auto w-full max-w-sm"
                                    />
                                  ) : file?.fileType.includes("video") &&
                                    file?.presignedUrl ? (
                                    <video
                                      src={file?.presignedUrl}
                                      className="h-auto w-full max-w-sm"
                                      controls
                                    />
                                  ) : null}
                                  <p className="mr-2 truncate">
                                    {file.fileName}
                                  </p>
                                  {file?.status === "UPLOADING" ? (
                                    <p className="mr-2 truncate text-xs italic">
                                      {t("uploading")}
                                    </p>
                                  ) : (
                                    <p className="mr-2 truncate text-xs italic">
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
                        <span translate="no">
                          {isUploadingCompleted
                            ? t("attachments_uploading")
                            : ""}
                        </span>
                        {chat?.content ? (
                          <div className="inline-block w-auto rounded-xl border border-gray-300 bg-gray-200 p-3 text-left text-sm text-gray-800 shadow-sm">
                            <p
                              dangerouslySetInnerHTML={{
                                __html: sanitizeHtml(chat?.content || ''),
                              }}
                            />
                          </div>
                        ) : null}

                        {chat?.rfqProductPriceRequest ? (
                          <div className="mt-3 rounded-xl border-2 border-gray-200 bg-gray-50 p-4 shadow-md">
                            <div className="mb-3 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success shadow-sm">
                                  <svg
                                    className="h-4 w-4 text-white"
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
                                <div>
                                  <p
                                    className="text-xs font-medium text-gray-500"
                                    translate="no"
                                  >
                                    {t("requested_price")}
                                  </p>
                                  <p
                                    className="text-lg font-bold text-gray-900"
                                    translate="no"
                                  >
                                    {currency.symbol}
                                    {
                                      chat.rfqProductPriceRequest
                                        ?.requestedPrice
                                    }
                                  </p>
                                </div>
                              </div>
                              {chat.rfqProductPriceRequest?.status ===
                              "APPROVED" ? (
                                <div className="inline-flex items-center gap-1.5 rounded-full bg-success px-3 py-1.5 shadow-lg shadow-green-500/30">
                                  <svg
                                    className="h-4 w-4 text-white"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                  <span
                                    className="text-xs font-bold text-white"
                                    translate="no"
                                  >
                                    {t("approved")}
                                  </span>
                                </div>
                              ) : chat.rfqProductPriceRequest?.status ===
                                "REJECTED" ? (
                                <div className="inline-flex items-center gap-1.5 rounded-full bg-destructive px-3 py-1.5 shadow-lg shadow-red-500/30">
                                  <svg
                                    className="h-4 w-4 text-white"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                  <span
                                    className="text-xs font-bold text-white"
                                    translate="no"
                                  >
                                    {t("rejected")}
                                  </span>
                                </div>
                              ) : (
                                <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-600 px-3 py-1.5 shadow-lg shadow-amber-500/30">
                                  <svg
                                    className="h-4 w-4 animate-pulse text-white"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                  <span
                                    className="text-xs font-bold text-white"
                                    translate="no"
                                  >
                                    {t("pending")}
                                  </span>
                                </div>
                              )}
                            </div>
                            {/* Action Buttons for Pending Status - Only show if current user is NOT the one who requested */}
                            {/* First vendor price is auto-approved, so it won't show as PENDING */}
                            {chat.rfqProductPriceRequest?.status ===
                            "PENDING" &&
                            chat.rfqProductPriceRequest?.requestedById &&
                            chat.rfqProductPriceRequest?.requestedById !== user?.id ? (
                              <div className="mt-3 flex gap-2">
                                <button
                                  onClick={() =>
                                    handlePriceStatus(
                                      chat.rfqProductPriceRequest,
                                      RfqProductPriceRequestStatus.APPROVED,
                                    )
                                  }
                                  type="button"
                                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-success px-4 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:scale-105 hover:shadow-lg"
                                >
                                  <svg
                                    className="h-4 w-4"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                  {t("accept") || "Accept"}
                                </button>
                                <button
                                  onClick={() =>
                                    handlePriceStatus(
                                      chat.rfqProductPriceRequest,
                                      RfqProductPriceRequestStatus.REJECTED,
                                    )
                                  }
                                  type="button"
                                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-destructive px-4 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:scale-105 hover:shadow-lg"
                                >
                                  <svg
                                    className="h-4 w-4"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                  {t("reject") || "Reject"}
                                </button>
                              </div>
                            ) : null}
                          </div>
                        ) : null}

                        {/* NEW: Display Suggested Products (from vendor messages) - Buyer can select */}
                        {chat?.rfqSuggestedProducts && chat.rfqSuggestedProducts.length > 0 && (
                          <div className="mt-3 rounded-xl border-2 border-info/20 bg-info/5 p-3 shadow-md">
                            <div className="flex items-center gap-2 mb-3">
                              <svg className="h-5 w-5 text-info" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <p className="text-xs font-semibold text-purple-900" translate="no">
                                {t("suggested_alternative_products") || "Suggested Alternative Products"} ({chat.rfqSuggestedProducts.length})
                              </p>
                            </div>
                            
                            {/* Table-like structure for suggested products */}
                            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                              {/* Header Row */}
                              <div className="grid grid-cols-[1fr_auto] gap-4 px-4 py-2 bg-gray-50 border-b border-gray-200">
                                <div className="text-xs font-semibold text-gray-700" translate="no">
                                  {t("component") || "Component"}
                                </div>
                                <div className="text-xs font-semibold text-gray-700 text-center" translate="no">
                                  {t("selection") || "Selection"}
                                </div>
                              </div>
                              
                              {/* Product Rows */}
                              <div className="divide-y divide-gray-200">
                                {chat.rfqSuggestedProducts.map((suggestion: any) => {
                                  const product = suggestion.suggestedProduct;
                                  const imageUrl = product?.product_productPrice?.[0]?.productPrice_productSellerImage?.[0]?.image ||
                                                  product?.productImages?.[0]?.image;
                                  const isSelected = suggestion.isSelectedByBuyer;
                                  const displayPrice = suggestion.offerPrice || 
                                                      product?.product_productPrice?.[0]?.offerPrice || 
                                                      product?.product_productPrice?.[0]?.productPrice || 
                                                      0;
                                  const isSelecting = selectingSuggestions.has(suggestion.id);
                                  const rfqQuoteProductId = suggestion.rfqQuoteProductId;
                                  const rfqQuotesUserId = suggestion.rfqQuotesUserId;

                                  // Collect all currently selected product IDs for this RFQ product (from the same chat message)
                                  const allSelectedIds = chat.rfqSuggestedProducts
                                    .filter((s: any) => s.isSelectedByBuyer && s.rfqQuoteProductId === rfqQuoteProductId)
                                    .map((s: any) => s.id);

                                  return (
                                    <div
                                      key={suggestion.id}
                                      className="grid grid-cols-[1fr_auto] gap-4 px-4 py-3 hover:bg-gray-50 transition-colors"
                                    >
                                      {/* Left Side: Product Information */}
                                      <div className="flex items-center gap-3 min-w-0">
                                        <div className="relative w-12 h-12 flex-shrink-0 rounded overflow-hidden border border-gray-300 bg-gray-100">
                                          <Image
                                            src={imageUrl && validator.isURL(imageUrl) ? imageUrl : PlaceholderImage}
                                            alt={product?.productName || "Product"}
                                            fill
                                            className="object-cover"
                                          />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-medium text-gray-900 truncate mb-0.5">
                                            {product?.productName || "-"}
                                          </p>
                                          <p className="text-xs text-gray-600">
                                            {currency.symbol}{displayPrice}
                                            {suggestion.quantity > 1 && ` × ${suggestion.quantity}`}
                                          </p>
                                        </div>
                                      </div>

                                      {/* Right Side: Selection Button */}
                                      <div className="flex items-center justify-center">
                                        {isSelected ? (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              if (!isSelecting && rfqQuoteProductId && rfqQuotesUserId) {
                                                const newSelectionIds = allSelectedIds.filter((id: number) => id !== suggestion.id);
                                                handleSelectSuggestedProducts(
                                                  newSelectionIds,
                                                  rfqQuoteProductId,
                                                  rfqQuotesUserId,
                                                );
                                              }
                                            }}
                                            disabled={isSelecting}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-success text-white text-xs font-medium hover:bg-success/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            translate="no"
                                          >
                                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                            {t("selected") || "Selected"}
                                          </button>
                                        ) : (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              if (!isSelecting && rfqQuoteProductId && rfqQuotesUserId) {
                                                const newSelectionIds = [...allSelectedIds, suggestion.id];
                                                handleSelectSuggestedProducts(
                                                  newSelectionIds,
                                                  rfqQuoteProductId,
                                                  rfqQuotesUserId,
                                                );
                                              }
                                            }}
                                            disabled={isSelecting}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            translate="no"
                                          >
                                            {isSelecting ? (
                                              <>
                                                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                {t("selecting") || "Selecting..."}
                                              </>
                                            ) : (
                                              <>
                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                </svg>
                                                {t("choose") || "Choose"}
                                              </>
                                            )}
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="w-full text-left text-xs font-normal text-[#AEAFB8]">
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
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <div
            className="mt-5 flex w-full flex-wrap items-end"
            dir={langDir}
            translate="no"
          >
            {chatHistoryLoading ? t("loading") : t("no_chat_history_found")}
          </div>
        )}
      </div>
    </div>
  );
};

export default RfqRequestChatHistory;
