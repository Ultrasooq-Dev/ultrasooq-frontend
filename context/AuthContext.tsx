"use client";

import { setUserLocale } from "@/src/services/locale";
import { CURRENCIES, LANGUAGES, PUREMOON_TOKEN_KEY } from "@/utils/constants";
import { fetchMe } from "@/apis/requests/user.requests";
import { getCookie } from "cookies-next";
import React, {
  createContext,
  startTransition,
  useContext,
  useState,
  useEffect,
  useMemo,
} from "react";

interface User {
  id: number;
  firstName: string;
  lastName: string;
  tradeRole: string;
}

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isAuthenticated: boolean;
  clearUser: () => void;
  permissions: string[];
  setPermissions: (permissions: string[]) => void;
  applyTranslation: (locale: string) => Promise<void>;
  selectedLocale: string;
  langDir: string;
  currency: (typeof CURRENCIES)[0];
  changeCurrency: (code: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{
  user: User | null;
  permissions: string[];
  children: React.ReactNode;
  locale?: string;
}> = ({
  user: initialUser,
  permissions: initialPermissions,
  children,
  locale,
}) => {
  const [user, setUser] = useState<User | null>(initialUser);

  const [permissions, setPermissions] = useState<string[]>(initialPermissions);

  // Client-side user recovery: If server-side auth failed but token exists, fetch user
  useEffect(() => {
    if (!user && typeof window !== "undefined") {
      const token = getCookie(PUREMOON_TOKEN_KEY);
      if (token) {
        fetchMe()
          .then((res) => {
            if (res?.data?.data?.id) {
              setUser({
                id: res.data.data.id,
                firstName: res.data.data.firstName || "",
                lastName: res.data.data.lastName || "",
                tradeRole: res.data.data.tradeRole || "",
              });
            }
          })
          .catch(() => {
            // Silent fail - user will need to login again
          });
      }
    }
  }, [user]);

  const isAuthenticated = !!user;

  const clearUser = () => {
    setUser(null);
  };

  const [selectedLocale, setSelectedLocale] = useState<string>(locale || "en");

  const applyTranslation = async (locale: string): Promise<void> => {
    await setUserLocale(locale);
    window.localStorage.setItem("locale", locale);
    startTransition(() => {
      setSelectedLocale(locale);
    });
  };

  const [currency, setCurrency] = useState<(typeof CURRENCIES)[0]>(
    CURRENCIES.find((item) => item.code == "OMR") || CURRENCIES[0],
  );

  const changeCurrency = (code: string) => {
    setCurrency(CURRENCIES.find((item) => item.code == code) || CURRENCIES[0]);
    startTransition(() => {});
  };

  // Compute currency symbol based on locale (for OMR: Arabic vs English)
  const currencyWithLocale = useMemo(() => {
    let symbol = currency.symbol;

    if (currency.code === "OMR") {
      // Check if currency has symbolAr property and locale is Arabic
      const currencyWithAr = currency as (typeof CURRENCIES)[0] & {
        symbolAr?: string;
      };
      symbol =
        selectedLocale === "ar" && currencyWithAr.symbolAr
          ? currencyWithAr.symbolAr
          : currency.symbol;
    }

    return {
      ...currency,
      symbol,
    };
  }, [currency, selectedLocale]);

  let data = {
    user,
    setUser,
    isAuthenticated,
    clearUser,
    permissions,
    setPermissions,
    applyTranslation,
    selectedLocale,
    langDir:
      LANGUAGES.find((language) => language.locale == selectedLocale)
        ?.direction || "ltr",
    currency: currencyWithLocale,
    changeCurrency,
  };

  return <AuthContext.Provider value={data}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
