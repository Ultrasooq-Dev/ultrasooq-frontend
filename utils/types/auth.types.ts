export interface ILoginRequest {
  email: string;
  password: string;
}

export interface ILogin {
  accessToken: string;
  data: {
    status:
      | "WAITING"
      | "ACTIVE"
      | "REJECT"
      | "INACTIVE"
      | "WAITING_FOR_SUPER_ADMIN"
      | "DELETE";
  };
  message: string;
  status: boolean;
  otp: number;
}

export interface IRegisterRequest {
  loginType: "MANUAL" | "GOOGLE" | "FACEBOOK";
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  cc: string;
  phoneNumber: string;
  tradeRole: string;
}

export interface IRegister {
  otp: number;
  message: string;
  status: boolean;
  accessToken: string;
}

export interface IVerifyOtpRequest {
  email: string;
  otp: number;
}

export interface User {
  id: number;
  createdAt: string;
  updatedAt: string;
  firstName: string;
  lastName: string;
  email: string;
  gender: "MALE" | "FEMALE";
  tradeRole: "BUYER" | "COMPANY" | "FREELANCER";
  cc: string;
  phoneNumber: string;
  status?:
    | "WAITING"
    | "ACTIVE"
    | "REJECT"
    | "INACTIVE"
    | "WAITING_FOR_SUPER_ADMIN"
    | "DELETE";
  statusNote?: string;
}

export interface IVerifyOtp {
  accessToken: string;
  data: User;
  message: string;
  status: boolean;
}

export interface IResendOtpRequest {
  email: string;
}

export interface IResendOtp {
  status: boolean;
  message: string;
  otp: number;
}

export interface IForgotPasswordRequest {
  email: string;
}

export interface IForgotPassword {
  otp: number;
  message: string;
  status: boolean;
}

export interface IResetPasswordRequest {
  newPassword: string;
  confirmPassword: string;
}

export interface IResetPassword {
  message: string;
  status: boolean;
  data: null;
  statusCode: number;
}

export interface IPasswordResetVerifyOtpRequest extends IVerifyOtpRequest {}

export interface IPasswordResetVerify {
  status: boolean;
  message: string;
  accessToken: string;
}

export interface IChangePasswordRequest extends IResetPasswordRequest {
  password: string;
}

export interface IChangePassword {
  message: string;
  status: boolean;
  data: null;
}

export interface IChangeEmailRequest {
  email: string;
}

export interface IChangeEmail {
  message: string;
  status: boolean;
  data: null;
}

export interface IChangeEmailVerifyRequest {
  email: string;
  otp: number;
}

export interface IChangeEmailVerify {
  message: string;
  status: boolean;
  data: null;
}

// Multi-Account System Types
export interface IUserAccount {
  id: number;
  userId: number;
  tradeRole: "BUYER" | "COMPANY" | "FREELANCER";
  accountName: string;
  isActive: boolean;
  isCurrent: boolean;
  createdAt: string;
  updatedAt: string;
  isCurrentAccount?: boolean;

  // Company-specific fields
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyWebsite?: string;
  companyTaxId?: string;

  // Account statistics and status
  messages?: number;
  orders?: number;
  rfq?: number;
  tracking?: number;
  status?:
    | "WAITING"
    | "ACTIVE"
    | "REJECT"
    | "INACTIVE"
    | "WAITING_FOR_SUPER_ADMIN";
  statusNote?: string;
}

export interface IMainAccount {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  tradeRole: "BUYER" | "COMPANY" | "FREELANCER";
  accountName: string;
  isMainAccount: boolean;
  isCurrentAccount?: boolean;

  // Account statistics and status
  messages?: number;
  orders?: number;
  rfq?: number;
  tracking?: number;
  status?:
    | "WAITING"
    | "ACTIVE"
    | "REJECT"
    | "INACTIVE"
    | "WAITING_FOR_SUPER_ADMIN";
  statusNote?: string;
}

export interface ICreateAccountRequest {
  tradeRole: "COMPANY" | "FREELANCER"; // BUYER is not allowed for sub-accounts
  accountName: string;

  // Company-specific fields
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyWebsite?: string;
  companyTaxId?: string;

  // Identity card fields (mandatory for COMPANY and FREELANCER)
  identityProof?: string; // Front side image URL
  identityProofBack?: string; // Back side image URL
}

export interface ICreateAccount {
  message: string;
  status: boolean;
  data: IUserAccount;
}

export interface IMyAccounts {
  message: string;
  status: boolean;
  data: {
    mainAccount: IMainAccount;
    accountsByType: {
      company: IUserAccount[];
      buyer: IUserAccount[];
      freelancer: IUserAccount[];
    };
    allAccounts: IUserAccount[];
  };
}

export interface ISwitchAccountRequest {
  userAccountId: number; // 0 for main account, >0 for sub-accounts
}

export interface ISwitchAccount {
  message: string;
  status: boolean;
  data: {
    accessToken: string;
    account: IUserAccount | IMainAccount;
  };
}

export interface ICurrentAccount {
  message: string;
  status: boolean;
  data: {
    account: IUserAccount | IMainAccount;
    isMainAccount: boolean;
  };
}
