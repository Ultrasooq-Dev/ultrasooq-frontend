"use client";
import React from "react";
import { useRfqChat } from "./useRfqChat";
import { RfqRequestChatProps, RfqRequestVendorDetailsProps } from "./rfqChatTypes";
import RfqGridVendorsList from "./RfqGridVendorsList";
import RfqGridRequestHeader from "./RfqGridRequestHeader";
import RfqGridVendorHeader from "./RfqGridVendorHeader";
import RfqGridProductsTable from "./RfqGridProductsTable";
import RfqRequestChatHistory from "./RfqRequestChatHistory";
import RfqChatInput from "./RfqChatInput";
import RfqVendorsListView from "./RfqVendorsListView";
import RfqColumnDetailsHeader from "./RfqColumnDetailsHeader";
import RfqColumnProductsTable from "./RfqColumnProductsTable";
import BuyerProductSelectionModal from "./BuyerProductSelectionModal";

const RfqRequestChat: React.FC<RfqRequestChatProps> = ({
  rfqQuoteId,
  layoutMode = "grid",
  viewMode,
  selectedVendorId,
  onSelectVendor,
}) => {
  const c = useRfqChat(rfqQuoteId, layoutMode, viewMode, selectedVendorId, onSelectVendor);

  const handleVendorSelect = (item: RfqRequestVendorDetailsProps) => {
    c.handleRfqProducts(item);
    c.setActiveSellerId(item?.sellerID);
    c.setRfqQuotesUserId(item?.id);
    if (onSelectVendor) onSelectVendor(item);
  };

  // ── Column layout ──────────────────────────────────────────────────────────
  if (layoutMode === "column") {
    if (viewMode === "vendors") {
      return (
        <RfqVendorsListView
          isLoading={c.allRfqQuotesQuery.isLoading}
          vendorList={c.vendorList}
          selectedVendorId={selectedVendorId}
          onSelectVendor={handleVendorSelect}
        />
      );
    }

    // details panel
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <RfqColumnDetailsHeader
          selectedVendor={c.selectedVendor}
          selectedChatHistory={c.selectedChatHistory}
          pendingProductSelections={c.pendingProductSelections}
          onCheckout={c.handleCheckout}
          canCheckout={c.canCheckoutFn()}
        />

        <RfqColumnProductsTable
          selectedVendor={c.selectedVendor}
          rfqQuoteDetailsById={c.rfqQuoteDetailsById}
          isLoading={c.allRfqQuotesQuery.isLoading}
          selectedChatHistory={c.selectedChatHistory}
          pendingProductSelections={c.pendingProductSelections}
          selectingSuggestions={c.selectingSuggestions}
          hasPendingSelections={c.hasPendingSelections}
          onOpenSelectionModal={c.handleOpenProductSelectionModal}
          onCancelPending={() => {
            c.setPendingProductSelections(new Map());
            c.setHasPendingSelections(false);
          }}
          onSendUpdate={c.handleSendUpdateToVendor}
        />

        <div className="flex-1 overflow-y-auto">
          <RfqRequestChatHistory
            {...{
              selectedChatHistory: c.selectedChatHistory,
              chatHistoryLoading: c.chatHistoryLoading,
              selectedRoom: c.selectedRoom,
              selectedVendor: c.selectedVendor,
              onRequestPrice: c.handleRequestPrice,
              updateVendorMessageCount: c.updateVendorMessageCount,
            } as any}
          />
        </div>

        <RfqChatInput
          message={c.message}
          setMessage={c.setMessage}
          showEmoji={c.showEmoji}
          setShowEmoji={c.setShowEmoji}
          attachments={c.attachments}
          isAttachmentUploading={c.isAttachmentUploading}
          onSendMessage={c.handleSendMessage}
          onKeyDown={c.handleSendMessageKeyDown}
          onFileChange={c.handleFileChange}
          onRemoveFile={c.removeFile}
          onEmojiClick={c.onEmojiClick}
          variant="compact"
        />

        {c.showProductSelectionModal && c.selectedProductForModal && (
          <BuyerProductSelectionModal
            {...{
              rfqQuoteId,
              rfqQuoteProductId: c.selectedProductForModal.rfqQuoteProductId,
              rfqQuotesUserId: c.selectedProductForModal.rfqQuotesUserId,
              selectedChatHistory: c.selectedChatHistory,
              onClose: c.handleCloseProductSelectionModal,
              onConfirm: c.handleProductSelectionFromModal,
            } as any}
          />
        )}
      </div>
    );
  }

  // ── Grid layout ────────────────────────────────────────────────────────────
  return (
    <div className="grid h-full grid-cols-[280px_1fr_1fr] gap-4 overflow-hidden">
      {/* Vendor list */}
      <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-lg shadow-border/50">
        <RfqGridVendorsList
          isLoading={c.allRfqQuotesQuery.isLoading}
          vendorList={c.vendorList}
          activeSellerId={c.activeSellerId}
          onSelectVendor={handleVendorSelect}
        />
      </div>

      {/* Products panel */}
      <div className="flex flex-col gap-4 overflow-hidden">
        <RfqGridRequestHeader
          rfqQuoteId={rfqQuoteId}
          selectedVendor={c.selectedVendor}
        />
        <RfqGridProductsTable
          selectedVendor={c.selectedVendor}
          rfqQuoteDetailsById={c.rfqQuoteDetailsById}
          isLoading={c.allRfqQuotesQuery.isLoading}
          onRequestPrice={c.handleRequestPrice}
        />
      </div>

      {/* Chat panel */}
      <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-lg shadow-border/50">
        <RfqGridVendorHeader
          selectedVendor={c.selectedVendor}
          onCheckout={c.handleCheckout}
          canCheckout={c.canCheckoutFn()}
        />

        <div className="flex-1 overflow-y-auto">
          <RfqRequestChatHistory
            {...{
              selectedChatHistory: c.selectedChatHistory,
              chatHistoryLoading: c.chatHistoryLoading,
              selectedRoom: c.selectedRoom,
              selectedVendor: c.selectedVendor,
              onRequestPrice: c.handleRequestPrice,
              updateVendorMessageCount: c.updateVendorMessageCount,
            } as any}
          />
        </div>

        <RfqChatInput
          message={c.message}
          setMessage={c.setMessage}
          showEmoji={c.showEmoji}
          setShowEmoji={c.setShowEmoji}
          attachments={c.attachments}
          isAttachmentUploading={c.isAttachmentUploading}
          onSendMessage={c.handleSendMessage}
          onKeyDown={c.handleSendMessageKeyDown}
          onFileChange={c.handleFileChange}
          onRemoveFile={c.removeFile}
          onEmojiClick={c.onEmojiClick}
        />
      </div>
    </div>
  );
};

export default RfqRequestChat;
