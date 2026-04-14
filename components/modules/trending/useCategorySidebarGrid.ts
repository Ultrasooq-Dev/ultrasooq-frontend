"use client";
import { useState, useRef } from "react";
import { CategoryWithSubcategories } from "./categorySidebarTypes";
import { fetchCategoryChildren, hasSubcategoryChildren } from "./categorySidebarUtils";

export function useCategorySidebarGrid(
  categoriesWithSubcategories: CategoryWithSubcategories[],
) {
  const [subcategoriesForGrid, setSubcategoriesForGrid] = useState<any[]>([]);
  const [gridLoading, setGridLoading] = useState(false);
  const [hoveredLevel2Id, setHoveredLevel2Id] = useState<number | null>(null);
  const [level3Categories, setLevel3Categories] = useState<any[]>([]);
  const [level3Loading, setLevel3Loading] = useState(false);

  const gridCacheRef = useRef<Map<number, any[]>>(new Map());
  const level3CacheRef = useRef<Map<number, any[]>>(new Map());

  // ── Pre-load grid for a given main category ID ───────────────────────────
  const loadGridForCategory = async (categoryId: number) => {
    if (gridCacheRef.current.has(categoryId)) {
      setSubcategoriesForGrid(gridCacheRef.current.get(categoryId) || []);
      return;
    }
    setGridLoading(true);
    const mainCat = categoriesWithSubcategories.find((c) => c.category.id === categoryId);
    const level1WithChildren = await Promise.all(
      (mainCat?.subcategories || []).map(async (sub: any) => {
        if (hasSubcategoryChildren(sub)) {
          try { return { ...sub, children: await fetchCategoryChildren(sub.id, sub._originalChildren) }; }
          catch { return sub; }
        }
        return sub;
      }),
    );
    gridCacheRef.current.set(categoryId, level1WithChildren);
    setSubcategoriesForGrid(level1WithChildren);
    setGridLoading(false);
  };

  // ── handleMainCategoryHover ──────────────────────────────────────────────
  const handleMainCategoryHover = async (categoryId: number) => {
    if (typeof window === "undefined" || window.innerWidth < 768) return;
    await loadGridForCategory(categoryId);
    setHoveredLevel2Id(null);
    setLevel3Categories([]);
  };

  // ── handleLevel2Hover ────────────────────────────────────────────────────
  const handleLevel2Hover = async (subcategory: any) => {
    setHoveredLevel2Id(subcategory.id);
    if (!hasSubcategoryChildren(subcategory)) { setLevel3Categories([]); return; }
    if (level3CacheRef.current.has(subcategory.id)) {
      setLevel3Categories(level3CacheRef.current.get(subcategory.id) || []);
      return;
    }
    setLevel3Loading(true);
    try {
      const children = await fetchCategoryChildren(subcategory.id, subcategory._originalChildren);
      const withLevel4 = await Promise.all(
        children.map(async (child: any) => {
          if (hasSubcategoryChildren(child)) {
            try { return { ...child, children: await fetchCategoryChildren(child.id, child._originalChildren) }; }
            catch { return child; }
          }
          return child;
        }),
      );
      level3CacheRef.current.set(subcategory.id, withLevel4);
      setLevel3Categories(withLevel4);
    } catch { setLevel3Categories([]); }
    setLevel3Loading(false);
  };

  const resetGridState = () => {
    setHoveredLevel2Id(null);
    setLevel3Categories([]);
  };

  return {
    subcategoriesForGrid,
    setSubcategoriesForGrid,
    gridLoading,
    hoveredLevel2Id,
    level3Categories,
    level3Loading,
    gridCacheRef,
    loadGridForCategory,
    handleMainCategoryHover,
    handleLevel2Hover,
    resetGridState,
  };
}
