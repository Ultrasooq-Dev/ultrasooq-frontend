import { IFreelancerStatusRequest } from "@/utils/types/user.types";
import http from "../http";

export const createFreelancerProfile = (payload: Record<string, unknown>) => {
  return http({
    method: "POST",
    url: "/user/userProfile",
    data: payload,
  });
};

export const updateFreelancerProfile = (payload: Record<string, unknown>) => {
  return http({
    method: "PATCH",
    url: "/user/updateUserProfile",
    data: payload,
  });
};

export const updateFreelancerBranch = (payload: Record<string, unknown>) => {
  return http({
    method: "PATCH",
    url: "/user/updateBranch",
    data: payload,
  });
};

export const updateFreelancerActiveStatus = (
  payload: IFreelancerStatusRequest,
) => {
  return http({
    method: "PATCH",
    url: "/user/onlineoffline",
    data: payload,
  });
};
