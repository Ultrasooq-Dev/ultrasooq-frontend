import React from "react";
import Image from "next/image";
import moment from "moment";
import validator from "validator";
import { useTranslations } from "next-intl";
import { useDynamicTranslation } from "@/hooks/useDynamicTranslation";
import { cn } from "@/lib/utils";
import PlaceholderImage from "@/public/images/product-placeholder.png";
import { RfqQuoteType } from "./sellerChatTypes";

interface SellerChatCardItemProps {
  rfqGroup: RfqQuoteType[];
  displayMode: "card" | "list";
  isSelectMode: boolean;
  isSelected: boolean;
  showHiddenRequests: boolean;
  isMutationPending: boolean;
  onClick: () => void;
  onToggleSelect: () => void;
  onHide: (e: React.MouseEvent) => void;
  onUnhide: (e: React.MouseEvent) => void;
}

/** Renders a single RFQ request item in either card or list layout. */
const SellerChatCardItem: React.FC<SellerChatCardItemProps> = ({
  rfqGroup, displayMode, isSelectMode, isSelected, showHiddenRequests,
  isMutationPending, onClick, onToggleSelect, onHide, onUnhide,
}) => {
  const t = useTranslations();
  const { translate } = useDynamicTranslation();
  const mainQuote = rfqGroup[0];
  const rfqId = mainQuote.rfqQuotesId;
  const buyerInfo = mainQuote.buyerIDDetail;
  const buyerName = (buyerInfo as any)?.accountName || `${buyerInfo?.firstName || ""} ${buyerInfo?.lastName || ""}`.trim() || "Buyer";

  const allProductImages = rfqGroup.flatMap((q) => q.rfqQuotesUser_rfqQuotes?.rfqQuotesProducts?.map((p: any) => p?.rfqProductDetails?.productImages?.[0]) || []).filter(Boolean);
  const allProductDetails = rfqGroup.flatMap((q) => q.rfqQuotesUser_rfqQuotes?.rfqQuotesProducts?.map((p: any) => ({ productName: translate(p?.rfqProductDetails?.productName || "Product"), quantity: p?.quantity || 1, productType: p?.productType || "SAME" })) || []).filter(Boolean);
  const totalUnreadMessages = rfqGroup.reduce((total, q) => total + (q.unreadMsgCount || 0), 0);
  const latestMessage = rfqGroup.map((q) => q.lastUnreadMessage).filter(Boolean).sort((a, b) => new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime())[0];

  const HideButton = () => (
    <button onClick={(e) => { e.stopPropagation(); onHide(e); }} disabled={isMutationPending}
      className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50 shadow-sm"
      title="Hide Request" type="button">
      {isMutationPending ? <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" fill="currentColor" /></svg> : <><svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg><span>Hide</span></>}
    </button>
  );
  const UnhideButton = () => (
    <button onClick={(e) => { e.stopPropagation(); onUnhide(e); }} disabled={isMutationPending}
      className="flex items-center gap-1.5 rounded-lg border border-success/30 bg-success/5 px-3 py-1.5 text-xs font-medium text-success transition-all hover:bg-success/10 disabled:cursor-not-allowed disabled:opacity-50 shadow-sm"
      title="Unhide Request" type="button">
      {isMutationPending ? <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" fill="currentColor" /></svg> : <><svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg><span>Unhide</span></>}
    </button>
  );

  if (displayMode === "list") {
    return (
      <>
        {isSelectMode && (
          <div onClick={(e) => { e.stopPropagation(); onToggleSelect(); }}
            className={cn("flex h-5 w-5 cursor-pointer items-center justify-center rounded border-2 transition-all", isSelected ? "border-dark-orange bg-dark-orange" : "border-border hover:border-dark-orange")}>
            {isSelected && <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
          </div>
        )}
        <div className="flex items-center">
          <p className="text-dark-orange text-base font-bold leading-tight" translate="no">RFQ{String(rfqId || "").padStart(5, "0")}</p>
        </div>
        <div className="flex gap-2">
          {allProductImages.slice(0, 3).map((img: any, idx: number) => (
            <div key={idx} className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg border-2 border-border bg-muted shadow-sm transition-all group-hover:border-dark-orange/30">
              <Image src={img?.image && validator.isURL(img.image) ? img.image : PlaceholderImage} fill alt={`Product ${idx + 1}`} className="object-cover" />
            </div>
          ))}
          {allProductImages.length > 3 && (
            <div className="relative flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border-2 border-border bg-gradient-to-br from-gray-100 to-gray-200 shadow-sm">
              <span className="text-xs font-bold text-muted-foreground">+{allProductImages.length - 3}</span>
            </div>
          )}
        </div>
        <div className="min-w-0">
          {allProductDetails.length > 0 && (
            <div className="space-y-1.5">
              {allProductDetails.slice(0, 2).map((product: any, idx: number) => (
                <div key={idx} className="flex items-center gap-3">
                  <span className="truncate text-sm font-medium text-foreground">{translate(product.productName)}</span>
                  <span className="flex-shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">Qty: {product.quantity}</span>
                </div>
              ))}
              {allProductDetails.length > 2 && <div className="text-xs font-medium text-muted-foreground">+{allProductDetails.length - 2} more product{allProductDetails.length - 2 > 1 ? "s" : ""}</div>}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative h-10 w-10 overflow-hidden rounded-full border-2 border-white ring-2 ring-gray-100 shadow-sm flex-shrink-0">
            <Image src={buyerInfo?.profilePicture || PlaceholderImage} alt={buyerName} fill className="object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground truncate">{buyerName}</p>
            <p className="text-xs text-muted-foreground">{rfqGroup.length} {rfqGroup.length === 1 ? "request" : "requests"}</p>
          </div>
        </div>
        <div className="min-w-0">
          {latestMessage?.content ? (
            <div className="rounded-lg bg-muted px-3 py-2 border border-border">
              <p className="line-clamp-1 text-xs text-muted-foreground truncate font-medium">{latestMessage.content}</p>
              {latestMessage.createdAt && <p className="mt-1 text-[10px] text-muted-foreground font-medium">{moment(latestMessage.createdAt).fromNow()}</p>}
            </div>
          ) : <span className="text-xs text-muted-foreground">-</span>}
        </div>
        <div className="flex items-center gap-3 justify-start lg:justify-end w-full lg:w-auto">
          {totalUnreadMessages > 0 && !showHiddenRequests && (
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/90 text-xs font-bold text-white shadow-lg ring-2 ring-blue-100">
              {totalUnreadMessages > 9 ? "9+" : totalUnreadMessages}
            </div>
          )}
          {!isSelectMode && (showHiddenRequests ? <UnhideButton /> : <HideButton />)}
        </div>
      </>
    );
  }

  // Card layout
  return (
    <>
      <div className="flex items-center justify-between border-b border-border bg-muted px-4 py-3">
        <div className="flex items-center gap-2">
          {isSelectMode && (
            <div onClick={(e) => { e.stopPropagation(); onToggleSelect(); }} className="flex h-5 w-5 cursor-pointer items-center justify-center rounded border-2 border-border transition-all hover:border-dark-orange">
              {isSelected && <svg className="h-4 w-4 text-dark-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
            </div>
          )}
          <div className="bg-dark-orange flex h-10 w-10 items-center justify-center rounded-lg shadow-sm">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <span className="text-xs font-medium text-muted-foreground" translate="no">{t("rfq_id")}</span>
            <p className="text-dark-orange text-base font-bold" translate="no">RFQ{String(rfqId || "").padStart(5, "0")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {totalUnreadMessages > 0 && !showHiddenRequests && (
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-white shadow-md">{totalUnreadMessages > 9 ? "9+" : totalUnreadMessages}</div>
          )}
          {!isSelectMode && (showHiddenRequests ? <UnhideButton /> : <HideButton />)}
        </div>
      </div>
      <div className="p-4">
        <div className="mb-3 flex gap-2">
          {allProductImages.slice(0, 3).map((img: any, idx: number) => (
            <div key={idx} className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
              <Image src={img?.image && validator.isURL(img.image) ? img.image : PlaceholderImage} fill alt={`Product ${idx + 1}`} className="object-cover" />
            </div>
          ))}
          {allProductImages.length > 3 && (
            <div className="relative flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
              <span className="text-sm font-bold text-muted-foreground">+{allProductImages.length - 3}</span>
            </div>
          )}
        </div>
        {allProductDetails.length > 0 && (
          <div className="mb-3 space-y-1.5">
            {allProductDetails.slice(0, 2).map((product: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between rounded-md bg-muted px-2 py-1.5 text-xs">
                <span className="flex-1 truncate font-medium text-muted-foreground">{translate(product.productName)}</span>
                <span className="ml-2 flex-shrink-0 text-muted-foreground">Qty: {product.quantity}</span>
              </div>
            ))}
            {allProductDetails.length > 2 && <div className="text-center text-xs text-muted-foreground">+{allProductDetails.length - 2} more product{allProductDetails.length - 2 > 1 ? "s" : ""}</div>}
          </div>
        )}
        <div className="mb-3 flex items-center gap-2">
          <div className="relative h-8 w-8 overflow-hidden rounded-full border-2 border-white ring-2 ring-gray-100">
            <Image src={buyerInfo?.profilePicture || PlaceholderImage} alt={buyerName} fill className="object-cover" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">{buyerName}</p>
            <p className="text-xs text-muted-foreground">{rfqGroup.length} {rfqGroup.length === 1 ? "request" : "requests"}</p>
          </div>
        </div>
        {latestMessage?.content && (
          <div className="rounded-lg border border-border bg-muted p-2">
            <p className="line-clamp-2 text-xs text-muted-foreground">{latestMessage.content}</p>
            {latestMessage.createdAt && <p className="mt-1 text-xs text-muted-foreground">{moment(latestMessage.createdAt).fromNow()}</p>}
          </div>
        )}
        {mainQuote.rfqQuotesUser_rfqQuotes?.rfqQuotes_rfqQuoteAddress?.rfqDate && (
          <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{moment(mainQuote.rfqQuotesUser_rfqQuotes.rfqQuotes_rfqQuoteAddress.rfqDate).format("MMM DD, YYYY")}</span>
          </div>
        )}
      </div>
    </>
  );
};

export default SellerChatCardItem;
