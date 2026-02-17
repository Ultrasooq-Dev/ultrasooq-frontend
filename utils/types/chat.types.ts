export enum RfqProductPriceRequestStatus {
    APPROVED = "A",
    REJECTED = "R",
    PENDING = "P",
}

export enum MessageStatus {
    UNREAD,
    READ,
    DELETED
}

export interface SuggestedProductItem {
    suggestedProductId: number;
    offerPrice?: number;
    quantity?: number;
}

export interface CreatePrivateRoomRequest {
    creatorId: string;
    participants: number[];
    content?: string;
    rfqId?: number;
    rfqQuoteProductId?: number;
    buyerId?: number;
    sellerId?: number;
    requestedPrice?: number;
    rfqQuotesUserId?: number;
    suggestForRfqQuoteProductId?: number; // NEW: For product suggestions
    suggestedProducts?: SuggestedProductItem[]; // NEW: Array of suggested products
    uniqueId?: number;
    attachments?: { fileName: string; filePath: string; fileType: string }[];
}

export interface FindRoomRequest {
    rfqId: number;
    userId: number;
}


export interface SendMessageRequest {
    content: string;
    userId: number;
    roomId: number
}

export interface ChatHistoryRequest {
    roomId: number | null;
}

export interface RfqPriceStatusUpdateRequest {
    id: number;
    status: RfqProductPriceRequestStatus;
    userId?: number;
}


export interface UpdateMessageStatusRequest {
    userId: number;
    roomId: number;
}