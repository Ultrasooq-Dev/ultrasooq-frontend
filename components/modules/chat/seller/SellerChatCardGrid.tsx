import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { RfqQuoteType } from "./sellerChatTypes";
import SellerChatCardItem from "./SellerChatCardItem";

interface SellerChatCardGridProps {
  isLoading: boolean;
  groupedRfqQuotes: RfqQuoteType[][];
  displayMode: "card" | "list";
  isSelectMode: boolean;
  selectedRequests: Set<number>;
  showHiddenRequests: boolean;
  layoutMode: "grid" | "column";
  isMutationPending: boolean;
  onSelectRfq?: (rfq: any, rfqGroup?: any[]) => void;
  onCardClick: (rfqGroup: RfqQuoteType[]) => void;
  onToggleSelect: (id: number) => void;
  onHideRequest: (e: React.MouseEvent, id: number) => void;
  onUnhideRequest: (e: React.MouseEvent, id: number) => void;
  onSetShowHiddenRequests: (v: boolean) => void;
  onSetIsSelectMode: (v: boolean) => void;
  onSetSelectedRequests: (v: Set<number>) => void;
  onSelectAll: () => void;
  onBulkHide: () => void;
}

/**
 * The full card/list grid view: header toolbar + loading/empty states + item list.
 */
