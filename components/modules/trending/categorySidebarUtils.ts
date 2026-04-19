import { fetchCategory } from "@/apis/requests/category.requests";

// ─── fetchCategoryWithChildren ───────────────────────────────────────────────

export async function fetchCategoryWithChildren(category: any, level: number = 0): Promise<any> {
  try {
    const response = await fetchCategory({ categoryId: category.id.toString() });
    const children = response?.data?.data?.children || [];
    const childrenWithNested = children.map((child: any) => ({
      ...child,
      children: [],
      hasChildren: !!(child.children && Array.isArray(child.children) && child.children.length > 0),
      level: level + 1,
      _originalChildren: child.children || [],
    }));
    return { ...category, children: childrenWithNested, level };
  } catch (error) {
    console.error(`Error fetching category ${category.name}:`, error);
    return { ...category, children: [], level };
  }
}

// ─── fetchCategoryChildren ───────────────────────────────────────────────────

export async function fetchCategoryChildren(categoryId: number, originalChildren?: any[]): Promise<any[]> {
  try {
    if (originalChildren && originalChildren.length > 0) {
      return originalChildren.map((child: any) => ({
        ...child,
        children: [],
        hasChildren: !!(child.children && Array.isArray(child.children) && child.children.length > 0),
        _originalChildren: child.children || [],
      }));
    }
    const response = await fetchCategory({ categoryId: categoryId.toString() });
    const children = response?.data?.data?.children || [];
    return children.map((child: any) => ({
      ...child,
      children: [],
      hasChildren: !!(child.children && Array.isArray(child.children) && child.children.length > 0),
      _originalChildren: child.children || [],
    }));
  } catch (error) {
    console.error(`Error fetching children for category ${categoryId}:`, error);
    return [];
  }
}

// ─── hasSubcategoryChildren ──────────────────────────────────────────────────

export function hasSubcategoryChildren(category: any): boolean {
  return !!(
    (category.children && Array.isArray(category.children) && category.children.length > 0) ||
    category.hasChildren ||
    (category._originalChildren && Array.isArray(category._originalChildren) && category._originalChildren.length > 0)
  );
}
