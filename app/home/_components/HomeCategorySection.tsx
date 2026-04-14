"use client";

import { useCategoryStore } from "@/lib/categoryStore";
import { useCategory } from "@/apis/queries/category.queries";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { TrendingProduct } from "@/utils/types/common.types";
import { ProductGrid } from "./ProductGrid";
import { CartItem } from "./homeTypes";

interface CategoryNavConfig {
  categoryId: number;
  subCategoryId?: number;
  categoryIds?: string;
  colorClass: string;
}

interface HomeCategorySectionProps {
  title: string;
  products: TrendingProduct[];
  cartList: CartItem[] | undefined;
  haveAccessToken: boolean;
  onWishlist: (productId: number, wishlistArr?: any[]) => void;
  navConfig: CategoryNavConfig;
  sectionClass: string;
}

export function HomeCategorySection({
  title,
  products,
  cartList,
  haveAccessToken,
  onWishlist,
  navConfig,
  sectionClass,
}: HomeCategorySectionProps) {
  const t = useTranslations();
  const router = useRouter();
  const categoryStore = useCategoryStore();
  const categoryQuery = useCategory("4");

  const memoizedCategories = useMemo(() => {
    let tempArr: any = [];
    if (categoryQuery.data?.data) {
      tempArr = categoryQuery.data.data?.children;
    }
    return tempArr || [];
  }, [categoryQuery?.data?.data]);

  if (!products?.length) return null;

  const handleViewAll = () => {
    const { categoryId, subCategoryId, categoryIds } = navConfig;
    const subCategoryIndex = memoizedCategories.findIndex(
      (item: any) => item.id == categoryId,
    );
    const item = memoizedCategories.find(
      (item: any) => item.id == categoryId,
    );
    const children = memoizedCategories?.[subCategoryIndex]?.children || [];

    categoryStore.setSubCategories(children);
    categoryStore.setSubCategoryIndex(subCategoryIndex);
    categoryStore.setSubCategoryParentName(item?.name);

    if (subCategoryId) {
      const itemSubCategory = children.find(
        (item: any) => item.id == subCategoryId,
      );
      categoryStore.setSubSubCategoryParentName(itemSubCategory?.name);
      categoryStore.setSubSubCategories(itemSubCategory?.children);
      categoryStore.setSecondLevelCategoryIndex(
        children.findIndex((item: any) => item.id == subCategoryId),
      );
      categoryStore.setCategoryId(subCategoryId.toString());
    } else {
      categoryStore.setSubSubCategoryParentName(children?.[0]?.name);
      categoryStore.setSubSubCategories(children?.[0]?.children);
      categoryStore.setSecondLevelCategoryIndex(0);
      categoryStore.setCategoryId(categoryId.toString());
    }

    categoryStore.setCategoryIds(categoryIds || categoryId.toString());
    router.push("/trending");
  };

  return (
    <section className={`${sectionClass} w-full px-4 py-12 sm:px-8 sm:py-16 lg:px-12 lg:py-20`}>
      <div className="mx-auto w-full max-w-[1400px]">
        <div className="mb-8 sm:mb-12">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center sm:gap-6">
            <div className="flex-1">
              <h2
                className="text-foreground text-2xl font-bold sm:text-3xl lg:text-4xl"
                translate="no"
              >
                {title}
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <a
                onClick={handleViewAll}
                className={`group ${navConfig.colorClass} inline-flex cursor-pointer items-center gap-2 rounded-xl border px-6 py-3.5 text-sm font-semibold text-white sm:px-8 sm:py-4 sm:text-base`}
                translate="no"
              >
                {t("view_all")}
                <ArrowRight className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
        <ProductGrid
          products={products}
          cartList={cartList}
          haveAccessToken={haveAccessToken}
          onWishlist={onWishlist}
          limit={4}
        />
      </div>
    </section>
  );
}
