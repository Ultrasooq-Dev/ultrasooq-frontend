import React, { useState, useEffect, useRef } from "react";
import { useGetProductDetails } from "@/apis/queries/chat.queries";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import AttachIcon from "@/public/images/attach.svg";
import { useToast } from "@/components/ui/use-toast";
import SmileIcon from "@/public/images/smile.svg";
import ProductChatHistory from "./ProductChatHistory";
import { newAttachmentType, useSocket } from "@/context/SocketContext";
import {
  findRoomId,
  getChatHistory,
  uploadAttachment,
} from "@/apis/requests/chat.requests";
import { useAuth } from "@/context/AuthContext";
import AdminProductChat from "./Admin/AdminProductChat";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import { generateUniqueNumber } from "@/utils/helper";
import { useTranslations } from "next-intl";

interface ProductChatProps {
  productId: number;
  roomId?: number;
}

const ProductChat: React.FC<ProductChatProps> = ({ productId, roomId }) => {
  const t = useTranslations();
  const [message, setMessage] = useState<string>("");
  const [selectedRoom, setSelectedRoom] = useState<number | null>(roomId || null);
  const [chatHistoryLoading, setChatHistoryLoading] = useState<boolean>(false);
  const [showEmoji, setShowEmoji] = useState<boolean>(false);
  const [attachments, setAttachments] = useState<any>([]);
  const [selectedChatHistory, setSelectedChatHistory] = useState<any>([]);
  const [isAttachmentUploading, setIsAttachmentUploading] =
    useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    sendMessage,
    cratePrivateRoom,
    newMessage,
    newRoom,
    errorMessage,
    clearErrorMessage,
    newAttachment,
    connected,
    socket,
  } = useSocket();
  const { toast } = useToast();
  const { user, langDir } = useAuth();

  const product = useGetProductDetails(productId);

  const productDetails = product?.data?.data;
  const sellerId =
    productDetails?.product_productPrice?.length > 0
      ? productDetails?.product_productPrice[0].adminDetail?.id
      : null;

  // Use provided roomId or check for existing room
  useEffect(() => {
    if (roomId) {
      setSelectedRoom(roomId);
    } else if (sellerId && user?.id !== sellerId) {
      checkRoomId();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sellerId, roomId]);

  useEffect(() => {
    if (selectedRoom && user?.id !== sellerId) {
      handleChatHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRoom]);

  // Handle new room creation
  useEffect(() => {
    if (newRoom?.roomId && !selectedRoom) {
      setSelectedRoom(newRoom.roomId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newRoom]);

  // receive a message
  useEffect(() => {
    if (newMessage) {
      handleNewMessage(newMessage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newMessage]);

  // if any error exception
  useEffect(() => {
    if (errorMessage) {
      toast({
        title: t("chat"),
        description: errorMessage,
        variant: "danger",
      });
      clearErrorMessage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errorMessage]);

  // Update attachment status
  useEffect(() => {
    if (newAttachment) {
      handleUpdateAttachmentStatus(newAttachment);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newAttachment]);

  const handleUpdateAttachmentStatus = (attach: newAttachmentType) => {
    try {
      if (attach?.senderId === user?.id) {
        setSelectedChatHistory((prevChatHistory: any[]) =>
          prevChatHistory.map((item1: any) => ({
            ...item1,
            attachments: item1.attachments.map((item2: any) =>
              item2.uniqueId === attach.uniqueId
                ? {
                    ...item2,
                    status: attach.status,
                    filePath: attach.filePath,
                    presignedUrl: attach.presignedUrl,
                    fileType: attach?.fileType,
                  }
                : item2,
            ),
          })),
        );
      } else {
        const chatHistory = [...selectedChatHistory];
        const index = chatHistory.findIndex(
          (message: any) => message.id === attach.messageId,
        );
        if (index !== -1) {
          chatHistory[index]["attachments"].push(attach);
          setSelectedChatHistory(chatHistory);
        }
      }
    } catch (error) {
      toast({
        title: t("chat"),
        description: t("attachment_update_status_failed"),
        variant: "danger",
      });
    }
  };

  const checkRoomId = async () => {
    try {
      if (user?.id && productDetails?.id) {
        const payloadRoomFind = {
          userId: user.id,
          rfqId: productDetails.id,
        };
        const room = await findRoomId(payloadRoomFind);
        if (room?.data?.roomId) {
          setSelectedRoom(room.data.roomId);
        } else {
          setSelectedRoom(null);
          setChatHistoryLoading(false);
          setSelectedChatHistory([]);
        }
      }
    } catch (error) {
      setChatHistoryLoading(false);
    }
  };

  const handleChatHistory = async () => {
    try {
      setChatHistoryLoading(true);
      const payload = {
        roomId: selectedRoom,
      };
      const res = await getChatHistory(payload);
      if (res?.data?.status === 200) {
        setSelectedChatHistory(res.data.data);
      }
      setChatHistoryLoading(false);
    } catch (error) {
      setChatHistoryLoading(false);
    }
  };

  const handleSendMessage = async () => {
    try {
      if (!connected || !socket) {
        toast({
          title: t("chat"),
          description: "Not connected to server. Please wait for connection...",
          variant: "danger",
        });
        return;
      }

      if (message || attachments.length) {
        if (selectedRoom) {
          sendNewMessage(selectedRoom, message);
        } else {
          handleCreateRoom(message);
        }
        setMessage("");
        setShowEmoji(false);
      } else {
        toast({
          title: t("chat"),
          description: t("please_type_your_message"),
          variant: "danger",
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: t("chat"),
        description: t("failed"),
        variant: "danger",
      });
    }
  };

  const handleUploadedFile = async () => {
    if (attachments?.length) {
      setIsAttachmentUploading(true);
      const uploadPromises = attachments.map(async (file: any) => {
        const formData = new FormData();
        formData.append("content", file);
        formData.append("uniqueId", file.uniqueId);

        try {
          await uploadAttachment(formData);
        } catch (error) {
        }
      });
      await Promise.all(uploadPromises);
      setAttachments([]);
      setIsAttachmentUploading(false);
    }
  };

  const sendNewMessage = (
    roomId: number,
    content: string,
    rfqQuoteProductId?: number,
    sellerUserId?: number,
    requestedPrice?: number,
  ) => {
    const uniqueId = generateUniqueNumber();
    const attach = attachments.map((att: any) => {
      const extension = att?.name.split(".").pop();
      return {
        fileType: att?.type,
        fileName: att?.name,
        fileSize: att?.size,
        filePath: "",
        fileExtension: extension,
        uniqueId: att.uniqueId,
        status: "UPLOADING",
      };
    });
    const newMessage = {
      roomId: "",
      rfqId: "",
      content: message,
      userId: user?.id,
      user: {
        firstName: user?.firstName,
        lastName: user?.lastName,
      },
      rfqQuotesUserId: null,
      attachments: attach,
      uniqueId,
      status: "SD",
      createdAt: new Date(),
    };
    const chatHistory = [...selectedChatHistory];
    chatHistory.push(newMessage);
    setSelectedChatHistory(chatHistory);

    const msgPayload = {
      roomId: roomId,
      content,
      rfqId: productDetails?.id,
      requestedPrice,
      rfqQuoteProductId,
      sellerId: sellerUserId,
      rfqQuotesUserId: null,
      attachments: attach,
      uniqueId: uniqueId,
    };
    sendMessage(msgPayload);
  };

  const handleNewMessage = (message: any) => {
    try {
      // Only process messages for this product
      if (message?.rfqId !== productDetails?.id) {
        return;
      }

      const chatHistory = [...selectedChatHistory];
      const index = chatHistory.findIndex(
        (chat) => chat?.uniqueId === message?.uniqueId,
      );
      
      if (index !== -1) {
        // upload attachment once the message saved in draft mode, if attachments are selected
        if (chatHistory[index]?.attachments?.length) {
          handleUploadedFile();
        }

        const nMessage = {
          ...message,
          attachments: chatHistory[index]?.attachments || [],
          status: "sent",
        };
        chatHistory[index] = nMessage;
      } else {
        // New message from server (not from our draft)
        const nMessage = {
          ...message,
          attachments: message?.attachments || [],
          status: "sent",
        };
        chatHistory.push(nMessage);
      }
      
      setSelectedChatHistory(chatHistory);
      
      if (!selectedRoom && message?.roomId) {
        setSelectedRoom(message.roomId);
      }
    } catch (error) {
      // Silent error handling
    }
  };

  const handleSendMessageKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCreateRoom = async (
    content: string,
    rfqQuoteProductId?: number,
    sellerUserId?: number,
    requestedPrice?: number,
  ) => {
    try {
      if (sellerId) {
        const uniqueId = generateUniqueNumber();
        const attach = attachments.map((att: any) => {
          const extension = att?.name.split(".").pop();
          return {
            fileType: att?.type,
            fileName: att?.name,
            fileSize: att?.size,
            filePath: "",
            uniqueId: att.uniqueId,
            fileExtension: extension,
            status: "UPLOADING",
          };
        });

        const newMessage = {
          roomId: "",
          rfqId: "",
          content: message,
          userId: user?.id,
          user: {
            firstName: user?.firstName,
            lastName: user?.lastName,
          },
          rfqQuotesUserId: null,
          attachments: attach,
          uniqueId,
          status: "SD",
          createdAt: new Date(),
        };
        const chatHistory = [...selectedChatHistory];
        chatHistory.push(newMessage);
        setSelectedChatHistory(chatHistory);

        const payload = {
          participants: [user?.id, sellerId],
          content,
          rfqId: productDetails?.id,
          requestedPrice,
          rfqQuoteProductId,
          sellerId: sellerUserId,
          rfqQuotesUserId: null,
          uniqueId,
          attachments: attach,
        };
        cratePrivateRoom(payload);
      }
    } catch (error) {
      return "";
    }
  };

  const onEmojiClick = (emojiObject: EmojiClickData) => {
    setMessage((prevMessage) => prevMessage + emojiObject.emoji);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileArray = Array.from(files);
      const newData = fileArray.map((file: any) => {
        const uniqueId = generateUniqueNumber();
        file.uniqueId = `${user?.id}-${uniqueId}`;
        return file;
      });
      setAttachments(newData);
    }
  };

  const removeFile = (index: number) => {
    setAttachments((prevFiles: any) =>
      prevFiles.filter((_: any, i: any) => i !== index),
    );
  };

  // If user is seller, show admin chat
  if (user?.id === sellerId) {
    return (
      <AdminProductChat
        productId={productId}
        productDetails={productDetails}
        sellerId={sellerId}
        roomId={roomId}
      />
    );
  }

  return (
    <div className="flex h-full w-full flex-col">
      {/* Product Info Section */}
      <div className="flex-shrink-0 border-b border-border bg-card p-4">
        {productDetails ? (
          <a
            target="_blank"
            href={`/trending/${productDetails?.id}`}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-border">
              {productDetails?.productImages?.[0] ? (
                <Image
                  src={productDetails.productImages[0].image}
                  alt={productDetails?.productName || "Product"}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-muted">
                  <svg className="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="truncate text-sm font-semibold text-foreground">
                {productDetails?.productName}
              </h3>
              <p className="text-xs text-muted-foreground">SKU: {productDetails?.skuNo}</p>
            </div>
          </a>
        ) : (
          <div className="flex items-center gap-3">
            <Skeleton className="h-16 w-16 rounded-lg" />
            <div className="flex-1">
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        )}
      </div>

      {/* Connection Status */}
      {!connected && (
        <div className="flex-shrink-0 mx-4 mt-4 rounded-lg bg-warning/5 border border-warning/20 p-3">
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 text-warning animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-xs font-medium text-warning">
              {t("connecting_to_server") || "Connecting to server..."}
            </p>
          </div>
        </div>
      )}

      {/* Chat History Section */}
      <div className="flex-1 overflow-hidden min-h-0">
        <ProductChatHistory
          selectedChatHistory={selectedChatHistory}
          chatHistoryLoading={chatHistoryLoading}
        />
      </div>

      {/* Input Section - Always visible */}
      <div className="flex-shrink-0 border-t border-border bg-card p-4 relative z-10">
        {/* Emoji Picker */}
        {showEmoji && (
          <div className="absolute bottom-full left-4 mb-2 z-50">
            <EmojiPicker onEmojiClick={onEmojiClick} />
          </div>
        )}

        {/* Attachments Preview */}
        {!isAttachmentUploading && attachments.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {attachments.map((file: any, index: number) => (
              <div
                key={index}
                className="flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2"
              >
                <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-xs font-medium text-muted-foreground max-w-[150px] truncate">
                  {file.name}
                </span>
                <button
                  onClick={() => removeFile(index)}
                  className="flex h-5 w-5 items-center justify-center rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20"
                >
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input Controls */}
        <div className="flex items-end gap-2">
          {/* File Input */}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            multiple
            onChange={handleFileChange}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-muted hover:bg-muted transition-colors"
          >
            <Image src={AttachIcon} alt="attach" className="h-5 w-5" />
          </button>

          {/* Message Input */}
          <div className="flex flex-1 items-end gap-2 rounded-lg border border-border bg-card px-3 py-2 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
            <textarea
              ref={inputRef as any}
              placeholder={t("type_your_message") || "Type your message..."}
              className="flex-1 resize-none border-0 bg-transparent text-sm text-foreground placeholder-muted-foreground focus:outline-none max-h-32 min-h-[36px]"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleSendMessageKeyDown}
              rows={1}
            />
            <button
              type="button"
              onClick={() => setShowEmoji(!showEmoji)}
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg hover:bg-muted transition-colors"
            >
              <Image src={SmileIcon} alt="emoji" className="h-5 w-5" />
            </button>
          </div>

          {/* Send Button */}
          <button
            type="button"
            onClick={handleSendMessage}
            disabled={(!message.trim() && attachments.length === 0) || !connected}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary text-white hover:bg-primary/90 disabled:bg-muted disabled:cursor-not-allowed transition-colors"
          >
            {connected ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductChat;
