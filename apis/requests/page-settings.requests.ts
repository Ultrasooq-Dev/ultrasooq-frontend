import http from "../http";

export const fetchPageSettingBySlug = (slug: string) => {
  return http({
    method: "GET",
    url: `/admin/page-settings/get-one?slug=${slug}`,
  });
};
