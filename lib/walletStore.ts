import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { IWallet, IWalletTransaction } from "@/utils/types/wallet.types";

export type WalletState = {
  wallet: IWallet | null;
  transactions: IWalletTransaction[];
  lastUpdated: string | null;
  isLoading: boolean;
  error: string | null;
};

export type WalletActions = {
  setWallet: (wallet: IWallet | null) => void;
  setTransactions: (transactions: IWalletTransaction[]) => void;
  addTransaction: (transaction: IWalletTransaction) => void;
  updateWalletBalance: (newBalance: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  resetWallet: () => void;
  updateLastUpdated: () => void;
};

const initialWalletState: WalletState = {
  wallet: null,
  transactions: [],
  lastUpdated: null,
  isLoading: false,
  error: null,
};

export const useWalletStore = create<WalletState & WalletActions>()(
  persist(
    (set, get) => ({
      ...initialWalletState,
      
      setWallet: (wallet) => 
        set((state) => ({ 
          ...state, 
          wallet,
          lastUpdated: new Date().toISOString(),
          error: null 
        })),
      
      setTransactions: (transactions) => 
        set((state) => ({ 
          ...state, 
          transactions,
          lastUpdated: new Date().toISOString() 
        })),
      
      addTransaction: (transaction) => 
        set((state) => ({ 
          ...state, 
          transactions: [transaction, ...state.transactions],
          lastUpdated: new Date().toISOString() 
        })),
      
      updateWalletBalance: (newBalance) => 
        set((state) => ({ 
          ...state, 
          wallet: state.wallet ? { ...state.wallet, balance: newBalance } : null,
          lastUpdated: new Date().toISOString() 
        })),
      
      setLoading: (loading) => 
        set((state) => ({ ...state, isLoading: loading })),
      
      setError: (error) => 
        set((state) => ({ ...state, error })),
      
      resetWallet: () => 
        set(initialWalletState),
      
      updateLastUpdated: () => 
        set((state) => ({ 
          ...state, 
          lastUpdated: new Date().toISOString() 
        })),
    }),
    {
      name: "wallet-storage",
      storage: createJSONStorage(() => localStorage),
      // Only persist essential data, not loading states
      partialize: (state) => ({
        wallet: state.wallet,
        transactions: state.transactions.slice(0, 50), // Keep only last 50 transactions
        lastUpdated: state.lastUpdated,
        isLoading: false,
        error: null,
      }),
    }
  )
);

// Selectors for better performance
export const useWalletBalance = () => useWalletStore((state) => state.wallet?.balance || 0);
export const useWalletStatus = () => useWalletStore((state) => state.wallet?.status || 'INACTIVE');
export const useWalletTransactions = () => useWalletStore((state) => state.transactions);
export const useWalletLoading = () => useWalletStore((state) => state.isLoading);
export const useWalletError = () => useWalletStore((state) => state.error);
