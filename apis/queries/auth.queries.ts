import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  changeEmail,
  changePassword,
  emailChangeVerify,
  forgotPassword,
  login,
  passwordResetVerify,
  register,
  resendOtp,
  resetPassword,
  socialLogin,
  verifyOtp,
  myAccounts,
  createAccount,
  switchAccount,
  currentAccount,
} from "../requests/auth.requests";
import { APIResponseError } from "@/utils/types/common.types";
import { getCookie, setCookie } from "cookies-next";
import { PUREMOON_TOKEN_KEY } from "@/utils/constants";
import {
  IChangeEmail,
  IChangeEmailRequest,
  IChangeEmailVerify,
  IChangeEmailVerifyRequest,
  IChangePassword,
  IChangePasswordRequest,
  IForgotPassword,
  IForgotPasswordRequest,
  ILogin,
  ILoginRequest,
  IPasswordResetVerify,
  IPasswordResetVerifyOtpRequest,
  IRegister,
  IRegisterRequest,
  IResendOtp,
  IResendOtpRequest,
  IResetPassword,
  IResetPasswordRequest,
  IVerifyOtp,
  IVerifyOtpRequest,
  IMyAccounts,
  ICurrentAccount,
  ICreateAccount,
  ICreateAccountRequest,
  ISwitchAccount,
  ISwitchAccountRequest,
} from "@/utils/types/auth.types";

export const useRegister = () =>
  useMutation<IRegister, APIResponseError, IRegisterRequest>({
    mutationFn: async (payload) => {
      const res = await register(payload);
      return res.data;
    },
    onSuccess: () => {},
    onError: (err: APIResponseError) => {
    },
  });

export const useVerifyOtp = () =>
  useMutation<IVerifyOtp, APIResponseError, IVerifyOtpRequest>({
    mutationFn: async (payload) => {
      const res = await verifyOtp(payload);
      return res.data;
    },
    onSuccess: () => {},
    onError: (err: APIResponseError) => {
    },
  });

export const useResendOtp = () =>
  useMutation<IResendOtp, APIResponseError, IResendOtpRequest>({
    mutationFn: async (payload) => {
      const res = await resendOtp(payload);
      return res.data;
    },
    onSuccess: () => {},
    onError: (err: APIResponseError) => {
    },
  });

export const useLogin = () =>
  useMutation<ILogin, APIResponseError, ILoginRequest>({
    mutationFn: async (payload) => {
      const res = await login(payload);
      return res.data;
    },
    onSuccess: () => {},
    onError: (err: APIResponseError) => {
    },
  });

export const useForgotPassword = () =>
  useMutation<IForgotPassword, APIResponseError, IForgotPasswordRequest>({
    mutationFn: async (payload) => {
      const res = await forgotPassword(payload);
      return res.data;
    },
    onSuccess: () => {},
    onError: (err: APIResponseError) => {
    },
  });

export const useResetPassword = () =>
  useMutation<IResetPassword, APIResponseError, IResetPasswordRequest>({
    mutationFn: async (payload) => {
      const res = await resetPassword(payload);
      return res.data;
    },
    onSuccess: () => {},
    onError: (err: APIResponseError) => {
    },
  });

export const usePasswordResetVerify = () =>
  useMutation<
    IPasswordResetVerify,
    APIResponseError,
    IPasswordResetVerifyOtpRequest
  >({
    mutationFn: async (payload) => {
      const res = await passwordResetVerify(payload);
      return res.data;
    },
    onSuccess: () => {},
    onError: (err: APIResponseError) => {
    },
  });

export const useChangePassword = () =>
  useMutation<IChangePassword, APIResponseError, IChangePasswordRequest>({
    mutationFn: async (payload) => {
      const res = await changePassword(payload);
      return res.data;
    },
    onSuccess: () => {},
    onError: (err: APIResponseError) => {
    },
  });

export const useChangeEmail = () =>
  useMutation<IChangeEmail, APIResponseError, IChangeEmailRequest>({
    mutationFn: async (payload) => {
      const res = await changeEmail(payload);
      return res.data;
    },
    onSuccess: () => {},
    onError: (err: APIResponseError) => {
    },
  });

export const useChangeEmailVerify = () => {
  const queryClient = useQueryClient();

  return useMutation<
    IChangeEmailVerify,
    APIResponseError,
    IChangeEmailVerifyRequest
  >({
    mutationFn: async (payload) => {
      const res = await emailChangeVerify(payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["me"],
      });
    },
    onError: (err: APIResponseError) => {
    },
  });
};

export const useSocialLogin = () =>
  useMutation<
    {
      accessToken: string;
      data: any;
      message: string;
      status: boolean;
    },
    APIResponseError,
    {
      firstName: string;
      lastName: string;
      email: string;
      tradeRole: "BUYER";
      loginType: string;
    }
  >({
    mutationFn: async (payload) => {
      const res = await socialLogin(payload);
      return res.data;
    },
    onSuccess: () => {},
    onError: (err: APIResponseError) => {
    },
  });

// Multi-Account System Queries
export const useMyAccounts = () => {
  return useQuery<IMyAccounts, APIResponseError>({
    queryKey: ["myAccounts"],
    queryFn: async () => {
      if (process.env.NODE_ENV === "development") {
      }
      const res = await myAccounts();
      if (process.env.NODE_ENV === "development") {
      }
      return res.data;
    },
    enabled: !!getCookie(PUREMOON_TOKEN_KEY),
    staleTime: 0, // Data is always considered stale
    gcTime: 0, // Don't cache the data (formerly cacheTime)
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchInterval: false, // Disable automatic refetching
  });
};

export const useCurrentAccount = () => {
  return useQuery<ICurrentAccount, APIResponseError>({
    queryKey: ["currentAccount"],
    queryFn: async () => {
      const res = await currentAccount();
      return res.data;
    },
    enabled: !!getCookie(PUREMOON_TOKEN_KEY),
    staleTime: 0, // Data is always considered stale
    gcTime: 0, // Don't cache the data
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
};

export const useCreateAccount = () => {
  const queryClient = useQueryClient();

  return useMutation<ICreateAccount, APIResponseError, ICreateAccountRequest>({
    mutationFn: (payload) => createAccount(payload).then((res) => res.data),
    onSuccess: async (data) => {
      // Clear all cached query data so fresh data is fetched after account creation
      queryClient.removeQueries();

      // Then invalidate auth-related queries specifically
      await queryClient.invalidateQueries({ queryKey: ["myAccounts"] });
      await queryClient.invalidateQueries({ queryKey: ["currentAccount"] });
    },
    onError: (error) => {
    },
  });
};

export const useSwitchAccount = () => {
  const queryClient = useQueryClient();

  return useMutation<ISwitchAccount, APIResponseError, ISwitchAccountRequest>({
    mutationFn: (payload) => switchAccount(payload).then((res) => res.data),
    onSuccess: async (data) => {
      // Update the token in cookies FIRST
      setCookie(PUREMOON_TOKEN_KEY, data.data.accessToken);

      // Clear all cached query data so stale data from the old account is removed.
      // Use removeQueries instead of resetQueries to avoid canceling active observers.
      queryClient.removeQueries();

      // After clearing cache, invalidate auth queries so they refetch with the new token
      await queryClient.invalidateQueries({ queryKey: ["myAccounts"] });
      await queryClient.invalidateQueries({ queryKey: ["currentAccount"] });
      await queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });
};
