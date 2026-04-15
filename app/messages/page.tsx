"use client";
import React, { useState, useRef, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useMessageStore } from "@/lib/messageStore";
import { useMessageSocketBridge } from "@/lib/messageSocket";
import { useMessageData } from "@/components/messaging/useMessageData";
import { useMessageTracking } from "@/components/messaging/useMessageTracking";
import MsgPanel1 from "@/components/messaging/MsgPanel1";
import MsgPanel2 from "@/components/messaging/MsgPanel2";
import MsgPanel4 from "@/components/messaging/MsgPanel4";
import MsgPanel5 from "@/components/messaging/MsgPanel5";
import MsgPanel6 from "@/components/messaging/MsgPanel6";

// Hover expand/collapse hook
function useHoverCollapse(startCollapsed = true, delay = 400) {
  const [collapsed, setCollapsed] = useState(startCollapsed);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onEnter = useCallback(() => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    if (collapsed) setCollapsed(false);
  }, [collapsed]);

  const onLeave = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCollapsed(true), delay);
  }, [delay]);

  return { collapsed, setCollapsed, onEnter, onLeave };
}

export default function MessagesPage() {
  const { user, langDir } = useAuth();
  const locale = langDir === "rtl" ? "ar" : "en";
  const searchParams = useSearchParams();

  // ─── Zustand store — single source of truth ───
  const {
    selectedChannelId, chatPersonId, chatRoomId,
    selectChannel, selectPerson,
  } = useMessageStore();
  const [showInfoPanel, setShowInfoPanel] = useState(false);

  // ─── Socket.io bridge — pushes events into store ───
  useMessageSocketBridge();

  // ─── Real backend data — fetches via TanStack Query, pushes into store ───
  useMessageData();

  // ─── Analytics tracking — page views, channel/conversation events ───
  const { trackPanelExpanded, trackPanelCollapsed } = useMessageTracking();

  // Auto-select channel + conversation from URL query params
  // Usage: /messages?channel=c_rfq or /messages?channel=c_rfq&roomId=123
  useEffect(() => {
    const channel = searchParams?.get("channel");
    const roomId = searchParams?.get("roomId");
    if (channel && !selectedChannelId) {
      selectChannel(channel);
    }
    if (roomId && !chatPersonId) {
      // Auto-select the conversation after channel is set
      setTimeout(() => selectPerson(roomId, roomId), 100);
    }
  }, [searchParams, selectedChannelId, chatPersonId, selectChannel, selectPerson]);

  // Hover collapse for P1, P2 — with analytics tracking
  const p1 = useHoverCollapse(true, 400);
  const p2 = useHoverCollapse(true, 400);

  const p1Enter = () => { p1.onEnter(); if (p1.collapsed) trackPanelExpanded("P1"); };
  const p1Leave = () => { p1.onLeave(); if (!p1.collapsed) trackPanelCollapsed("P1"); };
  const p2Enter = () => { p2.onEnter(); if (p2.collapsed) trackPanelExpanded("P2"); };
  const p2Leave = () => { p2.onLeave(); if (!p2.collapsed) trackPanelCollapsed("P2"); };

  // P5+P6 show for RFQ/Product channels
  const p5Channels = new Set(["v_rfq", "v_product", "c_rfq", "c_product"]);
  const hasP5 = !!chatPersonId && (showInfoPanel || (selectedChannelId ? p5Channels.has(selectedChannelId) : false));
  const isVendor = selectedChannelId?.startsWith("v_") ?? false;

  if (!user) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] overflow-hidden border-t border-border flex">
      {/* P1: Channel tree — 240px ↔ 130px */}
      <div
        onMouseEnter={p1Enter}
        onMouseLeave={p1Leave}
        className={cn(
          "shrink-0 h-full transition-[width] duration-200 ease-in-out overflow-hidden",
          p1.collapsed ? "w-[130px]" : "w-[240px]"
        )}
      >
        <MsgPanel1
          selectedId={selectedChannelId}
          collapsed={p1.collapsed}
          onToggleCollapse={() => p1.setCollapsed(!p1.collapsed)}
          onSelect={(id) => selectChannel(id)}
          locale={locale}
        />
      </div>

      {/* P2: Item tree (merged P2+P3) — 260px ↔ 130px */}
      {selectedChannelId && (
        <div
          onMouseEnter={p2Enter}
          onMouseLeave={p2Leave}
          className={cn(
            "shrink-0 h-full transition-[width] duration-200 ease-in-out overflow-hidden",
            p2.collapsed ? "w-[130px]" : "w-[260px]"
          )}
        >
          <MsgPanel2
            channelId={selectedChannelId}
            selectedId={chatPersonId}
            collapsed={p2.collapsed}
            onSelect={(id) => selectPerson(id, id)}
            locale={locale}
          />
        </div>
      )}

      {/* Chat + Product panel */}
      {hasP5 ? (
        <>
          {/* P5: Chat only */}
          <div className="flex-1 min-w-0 h-full border-s border-border">
            <MsgPanel5
              personId={chatPersonId}
              onClose={() => { selectPerson(null); setShowInfoPanel(false); }}
              locale={locale}
            />
          </div>
          {/* P6: Products + Specs */}
          <div className="w-[420px] shrink-0 h-full">
            <MsgPanel6
              personId={chatPersonId}
              role={isVendor ? "vendor" : "customer"}
              locale={locale}
            />
          </div>
        </>
      ) : (
        <div className="flex-1 min-w-0 h-full">
          <MsgPanel4
            personId={chatPersonId}
            onToggleInfo={() => setShowInfoPanel(!showInfoPanel)}
            showInfo={showInfoPanel}
            locale={locale}
            userId={user?.id ?? 0}
            userName={user?.firstName ?? ""}
          />
        </div>
      )}
    </div>
  );
}
