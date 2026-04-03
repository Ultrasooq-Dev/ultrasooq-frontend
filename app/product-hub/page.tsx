"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useSearchParams } from "next/navigation";
import SessionPanel from "@/components/rfq-builder/SessionPanel";
import RequestListPanel from "@/components/rfq-builder/RequestListPanel";
import ItemDetailPanel from "@/components/rfq-builder/ItemDetailPanel";
import CartPanel from "@/components/rfq-builder/CartPanel";
import { useAllRfqQuotesByBuyerId } from "@/apis/queries/rfq.queries";
import { usePageView, useTrackEvent } from "@/lib/analytics";

export default function ProductHubPage() {
  const { user, langDir } = useAuth();
  const locale = langDir === "rtl" ? "ar" : "en";
  const searchParams = useSearchParams();

  // Track page view
  usePageView();
  const trackEvent = useTrackEvent();

  // Read from URL: /product-hub?mode=search&q=headphones
  const urlMode = searchParams?.get("mode");
  const initialMode = urlMode === "search" ? "search" : "rfq";
  const searchQuery = searchParams?.get("q") ?? "";

  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedItemName, setSelectedItemName] = useState<string | null>(null);
  const [sessionsCollapsed, setSessionsCollapsed] = useState(false);
  const [cartCollapsed, setCartCollapsed] = useState(false);

  // ── Step 1: Fetch real RFQ sessions ──
  const rfqSessionsQuery = useAllRfqQuotesByBuyerId(
    { page: 1, limit: 50 },
    !!user?.id,
  );

  // Map API response to session format for Panel 1
  const rfqSessions = useMemo(() => {
    const data = rfqSessionsQuery?.data?.data ?? [];
    if (!Array.isArray(data)) return [];
    return data.map((q: any) => ({
      id: String(q.id),
      title: q.rfqQuotesProducts?.[0]?.rfqProductDetails?.productName
        ?? q.rfqQuotesProducts?.[0]?.productName
        ?? `RFQ #${q.id}`,
      itemCount: q.rfqQuotesProducts?.length ?? 0,
      date: q.createdAt ? new Date(q.createdAt).toLocaleDateString("en", { month: "short", day: "numeric" }) : "",
      status: (q.rfqQuotes_rfqQuotesUsers?.length ?? 0) > 0 ? "quoted" : "submitted",
      type: "rfq" as const,
      raw: q,
    }));
  }, [rfqSessionsQuery?.data]);

  // When search query comes from URL, auto-create a search session
  const hasInitialized = useRef(false);
  const [newSearchQuery, setNewSearchQuery] = useState<string | null>(null);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    if (searchQuery && initialMode === "search") {
      const newSessionId = `search-${Date.now()}`;
      setSelectedSessionId(newSessionId);
      setNewSearchQuery(searchQuery);
      setSelectedItemId("new-search-1");
      setSelectedItemName(searchQuery);
    }
  }, [searchQuery, initialMode]);

  // Auto-select first RFQ session when data loads (if no search mode)
  useEffect(() => {
    if (initialMode !== "search" && !selectedSessionId && rfqSessions.length > 0) {
      setSelectedSessionId(rfqSessions[0].id);
    }
  }, [rfqSessions, selectedSessionId, initialMode]);

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
        initialMode={initialMode}
        newSearchQuery={searchQuery || undefined}
        rfqSessions={rfqSessions}
        rfqLoading={rfqSessionsQuery.isLoading}
        onToggleCollapse={() => setSessionsCollapsed(!sessionsCollapsed)}
        onSelect={(id) => {
          setSelectedSessionId(id);
          setSelectedItemId(null);
          setSelectedItemName(null);
          trackEvent("rfq_session_selected", { sessionId: id });
        }}
        onNewSession={() => {
          setSelectedSessionId(null);
          setSelectedItemId(null);
          setSelectedItemName(null);
          setNewSearchQuery(null);
          trackEvent("rfq_new_session");
        }}
        onSessionRemoved={(id) => {
          if (id === selectedSessionId) {
            setSelectedSessionId(null);
            setSelectedItemId(null);
            setSelectedItemName(null);
            setNewSearchQuery(null);
          }
          trackEvent("rfq_session_removed", { sessionId: id });
        }}
        locale={locale}
      />

      <RequestListPanel
        selectedItemId={selectedSessionId ? selectedItemId : null}
        onSelectItem={(id, name) => {
          setSelectedItemId(id);
          setSelectedItemName(name ?? null);
          trackEvent("rfq_item_selected", { itemId: id, itemName: name });
        }}
        onItemRemoved={(id) => {
          if (id === selectedItemId) {
            setSelectedItemId(null);
            setSelectedItemName(null);
          }
          trackEvent("rfq_item_removed", { itemId: id });
        }}
        searchQuery={newSearchQuery ?? undefined}
        sessionId={selectedSessionId}
        locale={locale}
      />

      <ItemDetailPanel
        selectedItemId={selectedSessionId ? selectedItemId : null}
        searchTerm={selectedItemName ?? undefined}
        onAddToCart={(productId) => {
          trackEvent("rfq_add_to_cart", { productId });
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
