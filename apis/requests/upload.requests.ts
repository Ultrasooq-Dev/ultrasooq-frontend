import http from "../http";

export const uploadFile = (payload: FormData) => {
  return http({
    method: "POST",
    url: `/user/presignedUrlUpload`,
    data: payload,
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const uploadMultipleFile = (payload: FormData) => {
  return http({
    method: "POST",
    url: `/user/presignedUrlUploadMultiple`,
    data: payload,
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const deleteFile = (payload: { fileName: string; [key: string]: unknown }) => {
  return http({
    method: "DELETE",
    url: `/user/presignedUrlDelete`,
    data: payload,
  });
};
