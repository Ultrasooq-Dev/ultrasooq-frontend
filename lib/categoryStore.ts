import { create } from "zustand";

export type State = {
  subCategories: any[];
  subSubCategories: any[];
  categoryId?: string;
  categoryIds?: string;
  subCategoryIndex?: number;
  secondLevelCategoryIndex?: number;
  subCategoryParentName?: string;
  subSubCategoryParentName?: string;
};

export type Actions = {
  setSubCategories: (data: any[]) => void;
  setSubSubCategories: (data: any[]) => void;
  setCategoryId: (data: string) => void;
  setCategoryIds: (data: string) => void;
  setSubCategoryIndex: (data: number) => void;
  setSecondLevelCategoryIndex: (data: number) => void;
  setSubCategoryParentName: (data: string) => void;
  setSubSubCategoryParentName: (data: string) => void;
};

export const initialCategoryState: State = {
  subCategories: [],
  subSubCategories: [],
  categoryId: undefined,
  categoryIds: undefined,
  subCategoryIndex: undefined,
  secondLevelCategoryIndex: 0,
  subCategoryParentName: undefined,
  subSubCategoryParentName: undefined,
};

export const useCategoryStore = create<State & Actions>()((set) => ({
  subCategories: initialCategoryState.subCategories,
  subSubCategories: initialCategoryState.subSubCategories,
  setSubCategories: (data) =>
    set((state) => ({ ...state, subCategories: data })),
  setSubSubCategories: (data) =>
    set((state) => ({ ...state, subSubCategories: data })),
  setCategoryId: (data) => set((state) => ({ ...state, categoryId: data })),
  setCategoryIds: (data) => set((state) => ({ ...state, categoryIds: data })),
  setSubCategoryIndex: (data) =>
    set((state) => ({ ...state, subCategoryIndex: data })),
  setSecondLevelCategoryIndex: (data) =>
    set((state) => ({ ...state, secondLevelCategoryIndex: data })),
  setSubCategoryParentName: (data) =>
    set((state) => ({ ...state, subCategoryParentName: data })),
  setSubSubCategoryParentName: (data) =>
    set((state) => ({ ...state, subSubCategoryParentName: data })),
}));
