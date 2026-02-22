import React, { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { MdOutlineImageNotSupported } from "react-icons/md";
import { useCategory } from "@/apis/queries/category.queries";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { PRODUCT_CATEGORY_ID } from "@/utils/constants";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useCategoryStore } from "@/lib/categoryStore";
import { ChevronRight, ChevronDown, Sparkles, ArrowRight, Grid3X3, Layers, ShoppingBag, Star, TrendingUp, Zap, Heart } from "lucide-react";

type CategoryProps = {
  id: number;
  parentId: number;
  name: string;
  icon: string;
  children: any;
};

type TrendingCategoriesProps = {
  onCategorySelect?: (categoryId: number, categoryName: string) => void;
};

const TrendingCategories: React.FC<TrendingCategoriesProps> = ({
  onCategorySelect,
}) => {
  const t = useTranslations();
  const { langDir } = useAuth();
  const router = useRouter();
  const categoryStore = useCategoryStore();
  
  // State for managing expanded categories
  const [expandedMainCategory, setExpandedMainCategory] = useState<number | null>(null);
  const [expandedSubCategory, setExpandedSubCategory] = useState<number | null>(null);

  // Fetch main categories
  const mainCategoriesQuery = useCategory(PRODUCT_CATEGORY_ID.toString());
  
  const mainCategories = useMemo(() => {
    return mainCategoriesQuery?.data?.data?.children || [];
  }, [mainCategoriesQuery?.data?.data]);

  // Handle main category click
  const handleMainCategoryClick = (category: CategoryProps) => {
    // Only expand if category has children
    if (!category.children || category.children.length === 0) {
      return;
    }
    
    if (expandedMainCategory === category.id) {
      setExpandedMainCategory(null);
      setExpandedSubCategory(null);
    } else {
      setExpandedMainCategory(category.id);
      setExpandedSubCategory(null);
    }
  };

  // Handle sub category click
  const handleSubCategoryClick = (subCategory: CategoryProps, mainCategory: CategoryProps) => {
    // Only expand if subcategory has children
    if (!subCategory.children || subCategory.children.length === 0) {
      return;
    }
    
    if (expandedSubCategory === subCategory.id) {
      setExpandedSubCategory(null);
    } else {
      setExpandedSubCategory(subCategory.id);
    }
  };

  // Handle category selection and navigation
  const handleCategorySelect = (category: CategoryProps, level: 'main' | 'sub' | 'subsub', parentCategory?: CategoryProps) => {
    if (onCategorySelect) {
      onCategorySelect(category.id, category.name);
      return;
    }

    // Navigate to trending page with category selection
    const subCategoryIndex = mainCategories.findIndex(
      (item: any) => item.id === (level === 'main' ? category.id : parentCategory?.id)
    );
    
    const mainCategoryItem = mainCategories.find(
      (item: any) => item.id === (level === 'main' ? category.id : parentCategory?.id)
    );

    if (level === 'main') {
      // Main category selected
      categoryStore.setSubCategories(mainCategoryItem?.children || []);
      categoryStore.setCategoryId(category.id.toString());
      categoryStore.setSubCategoryIndex(subCategoryIndex);
      categoryStore.setSubCategoryParentName(category.name);
      categoryStore.setSubSubCategoryParentName(mainCategoryItem?.children?.[0]?.name || '');
      categoryStore.setSubSubCategories(mainCategoryItem?.children?.[0]?.children || []);
      categoryStore.setSecondLevelCategoryIndex(0);
      categoryStore.setCategoryIds(category.id.toString());
    } else if (level === 'sub') {
      // Sub category selected
      categoryStore.setSubCategories(mainCategoryItem?.children || []);
      categoryStore.setCategoryId(category.id.toString());
      categoryStore.setSubCategoryIndex(subCategoryIndex);
      categoryStore.setSubCategoryParentName(mainCategoryItem?.name || '');
      categoryStore.setSubSubCategoryParentName(category.name);
      categoryStore.setSubSubCategories(category.children || []);
      categoryStore.setSecondLevelCategoryIndex(
        mainCategoryItem?.children?.findIndex((item: any) => item.id === category.id) || 0
      );
      categoryStore.setCategoryIds(category.id.toString());
    } else if (level === 'subsub') {
      // Sub-sub category selected
      const subCategoryItem = mainCategoryItem?.children?.find((item: any) => item.id === parentCategory?.id);
      categoryStore.setSubCategories(mainCategoryItem?.children || []);
      categoryStore.setCategoryId(category.id.toString());
      categoryStore.setSubCategoryIndex(subCategoryIndex);
      categoryStore.setSubCategoryParentName(mainCategoryItem?.name || '');
      categoryStore.setSubSubCategoryParentName(subCategoryItem?.name || '');
      categoryStore.setSubSubCategories(subCategoryItem?.children || []);
      categoryStore.setSecondLevelCategoryIndex(
        mainCategoryItem?.children?.findIndex((item: any) => item.id === parentCategory?.id) || 0
      );
      categoryStore.setCategoryIds(category.id.toString());
    }

    router.push("/trending");
  };

  // Render category background image
  const renderCategoryBackground = (category: CategoryProps) => {
    if (category.icon) {
      return (
        <Image
          src={category.icon}
          alt={category.name}
          fill
          className="object-cover transition-all duration-500 group-hover:scale-110"
        />
      );
    }
    return null;
  };

  // Render category icon for smaller cards
  const renderCategoryIcon = (category: CategoryProps) => {
    if (category.icon) {
      return (
        <Image
          src={category.icon}
          alt={category.name}
          width={32}
          height={32}
          className="h-8 w-8 object-contain"
        />
      );
    }
    return (
      <MdOutlineImageNotSupported className="h-8 w-8 text-muted-foreground" />
    );
  };

  if (mainCategoriesQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary"></div>
      </div>
    );
  }

  if (mainCategoriesQuery.isError || !mainCategories.length) {
    return (
      <div className="text-center py-8 text-muted-foreground" translate="no">
        {t("no_categories_available")}
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Custom CSS for hiding scrollbars */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .category-card {
          animation: fadeInUp 0.5s ease-out forwards;
          opacity: 0;
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      {/* Main Categories */}
      <div className="space-y-6 sm:space-y-8">
        <div className="relative">
          {/* Desktop Grid Layout */}
          <div className="hidden lg:grid lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {mainCategories.map((category: CategoryProps, index: number) => (
              <button
                key={category.id}
                onClick={() => handleMainCategoryClick(category)}
                className={cn(
                  "category-card group relative overflow-hidden rounded-2xl bg-card text-center transition-all duration-300 h-40 shadow-md border border-border",
                  category.children && category.children.length > 0 
                    ? "hover:shadow-xl hover:-translate-y-1 cursor-pointer" 
                    : "cursor-default opacity-75"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Background Image */}
                <div className="absolute inset-0 rounded-2xl overflow-hidden">
                  {renderCategoryBackground(category)}
                  <div className="absolute inset-0 bg-black/50 group-hover:bg-black/40 transition-colors duration-300" />
                </div>
                
                {/* Content */}
                <div className="relative z-10 h-full flex flex-col justify-end p-5 text-white">
                  <h3 className="text-base font-bold mb-2 drop-shadow-lg text-white group-hover:scale-105 transition-transform duration-300" data-dynamic="true">
                    {category.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3 drop-shadow-sm" translate="no">
                    {category.children?.length || 0} {t("subcategories")}
                  </p>
                  
                  {category.children && category.children.length > 0 && (
                    <div className="flex justify-center">
                      <div className="rounded-full p-1.5 bg-card/20 text-white backdrop-blur-sm group-hover:bg-card/30 transition-colors">
                        {expandedMainCategory === category.id ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Mobile/Tablet Horizontal Scroll */}
          <div className="lg:hidden relative">
            {/* Scroll Indicators */}
            {mainCategories.length > 2 && (
              <>
                <div className="absolute left-0 top-1/2 -translate-y-1/2 z-20 pointer-events-none">
                  <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full bg-card/90 shadow-lg">
                    <ChevronRight className="h-5 w-5 text-muted-foreground rotate-180" />
                  </div>
                </div>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 z-20 pointer-events-none">
                  <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full bg-card/90 shadow-lg">
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </>
            )}

            {/* Scrollable Container */}
            <div 
              id="main-categories-scroll"
              className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 scroll-smooth scrollbar-hide snap-x snap-mandatory"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {mainCategories.map((category: CategoryProps, index: number) => (
                <button
                  key={category.id}
                  onClick={() => handleMainCategoryClick(category)}
                  className={cn(
                    "category-card group relative shrink-0 snap-start overflow-hidden rounded-2xl bg-card text-center transition-all duration-300 shadow-md border border-border",
                    "w-40 h-32 sm:w-48 sm:h-36",
                    category.children && category.children.length > 0 
                      ? "active:scale-95 cursor-pointer" 
                      : "cursor-default opacity-75"
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Background Image */}
                  <div className="absolute inset-0 rounded-2xl overflow-hidden">
                    {renderCategoryBackground(category)}
                    <div className="absolute inset-0 bg-black/50 active:bg-black/60 transition-colors duration-200" />
                  </div>
                  
                  {/* Content */}
                  <div className="relative z-10 h-full flex flex-col justify-end p-3 sm:p-4 text-white">
                    <h3 className="text-xs sm:text-sm font-bold mb-1 sm:mb-2 drop-shadow-lg text-white line-clamp-2" data-dynamic="true">
                      {category.name}
                    </h3>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mb-2 drop-shadow-sm" translate="no">
                      {category.children?.length || 0} {t("subcategories")}
                    </p>
                    
                    {category.children && category.children.length > 0 && (
                      <div className="flex justify-center">
                        <div className="rounded-full p-1 bg-card/20 text-white backdrop-blur-sm">
                          {expandedMainCategory === category.id ? (
                            <ChevronDown className="h-3 w-3" />
                          ) : (
                            <ChevronRight className="h-3 w-3" />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sub Categories - Show when main category is expanded */}
      {expandedMainCategory && (
        <div className="mt-8 sm:mt-12 animate-in slide-in-from-top-4 duration-700">
          <div className="mb-6 sm:mb-8 flex justify-center">
            <div className="inline-flex items-center gap-2 sm:gap-3 rounded-xl bg-primary/5 border border-primary/10 px-4 sm:px-6 py-2 sm:py-3 shadow-sm">
              <div className="rounded-full bg-primary p-1.5 sm:p-2">
                <Grid3X3 className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div className="text-left">
                <h4 className="text-sm sm:text-lg font-bold text-foreground" data-dynamic="true">
                  {mainCategories.find((cat: any) => cat.id === expandedMainCategory)?.name}
                </h4>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpandedMainCategory(null)}
                className="ml-1 sm:ml-2 rounded-full bg-card/70 hover:bg-card text-muted-foreground hover:text-foreground h-7 w-7 sm:h-8 sm:w-8 p-0 transition-all"
              >
                <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </div>
          
          {/* Desktop Grid for Subcategories */}
          <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-4">
            {mainCategories
              .find((cat: any) => cat.id === expandedMainCategory)
              ?.children?.map((subCategory: CategoryProps, index: number) => (
                <button
                  key={subCategory.id}
                  onClick={() => handleSubCategoryClick(subCategory, mainCategories.find((cat: any) => cat.id === expandedMainCategory)!)}
                  className={cn(
                    "category-card group relative overflow-hidden rounded-xl bg-card text-center transition-all duration-300 h-28 lg:h-32 shadow-md border border-border",
                    subCategory.children && subCategory.children.length > 0 
                      ? "hover:shadow-lg hover:-translate-y-0.5 cursor-pointer" 
                      : "cursor-default opacity-75"
                  )}
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <div className="absolute inset-0 rounded-xl overflow-hidden">
                    {renderCategoryBackground(subCategory)}
                    <div className="absolute inset-0 bg-black/60 group-hover:bg-black/50 transition-colors duration-300" />
                  </div>
                  
                  <div className="relative z-10 h-full flex flex-col justify-end p-3 text-white">
                    <h4 className="text-xs lg:text-sm font-semibold mb-2 drop-shadow-lg text-white line-clamp-2" data-dynamic="true">
                      {subCategory.name}
                    </h4>
                    
                    {subCategory.children && subCategory.children.length > 0 && (
                      <div className="flex justify-center">
                        <div className="rounded-full p-1 bg-card/20 text-white backdrop-blur-sm group-hover:bg-card/30 transition-colors">
                          {expandedSubCategory === subCategory.id ? (
                            <ChevronDown className="h-3 w-3" />
                          ) : (
                            <ChevronRight className="h-3 w-3" />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </button>
              ))}
          </div>

          {/* Mobile Horizontal Scroll for Subcategories */}
          <div className="md:hidden relative">
            <div 
              id="sub-categories-scroll"
              className="flex gap-3 overflow-x-auto pb-4 scroll-smooth scrollbar-hide snap-x snap-mandatory"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {mainCategories
                .find((cat: any) => cat.id === expandedMainCategory)
                ?.children?.map((subCategory: CategoryProps, index: number) => (
                  <button
                    key={subCategory.id}
                    onClick={() => handleSubCategoryClick(subCategory, mainCategories.find((cat: any) => cat.id === expandedMainCategory)!)}
                    className={cn(
                      "category-card group relative shrink-0 snap-start overflow-hidden rounded-xl bg-card text-center transition-all duration-300 shadow-md border border-border",
                      "w-32 h-24 sm:w-36 sm:h-28",
                      subCategory.children && subCategory.children.length > 0 
                        ? "active:scale-95 cursor-pointer" 
                        : "cursor-default opacity-75"
                    )}
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <div className="absolute inset-0 rounded-xl overflow-hidden">
                      {renderCategoryBackground(subCategory)}
                      <div className="absolute inset-0 bg-black/60 active:bg-black/70 transition-colors duration-200" />
                    </div>
                    
                    <div className="relative z-10 h-full flex flex-col justify-end p-3 text-white">
                        <h4 className="text-xs font-semibold mb-2 drop-shadow-lg text-white line-clamp-2" data-dynamic="true">
                          {subCategory.name}
                        </h4>
                      
                      {subCategory.children && subCategory.children.length > 0 && (
                        <div className="flex justify-center">
                          <div className="rounded-full p-0.5 bg-card/20 text-white backdrop-blur-sm">
                            {expandedSubCategory === subCategory.id ? (
                              <ChevronDown className="h-2.5 w-2.5" />
                            ) : (
                              <ChevronRight className="h-2.5 w-2.5" />
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Sub-Sub Categories - Show when sub category is expanded */}
      {expandedSubCategory && (
        <div className="mt-6 sm:mt-8 animate-in slide-in-from-top-4 duration-500">
          <div className="mb-4 sm:mb-6 flex justify-center">
            <div className="inline-flex items-center gap-2 sm:gap-3 rounded-xl bg-info/5 border border-info/10 px-4 sm:px-6 py-2 sm:py-3 shadow-sm">
              <div className="rounded-full bg-info p-1.5 sm:p-2">
                <Layers className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div className="text-left">
                <h4 className="text-sm sm:text-lg font-bold text-foreground" data-dynamic="true">
                  {mainCategories
                    .find((cat: any) => cat.id === expandedMainCategory)
                    ?.children?.find((sub: any) => sub.id === expandedSubCategory)?.name}
                </h4>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpandedSubCategory(null)}
                className="ml-1 sm:ml-2 rounded-full bg-card/70 hover:bg-card text-muted-foreground hover:text-foreground h-7 w-7 sm:h-8 sm:w-8 p-0 transition-all"
              >
                <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </div>
          
          {/* Desktop Grid for Sub-Sub Categories */}
          <div className="hidden sm:grid sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2 lg:gap-3">
            {mainCategories
              .find((cat: any) => cat.id === expandedMainCategory)
              ?.children?.find((sub: any) => sub.id === expandedSubCategory)
              ?.children?.map((subSubCategory: CategoryProps, index: number) => (
                <button
                  key={subSubCategory.id}
                  onClick={() => handleCategorySelect(
                    subSubCategory, 
                    'subsub', 
                    mainCategories
                      .find((cat: any) => cat.id === expandedMainCategory)
                      ?.children?.find((sub: any) => sub.id === expandedSubCategory)
                  )}
                  className="category-card group relative overflow-hidden rounded-lg bg-card text-center shadow-md border border-border transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 h-20 lg:h-24"
                  style={{ animationDelay: `${index * 20}ms` }}
                >
                  <div className="absolute inset-0 rounded-lg overflow-hidden">
                    {renderCategoryBackground(subSubCategory)}
                    <div className="absolute inset-0 bg-black/60 group-hover:bg-black/50 transition-colors duration-300" />
                  </div>
                  
                  <div className="relative z-10 h-full flex flex-col justify-end p-2 text-white">
                    <h5 className="text-[10px] lg:text-xs font-medium text-white drop-shadow-lg line-clamp-2" data-dynamic="true">
                      {subSubCategory.name}
                    </h5>
                  </div>
                </button>
              ))}
          </div>

          {/* Mobile Horizontal Scroll for Sub-Sub Categories */}
          <div className="sm:hidden relative">
            <div 
              id="sub-sub-categories-scroll"
              className="flex gap-2 overflow-x-auto pb-4 scroll-smooth scrollbar-hide snap-x snap-mandatory"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {mainCategories
                .find((cat: any) => cat.id === expandedMainCategory)
                ?.children?.find((sub: any) => sub.id === expandedSubCategory)
                ?.children?.map((subSubCategory: CategoryProps, index: number) => (
                  <button
                    key={subSubCategory.id}
                    onClick={() => handleCategorySelect(
                      subSubCategory, 
                      'subsub', 
                      mainCategories
                        .find((cat: any) => cat.id === expandedMainCategory)
                        ?.children?.find((sub: any) => sub.id === expandedSubCategory)
                    )}
                    className="category-card group relative shrink-0 snap-start overflow-hidden rounded-lg bg-card text-center shadow-md border border-border transition-all duration-300 active:scale-95 w-24 h-20"
                    style={{ animationDelay: `${index * 20}ms` }}
                  >
                    <div className="absolute inset-0 rounded-lg overflow-hidden">
                      {renderCategoryBackground(subSubCategory)}
                      <div className="absolute inset-0 bg-black/60 active:bg-black/70 transition-colors duration-200" />
                    </div>
                    
                    <div className="relative z-10 h-full flex flex-col justify-end p-2 text-white">
                        <h5 className="text-[10px] font-medium text-white drop-shadow-lg line-clamp-2" data-dynamic="true">
                          {subSubCategory.name}
                        </h5>
                    </div>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrendingCategories;
