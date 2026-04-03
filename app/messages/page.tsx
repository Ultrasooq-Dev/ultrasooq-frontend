"use client";
import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import MsgPanel1 from "@/components/messaging/MsgPanel1";
import MsgPanel2 from "@/components/messaging/MsgPanel2";
import MsgPanel3 from "@/components/messaging/MsgPanel3";
import MsgPanel4 from "@/components/messaging/MsgPanel4";
import MsgPanel5 from "@/components/messaging/MsgPanel5";

export default function MessagesPage() {
  const { user, langDir } = useAuth();
  const locale = langDir === "rtl" ? "ar" : "en";

  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [selectedP2ItemId, setSelectedP2ItemId] = useState<string | null>(null);
  const [selectedP3ItemId, setSelectedP3ItemId] = useState<string | null>(null);
  const [chatPersonId, setChatPersonId] = useState<string | null>(null);
  const [showP3, setShowP3] = useState(false);
  const [showInfoPanel, setShowInfoPanel] = useState(false);

  // Channels that skip P2 and show directly in P3
  const directToP3Channels = new Set(["unread", "s_bot", "s_admin", "v_rfq", "v_product", "c_product"]);
  const isDirectToP3 = selectedChannelId ? directToP3Channels.has(selectedChannelId) : false;
  const hasP2 = !!selectedChannelId && !isDirectToP3;
  const hasP3 = (showP3 && !!selectedP2ItemId) || isDirectToP3;
  // P5 shows for RFQ/Product channels when a person is selected from P3
  const p5Channels = new Set(["v_rfq", "v_product", "c_rfq", "c_product"]);
  const hasP5 = !!chatPersonId && (showInfoPanel || (selectedChannelId ? p5Channels.has(selectedChannelId) : false));

  if (!user) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] overflow-hidden border-t border-border flex">
      {/* P1: always visible */}
      <div className="w-[200px] shrink-0 h-full">
        <MsgPanel1
          selectedId={selectedChannelId}
          onSelect={(id) => {
            setSelectedChannelId(id);
            setSelectedP2ItemId(null);
            setSelectedP3ItemId(null);
            setChatPersonId(null);
            setShowP3(false);
          }}
          locale={locale}
        />
      </div>

      {/* P2: visible when channel selected */}
      {hasP2 && (
        <div className="w-[260px] shrink-0 h-full">
          <MsgPanel2
            channelId={selectedChannelId}
            selectedId={selectedP2ItemId}
            onSelectForPanel3={(id) => {
              setSelectedP2ItemId(id);
              setSelectedP3ItemId(null);
              setChatPersonId(null);
              setShowP3(true);
            }}
            onSelectForPanel4={(id) => {
              setSelectedP2ItemId(id);
              setChatPersonId(id);
              setShowP3(false);
              setSelectedP3ItemId(null);
            }}
            locale={locale}
          />
        </div>
      )}

      {/* P3: sub-items or direct channel list (always the panel right before P4) */}
      {hasP3 && (
        <div className="w-[260px] shrink-0 h-full">
          <MsgPanel3
            channelId={isDirectToP3 ? selectedChannelId : selectedP2ItemId}
            selectedId={selectedP3ItemId ?? chatPersonId}
            onSelect={(id) => {
              setSelectedP3ItemId(id);
              setChatPersonId(id);
            }}
            locale={locale}
          />
        </div>
      )}

      {/* P4/P5: chat area — P5 replaces P4 for RFQ/Product channels */}
      {hasP5 ? (
        <div className="flex-1 min-w-0 h-full">
          <MsgPanel5
            personId={chatPersonId}
            onClose={() => { setChatPersonId(null); setShowInfoPanel(false); }}
            locale={locale}
          />
        </div>
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
