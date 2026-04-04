import { useEffect } from "react";
import { useSocket } from "@/context/SocketContext";
import { useMessageStore } from "./messageStore";
import { track } from "@/lib/analytics";

/**
 * Module-level map to track optimistic send timestamps.
 * Shared between useSendMessage (writes) and useMessageSocketBridge (reads).
 * Entries are cleaned up on confirm or after 60s (stale guard).
 */
const _sendTimestamps = new Map<string, number>();

// Stale guard: clean entries older than 60s every 30s
if (typeof window !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, ts] of _sendTimestamps) {
      if (now - ts > 60_000) _sendTimestamps.delete(key);
    }
  }, 30_000);
}

/**
 * Hook that bridges Socket.io events into the Zustand message store.
 * Mount once in the messages page or layout.
 *
 * Also tracks socket lifecycle events and message latency for monitoring.
 */
export function useMessageSocketBridge() {
  const { socket } = useSocket();
  const {
    addMessage,
    confirmMessage,
    incrementCount,
    updateChildLastMsg,
    setUserOnline,
    setUserOffline,
    setTyping,
    clearTyping,
  } = useMessageStore();

  useEffect(() => {
    if (!socket) return;

    // ─── Socket lifecycle monitoring ────────────
    const onConnect = () => {
      track("messaging_socket_connected", {
        socketId: socket.id,
        timestamp: new Date().toISOString(),
      });
    };

    const onDisconnect = (reason: string) => {
      track("messaging_socket_disconnected", {
        reason,
        socketId: socket.id,
        timestamp: new Date().toISOString(),
      });
    };

    const onConnectError = (err: Error) => {
      track("messaging_socket_error", {
        error: err.message,
        type: "connect_error",
        timestamp: new Date().toISOString(),
      });
    };

    const onError = (err: Error) => {
      track("messaging_socket_error", {
        error: err.message,
        type: "error",
        timestamp: new Date().toISOString(),
      });
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("error", onError);

    // If already connected when hook mounts, track it
    if (socket.connected) {
      track("messaging_socket_connected", {
        socketId: socket.id,
        timestamp: new Date().toISOString(),
        reconnect: true,
      });
    }

    // ─── Incoming message ────────────────────────
    const onReceived = (data: any) => {
      const roomId = String(data.roomId ?? data.room?.id ?? "");
      if (!roomId) return;

      const msg = {
        id: data.id ?? data.messageId ?? Date.now(),
        roomId,
        senderId: data.userId ?? data.senderId ?? 0,
        senderName: data.senderName ?? data.userName ?? "User",
        content: data.content ?? data.message ?? "",
        contentType: data.contentType ?? "text",
        createdAt: data.createdAt ?? new Date().toISOString(),
        readAt: null,
        attachments: data.attachments ?? [],
      };

      addMessage(roomId, msg);

      // Update P2 tree — find which channel/parent this room belongs to
      // This will be wired when we have room→channel mapping from API
    };

    // ─── Message confirmed (after optimistic send) ─
    const onMessageConfirmed = (data: any) => {
      const roomId = String(data.roomId ?? "");
      const tempId = String(data.tempId ?? data.uniqueId ?? "");
      if (!roomId || !tempId) return;

      confirmMessage(roomId, tempId, {
        id: data.id ?? data.messageId,
        roomId,
        senderId: data.userId ?? 0,
        senderName: data.senderName ?? "",
        content: data.content ?? "",
        contentType: data.contentType ?? "text",
        createdAt: data.createdAt ?? new Date().toISOString(),
        readAt: null,
      });

      // ─── Latency tracking ───
      const sentAt = _sendTimestamps.get(tempId);
      if (sentAt) {
        const latencyMs = Date.now() - sentAt;
        track("messaging_message_latency", {
          roomId,
          tempId,
          latencyMs,
          confirmedId: data.id ?? data.messageId,
        });
        _sendTimestamps.delete(tempId);
      }
    };

    // ─── User online/offline ─────────────────────
    const onUserOnline = (data: any) => {
      const userId = data.userId ?? data.id;
      if (userId) setUserOnline(userId);
    };

    const onUserOffline = (data: any) => {
      const userId = data.userId ?? data.id;
      if (userId) setUserOffline(userId);
    };

    // ─── Typing indicators ──────────────────────
    const onTyping = (data: any) => {
      const roomId = String(data.roomId ?? "");
      const userId = data.userId ?? 0;
      if (roomId && userId) {
        setTyping(roomId, userId);
        // Auto-clear after 3s
        setTimeout(() => clearTyping(roomId, userId), 3000);
      }
    };

    // ─── RFQ price update ───────────────────────
    const onRfqUpdate = (data: any) => {
      const roomId = String(data.roomId ?? "");
      if (!roomId) return;

      // Add system message for the update
      addMessage(roomId, {
        id: `sys-${Date.now()}`,
        roomId,
        senderId: data.userId ?? 0,
        senderName: data.userName ?? "System",
        content: data.message ?? "Price updated",
        contentType: "rfq_update",
        createdAt: new Date().toISOString(),
        readAt: null,
      });
    };

    // ─── New room created ───────────────────────
    const onNewRoom = (data: any) => {
      // Room was created — store can react
      // Will be wired to refresh P2 tree
    };

    // Register listeners
    socket.on("receivedMessage", onReceived);
    socket.on("messageConfirmed", onMessageConfirmed);
    socket.on("userOnline", onUserOnline);
    socket.on("userOffline", onUserOffline);
    socket.on("typing", onTyping);
    socket.on("updatedRfqPriceRequest", onRfqUpdate);
    socket.on("newRoomCreated", onNewRoom);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off("error", onError);
      socket.off("receivedMessage", onReceived);
      socket.off("messageConfirmed", onMessageConfirmed);
      socket.off("userOnline", onUserOnline);
      socket.off("userOffline", onUserOffline);
      socket.off("typing", onTyping);
      socket.off("updatedRfqPriceRequest", onRfqUpdate);
      socket.off("newRoomCreated", onNewRoom);
    };
  }, [socket, addMessage, confirmMessage, incrementCount, updateChildLastMsg, setUserOnline, setUserOffline, setTyping, clearTyping]);
}

/**
 * Hook to send a message via Socket.io with optimistic update.
 */
export function useSendMessage() {
  const { socket } = useSocket();
  const { addOptimisticMessage, chatRoomId } = useMessageStore();

  const send = (content: string, userId: number, userName: string, attachments?: any[]) => {
    if (!socket || !chatRoomId || !content.trim()) return;

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    // Record timestamp for latency measurement
    _sendTimestamps.set(tempId, Date.now());

    // Optimistic add
    addOptimisticMessage(chatRoomId, {
      id: tempId,
      roomId: chatRoomId,
      senderId: userId,
      senderName: userName,
      content: content.trim(),
      contentType: "text",
      createdAt: new Date().toISOString(),
      readAt: null,
      attachments,
    });

    // Emit to server
    socket.emit("sendMessage", {
      roomId: chatRoomId,
      content: content.trim(),
      userId,
      uniqueId: tempId,
      attachments: attachments ?? [],
    });
  };

  return send;
}
