export interface CategorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onCategorySelect?: (categoryId: number) => void;
}

export interface CategoryWithSubcategories {
  category: any;
  subcategories: any[];
}

export interface MobileNavItem {
  level: number;
  categoryId: number;
  categoryName: string;
}
