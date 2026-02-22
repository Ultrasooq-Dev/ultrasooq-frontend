import { APIResponseError } from "@/utils/types/common.types";
import { IUploadFile } from "@/utils/types/user.types";
import { useMutation } from "@tanstack/react-query";
import {
  deleteFile,
  uploadFile,
  uploadMultipleFile,
} from "../requests/upload.requests";

export const useUploadFile = () =>
  useMutation<IUploadFile, APIResponseError, FormData>({
    mutationFn: async (payload) => {
      const res = await uploadFile(payload);
      return res.data;
    },
    onSuccess: () => {},
    onError: (err: APIResponseError) => {
    },
  });

export const useUploadMultipleFile = () =>
  useMutation<IUploadFile, APIResponseError, FormData>({
    mutationFn: async (payload) => {
      const res = await uploadMultipleFile(payload);
      return res.data;
    },
    onSuccess: () => {},
    onError: (err: APIResponseError) => {
    },
  });

export const useDeleteFile = () =>
  useMutation<
    IUploadFile,
    APIResponseError,
    {
      fileName: string;
      [key: string]: unknown;
    }
  >({
    mutationFn: async (payload) => {
      const res = await deleteFile(payload);
      return res.data;
    },
    onSuccess: () => {},
    onError: (err: APIResponseError) => {
    },
  });
