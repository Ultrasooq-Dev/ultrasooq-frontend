import React, { useEffect, useRef } from "react";
import moment from "moment";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { updateUnreadMessages } from "@/apis/requests/chat.requests";
import DownloadIconButton from "../DownloadIconButton";
import { useTranslations } from "next-intl";
import { sanitizeHtml } from "@/utils/sanitize";

interface ProductChatHistoryProps {
  roomId?: number | null;
  selectedChatHistory: any[];
  chatHistoryLoading?: boolean;
  buyerId?: number | undefined;
  unreadMsgCount?: number | 0;
  updateMessageCount?: () => void
}

const ProductChatHistory: React.FC<ProductChatHistoryProps> = ({
  roomId,
  selectedChatHistory,
  chatHistoryLoading,
  buyerId,
  unreadMsgCount,
  updateMessageCount
}) => {
  const t = useTranslations();
  const { user, langDir } = useAuth();
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [selectedChatHistory]);

  useEffect(() => {
    if (unreadMsgCount) handleUnreadMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buyerId, roomId]);

  const handleUnreadMessages = async () => {
    try {
      if (user?.id && roomId && buyerId) {
        const payload = {
          userId: buyerId,
          roomId: roomId,
        };
        await updateUnreadMessages(payload);
        if (updateMessageCount) updateMessageCount()
      }
    } catch (error) { }
  };

  return (
    <div ref={chatContainerRef} className="h-full w-full overflow-y-auto px-4 py-4 bg-card">
      <div className="flex flex-col w-full gap-3">
        {selectedChatHistory?.length > 0 ? (
          <div>
            {selectedChatHistory?.map((chat: any, index: number) => (
              <div key={index}>
                {chat?.userId === user?.id ? (
                  <div className="flex w-full items-end justify-end gap-3">
                    <div className="flex max-w-[75%] flex-col items-end">
                      <div className="mb-1.5 inline-block w-auto rounded-2xl rounded-tr-sm bg-gradient-to-br from-primary to-primary/90 px-5 py-3 text-sm text-white shadow-lg shadow-blue-500/30">
                        {chat?.attachments?.length > 0 && (
                          <div className="mb-2 w-full space-y-2">
                            {chat?.attachments.map((file: any, index: any) => (
                              <div
                                key={index}
                                className="overflow-hidden rounded-xl border border-white/20 bg-card/10 backdrop-blur-sm"
                              >
                                <div className="flex-1">
                                  {file?.fileType.includes("imag") && file?.presignedUrl && (
                                    <img src={file?.presignedUrl} className="w-full max-w-sm h-auto rounded-t-xl" />
                                  )}
                                  {file?.fileType.includes("video") && file?.presignedUrl && (
                                    <video src={file?.presignedUrl} className="w-full max-w-sm h-auto rounded-t-xl" controls />
                                  )}
                                  <div className="flex items-center justify-between gap-2 p-2">
                                    <div className="flex-1 min-w-0">
                                      <p className="truncate text-xs font-medium text-white/90">{file.fileName}</p>
                                      {file?.status && (
                                        <p className="truncate text-xs text-white/70">
                                          {file?.status === "UPLOADING" ? "Uploading..." : file?.status}
                                        </p>
                                      )}
                                    </div>
                                    <DownloadIconButton
                                      attachmentId={file?.id}
                                      filePath={file?.filePath}
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        {chat?.content ? (
                          <div className="inline-block w-auto">
                            <p
                              className="text-white"
                              dangerouslySetInnerHTML={{
                                __html: sanitizeHtml(chat?.content || ''),
                              }}
                            />
                          </div>
                        ) : null}

                      </div>

                      <div className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        {chat?.status === "SD" ? (
                          <span className="flex items-center gap-1.5">
                            <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Sending...
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5">
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {chat.createdAt
                              ? moment(chat.createdAt)
                                .startOf("seconds")
                                .fromNow()
                              : ""
                            }
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="relative h-10 w-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center flex-shrink-0 ring-2 ring-white shadow-md">
                      {chat?.user?.profilePicture ? (
                        <Image
                          src={chat.user.profilePicture}
                          alt={chat?.user?.firstName || "User"}
                          fill
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-bold text-primary">
                          {chat?.user?.accountName?.[0]?.toUpperCase() || 
                           chat?.user?.firstName?.[0]?.toUpperCase() || 
                           chat?.user?.email?.[0]?.toUpperCase() || 
                           "U"}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (chat?.attachments?.length > 0 || chat?.content) ? (
                  <div className="flex w-full items-start gap-3">
                    <div className="relative h-10 w-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center flex-shrink-0 ring-2 ring-white shadow-md">
                      {chat?.user?.profilePicture ? (
                        <Image
                          src={chat.user.profilePicture}
                          alt={chat?.user?.firstName || "User"}
                          fill
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-bold text-muted-foreground">
                          {chat?.user?.accountName?.[0]?.toUpperCase() || 
                           chat?.user?.firstName?.[0]?.toUpperCase() || 
                           chat?.user?.email?.[0]?.toUpperCase() || 
                           "U"}
                        </span>
                      )}
                    </div>
                    <div className="flex max-w-[75%] flex-col">
                      {chat?.user && (chat.user.accountName || chat.user.firstName || chat.user.lastName || chat.user.email) && (
                        <div className="mb-1.5 text-xs font-bold text-foreground">
                          {(() => {
                            const accountName = chat.user.accountName;
                            const cleanAccountName = accountName 
                              ? accountName.replace(/\s*buyer\s*/gi, "").replace(/^\s*-\s*|\s*-\s*$/g, "").replace(/\s*-\s*/g, " ").trim()
                              : null;
                            
                            return cleanAccountName || 
                              (chat.user.firstName && chat.user.lastName 
                                ? `${chat.user.firstName} ${chat.user.lastName}`
                                : chat.user.firstName || chat.user.lastName || chat.user.email || "User");
                          })()}
                        </div>
                      )}
                      <div className="mb-1.5 inline-block w-auto rounded-2xl rounded-tl-sm bg-card px-5 py-3 text-sm text-foreground shadow-md border border-border/60">

                        {chat?.attachments?.length > 0 ? (
                          <div className="mb-2 w-full space-y-2">
                            {chat?.attachments.map((file: any, index: any) => (
                              <div
                                key={index}
                                className="overflow-hidden rounded-xl border border-border bg-muted shadow-sm"
                              >
                                <div className="flex-1">
                                  {file?.fileType.includes("imag") && file?.presignedUrl && (
                                    <img src={file?.presignedUrl} className="w-full max-w-sm h-auto rounded-t-xl" />
                                  )}
                                  {file?.fileType.includes("video") && file?.presignedUrl && (
                                    <video src={file?.presignedUrl} className="w-full max-w-sm h-auto rounded-t-xl" controls />
                                  )}
                                  <div className="flex items-center justify-between gap-2 p-3">
                                    <div className="flex-1 min-w-0">
                                      <p className="truncate text-xs font-semibold text-muted-foreground">{file.fileName}</p>
                                      {file?.status && (
                                        <p className="truncate text-xs text-muted-foreground">
                                          {file?.status === "UPLOADING" ? "Uploading..." : file?.status}
                                        </p>
                                      )}
                                    </div>
                                    <DownloadIconButton
                                      attachmentId={file?.id}
                                      filePath={file?.filePath}
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : null}

                        {chat?.content ? (
                          <div className="inline-block w-auto">
                            <p
                              className="text-foreground"
                              dangerouslySetInnerHTML={{
                                __html: sanitizeHtml(chat?.content || ''),
                              }}
                            />
                          </div>
                        ) : null}
                      </div>
                      <div className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>
                          {chat.createdAt
                            ? moment(chat.createdAt)
                              .startOf("seconds")
                              .fromNow()
                            : ""
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center py-16" dir={langDir} translate="no">
            <div className="text-center">
              {chatHistoryLoading ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="h-12 w-12 animate-spin rounded-full border-4 border-border border-t-primary"></div>
                  <p className="text-sm font-medium text-muted-foreground">{t("loading") || "Loading..."}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                    <svg className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-muted-foreground">
                    {t("no_chat_history_found") || "No chat history found"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("start_conversation") || "Start a conversation by sending a message"}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductChatHistory;
