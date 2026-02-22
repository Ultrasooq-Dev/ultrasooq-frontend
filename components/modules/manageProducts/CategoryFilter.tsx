import React, { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { MdOutlineImageNotSupported } from "react-icons/md";
import { useCategory } from "@/apis/queries/category.queries";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { PRODUCT_CATEGORY_ID } from "@/utils/constants";
import { Button } from "@/components/ui/button";

type CategoryProps = {
  id: number;
  parentId: number;
  name: string;
  icon: string;
  children: any;
};

type CategoryFilterProps = {
  selectedCategoryIds: number[];
  onCategoryChange: (categoryIds: number[]) => void;
  onClear: () => void;
};

const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategoryIds,
  onCategoryChange,
  onClear,
}) => {
  const t = useTranslations();
  const { langDir } = useAuth();
  
  // State for managing category selection
  const [selectedMainCategories, setSelectedMainCategories] = useState<CategoryProps[]>([]);
  const [selectedSubCategories, setSelectedSubCategories] = useState<CategoryProps[]>([]);
  const [selectedSubSubCategories, setSelectedSubSubCategories] = useState<CategoryProps[]>([]);
  
  // State for tracking which categories are expanded
  const [expandedMainCategory, setExpandedMainCategory] = useState<number | null>(null);
  const [expandedSubCategory, setExpandedSubCategory] = useState<number | null>(null);
  
  // State for tracking which category hierarchy to show (when any category is selected)
  const [focusedMainCategory, setFocusedMainCategory] = useState<number | null>(null);
  const [focusedSubCategory, setFocusedSubCategory] = useState<number | null>(null);

  // Fetch main categories
  const mainCategoriesQuery = useCategory(PRODUCT_CATEGORY_ID.toString());
  
  // Fetch subcategories when a main category is selected
  const subCategoriesQuery = useCategory(
    expandedMainCategory ? expandedMainCategory.toString() : "",
    !!expandedMainCategory
  );
  
  // Fetch sub-subcategories when a subcategory is selected
  const subSubCategoriesQuery = useCategory(
    expandedSubCategory ? expandedSubCategory.toString() : "",
    !!expandedSubCategory
  );

  const memoizedMainCategories = useMemo(() => {
    if (mainCategoriesQuery.data?.data) {
      return mainCategoriesQuery.data.data?.children || [];
    }
    return [];
  }, [mainCategoriesQuery.data?.data]);

  const memoizedSubCategories = useMemo(() => {
    if (subCategoriesQuery.data?.data) {
      return subCategoriesQuery.data.data?.children || [];
    }
    return [];
  }, [subCategoriesQuery.data?.data]);

  const memoizedSubSubCategories = useMemo(() => {
    if (subSubCategoriesQuery.data?.data) {
      return subSubCategoriesQuery.data.data?.children || [];
    }
    return [];
  }, [subSubCategoriesQuery.data?.data]);

  // Handle main category selection
  const handleMainCategoryChange = (checked: boolean, category: CategoryProps) => {
    let newSelectedMainCategories = [...selectedMainCategories];
    
    if (checked) {
      if (!newSelectedMainCategories.find(cat => cat.id === category.id)) {
        newSelectedMainCategories.push(category);
      }
      // Focus on this main category and hide others
      setFocusedMainCategory(category.id);
      setFocusedSubCategory(null);
    } else {
      newSelectedMainCategories = newSelectedMainCategories.filter(cat => cat.id !== category.id);
      // Remove all subcategories and sub-subcategories of this main category
      setSelectedSubCategories(prev => 
        prev.filter(sub => !isSubCategoryOfMain(sub, category))
      );
      setSelectedSubSubCategories(prev => 
        prev.filter(subSub => !isSubSubCategoryOfMain(subSub, category))
      );
      // If this was the focused category, clear focus
      if (focusedMainCategory === category.id) {
        setFocusedMainCategory(null);
        setFocusedSubCategory(null);
      }
    }
    
    setSelectedMainCategories(newSelectedMainCategories);
  };

  // Handle subcategory selection
  const handleSubCategoryChange = (checked: boolean, category: CategoryProps) => {
    let newSelectedSubCategories = [...selectedSubCategories];
    
    if (checked) {
      if (!newSelectedSubCategories.find(cat => cat.id === category.id)) {
        newSelectedSubCategories.push(category);
      }
      // Focus on this subcategory and its parent main category
      setFocusedMainCategory(expandedMainCategory);
      setFocusedSubCategory(category.id);
    } else {
      newSelectedSubCategories = newSelectedSubCategories.filter(cat => cat.id !== category.id);
      // Remove all sub-subcategories of this subcategory
      setSelectedSubSubCategories(prev => 
        prev.filter(subSub => !isSubSubCategoryOfSub(subSub, category))
      );
      // If this was the focused subcategory, clear subcategory focus
      if (focusedSubCategory === category.id) {
        setFocusedSubCategory(null);
      }
    }
    
    setSelectedSubCategories(newSelectedSubCategories);
  };

  // Handle sub-subcategory selection
  const handleSubSubCategoryChange = (checked: boolean, category: CategoryProps) => {
    let newSelectedSubSubCategories = [...selectedSubSubCategories];
    
    if (checked) {
      if (!newSelectedSubSubCategories.find(cat => cat.id === category.id)) {
        newSelectedSubSubCategories.push(category);
      }
      // Focus on this sub-subcategory and its parent categories
      setFocusedMainCategory(expandedMainCategory);
      setFocusedSubCategory(expandedSubCategory);
    } else {
      newSelectedSubSubCategories = newSelectedSubSubCategories.filter(cat => cat.id !== category.id);
    }
    
    setSelectedSubSubCategories(newSelectedSubSubCategories);
  };

  // Helper functions to check category relationships
  const isSubCategoryOfMain = (subCategory: CategoryProps, mainCategory: CategoryProps) => {
    return subCategory.parentId === mainCategory.id;
  };

  const isSubSubCategoryOfMain = (subSubCategory: CategoryProps, mainCategory: CategoryProps) => {
    // Check if this sub-subcategory belongs to any subcategory of the main category
    return selectedSubCategories.some(sub => 
      sub.parentId === mainCategory.id && subSubCategory.parentId === sub.id
    );
  };

  const isSubSubCategoryOfSub = (subSubCategory: CategoryProps, subCategory: CategoryProps) => {
    return subSubCategory.parentId === subCategory.id;
  };

  // Update the selected category IDs array
  const updateSelectedCategoryIds = () => {
    const allSelectedIds = [
      ...selectedMainCategories.map(cat => cat.id),
      ...selectedSubCategories.map(cat => cat.id),
      ...selectedSubSubCategories.map(cat => cat.id),
    ];
    onCategoryChange(allSelectedIds);
  };

  // Update selected category IDs when state changes
  useEffect(() => {
    updateSelectedCategoryIds();
  }, [selectedMainCategories, selectedSubCategories, selectedSubSubCategories]);

  // Clear all selections
  const handleClear = () => {
    setSelectedMainCategories([]);
    setSelectedSubCategories([]);
    setSelectedSubSubCategories([]);
    setExpandedMainCategory(null);
    setExpandedSubCategory(null);
    setFocusedMainCategory(null);
    setFocusedSubCategory(null);
    onClear();
  };

  // Check if a category is selected
  const isMainCategorySelected = (category: CategoryProps) => {
    return selectedMainCategories.some(cat => cat.id === category.id);
  };

  const isSubCategorySelected = (category: CategoryProps) => {
    return selectedSubCategories.some(cat => cat.id === category.id);
  };

  const isSubSubCategorySelected = (category: CategoryProps) => {
    return selectedSubSubCategories.some(cat => cat.id === category.id);
  };

  return (
    <div className="space-y-4" dir={langDir}>

      <div className="space-y-3">
        {/* Main Categories */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700">{t("main_categories")}</h4>
            <div className="flex gap-2">
              {focusedMainCategory && (
                <Button
                  type="button"
                  onClick={() => {
                    setFocusedMainCategory(null);
                    setFocusedSubCategory(null);
                  }}
                  size="sm"
                  variant="outline"
                  className="h-7 px-2 text-xs"
                >
                  {t("show_all")}
                </Button>
              )}
              <Button
                type="button"
                onClick={handleClear}
                size="sm"
                variant="outline"
                className="h-7 px-2 text-xs"
              >
                {t("clear_all")}
              </Button>
            </div>
          </div>
          <div className="max-h-40 overflow-y-auto space-y-1">
            {memoizedMainCategories
              .filter((category: CategoryProps) => 
                !focusedMainCategory || category.id === focusedMainCategory
              )
              .map((category: CategoryProps) => (
              <div
                key={category.id}
                className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded"
              >
                <Checkbox
                  id={`main-${category.id}`}
                  checked={isMainCategorySelected(category)}
                  onCheckedChange={(checked) => 
                    handleMainCategoryChange(checked as boolean, category)
                  }
                  className="border border-gray-300 data-[state=checked]:bg-primary!"
                />
                <div className="flex items-center space-x-2 flex-1">
                  {category.icon ? (
                    <Image
                      src={category.icon}
                      alt={category.name}
                      height={20}
                      width={20}
                    />
                  ) : (
                    <MdOutlineImageNotSupported size={20} />
                  )}
                  <label
                    htmlFor={`main-${category.id}`}
                    className="text-sm font-medium cursor-pointer flex-1"
                  >
                    {category.name}
                  </label>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => {
                    const newExpandedMainCategory = expandedMainCategory === category.id ? null : category.id;
                    setExpandedMainCategory(newExpandedMainCategory);
                    // Focus on this main category when expanded, hide others
                    if (newExpandedMainCategory) {
                      setFocusedMainCategory(category.id);
                      setFocusedSubCategory(null);
                    } else {
                      // If collapsing, clear focus
                      setFocusedMainCategory(null);
                      setFocusedSubCategory(null);
                    }
                  }}
                >
                  {expandedMainCategory === category.id ? "−" : "+"}
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Sub Categories */}
        {expandedMainCategory && memoizedSubCategories.length > 0 && (
          <div className="space-y-2 ml-4 border-l-2 border-gray-200 pl-4">
            <h4 className="text-sm font-medium text-gray-700">{t("sub_categories")}</h4>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {memoizedSubCategories
                .filter((category: CategoryProps) => 
                  !focusedSubCategory || category.id === focusedSubCategory
                )
                .map((category: CategoryProps) => (
                <div
                  key={category.id}
                  className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded"
                >
                  <Checkbox
                    id={`sub-${category.id}`}
                    checked={isSubCategorySelected(category)}
                    onCheckedChange={(checked) => 
                      handleSubCategoryChange(checked as boolean, category)
                    }
                    className="border border-gray-300 data-[state=checked]:bg-primary!"
                  />
                  <div className="flex items-center space-x-2 flex-1">
                    {category.icon ? (
                      <Image
                        src={category.icon}
                        alt={category.name}
                        height={20}
                        width={20}
                      />
                    ) : (
                      <MdOutlineImageNotSupported size={20} />
                    )}
                    <label
                      htmlFor={`sub-${category.id}`}
                      className="text-sm font-medium cursor-pointer flex-1"
                    >
                      {category.name}
                    </label>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => {
                      const newExpandedSubCategory = expandedSubCategory === category.id ? null : category.id;
                      setExpandedSubCategory(newExpandedSubCategory);
                      // Focus on this subcategory and its parent main category when expanded
                      if (newExpandedSubCategory) {
                        setFocusedMainCategory(expandedMainCategory);
                        setFocusedSubCategory(category.id);
                      } else {
                        // If collapsing, clear subcategory focus but keep main category focus
                        setFocusedSubCategory(null);
                      }
                    }}
                  >
                    {expandedSubCategory === category.id ? "−" : "+"}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sub-Sub Categories */}
        {expandedSubCategory && memoizedSubSubCategories.length > 0 && (
          <div className="space-y-2 ml-8 border-l-2 border-gray-200 pl-4">
            <h4 className="text-sm font-medium text-gray-700">{t("sub_sub_categories")}</h4>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {memoizedSubSubCategories.map((category: CategoryProps) => (
                <div
                  key={category.id}
                  className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded"
                >
                  <Checkbox
                    id={`subsub-${category.id}`}
                    checked={isSubSubCategorySelected(category)}
                    onCheckedChange={(checked) => 
                      handleSubSubCategoryChange(checked as boolean, category)
                    }
                    className="border border-gray-300 data-[state=checked]:bg-primary!"
                  />
                  <div className="flex items-center space-x-2 flex-1">
                    {category.icon ? (
                      <Image
                        src={category.icon}
                        alt={category.name}
                        height={20}
                        width={20}
                      />
                    ) : (
                      <MdOutlineImageNotSupported size={20} />
                    )}
                    <label
                      htmlFor={`subsub-${category.id}`}
                      className="text-sm font-medium cursor-pointer flex-1"
                    >
                      {category.name}
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Selected Categories Summary */}
      {selectedCategoryIds.length > 0 && (
        <div className="mt-4 p-3 bg-primary/5 rounded-lg">
          <p className="text-sm font-medium text-primary mb-2">
            {t("selected_categories")} ({selectedCategoryIds.length})
          </p>
          <div className="flex flex-wrap gap-1">
            {selectedMainCategories.map(category => (
              <span
                key={`main-${category.id}`}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary/10 text-primary"
              >
                {category.name}
              </span>
            ))}
            {selectedSubCategories.map(category => (
              <span
                key={`sub-${category.id}`}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-success/10 text-success"
              >
                {category.name}
              </span>
            ))}
            {selectedSubSubCategories.map(category => (
              <span
                key={`subsub-${category.id}`}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-info/10 text-info"
              >
                {category.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryFilter;
