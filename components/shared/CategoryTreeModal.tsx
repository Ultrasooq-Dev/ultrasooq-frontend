"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useCategory } from "@/apis/queries/category.queries";
import { fetchCategory } from "@/apis/requests/category.requests";
import { BUSINESS_TYPE_CATEGORY_ID } from "@/utils/constants";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import {
  ChevronRight, ChevronDown, Search, X, Check, FolderTree, Loader2,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   CATEGORY TREE MODAL — Multi-level tree selector in a popup
   Used for Business Type selection in company-profile.
   Supports unlimited depth, lazy-loading children, search,
   multi-select with checkboxes, breadcrumb path display.
   ═══════════════════════════════════════════════════════════════ */

interface CategoryNode {
  id: number;
  name: string;
  children?: CategoryNode[];
  _loaded?: boolean;
}

interface CategoryTreeModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (selected: { categoryId: number; categoryLocation: string; name: string }[]) => void;
  initialSelected?: { categoryId: number; categoryLocation: string; name: string }[];
  rootCategoryId?: number;
  title?: string;
  multiSelect?: boolean;
}

// Recursive tree node component
function TreeNode({
  node, level, expanded, onToggle, checked, onCheck, onLoadChildren, loading,
}: {
  node: CategoryNode; level: number; expanded: Set<number>;
  onToggle: (id: number) => void; checked: Map<number, string>;
  onCheck: (node: CategoryNode, path: string) => void;
  onLoadChildren: (id: number) => void; loading: Set<number>;
}) {
  const isOpen = expanded.has(node.id);
  const hasKids = node.children && node.children.length > 0;
  const isLoading = loading.has(node.id);
  const isChecked = checked.has(node.id);

  const handleExpand = async () => {
    if (!node._loaded && !isLoading) {
      onLoadChildren(node.id);
    }
    onToggle(node.id);
  };

  // Build path from parents — simplified (we track in parent)
  const path = checked.get(node.id) || "";

  return (
    <>
      <div
        className={cn(
          "flex items-center gap-2 py-2 px-3 cursor-pointer transition-colors border-b border-gray-50",
          isChecked ? "bg-primary/5" : "hover:bg-muted/50",
        )}
        style={{ paddingInlineStart: `${level * 20 + 12}px` }}
      >
        {/* Expand arrow or spacer */}
        <button
          onClick={(e) => { e.stopPropagation(); handleExpand(); }}
          className={cn("w-5 h-5 flex items-center justify-center flex-shrink-0 rounded transition-colors",
            (hasKids || !node._loaded) ? "hover:bg-gray-200 text-gray-500" : "invisible")}
        >
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
          ) : isOpen ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
        </button>

        {/* Checkbox */}
        <button
          onClick={(e) => { e.stopPropagation(); onCheck(node, ""); }}
          className={cn("w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors",
            isChecked ? "bg-primary border-primary" : "border-border hover:border-primary")}
        >
          {isChecked && <Check className="h-3 w-3 text-white" />}
        </button>

        {/* Label */}
        <span
          onClick={() => { handleExpand(); }}
          className={cn("text-sm flex-1 min-w-0 truncate", isChecked ? "font-semibold text-foreground" : "text-foreground")}
        >
          {node.name}
        </span>

        {/* Child count */}
        {hasKids && (
          <span className="text-[10px] text-gray-400 flex-shrink-0">{node.children!.length}</span>
        )}
      </div>

      {/* Children */}
      {isOpen && hasKids && node.children!.map((child) => (
        <TreeNode
          key={child.id}
          node={child}
          level={level + 1}
          expanded={expanded}
          onToggle={onToggle}
          checked={checked}
          onCheck={onCheck}
          onLoadChildren={onLoadChildren}
          loading={loading}
        />
      ))}
    </>
  );
}

