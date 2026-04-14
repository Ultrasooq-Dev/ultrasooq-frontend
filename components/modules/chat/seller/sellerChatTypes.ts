export interface RfqQuoteType {
  id: number;
  rfqQuotesId: number;
  offerPrice: string;
  buyerID: number;
  buyerIDDetail: {
    firstName: string;
    lastName: string;
    profilePicture: string;
  };
  rfqQuotesUser_rfqQuotes: {
    rfqQuotesProducts: {
      rfqProductDetails: {
        productImages: {
          id: number;
          image: string;
        }[];
      };
    }[];
    rfqQuotes_rfqQuoteAddress: {
      address: string;
      rfqDate: string;
    };
  };
  lastUnreadMessage: {
    content: string;
    createdAt: string;
  };
  unreadMsgCount: number;
}

export interface SellerChatProps {
  layoutMode?: "grid" | "column";
  viewMode?: "rfqRequests" | "customers" | "details";
  selectedRfqId?: number | null;
  selectedCustomerId?: number | null;
  onSelectRfq?: (rfq: any, rfqGroup?: any[]) => void;
  onSelectCustomer?: (customer: any) => void;
  /** Controls card vs list display */
  displayMode?: "card" | "list";
}
