import http from "../http";

export const updateUserProfile = (payload: Record<string, unknown>) => {
  return http({
    method: "PATCH",
    url: `/user/updateProfile`,
    data: payload,
  });
};

export const fetchMe = () => {
  return http({
    method: "POST",
    url: `/user/me`,
  });
};

export const fetchUniqueUser = (payload: { userId: number | undefined }) => {
  return http({
    method: "POST",
    url: `/user/findUnique`,
    data: payload,
  });
};

export const fetchUserPermissions = () => {
  return http({
    method: "GET",
    url: `/user/get-perrmision`,
  });
};

export const fetchUserBusinessCategories = () => {
  return http({
    method: "GET",
    url: `/user/bussiness-category/get-all`,
  });
};

export const fetchUserById = (payload: { userId: number }) => {
  return http({
    method: "POST",
    url: `/user/findUnique`,
    data: payload,
  });
};
