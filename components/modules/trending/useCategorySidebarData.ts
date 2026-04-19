"use client";
import { useState, useMemo, useEffect, useRef } from "react";
import { useCategory } from "@/apis/queries/category.queries";
import { PRODUCT_CATEGORY_ID } from "@/utils/constants";
import { useTranslations } from "next-intl";
import { useDynamicTranslation } from "@/hooks/useDynamicTranslation";
import { useRouter } from "next/navigation";
import { CategoryWithSubcategories } from "./categorySidebarTypes";
import { fetchCategoryWithChildren, fetchCategoryChildren, hasSubcategoryChildren } from "./categorySidebarUtils";

export function useCategorySidebarData(
  isOpen: boolean,
  onClose: () => void,
  onCategorySelect?: (id: number) => void,
) {
  const t = useTranslations();
  const { translate } = useDynamicTranslation();
  const router = useRouter();

  const [selectedMainCategory, setSelectedMainCategory] = useState<number | null>(null);
  const [headerHeight, setHeaderHeight] = useState(133);
  const [isHovered, setIsHovered] = useState(false);
  const [hasBeenShown, setHasBeenShown] = useState(false);
  const [categoriesWithSubcategories, setCategoriesWithSubcategories] = useState<CategoryWithSubcategories[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<(number | null)[]>([null, null, null, null, null, null]);
  const [loadedChildren, setLoadedChildren] = useState<Map<string, any[]>>(new Map());

  // ── Header height ────────────────────────────────────────────────────────
  useEffect(() => {
    const calculate = () => {
      const header = document.querySelector("header");
      if (header) setHeaderHeight(header.offsetHeight);
      else if (window.innerWidth >= 1024) setHeaderHeight(146);
      else if (window.innerWidth >= 768) setHeaderHeight(133);
      else setHeaderHeight(116);
    };
    calculate();
    window.addEventListener("resize", calculate);
    return () => window.removeEventListener("resize", calculate);
  }, []);

  // ── Main categories ──────────────────────────────────────────────────────
  const mainCategoriesQuery = useCategory(PRODUCT_CATEGORY_ID.toString());
  const mainCategories = useMemo(
    () => mainCategoriesQuery?.data?.data?.children || [],
    [mainCategoriesQuery?.data?.data],
  );

  const categoriesWithSubcategoriesFiltered = useMemo(
    () => categoriesWithSubcategories.filter(({ subcategories }) => subcategories.length > 0),
    [categoriesWithSubcategories],
  );

  // ── Fetch all subcategories ──────────────────────────────────────────────
  useEffect(() => {
    const fetchAll = async () => {
      if (mainCategories.length === 0) return;
      // Sequential with delay to avoid 429 rate limits
      const DELAY = 800;
      const categoriesData: CategoryWithSubcategories[] = [];
      for (let i = 0; i < mainCategories.length; i++) {
        try {
          const c = await fetchCategoryWithChildren(mainCategories[i], 0);
          categoriesData.push({ category: c, subcategories: c.children || [] });
        } catch (err: any) {
          if (err?.response?.status === 429) {
            await new Promise((r) => setTimeout(r, 3000));
            try {
              const retry = await fetchCategoryWithChildren(mainCategories[i], 0);
              categoriesData.push({ category: retry, subcategories: retry.children || [] });
            } catch { /* skip */ }
          }
        }
        if (i < mainCategories.length - 1) await new Promise((r) => setTimeout(r, DELAY));
      }
      setCategoriesWithSubcategories(categoriesData);
      if (!selectedMainCategory && categoriesData.length > 0) {
        const first = categoriesData.find(({ subcategories }) => subcategories.length > 0);
        if (first) {
          setSelectedMainCategory(first.category.id);
          setSelectedLevels([first.category.id, null, null, null, null, null]);
        }
      }
    };
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mainCategories]);

  // ── getCategoriesForLevel ────────────────────────────────────────────────
  const getCategoriesForLevel = (level: number): any[] => {
    if (level === 0) {
      const sel = categoriesWithSubcategoriesFiltered.find(({ category }) => category.id === selectedLevels[0]);
      return sel?.subcategories || [];
    }
    if (!selectedLevels[level]) return [];
    const topCat = categoriesWithSubcategoriesFiltered.find(({ category }) => category.id === selectedLevels[0]);
    if (!topCat) return [];
    const pathKey = selectedLevels.slice(0, level + 1).join("-");
    if (loadedChildren.has(pathKey)) return loadedChildren.get(pathKey) || [];
    let current = topCat.subcategories;
    for (let i = 1; i <= level; i++) {
      const sid = selectedLevels[i];
      if (!sid) return [];
      const item = current.find((cat: any) => cat.id === sid);
      if (!item) {
        const ck = selectedLevels.slice(0, i + 1).join("-");
        if (loadedChildren.has(ck)) { current = loadedChildren.get(ck) || []; continue; }
        return [];
      }
      if (i === level) {
        if (item.children?.length > 0) return item.children;
        return loadedChildren.get(pathKey) || [];
      }
      if (item.children?.length > 0) current = item.children;
      else {
        const ck = selectedLevels.slice(0, i + 1).join("-");
        if (loadedChildren.has(ck)) current = loadedChildren.get(ck) || [];
        else return [];
      }
    }
    return [];
  };

  // ── handleCategoryHover ──────────────────────────────────────────────────
  const handleCategoryHover = async (categoryId: number, level: number, category: any) => {
    if (!hasSubcategoryChildren(category)) return;
    const newLevels = [...selectedLevels];
    newLevels[level] = categoryId;
    for (let i = level + 1; i < 6; i++) newLevels[i] = null;
    setSelectedLevels(newLevels);
    const pathKey = newLevels.slice(0, level + 1).join("-");
    if (!loadedChildren.has(pathKey)) {
      const children = await fetchCategoryChildren(categoryId, category._originalChildren || []);
      setLoadedChildren((prev) => { const m = new Map(prev); m.set(pathKey, children); return m; });
      setCategoriesWithSubcategories((prev) =>
        prev.map((catItem) => {
          if (catItem.category.id !== selectedLevels[0]) return catItem;
          const updateTree = (cats: any[], tId: number, newKids: any[], cur: number, tgt: number, pids: number[]): any[] => {
            if (cur === tgt) return cats.map((c) => c.id === tId ? { ...c, children: newKids } : c);
            if (!pids[cur]) return cats;
            return cats.map((c) => ({ ...c, children: updateTree(c.children || [], tId, newKids, cur + 1, tgt, pids) }));
          };
          return { ...catItem, subcategories: updateTree(catItem.subcategories, categoryId, children, 1, level, newLevels.slice(1, level + 1).filter((x): x is number => x !== null)) };
        }),
      );
    }
  };

  // ── handleCategoryClick ──────────────────────────────────────────────────
  const handleCategoryClick = (categoryId: number) => {
    if (onCategorySelect) onCategorySelect(categoryId);
    else router.push(`/trending?category=${categoryId}`);
    onClose();
  };

  // ── getColumnTitle ────────────────────────────────────────────────────────
  const getColumnTitle = (level: number): string => {
    if (level === 0) {
      const sel = categoriesWithSubcategoriesFiltered.find(({ category }) => category.id === selectedLevels[0]);
      return translate(sel?.category.name) || t("categories");
    }
    const sid = selectedLevels[level];
    if (!sid) return `Level ${level + 1}`;
    const cats = getCategoriesForLevel(level - 1);
    const sel = cats.find((c: any) => c.id === sid);
    return translate(sel?.name) || `Level ${level + 1}`;
  };

  // ── Sidebar visibility ────────────────────────────────────────────────────
  useEffect(() => {
    const on = () => setIsHovered(true);
    const off = () => setIsHovered(false);
    window.addEventListener("openCategorySidebar", on);
    window.addEventListener("closeCategorySidebar", off);
    return () => { window.removeEventListener("openCategorySidebar", on); window.removeEventListener("closeCategorySidebar", off); };
  }, []);

  const shouldShow = isOpen || isHovered;

  useEffect(() => { if (!shouldShow) setIsHovered(false); }, [shouldShow]);
  useEffect(() => { if (!isOpen && typeof window !== "undefined") window.dispatchEvent(new CustomEvent("closeCategorySidebar")); }, [isOpen]);
  useEffect(() => {
    if (shouldShow) {
      setHasBeenShown(true);
      const orig = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = orig; };
    }
  }, [shouldShow]);

  return {
    t,
    translate,
    selectedMainCategory,
    setSelectedMainCategory,
    headerHeight,
    hasBeenShown,
    categoriesWithSubcategories,
    setCategoriesWithSubcategories,
    categoriesWithSubcategoriesFiltered,
    selectedLevels,
    setSelectedLevels,
    loadedChildren,
    setLoadedChildren,
    shouldShow,
    getCategoriesForLevel,
    handleCategoryHover,
    handleCategoryClick,
    getColumnTitle,
  };
}
