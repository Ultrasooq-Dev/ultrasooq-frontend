"use client";
import React from "react";
import { cn } from "@/lib/utils";
import { useDynamicTranslation } from "@/hooks/useDynamicTranslation";
import { CategoryWithSubcategories } from "./categorySidebarTypes";
import { ScrollableMainColumn } from "./CategorySidebarScrollable";

interface CategorySidebarDesktopPanel1Props {
  langDir: string;
  categoriesWithSubcategoriesFiltered: CategoryWithSubcategories[];
  selectedLevels: (number | null)[];
  onMainCategoryHover: (categoryId: number) => void;
  onCategoryClick: (categoryId: number) => void;
}

export const CategorySidebarDesktopPanel1: React.FC<CategorySidebarDesktopPanel1Props> = ({
  langDir,
  categoriesWithSubcategoriesFiltered,
  selectedLevels,
  onMainCategoryHover,
  onCategoryClick,
}) => {
  const { translate } = useDynamicTranslation();

  if (categoriesWithSubcategoriesFiltered.length === 0) return null;

  return (
    <ScrollableMainColumn>
      <div className="py-2">
        {categoriesWithSubcategoriesFiltered.map(({ category }) => {
          const isMainActive = selectedLevels[0] === category.id;

          return (
            <div
              key={category.id}
              className={cn(
                "flex cursor-pointer items-center gap-x-3 px-4 py-3 transition-colors",
                isMainActive ? "bg-card font-medium" : "hover:bg-muted",
                langDir === "rtl"
                  ? isMainActive ? "border-l-2 border-warning" : ""
                  : isMainActive ? "border-r-2 border-warning" : "",
              )}
              onMouseEnter={() => onMainCategoryHover(category.id)}
              onClick={() => onCategoryClick(category.id)}
            >
              {category.icon ? (
                <img
                  src={category.icon}
                  alt={category.name}
                  height={20}
                  width={20}
                  className="object-contain flex-shrink-0"
                />
              ) : (
                <div className="h-5 w-5 flex-shrink-0 rounded bg-muted" />
              )}
              <span
                className={cn(
                  "text-sm flex-1",
                  langDir === "rtl" ? "text-right" : "text-left",
                  isMainActive ? "text-foreground font-medium" : "text-muted-foreground",
                )}
              >
                {translate(category.name)}
              </span>
              <svg
                className={cn(
                  "w-4 h-4 text-muted-foreground flex-shrink-0",
                  langDir === "rtl" ? "rotate-180" : "",
                )}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          );
        })}
      </div>
    </ScrollableMainColumn>
  );
};