const SellerChatCardGrid: React.FC<SellerChatCardGridProps> = ({
  isLoading, groupedRfqQuotes, displayMode, isSelectMode, selectedRequests, showHiddenRequests,
  layoutMode, isMutationPending, onSelectRfq, onCardClick, onToggleSelect, onHideRequest,
  onUnhideRequest, onSetShowHiddenRequests, onSetIsSelectMode, onSetSelectedRequests,
  onSelectAll, onBulkHide,
}) => {
  const t = useTranslations();
  const { langDir } = useAuth();

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground" dir={langDir} translate="no">
              {showHiddenRequests ? "Hidden Requests" : t("request_for_rfq")}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground" dir={langDir} translate="no">
              {showHiddenRequests ? "View and restore hidden RFQ requests" : t("select_an_rfq_request_to_view_details") || "Select an RFQ request to view details and respond"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isSelectMode && selectedRequests.size > 0 && (
              <button onClick={onBulkHide} disabled={isMutationPending}
                className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50" translate="no" type="button">
                {isMutationPending ? (<><svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" fill="currentColor" /></svg>Processing...</>) : showHiddenRequests ? (<><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>Unhide Selected ({selectedRequests.size})</>) : (<><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>Hide Selected ({selectedRequests.size})</>)}
              </button>
            )}
            <button onClick={() => { onSetIsSelectMode(!isSelectMode); onSetSelectedRequests(new Set()); }}
              className={cn("flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all", isSelectMode ? "border-dark-orange bg-warning/5 text-dark-orange hover:bg-warning/10" : "border-border bg-card text-muted-foreground hover:bg-muted")} translate="no" type="button">
              {isSelectMode ? (<><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>Cancel Selection</>) : (<><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>Select Multiple</>)}
            </button>
            <button onClick={() => onSetShowHiddenRequests(!showHiddenRequests)}
              className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-muted" translate="no" type="button">
              {showHiddenRequests ? (<><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>Show Visible Requests</>) : (<><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>Show Hidden Requests</>)}
            </button>
          </div>
        </div>
        {isSelectMode && (
          <div className="mt-4 flex items-center gap-4 rounded-lg border border-border bg-muted px-4 py-2">
            <button onClick={onSelectAll} className="text-sm font-medium text-muted-foreground hover:text-foreground" translate="no" type="button">
              {selectedRequests.size === groupedRfqQuotes.length ? "Deselect All" : "Select All"}
            </button>
            <span className="text-sm text-muted-foreground" translate="no">{selectedRequests.size} of {groupedRfqQuotes.length} selected</span>
          </div>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className={displayMode === "list" ? "space-y-0 border border-border rounded-lg bg-card overflow-hidden divide-y divide-border" : "grid gap-4 md:grid-cols-2 lg:grid-cols-3"}>
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className={displayMode === "list" ? "h-24 w-full rounded-none" : "h-64 w-full rounded-xl"} />)}
        </div>
      )}

      {/* Empty */}
      {!isLoading && groupedRfqQuotes.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            {showHiddenRequests ? (
              <svg className="h-10 w-10 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
            ) : (
              <svg className="h-10 w-10 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            )}
          </div>
          <p className="text-center text-lg font-medium text-muted-foreground" dir={langDir} translate="no">
            {showHiddenRequests ? "No hidden requests found" : t("no_data_found")}
          </p>
        </div>
      )}

      {/* Grid / List */}
      {!isLoading && groupedRfqQuotes.length > 0 && (
        <div className={displayMode === "list" ? "space-y-0 border border-border rounded-lg bg-card overflow-hidden shadow-sm" : "grid gap-4 md:grid-cols-2 lg:grid-cols-3"}>
          {displayMode === "list" && (
            <div className={cn("hidden lg:grid gap-6 px-6 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-border sticky top-0 z-10", isSelectMode ? "grid-cols-[auto_120px_auto_300px_160px_220px_auto]" : "grid-cols-[120px_auto_300px_160px_220px_auto]")}>
              {isSelectMode && <div></div>}
              {["RFQ ID", "Products", "Product Details", "Buyer", "Latest Message", "Actions"].map((h) => (
                <div key={h} className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{h}</div>
              ))}
            </div>
          )}
          {groupedRfqQuotes.map((rfqGroup) => {
            const mainQuote = rfqGroup[0];
            const rfqId = mainQuote.rfqQuotesId;
            const isSelected = selectedRequests.has(mainQuote.id);

            return (
              <div key={rfqId}
                onClick={() => {
                  if (isSelectMode) { onToggleSelect(mainQuote.id); }
                  else if (layoutMode === "grid" && onSelectRfq) { onSelectRfq(mainQuote, rfqGroup); }
                  else { onCardClick(rfqGroup); }
                }}
                className={cn(
                  displayMode === "list"
                    ? cn("group border-b border-border bg-card px-4 py-4 lg:px-6 lg:py-5 transition-all hover:bg-muted/50 last:border-b-0 flex flex-col lg:grid gap-4 lg:gap-6 items-start lg:items-center", isSelectMode ? "lg:grid-cols-[auto_120px_auto_300px_160px_220px_auto]" : "lg:grid-cols-[120px_auto_300px_160px_220px_auto]")
                    : "group overflow-hidden rounded-xl border-2 bg-card shadow-sm transition-all",
                  isSelectMode ? "cursor-default" : displayMode === "list" ? "cursor-pointer" : "hover:border-dark-orange cursor-pointer hover:shadow-md",
                  isSelected && displayMode === "list" ? "bg-warning/5 border-l-4 border-l-dark-orange" : isSelected ? "border-dark-orange bg-warning/5" : displayMode === "list" ? "" : "border-border",
                )}>
                <SellerChatCardItem
                  rfqGroup={rfqGroup}
                  displayMode={displayMode}
                  isSelectMode={isSelectMode}
                  isSelected={isSelected}
                  showHiddenRequests={showHiddenRequests}
                  isMutationPending={isMutationPending}
                  onClick={() => {
                    if (isSelectMode) { onToggleSelect(mainQuote.id); }
                    else if (layoutMode === "grid" && onSelectRfq) { onSelectRfq(mainQuote, rfqGroup); }
                    else { onCardClick(rfqGroup); }
                  }}
                  onToggleSelect={() => onToggleSelect(mainQuote.id)}
                  onHide={(e) => onHideRequest(e, mainQuote.id)}
                  onUnhide={(e) => onUnhideRequest(e, mainQuote.id)}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SellerChatCardGrid;
