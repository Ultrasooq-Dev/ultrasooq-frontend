import { useQuery } from "@tanstack/react-query";
import { fetchPageSettingBySlug } from "../requests/page-settings.requests";

export const usePageSettingBySlug = (slug: string, enabled = true) =>
  useQuery({
    queryKey: ["page-settings", slug],
    queryFn: async () => {
      const res = await fetchPageSettingBySlug(slug);
      return res.data;
    },
    enabled,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
