"use client";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { MobileNavItem, CategoryWithSubcategories } from "./categorySidebarTypes";
import { hasSubcategoryChildren } from "./categorySidebarUtils";

interface UseCategorySidebarMobileOptions {
  shouldShow: boolean;
  categoriesWithSubcategoriesFiltered: CategoryWithSubcategories[];
  selectedLevels: (number | null)[];
  setSelectedLevels: React.Dispatch<React.SetStateAction<(number | null)[]>>;
  setSelectedMainCategory: React.Dispatch<React.SetStateAction<number | null>>;
  setLoadedChildren: React.Dispatch<React.SetStateAction<Map<string, any[]>>>;
  getCategoriesForLevel: (level: number) => any[];
  handleCategoryHover: (categoryId: number, level: number, category: any) => Promise<void>;
  handleCategoryClick: (categoryId: number) => void;
}

export function useCategorySidebarMobile({
  shouldShow,
  categoriesWithSubcategoriesFiltered,
  selectedLevels,
  setSelectedLevels,
  setSelectedMainCategory,
  setLoadedChildren,
  getCategoriesForLevel,
  handleCategoryHover,
  handleCategoryClick,
}: UseCategorySidebarMobileOptions) {
  const t = useTranslations();
  const [isMobileState, setIsMobileState] = useState(false);
  const [mobileNavStack, setMobileNavStack] = useState<MobileNavItem[]>([]);

  useEffect(() => {
    const check = () => setIsMobileState(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Reset stack when sidebar closes
  useEffect(() => { if (!shouldShow) setMobileNavStack([]); }, [shouldShow]);

  // ── getMobileCurrentCategories ───────────────────────────────────────────
  const getMobileCurrentCategories = (): { categories: any[]; level: number; title: string } => {
    if (!isMobileState) return { categories: [], level: -1, title: "" };
    if (mobileNavStack.length === 0) {
      return {
        categories: categoriesWithSubcategoriesFiltered.map(({ category }) => category),
        level: 0,
        title: t("categories"),
      };
    }
    const lastItem = mobileNavStack[mobileNavStack.length - 1];
    return {
      categories: getCategoriesForLevel(lastItem.level) || [],
      level: lastItem.level,
      title: lastItem.categoryName,
    };
  };

  // ── handleMobileCategoryClick ────────────────────────────────────────────
  const handleMobileCategoryClick = async (category: any, level: number) => {
    if (!isMobileState) return;
    if (level === 0) {
      const catWithSubs = categoriesWithSubcategoriesFiltered.find(({ category: c }) => c.id === category.id);
      if (catWithSubs && catWithSubs.subcategories.length > 0) {
        setSelectedMainCategory(category.id);
        setSelectedLevels([category.id, null, null, null, null, null]);
        setLoadedChildren(new Map());
        await handleCategoryHover(category.id, 0, category);
        setMobileNavStack([{ level: 0, categoryId: category.id, categoryName: category.name }]);
      } else {
        handleCategoryClick(category.id);
      }
      return;
    }
    if (hasSubcategoryChildren(category)) {
      const newLevels = [...selectedLevels];
      newLevels[level] = category.id;
      for (let i = level + 1; i < newLevels.length; i++) newLevels[i] = null;
      setSelectedLevels(newLevels);
      await handleCategoryHover(category.id, level, category);
      setMobileNavStack((prev) => [...prev, { level, categoryId: category.id, categoryName: category.name }]);
    } else {
      handleCategoryClick(category.id);
    }
  };

  // ── handleMobileBack ─────────────────────────────────────────────────────
  const handleMobileBack = () => {
    setMobileNavStack((prev) => {
      const newStack = prev.slice(0, -1);
      if (newStack.length === 0) {
        setSelectedMainCategory(null);
        setSelectedLevels([null, null, null, null, null, null]);
        setLoadedChildren(new Map());
      } else {
        const lastItem = newStack[newStack.length - 1];
        setSelectedLevels((prev) => {
          const updated = [...prev];
          for (let i = lastItem.level + 2; i < updated.length; i++) updated[i] = null;
          return updated;
        });
      }
      return newStack;
    });
  };

  return {
    isMobileState,
    mobileNavStack,
    getMobileCurrentCategories,
    handleMobileCategoryClick,
    handleMobileBack,
  };
}
