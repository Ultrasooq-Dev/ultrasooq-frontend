export interface RfqRequestChatProps {
  rfqQuoteId: any;
  layoutMode?: "grid" | "column";
  viewMode?: "vendors" | "details";
  selectedVendorId?: number | null;
  onSelectVendor?: (vendor: any) => void;
}

export interface RfqRequestVendorDetailsProps {
  id: number;
  sellerID: number;
  buyerID: number;
  rfqQuotesId: number;
  offerPrice: string;
  sellerIDDetail: {
    firstName: string;
    lastName: string;
    profilePicture: string;
    accountName?: string;
    email?: string;
  };
  lastUnreadMessage: {
    content: string;
    createdAt: string;
  };
  unreadMsgCount: number;
  rfqQuotesUser_rfqQuotes?: any;
  rfqProductPriceRequests?: any[];
  rfqQuotesProducts?: any[];
}
