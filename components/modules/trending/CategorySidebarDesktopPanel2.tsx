"use client";
import React from "react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { useDynamicTranslation } from "@/hooks/useDynamicTranslation";
import { CategoryWithSubcategories } from "./categorySidebarTypes";

interface CategorySidebarDesktopPanel2Props {
  langDir: string;
  subcategoriesForGrid: any[];
  gridLoading: boolean;
  hoveredLevel2Id: number | null;
  selectedLevels: (number | null)[];
  categoriesWithSubcategoriesFiltered: CategoryWithSubcategories[];
  onLevel2Hover: (subcategory: any) => void;
  onCategoryClick: (categoryId: number) => void;
}

export const CategorySidebarDesktopPanel2: React.FC<CategorySidebarDesktopPanel2Props> = ({
  langDir,
  subcategoriesForGrid,
  gridLoading,
  hoveredLevel2Id,
  selectedLevels,
  categoriesWithSubcategoriesFiltered,
  onLevel2Hover,
  onCategoryClick,
}) => {
  const t = useTranslations();
  const { translate } = useDynamicTranslation();

  return (
    <div
      className={cn(
        "flex-shrink-0 h-full overflow-y-auto custom-scrollbar border-r border-border bg-card",
        "w-[220px] lg:w-[260px]",
      )}
    >
      {gridLoading ? (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-warning border-t-transparent" />
        </div>
      ) : subcategoriesForGrid.length > 0 ? (
        <div className="py-2">
          {subcategoriesForGrid.map((subcategory: any) => {
            const isActive = hoveredLevel2Id === subcategory.id;
            const hasChildren =
              (subcategory.children && subcategory.children.length > 0) ||
              subcategory.hasChildren ||
              (subcategory._originalChildren && subcategory._originalChildren.length > 0);

            return (
              <div
                key={subcategory.id}
                className={cn(
                  "flex cursor-pointer items-center gap-x-3 px-4 py-2.5 transition-colors",
                  isActive ? "bg-warning/5 text-warning" : "hover:bg-muted text-muted-foreground",
                )}
                onMouseEnter={() => onLevel2Hover(subcategory)}
                onClick={() => onCategoryClick(subcategory.id)}
              >
                {subcategory.icon ? (
                  <img
                    src={subcategory.icon}
                    alt={subcategory.name}
                    height={18}
                    width={18}
                    className="object-contain flex-shrink-0"
                  />
                ) : (
                  <div className="h-[18px] w-[18px] flex-shrink-0 rounded bg-muted" />
                )}
                <span
                  className={cn(
                    "text-sm flex-1 line-clamp-1",
                    langDir === "rtl" ? "text-right" : "text-left",
                    isActive ? "font-medium" : "",
                  )}
                >
                  {translate(subcategory.name)}
                </span>
                {hasChildren && (
                  <svg
                    className={cn(
                      "w-3.5 h-3.5 flex-shrink-0",
                      isActive ? "text-warning" : "text-muted-foreground",
                      langDir === "rtl" ? "rotate-180" : "",
                    )}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </div>
            );
          })}

          {/* View All */}
          {selectedLevels[0] && (
            <div className="px-4 py-3 mt-1 border-t border-border">
              <span
                className="text-warning hover:text-warning font-medium cursor-pointer text-sm"
                onClick={() => onCategoryClick(selectedLevels[0]!)}
              >
                {t("view_all") || "View All"}{" "}
                {translate(
                  categoriesWithSubcategoriesFiltered.find(({ category }) => category.id === selectedLevels[0])?.category.name || "",
                )}{" "}
                →
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center h-full text-muted-foreground text-sm px-4">
          {t("select_category") || "Hover a category"}
        </div>
      )}
    </div>
  );
};
