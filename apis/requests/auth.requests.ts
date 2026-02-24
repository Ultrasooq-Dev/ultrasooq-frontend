import { PUREMOON_TEMP_TOKEN_KEY } from "@/utils/constants";
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
import http from "../http";
import { getCookie } from "cookies-next";

export const register = (payload: IRegisterRequest) => {
  return http({
    method: "POST",
    url: "/user/register",
    data: payload,
  });
};

export const verifyOtp = (payload: IVerifyOtpRequest) => {
  return http({
    method: "POST",
    url: "/user/registerValidateOtp",
    data: payload,
  });
};

export const resendOtp = (payload: IResendOtpRequest) => {
  return http({
    method: "POST",
    url: "/user/resendOtp",
    data: payload,
  });
};

export const login = (payload: ILoginRequest) => {
  return http({
    method: "POST",
    url: "/user/login",
    data: payload,
  });
};

export const forgotPassword = (payload: IForgotPasswordRequest) => {
  return http({
    method: "POST",
    url: "/user/forgetPassword",
    data: payload,
  });
};

export const resetPassword = (payload: IResetPasswordRequest) => {
  // resetPassword uses the temporary token (PUREMOON_TEMP_TOKEN_KEY), not the main auth token.
  // We must set the Authorization header manually here.
  return http({
    method: "POST",
    url: "/user/resetPassword",
    data: payload,
    headers: {
      Authorization: "Bearer " + getCookie(PUREMOON_TEMP_TOKEN_KEY),
    },
  });
};

export const passwordResetVerify = (
  payload: IPasswordResetVerifyOtpRequest,
) => {
  return http({
    method: "POST",
    url: "/user/verifyOtp",
    data: payload,
  });
};

export const changePassword = (payload: IChangePasswordRequest) => {
  return http({
    method: "POST",
    url: "/user/changePassword",
    data: payload,
  });
};

export const changeEmail = (payload: IChangeEmailRequest) => {
  return http({
    method: "PATCH",
    url: "/user/changeEmail",
    data: payload,
  });
};

export const emailChangeVerify = (payload: IChangeEmailVerifyRequest) => {
  return http({
    method: "PATCH",
    url: "/user/verifyEmail",
    data: payload,
  });
};

export const socialLogin = (payload: { provider: string; token: string; [key: string]: unknown }) => {
  return http({
    method: "POST",
    url: "/user/socialLogin",
    data: payload,
  });
};

// Multi-Account System Requests
export const myAccounts = () => {
  return http({
    method: "GET",
    url: "/user/myAccounts",
    params: {
      _t: Date.now(),
    },
  });
};

export const createAccount = (payload: ICreateAccountRequest) => {
  return http({
    method: "POST",
    url: "/user/createAccount",
    data: payload,
  });
};

export const switchAccount = (payload: ISwitchAccountRequest) => {
  return http({
    method: "POST",
    url: "/user/switchAccount",
    data: payload,
  });
};

export const currentAccount = () => {
  return http({
    method: "GET",
    url: "/user/currentAccount",
  });
};
