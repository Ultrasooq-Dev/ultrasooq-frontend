"use client";
import React, {
  useState,
  useEffect,
  cloneElement,
  isValidElement,
} from "react";
import { useSidebar } from "@/context/SidebarContext";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import {
  XIcon,
  UserIcon,
  WrenchIcon,
  CreditCardIcon,
  ChevronRightIcon,
  ShoppingCartIcon,
  PackageIcon,
  MessageCircleIcon,
  UsersIcon,
  FileTextIcon,
  SettingsIcon,
  LogOutIcon,
  ChevronsLeftIcon,
  MenuIcon,
  Building2Icon,
  BriefcaseIcon,
  StoreIcon,
  ShoppingBagIcon,
  FileSearchIcon,
  BarChart3Icon,
  UserCheckIcon,
  WalletIcon,
} from "lucide-react";
import { getCookie, deleteCookie } from "cookies-next";
import { PUREMOON_TOKEN_KEY } from "@/utils/constants";
import { useCurrentAccount } from "@/apis/queries/auth.queries";
import { useMe } from "@/apis/queries/user.queries";
import { useQueryClient } from "@tanstack/react-query";
import { signOut } from "next-auth/react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

type SidebarProps = {
  notificationCount?: any;
};

type MenuItem = {
  icon: React.ReactNode;
  label: string;
  shortLabel: string;
  translationKey: string; // Add translation key for proper short label translation
  path?: string | string[];
  onClick: () => void;
  isLogout?: boolean;
  subLabel?: string;
};

