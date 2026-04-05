"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import io, { Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";
import { MessageStatus } from "@/utils/types/chat.types";
import { getApiUrl } from "@/config/api";

interface newMessageType {
  id?: number;
  content: string;
  userId: number;
  roomId: number;
  rfqId: number;
  createdAt: string;
  uniqueId?: number;
  user?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  participants?: number[];
  rfqProductPriceRequest?: { id: number; status: string; requestedPrice: number } | null;
  rfqQuotesUserId?: number | null;
  attachments?: { fileName: string; filePath: string; fileType: string }[];
}
export interface newAttachmentType {
  uniqueId: string;
  status: string;
  messageId: number;
  roomId: number;
  senderId: number;
  fileName: string;
  filePath: string;
  fileType: string;
  presignedUrl: string;
}
interface rfqRequestType {
  id: number;
  messageId: number;
  rfqQuoteProductId: number;
  status: string;
  requestedPrice: number;
  requestedById: number;
  newTotalOfferPrice: number;
}

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  sendMessage: (message: {
    roomId: number;
    rfqId: number;
    content: string;
    rfqQuoteProductId?: number;
    buyerId?: number;
    sellerId?: number;
    requestedPrice?: number;
    rfqQuotesUserId?: number | null;
    attachments?: { fileName: string; filePath: string; fileType: string }[],
    uniqueId: number
  }) => void;
  newMessage: newMessageType | null;
  errorMessage: string;
  clearErrorMessage: () => void;
  newRoom: {
    roomId: number,
    creatorId: number,
  } | null;
  newAttachment: newAttachmentType | null;
  cratePrivateRoom: (newRoom: {
    participants: number[];
    content: string;
    rfqId: number;
    rfqQuoteProductId?: number;
    buyerId?: number;
    sellerId?: number;
    requestedPrice?: number;
    rfqQuotesUserId?: number | null;
    attachments?: { fileName: string; filePath: string; fileType: string }[],
    uniqueId: number
  }) => void;
  updateRfqRequestStatus: (rfqRequest: {
    roomId: number | null;
    id: number;
    status: string;
    rfqUserId: number;
    requestedPrice: number;
    rfqQuoteProductId: number
  }) => void;
  rfqRequest: rfqRequestType | null;
  disconnectSocket: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [newMessage, setNewMessage] = useState<newMessageType | null>(null);
  const [newAttachment, setNewAttachment] = useState<newAttachmentType | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [newRoom, setNewRoom] = useState<{ roomId: number; creatorId: number } | null>(null);
  const [rfqRequest, setRfqRequest] = useState<rfqRequestType | null>(null);

  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const userId = user?.id;
    const hasValidUserId = userId !== undefined && userId !== null && !isNaN(Number(userId));
    
    if (hasValidUserId) {
      // Use the same backend URL as API calls
      const socketUrl = getApiUrl();
      const fullSocketUrl = `${socketUrl}/ws`;
      
      const socketIo = io(fullSocketUrl, {
        query: { userId: userId },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        timeout: 20000,
        forceNew: true,
        autoConnect: true,
      });

      socketIo.on("connect", () => {
        setConnected(true);
      });

      socketIo.on("disconnect", () => {
        setConnected(false);
      });

      socketIo.on("connect_error", (error) => {
        setConnected(false);
        setErrorMessage(`Connection failed: ${error.message || "Unable to connect to server"}. Please check if the backend is running on port 3000.`);
      });

      socketIo.on("receivedMessage", (message: newMessageType) => {
        setNewMessage(message);
      });

      socketIo.on("newRoomCreated", (room: { roomId: number, creatorId: number }) => {
        setNewRoom(room);
      });

      socketIo.on("newAttachment", (attachment: newAttachmentType) => {
        setNewAttachment(attachment);
      });

      socketIo.on(
        "updatedRfqPriceRequest",
        (rfqRequest: {
          id: number;
          messageId: number;
          rfqQuoteProductId: number;
          status: string;
          requestedPrice: number;
          requestedById: number;
          newTotalOfferPrice: number;
        }) => {
          setRfqRequest(rfqRequest);
        },
      );
      // ERROR MESSAGES
      socketIo.on("createPrivateRoomError", (error: { message: string; status?: number }) => {
        console.error("createPrivateRoomError:", error);
        setErrorMessage(error?.message || "Failed to create room. Please try again.");
      });

      socketIo.on("sendMessageError", (error: { message: string; status?: number }) => {
        console.error("sendMessageError:", error);
        setErrorMessage(error?.message || "Failed to send message. Please try again.");
      });

      socketIo.on(
        "updateRfqPriceRequestError",
        (error: { message: string; status?: number }) => {
          console.error("updateRfqPriceRequestError:", error);
          setErrorMessage(error?.message || "Failed to update request. Please try again.");
        },
      );

      setSocket(socketIo);

      return () => {
        socketIo.disconnect();
      };
    } else {
      // Clean up socket if user logs out
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setConnected(false);
        setNewRoom(null);
        setErrorMessage("");
        setNewMessage(null);
        setRfqRequest(null);
        setNewAttachment(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const sendMessage = ({
    roomId,
    content,
    rfqId,
    rfqQuoteProductId,
    requestedPrice,
    buyerId,
    sellerId,
    rfqQuotesUserId,
    suggestForRfqQuoteProductId,
    suggestedProducts,
    attachments,
    uniqueId
  }: {
    roomId: number;
    rfqId: number;
    content: string;
    rfqQuoteProductId?: number;
    buyerId?: number;
    sellerId?: number;
    requestedPrice?: number;
    rfqQuotesUserId?: number | null;
    suggestForRfqQuoteProductId?: number; // NEW: For product suggestions
    suggestedProducts?: Array<{ suggestedProductId: number; offerPrice?: number; quantity?: number }>; // NEW: Array of suggested products
    attachments?: { fileName: string; filePath: string; fileType: string }[],
    uniqueId: number
  }) => {
    if (!socket) {
      console.error("Socket is not initialized");
      setErrorMessage("Not connected. Please refresh the page.");
      return;
    }
    
    if (!connected) {
      console.error("Socket is not connected");
      setErrorMessage("Not connected to server. Please check your connection.");
      return;
    }

    if (!user?.id) {
      console.error("User ID is missing");
      setErrorMessage("User not authenticated. Please login again.");
      return;
    }

    socket.emit("sendMessage", {
      roomId,
      rfqId,
      content: content || "",
      userId: user.id,
      rfqQuoteProductId,
      buyerId,
      sellerId,
      requestedPrice,
      rfqQuotesUserId,
      suggestForRfqQuoteProductId,
      suggestedProducts,
      attachments: attachments || [],
      uniqueId
    });
  };

  const cratePrivateRoom = ({
    participants,
    content,
    rfqId,
    rfqQuoteProductId,
    buyerId,
    sellerId,
    requestedPrice,
    rfqQuotesUserId,
    suggestForRfqQuoteProductId,
    suggestedProducts,
    attachments,
    uniqueId
  }: {
    participants: number[];
    content: string;
    rfqId: number;
    rfqQuoteProductId?: number;
    buyerId?: number;
    sellerId?: number;
    requestedPrice?: number;
    rfqQuotesUserId?: number | null;
    suggestForRfqQuoteProductId?: number; // NEW: For product suggestions
    suggestedProducts?: Array<{ suggestedProductId: number; offerPrice?: number; quantity?: number }>; // NEW: Array of suggested products
    attachments?: { fileName: string; filePath: string; fileType: string }[],
    uniqueId: number
  }) => {
    if (!socket) {
      console.error("Socket is not initialized");
      setErrorMessage("Not connected. Please refresh the page.");
      return;
    }
    
    if (!connected) {
      console.error("Socket is not connected");
      setErrorMessage("Not connected to server. Please check your connection.");
      return;
    }

    if (!user?.id) {
      console.error("User ID is missing");
      setErrorMessage("User not authenticated. Please login again.");
      return;
    }

    socket.emit("createPrivateRoom", {
      creatorId: user.id,
      participants,
      content: content || "",
      rfqId,
      rfqQuoteProductId,
      buyerId,
      sellerId,
      requestedPrice,
      rfqQuotesUserId,
      suggestForRfqQuoteProductId,
      suggestedProducts,
      messageStatus: MessageStatus.READ,
      attachments: attachments || [],
      uniqueId
    });
  };

  const updateRfqRequestStatus = ({
    roomId,
    id,
    status,
    rfqUserId,
    requestedPrice,
    rfqQuoteProductId
  }: {
    roomId: number | null;
    id: number;
    status: string;
    rfqUserId: number;
    requestedPrice: number;
    rfqQuoteProductId: number
  }) => {
    if (socket) {
      socket.emit("updateRfqPriceRequest", {
        roomId,
        id,
        status,
        userId: user?.id,
        rfqUserId,
        requestedPrice,
        rfqQuoteProductId
      });
    }
  };

  const disconnectSocket = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setConnected(false);
      setNewRoom(null);
      setErrorMessage("");
      setNewMessage(null);
      setRfqRequest(null);
      setNewAttachment(null);
    }
  };

  const clearErrorMessage = () => {
    setErrorMessage("");
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        connected,
        newMessage,
        sendMessage,
        disconnectSocket,
        cratePrivateRoom,
        newRoom,
        errorMessage,
        clearErrorMessage,
        updateRfqRequestStatus,
        rfqRequest,
        newAttachment
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};
