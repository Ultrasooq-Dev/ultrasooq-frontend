"use client";

/**
 * @component CategoryMultiSelect
 * @description Searchable multi-category picker with AI suggestion support.
 *   Allows selecting multiple categories for a product, with one marked as primary.
 * @props categories - flat list of {id, name, parentId, icon?}
 * @props selectedIds - array of selected category IDs
 * @props onSelect - callback when category is selected
 * @props onRemove - callback when category is removed
 * @props onPrimaryChange - callback when primary category changes
 * @props showAISuggest - whether to show AI suggest button
 * @props onAISuggest - callback for AI category suggestion
 * @props disabled - whether the component is disabled
 * @uses shadcn/Command, shadcn/Badge, shadcn/Popover, shadcn/Button, shadcn/ScrollArea
 */
import React, { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Check, Star, Sparkles, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CategoryOption {
  id: number;
  name: string;
  parentId?: number | null;
  icon?: string | null;
}

interface CategoryMultiSelectProps {
  categories: CategoryOption[];
  selectedIds: number[];
  onSelect: (categoryId: number) => void;
  onRemove: (categoryId: number) => void;
  onPrimaryChange?: (categoryId: number) => void;
  primaryCategoryId?: number;
  showAISuggest?: boolean;
  onAISuggest?: () => void;
  isAISuggesting?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export function CategoryMultiSelect({
  categories,
  selectedIds,
  onSelect,
  onRemove,
  onPrimaryChange,
  primaryCategoryId,
  showAISuggest = false,
  onAISuggest,
  isAISuggesting = false,
  disabled = false,
  placeholder = "Select categories...",
}: CategoryMultiSelectProps) {
  const [open, setOpen] = useState(false);

  // Build parent name lookup for hierarchy display
  const categoryMap = useMemo(() => {
    const map = new Map<number, CategoryOption>();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  const getCategoryPath = (cat: CategoryOption): string => {
    if (cat.parentId) {
      const parent = categoryMap.get(cat.parentId);
      if (parent) return `${parent.name} > ${cat.name}`;
    }
    return cat.name;
  };

  const selectedCategories = useMemo(
    () =>
      selectedIds
        .map((id) => categoryMap.get(id))
        .filter(Boolean) as CategoryOption[],
    [selectedIds, categoryMap]
  );

  const effectivePrimary = primaryCategoryId || selectedIds[0];

  return (
    <div className="space-y-2">
      {/* Selected categories as badges */}
      {selectedCategories.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedCategories.map((cat) => (
            <Badge
              key={cat.id}
              variant={cat.id === effectivePrimary ? "default" : "secondary"}
              className="flex items-center gap-1 px-2 py-1 text-xs"
            >
              {cat.id === effectivePrimary && (
                <Star className="h-3 w-3 fill-current" />
              )}
              {getCategoryPath(cat)}
              {onPrimaryChange && cat.id !== effectivePrimary && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPrimaryChange(cat.id);
                  }}
                  className="ml-1 opacity-50 hover:opacity-100"
                  title="Set as primary category"
                >
                  <Star className="h-3 w-3" />
                </button>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(cat.id);
                }}
                className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Category picker */}
      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between text-sm font-normal"
              disabled={disabled}
            >
              {selectedIds.length > 0
                ? `${selectedIds.length} categor${selectedIds.length === 1 ? "y" : "ies"} selected`
                : placeholder}
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search categories..." />
              <CommandList>
                <CommandEmpty>No categories found.</CommandEmpty>
                <CommandGroup>
                  <ScrollArea className="h-[300px]">
                    {categories.map((cat) => {
                      const isSelected = selectedIds.includes(cat.id);
                      return (
                        <CommandItem
                          key={cat.id}
                          value={getCategoryPath(cat)}
                          onSelect={() => {
                            if (isSelected) {
                              onRemove(cat.id);
                            } else {
                              onSelect(cat.id);
                            }
                          }}
                        >
                          <div
                            className={cn(
                              "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                              isSelected
                                ? "bg-primary text-primary-foreground"
                                : "opacity-50 [&_svg]:invisible"
                            )}
                          >
                            <Check className="h-4 w-4" />
                          </div>
                          <span
                            className={
                              cat.parentId
                                ? "pl-2 text-sm"
                                : "font-medium text-sm"
                            }
                          >
                            {getCategoryPath(cat)}
                          </span>
                        </CommandItem>
                      );
                    })}
                  </ScrollArea>
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* AI Suggest button */}
        {showAISuggest && onAISuggest && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAISuggest}
            disabled={disabled || isAISuggesting}
            className="shrink-0 gap-1.5"
          >
            <Sparkles
              className={cn("h-4 w-4", isAISuggesting && "animate-pulse")}
            />
            {isAISuggesting ? "Suggesting..." : "AI Suggest"}
          </Button>
        )}
      </div>

      {selectedIds.length > 0 && (
        <p className="text-xs text-muted-foreground">
          <Star className="inline h-3 w-3 mr-1" />
          Primary category is used for breadcrumbs. Click the star icon to
          change it.
        </p>
      )}
    </div>
  );
}
