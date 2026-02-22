import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type State = {
  orders: {
    guestUser?: {
      firstName: string;
      lastName: string;
      email: string;
      cc: string;
      phoneNumber: string;
    };
    cartIds: number[];
    serviceCartIds: number[];
    firstName: string;
    lastName: string;
    email: string;
    cc: string;
    phone: string;
    billingAddress?: string;
    billingCity?: string;
    billingProvince?: string;
    billingCountry?: string;
    billingPostCode?: string;
    shippingAddress?: string;
    shippingCity?: string;
    shippingProvince?: string;
    shippingCountry?: string;
    shippingPostCode?: string;
    town?: string;
    countryId?: number;
    stateId?: number;
    cityId?: number;
    userAddressId?: number;
    deliveryCharge?: number;
    shipping: any[]
  };
  total: number;
};

// export type Actions = {
//   setOrders: (data: State["orders"]) => void;
// };
export type Actions = {
  setOrders: (data: State["orders"]) => void;
  resetOrders: () => void;
  setTotal: (total: number) => void;
};

export const initialOrderState: State = {
  orders: {
    guestUser: undefined,
    cartIds: [],
    serviceCartIds: [],
    firstName: "",
    lastName: "",
    email: "",
    cc: "",
    phone: "",
    billingAddress: "",
    billingCity: "",
    billingProvince: "",
    billingCountry: "",
    billingPostCode: "",
    shippingAddress: "",
    shippingCity: "",
    shippingProvince: "",
    shippingCountry: "",
    shippingPostCode: "",
    deliveryCharge: 0,
    shipping: []
  },
  total: 0
};

// export const useOrderStore = create<State & Actions>()((set) => ({
//   orders: initialOrderState.orders,
//   setOrders: (data) => set((state) => ({ ...state, orders: data })),
// }));

export const useOrderStore = create<State & Actions>()(
  persist(
    (set) => ({
      orders: initialOrderState.orders,

      setOrders: (data) => set({ orders: data }),

      resetOrders: () => set({ orders: initialOrderState.orders }),

      total: initialOrderState.total,

      setTotal: (total) => set({ total: total })
    }),
    {
      name: "order-storage", // Key to store in localStorage
      storage: createJSONStorage(() => localStorage),
    }
  )
);
