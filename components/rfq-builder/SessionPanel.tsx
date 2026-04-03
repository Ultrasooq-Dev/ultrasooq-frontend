"use client";
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Plus, FileText, ChevronLeft, ChevronRight, ChevronDown, Star, Archive, Trash2, MoreHorizontal } from "lucide-react";

interface Session {
  id: string;
  title: string;
  itemCount: number;
  date: string;
  status: "draft" | "submitted" | "quoted";
  favorite?: boolean;
  archived?: boolean;
}

const MOCK_SESSIONS: Session[] = [
  { id: "1", title: "Office Electronics", itemCount: 5, date: "Today", status: "draft", favorite: true },
  { id: "2", title: "Warehouse Supplies", itemCount: 12, date: "Mar 28", status: "submitted" },
  { id: "3", title: "IT Equipment Q2", itemCount: 8, date: "Mar 25", status: "quoted", favorite: true },
  { id: "4", title: "Cleaning Products", itemCount: 3, date: "Mar 20", status: "submitted" },
  { id: "5", title: "Safety Equipment", itemCount: 6, date: "Mar 15", status: "quoted" },
  { id: "6", title: "Kitchen Appliances", itemCount: 4, date: "Mar 10", status: "submitted" },
  { id: "7", title: "Server Room Hardware", itemCount: 15, date: "Mar 5", status: "quoted" },
  { id: "8", title: "Furniture Order", itemCount: 9, date: "Feb 28", status: "submitted" },
  { id: "9", title: "Printing Supplies", itemCount: 7, date: "Feb 20", status: "draft" },
  { id: "10", title: "Security Cameras", itemCount: 11, date: "Feb 15", status: "quoted", archived: true },
  { id: "11", title: "Networking Gear", itemCount: 6, date: "Feb 10", status: "submitted", archived: true },
  { id: "12", title: "Medical Supplies", itemCount: 20, date: "Feb 5", status: "quoted", archived: true },
];

interface SessionPanelProps {
  selectedId: string | null;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onSelect: (id: string) => void;
  onNewSession: () => void;
  locale: string;
}

