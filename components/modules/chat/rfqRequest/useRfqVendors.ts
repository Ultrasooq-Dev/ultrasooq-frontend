/**
 * Handles vendor-list management and RFQ product state updates.
 * Designed to be composed inside useRfqChat.
 */
import { useState } from "react";
import {
  useAllRfqQuotesUsersByBuyerId,
  useFindOneRfqQuotesUsersByBuyerID,
} from "@/apis/queries/rfq.queries";
import { RfqRequestVendorDetailsProps } from "./rfqChatTypes";

interface UseRfqVendorsParams {
  rfqQuoteId: any;
  layoutMode: "grid" | "column";
  viewMode?: "vendors" | "details";
  selectedVendorId?: number | null;
}

export function useRfqVendors({
  rfqQuoteId,
  layoutMode,
  viewMode,
  selectedVendorId,
}: UseRfqVendorsParams) {
  const [activeSellerId, setActiveSellerId] = useState<number>();
  const [rfqQuotesUserId, setRfqQuotesUserId] = useState<number>();
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const [vendorList, setVendorList] = useState<any[]>([]);

  const allRfqQuotesQuery = useAllRfqQuotesUsersByBuyerId(
    { page: 1, limit: 10, rfqQuotesId: rfqQuoteId ?? 0 },
    !!rfqQuoteId,
  );
  const rfqQuotesUsersByBuyerIdQuery = useFindOneRfqQuotesUsersByBuyerID(
    { rfqQuotesId: rfqQuoteId ? rfqQuoteId : undefined },
    !!rfqQuoteId,
  );
  const rfqQuoteDetailsById = rfqQuotesUsersByBuyerIdQuery.data?.data;

  function handleRfqProducts(item: any) {
    const hasFirstVendorApproval =
      item?.rfqProductPriceRequests?.some(
        (r: any) =>
          r?.status === "APPROVED" && r?.requestedById === item?.sellerID,
      ) || false;

    const newData =
      item?.rfqQuotesUser_rfqQuotes?.rfqQuotesProducts.map((i: any) => {
        let priceRequest = null;
        let offerPrice = i.offerPrice;
        const pRequest = item?.rfqProductPriceRequests?.find(
          (r: any) => r?.rfqQuoteProductId === i.id,
        );
        if (pRequest) priceRequest = pRequest;
        if (pRequest?.status === "APPROVED") offerPrice = pRequest.requestedPrice;
        else if (pRequest?.status === "REJECTED") offerPrice = i.offerPrice;
        return {
          ...i,
          priceRequest,
          offerPrice,
          offerPriceFrom: i.offerPriceFrom,
          offerPriceTo: i.offerPriceTo,
          hasFirstVendorApproval,
          address: item?.rfqQuotesUser_rfqQuotes?.rfqQuotes_rfqQuoteAddress?.address,
          deliveryDate: item?.rfqQuotesUser_rfqQuotes?.rfqQuotes_rfqQuoteAddress?.rfqDate,
        };
      }) || [];

    setSelectedVendor({ ...item, rfqQuotesProducts: newData });
  }

  function updateVendorMessageCount(activeSId?: number) {
    const sid = activeSId ?? activeSellerId;
    const index = vendorList.findIndex(
      (vendor: RfqRequestVendorDetailsProps) => vendor.sellerID === sid,
    );
    if (index !== -1) {
      const vList = [...vendorList];
      vList[index]["unreadMsgCount"] = 0;
      setVendorList(vList);
    }
  }

  function updateRFQProduct(rRequest: {
    id: number;
    messageId: number;
    requestedPrice: number;
    rfqQuoteProductId: number;
    requestedById: number;
    status: string;
    newTotalOfferPrice: number;
  }) {
    if (rRequest.status !== "APPROVED" && rRequest.status !== "REJECTED") return;
    const vDor = selectedVendor;
    if (!vDor?.rfqQuotesProducts) return;
    const index = vDor.rfqQuotesProducts.findIndex(
      (p: any) => p.id === rRequest.rfqQuoteProductId,
    );
    if (index === -1) return;
    const pList = vDor.rfqQuotesProducts;
    const offerPrice =
      rRequest.status === "APPROVED" ? rRequest.requestedPrice : pList[index].offerPrice;
    let priceRequest = pList[index]?.priceRequest || null;
    priceRequest = priceRequest
      ? { ...priceRequest, id: rRequest.id, requestedPrice: rRequest.requestedPrice, rfqQuoteProductId: rRequest.rfqQuoteProductId, status: rRequest.status }
      : { ...rRequest };
    pList[index]["priceRequest"] = priceRequest;
    pList[index]["offerPrice"] = offerPrice;
    const newData: any = { ...vDor, rfqQuotesProducts: pList };
    if (rRequest.newTotalOfferPrice) newData.offerPrice = rRequest.newTotalOfferPrice;
    setSelectedVendor(newData);
  }

  function applyNewMessage(msg: any, activeSId: number | undefined, rfqQuotesUId: number | undefined) {
    const index = vendorList.findIndex(
      (vendor: RfqRequestVendorDetailsProps) =>
        msg?.participants?.includes(vendor.sellerID),
    );
    if (index === -1) return { matched: false };

    const vList = [...vendorList];
    const [item] = vList.splice(index, 1);
    let newItem = {
      ...item,
      lastUnreadMessage: { content: msg.content, createdAt: msg.createdAt },
    };

    if (rfqQuotesUId !== msg?.rfqQuotesUserId) {
      newItem = { ...newItem, unreadMsgCount: newItem?.unreadMsgCount + 1 };
      if (msg?.rfqProductPriceRequest) {
        const rList = newItem.rfqProductPriceRequests;
        rList.push(msg?.rfqProductPriceRequest);
        newItem = { ...newItem, rfqProductPriceRequests: rList };
      }
    }

    vList.unshift(newItem);
    setVendorList(vList);
    return { matched: true, hasPriceRequest: !!msg?.rfqProductPriceRequest, priceRequest: msg?.rfqProductPriceRequest };
  }

  function canCheckoutFn() {
    if (!selectedVendor?.rfqQuotesProducts?.length) return false;
    return selectedVendor.rfqQuotesProducts.every(
      (p: any) =>
        p?.priceRequest &&
        p?.priceRequest?.status === "APPROVED" &&
        p?.offerPrice &&
        parseFloat(p.offerPrice) > 0,
    );
  }

  return {
    activeSellerId,
    setActiveSellerId,
    rfqQuotesUserId,
    setRfqQuotesUserId,
    selectedVendor,
    setSelectedVendor,
    vendorList,
    setVendorList,
    rfqQuoteDetailsById,
    allRfqQuotesQuery,
    rfqQuotesUsersByBuyerIdQuery,
    handleRfqProducts,
    updateVendorMessageCount,
    updateRFQProduct,
    applyNewMessage,
    canCheckoutFn,
  };
}
