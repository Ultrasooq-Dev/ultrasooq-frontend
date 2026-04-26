import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useCategoryStore } from "@/lib/categoryStore";

interface UseTrendingPageEffectsProps {
  accessToken: any;
  setHaveAccessToken: (val: boolean) => void;
  setIsMounted: (val: boolean) => void;
  setIsCategorySidebarOpen: (val: boolean) => void;
  setSelectedCategoryIds: (ids: number[]) => void;
}

export function useTrendingPageEffects({
  accessToken,
  setHaveAccessToken,
  setIsMounted,
  setIsCategorySidebarOpen,
  setSelectedCategoryIds,
}: UseTrendingPageEffectsProps) {
  const categoryStore = useCategoryStore();
  const searchParams = useSearchParams();

  // Category sidebar listener
  useEffect(() => {
    const handleOpen = () => setIsCategorySidebarOpen(true);
    window.addEventListener("openCategorySidebar", handleOpen);
    window.addEventListener("closeCategorySidebar", () => {});
    return () => {
      window.removeEventListener("openCategorySidebar", handleOpen);
      window.removeEventListener("closeCategorySidebar", () => {});
    };
  }, []);

  // URL category param — reactive to URL changes so clicking another category
  // while already on /trending re-applies the filter.
  useEffect(() => {
    const categoryParam =
      searchParams?.get("category") ?? searchParams?.get("categoryIds");
    if (categoryParam) {
      const categoryId = parseInt(categoryParam, 10);
      if (!isNaN(categoryId)) {
        setSelectedCategoryIds([categoryId]);
        return;
      }
    }
    setSelectedCategoryIds([]);
  }, [searchParams]);

  // Hydration mount flag
  useEffect(() => { setIsMounted(true); }, []);

  // Auth token tracking
  useEffect(() => { setHaveAccessToken(!!accessToken); }, [accessToken]);

  // Category store cleanup on unmount
  useEffect(() => {
    return () => {
      categoryStore.setSubCategories([]);
      categoryStore.setSubSubCategories([]);
      categoryStore.setCategoryId("");
      categoryStore.setCategoryIds("");
      categoryStore.setSubCategoryIndex(0);
      categoryStore.setSecondLevelCategoryIndex(0);
      categoryStore.setSubCategoryParentName("");
      categoryStore.setSubSubCategoryParentName("");
    };
  }, []);
}
