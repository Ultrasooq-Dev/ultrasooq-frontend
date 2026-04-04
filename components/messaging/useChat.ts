"use client";
import { useEffect, useRef, useCallback } from "react";
import { useMessageStore, type ChatMessage } from "@/lib/messageStore";
import { useSendMessage } from "@/lib/messageSocket";
import { useSocket } from "@/context/SocketContext";

/**
 * Shared chat hook for P4 and P5.
 * Reads messages from store, sends via socket, auto-scrolls, marks as read.
 */
export function useChatMessages(userId: number, userName: string) {
  const { socket } = useSocket();
  const {
    chatRoomId,
    chatPersonId,
    messages,
    sendingIds,
    onlineUsers,
    typingUsers,
    markAsRead,
  } = useMessageStore();

  const send = useSendMessage();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Current room's messages
  const roomMessages = chatRoomId ? (messages[chatRoomId] ?? []) : [];

  // Typing users in current room
  const roomTyping = chatRoomId ? (typingUsers[chatRoomId] ?? []).filter((id) => id !== userId) : [];

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [roomMessages.length]);

  // Mark as read when room opens or new messages arrive
  useEffect(() => {
    if (chatRoomId && roomMessages.length > 0) {
      const hasUnread = roomMessages.some((m) => !m.readAt && m.senderId !== userId);
      if (hasUnread) {
        markAsRead(chatRoomId);
        // Emit to server
        if (socket) {
          socket.emit("markAsRead", { roomId: chatRoomId, userId });
        }
      }
    }
  }, [chatRoomId, roomMessages, userId, markAsRead, socket]);

  // Emit typing indicator
  const emitTyping = useCallback(() => {
    if (socket && chatRoomId) {
      socket.emit("typing", { roomId: chatRoomId, userId });
    }
  }, [socket, chatRoomId, userId]);

  // Send message
  const sendMessage = useCallback((content: string, attachments?: any[]) => {
    if (!content.trim()) return;
    send(content, userId, userName, attachments);
  }, [send, userId, userName]);

  // Check if a message is still sending (optimistic)
  const isSending = useCallback((msgId: string | number) => {
    return sendingIds.has(String(msgId));
  }, [sendingIds]);

  return {
    roomMessages,
    roomTyping,
    scrollRef,
    sendMessage,
    emitTyping,
    isSending,
    chatRoomId,
    chatPersonId,
  };
}
