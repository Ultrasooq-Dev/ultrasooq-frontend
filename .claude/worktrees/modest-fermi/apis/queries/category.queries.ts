import { useQuery } from "@tanstack/react-query";
import {
  fetchCategories,
  fetchCategory,
  fetchSubCategoriesById,
} from "../requests/category.requests";

export const useCategory = (categoryId?: string, enabled = true) =>
  useQuery({
    queryKey: ["category", categoryId],
    queryFn: async () => {
      const res = await fetchCategory({ categoryId });
      return res.data;
    },

    enabled,
  });

export const useCategories = (enabled = true) =>
  useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetchCategories();
      return res.data;
    },

    enabled,
  });

export const useSubCategoryById = (id: string, enabled = true) =>
  useQuery({
    queryKey: ["sub-category-by-id", id],
    queryFn: async () => {
      const res = await fetchSubCategoriesById({ categoryId: id });
      return res.data;
    },

    enabled,
  });
