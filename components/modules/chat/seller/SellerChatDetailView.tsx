import React from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { EmojiClickData } from "emoji-picker-react";
import SellerChatHistory from "./SellerChatHistory";
import ProductSuggestionModal from "../ProductSuggestionModal";
import SellerChatDetailHeader from "./SellerChatDetailHeader";
import SellerChatProductTable from "./SellerChatProductTable";
import SellerChatMessageInput from "./SellerChatMessageInput";
import { useDynamicTranslation } from "@/hooks/useDynamicTranslation";

interface SellerChatDetailViewProps {
  layoutMode: "grid" | "column";
  selectedRfqQuote: any;
  quoteProducts: any[];
  selectedRoom: number | null;
  selectedChatHistory: any[];
  chatHistoryLoading: boolean;
  rfqQuotes: any[];
  message: string;
  setMessage: (v: string) => void;
  showEmoji: boolean;
  setShowEmoji: (v: boolean) => void;
  attachments: any[];
  isAttachmentUploading: boolean;
  pendingPriceUpdates: Map<number, number>;
  hasPendingUpdates: boolean;
  editingPriceProductId: number | null;
  editingPriceValue: string;
  showProductSuggestionModal: boolean;
  suggestingForProductId: number | null;
  suggestingForProductQuantity: number;
  user: any;
  onBack: () => void;
  onSendMessage: () => void;
  onSendMessageKeyDown: (e: any) => void;
  onEmojiClick: (emojiObject: EmojiClickData) => void;
  onFileChange: (e: any) => void;
  onRemoveFile: (index: number) => void;
  onSendUpdate: () => void;
  onCancelUpdates: () => void;
  onRequestPrice: (productId: number, price: number) => void;
  onSuggestProduct: (productId: number, quantity: number) => void;
  onProductsSelected: (products: Array<{ suggestedProductId: number; offerPrice?: number; quantity?: number; productDetails?: any }>) => void;
  onCloseProductSuggestionModal: () => void;
  onSetEditingPriceProductId: (id: number | null) => void;
  onSetEditingPriceValue: (value: string) => void;
  getSuggestionsForProduct: (productId: number) => any[];
  updateRfqMessageCount: () => void;
}

/**
 * Full detail view for a selected RFQ quote:
 * header + product table + chat history + message input + product suggestion modal.
 */
const SellerChatDetailView: React.FC<SellerChatDetailViewProps> = (props) => {
  const t = useTranslations();
  const { translate } = useDynamicTranslation();

  const {
    layoutMode, selectedRfqQuote, quoteProducts, selectedRoom, selectedChatHistory,
    chatHistoryLoading, rfqQuotes, message, setMessage, showEmoji, setShowEmoji,
    attachments, isAttachmentUploading, pendingPriceUpdates, hasPendingUpdates,
    editingPriceProductId, editingPriceValue, showProductSuggestionModal,
    suggestingForProductId, suggestingForProductQuantity, user,
    onBack, onSendMessage, onSendMessageKeyDown, onEmojiClick, onFileChange, onRemoveFile,
    onSendUpdate, onCancelUpdates, onRequestPrice, onSuggestProduct, onProductsSelected,
    onCloseProductSuggestionModal, onSetEditingPriceProductId, onSetEditingPriceValue,
    getSuggestionsForProduct, updateRfqMessageCount,
  } = props;

  return (
    <div className={cn("flex h-full flex-col", layoutMode === "column" ? "bg-card" : "")}>
      {/* Back Button — grid mode only */}
      {layoutMode === "grid" && (
        <div className="mb-4">
          <button onClick={onBack}
            className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-muted">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {t("back_to_requests") || "Back to Requests"}
          </button>
        </div>
      )}

      <div className={cn(
        "flex w-full flex-1 flex-col overflow-hidden",
        layoutMode === "column" ? "bg-card" : "rounded-xl border border-border bg-card shadow-lg",
      )}>
        <SellerChatDetailHeader quoteProducts={quoteProducts} selectedRfqQuote={selectedRfqQuote} />

        <div className="flex flex-1 flex-col overflow-hidden min-h-0 p-2">
          <SellerChatProductTable
            isLoading={false}
            quoteProducts={quoteProducts}
            pendingPriceUpdates={pendingPriceUpdates}
            editingPriceProductId={editingPriceProductId}
            editingPriceValue={editingPriceValue}
            hasPendingUpdates={hasPendingUpdates}
            getSuggestionsForProduct={getSuggestionsForProduct}
            onSetEditingPriceProductId={onSetEditingPriceProductId}
            onSetEditingPriceValue={onSetEditingPriceValue}
            onRequestPrice={onRequestPrice}
            onSuggestProduct={onSuggestProduct}
            onSendUpdate={onSendUpdate}
            onCancelUpdates={onCancelUpdates}
          />

          {rfqQuotes?.length > 0 && (
            <div className="flex-1 flex flex-col overflow-hidden min-h-0 w-full rounded-lg border border-border bg-card shadow-sm flex-shrink-0">
              <SellerChatHistory
                roomId={selectedRoom}
                selectedChatHistory={selectedChatHistory}
                chatHistoryLoading={chatHistoryLoading}
                buyerId={selectedRfqQuote?.buyerID}
                rfqUserId={selectedRfqQuote?.id}
                updateRfqMessageCount={updateRfqMessageCount}
                unreadMsgCount={selectedRfqQuote?.unreadMsgCount}
              />
            </div>
          )}

          {rfqQuotes?.length > 0 && (
            <SellerChatMessageInput
              message={message}
              setMessage={setMessage}
              showEmoji={showEmoji}
              setShowEmoji={setShowEmoji}
              attachments={attachments}
              isAttachmentUploading={isAttachmentUploading}
              onSendMessage={onSendMessage}
              onKeyDown={onSendMessageKeyDown}
              onEmojiClick={onEmojiClick}
              onFileChange={onFileChange}
              onRemoveFile={onRemoveFile}
            />
          )}

          {showProductSuggestionModal && suggestingForProductId && user?.id && (
            <ProductSuggestionModal
              isOpen={showProductSuggestionModal}
              onClose={onCloseProductSuggestionModal}
              onSelectProducts={onProductsSelected}
              rfqQuoteProductId={suggestingForProductId}
              vendorId={user.id}
              defaultQuantity={suggestingForProductQuantity}
              defaultOfferPrice={
                quoteProducts.find((p) => p.id === suggestingForProductId)?.offerPrice
                  ? parseFloat(quoteProducts.find((p) => p.id === suggestingForProductId)?.offerPrice)
                  : undefined
              }
              mainProduct={{
                id: suggestingForProductId,
                name: translate(quoteProducts.find((p) => p.id === suggestingForProductId)?.rfqProductDetails?.productName || ""),
                image: quoteProducts.find((p) => p.id === suggestingForProductId)?.rfqProductDetails?.productImages?.[0]?.image,
                quantity: quoteProducts.find((p) => p.id === suggestingForProductId)?.quantity || 1,
                offerPrice: quoteProducts.find((p) => p.id === suggestingForProductId)?.offerPrice
                  ? parseFloat(quoteProducts.find((p) => p.id === suggestingForProductId)?.offerPrice)
                  : undefined,
              }}
              existingSuggestions={getSuggestionsForProduct(suggestingForProductId).map((s: any) => ({
                suggestedProductId: s.suggestedProductId,
                offerPrice: s.offerPrice,
                quantity: s.quantity,
              }))}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default SellerChatDetailView;
