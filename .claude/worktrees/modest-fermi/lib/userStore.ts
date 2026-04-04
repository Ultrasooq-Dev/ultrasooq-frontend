import { create } from "zustand";

export type State = {
  user: {
    id: number;
    uniqueId: string;
    email: string;
    firstName: string;
    lastName: string;
    gender: string;
    status: string;
    dateOfBirth: string;
    phoneNumber: string;
    cc: string;
    // password: string;
    tradeRole: string;
    otp: null;
    otpValidTime: null;
    resetPassword: number;
    profilePicture: string;
    identityProof: string;
    identityProofBack: string;
    onlineOffline: null;
    onlineOfflineDateStatus: null;
    createdAt: string;
    updatedAt: string;
    deletedAt: null;
    userType: null;
    userPhone: {
      id: number;
      cc: string;
      phoneNumber: string;
      deletedAt: null;
      createdAt: string;
      updatedAt: string;
      status: string;
      userId: number;
    }[];
    userSocialLink: [];
    userProfile: [];
    userBranch: [];
  };
};

export type Actions = {
  setUser: (data: State["user"]) => void;
};

export const initialUserState: State = {
  user: {
    id: 0,
    uniqueId: "",
    email: "",
    firstName: "",
    lastName: "",
    gender: "",
    status: "",
    dateOfBirth: "",
    phoneNumber: "",
    cc: "",
    // password: "",
    tradeRole: "",
    otp: null,
    otpValidTime: null,
    resetPassword: 0,
    profilePicture: "",
    identityProof: "",
    identityProofBack: "",
    onlineOffline: null,
    onlineOfflineDateStatus: null,
    createdAt: "",
    updatedAt: "",
    deletedAt: null,
    userType: null,
    userPhone: [],
    userSocialLink: [],
    userProfile: [],
    userBranch: [],
  },
};

export const useUserStore = create<State & Actions>()((set) => ({
  user: initialUserState.user,
  setUser: (data) => set((state) => ({ ...state, user: data })),
}));

export const useUser = () => useUserStore((state) => state.user);
