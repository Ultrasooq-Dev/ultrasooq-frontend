"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useSearchSuggestions } from "@/apis/queries/product.queries";
import { useMe } from "@/apis/queries/user.queries";
import { getOrCreateDeviceId } from "@/utils/helper";
import { useRouter } from "next/navigation";
import { Clock, TrendingUp, Package, FolderOpen } from "lucide-react";

interface SearchAutocompleteProps {
    searchTerm: string;
    onSelect: (term: string) => void;
    visible: boolean;
    onClose: () => void;
    langDir?: string;
}

const SearchAutocomplete: React.FC<SearchAutocompleteProps> = ({
    searchTerm,
    onSelect,
    visible,
    onClose,
    langDir = "ltr",
}) => {
    const router = useRouter();
    const me = useMe();
    const deviceId = getOrCreateDeviceId() || "";
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [activeIndex, setActiveIndex] = useState(-1);

    const { data: suggestionsData } = useSearchSuggestions(
        {
            term: searchTerm,
            userId: me?.data?.data?.id,
            deviceId,
        },
        visible && searchTerm.length >= 2,
    );

    const suggestions = suggestionsData?.data;
    const hasAnySuggestions =
        (suggestions?.products?.length || 0) +
        (suggestions?.categories?.length || 0) +
        (suggestions?.popularSearches?.length || 0) +
        (suggestions?.recentSearches?.length || 0) > 0;

    // Build flat list of all suggestion items for keyboard navigation
    const allItems: { type: string; label: string; id?: number }[] = [];
    if (suggestions?.recentSearches?.length) {
        suggestions.recentSearches.forEach((s: any) =>
            allItems.push({ type: "recent", label: s.term }),
        );
    }
    if (suggestions?.popularSearches?.length) {
        suggestions.popularSearches.forEach((s: any) =>
            allItems.push({ type: "popular", label: s.term }),
        );
    }
    if (suggestions?.products?.length) {
        suggestions.products.forEach((p: any) =>
            allItems.push({ type: "product", label: p.name, id: p.id }),
        );
    }
    if (suggestions?.categories?.length) {
        suggestions.categories.forEach((c: any) =>
            allItems.push({ type: "category", label: c.name, id: c.id }),
        );
    }

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        if (visible) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [visible, onClose]);

    // Reset active index when suggestions change
    useEffect(() => {
        setActiveIndex(-1);
    }, [searchTerm]);

    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (!visible || !allItems.length) return;
            if (e.key === "ArrowDown") {
                e.preventDefault();
                setActiveIndex((prev) => Math.min(prev + 1, allItems.length - 1));
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActiveIndex((prev) => Math.max(prev - 1, -1));
            } else if (e.key === "Enter" && activeIndex >= 0) {
                e.preventDefault();
                const item = allItems[activeIndex];
                if (item.type === "category" && item.id) {
                    router.push(`/trending?categoryIds=${item.id}`);
                } else {
                    onSelect(item.label);
                }
                onClose();
            } else if (e.key === "Escape") {
                onClose();
            }
        },
        [visible, allItems, activeIndex, onSelect, onClose, router],
    );

    useEffect(() => {
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    if (!visible || !hasAnySuggestions) return null;

    let flatIdx = -1;

    return (
        <div
            ref={dropdownRef}
            className="absolute top-full left-0 right-0 z-50 mt-1 max-h-[400px] overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-xl"
            dir={langDir}
        >
            {/* Recent Searches */}
            {suggestions?.recentSearches?.length > 0 && (
                <div className="border-b border-gray-100 px-3 py-2">
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                        Recent
                    </p>
                    {suggestions.recentSearches.map((item: any) => {
                        flatIdx++;
                        const idx = flatIdx;
                        return (
                            <button
                                key={`recent-${item.term}`}
                                className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
                                    activeIndex === idx
                                        ? "bg-gray-100"
                                        : "hover:bg-gray-50"
                                }`}
                                onClick={() => {
                                    onSelect(item.term);
                                    onClose();
                                }}
                            >
                                <Clock className="h-3.5 w-3.5 text-gray-400" />
                                <span className="text-gray-700">{item.term}</span>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Popular Searches */}
            {suggestions?.popularSearches?.length > 0 && (
                <div className="border-b border-gray-100 px-3 py-2">
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                        Trending
                    </p>
                    {suggestions.popularSearches.map((item: any) => {
                        flatIdx++;
                        const idx = flatIdx;
                        return (
                            <button
                                key={`popular-${item.term}`}
                                className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
                                    activeIndex === idx
                                        ? "bg-gray-100"
                                        : "hover:bg-gray-50"
                                }`}
                                onClick={() => {
                                    onSelect(item.term);
                                    onClose();
                                }}
                            >
                                <TrendingUp className="h-3.5 w-3.5 text-orange-400" />
                                <span className="text-gray-700">{item.term}</span>
                                <span className="ml-auto text-xs text-gray-400">
                                    {item.search_count}
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Product Matches */}
            {suggestions?.products?.length > 0 && (
                <div className="border-b border-gray-100 px-3 py-2">
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                        Products
                    </p>
                    {suggestions.products.map((item: any) => {
                        flatIdx++;
                        const idx = flatIdx;
                        return (
                            <button
                                key={`product-${item.id}`}
                                className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
                                    activeIndex === idx
                                        ? "bg-gray-100"
                                        : "hover:bg-gray-50"
                                }`}
                                onClick={() => {
                                    onSelect(item.name);
                                    onClose();
                                }}
                            >
                                <Package className="h-3.5 w-3.5 text-blue-400" />
                                <span className="flex-1 truncate text-gray-700">
                                    {item.name}
                                </span>
                                {item.price && (
                                    <span className="text-xs font-medium text-green-600">
                                        ${Number(item.price).toFixed(2)}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Category Matches */}
            {suggestions?.categories?.length > 0 && (
                <div className="px-3 py-2">
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                        Categories
                    </p>
                    {suggestions.categories.map((item: any) => {
                        flatIdx++;
                        const idx = flatIdx;
                        return (
                            <button
                                key={`cat-${item.id}`}
                                className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
                                    activeIndex === idx
                                        ? "bg-gray-100"
                                        : "hover:bg-gray-50"
                                }`}
                                onClick={() => {
                                    router.push(`/trending?categoryIds=${item.id}`);
                                    onClose();
                                }}
                            >
                                <FolderOpen className="h-3.5 w-3.5 text-purple-400" />
                                <span className="text-gray-700">{item.name}</span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default SearchAutocomplete;
