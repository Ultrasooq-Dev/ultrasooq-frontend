import http from "../http";
import urlcat from "urlcat";


export const createService = (payload: Record<string, unknown>) => {
  return http({
    method: "POST",
    url: `/service/create`,
    data: payload,
  });
};

export const updateService = (payload: Record<string, unknown>) => {
  return http({
    method: "PATCH",
    url: `/service/${payload?.serviceId}`,
    data: payload,
  });
};

export const fetchAllServices = (payload: {
  page: number;
  limit: number;
  term?: string;
  sort?: string;
  userId?: number;
  ownService?: boolean;
}) => {
  return http({
    method: "GET",
    url: urlcat(`/service/list`, payload),
  });
};

export const fetchServiceById = (payload: {
  serviceid: string;
  userId?: number;
  sharedLinkId?: string;
}) => {
  return http({
    method: "GET",
    url: `/service/${payload.serviceid}`,
  });
};

export const addServiceToCart = (payload: number[]) => {
  return http({
    method: "PATCH",
    url: `/cart/updateservice`,
    data: payload,
  });
};

export const fetchServicesBySeller = (payload: {
  page: number;
  limit: number;
  sellerId: number;
  fromCityId?: number;
  toCityId?: number;
}) => {
  return http({
    method: "GET",
    url: urlcat(`/service/getAllServiceBySeller`, payload),
  });
};

export const fetchServicesByOtherSeller = (payload: {
  page: number;
  limit: number;
  sellerId: number;
  fromCityId?: number;
  toCityId?: number;
}) => {
  return http({
    method: "GET",
    url: urlcat(`/service/getAllServiceOfOtherSeller`, payload),
  });
};

export const fetchServicesByProductCategory = (payload: {
  categoryId: string;
  page: number;
  limit: number;
}) => {
  return http({
    method: "GET",
    url: urlcat(
      `/service/getAllServiceRelatedProductCategoryId`,
      payload,
    ),
  });
};
