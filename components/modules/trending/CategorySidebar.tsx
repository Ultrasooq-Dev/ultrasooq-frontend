"use client";
import React, { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { injectScrollbarStyles } from "./categorySidebarScrollbarStyles";
import { useCategorySidebarData } from "./useCategorySidebarData";
import { useCategorySidebarGrid } from "./useCategorySidebarGrid";
import { useCategorySidebarMobile } from "./useCategorySidebarMobile";
import { CategorySidebarDesktopPanel1 } from "./CategorySidebarDesktopPanel1";
import { CategorySidebarDesktopPanel2 } from "./CategorySidebarDesktopPanel2";
import { CategorySidebarDesktopPanel3 } from "./CategorySidebarDesktopPanel3";
import { CategorySidebarMobileView } from "./CategorySidebarMobileView";

interface CategorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onCategorySelect?: (categoryId: number) => void;
}

const CategorySidebar: React.FC<CategorySidebarProps> = ({
  isOpen,
  onClose,
  onCategorySelect,
}) => {
  const { langDir } = useAuth();

  useEffect(() => { injectScrollbarStyles(); }, []);

  const data = useCategorySidebarData(isOpen, onClose, onCategorySelect);
  const {
    selectedMainCategory,
    setSelectedMainCategory,
    headerHeight,
    hasBeenShown,
    categoriesWithSubcategories,
    categoriesWithSubcategoriesFiltered,
    selectedLevels,
    setSelectedLevels,
    setLoadedChildren,
    shouldShow,
    getCategoriesForLevel,
    handleCategoryHover,
    handleCategoryClick,
  } = data;

  const grid = useCategorySidebarGrid(categoriesWithSubcategories);
  const {
    subcategoriesForGrid,
    gridLoading,
    hoveredLevel2Id,
    level3Categories,
    level3Loading,
    handleMainCategoryHover,
    handleLevel2Hover,
    resetGridState,
  } = grid;

  const mobile = useCategorySidebarMobile({
    shouldShow,
    categoriesWithSubcategoriesFiltered,
    selectedLevels,
    setSelectedLevels,
    setSelectedMainCategory,
    setLoadedChildren,
    getCategoriesForLevel,
    handleCategoryHover,
    handleCategoryClick,
  });
  const {
    isMobileState,
    mobileNavStack,
    getMobileCurrentCategories,
    handleMobileCategoryClick,
    handleMobileBack,
  } = mobile;

  if (!hasBeenShown) return null;

  return (
    <>
      {/* Backdrop */}
      {shouldShow && (
        <div
          className="fixed inset-0 z-[49] bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <div
        className={cn(
          "fixed z-50 bg-card shadow-2xl transition-all duration-300 ease-in-out",
          "flex",
          langDir === "rtl" ? "right-0" : "left-0",
          shouldShow ? "translate-x-0 opacity-100" : langDir === "rtl" ? "translate-x-full opacity-0" : "-translate-x-full opacity-0",
        )}
        style={{ top: headerHeight, height: `calc(100vh - ${headerHeight}px)`, width: "min(900px, 90vw)" }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 end-3 z-10 rounded-full p-1.5 hover:bg-muted transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>

        {/* Mobile view */}
        {isMobileState ? (
          <CategorySidebarMobileView
            langDir={langDir}
            mobileNavStack={mobileNavStack}
            getMobileCurrentCategories={getMobileCurrentCategories}
            handleMobileBack={handleMobileBack}
            handleMobileCategoryClick={handleMobileCategoryClick}
          />
        ) : (
          /* Desktop three-panel layout */
          <div className="hidden md:flex h-full w-full overflow-hidden">
            {/* Panel 1: Main categories */}
            <div className="w-[200px] lg:w-[220px] flex-shrink-0 h-full overflow-y-auto custom-scrollbar border-e border-border bg-muted/40">
              <CategorySidebarDesktopPanel1
                langDir={langDir}
                categoriesWithSubcategoriesFiltered={categoriesWithSubcategoriesFiltered}
                selectedLevels={selectedLevels}
                onMainCategoryHover={async (id) => {
                  setSelectedLevels([id, null, null, null, null, null]);
                  setSelectedMainCategory(id);
                  resetGridState();
                  await handleMainCategoryHover(id);
                }}
                onCategoryClick={handleCategoryClick}
              />
            </div>

            {/* Panel 2: Sub-categories grid */}
            <CategorySidebarDesktopPanel2
              langDir={langDir}
              subcategoriesForGrid={subcategoriesForGrid}
              gridLoading={gridLoading}
              hoveredLevel2Id={hoveredLevel2Id}
              selectedLevels={selectedLevels}
              categoriesWithSubcategoriesFiltered={categoriesWithSubcategoriesFiltered}
              onLevel2Hover={handleLevel2Hover}
              onCategoryClick={handleCategoryClick}
            />

            {/* Panel 3: Level 3+ categories */}
            <CategorySidebarDesktopPanel3
              hoveredLevel2Id={hoveredLevel2Id}
              level3Categories={level3Categories}
              level3Loading={level3Loading}
              subcategoriesForGrid={subcategoriesForGrid}
              onCategoryClick={handleCategoryClick}
            />
          </div>
        )}
      </div>
    </>
  );
};

export default CategorySidebar;
