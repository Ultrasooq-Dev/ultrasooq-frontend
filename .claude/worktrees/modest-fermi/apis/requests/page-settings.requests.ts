import axios from "axios";
import { getApiUrl } from "@/config/api";

export const fetchPageSettingBySlug = (slug: string) => {
  return axios({
    method: "GET",
    url: `${getApiUrl()}/admin/page-settings/get-one?slug=${slug}`,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });
};
