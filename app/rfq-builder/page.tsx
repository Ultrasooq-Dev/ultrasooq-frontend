"use client";
import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import SessionPanel from "@/components/rfq-builder/SessionPanel";
import RequestListPanel from "@/components/rfq-builder/RequestListPanel";
import ItemDetailPanel from "@/components/rfq-builder/ItemDetailPanel";
import CartPanel from "@/components/rfq-builder/CartPanel";

export default function RfqBuilderPage() {
  const { langDir } = useAuth();
  const locale = langDir === "rtl" ? "ar" : "en";

  const [selectedSessionId, setSelectedSessionId] = useState<string | null>("1");
  const [selectedItemId, setSelectedItemId] = useState<string | null>("1");
  const [sessionsCollapsed, setSessionsCollapsed] = useState(false);
  const [cartCollapsed, setCartCollapsed] = useState(false);

  const col1 = sessionsCollapsed ? "50px" : "170px";
  const col4 = cartCollapsed ? "50px" : "260px";

  return (
    <div
      className="h-[calc(100vh-64px)] overflow-hidden"
      style={{
        display: "grid",
        gridTemplateColumns: `${col1} 280px 1fr ${col4}`,
        gridTemplateRows: "1fr",
        transition: "grid-template-columns 0.2s ease",
      }}
    >
      <SessionPanel
        selectedId={selectedSessionId}
        collapsed={sessionsCollapsed}
        onToggleCollapse={() => setSessionsCollapsed(!sessionsCollapsed)}
        onSelect={(id) => {
          setSelectedSessionId(id);
          setSelectedItemId(null);
        }}
        onNewSession={() => {
          setSelectedSessionId(null);
          setSelectedItemId(null);
        }}
        locale={locale}
      />

      <RequestListPanel
        selectedItemId={selectedItemId}
        onSelectItem={setSelectedItemId}
        locale={locale}
      />

      <ItemDetailPanel
        selectedItemId={selectedItemId}
        onAddToCart={(productId) => {
          console.log("Add to cart:", productId);
        }}
        locale={locale}
      />

      <CartPanel
        locale={locale}
        collapsed={cartCollapsed}
        onToggleCollapse={() => setCartCollapsed(!cartCollapsed)}
      />
    </div>
  );
}
