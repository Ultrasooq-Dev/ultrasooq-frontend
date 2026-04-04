/**
 * @module types/user
 * @description User and authentication domain types.
 *
 * Trade roles and user statuses match the values used in
 * `utils/types/auth.types.ts` and the backend API.
 */

// ---------------------------------------------------------------------------
// Enums / Union Types
// ---------------------------------------------------------------------------

export type TradeRole = 'BUYER' | 'COMPANY' | 'FREELANCER';
export type UserType = 'ADMIN' | 'USER' | 'SUBADMIN';
export type LoginType = 'MANUAL' | 'GOOGLE' | 'FACEBOOK';
export type Gender = 'MALE' | 'FEMALE';

export type UserStatus =
  | 'WAITING'
  | 'ACTIVE'
  | 'REJECT'
  | 'INACTIVE'
  | 'WAITING_FOR_SUPER_ADMIN'
  | 'DELETE';

// ---------------------------------------------------------------------------
// Core User
// ---------------------------------------------------------------------------

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  gender?: Gender;
  cc?: string;
  phoneNumber?: string;
  phone?: string;
  avatar?: string;
  profilePicture?: string;
  tradeRole: TradeRole;
  userType?: UserType;
  status?: UserStatus;
  statusNote?: string;
  parentUserId?: number;
  masterAccountId?: number;
  dateOfBirth?: string | Date;
  socialLinkList?: SocialLink[];
  phoneNumberList?: { phoneNumber: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface SocialLink {
  linkType: string;
  link: string;
}

// ---------------------------------------------------------------------------
// Auth Responses
// ---------------------------------------------------------------------------

export interface AuthResponse {
  status: boolean;
  message: string;
  accessToken: string;
  refreshToken?: string;
  data: User;
  otp?: number;
}

export interface LoginResponse {
  accessToken: string;
  data: {
    status: UserStatus;
  };
  message: string;
  status: boolean;
  otp: number;
}

export interface RegisterResponse {
  otp: number;
  message: string;
  status: boolean;
  accessToken: string;
}

export interface VerifyOtpResponse {
  accessToken: string;
  data: User;
  message: string;
  status: boolean;
}

// ---------------------------------------------------------------------------
// Auth Requests
// ---------------------------------------------------------------------------

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  loginType: LoginType;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  cc: string;
  phoneNumber: string;
  tradeRole: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: number;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordRequest extends ResetPasswordRequest {
  password: string;
}

// ---------------------------------------------------------------------------
// Multi-Account System
// ---------------------------------------------------------------------------

export interface UserAccount {
  id: number;
  userId: number;
  tradeRole: TradeRole;
  accountName: string;
  isActive: boolean;
  isCurrent: boolean;
  isCurrentAccount?: boolean;
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyWebsite?: string;
  companyTaxId?: string;
  messages?: number;
  orders?: number;
  rfq?: number;
  tracking?: number;
  status?: UserStatus;
  statusNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MainAccount {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  tradeRole: TradeRole;
  accountName: string;
  isMainAccount: boolean;
  isCurrentAccount?: boolean;
  messages?: number;
  orders?: number;
  rfq?: number;
  tracking?: number;
  status?: UserStatus;
  statusNote?: string;
}

export interface CreateAccountRequest {
  tradeRole: 'COMPANY' | 'FREELANCER';
  accountName: string;
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyWebsite?: string;
  companyTaxId?: string;
  identityProof?: string;
  identityProofBack?: string;
}

export interface SwitchAccountRequest {
  userAccountId: number;
}
