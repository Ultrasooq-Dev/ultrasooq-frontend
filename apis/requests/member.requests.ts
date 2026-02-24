import http from "../http";
import urlcat from "urlcat";

export const createMember = (payload: Record<string, unknown>) => {
  return http({
    method: "POST",
    url: "/team-member/create",
    data: payload,
  });
};

export const fetchAllMembers = (payload: { page: number; limit: number }) => {
  return http({
    method: "GET",
    url: urlcat("/team-member/getAllTeamMember", payload),
  });
};

export const updateMember = (payload: Record<string, unknown>) => {
  return http({
    method: "PATCH",
    url: "/team-member/update",
    data: payload,
  });
};

export const fetchPermissions = () => {
  return http({
    method: "GET",
    url: "/admin/permission/get-all",
  });
};

export const setPermission = (payload: Record<string, unknown>) => {
  return http({
    method: "POST",
    url: "/user/set-permision",
    data: payload,
  });
};

export const fetchPermissionByRoleId = (payload: { userRoleId: number }) => {
  return http({
    method: "GET",
    url: urlcat("/user/getOneUserRole-with-permission", payload),
  });
};

export const updatePermission = (payload: Record<string, unknown>) => {
  return http({
    method: "PATCH",
    url: "/user/update-set-permission",
    data: payload,
  });
};
