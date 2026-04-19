"use client";
import React, { useMemo } from "react";
import { groupRfqQuotesByRfqId } from "./sellerChatUtils";
import { useSellerChatState } from "./useSellerChatState";
import { useSellerChatReceive } from "./useSellerChatReceive";
import { useSellerChatActions } from "./useSellerChatActions";
import { useSellerChatMessaging } from "./useSellerChatMessaging";
import SellerChatRfqList from "./SellerChatRfqList";
import SellerChatCustomerList from "./SellerChatCustomerList";
import SellerChatDetailView from "./SellerChatDetailView";
import SellerChatCardGrid from "./SellerChatCardGrid";

interface SellerChatProps {
  layoutMode?: "grid" | "column";
  viewMode?: "rfqRequests" | "customers" | "details";
  selectedRfqId?: number | null;
  selectedCustomerId?: number | null;
  onSelectRfq?: (rfq: any, rfqGroup?: any[]) => void;
  onSelectCustomer?: (customer: any) => void;
  displayMode?: "card" | "list";
}

const SellerChat: React.FC<SellerChatProps> = ({
  layoutMode = "grid",
  viewMode = "rfqRequests",
  selectedRfqId = null,
  selectedCustomerId = null,
  onSelectRfq,
  onSelectCustomer,
  displayMode = "card",
}) => {
  const s = useSellerChatState();
  const receive = useSellerChatReceive(s);
  const actions = useSellerChatActions(s);
  const messaging = useSellerChatMessaging(s as any);

  const groupedRfqQuotes = useMemo(() => groupRfqQuotesByRfqId(s.rfqQuotes), [s.rfqQuotes]);

  const handleCardClick = (rfqGroup: any[]) => {
    const rfq = rfqGroup[0];
    actions.handleRfqProducts(rfq);
    s.setActiveSellerId(rfq?.buyerID);
    s.setSelectedRfqQuote(rfq);
    s.setShowDetailView(true);
    if (onSelectRfq) onSelectRfq(rfq, rfqGroup);
  };

  // grid layout
  if (layoutMode === "grid") {
    if (s.showDetailView && s.selectedRfqQuote) {
      return (
        <SellerChatDetailView
          layoutMode={layoutMode}
          selectedRfqQuote={s.selectedRfqQuote}
          quoteProducts={s.quoteProducts}
          selectedRoom={s.selectedRoom}
          selectedChatHistory={s.selectedChatHistory}
          chatHistoryLoading={s.chatHistoryLoading}
          rfqQuotes={s.rfqQuotes}
          message={s.message}
          setMessage={s.setMessage}
          showEmoji={s.showEmoji}
          setShowEmoji={s.setShowEmoji}
          attachments={s.attachments}
          isAttachmentUploading={s.isAttachmentUploading}
          pendingPriceUpdates={s.pendingPriceUpdates}
          hasPendingUpdates={s.hasPendingUpdates}
          editingPriceProductId={s.editingPriceProductId}
          editingPriceValue={s.editingPriceValue}
          showProductSuggestionModal={s.showProductSuggestionModal}
          suggestingForProductId={s.suggestingForProductId}
          suggestingForProductQuantity={s.suggestingForProductQuantity}
          user={s.user}
          onBack={() => s.setShowDetailView(false)}
          onSendMessage={actions.handleSendMessage}
          onSendMessageKeyDown={actions.handleSendMessageKeyDown}
          onEmojiClick={actions.onEmojiClick}
          onFileChange={messaging.handleFileChange}
          onRemoveFile={messaging.removeFile}
          onSendUpdate={actions.handleSendUpdate}
          onCancelUpdates={() => {
            s.setPendingPriceUpdates(new Map());
            s.setPendingSuggestionUpdates(new Map());
            s.setHasPendingUpdates(false);
          }}
          onRequestPrice={actions.handleRequestPrice}
          onSuggestProduct={(productId, quantity) => {
            s.setSuggestingForProductId(productId);
            s.setSuggestingForProductQuantity(quantity);
            s.setShowProductSuggestionModal(true);
          }}
          onProductsSelected={actions.handleProductsSelected}
          onCloseProductSuggestionModal={() => {
            s.setShowProductSuggestionModal(false);
            s.setSuggestingForProductId(null);
          }}
          onSetEditingPriceProductId={s.setEditingPriceProductId}
          onSetEditingPriceValue={s.setEditingPriceValue}
          getSuggestionsForProduct={actions.getProductSuggestions}
          updateRfqMessageCount={actions.updateRfqMessageCount}
        />
      );
    }

    return (
      <SellerChatCardGrid
        isLoading={s.allRfqQuotesQuery.isLoading}
        groupedRfqQuotes={groupedRfqQuotes}
        displayMode={displayMode}
        isSelectMode={s.isSelectMode}
        selectedRequests={s.selectedRequests}
        showHiddenRequests={s.showHiddenRequests}
        layoutMode={layoutMode}
        isMutationPending={s.hideRfqRequestMutation.isPending}
        onSelectRfq={onSelectRfq}
        onCardClick={handleCardClick}
        onToggleSelect={actions.handleToggleSelect}
        onHideRequest={actions.handleHideRequest}
        onUnhideRequest={actions.handleUnhideRequest}
        onSetShowHiddenRequests={s.setShowHiddenRequests}
        onSetIsSelectMode={s.setIsSelectMode}
        onSetSelectedRequests={s.setSelectedRequests}
        onSelectAll={() => actions.handleSelectAll(groupedRfqQuotes)}
        onBulkHide={() => actions.handleBulkHide(groupedRfqQuotes)}
      />
    );
  }

  // column layout: side-by-side panels
  if (viewMode === "customers") {
    return (
      <SellerChatCustomerList
        {...{
          rfqQuotes: s.rfqQuotes,
          selectedCustomerId,
          isLoading: s.allRfqQuotesQuery.isLoading,
          onSelectCustomer,
        } as any}
      />
    );
  }

  if (viewMode === "details" && s.selectedRfqQuote) {
    const DetailView = SellerChatDetailView as any;
    return (
      <DetailView
        layoutMode={layoutMode} selectedRfqQuote={s.selectedRfqQuote} quoteProducts={s.quoteProducts}
        selectedRoom={s.selectedRoom} selectedChatHistory={s.selectedChatHistory} chatHistoryLoading={s.chatHistoryLoading}
        rfqQuotes={s.rfqQuotes} message={s.message} setMessage={s.setMessage} showEmoji={s.showEmoji} setShowEmoji={s.setShowEmoji}
        attachments={s.attachments} isAttachmentUploading={s.isAttachmentUploading} pendingPriceUpdates={s.pendingPriceUpdates}
        hasPendingUpdates={s.hasPendingUpdates} editingPriceProductId={s.editingPriceProductId} editingPriceValue={s.editingPriceValue}
        showProductSuggestionModal={s.showProductSuggestionModal} suggestingForProductId={s.suggestingForProductId}
        suggestingForProductQuantity={s.suggestingForProductQuantity} user={s.user}
        onBack={() => s.setShowDetailView(false)} onSendMessage={actions.handleSendMessage}
        onSendMessageKeyDown={actions.handleSendMessageKeyDown} onEmojiClick={actions.onEmojiClick}
        onFileChange={messaging.handleFileChange} onRemoveFile={messaging.removeFile} onSendUpdate={actions.handleSendUpdate}
        onCancelUpdates={() => { s.setPendingPriceUpdates(new Map()); s.setPendingSuggestionUpdates(new Map()); s.setHasPendingUpdates(false); }}
        onRequestPrice={actions.handleRequestPrice}
        onSuggestProduct={(productId: any, quantity: any) => { s.setSuggestingForProductId(productId); s.setSuggestingForProductQuantity(quantity); s.setShowProductSuggestionModal(true); }}
        onProductsSelected={actions.handleProductsSelected}
        onCloseProductSuggestionModal={() => { s.setShowProductSuggestionModal(false); s.setSuggestingForProductId(null); }}
        onSetEditingPriceProductId={s.setEditingPriceProductId} onSetEditingPriceValue={s.setEditingPriceValue}
        getSuggestionsForProduct={actions.getProductSuggestions} updateRfqMessageCount={actions.updateRfqMessageCount}
      />
    );
  }

  // default: rfqRequests list
  const RfqList = SellerChatRfqList as any;
  return (
    <RfqList
      rfqQuotes={s.rfqQuotes} selectedRfqId={selectedRfqId} isLoading={s.allRfqQuotesQuery.isLoading}
      onSelectRfq={(rfq: any, rfqGroup?: any[]) => {
        actions.handleRfqProducts(rfq); s.setActiveSellerId(rfq?.buyerID); s.setSelectedRfqQuote(rfq);
        if (onSelectRfq) onSelectRfq(rfq, rfqGroup);
      }}
    />
  );
};

export default SellerChat;
