import { PUREMOON_TOKEN_KEY } from "@/utils/constants";
import axios from "axios";
import { getCookie } from "cookies-next";
import { getApiUrl } from "@/config/api";

export const uploadFile = (payload: FormData) => {
  return axios({
    method: "POST",
    url: `${getApiUrl()}/user/presignedUrlUpload`,
    data: payload,
    headers: {
      "Content-Type": "multipart/form-data",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
  });
};

export const uploadMultipleFile = (payload: FormData) => {
  return axios({
    method: "POST",
    url: `${getApiUrl()}/user/presignedUrlUploadMultiple`,
    data: payload,
    headers: {
      "Content-Type": "multipart/form-data",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
  });
};

export const deleteFile = (payload: { fileName: string; [key: string]: unknown }) => {
  return axios({
    method: "DELETE",
    url: `${getApiUrl()}/user/presignedUrlDelete`,
    data: payload,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
  });
};
