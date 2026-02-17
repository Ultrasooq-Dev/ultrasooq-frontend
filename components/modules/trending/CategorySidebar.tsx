"use client";
import React, { useState, useMemo, useEffect, useRef } from "react";
import { useCategory } from "@/apis/queries/category.queries";
import { fetchCategory } from "@/apis/requests/category.requests";
import { PRODUCT_CATEGORY_ID } from "@/utils/constants";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { useDynamicTranslation } from "@/hooks/useDynamicTranslation";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useCategoryStore } from "@/lib/categoryStore";

// Custom scrollbar styles
const scrollbarStyles = `
  .custom-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: transparent transparent;
  }
  
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: transparent;
    border-radius: 3px;
    transition: background-color 0.3s ease;
  }
  
  .custom-scrollbar:hover::-webkit-scrollbar-thumb,
  .custom-scrollbar.scrolling::-webkit-scrollbar-thumb {
    background-color: #9ca3af;
  }
  
  .custom-scrollbar:hover::-webkit-scrollbar-thumb:hover,
  .custom-scrollbar.scrolling::-webkit-scrollbar-thumb:hover {
    background-color: #6b7280;
  }
`;

if (typeof document !== 'undefined') {
  const styleId = 'category-sidebar-scrollbar-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = scrollbarStyles;
    document.head.appendChild(style);
  }
}

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
  const t = useTranslations();
  const { langDir } = useAuth();
  const { translate } = useDynamicTranslation();
  const router = useRouter();
  const categoryStore = useCategoryStore();
  const containerRef = useRef<HTMLDivElement>(null);

  const [selectedMainCategory, setSelectedMainCategory] = useState<
    number | null
  >(null);
  const [headerHeight, setHeaderHeight] = useState(133);
  const [isHovered, setIsHovered] = useState(false);
  const [hasBeenShown, setHasBeenShown] = useState(false);
  const [categoriesWithSubcategories, setCategoriesWithSubcategories] =
    useState<Array<{ category: any; subcategories: any[] }>>([]);
  
  // Track selected category ID at each level (up to 6 levels)
  // Level 0: Main category, Level 1-5: Subcategories
  const [selectedLevels, setSelectedLevels] = useState<(number | null)[]>([
    null, // Level 0: Main category
    null, // Level 1: Sub category
    null, // Level 2: Sub sub category
    null, // Level 3: Sub sub sub category
    null, // Level 4
    null, // Level 5
  ]);

  // Mobile navigation stack: tracks the path of selected categories
  // Each item: { level: number, categoryId: number, categoryName: string }
  const [mobileNavStack, setMobileNavStack] = useState<Array<{
    level: number;
    categoryId: number;
    categoryName: string;
  }>>([]);

  // Store loaded children for each category path
  const [loadedChildren, setLoadedChildren] = useState<Map<string, any[]>>(
    new Map(),
  );

  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate header height
  useEffect(() => {
    const calculateHeaderHeight = () => {
      const header = document.querySelector("header");
      if (header) {
        setHeaderHeight(header.offsetHeight);
      } else {
        if (window.innerWidth >= 1024) {
          setHeaderHeight(146);
        } else if (window.innerWidth >= 768) {
          setHeaderHeight(133);
        } else {
          setHeaderHeight(116);
        }
      }
    };

    calculateHeaderHeight();
    window.addEventListener("resize", calculateHeaderHeight);
    return () => window.removeEventListener("resize", calculateHeaderHeight);
  }, []);

  // Disabled: Handle hover state with delay - removed auto-close on mouse leave
  // useEffect(() => {
  //   if (isHovered) {
  //     if (closeTimeoutRef.current) {
  //       clearTimeout(closeTimeoutRef.current);
  //       closeTimeoutRef.current = null;
  //     }
  //   } else {
  //     closeTimeoutRef.current = setTimeout(() => {
  //       onClose();
  //     }, 300);
  //   }

  //   return () => {
  //     if (closeTimeoutRef.current) {
  //       clearTimeout(closeTimeoutRef.current);
  //     }
  //   };
  // }, [isHovered, onClose]);

  // Fetch main categories
  const mainCategoriesQuery = useCategory(PRODUCT_CATEGORY_ID.toString());

  const mainCategories = useMemo(() => {
    return mainCategoriesQuery?.data?.data?.children || [];
  }, [mainCategoriesQuery?.data?.data]);

  // Filter categories to only show those with subcategories
  const categoriesWithSubcategoriesFiltered = useMemo(() => {
    return categoriesWithSubcategories.filter(
      ({ subcategories }) => subcategories.length > 0,
    );
  }, [categoriesWithSubcategories]);

  // Get main category IDs that have subcategories
  const mainCategoryIdsWithSubcategories = useMemo(() => {
    return new Set(
      categoriesWithSubcategoriesFiltered.map(({ category }) => category.id),
    );
  }, [categoriesWithSubcategoriesFiltered]);

  // Filter main categories to only show those with subcategories
  const mainCategoriesFiltered = useMemo(() => {
    return mainCategories.filter((category: any) =>
      mainCategoryIdsWithSubcategories.has(category.id),
    );
  }, [mainCategories, mainCategoryIdsWithSubcategories]);

  // Recursive function to fetch all category levels
  const fetchCategoryWithChildren = async (category: any, level: number = 0): Promise<any> => {
    try {
      const response = await fetchCategory({
        categoryId: category.id.toString(),
      });
      const children = response?.data?.data?.children || [];
      
      const childrenWithNested = children.map((child: any) => {
        const hasChildren = child.children && Array.isArray(child.children) && child.children.length > 0;
        return {
          ...child,
          children: [],
          hasChildren: hasChildren,
          level: level + 1,
          _originalChildren: child.children || [],
        };
      });

      return {
        ...category,
        children: childrenWithNested,
        level,
      };
    } catch (error) {
      console.error(`Error fetching category ${category.name}:`, error);
      return {
        ...category,
        children: [],
        level,
      };
    }
  };

  // Fetch children for a specific category on-demand
  const fetchCategoryChildren = async (categoryId: number, originalChildren?: any[]): Promise<any[]> => {
    try {
      if (originalChildren && originalChildren.length > 0) {
        return originalChildren.map((child: any) => {
          const hasChildren = child.children && Array.isArray(child.children) && child.children.length > 0;
          return {
            ...child,
            children: [],
            hasChildren: hasChildren,
            _originalChildren: child.children || [],
          };
        });
      }

      const response = await fetchCategory({
        categoryId: categoryId.toString(),
      });
      const children = response?.data?.data?.children || [];
      
      return children.map((child: any) => {
        const hasChildren = child.children && Array.isArray(child.children) && child.children.length > 0;
        return {
          ...child,
          children: [],
          hasChildren: hasChildren,
          _originalChildren: child.children || [],
        };
      });
    } catch (error) {
      console.error(`Error fetching children for category ${categoryId}:`, error);
      return [];
    }
  };

  // Fetch all subcategories for all main categories
  useEffect(() => {
    const fetchAllSubcategories = async () => {
      if (mainCategories.length === 0) return;

      const categoriesData = await Promise.all(
        mainCategories.map(async (category: any) => {
          const categoryWithChildren = await fetchCategoryWithChildren(category, 0);
          return { 
            category: categoryWithChildren, 
            subcategories: categoryWithChildren.children || [] 
          };
        }),
      );
      setCategoriesWithSubcategories(categoriesData);

      if (!selectedMainCategory && categoriesData.length > 0) {
        const firstCategoryWithSubcategories = categoriesData.find(
          ({ subcategories }) => subcategories.length > 0,
        );
        if (firstCategoryWithSubcategories) {
          setSelectedMainCategory(firstCategoryWithSubcategories.category.id);
          setSelectedLevels([firstCategoryWithSubcategories.category.id, null, null, null, null, null]);
        }
      }
    };

    fetchAllSubcategories();
  }, [mainCategories]);

  // Get categories for a specific level
  // Level 0 shows subcategories of main category (selectedLevels[0])
  // Level 1 shows children of subcategory (selectedLevels[1])
  // Level 2 shows children of sub-subcategory (selectedLevels[2]), etc.
  const getCategoriesForLevel = (level: number): any[] => {
    // Level 0: Subcategories of selected main category
    if (level === 0) {
      const selectedCategory = categoriesWithSubcategoriesFiltered.find(
        ({ category }) => category.id === selectedLevels[0],
      );
      return selectedCategory?.subcategories || [];
    }

    // For deeper levels, find the category selected at this level and return its children
    const categoryId = selectedLevels[level];
    if (!categoryId) return [];

    // Find the main category
    const selectedCategory = categoriesWithSubcategoriesFiltered.find(
      ({ category }) => category.id === selectedLevels[0],
    );
    if (!selectedCategory) return [];

    // Check cache first
    const path = selectedLevels.slice(0, level + 1);
    const pathKey = path.join('-');
    if (loadedChildren.has(pathKey)) {
      return loadedChildren.get(pathKey) || [];
    }

    // Traverse the tree to find the category at this level
    let currentCategories = selectedCategory.subcategories;
    
    for (let i = 1; i <= level; i++) {
      const selectedId = selectedLevels[i];
      if (!selectedId) return [];
      
      const selectedItem = currentCategories.find((cat: any) => cat.id === selectedId);
      if (!selectedItem) {
        // Try cache for this level
        const cachePath = selectedLevels.slice(0, i + 1);
        const cacheKey = cachePath.join('-');
        if (loadedChildren.has(cacheKey)) {
          currentCategories = loadedChildren.get(cacheKey) || [];
          continue;
        }
        return [];
      }
      
      // If this is the target level, return its children
      if (i === level) {
        if (selectedItem.children && selectedItem.children.length > 0) {
          return selectedItem.children;
        }
        // Check cache
        if (loadedChildren.has(pathKey)) {
          return loadedChildren.get(pathKey) || [];
        }
        return [];
      }
      
      // Otherwise, continue traversing
      if (selectedItem.children && selectedItem.children.length > 0) {
        currentCategories = selectedItem.children;
      } else {
        // Check cache
        const cachePath = selectedLevels.slice(0, i + 1);
        const cacheKey = cachePath.join('-');
        if (loadedChildren.has(cacheKey)) {
          currentCategories = loadedChildren.get(cacheKey) || [];
        } else {
          return [];
        }
      }
    }

    return [];
  };

  // Handle category hover at a specific level (for categories with children)
  const handleCategoryHover = async (categoryId: number, level: number, category: any) => {
    const hasChildren =
      (category.children &&
        Array.isArray(category.children) &&
        category.children.length > 0) ||
      category.hasChildren ||
      (category._originalChildren &&
        Array.isArray(category._originalChildren) &&
        category._originalChildren.length > 0);

    if (!hasChildren) return;

    // Update selected levels - set this level and clear deeper levels
    const newSelectedLevels = [...selectedLevels];
    newSelectedLevels[level] = categoryId;
    // Clear all deeper levels
    for (let i = level + 1; i < 6; i++) {
      newSelectedLevels[i] = null;
    }
    setSelectedLevels(newSelectedLevels);

    // Fetch children if not already loaded
    const path = newSelectedLevels.slice(0, level + 1);
    const pathKey = path.join('-');
    
    if (!loadedChildren.has(pathKey)) {
      const originalChildren = category._originalChildren || [];
      const children = await fetchCategoryChildren(categoryId, originalChildren);
      
      // Store loaded children
      setLoadedChildren((prev) => {
        const newMap = new Map(prev);
        newMap.set(pathKey, children);
        return newMap;
      });

      // Update the category tree structure
      setCategoriesWithSubcategories((prev) =>
        prev.map((catItem) => {
          if (catItem.category.id === selectedLevels[0]) {
            const updateCategoryTree = (
              categories: any[],
              targetId: number,
              newChildren: any[],
              currentLevel: number,
              targetLevel: number,
              pathIds: number[],
            ): any[] => {
              if (currentLevel === targetLevel) {
                return categories.map((cat) =>
                  cat.id === targetId ? { ...cat, children: newChildren } : cat,
                );
              }
              const nextId = pathIds[currentLevel];
              if (!nextId) return categories;
              
              return categories.map((cat) => ({
                ...cat,
                children: updateCategoryTree(
                  cat.children || [],
                  targetId,
                  newChildren,
                  currentLevel + 1,
                  targetLevel,
                  pathIds,
                ),
              }));
            };

            const updatedSubcategories = updateCategoryTree(
              catItem.subcategories,
              categoryId,
              children,
              1,
              level,
              newSelectedLevels.slice(1, level + 1),
            );
            return { ...catItem, subcategories: updatedSubcategories };
          }
          return catItem;
        }),
      );
    }
  };

  // Handle category click (only for leaf categories)
  const handleCategoryClick = (categoryId: number) => {
    // Navigate to category page
    const url = `/trending?category=${categoryId}`;
    if (onCategorySelect) {
      onCategorySelect(categoryId);
    } else {
      router.push(url);
    }
  };

  // Handle main category hover (level 0)
  const handleMainCategoryHover = (categoryId: number) => {
    setSelectedMainCategory(categoryId);
    setSelectedLevels([categoryId, null, null, null, null, null]);
    setLoadedChildren(new Map());
  };

  // Mobile: Get current categories to display based on nav stack
  const getMobileCurrentCategories = (): { categories: any[]; level: number; title: string } => {
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
    
    if (!isMobile) {
      return { categories: [], level: -1, title: "" };
    }

    // If stack is empty, show main categories
    if (mobileNavStack.length === 0) {
      return {
        categories: categoriesWithSubcategoriesFiltered.map(({ category }) => category),
        level: 0,
        title: "Categories",
      };
    }

    // Get the last item in the stack
    const lastItem = mobileNavStack[mobileNavStack.length - 1];
    
    // Get categories for the next level (children of the last selected category)
    // The level parameter in getCategoriesForLevel represents which level's children to show
    // So if lastItem.level is 0, we want level 0's children (which are at level 1)
    // If lastItem.level is 1, we want level 1's children (which are at level 2)
    const categories = getCategoriesForLevel(lastItem.level);
    
    return {
      categories: categories || [],
      level: lastItem.level,
      title: lastItem.categoryName,
    };
  };

  // Mobile: Handle category selection (push to stack or navigate)
  const handleMobileCategoryClick = async (category: any, level: number) => {
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
    if (!isMobile) return;

    // For main categories (level 0), we need to check if they have subcategories
    if (level === 0) {
      // Find the category in categoriesWithSubcategoriesFiltered
      const categoryWithSubs = categoriesWithSubcategoriesFiltered.find(
        ({ category: cat }) => cat.id === category.id
      );
      
      if (categoryWithSubs && categoryWithSubs.subcategories.length > 0) {
        // Set as selected main category and load its children
        setSelectedMainCategory(category.id);
        setSelectedLevels([category.id, null, null, null, null, null]);
        setLoadedChildren(new Map());
        
        // Load first level children
        await handleCategoryHover(category.id, 0, category);
        
        // Push to navigation stack
        setMobileNavStack([
          {
            level: 0,
            categoryId: category.id,
            categoryName: category.name,
          },
        ]);
      } else {
        // No subcategories - navigate directly
        handleCategoryClick(category.id);
      }
      return;
    }

    // For subcategories (level > 0)
    const hasChildren =
      (category.children && Array.isArray(category.children) && category.children.length > 0) ||
      category.hasChildren ||
      (category._originalChildren && Array.isArray(category._originalChildren) && category._originalChildren.length > 0);

    if (hasChildren) {
      // Update selectedLevels to include this category
      const newSelectedLevels = [...selectedLevels];
      newSelectedLevels[level] = category.id;
      // Clear levels after this one
      for (let i = level + 1; i < newSelectedLevels.length; i++) {
        newSelectedLevels[i] = null;
      }
      setSelectedLevels(newSelectedLevels);
      
      // Load children if not already loaded
      await handleCategoryHover(category.id, level, category);
      
      // Push to navigation stack
      setMobileNavStack((prev) => [
        ...prev,
        {
          level: level,
          categoryId: category.id,
          categoryName: category.name,
        },
      ]);
    } else {
      // Leaf category - navigate
      handleCategoryClick(category.id);
    }
  };

  // Mobile: Handle back button
  const handleMobileBack = () => {
    setMobileNavStack((prev) => {
      const newStack = prev.slice(0, -1);
      
      // Update selectedLevels to match the new stack
      if (newStack.length === 0) {
        // Back to main categories - reset to initial state
        setSelectedMainCategory(null);
        setSelectedLevels([null, null, null, null, null, null]);
        setLoadedChildren(new Map());
      } else {
        // Update to the level before the last
        const lastItem = newStack[newStack.length - 1];
        const newSelectedLevels = [...selectedLevels];
        // Clear levels after the current one
        for (let i = lastItem.level + 2; i < newSelectedLevels.length; i++) {
          newSelectedLevels[i] = null;
        }
        setSelectedLevels(newSelectedLevels);
      }
      
      return newStack;
    });
  };

  // Listen for open/close events from header (for hover-based opening)
  useEffect(() => {
    const handleOpenCategorySidebar = () => {
      setIsHovered(true);
    };

    const handleCloseCategorySidebar = () => {
      setIsHovered(false);
    };

    window.addEventListener("openCategorySidebar", handleOpenCategorySidebar);
    window.addEventListener("closeCategorySidebar", handleCloseCategorySidebar);

    return () => {
      window.removeEventListener("openCategorySidebar", handleOpenCategorySidebar);
      window.removeEventListener("closeCategorySidebar", handleCloseCategorySidebar);
    };
  }, []);

  // Show sidebar when hovered or explicitly opened
  const shouldShow = isOpen || isHovered;

  // Reset isHovered when drawer closes (from any source)
  useEffect(() => {
    if (!shouldShow) {
      setIsHovered(false);
    }
  }, [shouldShow]);

  // Dispatch close event when isOpen becomes false (to sync header button state)
  useEffect(() => {
    if (!isOpen && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("closeCategorySidebar"));
    }
  }, [isOpen]);

  // Reset mobile nav stack when sidebar closes
  useEffect(() => {
    if (!shouldShow) {
      setMobileNavStack([]);
    }
  }, [shouldShow]);

  useEffect(() => {
    if (shouldShow) {
      setHasBeenShown(true);
    }
  }, [shouldShow]);

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (shouldShow) {
      // Prevent body scroll
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [shouldShow]);

  if (!hasBeenShown && !shouldShow) return null;

  // Scrollable main category column component
  const ScrollableMainColumn: React.FC<{
    children: React.ReactNode;
  }> = ({ children }) => {
    const [isScrolling, setIsScrolling] = useState(false);
    const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const columnRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const column = columnRef.current;
      if (!column) return;

      const handleScroll = () => {
        setIsScrolling(true);
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
        scrollTimeoutRef.current = setTimeout(() => {
          setIsScrolling(false);
        }, 1000);
      };

      column.addEventListener('scroll', handleScroll);
      return () => {
        column.removeEventListener('scroll', handleScroll);
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
      };
    }, []);

    return (
      <div
        ref={columnRef}
        className={cn(
          "flex-shrink-0 h-full overflow-y-auto bg-gray-50 border-r border-gray-200 custom-scrollbar",
          "w-[180px] sm:w-[200px] md:w-[240px]",
          isScrolling && "scrolling"
        )}
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'transparent transparent',
        }}
        onWheel={(e) => {
          // Ensure scroll works smoothly
          const element = columnRef.current;
          if (element) {
            const { scrollTop, scrollHeight, clientHeight } = element;
            const canScrollUp = scrollTop > 0;
            const canScrollDown = scrollTop < scrollHeight - clientHeight - 1;
            
            // Only prevent default if at boundary
            if ((e.deltaY < 0 && !canScrollUp) || (e.deltaY > 0 && !canScrollDown)) {
              e.preventDefault();
            }
            e.stopPropagation();
          }
        }}
      >
        {children}
      </div>
    );
  };

  // Scrollable horizontal container component
  const ScrollableHorizontalContainer: React.FC<{
    children: React.ReactNode;
  }> = ({ children }) => {
    const [isScrolling, setIsScrolling] = useState(false);
    const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const handleScroll = () => {
        setIsScrolling(true);
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
        scrollTimeoutRef.current = setTimeout(() => {
          setIsScrolling(false);
        }, 1000);
      };

      container.addEventListener('scroll', handleScroll);
      return () => {
        container.removeEventListener('scroll', handleScroll);
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
      };
    }, []);

    return (
      <div
        ref={containerRef}
        className={cn(
          "flex-1 flex overflow-x-auto min-w-0 h-full custom-scrollbar",
          isScrolling && "scrolling"
        )}
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'transparent transparent',
        }}
      >
        {children}
      </div>
    );
  };

  // Scrollable column component
  const ScrollableColumn: React.FC<{
    level: number;
    title: string;
    categories: any[];
    selectedId: number | null;
    onCategoryHover: (categoryId: number, category: any) => void;
    onCategoryClick: (categoryId: number) => void;
  }> = ({ level, title, categories, selectedId, onCategoryHover, onCategoryClick }) => {
    const [isScrolling, setIsScrolling] = useState(false);
    const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const columnRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const column = columnRef.current;
      if (!column) return;

      const handleScroll = () => {
        setIsScrolling(true);
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
        scrollTimeoutRef.current = setTimeout(() => {
          setIsScrolling(false);
        }, 1000);
      };

      column.addEventListener('scroll', handleScroll);
      return () => {
        column.removeEventListener('scroll', handleScroll);
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
      };
    }, []);

    return (
      <div
        ref={columnRef}
        className={cn(
          "flex-shrink-0 h-full overflow-y-auto border-r border-gray-200 bg-white custom-scrollbar",
          "w-[180px] sm:w-[200px] md:w-[240px]",
          isScrolling && "scrolling"
        )}
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'transparent transparent',
        }}
        onWheel={(e) => {
          // Ensure smooth scrolling
          const element = columnRef.current;
          if (element) {
            const { scrollTop, scrollHeight, clientHeight } = element;
            const canScrollUp = scrollTop > 0;
            const canScrollDown = scrollTop < scrollHeight - clientHeight - 1;
            
            // Only prevent default if at boundary to allow natural scroll behavior
            if ((e.deltaY < 0 && !canScrollUp) || (e.deltaY > 0 && !canScrollDown)) {
              e.preventDefault();
            }
            // Stop propagation to prevent body scroll
            e.stopPropagation();
          }
        }}
      >
        <div className="p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 sticky top-0 bg-white pb-2 border-b border-gray-200 z-10 -mx-4 -mt-4 px-4 pt-4">
            {translate(title)}
          </h3>
          <div className="space-y-1">
            {categories.map((item: any) => {
              const isSelected = selectedId === item.id;
              const hasChildren =
                (item.children &&
                  Array.isArray(item.children) &&
                  item.children.length > 0) ||
                item.hasChildren ||
                (item._originalChildren &&
                  Array.isArray(item._originalChildren) &&
                  item._originalChildren.length > 0);

              return (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                    hasChildren ? "cursor-default" : "cursor-pointer",
                    isSelected
                      ? "bg-blue-50 text-blue-700 font-medium border border-blue-200"
                      : "hover:bg-gray-50 text-gray-700",
                  )}
                  onMouseEnter={(e) => {
                    // Only use hover on desktop
                    if (window.innerWidth >= 768 && hasChildren) {
                      const timeoutId = setTimeout(() => {
                        onCategoryHover(item.id, item);
                      }, 200);
                      (e.currentTarget as any)._hoverTimeout = timeoutId;
                    }
                  }}
                  onMouseLeave={(e) => {
                    // Only use hover on desktop
                    if (window.innerWidth >= 768) {
                      const target = e.currentTarget as any;
                      if (target._hoverTimeout) {
                        clearTimeout(target._hoverTimeout);
                        target._hoverTimeout = null;
                      }
                    }
                  }}
                  onClick={() => {
                    if (hasChildren) {
                      // On mobile, clicking a category with children should navigate to it
                      if (window.innerWidth < 768) {
                        onCategoryHover(item.id, item);
                      }
                    } else {
                      onCategoryClick(item.id);
                    }
                  }}
                  onWheel={(e) => {
                    // Clear any pending hover when scrolling
                    const target = e.currentTarget as any;
                    if (target._hoverTimeout) {
                      clearTimeout(target._hoverTimeout);
                      target._hoverTimeout = null;
                    }
                    // Allow scroll to work - don't stop propagation so parent can handle it
                  }}
                >
                  {item.icon ? (
                    <img
                      src={item.icon}
                      alt={item.name}
                      height={20}
                      width={20}
                      className="object-contain flex-shrink-0"
                    />
                  ) : (
                    <div className="h-5 w-5 flex-shrink-0 rounded bg-gray-200" />
                  )}
                  <span className="text-sm flex-1 text-left line-clamp-1">
                    {translate(item.name)}
                  </span>
                  {hasChildren && (
                    <svg
                      className="w-4 h-4 text-gray-400 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Render a category column
  const renderCategoryColumn = (level: number, title: string) => {
    const categories = getCategoriesForLevel(level);
    if (categories.length === 0) return null;

    const selectedId = selectedLevels[level + 1];

    return (
      <ScrollableColumn
        key={level}
        level={level}
        title={title}
        categories={categories}
        selectedId={selectedId}
        onCategoryHover={(categoryId, category) => handleCategoryHover(categoryId, level + 1, category)}
        onCategoryClick={handleCategoryClick}
      />
    );
  };

  // Get title for a column based on selected category
  const getColumnTitle = (level: number): string => {
    if (level === 0) {
      // Show the main category name for level 0
      const selectedCategory = categoriesWithSubcategoriesFiltered.find(
        ({ category }) => category.id === selectedLevels[0],
      );
      return translate(selectedCategory?.category.name) || t("categories");
    }
    
    // For deeper levels, show the parent category name (the one selected at the previous level)
    const prevLevel = level - 1;
    const selectedId = selectedLevels[prevLevel + 1];
    if (!selectedId) return `Level ${level + 1}`;
    
    const categories = getCategoriesForLevel(prevLevel);
    const selectedCategory = categories.find((c: any) => c.id === selectedId);
    return translate(selectedCategory?.name) || `Level ${level + 1}`;
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-[90] bg-black/30 transition-opacity duration-500",
          shouldShow
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        )}
        onClick={(e) => {
          // Only close if clicking directly on backdrop, not on children
          // Check if the click target is the backdrop itself
          if (e.target === e.currentTarget) {
            // Close on backdrop click
            onClose();
          }
        }}
        // Disabled: Remove auto-close on mouse leave
        // onMouseEnter={() => {
        //   // Only use hover on desktop
        //   if (window.innerWidth >= 768) {
        //     setIsHovered(false);
        //   }
        // }}
        onTouchStart={(e) => {
          // Close on touch for mobile
          if (window.innerWidth < 768) {
            onClose();
          }
        }}
      />

      {/* Category Dropdown Panel */}
      <div
        ref={containerRef}
        className={cn(
          "fixed right-0 left-0 z-[100] bg-white shadow-2xl",
          "transition-all duration-500 ease-out",
          // Mobile: full screen height, Desktop: fixed height
          "h-[calc(100vh-var(--header-height,116px))] md:h-[400px]",
          shouldShow
            ? "pointer-events-auto translate-y-0 scale-y-100 opacity-100"
            : "pointer-events-none -translate-y-8 scale-y-95 opacity-0",
        )}
        style={{
          top: `${headerHeight}px`,
          transformOrigin: "top center",
          "--header-height": `${headerHeight}px`,
        } as React.CSSProperties & { "--header-height": string }}
        onClick={(e) => {
          // Prevent clicks inside the panel from bubbling to backdrop
          e.stopPropagation();
        }}
        onMouseEnter={() => {
          // Only use hover on desktop
          if (window.innerWidth >= 768) {
            setIsHovered(true);
          }
        }}
        // Disabled: Remove auto-close on mouse leave
        // onMouseLeave={() => {
        //   // Only use hover on desktop
        //   if (window.innerWidth >= 768) {
        //     setIsHovered(false);
        //   }
        // }}
        onWheel={(e) => {
          // Prevent scroll propagation to body when scrolling within sidebar
          const target = e.currentTarget;
          const scrollableElement = (e.target as HTMLElement).closest('.custom-scrollbar') as HTMLElement;
          
          if (scrollableElement) {
            const { scrollTop, scrollHeight, clientHeight } = scrollableElement;
            const { scrollLeft, scrollWidth, clientWidth } = scrollableElement;
            
            // Check if we can scroll in the direction of the wheel event
            const canScrollUp = scrollTop > 0;
            const canScrollDown = scrollTop < scrollHeight - clientHeight;
            const canScrollLeft = scrollLeft > 0;
            const canScrollRight = scrollLeft < scrollWidth - clientWidth;
            
            // Only prevent default if we're at the boundary and trying to scroll further
            if (e.deltaY < 0 && !canScrollUp) {
              e.preventDefault();
              e.stopPropagation();
            } else if (e.deltaY > 0 && !canScrollDown) {
              e.preventDefault();
              e.stopPropagation();
            } else if (e.deltaX < 0 && !canScrollLeft) {
              e.preventDefault();
              e.stopPropagation();
            } else if (e.deltaX > 0 && !canScrollRight) {
              e.preventDefault();
              e.stopPropagation();
            } else {
              // Prevent propagation to body when scrolling within sidebar
              e.stopPropagation();
            }
          } else {
            // If not scrolling a scrollable element, prevent propagation
            e.stopPropagation();
          }
        }}
        onTouchMove={(e) => {
          // Prevent touch scroll propagation to body
          e.stopPropagation();
        }}
        dir={langDir}
      >
        <div className="relative flex h-full w-full items-start justify-start bg-white">
          {/* Mobile View - Drill-down navigation */}
          <div className="md:hidden flex flex-col h-full w-full">
            {/* Header with Back Button and Close Icon */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
              {mobileNavStack.length > 0 ? (
                <button
                  onClick={handleMobileBack}
                  className={cn(
                    "flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors",
                    langDir === "rtl" ? "flex-row-reverse" : ""
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
                <div></div>
              )}
            </div>

            {/* Category Name Section */}
            {mobileNavStack.length > 0 && (
              <div className="px-4 py-3 border-b border-gray-200 bg-white">
                <span className="text-base font-semibold text-gray-900">
                  {translate(mobileNavStack[mobileNavStack.length - 1].categoryName)}
                </span>
              </div>
            )}

            {/* Current Level Categories */}
            <div className="flex-1 overflow-y-auto">
              <div className="py-2">
                {(() => {
                  const { categories, title } = getMobileCurrentCategories();
                  
                  return categories.map((category: any) => {
                    const hasChildren =
                      (category.children && Array.isArray(category.children) && category.children.length > 0) ||
                      category.hasChildren ||
                      (category._originalChildren && Array.isArray(category._originalChildren) && category._originalChildren.length > 0);

                    return (
                      <div
                        key={category.id}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 mx-2 rounded-md transition-colors cursor-pointer",
                          "hover:bg-gray-50 active:bg-gray-100"
                        )}
                        onClick={() => {
                          // Calculate the level of the categories being shown
                          // If stack is empty, we're showing main categories (level 0)
                          // If stack has items, we're showing children of the last item (at lastItem.level + 1)
                          const categoryLevel = mobileNavStack.length === 0 
                            ? 0 
                            : (mobileNavStack[mobileNavStack.length - 1].level + 1);
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
                          <div className="h-6 w-6 flex-shrink-0 rounded bg-gray-200" />
                        )}
                        <span className="text-base flex-1 text-left text-gray-900">
                          {translate(category.name)}
                        </span>
                        {hasChildren && (
                          <ChevronLeft className={cn("h-5 w-5 text-gray-400 flex-shrink-0", langDir === "rtl" ? "" : "rotate-180")} />
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>

          {/* Desktop View - Multi-column layout */}
          <div className="hidden md:flex h-full w-full relative">
            {/* Column 1: Main Categories (Left Sidebar) */}
            {categoriesWithSubcategoriesFiltered.length > 0 && (
              <ScrollableMainColumn>
                <div className="py-2">
                  {categoriesWithSubcategoriesFiltered.map(
                    ({ category }) => {
                      const isMainActive = selectedLevels[0] === category.id;

                      return (
                        <div
                          key={category.id}
                          className={cn(
                            "flex cursor-pointer items-center gap-x-3 px-4 py-3 transition-colors",
                            {
                              "bg-white border-r-2 border-blue-600": isMainActive,
                              "hover:bg-gray-100": !isMainActive,
                            },
                          )}
                          onMouseEnter={() => {
                            handleMainCategoryHover(category.id);
                          }}
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
                            <div className="h-5 w-5 flex-shrink-0 rounded bg-gray-200" />
                          )}
                          <span
                            className={cn(
                              "text-sm flex-1 text-left",
                              isMainActive
                                ? "text-gray-900 font-medium"
                                : "text-gray-700",
                            )}
                          >
                            {translate(category.name)}
                          </span>
                        </div>
                      );
                    },
                  )}
                </div>
              </ScrollableMainColumn>
            )}

            {/* Columns 2-6: Subcategories (Dynamic Columns) */}
            <ScrollableHorizontalContainer>
              {selectedLevels[0] && renderCategoryColumn(0, getColumnTitle(0))}
              {selectedLevels[1] && renderCategoryColumn(1, getColumnTitle(1))}
              {selectedLevels[2] && renderCategoryColumn(2, getColumnTitle(2))}
              {selectedLevels[3] && renderCategoryColumn(3, getColumnTitle(3))}
              {selectedLevels[4] && renderCategoryColumn(4, getColumnTitle(4))}
              {selectedLevels[5] && renderCategoryColumn(5, getColumnTitle(5))}
            </ScrollableHorizontalContainer>
          </div>
        </div>
      </div>
    </>
  );
};

export default CategorySidebar;
