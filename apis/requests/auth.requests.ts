import { PUREMOON_TEMP_TOKEN_KEY, PUREMOON_TOKEN_KEY } from "@/utils/constants";
import {
  IChangeEmailRequest,
  IChangeEmailVerifyRequest,
  IChangePasswordRequest,
  ICreateAccountRequest,
  IForgotPasswordRequest,
  ILoginRequest,
  IPasswordResetVerifyOtpRequest,
  IRegisterRequest,
  IResendOtpRequest,
  IResetPasswordRequest,
  ISwitchAccountRequest,
  IVerifyOtpRequest,
} from "@/utils/types/auth.types";
import axios from "axios";
import { getCookie } from "cookies-next";
import { getApiUrl } from "@/config/api";

export const register = (payload: IRegisterRequest) => {
  return axios({
    method: "POST",
    url: `${getApiUrl()}/user/register`,
    data: payload,
  });
};

export const verifyOtp = (payload: IVerifyOtpRequest) => {
  return axios({
    method: "POST",
    url: `${getApiUrl()}/user/registerValidateOtp`,
    data: payload,
  });
};

export const resendOtp = (payload: IResendOtpRequest) => {
  return axios({
    method: "POST",
    url: `${getApiUrl()}/user/resendOtp`,
    data: payload,
  });
};

export const login = (payload: ILoginRequest) => {
  return axios({
    method: "POST",
    url: `${getApiUrl()}/user/login`,
    data: payload,
  });
};

export const forgotPassword = (payload: IForgotPasswordRequest) => {
  return axios({
    method: "POST",
    url: `${getApiUrl()}/user/forgetPassword`,
    data: payload,
  });
};

export const resetPassword = (payload: IResetPasswordRequest) => {
  return axios({
    method: "POST",
    url: `${getApiUrl()}/user/resetPassword`,
    data: payload,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TEMP_TOKEN_KEY),
    },
  });
};

export const passwordResetVerify = (
  payload: IPasswordResetVerifyOtpRequest,
) => {
  return axios({
    method: "POST",
    url: `${getApiUrl()}/user/verifyOtp`,
    data: payload,
  });
};

export const changePassword = (payload: IChangePasswordRequest) => {
  return axios({
    method: "POST",
    url: `${getApiUrl()}/user/changePassword`,
    data: payload,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
  });
};

export const changeEmail = (payload: IChangeEmailRequest) => {
  return axios({
    method: "PATCH",
    url: `${getApiUrl()}/user/changeEmail`,
    data: payload,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
  });
};

export const emailChangeVerify = (payload: IChangeEmailVerifyRequest) => {
  return axios({
    method: "PATCH",
    url: `${getApiUrl()}/user/verifyEmail`,
    data: payload,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
  });
};

export const socialLogin = (payload: { provider: string; token: string; [key: string]: unknown }) => {
  return axios({
    method: "POST",
    url: `${getApiUrl()}/user/socialLogin`,
    data: payload,
  });
};

// Multi-Account System Requests
export const myAccounts = () => {
  return axios({
    method: "GET",
    url: `${getApiUrl()}/user/myAccounts`,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
    params: {
      _t: Date.now(),
    },
  });
};

export const createAccount = (payload: ICreateAccountRequest) => {
  return axios({
    method: "POST",
    url: `${getApiUrl()}/user/createAccount`,
    data: payload,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
  });
};

export const switchAccount = (payload: ISwitchAccountRequest) => {
  return axios({
    method: "POST",
    url: `${getApiUrl()}/user/switchAccount`,
    data: payload,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
  });
};

export const currentAccount = () => {
  return axios({
    method: "GET",
    url: `${getApiUrl()}/user/currentAccount`,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + getCookie(PUREMOON_TOKEN_KEY),
    },
  });
};