const Sidebar: React.FC<SidebarProps> = ({ notificationCount }) => {
  const { isHovered, setIsHovered, isOpen, closeSidebar } = useSidebar();
  const t = useTranslations();
  const { langDir, clearUser } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const accessToken = getCookie(PUREMOON_TOKEN_KEY);
  const { data: currentAccountData } = useCurrentAccount();
  const me = useMe(!!accessToken);
  const [isClient, setIsClient] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Ensure component only renders on client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Get current user's trade role - matching Header's logic
  const currentTradeRole =
    currentAccountData?.data?.data?.account?.tradeRole ||
    me?.data?.data?.tradeRole ||
    "BUYER";

  // Helper function to check if a path is active
  const isActivePath = (paths: string | string[]): boolean => {
    if (!pathname) return false;
    const pathArray = Array.isArray(paths) ? paths : [paths];
    return pathArray.some((path) => {
      if (pathname === path) return true;
      // Also check if pathname starts with the path (for nested routes)
      if (pathname.startsWith(path + "/")) return true;
      return false;
    });
  };

  // Helper function to generate short labels from translation keys
  const getShortLabel = (translationKey: string): string => {
    // Get the full translated label first
    const fullLabel = t(translationKey);

    // Map translation keys to their short versions (if they exist in translations)
    // Otherwise, we'll truncate the full label
    const shortLabelKeyMap: Record<string, string> = {
      rfq_requests: "rfq",
      rfq_quotes: "rfq",
      cart: "cart",
      wishlist: "wishlist",
      messages: "message",
      analytics: "analytics",
      dropshipping: "dropshipping",
      profile: "profile",
      settings: "settings",
      logout: "logout",
    };

    // Try to get short translation key if it exists
    const shortKey = shortLabelKeyMap[translationKey];

    if (shortKey) {
      try {
        // Try to get translated short label
        const translatedShort = t(shortKey);
        // Only use it if it's different from the full label and translation exists
        if (translatedShort && translatedShort !== fullLabel) {
          return translatedShort.length > 6
            ? translatedShort.substring(0, 6) + "..."
            : translatedShort;
        }
      } catch {
        // If short key doesn't exist in translations, fall through to truncate full label
      }
    }

    // Fallback: truncate the full translated label (works for both languages)
    return fullLabel.length > 6 ? fullLabel.substring(0, 6) + "..." : fullLabel;
  };

  // Role-based menu items
  const getMenuItems = (): MenuItem[] => {
    const baseItems: MenuItem[] = [
      {
        icon: <UserIcon className="h-5 w-5 text-blue-600" />,
        label: t("my_accounts"),
        translationKey: "my_accounts",
        shortLabel: getShortLabel("my_accounts"),
        path: "/my-accounts",
        onClick: () => {
          router.push("/my-accounts");
        },
      },
    ];

    // BUYER specific items
    if (currentTradeRole === "BUYER") {
      baseItems.push(
        {
          icon: <ShoppingBagIcon className="h-5 w-5 text-indigo-600" />,
          label: t("my_orders"),
          translationKey: "my_orders",
          shortLabel: getShortLabel("my_orders"),
          path: "/my-orders",
          onClick: () => {
            router.push("/my-orders");
          },
        },
        {
          icon: <FileSearchIcon className="h-5 w-5 text-purple-600" />,
          label: t("rfq_requests"),
          translationKey: "rfq_requests",
          shortLabel: getShortLabel("rfq_requests"),
          path: "/rfq-request",
          onClick: () => {
            router.push("/rfq-request");
          },
        },
        {
          icon: <ShoppingCartIcon className="h-5 w-5 text-orange-600" />,
          label: t("cart"),
          translationKey: "cart",
          shortLabel: getShortLabel("cart"),
          path: "/cart",
          onClick: () => {
            router.push("/cart");
          },
        },
        {
          icon: <StoreIcon className="h-5 w-5 text-pink-600" />,
          label: t("wishlist"),
          translationKey: "wishlist",
          shortLabel: getShortLabel("wishlist"),
          path: "/wishlist",
          onClick: () => {
            router.push("/wishlist");
          },
        },
      );
    }

    // FREELANCER specific items
    if (currentTradeRole === "FREELANCER") {
      baseItems.push(
        {
          icon: <PackageIcon className="h-5 w-5 text-blue-600" />,
          label: t("my_products"),
          translationKey: "my_products",
          shortLabel: getShortLabel("my_products"),
          path: "/manage-products",
          onClick: () => {
            router.push("/manage-products");
          },
        },
        {
          icon: <WrenchIcon className="h-5 w-5 text-teal-600" />,
          label: t("my_services"),
          translationKey: "my_services",
          shortLabel: getShortLabel("my_services"),
          path: "/manage-services",
          onClick: () => {
            router.push("/manage-services");
          },
        },
        {
          icon: <FileSearchIcon className="h-5 w-5 text-purple-600" />,
          label: t("rfq_quotes"),
          translationKey: "rfq_quotes",
          shortLabel: getShortLabel("rfq_quotes"),
          path: "/rfq-request",
          onClick: () => {
            router.push("/rfq-request");
          },
        },
        {
          icon: <ShoppingCartIcon className="h-5 w-5 text-orange-600" />,
          label: t("orders"),
          translationKey: "orders",
          shortLabel: getShortLabel("orders"),
          path: "/seller-orders",
          onClick: () => {
            router.push("/seller-orders");
          },
        },
        {
          icon: <UsersIcon className="h-5 w-5 text-violet-600" />,
          label: t("team_members"),
          translationKey: "team_members",
          shortLabel: getShortLabel("team_members"),
          path: "/team-members",
          onClick: () => {
            router.push("/team-members");
          },
        },
        {
          icon: <MessageCircleIcon className="h-5 w-5 text-cyan-600" />,
          label: t("messages"),
          translationKey: "messages",
          shortLabel: getShortLabel("messages"),
          path: "/messages",
          onClick: () => {
            router.push("/messages");
          },
        },
        {
          icon: <BarChart3Icon className="h-5 w-5 text-green-600" />,
          label: t("analytics"),
          translationKey: "analytics",
          shortLabel: getShortLabel("analytics"),
          path: "/analytics",
          onClick: () => {
            router.push("/analytics");
          },
        },
      );
    }

    // COMPANY specific items
    if (currentTradeRole === "COMPANY") {
      baseItems.push(
        {
          icon: <PackageIcon className="h-5 w-5 text-blue-600" />,
          label: t("my_products"),
          translationKey: "my_products",
          shortLabel: getShortLabel("my_products"),
          path: "/manage-products",
          onClick: () => {
            router.push("/manage-products");
          },
        },
        {
          icon: <WrenchIcon className="h-5 w-5 text-teal-600" />,
          label: t("my_services"),
          translationKey: "my_services",
          shortLabel: getShortLabel("my_services"),
          path: "/manage-services",
          onClick: () => {
            router.push("/manage-services");
          },
        },
        {
          icon: <FileSearchIcon className="h-5 w-5 text-purple-600" />,
          label: t("rfq_quotes"),
          translationKey: "rfq_quotes",
          shortLabel: getShortLabel("rfq_quotes"),
          path: "/rfq-request",
          onClick: () => {
            router.push("/rfq-request");
          },
        },
        {
          icon: <ShoppingCartIcon className="h-5 w-5 text-orange-600" />,
          label: t("orders"),
          translationKey: "orders",
          shortLabel: getShortLabel("orders"),
          path: "/orders",
          onClick: () => {
            router.push("/orders");
          },
        },
        {
          icon: <PackageIcon className="h-5 w-5 text-indigo-600" />,
          label: t("dropshipping"),
          translationKey: "dropshipping",
          shortLabel: getShortLabel("dropshipping"),
          path: "/dropship-products",
          onClick: () => {
            router.push("/dropship-products");
          },
        },
        {
          icon: <UsersIcon className="h-5 w-5 text-violet-600" />,
          label: t("team_members"),
          translationKey: "team_members",
          shortLabel: getShortLabel("team_members"),
          path: "/team-members",
          onClick: () => {
            router.push("/team-members");
          },
        },
        {
          icon: <BarChart3Icon className="h-5 w-5 text-green-600" />,
          label: t("analytics"),
          translationKey: "analytics",
          shortLabel: getShortLabel("analytics"),
          path: "/analytics",
          onClick: () => {
            router.push("/analytics");
          },
        },
      );
    }

    // Common items for all roles
    baseItems.push(
      {
        icon: <UserCheckIcon className="h-5 w-5 text-blue-600" />,
        label: t("profile"),
        translationKey: "profile",
        shortLabel: getShortLabel("profile"),
        path: [
          "/buyer-profile-details",
          "/freelancer-profile-details",
          "/company-profile-details",
          "/member-profile-details",
          "/profile",
        ],
        onClick: () => {
          // Get the current trade role at click time to avoid closure issues
          // Match Header's logic exactly: currentAccount?.data?.data?.account?.tradeRole || me?.data?.data?.tradeRole
          const tradeRole =
            currentAccountData?.data?.data?.account?.tradeRole ||
            me?.data?.data?.tradeRole ||
            "BUYER";

          // Redirect to role-specific profile - matching Header's handleProfile function
          if (tradeRole === "BUYER") {
            router.push("/buyer-profile-details");
          } else if (tradeRole === "FREELANCER") {
            router.push("/freelancer-profile-details");
          } else if (tradeRole === "COMPANY") {
            router.push("/company-profile-details");
          } else if (tradeRole === "MEMBER") {
            router.push("/member-profile-details");
          } else {
            router.push("/profile");
          }
        },
      },
      {
        icon: <WalletIcon className="h-5 w-5 text-amber-600" />,
        label: t("my_wallet"),
        translationKey: "my_wallet",
        shortLabel: getShortLabel("my_wallet"),
        path: "/wallet",
        onClick: () => {
          router.push("/wallet");
        },
      },
      {
        icon: <SettingsIcon className="h-5 w-5 text-gray-600" />,
        label: t("settings"),
        translationKey: "settings",
        shortLabel: getShortLabel("settings"),
        path: "/my-settings",
        onClick: () => {
          router.push("/my-settings");
        },
      },
      {
        icon: <LogOutIcon className="h-5 w-5 text-red-500" />,
        label: t("logout"),
        translationKey: "logout",
        shortLabel: getShortLabel("logout"),
        isLogout: true,
        onClick: async () => {
          try {
            // Delete the token cookie
            deleteCookie(PUREMOON_TOKEN_KEY);
            // Clear React Query cache
            queryClient.clear();
            // Clear user from AuthContext
            clearUser();
            // Sign out from NextAuth
            await signOut({
              redirect: false,
              callbackUrl: "/home",
            });
            // Close sidebar on mobile
            if (typeof window !== "undefined" && window.innerWidth < 768) {
              closeSidebar();
            }
            // Show success toast
            toast({
              title: t("logout_successful"),
              description: t("you_have_successfully_logged_out"),
              variant: "success",
            });
            // Force a full page reload to ensure all components re-initialize with updated cookie state
            // This ensures the Header component re-reads the cookie and shows login/register buttons
            window.location.href = "/home";
          } catch (error) {
            console.error("Logout error:", error);
            toast({
              title: t("error") || "Error",
              description:
                t("logout_failed") || "Failed to logout. Please try again.",
              variant: "destructive",
            });
          }
        },
      },
    );

    return baseItems;
  };

  const menuItems = getMenuItems();

  // Show loading state when not on client side
  if (!isClient) {
    return null;
  }

  return (
    <>
      {/* Backdrop for mobile - only visible when sidebar is open on mobile */}
      {accessToken && isOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-sm transition-opacity duration-300 md:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar - Mobile: slide in/out, Desktop: always visible with hover */}
      {accessToken && (
        <aside
          aria-label="Sidebar navigation"
          className={cn(
            "fixed top-0 z-[70] h-full bg-white shadow-xl",
            // Position based on language direction
            langDir === "rtl" ? "right-0" : "left-0",
            // Mobile: slide in/out based on isOpen, full width when open
            isOpen
              ? "w-64 translate-x-0"
              : langDir === "rtl"
                ? "translate-x-full md:translate-x-0"
                : "-translate-x-full md:translate-x-0",
            // Desktop: always visible, expand on hover
            "overflow-visible md:w-[72px]",
            isHovered && "md:w-64",
          )}
          style={{
            boxShadow:
              "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
            // Border based on language direction
            ...(langDir === "rtl"
              ? {
                  borderLeft: "1px solid rgba(0, 0, 0, 0.05)",
                  borderRight: "none",
                }
              : {
                  borderRight: "1px solid rgba(0, 0, 0, 0.05)",
                  borderLeft: "none",
                }),
            // Optimize transitions - only transition width for better performance
            transition: "width 200ms cubic-bezier(0.4, 0, 0.2, 1)",
            willChange: "width",
            // Force GPU acceleration
            transform: "translateZ(0)",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="flex h-full flex-col">
            {/* Dark cyan header section - matches full header height (welcome row + main content row) */}
            {/* Header structure (reduced):
                - Container: pt-1.5 (6px) md:pt-2 (8px) lg:pt-2.5 (10px)
                - Welcome row: py-1 (4px*2 + ~20px content) md:py-1.5 (6px*2 + ~22px) lg:py-2 (8px*2 + ~24px)
                - Main content row: py-1.5 (6px*2 + ~50px content) md:py-2 (8px*2 + ~55px) lg:py-2 (8px*2 + ~60px)
                Total: ~96px md:~113px lg:~126px (increased slightly) */}
            <div
              className={cn(
                "from-dark-cyan via-dark-cyan relative flex items-center justify-between overflow-hidden bg-gradient-to-br to-blue-700",
                // Match full header height including both welcome row and main content row (slightly decreased)
                "h-[116px] md:h-[133px] lg:h-[146px]",
                isHovered || isOpen ? "px-4" : "px-2",
              )}
              style={{
                transition: "padding 200ms cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              {/* Decorative background pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 -mt-16 -mr-16 h-32 w-32 rounded-full bg-white"></div>
                <div className="absolute bottom-0 left-0 -mb-12 -ml-12 h-24 w-24 rounded-full bg-white"></div>
              </div>
              {isHovered || isOpen ? (
                <div className="relative z-10 flex w-full items-center justify-center text-white">
                  {/* Full ULTRASOOQ Logo - when sidebar is expanded */}
                  <Image
                    src="/images/logo1.png"
                    alt="Ultrasooq Logo"
                    width={180}
                    height={60}
                    className="h-auto w-auto max-w-[180px] object-contain"
                    priority
                  />
                  {/* Close button for mobile - positioned absolutely */}
                  <button
                    onClick={closeSidebar}
                    className={cn(
                      "absolute flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-white/20 md:hidden",
                      langDir === "rtl" ? "left-4" : "right-4",
                    )}
                    aria-label="Close menu"
                  >
                    <XIcon className="h-5 w-5 text-white" />
                  </button>
                </div>
              ) : (
                <div className="relative z-10 flex w-full items-center justify-center text-white">
                  {/* US Intertwined Logo - when sidebar is collapsed */}
                  <Image
                    src="/images/logoicon.png"
                    alt="Ultrasooq Icon"
                    width={40}
                    height={40}
                    className="h-10 w-10 object-contain"
                    priority
                  />
                </div>
              )}
            </div>

            {/* White Menu Items - starts at same level as bottom of header main content row */}
            <div className="scrollbar-hide flex-1 overflow-x-visible overflow-y-auto bg-gradient-to-b from-gray-50 to-white">
              {/* No top padding needed - sidebar header height already matches full header height */}
              <div className="py-1">
                {menuItems.map((item, index) => {
                  const isActive = item.path ? isActivePath(item.path) : false;
                  return (
                    <div
                      key={index}
                      className={cn(
                        "group relative flex cursor-pointer items-center transition-all duration-200",
                        isHovered || isOpen
                          ? "mx-2 justify-between rounded-lg px-4 py-2 hover:bg-blue-50 hover:shadow-sm"
                          : "mx-1 min-h-[64px] flex-col justify-center rounded-lg px-1 py-2.5 hover:bg-blue-50",
                        isActive &&
                          (isHovered || isOpen) &&
                          "bg-blue-500/10 shadow-sm",
                        isActive &&
                          !(isHovered || isOpen) &&
                          "rounded-lg bg-blue-500/20",
                        item.isLogout && "mt-3 border-t-2 border-gray-200 pt-3",
                        langDir === "rtl" &&
                          (isHovered || isOpen) &&
                          "flex-row-reverse",
                      )}
                      onClick={() => {
                        item.onClick();
                        // Close sidebar on mobile when item is clicked
                        if (
                          typeof window !== "undefined" &&
                          window.innerWidth < 768
                        ) {
                          closeSidebar();
                        }
                      }}
                      title={!(isHovered || isOpen) ? item.label : undefined}
                    >
                      {/* Active indicator line */}
                      <div
                        className={cn(
                          "absolute top-1/2 h-0 w-1 -translate-y-1/2 bg-blue-600 opacity-0 transition-all duration-200 group-hover:h-8 group-hover:opacity-100",
                          langDir === "rtl"
                            ? "right-0 rounded-l-full"
                            : "left-0 rounded-r-full",
                        )}
                      ></div>

                      <div
                        className={cn(
                          "flex w-full items-center",
                          isHovered || isOpen
                            ? "space-x-3"
                            : "flex-col justify-center space-y-1.5",
                          langDir === "rtl" &&
                            (isHovered || isOpen) &&
                            "flex-row-reverse",
                        )}
                      >
                        <div
                          className={cn(
                            "relative flex shrink-0 items-center justify-center overflow-visible rounded-lg transition-all duration-200",
                            isHovered || isOpen
                              ? "p-1.5"
                              : "min-h-[32px] min-w-[32px] p-2",
                            !(isHovered || isOpen) &&
                              "group-hover:scale-110 group-hover:bg-blue-100",
                          )}
                        >
                          <div
                            className={cn(
                              "flex h-full w-full items-center justify-center transition-all duration-200",
                              (isHovered || isOpen) && "group-hover:scale-110",
                            )}
                          >
                            {isValidElement(item.icon) && isActive
                              ? cloneElement(
                                  item.icon as React.ReactElement<any>,
                                  {
                                    strokeWidth: 2.5,
                                    className: cn(
                                      (item.icon as React.ReactElement<any>)
                                        .props.className,
                                      "font-bold",
                                    ),
                                  },
                                )
                              : item.icon}
                          </div>
                          {item.isLogout && (
                            <div className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-red-500 shadow-sm"></div>
                          )}
                        </div>
                        {!(isHovered || isOpen) && item.shortLabel && (
                          <div className="flex w-full flex-col items-center justify-center px-0.5">
                            <div
                              className={cn(
                                "text-center text-[10px] leading-tight font-semibold transition-colors duration-200",
                                item.isLogout
                                  ? "text-red-600"
                                  : isActive
                                    ? "text-blue-700"
                                    : "text-gray-700",
                              )}
                              style={{
                                maxWidth: "48px",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                              }}
                            >
                              {item.shortLabel}
                            </div>
                          </div>
                        )}
                        {(isHovered || isOpen) && (
                          <div className="min-w-0 flex-1">
                            <div
                              className={cn(
                                "text-sm font-medium whitespace-nowrap transition-colors duration-200",
                                item.isLogout
                                  ? "text-red-600 group-hover:text-red-700"
                                  : isActive
                                    ? "font-semibold text-blue-700"
                                    : "text-gray-700 group-hover:text-blue-600",
                              )}
                            >
                              {item.label}
                            </div>
                            {item.subLabel && (
                              <div className="mt-0.5 text-xs whitespace-nowrap text-gray-500">
                                {item.subLabel}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      {(isHovered || isOpen) && !item.isLogout && (
                        <ChevronRightIcon
                          className={cn(
                            "h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 group-hover:text-blue-600",
                            langDir === "rtl"
                              ? "rotate-180 group-hover:-translate-x-1"
                              : "group-hover:translate-x-1",
                          )}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer section - only visible when expanded */}
            {(isHovered || isOpen) && (
              <div className="border-t border-gray-200 bg-gradient-to-b from-gray-50 to-white px-4 py-3">
                <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                  <span>© 2024 Ultrasooq</span>
                </div>
              </div>
            )}
          </div>
        </aside>
      )}
    </>
  );
};

export default Sidebar;
