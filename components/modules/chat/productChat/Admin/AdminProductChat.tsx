import React, { useState, useEffect } from "react";
import Image from "next/image";
import AttachIcon from "@/public/images/attach.svg";
import { useToast } from "@/components/ui/use-toast";
import SmileIcon from "@/public/images/smile.svg";
import SendIcon from "@/public/images/send-button.png";
import ProductChatHistory from "../ProductChatHistory";
import { newAttachmentType, useSocket } from "@/context/SocketContext";
import { getChatHistory, getProductMessages, updateUnreadMessages, uploadAttachment } from "@/apis/requests/chat.requests";
import { useAuth } from "@/context/AuthContext";
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { generateUniqueNumber } from "@/utils/helper";
import { useTranslations } from "next-intl";

interface AdminProductChatProps {
  productId: number;
  sellerId: number;
  productDetails: any;
  roomId?: number;
}

const AdminProductChat: React.FC<AdminProductChatProps> = ({ productId, productDetails, sellerId, roomId }) => {
  const t = useTranslations();
  const [message, setMessage] = useState<string>('');
  const [chatHistoryLoading, setChatHistoryLoading] = useState<boolean>(false)
  const [selectedChatHistory, setSelectedChatHistory] = useState<any>([]);
  const [productMessages, setProductMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(roomId || null);
  const [selectedProductMessage, setSelectedProductMessage] = useState<any>(null);
  const [showEmoji, setShowEmoji] = useState<boolean>(false)
  const [attachments, setAttachments] = useState<any>([]);
  const [isAttachmentUploading, setIsAttachmentUploading] = useState<boolean>(false)

  const { sendMessage, cratePrivateRoom, newMessage, errorMessage, clearErrorMessage, newAttachment } = useSocket()
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (roomId) {
      // If roomId is provided, directly load that room's chat history
      setSelectedRoomId(roomId);
    } else if (productId && sellerId) {
      // Otherwise, get all product messages and select the first one
      handleGetProductMessages();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, productId, sellerId]);

  // Load chat history when selectedRoomId changes (including when set from roomId prop)
  useEffect(() => {
    if (selectedRoomId) {
      handleChatHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRoomId]);

  useEffect(() => {
    if (selectedRoomId) {
      handleChatHistory()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRoomId]);

  // receive a message
  useEffect(() => {
    if (newMessage) {
      handleNewMessage(newMessage)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newMessage]);

  useEffect(() => {
    if (errorMessage) {
      toast({
        title: t("chat"),
        description: errorMessage,
        variant: "danger",
      });
      clearErrorMessage()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errorMessage])

  // Update attachment status
  useEffect(() => {
    if (newAttachment) {
      handleUpdateAttachmentStatus(newAttachment);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newAttachment])
  const handleUpdateAttachmentStatus = (attach: newAttachmentType) => {
    try {
      if (attach?.senderId === user?.id) {
        setSelectedChatHistory((prevChatHistory: any[]) =>
          prevChatHistory.map((item1: any) => ({
            ...item1,
            attachments: item1?.attachments?.map((item2: any) =>
              item2.uniqueId === attach.uniqueId
                ? { ...item2, status: attach.status, filePath: attach.filePath, presignedUrl: attach.presignedUrl, fileType: attach?.fileType }
                : item2
            )
          }))
        );
      } else {
        const chatHistory = [...selectedChatHistory];
        const index = chatHistory.findIndex((message: any) => message.id === attach.messageId);
        if (index !== -1) {
          chatHistory[index]['attachments'].push(attach);
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
  }

  const handleGetProductMessages = async () => {
    try {
      setLoading(true)
      const res = await getProductMessages(productId, sellerId);
      if (res?.data?.status === 200) {
        if (res?.data?.data?.length > 0) {
          const roomId: number = res?.data?.data[0]?.room?.id
          setSelectedRoomId(roomId)
          setSelectedProductMessage(res?.data?.data[0]);
        }
        setProductMessages(res.data.data)
      } else {
        toast({
          title: t("chat"),
          description: t("product_messages_fetch_failed"),
          variant: "danger",
        });
      }
      setLoading(false)
    } catch (error) {
      setLoading(false)
      toast({
        title: t("chat"),
        description: t("product_messages_fetch_failed"),
        variant: "danger",
      });
    }
  }

  const handleChatHistory = async () => {
    try {
      setChatHistoryLoading(true)
      const roomIdToUse = selectedRoomId || roomId;
      if (!roomIdToUse) {
        setChatHistoryLoading(false);
        return;
      }
      const payload = {
        roomId: roomIdToUse
      }
      const res = await getChatHistory(payload);
      if (res?.data?.status === 200) {
        setSelectedChatHistory(res.data.data)
      }
      setChatHistoryLoading(false)
    } catch (error) {
      setChatHistoryLoading(false)
    }
  }

  const handleSendMessage = async () => {
    try {
      if (message || attachments.length) {
        if (selectedRoomId) {
          sendNewMessage(selectedRoomId, message)
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
      toast({
        title: t("chat"),
        description: t("failed"),
        variant: "danger",
      });
    }
  }

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

  const sendNewMessage = (roomId: number, content: string, rfqQuoteProductId?: number, sellerUserId?: number, requestedPrice?: number) => {
    const uniqueId = generateUniqueNumber();
    const attach = attachments.map((att: any) => {
      const extension = att?.name.split('.').pop();
      return {
        fileType: att?.type,
        fileName: att?.name,
        fileSize: att?.size,
        filePath: "",
        fileExtension: extension,
        uniqueId: att.uniqueId,
        status: "UPLOADING"
      }
    });

    const newMessage = {
      roomId: "",
      rfqId: "",
      content: message,
      userId: user?.id,
      user: {
        firstName: user?.firstName,
        lastName: user?.lastName
      },
      rfqQuotesUserId: null,
      attachments: attach,
      uniqueId,
      status: "SD",
      createdAt: new Date()
    }
    const chatHistory = [...selectedChatHistory]
    chatHistory.push(newMessage);
    setSelectedChatHistory(chatHistory)

    const msgPayload = {
      roomId: roomId,
      content,
      rfqId: productDetails?.id,
      requestedPrice,
      rfqQuoteProductId,
      sellerId: sellerUserId,
      rfqQuotesUserId: null,
      uniqueId,
      attachments: attach,
    }
    sendMessage(msgPayload)
  }

  const handleNewMessage = (message: any) => {
    try {
      const index = productMessages.findIndex((pMessage: any) => pMessage?.roomId === message?.roomId);
      const pList = [...productMessages];
      if (index !== -1) {
        const [item] = pList.splice(index, 1);
        let newItem = {
          ...item,
          content: message.content,
          createdAt: message.createdAt
        }
        if (selectedRoomId !== message?.roomId) {
          newItem = {
            ...newItem,
            unreadMsgCount: newItem?.unreadMsgCount ? newItem?.unreadMsgCount + 1 : 1,
          }
        }
        pList.unshift(newItem);
        setProductMessages(pList);
      } else {
        const newUser = {
          ...message,
          user: message.user,
          room: {
            id: message.roomId
          },
          userId: message.userId,
          unreadMsgCount: 1
        }
        pList.unshift(newUser);
        setProductMessages(pList);
        if (!selectedProductMessage) {
          setSelectedProductMessage(newUser)
        }
      }

      if (selectedRoomId === message?.roomId || !selectedRoomId) {
        const chatHistory = [...selectedChatHistory]
        const index = chatHistory.findIndex((chat) => chat?.uniqueId === message?.uniqueId);
        if (index !== -1) {
          // upload attachment once the message saved in draft mode, if attachments are selected
          if (chatHistory[index]?.attachments?.length) handleUploadedFile();

          const nMessage = {
            ...message,
            attachments: chatHistory[index]?.attachments || [],
            status: "sent"
          }
          chatHistory[index] = nMessage;
        } else {
          const nMessage = {
            ...message,
            attachments: [],
          }
          chatHistory.push(nMessage)
        }
        setSelectedChatHistory(chatHistory)
      } if (!selectedRoomId) {
        setSelectedRoomId(message.roomId)
      }
      // UPDATE UNREAD MESSAGE
      handleUpdateNewMessageStatus(message)
    } catch (error) { }
  }

  const handleUpdateNewMessageStatus = async (message: any) => {
    try {
      if (selectedRoomId !== null && message?.userId === selectedProductMessage?.user.id) {
        const payload = {
          userId: selectedProductMessage?.user?.id,
          roomId: selectedRoomId
        }
        await updateUnreadMessages(payload)
      }
    } catch (error) {

    }
  }

  const updateMessageCount = () => {
    const index = productMessages.findIndex((pMessage) => pMessage.userId === selectedProductMessage?.userId);
    if (index !== -1) {
      const pList = [...productMessages];
      pList[index]["unreadMsgCount"] = 0;
      setProductMessages(pList)
    }
  }

  const handleSendMessageKeyDown = (e: any) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCreateRoom = async (content: string, rfqQuoteProductId?: number, sellerUserId?: number, requestedPrice?: number) => {
    try {
      if (sellerId && user) {
        const uniqueId = generateUniqueNumber();
        const attach = attachments.map((att: any) => {
          const extension = att?.name.split('.').pop();
          return {
            fileType: att?.type,
            fileName: att?.name,
            fileSize: att?.size,
            filePath: "",
            uniqueId: att.uniqueId,
            fileExtension: extension,
            status: "UPLOADING"
          }
        });

        const newMessage = {
          roomId: "",
          rfqId: "",
          content: message,
          userId: user?.id,
          user: {
            firstName: user?.firstName,
            lastName: user?.lastName
          },
          rfqQuotesUserId: null,
          attachments: attach,
          uniqueId,
          status: "SD",
          createdAt: new Date()
        }
        const chatHistory = [...selectedChatHistory]
        chatHistory.push(newMessage);
        setSelectedChatHistory(chatHistory)

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
        }
        cratePrivateRoom(payload);
      }
    } catch (error) {
      return ""
    }
  }

  const onEmojiClick = (emojiObject: EmojiClickData) => {
    setMessage(prevMessage => prevMessage + emojiObject.emoji);
  }

  const handleFileChange = (e: any) => {
    const files = Array.from(e.target.files);
    const newData = files.map((file: any) => {
      const uniqueId = generateUniqueNumber();
      file.uniqueId = `${user?.id}-${uniqueId}`;
      return file;
    });
    setAttachments(newData);
  };

  const removeFile = (index: number) => {
    setAttachments((prevFiles: any) => prevFiles.filter((_: any, i: any) => i !== index));
  };

  return (
    <>
      <div className="w-full border-r border-solid border-gray-300">
        <div className="flex w-full flex-wrap p-[20px]">
          <ProductChatHistory
            selectedChatHistory={selectedChatHistory}
            chatHistoryLoading={chatHistoryLoading}
            buyerId={selectedProductMessage?.user?.id}
            roomId={selectedRoomId}
            unreadMsgCount={selectedProductMessage?.unreadMsgCount}
            updateMessageCount={updateMessageCount}
          />
        </div>
        {productDetails && (selectedRoomId || productMessages?.length > 0) ? (
          <div className="mt-2 flex w-full flex-wrap border-t border-solid border-gray-300 px-[15px] py-[10px]">
            <div className="flex w-full items-center">
              <div className="relative flex h-[32px] w-[32px] items-center">
                <input
                  type="file"
                  className="z-10 absolute inset-0 opacity-0"
                  multiple
                  onChange={handleFileChange}
                />
                <div className="absolute left-0 top-0 w-auto">
                  <Image src={AttachIcon} alt="attach-icon" />
                </div>
              </div>

              <div className="flex w-[calc(100%-6.5rem)] items-center">
                <textarea
                  placeholder="Type your message...."
                  className="h-[32px] w-full resize-none text-sm focus:outline-hidden"
                  onChange={(e) => setMessage(e.target.value)}
                  value={message}
                  onKeyDown={handleSendMessageKeyDown}
                ></textarea>
              </div>
              <div className="flex w-[72px] items-center justify-between">
                <div className="w-auto">
                  <Image src={SmileIcon} alt="smile-icon" onClick={() => setShowEmoji(!showEmoji)} />
                </div>
                <div className="flex w-auto">
                  <button type="button" className="">
                    <Image src={SendIcon} alt="send-icon" onClick={handleSendMessage} />
                  </button>
                </div>
              </div>
            </div>
            {showEmoji ? (
              <div className="w-full mt-2 border-t border-solid">
                <EmojiPicker onEmojiClick={onEmojiClick} className="mt-2" />
              </div>
            ) : null}

            {!isAttachmentUploading && attachments.length > 0 ? (
              <div className="mt-2 w-full flex flex-wrap gap-2">
                {attachments.map((file: any, index: any) => (
                  <div key={index} className="flex items-center border border-gray-300 p-2 rounded-md">
                    <span className="mr-2">{file.name}</span>
                    <button onClick={() => removeFile(index)} className="text-red-500">X</button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          ""
        )}
      </div>
    </>
  );
};

export default AdminProductChat;
