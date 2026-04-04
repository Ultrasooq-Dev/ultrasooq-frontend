"use client";
import { useEffect, useRef, useCallback } from "react";
import { track } from "@/lib/analytics";
import { useMessageStore } from "@/lib/messageStore";

/**
 * Messaging analytics hook.
 * Tracks page views, channel/conversation selections, message sends,
 * RFQ actions, and panel interactions.
 *
 * Mount once in the messages page.
 */
export function useMessageTracking() {
  const {
    selectedChannelId,
    chatPersonId,
    chatRoomId,
  } = useMessageStore();

  const prevChannelRef = useRef<string | null>(null);
  const prevPersonRef = useRef<string | null>(null);

  // ─── 1. Page view — fires once on mount ───
  useEffect(() => {
    track("messaging_page_viewed", {
      timestamp: new Date().toISOString(),
    });
  }, []);

  // ─── 2. Channel select — fires when selectedChannelId changes ───
  useEffect(() => {
    if (selectedChannelId && selectedChannelId !== prevChannelRef.current) {
      track("messaging_channel_selected", {
        channelId: selectedChannelId,
        previousChannelId: prevChannelRef.current,
      });
      prevChannelRef.current = selectedChannelId;
    }
  }, [selectedChannelId]);

  // ─── 3. Conversation open — fires when chatPersonId changes ───
  useEffect(() => {
    if (chatPersonId && chatPersonId !== prevPersonRef.current) {
      track("messaging_conversation_opened", {
        personId: chatPersonId,
        channelId: selectedChannelId,
        roomId: chatRoomId,
      });
      prevPersonRef.current = chatPersonId;
    }
  }, [chatPersonId, selectedChannelId, chatRoomId]);

  // ─── 4. Message sent — call from send handlers ───
  const trackMessageSent = useCallback((contentType: string = "text") => {
    track("messaging_message_sent", {
      roomId: chatRoomId,
      contentType,
      channelId: selectedChannelId,
    });
  }, [chatRoomId, selectedChannelId]);

  // ─── 5. RFQ actions — call from P6 handlers ───
  const trackRfqQuoteUpdated = useCallback((data?: Record<string, unknown>) => {
    track("messaging_rfq_quote_updated", {
      roomId: chatRoomId,
      channelId: selectedChannelId,
      ...data,
    });
  }, [chatRoomId, selectedChannelId]);

  const trackRfqAddedToCart = useCallback((data?: Record<string, unknown>) => {
    track("messaging_rfq_added_to_cart", {
      roomId: chatRoomId,
      channelId: selectedChannelId,
      ...data,
    });
  }, [chatRoomId, selectedChannelId]);

  // ─── 6. Panel interactions ───
  const trackPanelExpanded = useCallback((panelId: string) => {
    track("messaging_panel_expanded", {
      panelId,
      channelId: selectedChannelId,
    });
  }, [selectedChannelId]);

  const trackPanelCollapsed = useCallback((panelId: string) => {
    track("messaging_panel_collapsed", {
      panelId,
      channelId: selectedChannelId,
    });
  }, [selectedChannelId]);

  return {
    trackMessageSent,
    trackRfqQuoteUpdated,
    trackRfqAddedToCart,
    trackPanelExpanded,
    trackPanelCollapsed,
  };
}
