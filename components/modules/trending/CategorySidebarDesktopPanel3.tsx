"use client";
import React from "react";
import { useTranslations } from "next-intl";
import { useDynamicTranslation } from "@/hooks/useDynamicTranslation";

interface CategorySidebarDesktopPanel3Props {
  hoveredLevel2Id: number | null;
  level3Categories: any[];
  level3Loading: boolean;
  subcategoriesForGrid: any[];
  onCategoryClick: (categoryId: number) => void;
}

export const CategorySidebarDesktopPanel3: React.FC<CategorySidebarDesktopPanel3Props> = ({
  hoveredLevel2Id,
  level3Categories,
  level3Loading,
  subcategoriesForGrid,
  onCategoryClick,
}) => {
  const t = useTranslations();
  const { translate } = useDynamicTranslation();

  if (!hoveredLevel2Id && subcategoriesForGrid.length > 0) {
    return (
      <div className="flex-1 h-full flex items-center justify-center bg-muted text-muted-foreground text-sm">
        <div className="text-center">
          <svg className="w-10 h-10 mx-auto mb-2 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
          </svg>
          <p>{"Hover a subcategory to explore"}</p>
        </div>
      </div>
    );
  }

  if (!hoveredLevel2Id || (level3Categories.length === 0 && !level3Loading)) return null;

  return (
    <div className="flex-1 h-full overflow-y-auto custom-scrollbar bg-muted p-5">
      {level3Loading ? (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-warning border-t-transparent" />
        </div>
      ) : (
        <>
          {/* Header: hovered Level 2 category name */}
          <div className="mb-4 pb-2 border-b border-border">
            <h3
              className="font-semibold text-base text-foreground cursor-pointer hover:text-warning transition-colors"
              onClick={() => onCategoryClick(hoveredLevel2Id!)}
            >
              {translate(subcategoriesForGrid.find((s: any) => s.id === hoveredLevel2Id)?.name || "")}
            </h3>
          </div>

          {/* Level 3 grid with Level 4 sub-items */}
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-3 gap-y-4">
            {level3Categories.map((item: any) => {
              const level4Items = item.children && Array.isArray(item.children) ? item.children.slice(0, 3) : [];
              return (
                <div key={item.id} className="flex flex-col">
                  <div
                    className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-card hover:shadow-sm cursor-pointer transition-all group"
                    onClick={() => onCategoryClick(item.id)}
                  >
                    {item.icon ? (
                      <img
                        src={item.icon}
                        alt={item.name}
                        height={16}
                        width={16}
                        className="object-contain flex-shrink-0"
                      />
                    ) : (
                      <div className="h-4 w-4 flex-shrink-0 rounded bg-muted" />
                    )}
                    <span className="text-sm font-medium text-muted-foreground group-hover:text-warning transition-colors line-clamp-1">
                      {translate(item.name)}
                    </span>
                  </div>
                  {level4Items.length > 0 && (
                    <div className="ml-9 flex flex-col gap-0.5">
                      {level4Items.map((sub: any) => (
                        <span
                          key={sub.id}
                          className="text-xs text-muted-foreground hover:text-warning cursor-pointer transition-colors line-clamp-1 py-0.5"
                          onClick={() => onCategoryClick(sub.id)}
                        >
                          {translate(sub.name)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* View All */}
          <div className="mt-4 pt-3 border-t border-border">
            <span
              className="text-warning hover:text-warning font-medium cursor-pointer text-sm"
              onClick={() => onCategoryClick(hoveredLevel2Id!)}
            >
              {t("view_all") || "View All"}{" "}
              {translate(subcategoriesForGrid.find((s: any) => s.id === hoveredLevel2Id)?.name || "")}{" "}
              →
            </span>
          </div>
        </>
      )}
    </div>
  );
};
