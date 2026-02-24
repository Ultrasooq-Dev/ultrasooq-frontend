import http from "../http";
import urlcat from "urlcat";

export const fetchWishList = (payload: { page: number; limit: number }) => {
  return http({
    method: "GET",
    url: urlcat(`/wishlist/getAllWishListByUser`, payload),
  });
};

export const addToWishList = (payload: { productId: number }) => {
  return http({
    method: "POST",
    url: `/wishlist/create`,
    data: payload,
  });
};

export const deleteFromWishList = (payload: { productId: number }) => {
  return http({
    method: "DELETE",
    url: urlcat(`/wishlist/delete`, payload),
  });
};

export const fetchWishlistCount = () => {
  return http({
    method: "GET",
    url: `/wishlist/wishlistCount`,
  });
};
