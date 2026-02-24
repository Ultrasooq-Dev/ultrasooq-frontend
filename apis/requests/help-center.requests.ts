import http from "../http";

export const fetchHelpCenterQueries = (payload?: Record<string, unknown>) => {
  return http({
    method: "GET",
    url: "/user/help-center/get-all",
    data: payload,
  });
};

export const submitQuery = (payload: {
  userId?: number;
  email: string;
  query: string;
}) => {
  return http({
    method: "POST",
    url: "/user/help-center/create",
    data: payload,
  });
};
