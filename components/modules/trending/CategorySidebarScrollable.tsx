"use client";
import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useDynamicTranslation } from "@/hooks/useDynamicTranslation";

// ─── ScrollableMainColumn ───────────────────────────────────────────────────

export const ScrollableMainColumn: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const columnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const column = columnRef.current;
    if (!column) return;

    const handleScroll = () => {
      setIsScrolling(true);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => setIsScrolling(false), 1000);
    };

    column.addEventListener("scroll", handleScroll);
    return () => {
      column.removeEventListener("scroll", handleScroll);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  return (
    <div
      ref={columnRef}
      className={cn(
        "flex-shrink-0 h-full overflow-y-auto bg-muted border-r border-border custom-scrollbar",
        "w-[180px] sm:w-[200px] md:w-[240px]",
        isScrolling && "scrolling",
      )}
      style={{ scrollbarWidth: "thin", scrollbarColor: "transparent transparent" }}
      onWheel={(e) => {
        const element = columnRef.current;
        if (element) {
          const { scrollTop, scrollHeight, clientHeight } = element;
          const canScrollUp = scrollTop > 0;
          const canScrollDown = scrollTop < scrollHeight - clientHeight - 1;
          if ((e.deltaY < 0 && !canScrollUp) || (e.deltaY > 0 && !canScrollDown)) {
            e.preventDefault();
          }
          e.stopPropagation();
        }
      }}
    >
      {children}
    </div>
  );
};

// ─── ScrollableHorizontalContainer ─────────────────────────────────────────

export const ScrollableHorizontalContainer: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setIsScrolling(true);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => setIsScrolling(false), 1000);
    };

    container.addEventListener("scroll", handleScroll);
    return () => {
      container.removeEventListener("scroll", handleScroll);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex-1 flex overflow-x-auto min-w-0 h-full custom-scrollbar",
        isScrolling && "scrolling",
      )}
      style={{ scrollbarWidth: "thin", scrollbarColor: "transparent transparent" }}
    >
      {children}
    </div>
  );
};

// ─── ScrollableColumn ───────────────────────────────────────────────────────

interface ScrollableColumnProps {
  level: number;
  title: string;
  categories: any[];
  selectedId: number | null;
  onCategoryHover: (categoryId: number, category: any) => void;
  onCategoryClick: (categoryId: number) => void;
}

export const ScrollableColumn: React.FC<ScrollableColumnProps> = ({
  level,
  title,
  categories,
  selectedId,
  onCategoryHover,
  onCategoryClick,
}) => {
  const { translate } = useDynamicTranslation();
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const columnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const column = columnRef.current;
    if (!column) return;

    const handleScroll = () => {
      setIsScrolling(true);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => setIsScrolling(false), 1000);
    };

    column.addEventListener("scroll", handleScroll);
    return () => {
      column.removeEventListener("scroll", handleScroll);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  return (
    <div
      ref={columnRef}
      className={cn(
        "flex-shrink-0 h-full overflow-y-auto border-r border-border bg-card custom-scrollbar",
        "w-[180px] sm:w-[200px] md:w-[240px]",
        isScrolling && "scrolling",
      )}
      style={{ scrollbarWidth: "thin", scrollbarColor: "transparent transparent" }}
      onWheel={(e) => {
        const element = columnRef.current;
        if (element) {
          const { scrollTop, scrollHeight, clientHeight } = element;
          const canScrollUp = scrollTop > 0;
          const canScrollDown = scrollTop < scrollHeight - clientHeight - 1;
          if ((e.deltaY < 0 && !canScrollUp) || (e.deltaY > 0 && !canScrollDown)) {
            e.preventDefault();
          }
          e.stopPropagation();
        }
      }}
    >
      <div className="p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3 sticky top-0 bg-card pb-2 border-b border-border z-10 -mx-4 -mt-4 px-4 pt-4">
          {translate(title)}
        </h3>
        <div className="space-y-1">
          {categories.map((item: any) => {
            const isSelected = selectedId === item.id;
            const hasChildren =
              (item.children && Array.isArray(item.children) && item.children.length > 0) ||
              item.hasChildren ||
              (item._originalChildren && Array.isArray(item._originalChildren) && item._originalChildren.length > 0);

            return (
              <div
                key={item.id}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                  hasChildren ? "cursor-default" : "cursor-pointer",
                  isSelected
                    ? "bg-primary/5 text-primary font-medium border border-primary/20"
                    : "hover:bg-muted text-muted-foreground",
                )}
                onMouseEnter={(e) => {
                  if (window.innerWidth >= 768 && hasChildren) {
                    const timeoutId = setTimeout(() => onCategoryHover(item.id, item), 200);
                    (e.currentTarget as any)._hoverTimeout = timeoutId;
                  }
                }}
                onMouseLeave={(e) => {
                  if (window.innerWidth >= 768) {
                    const target = e.currentTarget as any;
                    if (target._hoverTimeout) {
                      clearTimeout(target._hoverTimeout);
                      target._hoverTimeout = null;
                    }
                  }
                }}
                onClick={() => {
                  if (hasChildren) {
                    if (window.innerWidth < 768) onCategoryHover(item.id, item);
                  } else {
                    onCategoryClick(item.id);
                  }
                }}
                onWheel={(e) => {
                  const target = e.currentTarget as any;
                  if (target._hoverTimeout) {
                    clearTimeout(target._hoverTimeout);
                    target._hoverTimeout = null;
                  }
                }}
              >
                {item.icon ? (
                  <img src={item.icon} alt={item.name} height={20} width={20} className="object-contain flex-shrink-0" />
                ) : (
                  <div className="h-5 w-5 flex-shrink-0 rounded bg-muted" />
                )}
                <span className="text-sm flex-1 text-left line-clamp-1">{translate(item.name)}</span>
                {hasChildren && (
                  <svg className="w-4 h-4 text-muted-foreground flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