export default function SessionPanel({ selectedId, collapsed, onToggleCollapse, onSelect, onNewSession, locale }: SessionPanelProps) {
  const isAr = locale === "ar";
  const [sessions, setSessions] = useState(MOCK_SESSIONS);
  const [favOpen, setFavOpen] = useState(true);
  const [archOpen, setArchOpen] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const statusColor = {
    draft: "bg-amber-500/10 text-amber-600",
    submitted: "bg-blue-500/10 text-blue-600",
    quoted: "bg-green-500/10 text-green-600",
  };
  const statusDot = { draft: "bg-amber-500", submitted: "bg-blue-500", quoted: "bg-green-500" };

  const favorites = sessions.filter((s) => s.favorite && !s.archived);
  const archived = sessions.filter((s) => s.archived);
  const active = sessions.filter((s) => !s.favorite && !s.archived);

  const toggleFav = (id: string) => {
    setSessions((p) => p.map((s) => s.id === id ? { ...s, favorite: !s.favorite } : s));
    setMenuOpenId(null);
  };
  const toggleArchive = (id: string) => {
    setSessions((p) => p.map((s) => s.id === id ? { ...s, archived: !s.archived } : s));
    setMenuOpenId(null);
  };
  const deleteSession = (id: string) => {
    setSessions((p) => p.filter((s) => s.id !== id));
    setMenuOpenId(null);
  };

  // ═══ COLLAPSED ═══
  if (collapsed) {
    return (
      <div className="flex flex-col h-full min-h-0 bg-muted/40 border-e border-border items-center">
        <button type="button" onClick={onToggleCollapse}
          className="w-full py-2 flex justify-center text-muted-foreground hover:text-foreground border-b border-border">
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
        <button type="button" onClick={onNewSession} title={isAr ? "طلب جديد" : "New RFQ"}
          className="my-1.5 flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="h-3.5 w-3.5" />
        </button>
        <div className="flex-1 overflow-y-auto flex flex-col items-center gap-0.5 py-1">
          {sessions.filter((s) => !s.archived).map((s) => (
            <button key={s.id} type="button" onClick={() => onSelect(s.id)} title={s.title}
              className={cn("relative flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                s.id === selectedId ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted")}>
              <FileText className="h-3.5 w-3.5" />
              {s.favorite && <Star className="absolute top-0.5 end-0.5 h-2 w-2 fill-amber-400 text-amber-400" />}
              <div className={cn("absolute bottom-0.5 end-1 h-1.5 w-1.5 rounded-full", statusDot[s.status])} />
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ═══ Session item renderer ═══
  const renderSession = (s: Session) => (
    <div key={s.id} className={cn(
      "group relative flex w-full items-start gap-2 px-2 py-2 text-start border-b border-border/50 transition-colors",
      s.id === selectedId ? "bg-primary/5 border-e-2 border-e-primary" : "hover:bg-muted/50"
    )}>
      <button type="button" onClick={() => onSelect(s.id)} className="flex items-start gap-2 flex-1 min-w-0">
        <FileText className={cn("h-3.5 w-3.5 shrink-0 mt-0.5", s.id === selectedId ? "text-primary" : "text-muted-foreground/50")} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            {s.favorite && <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400 shrink-0" />}
            <span className={cn("text-[11px] truncate", s.id === selectedId ? "font-bold text-primary" : "font-semibold")}>
              {s.title}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground mt-0.5">
            <span>{s.itemCount} {isAr ? "عنصر" : "items"}</span>
            <span>·</span>
            <span>{s.date}</span>
          </div>
        </div>
      </button>

      {/* Status + menu */}
      <div className="flex items-center gap-0.5 shrink-0 mt-0.5">
        <span className={cn("text-[7px] px-1 py-0.5 rounded-full font-medium", statusColor[s.status])}>
          {s.status === "draft" ? (isAr ? "مسودة" : "Draft") : s.status === "submitted" ? (isAr ? "مرسل" : "Sent") : (isAr ? "تم" : "Quoted")}
        </span>

        {/* 3-dot menu */}
        <div className="relative">
          <button type="button" onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === s.id ? null : s.id); }}
            className="h-5 w-5 flex items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground">
            <MoreHorizontal className="h-3 w-3" />
          </button>

          {menuOpenId === s.id && (
            <div className="absolute end-0 top-6 z-10 w-28 rounded-md border border-border bg-background shadow-lg py-1" onClick={(e) => e.stopPropagation()}>
              <button type="button" onClick={(e) => { e.stopPropagation(); toggleFav(s.id); }}
                className="flex w-full items-center gap-1.5 px-2 py-1.5 text-[10px] hover:bg-muted text-start">
                <Star className={cn("h-3 w-3", s.favorite ? "fill-amber-400 text-amber-400" : "")} />
                {s.favorite ? (isAr ? "إزالة" : "Unfavorite") : (isAr ? "مفضلة" : "Favorite")}
              </button>
              <button type="button" onClick={(e) => { e.stopPropagation(); toggleArchive(s.id); }}
                className="flex w-full items-center gap-1.5 px-2 py-1.5 text-[10px] hover:bg-muted text-start">
                <Archive className="h-3 w-3" />
                {s.archived ? (isAr ? "استعادة" : "Unarchive") : (isAr ? "أرشفة" : "Archive")}
              </button>
              <button type="button" onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }}
                className="flex w-full items-center gap-1.5 px-2 py-1.5 text-[10px] text-destructive hover:bg-destructive/5 text-start">
                <Trash2 className="h-3 w-3" />
                {isAr ? "حذف" : "Delete"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // ═══ EXPANDED ═══
  return (
    <div className="flex flex-col h-full min-h-0 bg-muted/40 border-e border-border">
      {/* Header */}
      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-border shrink-0">
        <button type="button" onClick={onNewSession}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-md bg-primary py-1.5 text-primary-foreground text-[10px] font-semibold hover:bg-primary/90">
          <Plus className="h-3 w-3" /> {isAr ? "طلب جديد" : "New RFQ"}
        </button>
        <button type="button" onClick={onToggleCollapse}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted shrink-0">
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto">
        {/* ★ Favorites */}
        {favorites.length > 0 && (
          <div>
            <button type="button" onClick={() => setFavOpen(!favOpen)}
              className="flex items-center gap-1 w-full px-2 py-1.5 text-[9px] font-bold uppercase tracking-wider text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/10">
              <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
              {isAr ? "المفضلة" : "Favorites"} ({favorites.length})
              <ChevronDown className={cn("h-2.5 w-2.5 ms-auto transition-transform", !favOpen && "-rotate-90")} />
            </button>
            {favOpen && favorites.map(renderSession)}
          </div>
        )}

        {/* Active sessions */}
        {active.map(renderSession)}

        {/* 📦 Archived */}
        {archived.length > 0 && (
          <div>
            <button type="button" onClick={() => setArchOpen(!archOpen)}
              className="flex items-center gap-1 w-full px-2 py-1.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground hover:bg-muted/50 border-t border-border">
              <Archive className="h-2.5 w-2.5" />
              {isAr ? "الأرشيف" : "Archived"} ({archived.length})
              <ChevronDown className={cn("h-2.5 w-2.5 ms-auto transition-transform", !archOpen && "-rotate-90")} />
            </button>
            {archOpen && archived.map(renderSession)}
          </div>
        )}
      </div>
    </div>
  );
}
