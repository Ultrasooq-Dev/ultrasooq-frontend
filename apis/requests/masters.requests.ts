import http from "../http";
import urlcat from "urlcat";

export const fetchCountries = () => {
  return http({
    method: "GET",
    url: "/product/countryList",
  });
};

export const fetchBrands = (payload: {
  term?: string;
  addedBy?: number;
  type?: string;
}) => {
  const query = new URLSearchParams();
  query.append("addedBy", String(payload.addedBy));

  if (payload.term) query.append("term", String(payload.term));
  if (payload.type) query.append("type", String(payload.type));

  return http({
    method: "GET",
    url: `/brand/findAll?${query}`,
  });
};

export const fetchuserRoles = () => {
  const query = new URLSearchParams();
  return http({
    method: "GET",
    url: `/user/getAllUserRole?${query}`,
  });
};

export const fetchuserRolesWithPagination = (payload: {
  page: number;
  limit: number;
}) => {
  return http({
    method: "GET",
    url: urlcat("/user/getAllUserRole", payload),
  });
};

export const deleteMemberRole = (payload: { id: number }) => {
  return http({
    method: "DELETE",
    url: urlcat("/user/deleteUserRole", payload),
  });
};

export const createBrand = (payload: { brandName: string }) => {
  return http({
    method: "POST",
    url: "/brand/addBrandByUser",
    data: payload,
  });
};

export const createUserRole = (payload: { userRoleName: string }) => {
  return http({
    method: "POST",
    url: "/user/createUserRole",
    data: payload,
  });
};

export const copyUserRole = (payload: { userRoleId: number }) => {
  return http({
    method: "PATCH",
    url: "/user/copy-userRole-with-permission",
    data: payload,
  });
};

export const updateUserRole = (payload: { userRoleName: string }) => {
  return http({
    method: "PATCH",
    url: "/user/updateUserRole",
    data: payload,
  });
};

export const fetchLocation = () => {
  return http({
    method: "GET",
    url: "/product/locationList",
  });
};

export const fetchAllCountry = () => {
  return http({
    method: "GET",
    url: "/admin/getAllCountry?page=1&limit=1000&sort=desc",
  });
};

export const fetchStatesByCountry = (payload: { countryId: number }) => {
  return http({
    method: "GET",
    url: `/admin/getAllStates?countryId=${payload.countryId}&page=1&limit=5000&sort=desc`,
  });
};

export const fetchCitiesByState = (payload: { stateId: number }) => {
  return http({
    method: "GET",
    url: `/admin/getAllCities?stateId=${payload.stateId}&page=1&limit=50000&sort=desc`,
  });
};
