import http from "../http";
import { isEmpty } from "lodash";

export const createCompanyProfile = (payload: Record<string, unknown>) => {
  return http({
    method: "POST",
    url: "/user/userProfile",
    data: payload,
  });
};

export const updateCompanyProfile = (payload: Record<string, unknown>) => {
  return http({
    method: "PATCH",
    url: "/user/updateUserProfile",
    data: payload,
  });
};

export const updateCompanyBranch = (payload: Record<string, unknown>) => {
  return http({
    method: "PATCH",
    url: "/user/updateBranch",
    data: payload,
  });
};

export const createCompanyBranch = (payload: Record<string, unknown>) => {
  return http({
    method: "POST",
    url: "/user/addBranch",
    data: payload,
  });
};

export const fetchCompanyBranchById = (payload: { branchId: string }) => {
  const query = new URLSearchParams();

  if (!isEmpty(payload.branchId)) {
    query.append("branchId", String(payload.branchId));
  }

  return http({
    method: "GET",
    url: `/user/findOneBranch?${query}`,
  });
};