export default function CategoryTreeModal({
  open, onClose, onSelect, initialSelected = [], rootCategoryId, title, multiSelect = true,
}: CategoryTreeModalProps) {
  const t = useTranslations();
  const { langDir } = useAuth();
  const catId = rootCategoryId || BUSINESS_TYPE_CATEGORY_ID;

  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [checked, setChecked] = useState<Map<number, string>>(new Map());
  const [tree, setTree] = useState<CategoryNode[]>([]);
  const [loading, setLoading] = useState<Set<number>>(new Set());
  const [selectedNames, setSelectedNames] = useState<Map<number, string>>(new Map());

  // Fetch root category
  const rootQuery = useCategory(String(catId));

  // Build initial tree from root
  useEffect(() => {
    if (rootQuery.data?.data?.children) {
      const children = rootQuery.data.data.children.map((c: any) => ({
        id: c.id,
        name: c.name || c.categoryName_en || `Category ${c.id}`,
        children: c.children?.map((sc: any) => ({
          id: sc.id,
          name: sc.name || sc.categoryName_en || `Category ${sc.id}`,
          children: sc.children?.map((ssc: any) => ({
            id: ssc.id,
            name: ssc.name || ssc.categoryName_en || `Category ${ssc.id}`,
            _loaded: !(ssc.children?.length > 0),
            children: ssc.children || [],
          })) || [],
          _loaded: true,
        })) || [],
        _loaded: true,
      }));
      setTree(children);
    }
  }, [rootQuery.data?.data?.children]);

  // Restore initial selection
  useEffect(() => {
    if (initialSelected.length > 0) {
      const map = new Map<number, string>();
      const names = new Map<number, string>();
      initialSelected.forEach((s) => {
        map.set(s.categoryId, s.categoryLocation || "");
        names.set(s.categoryId, s.name || "");
      });
      setChecked(map);
      setSelectedNames(names);
    }
  }, []);

  // Load children for a node
  const handleLoadChildren = useCallback(async (nodeId: number) => {
    setLoading((prev) => new Set(prev).add(nodeId));
    try {
      const response = await fetchCategory({ categoryId: String(nodeId) });
      const children = response?.data?.data?.children || [];
      const childNodes: CategoryNode[] = children.map((c: any) => ({
        id: c.id,
        name: c.name || c.categoryName_en || `Category ${c.id}`,
        children: c.children || [],
        _loaded: !(c.children?.length > 0),
      }));

      // Update tree recursively
      const updateTree = (nodes: CategoryNode[]): CategoryNode[] =>
        nodes.map((n) => {
          if (n.id === nodeId) return { ...n, children: childNodes, _loaded: true };
          if (n.children) return { ...n, children: updateTree(n.children) };
          return n;
        });

      setTree((prev) => updateTree(prev));
    } catch {}
    setLoading((prev) => { const s = new Set(prev); s.delete(nodeId); return s; });
  }, []);

  const handleToggle = (id: number) => {
    setExpanded((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id); else s.add(id);
      return s;
    });
  };

  const handleCheck = (node: CategoryNode, path: string) => {
    setChecked((prev) => {
      const map = new Map(prev);
      if (map.has(node.id)) {
        map.delete(node.id);
        setSelectedNames((n) => { const m = new Map(n); m.delete(node.id); return m; });
      } else {
        if (!multiSelect) map.clear();
        map.set(node.id, String(node.id));
        setSelectedNames((n) => { const m = new Map(n); if (!multiSelect) m.clear(); m.set(node.id, node.name); return m; });
      }
      return map;
    });
  };

  const handleConfirm = () => {
    const selected = Array.from(checked.entries()).map(([id, loc]) => ({
      categoryId: id,
      categoryLocation: loc,
      name: selectedNames.get(id) || "",
    }));
    onSelect(selected);
    onClose();
  };

  // Filter tree by search
  const filteredTree = useMemo(() => {
    if (!search.trim()) return tree;
    const term = search.toLowerCase();
    const filterNodes = (nodes: CategoryNode[]): CategoryNode[] =>
      nodes.reduce<CategoryNode[]>((acc, n) => {
        const nameMatch = n.name.toLowerCase().includes(term);
        const filteredChildren = n.children ? filterNodes(n.children) : [];
        if (nameMatch || filteredChildren.length > 0) {
          acc.push({ ...n, children: nameMatch ? n.children : filteredChildren });
        }
        return acc;
      }, []);
    return filterNodes(tree);
  }, [tree, search]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-xl mx-4 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-[#2d2017] to-[#4a3728] px-5 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2 text-white">
            <FolderTree className="h-5 w-5" />
            <span className="text-base font-bold">{title || t("business_type") || "Business Type"}</span>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X className="h-5 w-5" /></button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search categories..."
              className="w-full ps-9 pe-4 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        </div>

        {/* Selected chips */}
        {checked.size > 0 && (
          <div className="px-4 py-2 border-b border-gray-100 flex flex-wrap gap-1.5 flex-shrink-0">
            {Array.from(selectedNames.entries()).map(([id, name]) => (
              <span key={id} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/10 text-xs font-medium text-primary">
                {name}
                <button onClick={() => handleCheck({ id, name, _loaded: true }, "")} className="hover:text-red-600">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Tree */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {rootQuery.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filteredTree.length === 0 ? (
            <div className="text-center py-12 text-sm text-gray-400">No categories found</div>
          ) : (
            filteredTree.map((node) => (
              <TreeNode
                key={node.id}
                node={node}
                level={0}
                expanded={expanded}
                onToggle={handleToggle}
                checked={checked}
                onCheck={handleCheck}
                onLoadChildren={handleLoadChildren}
                loading={loading}
              />
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between flex-shrink-0">
          <span className="text-xs text-gray-500">{checked.size} selected</span>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-medium text-gray-500 hover:bg-muted/50">
              Cancel
            </button>
            <button onClick={handleConfirm}
              className="px-5 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors">
              Confirm ({checked.size})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
