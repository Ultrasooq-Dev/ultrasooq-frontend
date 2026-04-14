"use client";
import React from "react";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDynamicTranslation } from "@/hooks/useDynamicTranslation";
import { useTranslations } from "next-intl";
import { MobileNavItem } from "./categorySidebarTypes";

interface CategorySidebarMobileViewProps {
  langDir: string;
  mobileNavStack: MobileNavItem[];
  getMobileCurrentCategories: () => { categories: any[]; level: number; title: string };
  handleMobileBack: () => void;
  handleMobileCategoryClick: (category: any, level: number) => void;
}

export const CategorySidebarMobileView: React.FC<CategorySidebarMobileViewProps> = ({
  langDir,
  mobileNavStack,
  getMobileCurrentCategories,
  handleMobileBack,
  handleMobileCategoryClick,
}) => {
  const t = useTranslations();
  const { translate } = useDynamicTranslation();

  const { categories } = getMobileCurrentCategories();

  return (
    <div className="md:hidden flex flex-col h-full w-full">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        {mobileNavStack.length > 0 ? (
          <button
            onClick={handleMobileBack}
            className={cn(
              "flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors",
              langDir === "rtl" ? "flex-row-reverse" : "",
            )}
          >
            <ChevronLeft className={cn("h-5 w-5", langDir === "rtl" ? "rotate-180" : "")} />
            <span className="text-sm font-medium">
              {mobileNavStack.length > 1
                ? translate(mobileNavStack[mobileNavStack.length - 2].categoryName)
                : t("all_categories")}
            </span>
          </button>
        ) : (
          <div />
        )}
      </div>

      {/* Current Category Name */}
      {mobileNavStack.length > 0 && (
        <div className="px-4 py-3 border-b border-border bg-card">
          <span className="text-base font-semibold text-foreground">
            {translate(mobileNavStack[mobileNavStack.length - 1].categoryName)}
          </span>
        </div>
      )}

      {/* Category List */}
      <div className="flex-1 overflow-y-auto">
        <div className="py-2">
          {categories.map((category: any) => {
            const hasChildren =
              (category.children && Array.isArray(category.children) && category.children.length > 0) ||
              category.hasChildren ||
              (category._originalChildren && Array.isArray(category._originalChildren) && category._originalChildren.length > 0);

            return (
              <div
                key={category.id}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 mx-2 rounded-md transition-colors cursor-pointer",
                  "hover:bg-muted active:bg-muted",
                )}
                onClick={() => {
                  const categoryLevel =
                    mobileNavStack.length === 0
                      ? 0
                      : mobileNavStack[mobileNavStack.length - 1].level + 1;
                  handleMobileCategoryClick(category, categoryLevel);
                }}
              >
                {category.icon ? (
                  <img
                    src={category.icon}
                    alt={category.name}
                    height={24}
                    width={24}
                    className="object-contain flex-shrink-0"
                  />
                ) : (
                  <div className="h-6 w-6 flex-shrink-0 rounded bg-muted" />
                )}
                <span className="text-base flex-1 text-left text-foreground">
                  {translate(category.name)}
                </span>
                {hasChildren && (
                  <ChevronLeft
                    className={cn(
                      "h-5 w-5 text-muted-foreground flex-shrink-0",
                      langDir === "rtl" ? "" : "rotate-180",
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
