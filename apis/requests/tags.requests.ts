import http from "../http";

export const fetchTags = () => {
  return http({
    method: "GET",
    url: `/user/viewTags`,
  });
};

export const createTag = (payload: { tagName: string }) => {
  return http({
    method: "POST",
    url: `/user/createTag`,
    data: payload,
  });
};
