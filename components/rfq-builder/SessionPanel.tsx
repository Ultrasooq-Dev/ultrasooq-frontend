"use client";
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Plus, FileText, Search, ChevronLeft, ChevronRight, Star, Archive, Trash2, MoreHorizontal } from "lucide-react";

interface Session {
  id: string;
  title: string;
  itemCount: number;
  date: string;
  status: "draft" | "submitted" | "quoted";
  type: "rfq" | "search";
  favorite?: boolean;
  archived?: boolean;
}

// No more mock sessions — real data comes from rfqSessions prop

interface RfqSession {
  id: string;
  title: string;
  itemCount: number;
  date: string;
  status: string;
  type: "rfq" | "search";
  raw?: any;
}

interface SessionPanelProps {
  selectedId: string | null;
  collapsed: boolean;
  initialMode?: "rfq" | "search";
  newSearchQuery?: string;
  rfqSessions?: RfqSession[];
  rfqLoading?: boolean;
  externalSessions?: Array<{ id: string; title: string }>;
  onToggleCollapse: () => void;
  onSelect: (id: string) => void;
  onNewSession: () => void;
  onSessionRemoved?: (id: string) => void;
  locale: string;
}

export default function SessionPanel({ selectedId, collapsed, initialMode = "rfq", newSearchQuery, rfqSessions = [], rfqLoading, externalSessions = [], onToggleCollapse, onSelect, onNewSession, onSessionRemoved, locale }: SessionPanelProps) {
  const isAr = locale === "ar";
  const [searchSessions, setSearchSessions] = useState<Session[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem("rfq_local_sessions");
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });

  // Persist local sessions to localStorage
  React.useEffect(() => {
    try { localStorage.setItem("rfq_local_sessions", JSON.stringify(searchSessions)); } catch {}
  }, [searchSessions]);
  const [tab, setTab] = useState<"rfq" | "search">(initialMode);
  const searchCreated = React.useRef(false);

  // Auto-create search session when query comes from URL
  React.useEffect(() => {
    if (newSearchQuery && !searchCreated.current) {
      searchCreated.current = true;
      const newId = `search-${Date.now()}`;
      setSearchSessions((prev) => [{
        id: newId,
        title: newSearchQuery,
        itemCount: 1,
        date: isAr ? "الآن" : "Now",
        status: "draft" as const,
        type: "search" as const,
      }, ...prev]);
      setTab("search");
      onSelect(newId);
    }
  }, [newSearchQuery]);

  // Combine real RFQ sessions + local search sessions
  // Merge: real RFQ sessions + local search sessions + auto-created sessions from Panel 2
  const externalAsSessions: Session[] = externalSessions
    .filter((e) => !searchSessions.some((s) => s.id === e.id) && !rfqSessions.some((s) => String(s.id) === e.id))
    .map((e) => ({ id: e.id, title: e.title, itemCount: 0, date: isAr ? "الآن" : "Now", status: "draft" as const, type: "rfq" as const }));
  const allSessions: Session[] = [
    ...rfqSessions.map((s) => ({ ...s, status: s.status as Session["status"] })),
    ...searchSessions,
    ...externalAsSessions,
  ];
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const statusColor: Record<string, string> = { draft: "text-amber-600", submitted: "text-blue-600", quoted: "text-green-600" };
  const statusDot: Record<string, string> = { draft: "bg-amber-500", submitted: "bg-blue-500", quoted: "bg-green-500" };
  const statusLabel: Record<string, string> = { draft: isAr ? "مسودة" : "Draft", submitted: isAr ? "مرسل" : "Sent", quoted: isAr ? "تم" : "Quoted" };

  const [hiddenIds, setHiddenIds] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const stored = localStorage.getItem("rfq_hidden_sessions");
      return new Set(stored ? JSON.parse(stored) : []);
    } catch { return new Set(); }
  });

  const filtered = allSessions.filter((s) => s.type === tab && !s.archived && !hiddenIds.has(s.id));
  const archived = allSessions.filter((s) => s.type === tab && (s.archived || hiddenIds.has(s.id)));

  const toggleFav = (id: string) => {
    setSearchSessions((p) => p.map((s) => s.id === id ? { ...s, favorite: !s.favorite } : s));
    setMenuOpenId(null);
  };
  const toggleArchive = (id: string) => {
    setSearchSessions((p) => p.map((s) => s.id === id ? { ...s, archived: !s.archived } : s));
    setMenuOpenId(null);
    onSessionRemoved?.(id);
  };
  const deleteSession = (id: string) => {
    // Soft delete: hide the session (works for ALL session sources)
    setHiddenIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      try { localStorage.setItem("rfq_hidden_sessions", JSON.stringify([...next])); } catch {}
      return next;
    });
    // Also archive in local sessions if it exists there
    setSearchSessions((p) => p.map((s) => s.id === id ? { ...s, archived: true } : s));
    setMenuOpenId(null);
    if (id === selectedId) {
      onSessionRemoved?.(id);
    }
  };

  // Sort: favorites first, then by date
  const sorted = [...filtered].sort((a, b) => (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0));

  // ═══ COLLAPSED ═══
  if (collapsed) {
    return (
      <div className="flex flex-col h-full min-h-0 bg-muted/40 border-e border-border items-center py-2 gap-1">
        <button type="button" onClick={onToggleCollapse}
          className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:text-foreground">
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
        <button type="button" onClick={() => {
          const newId = `rfq-${Date.now()}`;
          setSearchSessions((prev) => [{ id: newId, title: "New RFQ", itemCount: 0, date: "Now", status: "draft" as const, type: "rfq" as const }, ...prev]);
          onSelect(newId);
        }} title={isAr ? "جديد" : "New"}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="h-3.5 w-3.5" />
        </button>
        <div className="w-6 h-px bg-border my-0.5" />
        <div className="flex-1 overflow-y-auto flex flex-col items-center gap-0.5">
          {allSessions.filter((s) => !s.archived).map((s) => (
            <button key={s.id} type="button" onClick={() => onSelect(s.id)} title={s.title}
              className={cn("relative flex h-7 w-7 items-center justify-center rounded transition-colors",
                s.id === selectedId ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted")}>
              {s.type === "search" ? <Search className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
              {s.favorite && <Star className="absolute -top-0.5 -end-0.5 h-2 w-2 fill-amber-400 text-amber-400" />}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ═══ EXPANDED ═══
  return (
    <div className="flex flex-col h-full min-h-0 bg-muted/40 border-e border-border">
      {/* Tab switch: RFQ | Search */}
      <div className="flex border-b border-border shrink-0">
        <button type="button" onClick={() => setTab("rfq")}
          className={cn("flex-1 flex items-center justify-center gap-1 py-2 text-[10px] font-semibold border-b-2 transition-colors",
            tab === "rfq" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}>
          <FileText className="h-3 w-3" /> RFQ
        </button>
        <button type="button" onClick={() => setTab("search")}
          className={cn("flex-1 flex items-center justify-center gap-1 py-2 text-[10px] font-semibold border-b-2 transition-colors",
            tab === "search" ? "border-blue-600 text-blue-600" : "border-transparent text-muted-foreground hover:text-foreground")}>
          <Search className="h-3 w-3" /> {isAr ? "بحث" : "Search"}
        </button>
        <button type="button" onClick={onToggleCollapse}
          className="flex items-center justify-center w-8 text-muted-foreground hover:text-foreground border-s border-border shrink-0">
          <ChevronLeft className="h-3 w-3" />
        </button>
      </div>

      {/* New button */}
      <div className="px-2 py-1.5 border-b border-border shrink-0">
        <button type="button" onClick={() => {
          const newId = `${tab}-${Date.now()}`;
          const newSession: Session = {
            id: newId,
            title: tab === "rfq"
              ? (isAr ? `طلب أسعار جديد` : `New RFQ`)
              : (isAr ? `بحث جديد` : `New Search`),
            itemCount: 0,
            date: isAr ? "الآن" : "Now",
            status: "draft",
            type: tab,
          };
          setSearchSessions((prev) => [newSession, ...prev]);
          onSelect(newId);
        }}
          className={cn("flex w-full items-center justify-center gap-1.5 rounded-md py-1.5 text-[10px] font-semibold transition-colors",
            tab === "rfq" ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-blue-600 text-white hover:bg-blue-700")}>
          <Plus className="h-3 w-3" />
          {tab === "rfq" ? (isAr ? "طلب أسعار جديد" : "New RFQ") : (isAr ? "بحث جديد" : "New Search")}
        </button>
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto">
        {rfqLoading && tab === "rfq" && (
          <div className="flex items-center justify-center py-6">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-primary" />
          </div>
        )}
        {!rfqLoading && sorted.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <FileText className="h-6 w-6 mb-1.5 opacity-20" />
            <p className="text-[10px]">{tab === "rfq" ? (isAr ? "لا توجد طلبات" : "No RFQ sessions") : (isAr ? "لا يوجد بحث" : "No searches yet")}</p>
          </div>
        )}
        {sorted.map((s) => (
          <div key={s.id} className={cn(
            "group flex items-center gap-1.5 px-2 py-2 border-b border-border/30 transition-colors cursor-pointer",
            s.id === selectedId ? "bg-primary/5 border-e-2 border-e-primary" : "hover:bg-muted/50"
          )} onClick={() => onSelect(s.id)}>
            {/* Fav star or status dot */}
            <div className="w-3 shrink-0 flex justify-center">
              {s.favorite
                ? <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                : <div className={cn("h-1.5 w-1.5 rounded-full", statusDot[s.status])} />}
            </div>

            {/* Title + meta */}
            <div className="flex-1 min-w-0">
              <span className={cn("text-[11px] block truncate", s.id === selectedId ? "font-bold text-primary" : "font-medium")}>{s.title}</span>
              <div className="flex items-center gap-1 text-[8px] text-muted-foreground">
                <span>{s.itemCount} {isAr ? "عنصر" : "items"}</span>
                <span>·</span>
                <span>{s.date}</span>
                <span>·</span>
                <span className={statusColor[s.status]}>{statusLabel[s.status]}</span>
              </div>
            </div>

            {/* Menu */}
            <div className="relative shrink-0">
              <button type="button"
                onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === s.id ? null : s.id); }}
                className="h-5 w-5 flex items-center justify-center rounded text-muted-foreground/40 hover:text-foreground hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-3 w-3" />
              </button>
              {menuOpenId === s.id && (
                <div className="absolute end-0 top-6 z-10 w-24 rounded-md border border-border bg-background shadow-lg py-0.5" onClick={(e) => e.stopPropagation()}>
                  <button type="button" onClick={(e) => { e.stopPropagation(); toggleFav(s.id); }}
                    className="flex w-full items-center gap-1.5 px-2 py-1 text-[9px] hover:bg-muted text-start">
                    <Star className={cn("h-2.5 w-2.5", s.favorite ? "fill-amber-400 text-amber-400" : "")} />
                    {s.favorite ? (isAr ? "إزالة" : "Unfav") : (isAr ? "مفضلة" : "Fav")}
                  </button>
                  <button type="button" onClick={(e) => { e.stopPropagation(); toggleArchive(s.id); }}
                    className="flex w-full items-center gap-1.5 px-2 py-1 text-[9px] hover:bg-muted text-start">
                    <Archive className="h-2.5 w-2.5" /> {isAr ? "أرشفة" : "Archive"}
                  </button>
                  <button type="button" onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }}
                    className="flex w-full items-center gap-1.5 px-2 py-1 text-[9px] text-destructive hover:bg-destructive/5 text-start">
                    <Trash2 className="h-2.5 w-2.5" /> {isAr ? "حذف" : "Delete"}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Archived toggle */}
        {archived.length > 0 && (
          <>
            <button type="button" onClick={() => setShowArchived(!showArchived)}
              className="flex items-center gap-1 w-full px-2 py-1.5 text-[8px] text-muted-foreground/50 hover:text-muted-foreground">
              <Archive className="h-2.5 w-2.5" />
              {isAr ? "الأرشيف" : "Archived"} ({archived.length})
            </button>
            {showArchived && archived.map((s) => (
              <div key={s.id} className="flex items-center gap-1.5 px-2 py-1.5 border-b border-border/20 opacity-50 hover:opacity-80 cursor-pointer" onClick={() => onSelect(s.id)}>
                <div className="w-3 shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] truncate block">{s.title}</span>
                  <span className="text-[8px] text-muted-foreground">{s.date}</span>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
