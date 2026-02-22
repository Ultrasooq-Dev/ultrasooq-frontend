"use client";
import { useCurrentAccount } from "@/apis/queries/auth.queries";
import {
  useCartCountWithLogin,
  useCartCountWithoutLogin,
} from "@/apis/queries/cart.queries";
import { useRfqCartListByUserId } from "@/apis/queries/rfq.queries";
import { useCategory } from "@/apis/queries/category.queries";
import { useMe } from "@/apis/queries/user.queries";
import { useWishlistCount } from "@/apis/queries/wishlist.queries";
import { fetchIpInfo } from "@/apis/requests/ip.requests";
import QueryForm from "@/components/modules/QueryForm";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useSidebar } from "@/context/SidebarContext";
import {
  PERMISSION_MESSAGE_SYSTEM,
  PERMISSION_ORDERS,
  PERMISSION_PRODUCTS,
  PERMISSION_RFQ_QUOTES,
  PERMISSION_RFQ_SELLER_REQUESTS,
  PERMISSION_SELLER_REWARDS,
  PERMISSION_SERVICES,
  PERMISSION_SHARE_LINKS,
  PERMISSION_TEAM_MEMBERS,
  getPermissions,
} from "@/helpers/permission";
import { useAccessControl } from "@/hooks/useAccessControl";
import { useCategoryStore } from "@/lib/categoryStore";
import { cn } from "@/lib/utils";
import CartIcon from "@/public/images/cart.svg";
import UnAuthUserIcon from "@/public/images/login.svg";
import LogoIcon from "@/public/images/logo1.png";
import WishlistIcon from "@/public/images/wishlist.svg";
import NotificationBell from "@/components/shared/NotificationBell";
import {
  CURRENCIES,
  LANGUAGES,
  PRODUCT_CATEGORY_ID,
  PUREMOON_TOKEN_KEY,
  menuBarIconList,
} from "@/utils/constants";
import { getInitials, getOrCreateDeviceId } from "@/utils/helper";
import { useQueryClient } from "@tanstack/react-query";
import { deleteCookie, getCookie, setCookie } from "cookies-next";
import { debounce, isArray } from "lodash";
import { MenuIcon, LayoutGrid, Search } from "lucide-react";
import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { IoCloseOutline } from "react-icons/io5";
import { MdOutlineImageNotSupported } from "react-icons/md";
import { useClickOutside } from "use-events";
import SearchAutocomplete from "@/components/modules/search/SearchAutocomplete";
import { ThemeToggle } from "@/components/ThemeToggle";

type CategoryProps = {
  id: number;
  parentId: number;
  name: string;
  icon: string;
  children: any;
};

type ButtonLinkProps = {
  href: string;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

const ButtonLink: React.FC<ButtonLinkProps> = ({
  href,
  onClick,
  children,
  className = "",
  style,
  ...props
}) => {
  return (
    <Link href={href} onClick={onClick} {...props}>
      <button
        type="button"
        className={`flex cursor-pointer text-sm uppercase md:px-3 md:py-1 md:text-sm lg:px-4 lg:text-base xl:text-lg ${className}`}
        style={style}
        onClick={onClick}
      >
        {children}
      </button>
    </Link>
  );
};

const STATIC_NAV_ITEMS = [
  { id: "store", href: "/trending", translationKey: "store", icon: menuBarIconList[1] },
  { id: "buy_group", href: "/buygroup", translationKey: "buy_group", icon: menuBarIconList[2] },
  { id: "rfq", href: "/rfq", translationKey: "rfq", icon: menuBarIconList[4] },
];

const Header: React.FC<{ locale?: string }> = ({ locale = "en" }) => {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const permissions: string[] = getPermissions();
  const { toast } = useToast();
  const accessToken = getCookie(PUREMOON_TOKEN_KEY);
  const { isHovered, isOpen, openSidebar, closeSidebar } = useSidebar();
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Ensure hydration matches - only calculate sidebar width after mount
  useEffect(() => {
    setMounted(true);
    // Check if mobile on mount
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Calculate sidebar width for header padding
  // Mobile: no padding (sidebar slides in/out)
  // Desktop: Always 72px (collapsed width) - sidebar expands over content on hover
  // Use 0 during SSR to match initial client render
  const sidebarWidth = mounted && accessToken && !isMobile ? 72 : 0;

  const homeButtonClasses =
    pathname === "/home" ? "active-nav-item" : "inactive-nav-item";
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [categoryId, setCategoryId] = useState();
  const [isCategorySidebarOpen, setIsCategorySidebarOpen] = useState(false);

  // Sync Header's state with CategorySidebar close events
  useEffect(() => {
    const handleCloseCategorySidebar = () => {
      setIsCategorySidebarOpen(false);
    };

    window.addEventListener("closeCategorySidebar", handleCloseCategorySidebar);

    return () => {
      window.removeEventListener("closeCategorySidebar", handleCloseCategorySidebar);
    };
  }, []);
  // const [subCategoryId, setSubCategoryId] = useState();
  const [subCategoryIndex, setSubCategoryIndex] = useState(0);
  const [subSubCategoryIndex, setSubSubCategoryIndex] = useState(0);
  const [subSubSubCategoryIndex, setSubSubSubCategoryIndex] = useState(0);

  const hasAccessToken = !!getCookie(PUREMOON_TOKEN_KEY);
  const deviceId = getOrCreateDeviceId() || "";
  const {
    clearUser,
    applyTranslation,
    langDir,
    changeCurrency,
    selectedLocale: currentLocale,
  } = useAuth();
  const wishlistCount = useWishlistCount(hasAccessToken);
  const cartCountWithLogin = useCartCountWithLogin(hasAccessToken);
  const cartCountWithoutLogin = useCartCountWithoutLogin(
    { deviceId },
    !hasAccessToken,
  );

  // Determine if there are any items in cart (for layout adjustments)
  const hasCartItems =
    (hasAccessToken &&
      !isArray(cartCountWithLogin.data?.data) &&
      (cartCountWithLogin.data?.data || 0) > 0) ||
    (!hasAccessToken &&
      !isArray(cartCountWithoutLogin.data?.data) &&
      (cartCountWithoutLogin.data?.data || 0) > 0);

  // Check RFQ cart items for RFQ pages
  const rfqCartQuery = useRfqCartListByUserId(
    { page: 1, limit: 1 },
    hasAccessToken && pathname?.startsWith("/rfq"),
  );
  // Check if RFQ cart has items - response structure is rfqCartQuery.data.data (array)
  const hasRfqCartItems = 
    Array.isArray(rfqCartQuery.data?.data) && rfqCartQuery.data.data.length > 0;
  const category = useCategoryStore();
  const me = useMe(!!accessToken);
  const currentAccount = useCurrentAccount();
  const subCategoryQuery = useCategory(
    PRODUCT_CATEGORY_ID.toString(), //categoryId ? categoryId : "",
    true, //!!categoryId,
  );

  // Get access control information
  const accessControl = useAccessControl();
  const currentTradeRole =
    currentAccount?.data?.data?.account?.tradeRole || me?.data?.data?.tradeRole;
  const userStatus = accessControl.userStatus;

  const [searchTerm, setSearchTerm] = useState(searchParams?.get("term") || "");
  const [showAutocomplete, setShowAutocomplete] = useState(false);

  const [isActive, setIsActive] = useState(false);

  const handleClick = () => {
    setIsActive(!isActive);
  };

  const [selectedLocale, setSelectedLocale] = useState<string>(locale || "en");
  const languages = [...LANGUAGES];

  const [selectedCurrency, setSelectedCurrency] = useState<string>("OMR");
  // const currencies = [...CURRENCIES];
  const currencies = CURRENCIES.filter((currency) => currency.code === "OMR");

  // Force refresh current account data when pathname changes (account switching)
  useEffect(() => {
    if (currentAccount?.refetch) {
      currentAccount.refetch();
    }
  }, [pathname, currentAccount?.refetch]);

  // Debounced function to update URL
  const updateURL = debounce((newTerm) => {
    if (typeof window === "undefined") return; // Prevent SSR issues
    const params = new URLSearchParams(window.location.search);
    if (newTerm) {
      params.set("term", newTerm);
      router.replace(`/search?${params.toString()}`); // Update URL dynamically
    } else {
      router.replace(`/trending`); // Update URL dynamically
    }
  }, 300);

  const handleSearch = (event: any) => {
    const newTerm = event.target.value;
    setSearchTerm(newTerm);
    setShowAutocomplete(newTerm.length >= 2);
    updateURL(newTerm);
  };

  const handleKeyDown = (event: any) => {
    if (event.key === "Enter") {
      setShowAutocomplete(false);
      handleSearch(event);
    }
  };

  const handleAutocompleteSelect = (term: string) => {
    setSearchTerm(term);
    setShowAutocomplete(false);
    updateURL(term);
  };

  const memoizedInitials = useMemo(() => {
    let firstName, lastName;

    if (currentAccount?.data?.data?.isMainAccount) {
      // Main account - get from currentAccount
      const account = currentAccount.data.data.account;
      if ("firstName" in account) {
        firstName = account.firstName;
        lastName = account.lastName;
      }
    } else if (currentAccount?.data?.data?.account) {
      // Sub-account - use me data for user info
      firstName = me.data?.data?.firstName;
      lastName = me.data?.data?.lastName;
    } else {
      // Fallback to me data
      firstName = me.data?.data?.firstName;
      lastName = me.data?.data?.lastName;
    }

    const initials = getInitials(firstName, lastName);
    return initials;
  }, [
    currentAccount?.data?.data,
    me.data?.data?.firstName,
    me.data?.data?.lastName,
  ]);

  const memoizedSubCategory = useMemo(() => {
    let tempArr: any = [];
    if (subCategoryQuery.data?.data) {
      tempArr = subCategoryQuery.data.data?.children;
    }
    return tempArr || [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subCategoryQuery.data?.data, categoryId]);

  const handleProfile = () => {
    switch (currentTradeRole) {
      case "BUYER":
        return "/buyer-profile-details";
      case "FREELANCER":
        return "/freelancer-profile-details";
      case "COMPANY":
        return "/company-profile-details";
      case "MEMBER":
        return "/member-profile-details";
      default:
        return "/home";
    }
  };

  const handleLogout = async () => {
    setIsLoggedIn(false);
    deleteCookie(PUREMOON_TOKEN_KEY);
    queryClient.clear();
    clearUser();
    const data = await signOut({
      redirect: false,
      callbackUrl: "/home",
    });
    toast({
      title: t("logout_successful"),
      description: t("you_have_successfully_logged_out"),
      variant: "success",
    });

    router.push("/home");
  };

  const wrapperRef = useRef(null);
  const [isClickedOutside] = useClickOutside([wrapperRef], (event) => {});

  const [isQueryModalOpen, setIsQueryModalOpen] = useState(false);
  const handleToggleQueryModal = () => setIsQueryModalOpen(!isQueryModalOpen);

  // Smart header scroll behavior
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const controlHeader = () => {
      if (typeof window !== "undefined") {
        const currentScrollY = window.scrollY;

        // Show header when scrolling up or at the top
        if (currentScrollY < lastScrollY || currentScrollY < 10) {
          setShowHeader(true);
        }
        // Hide header when scrolling down and past threshold
        else if (currentScrollY > lastScrollY && currentScrollY > 80) {
          setShowHeader(false);
        }

        setLastScrollY(currentScrollY);
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("scroll", controlHeader);

      return () => {
        window.removeEventListener("scroll", controlHeader);
      };
    }
  }, [lastScrollY]);

  useEffect(() => {
    if (accessToken) {
      setIsLoggedIn(true);
    }
  }, [pathname, accessToken]);

  useEffect(() => {
    if (isClickedOutside) {
      setCategoryId(undefined);
    }
  }, [isClickedOutside]);

  useEffect(() => {
    const getIpInfo = async () => {
      try {
        if (!window?.localStorage?.ipInfo || getCookie("ipInfoLoaded") != "1") {
          const response = await fetchIpInfo();

          const ip = response.data.ip;
          if (ip) {
            let savedIpInfo = JSON.parse(
              window.localStorage.getItem("ipInfo") || "{}",
            );
            if (!savedIpInfo.ip || (savedIpInfo.ip && savedIpInfo.ip != ip)) {
              window.localStorage.setItem(
                "ipInfo",
                JSON.stringify(response.data),
              );

              let localeKey = response.data.languages.split(",")[0];
              localeKey = localeKey.split("-")[0];
              localeKey =
                languages.find((language) => language.locale == localeKey)
                  ?.locale || "en";
              window.localStorage.setItem("locale", localeKey);
              applyTranslation(localeKey).then(() => {
                router.refresh();
              });

              setSelectedCurrency(response.data.currency || "USD");
              window.localStorage.setItem(
                "currency",
                response.data.currency || "USD",
              );
              changeCurrency(response.data.currency || "USD");
            }

            setCookie("ipInfoLoaded", "1");
          }
        } else {
          setSelectedCurrency(window.localStorage.currency || "USD");
          changeCurrency(window.localStorage.currency || "USD");
        }
      } catch (error) {}
    };

    if (typeof window !== "undefined") {
      getIpInfo();
    }
  }, []);

  useEffect(() => {
    setSearchTerm(searchParams?.get("term") || "");
  }, [searchParams]);

  const hideMenu = (permissionName: string): boolean => {
    if (
      currentTradeRole === "MEMBER" &&
      !permissions.includes(permissionName)
    ) {
      return false;
    }
    return true;
  };

  // Dynamic header options based on current account role
  const getRoleBasedHeaderOptions = () => {
    const getActiveClass = (href: string) => {
      return pathname === href || pathname?.startsWith(href + "/")
        ? "text-primary font-semibold"
        : "text-light-gray hover:text-primary/70";
    };

    switch (currentTradeRole) {
      case "BUYER":
        return (
          <>
            <li className="py-1.5 text-sm font-normal capitalize sm:text-base md:text-lg">
              <Link
                href="/my-orders"
                className={getActiveClass("/my-orders")}
                translate="no"
              >
                {t("my_orders")}
              </Link>
            </li>
            <li className="py-1.5 text-sm font-normal capitalize sm:text-base md:text-lg">
              <Link
                href="/wishlist"
                className={getActiveClass("/wishlist")}
                translate="no"
              >
                {t("wishlist")}
              </Link>
            </li>
            <li className="py-1.5 text-sm font-normal capitalize sm:text-base md:text-lg">
              <Link
                href="/rfq-cart"
                className={getActiveClass("/rfq-cart")}
                translate="no"
              >
                {t("rfq_cart")}
              </Link>
            </li>
          </>
        );
      case "FREELANCER":
        return (
          <>
            {/* Service Button - Commented out */}
            {/* <li className="py-1.5 text-sm font-normal capitalize sm:text-base md:text-lg">
              <Link
                href="/manage-services"
                className={getActiveClass("/manage-services")}
                translate="no"
              >
                {t("my_services")}
              </Link>
            </li> */}
            <li className="py-1.5 text-sm font-normal capitalize sm:text-base md:text-lg">
              <Link
                href="/rfq-request"
                className={getActiveClass("/rfq-request")}
                translate="no"
              >
                {t("rfq_quotes")}
              </Link>
            </li>
            {/* <li className="py-1.5 text-sm font-normal capitalize sm:text-base md:text-lg">
              <Link
                href="/seller-rewards"
                className={getActiveClass("/seller-rewards")}
                translate="no"
              >
                {t("rewards")}
              </Link>
            </li> */}
          </>
        );
      case "COMPANY":
        return (
          <>
            <li className="py-1.5 text-sm font-normal capitalize sm:text-base md:text-lg">
              <Link
                href="/manage-products"
                className={getActiveClass("/manage-products")}
                translate="no"
              >
                {t("my_products")}
              </Link>
            </li>
            <li className="py-1.5 text-sm font-normal capitalize sm:text-base md:text-lg">
              <Link
                href="/seller-orders"
                className={getActiveClass("/seller-orders")}
                translate="no"
              >
                {t("orders")}
              </Link>
            </li>
            <li className="py-1.5 text-sm font-normal capitalize sm:text-base md:text-lg">
              <Link
                href="/dropship-products"
                className={getActiveClass("/dropship-products")}
                translate="no"
              >
                {t("dropshipping")}
              </Link>
            </li>
            <li className="py-1.5 text-sm font-normal capitalize sm:text-base md:text-lg">
              <Link
                href="/rfq-seller-requests"
                className={getActiveClass("/rfq-seller-requests")}
                translate="no"
              >
                {t("rfq_requests")}
              </Link>
            </li>
            {/* <li className="py-1.5 text-sm font-normal capitalize sm:text-base md:text-lg">
              <Link
                href="/seller-rewards"
                className={getActiveClass("/seller-rewards")}
                translate="no"
              >
                {t("rewards")}
              </Link>
            </li> */}
          </>
        );
      default:
        return (
          <>
            <li className="py-1.5 text-sm font-normal capitalize sm:text-base md:text-lg">
              <a
                href="#"
                className="text-light-gray hover:text-primary/70"
                translate="no"
              >
                {t("buyer_central")}
              </a>
            </li>
          </>
        );
    }
  };

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .me.menu button.active-nav-item {
            color: #2563eb !important;
            font-weight: 700 !important;
          }
          .me.menu button.inactive-nav-item {
            color: #ffffff !important;
            font-weight: 400 !important;
          }
          .me.menu button.inactive-nav-item:hover {
            color: #93c5fd !important;
          }
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `,
        }}
      />

      {/* Mobile Header - Only visible on mobile screens */}
      <header
        className={`bg-dark-cyan sticky top-0 z-50 block w-full shadow-md transition-all duration-300 md:hidden ${showHeader ? "translate-y-0" : "-translate-y-full"}`}
        dir={langDir}
        style={{
          ...(langDir === "rtl"
            ? { paddingRight: `${sidebarWidth}px` }
            : { paddingLeft: `${sidebarWidth}px` }),
        }}
      >
        <div className="w-full px-3 py-2 sm:px-4 sm:py-2.5">
          {/* Mobile Top Row */}
          <div
            className={cn(
              "mb-2 flex items-center justify-between sm:mb-2.5",
              langDir === "rtl" && "flex-row-reverse",
            )}
          >
            {/* Logo and Menu */}
            <div
              className={cn(
                "flex items-center gap-1.5 sm:gap-2",
                langDir === "rtl" && "flex-row-reverse",
              )}
            >
              {isLoggedIn && (
                <button
                  onClick={openSidebar}
                  className="flex h-8 w-8 items-center justify-center rounded-lg transition-all hover:bg-white/10 active:scale-95"
                  title="Open Menu"
                  aria-label="Open navigation menu"
                >
                  <MenuIcon className="h-4 w-4 text-white" />
                </button>
              )}
              <Link href="/home" className="flex items-center">
                <Image
                  src={LogoIcon}
                  alt="Ultrasooq home"
                  className="h-6 w-auto sm:h-7"
                  priority
                />
              </Link>
            </div>

            {/* User Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Notifications */}
              {isLoggedIn && <NotificationBell />}

              {/* Dark/Light Mode Toggle */}
              <ThemeToggle />

              {/* Wishlist */}
              <Link
                href="/wishlist"
                className="relative rounded-lg p-2 transition-all hover:bg-white/10 active:scale-95"
                aria-label="Wishlist"
              >
                <Image
                  src={WishlistIcon}
                  height={24}
                  width={24}
                  alt="Wishlist"
                  className="h-5 min-h-[20px] w-5 min-w-[20px] object-contain sm:h-6 sm:w-6"
                />
                {wishlistCount.data?.data > 0 && (
                  <div
                    className={cn(
                      "absolute top-0 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white shadow-lg sm:h-5 sm:w-5 sm:text-xs",
                      langDir === "rtl" ? "left-0" : "right-0",
                    )}
                  >
                    {wishlistCount.data?.data > 99
                      ? "99+"
                      : wishlistCount.data?.data}
                  </div>
                )}
              </Link>

              {/* Cart */}
              <Link
                href="/cart"
                className="relative rounded-lg p-2 transition-all hover:bg-white/10 active:scale-95"
                aria-label="Shopping cart"
              >
                <Image
                  src={CartIcon}
                  height={24}
                  width={24}
                  alt="Shopping cart"
                  className="h-5 min-h-[20px] w-5 min-w-[20px] object-contain sm:h-6 sm:w-6"
                />
                {((hasAccessToken &&
                  !isArray(cartCountWithLogin.data?.data) &&
                  cartCountWithLogin.data?.data > 0) ||
                  (!hasAccessToken &&
                    !isArray(cartCountWithoutLogin.data?.data) &&
                    cartCountWithoutLogin.data?.data > 0)) && (
                  <div
                    className={cn(
                      "absolute top-0 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white shadow-lg sm:h-5 sm:w-5 sm:text-xs",
                      langDir === "rtl" ? "left-0" : "right-0",
                    )}
                  >
                    {hasAccessToken
                      ? !isArray(cartCountWithLogin.data?.data) &&
                        cartCountWithLogin.data?.data > 99
                        ? "99+"
                        : cartCountWithLogin.data?.data
                      : !isArray(cartCountWithoutLogin.data?.data) &&
                          cartCountWithoutLogin.data?.data > 99
                        ? "99+"
                        : cartCountWithoutLogin.data?.data}
                  </div>
                )}
              </Link>

              {/* Profile */}
              {isLoggedIn ? (
                <div className="flex items-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger className="relative h-9 w-9 rounded-full transition-all hover:ring-2 hover:ring-white/30 active:scale-95 sm:h-10 sm:w-10" aria-label="User menu">
                      {me?.data?.data?.profilePicture ? (
                        <Image
                          src={me?.data?.data?.profilePicture}
                          alt="Profile picture"
                          height={40}
                          width={40}
                          className="h-full w-full rounded-full border-2 border-white/20 object-cover"
                        />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white/20 bg-gradient-to-br from-primary to-primary/90 shadow-lg sm:h-10 sm:w-10">
                          <p className="text-xs font-bold text-white sm:text-sm">
                            {memoizedInitials}
                          </p>
                        </div>
                      )}
                      {userStatus && userStatus !== "ACTIVE" && (
                        <div
                          className={cn(
                            "border-dark-cyan absolute -top-0.5 h-3 w-3 rounded-full border-2 sm:h-3.5 sm:w-3.5",
                            langDir === "rtl" ? "-left-0.5" : "-right-0.5",
                            userStatus === "INACTIVE"
                              ? "bg-destructive"
                              : userStatus === "WAITING"
                                ? "bg-warning"
                                : userStatus === "REJECT"
                                  ? "bg-destructive"
                                  : "bg-gray-500",
                          )}
                        />
                      )}
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align={langDir === "rtl" ? "start" : "end"}
                      sideOffset={5}
                      alignOffset={langDir === "rtl" ? -16 : 0}
                      collisionPadding={
                        langDir === "rtl" ? sidebarWidth + 8 : 8
                      }
                      avoidCollisions={true}
                      className="z-[80] max-h-[80vh] w-56 overflow-y-auto"
                      style={{
                        contain: "layout style paint",
                      }}
                    >
                      {userStatus && userStatus !== "ACTIVE" && (
                        <div className="border-b border-gray-200 px-2 py-1.5 text-xs text-gray-500">
                          Status:{" "}
                          <span className="font-medium">{userStatus}</span>
                        </div>
                      )}
                      <Link href={handleProfile()}>
                        <DropdownMenuItem
                          className="cursor-pointer"
                          translate="no"
                        >
                          {t("profile_information")}
                        </DropdownMenuItem>
                      </Link>

                      {currentTradeRole === "BUYER" && (
                        <Link href="/rfq-request">
                          <DropdownMenuItem translate="no">
                            {t("rfq_quotes")}
                          </DropdownMenuItem>
                        </Link>
                      )}

                      {userStatus === "WAITING" || userStatus === "INACTIVE" ? (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={handleLogout}
                            className="cursor-pointer"
                          >
                            {t("logout")}
                          </DropdownMenuItem>
                        </>
                      ) : (
                        <>
                          {accessControl.canAccessDashboard && (
                            <Link href="/vendor-dashboard">
                              <DropdownMenuItem
                                className="cursor-pointer"
                                translate="no"
                              >
                                {t("dashboard")}
                              </DropdownMenuItem>
                            </Link>
                          )}

                          {currentTradeRole !== "BUYER" &&
                            accessControl.hasFullAccess && (
                              <>
                                {hideMenu(PERMISSION_TEAM_MEMBERS) && (
                                  <Link href="/team-members">
                                    <DropdownMenuItem translate="no">
                                      {t("team_members")}
                                    </DropdownMenuItem>
                                  </Link>
                                )}
                                {hideMenu(PERMISSION_PRODUCTS) && (
                                  <Link href="/manage-products">
                                    <DropdownMenuItem translate="no">
                                      {t("products")}
                                    </DropdownMenuItem>
                                  </Link>
                                )}
                                {/* Service Button - Commented out */}
                                {/* {hideMenu(PERMISSION_SERVICES) && (
                                  <Link href="/manage-services">
                                    <DropdownMenuItem translate="no">
                                      {t("services")}
                                    </DropdownMenuItem>
                                  </Link>
                                )} */}
                                {hideMenu(PERMISSION_ORDERS) && (
                                  <Link href="/seller-orders">
                                    <DropdownMenuItem translate="no">
                                      {t("orders")}
                                    </DropdownMenuItem>
                                  </Link>
                                )}
                                {hideMenu(PERMISSION_RFQ_QUOTES) && (
                                  <Link href="/rfq-request">
                                    <DropdownMenuItem translate="no">
                                      {t("rfq_quotes")}
                                    </DropdownMenuItem>
                                  </Link>
                                )}
                                {hideMenu(PERMISSION_PRODUCTS) && (
                                  <Link href="/dropship-products">
                                    <DropdownMenuItem translate="no">
                                      {t("dropshipping")}
                                    </DropdownMenuItem>
                                  </Link>
                                )}
                                {hideMenu(PERMISSION_RFQ_SELLER_REQUESTS) && (
                                  <Link href="/seller-rfq-list">
                                    <DropdownMenuItem translate="no">
                                      {t("rfq_seller_requests")}
                                    </DropdownMenuItem>
                                  </Link>
                                )}
                                {/* {hideMenu(PERMISSION_SELLER_REWARDS) && (
                                  <Link href="/seller-rewards">
                                    <DropdownMenuItem translate="no">
                                      {t("seller_rewards")}
                                    </DropdownMenuItem>
                                  </Link>
                                )} */}
                              </>
                            )}

                          {/* {hideMenu(PERMISSION_SHARE_LINKS) && (
                            <Link href="/share-links">
                              <DropdownMenuItem translate="no">
                                {t("share_links")}
                              </DropdownMenuItem>
                            </Link>
                          )} */}

                          {accessControl.canAccessSettings && (
                            <Link href="/my-settings/address">
                              <DropdownMenuItem translate="no">
                                {t("my_settings")}
                              </DropdownMenuItem>
                            </Link>
                          )}

                          {accessControl.canAccessTransactions && (
                            <Link href="/transactions">
                              <DropdownMenuItem translate="no">
                                {t("transactions")}
                              </DropdownMenuItem>
                            </Link>
                          )}

                          {accessControl.canAccessQueries && (
                            <Link href="/queries">
                              <DropdownMenuItem translate="no">
                                {t("queries")}
                              </DropdownMenuItem>
                            </Link>
                          )}

                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={handleLogout}
                            className="cursor-pointer"
                          >
                            {t("logout")}
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 transition-all hover:bg-white/20 active:scale-95"
                >
                  <Image
                    src={UnAuthUserIcon}
                    height={20}
                    width={20}
                    alt=""
                    className="h-5 w-5"
                  />
                  <span className="text-xs font-medium text-white sm:text-sm">
                    Login
                  </span>
                </Link>
              )}
            </div>
          </div>

          {/* Mobile Search Bar */}
          <div className="mb-2 flex items-center gap-2 sm:mb-2.5">
            <div className="relative flex-1">
              <input
                type="text"
                className={`h-9 w-full rounded-lg border-2 border-white/20 bg-white/95 text-sm transition-all placeholder:text-gray-400 focus:border-transparent focus:ring-2 focus:ring-primary focus:outline-none sm:h-10 sm:text-base ${
                  langDir === "rtl" ? "pr-3 pl-10" : "pr-10 pl-3"
                }`}
                placeholder={t("global_search_placeholder")}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowAutocomplete(e.target.value.length >= 2);
                }}
                onKeyDown={handleKeyDown}
                onFocus={() => searchTerm.length >= 2 && setShowAutocomplete(true)}
                translate="no"
                aria-label="Search products"
              />
              <svg
                className={`pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 sm:h-5 sm:w-5 ${
                  langDir === "rtl" ? "left-3" : "right-3"
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <SearchAutocomplete
                searchTerm={searchTerm}
                onSelect={handleAutocompleteSelect}
                visible={showAutocomplete}
                onClose={() => setShowAutocomplete(false)}
                langDir={langDir}
              />
            </div>
            {/* Conditionally render buttons based on language - swap positions in Arabic */}
            {langDir === "rtl" ? (
              <>
                {/* All Categories Icon Button - First in Arabic */}
                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-r from-warning to-warning/90 text-white shadow-lg transition-all hover:from-warning hover:to-warning/80 active:scale-95 sm:h-10 sm:w-10 md:hidden"
                  aria-label="Browse categories"
                  onClick={() => {
                    // On mobile, open the category sidebar
                    if (typeof window !== "undefined") {
                      window.dispatchEvent(
                        new CustomEvent("openCategorySidebar"),
                      );
                    }
                  }}
                >
                  <LayoutGrid className="h-5 w-5 text-white" />
                </button>
                {/* Search Icon Button - Second in Arabic */}
                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-r from-warning to-warning/90 text-white shadow-lg transition-all hover:from-warning hover:to-warning/80 active:scale-95 sm:h-10 sm:w-10"
                  aria-label="Search"
                  onClick={() => updateURL(searchTerm)}
                >
                  <Search className="h-5 w-5" />
                </button>
              </>
            ) : (
              <>
                {/* Search Icon Button - First in English */}
                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-r from-warning to-warning/90 text-white shadow-lg transition-all hover:from-warning hover:to-warning/80 active:scale-95 sm:h-10 sm:w-10"
                  aria-label="Search"
                  onClick={() => updateURL(searchTerm)}
                >
                  <Search className="h-5 w-5" />
                </button>
                {/* All Categories Icon Button - Second in English */}
                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-r from-warning to-warning/90 text-white shadow-lg transition-all hover:from-warning hover:to-warning/80 active:scale-95 sm:h-10 sm:w-10 md:hidden"
                  aria-label="Browse categories"
                  onClick={() => {
                    // On mobile, open the category sidebar
                    if (typeof window !== "undefined") {
                      window.dispatchEvent(
                        new CustomEvent("openCategorySidebar"),
                      );
                    }
                  }}
                >
                  <LayoutGrid className="h-5 w-5 text-white" />
                </button>
              </>
            )}
          </div>

          {/* Mobile Navigation Menu - Home, Store, Buygroup, etc. */}
          <nav aria-label="Main navigation" className="scrollbar-hide -mx-3 overflow-x-auto px-3 pb-2 sm:-mx-4 sm:px-4">
            <div className="flex min-w-max items-center gap-1.5 sm:gap-2">
              <Link
                href="/home"
                onClick={() => {
                  router.push("/home");
                }}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 whitespace-nowrap transition-all sm:gap-2 sm:px-4 sm:py-2.5 ${pathname === "/home" ? "bg-white font-semibold text-primary shadow-md" : "bg-white/10 text-white hover:bg-white/20 active:scale-95"}`}
              >
                {langDir === "rtl" ? (
                  <>
                    <span className="text-xs font-medium sm:text-sm">
                      {t("home")}
                    </span>
                    <Image
                      src={menuBarIconList[0]}
                      alt={t("home")}
                      height={18}
                      width={18}
                      className="h-4 w-4 sm:h-5 sm:w-5"
                      style={{
                        filter:
                          pathname === "/home"
                            ? "brightness(0) saturate(100%) invert(27%) sepia(51%) saturate(2878%) hue-rotate(346deg) brightness(104%) contrast(97%)"
                            : "none",
                      }}
                    />
                  </>
                ) : (
                  <>
                    <Image
                      src={menuBarIconList[0]}
                      alt={t("home")}
                      height={18}
                      width={18}
                      className="h-4 w-4 sm:h-5 sm:w-5"
                      style={{
                        filter:
                          pathname === "/home"
                            ? "brightness(0) saturate(100%) invert(27%) sepia(51%) saturate(2878%) hue-rotate(346deg) brightness(104%) contrast(97%)"
                            : "none",
                      }}
                    />
                    <span className="text-xs font-medium sm:text-sm">
                      {t("home")}
                    </span>
                  </>
                )}
              </Link>
              {STATIC_NAV_ITEMS.map((item) => {
                  const isActiveNav =
                    pathname === item.href ||
                    (pathname?.startsWith(item.href) && item.href !== "/");

                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-2 whitespace-nowrap transition-all sm:gap-2 sm:px-4 sm:py-2.5 ${isActiveNav ? "bg-white font-semibold text-primary shadow-md" : "bg-white/10 text-white hover:bg-white/20 active:scale-95"}`}
                    >
                      {langDir === "rtl" ? (
                        <>
                          <span className="text-xs font-medium sm:text-sm">
                            {t(item.translationKey)}
                          </span>
                          <Image
                            src={item.icon}
                            alt={t(item.translationKey)}
                            height={18}
                            width={18}
                            className="h-4 w-4 sm:h-5 sm:w-5"
                            style={{
                              filter: isActiveNav
                                ? "brightness(0) saturate(100%) invert(27%) sepia(51%) saturate(2878%) hue-rotate(346deg) brightness(104%) contrast(97%)"
                                : "none",
                            }}
                          />
                        </>
                      ) : (
                        <>
                          <Image
                            src={item.icon}
                            alt={t(item.translationKey)}
                            height={18}
                            width={18}
                            className="h-4 w-4 sm:h-5 sm:w-5"
                            style={{
                              filter: isActiveNav
                                ? "brightness(0) saturate(100%) invert(27%) sepia(51%) saturate(2878%) hue-rotate(346deg) brightness(104%) contrast(97%)"
                                : "none",
                            }}
                          />
                          <span className="text-xs font-medium sm:text-sm">
                            {t(item.translationKey)}
                          </span>
                        </>
                      )}
                    </Link>
                  );
                })}
            </div>
          </nav>
        </div>
      </header>

      {/* Desktop/Tablet Header - Hidden on mobile */}
      <header
        className={cn(
          "bg-dark-cyan relative sticky top-0 z-50 hidden w-full",
          !isLoggedIn && "border-b border-solid border-gray-300 shadow-xl",
          "transition-all duration-300 md:block",
          ((pathname === "/trending" || pathname === "/buygroup") &&
            hasCartItems &&
            (langDir === "rtl" ? "lg:pl-36" : "lg:pr-36")) ||
          (pathname?.startsWith("/rfq") &&
            hasRfqCartItems &&
            (langDir === "rtl" ? "lg:pl-36" : "lg:pr-36")),
          showHeader ? "translate-y-0" : "-translate-y-full",
        )}
        key={`header-${currentTradeRole}-${currentAccount?.data?.data?.account?.id}`}
        dir={langDir}
        style={{
          ...(langDir === "rtl"
            ? { paddingRight: `${sidebarWidth}px` }
            : { paddingLeft: `${sidebarWidth}px` }),
        }}
      >
        <div className="bg-dark-cyan w-full">
          <div className="w-full px-6 pt-1.5 pb-1.5 md:px-8 md:pt-2 md:pb-2 lg:px-12 lg:pt-1.5 lg:pb-1">
            <div
              className={cn(
                "hidden md:flex md:gap-x-2.5",
                langDir === "rtl" && "flex-row-reverse",
              )}
            >
              <div
                className={cn(
                  "flex py-1 text-xs font-normal text-white/90 md:w-full md:py-1.5 md:text-sm lg:py-2",
                  langDir === "rtl" ? "justify-start" : "justify-end",
                )}
              >
                <ul
                  className={cn(
                    "flex items-center gap-1",
                    langDir === "rtl"
                      ? "flex-row-reverse justify-start"
                      : "justify-end",
                  )}
                >
                  {currentTradeRole != "BUYER" ? (
                    <li
                      className={cn(
                        "px-3 text-xs font-normal text-white/90 md:text-sm",
                        langDir === "rtl"
                          ? "border-l border-solid border-white/30"
                          : "border-r border-solid border-white/30",
                      )}
                    >
                      <a
                        href="#"
                        dir={langDir}
                        translate="no"
                        className="transition-colors hover:text-white"
                      >
                        {t("store_location")}
                      </a>
                    </li>
                  ) : null}
                  <li
                    className={cn(
                      "px-3 text-xs font-normal text-white/90 md:text-sm",
                      langDir === "rtl"
                        ? "border-l border-solid border-white/30"
                        : "border-r border-solid border-white/30",
                    )}
                  >
                    <Link
                      href="/my-orders"
                      dir={langDir}
                      translate="no"
                      className="transition-colors hover:text-white"
                    >
                      {t("track_your_order")}
                    </Link>
                  </li>
                  <li
                    className={cn(
                      "px-3 text-xs font-normal text-white/90 md:text-sm",
                      langDir === "rtl"
                        ? "border-l border-solid border-white/30"
                        : "border-r border-solid border-white/30",
                    )}
                  >
                    <select
                      dir={langDir}
                      className="cursor-pointer rounded border-0 bg-transparent px-1 py-1 text-white/90 transition-colors hover:text-white focus:outline-none"
                      value={selectedCurrency}
                      aria-label="Select currency"
                      onChange={(e: any) => {
                        setSelectedCurrency(e.target?.value || "OMR");
                        window.localStorage.setItem(
                          "currency",
                          e.target?.value || "OMR",
                        );
                        changeCurrency(e.target.value || "OMR");
                      }}
                    >
                      {currencies.map((item: { code: string }) => {
                        return (
                          <option
                            className="bg-dark-cyan text-white"
                            value={item.code}
                            key={item.code}
                          >
                            {item.code}
                          </option>
                        );
                      })}
                    </select>
                  </li>
                  <li
                    className={cn(
                      "px-3 text-xs font-normal text-white/90 md:text-sm",
                      langDir === "rtl" ? "pl-0" : "pr-0",
                    )}
                  >
                    <select
                      dir={langDir}
                      className="cursor-pointer rounded border-0 bg-transparent px-1 py-1 text-xs text-white/90 transition-colors hover:text-white focus:outline-none md:text-sm"
                      value={selectedLocale}
                      aria-label="Select language"
                      onChange={async (e) => {
                        const newLocale = e.target.value;
                        setSelectedLocale(newLocale);
                        await applyTranslation(newLocale);
                        // Refresh router to reload server components with new locale
                        router.refresh();
                      }}
                    >
                      {languages.map(
                        (language: { locale: string; name: string; flag?: string }) => {
                          return (
                            <option
                              className="bg-dark-cyan text-white"
                              key={language.locale}
                              value={language.locale}
                            >
                              {language.flag ? `${language.flag} ` : ""}{language.name}
                            </option>
                          );
                        },
                      )}
                    </select>
                  </li>
                </ul>
              </div>
            </div>

            <div
              className={cn(
                "flex flex-wrap items-center",
                langDir === "rtl" && "flex-row-reverse",
              )}
            >
              <div
                className={cn(
                  "flex w-5/12 flex-1 items-center py-1.5 md:w-2/12 md:py-2 lg:w-1/6",
                  langDir === "rtl" ? "order-3" : "order-1",
                )}
              >
                <div
                  className={cn(
                    "flex items-center gap-2",
                    langDir === "rtl" ? "justify-end" : "justify-start",
                  )}
                >
                  <Link
                    href="/home"
                    className="flex items-center transition-opacity hover:opacity-90"
                  >
                    <Image
                      src={LogoIcon}
                      alt="Ultrasooq home"
                      className="h-7 w-auto md:h-8 lg:h-9"
                      priority
                    />
                  </Link>
                </div>
              </div>
              <div
                className={cn(
                  "flex w-[80%] items-center gap-2 py-1.5 md:w-7/12 md:px-3 md:py-2 lg:w-4/6",
                  langDir === "rtl"
                    ? "order-2 flex-row-reverse"
                    : "order-3 md:order-2",
                )}
              >
                {/* In Arabic: Search button first, then search input, then category button */}
                {langDir === "rtl" ? (
                  <>
                    {/* Search button - first in Arabic */}
                    <button
                      type="button"
                      className="h-9 rounded-lg bg-gradient-to-r from-warning to-warning/90 px-4 text-sm font-semibold whitespace-nowrap text-white shadow-lg transition-all hover:from-warning hover:to-warning/80 active:scale-95 md:h-10 md:px-6 md:text-base lg:px-8"
                      onClick={() => updateURL(searchTerm)}
                      dir={langDir}
                      translate="no"
                    >
                      {t("search")}
                    </button>
                    {/* Search input - middle */}
                    <div className="relative max-w-[55%] flex-1 md:max-w-[50%] lg:max-w-[65%] xl:max-w-[75%]">
                      <input
                        type="text"
                        className={`form-control h-9 w-full rounded-lg border-2 border-white/20 text-sm text-black transition-all placeholder:text-gray-400 focus:border-transparent focus:ring-2 focus:ring-primary focus:outline-none md:h-10 md:text-base ${
                          langDir === "rtl" ? "pr-4 pl-12" : "pr-12 pl-4"
                        }`}
                        placeholder={t("global_search_placeholder")}
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setShowAutocomplete(e.target.value.length >= 2);
                        }}
                        onKeyDown={handleKeyDown}
                        onFocus={() => searchTerm.length >= 2 && setShowAutocomplete(true)}
                        dir={langDir}
                        translate="no"
                        aria-label="Search products"
                      />
                      <svg
                        className={`pointer-events-none absolute top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 ${
                          langDir === "rtl" ? "left-4" : "right-4"
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                      <SearchAutocomplete
                        searchTerm={searchTerm}
                        onSelect={handleAutocompleteSelect}
                        visible={showAutocomplete}
                        onClose={() => setShowAutocomplete(false)}
                        langDir={langDir}
                      />
                    </div>
                    {/* Category button - last in Arabic */}
                    {mounted && (
                      <button
                        type="button"
                        className="group relative hidden cursor-pointer items-center gap-2 rounded-lg bg-gradient-to-r from-warning to-warning/90 px-3 transition-all hover:from-warning hover:to-warning/80 active:scale-95 md:flex md:h-10 md:px-4"
                        aria-label="Browse categories"
                        onClick={() => {
                          const newState = !isCategorySidebarOpen;
                          setIsCategorySidebarOpen(newState);
                          if (typeof window !== "undefined") {
                            if (newState) {
                              window.dispatchEvent(
                                new CustomEvent("openCategorySidebar"),
                              );
                            } else {
                              window.dispatchEvent(
                                new CustomEvent("closeCategorySidebar"),
                              );
                            }
                          }
                        }}
                      >
                        <LayoutGrid className="h-5 w-5 text-white md:h-6 md:w-6" />
                        <span className="text-sm font-semibold text-white md:text-base">
                          {t("categories") || "Categories"}
                        </span>
                      </button>
                    )}
                    {!mounted && (
                      <div className="group relative hidden h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-r from-warning to-warning/90 transition-all hover:from-warning hover:to-warning/80 active:scale-95 md:flex md:h-10 md:w-10">
                        <LayoutGrid className="h-6 w-6 text-white" />
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {/* Category button - first in English */}
                    {mounted && (
                      <button
                        type="button"
                        className="group relative hidden cursor-pointer items-center gap-2 rounded-lg bg-gradient-to-r from-warning to-warning/90 px-3 transition-all hover:from-warning hover:to-warning/80 active:scale-95 md:flex md:h-10 md:px-4"
                        aria-label="Browse categories"
                        onClick={() => {
                          const newState = !isCategorySidebarOpen;
                          setIsCategorySidebarOpen(newState);
                          if (typeof window !== "undefined") {
                            if (newState) {
                              window.dispatchEvent(
                                new CustomEvent("openCategorySidebar"),
                              );
                            } else {
                              window.dispatchEvent(
                                new CustomEvent("closeCategorySidebar"),
                              );
                            }
                          }
                        }}
                      >
                        <LayoutGrid className="h-5 w-5 text-white md:h-6 md:w-6" />
                        <span className="text-sm font-semibold text-white md:text-base">
                          {t("categories") || "Categories"}
                        </span>
                      </button>
                    )}
                    {!mounted && (
                      <div className="group relative hidden h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-r from-warning to-warning/90 transition-all hover:from-warning hover:to-warning/80 active:scale-95 md:flex md:h-10 md:w-10">
                        <LayoutGrid className="h-6 w-6 text-white" />
                      </div>
                    )}
                    {/* Search input - middle */}
                    <div className="relative max-w-[55%] flex-1 md:max-w-[50%] lg:max-w-[65%] xl:max-w-[75%]">
                      <input
                        type="text"
                        className={`form-control h-9 w-full rounded-lg border-2 border-white/20 text-sm text-black transition-all placeholder:text-gray-400 focus:border-transparent focus:ring-2 focus:ring-primary focus:outline-none md:h-10 md:text-base ${
                          langDir === "rtl" ? "pr-4 pl-12" : "pr-12 pl-4"
                        }`}
                        placeholder={t("global_search_placeholder")}
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setShowAutocomplete(e.target.value.length >= 2);
                        }}
                        onKeyDown={handleKeyDown}
                        onFocus={() => searchTerm.length >= 2 && setShowAutocomplete(true)}
                        dir={langDir}
                        translate="no"
                        aria-label="Search products"
                      />
                      <svg
                        className={`pointer-events-none absolute top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 ${
                          langDir === "rtl" ? "left-4" : "right-4"
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                      <SearchAutocomplete
                        searchTerm={searchTerm}
                        onSelect={handleAutocompleteSelect}
                        visible={showAutocomplete}
                        onClose={() => setShowAutocomplete(false)}
                        langDir={langDir}
                      />
                    </div>
                    {/* Search button - last in English */}
                    <button
                      type="button"
                      className="h-9 rounded-lg bg-gradient-to-r from-warning to-warning/90 px-4 text-sm font-semibold whitespace-nowrap text-white shadow-lg transition-all hover:from-warning hover:to-warning/80 active:scale-95 md:h-10 md:px-6 md:text-base lg:px-8"
                      onClick={() => updateURL(searchTerm)}
                      dir={langDir}
                      translate="no"
                    >
                      {t("search")}
                    </button>
                  </>
                )}
              </div>
              <div
                className={cn(
                  "flex w-7/12 sm:w-7/12 md:w-3/12 md:py-1.5 lg:w-1/6 lg:py-2",
                  langDir === "rtl"
                    ? "order-1 justify-start"
                    : "order-2 justify-end sm:order-2 md:order-3",
                )}
              >
                <ul
                  className={cn(
                    "flex items-center gap-x-3 md:gap-x-4",
                    langDir === "rtl" ? "justify-start" : "justify-end",
                  )}
                >
                  {isLoggedIn ? (
                    <li className="relative flex">
                      <NotificationBell />
                    </li>
                  ) : null}
                  <li className="flex items-center">
                    <ThemeToggle />
                  </li>
                  <li className="relative">
                    <Link
                      href="/wishlist"
                      className="relative flex items-center justify-center rounded-lg p-2 transition-all hover:bg-white/10 active:scale-95"
                      aria-label="Wishlist"
                    >
                      <Image
                        src={WishlistIcon}
                        height={28}
                        width={28}
                        alt="Wishlist"
                        className="h-6 min-h-[24px] w-6 min-w-[24px] object-contain md:h-7 md:w-7"
                      />
                      {wishlistCount.data?.data > 0 && (
                        <div
                          className={cn(
                            "absolute -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white shadow-lg",
                            langDir === "rtl" ? "-left-0.5" : "-right-0.5",
                          )}
                        >
                          {wishlistCount.data?.data > 99
                            ? "99+"
                            : wishlistCount.data?.data}
                        </div>
                      )}
                    </Link>
                  </li>
                  <li className="relative">
                    <Link
                      href="/cart"
                      className="relative flex items-center justify-center rounded-lg p-2 transition-all hover:bg-white/10 active:scale-95"
                      aria-label="Shopping cart"
                    >
                      <Image
                        src={CartIcon}
                        height={28}
                        width={28}
                        alt="Shopping cart"
                        className="h-6 min-h-[24px] w-6 min-w-[24px] object-contain md:h-7 md:w-7"
                      />
                      {((hasAccessToken &&
                        !isArray(cartCountWithLogin.data?.data) &&
                        cartCountWithLogin.data?.data > 0) ||
                        (!hasAccessToken &&
                          !isArray(cartCountWithoutLogin.data?.data) &&
                          cartCountWithoutLogin.data?.data > 0)) && (
                        <div
                          className={cn(
                            "absolute -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white shadow-lg",
                            langDir === "rtl" ? "-left-0.5" : "-right-0.5",
                          )}
                        >
                          {hasAccessToken
                            ? !isArray(cartCountWithLogin.data?.data) &&
                              cartCountWithLogin.data?.data > 99
                              ? "99+"
                              : cartCountWithLogin.data?.data
                            : !isArray(cartCountWithoutLogin.data?.data) &&
                                cartCountWithoutLogin.data?.data > 99
                              ? "99+"
                              : cartCountWithoutLogin.data?.data}
                        </div>
                      )}
                    </Link>
                  </li>
                  <li className="relative flex items-center">
                    {isLoggedIn ? (
                      <div className="flex items-center gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger className="relative h-9 w-9 rounded-full transition-all hover:ring-2 hover:ring-white/30 active:scale-95 md:h-10 md:w-10" aria-label="User menu">
                            {me?.data?.data?.profilePicture ? (
                              <Image
                                src={me?.data?.data?.profilePicture}
                                alt="Profile picture"
                                height={40}
                                width={40}
                                className="h-full w-full rounded-full border-2 border-white/20 object-cover shadow-lg"
                              />
                            ) : (
                              <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white/20 bg-gradient-to-br from-primary to-primary/90 shadow-lg md:h-10 md:w-10">
                                <p className="text-xs font-bold text-white md:text-sm">
                                  {memoizedInitials}
                                </p>
                              </div>
                            )}
                            {/* Status indicator - only show for non-active users */}
                            {userStatus && userStatus !== "ACTIVE" && (
                              <div
                                className={cn(
                                  "border-dark-cyan absolute -top-0.5 h-4 w-4 rounded-full border-2",
                                  langDir === "rtl"
                                    ? "-left-0.5"
                                    : "-right-0.5",
                                  userStatus === "INACTIVE"
                                    ? "bg-destructive"
                                    : userStatus === "WAITING"
                                      ? "bg-warning"
                                      : userStatus === "REJECT"
                                        ? "bg-destructive"
                                        : "bg-gray-500",
                                )}
                                title={`Status: ${userStatus}`}
                              />
                            )}
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align={langDir === "rtl" ? "start" : "end"}
                            sideOffset={5}
                            alignOffset={langDir === "rtl" ? -16 : 0}
                            collisionPadding={
                              langDir === "rtl" ? sidebarWidth + 8 : 8
                            }
                            avoidCollisions={true}
                            className="z-[80] max-h-[80vh] overflow-y-auto"
                            style={{
                              contain: "layout style paint",
                            }}
                          >
                            {/* Status indicator - only show for non-active users */}
                            {userStatus && userStatus !== "ACTIVE" && (
                              <div className="border-b border-gray-200 px-2 py-1.5 text-xs text-gray-500">
                                Status:{" "}
                                <span
                                  className={`font-medium ${
                                    userStatus === "INACTIVE"
                                      ? "text-destructive"
                                      : userStatus === "WAITING"
                                        ? "text-warning"
                                        : userStatus === "REJECT"
                                          ? "text-destructive"
                                          : "text-gray-600"
                                  }`}
                                >
                                  {userStatus}
                                </span>
                              </div>
                            )}

                            {/* Always show Profile Information */}
                            <Link href={handleProfile()}>
                              <DropdownMenuItem
                                className="cursor-pointer"
                                dir={langDir}
                                translate="no"
                              >
                                {t("profile_information")}
                              </DropdownMenuItem>
                            </Link>

                            {/* RFQ Quotes for Buyers */}
                            {currentTradeRole === "BUYER" && (
                              <Link href="/rfq-request">
                                <DropdownMenuItem
                                  className="cursor-pointer"
                                  dir={langDir}
                                  translate="no"
                                >
                                  {t("rfq_quotes")}
                                </DropdownMenuItem>
                              </Link>
                            )}

                            {/* Check user status - if WAITING or INACTIVE, only show Profile and Logout */}
                            {userStatus === "WAITING" ||
                            userStatus === "INACTIVE" ? (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={handleLogout}
                                  className="cursor-pointer"
                                  dir={langDir}
                                  translate="no"
                                >
                                  {t("logout")}
                                </DropdownMenuItem>
                              </>
                            ) : (
                              <>
                                {/* Dashboard - Only for ACTIVE users */}
                                {accessControl.canAccessDashboard && (
                                  <Link href="/vendor-dashboard">
                                    <DropdownMenuItem
                                      className="cursor-pointer"
                                      dir={langDir}
                                      translate="no"
                                    >
                                      {t("dashboard")}
                                    </DropdownMenuItem>
                                  </Link>
                                )}

                                {/* Company-specific options for active users */}
                                {currentTradeRole !== "BUYER" &&
                                accessControl.hasFullAccess ? (
                                  <>
                                    {/* {hideMenu(PERMISSION_TEAM_MEMBERS) ? (
                                      <Link href="/team-members">
                                        <DropdownMenuItem
                                          dir={langDir}
                                          translate="no"
                                        >
                                          {t("team_members")}
                                        </DropdownMenuItem>
                                      </Link>
                                    ) : null} */}

                                    {hideMenu(PERMISSION_PRODUCTS) ? (
                                      <Link href="/manage-products">
                                        <DropdownMenuItem
                                          dir={langDir}
                                          translate="no"
                                        >
                                          {t("products")}
                                        </DropdownMenuItem>
                                      </Link>
                                    ) : null}

                                    {/* Service Button - Commented out */}
                                    {/* {hideMenu(PERMISSION_SERVICES) ? (
                                      <Link href="/manage-services">
                                        <DropdownMenuItem
                                          dir={langDir}
                                          translate="no"
                                        >
                                          {t("services")}
                                        </DropdownMenuItem>
                                      </Link>
                                    ) : null} */}

                                    {hideMenu(PERMISSION_ORDERS) ? (
                                      <Link href="/seller-orders">
                                        <DropdownMenuItem
                                          dir={langDir}
                                          translate="no"
                                        >
                                          {t("orders")}
                                        </DropdownMenuItem>
                                      </Link>
                                    ) : null}

                                    {hideMenu(PERMISSION_RFQ_QUOTES) ? (
                                      <Link href="/rfq-request">
                                        <DropdownMenuItem
                                          dir={langDir}
                                          translate="no"
                                        >
                                          {t("rfq_quotes")}
                                        </DropdownMenuItem>
                                      </Link>
                                    ) : null}

                                    {hideMenu(PERMISSION_PRODUCTS) ? (
                                      <Link href="/dropship-products">
                                        <DropdownMenuItem
                                          dir={langDir}
                                          translate="no"
                                        >
                                          {t("dropshipping")}
                                        </DropdownMenuItem>
                                      </Link>
                                    ) : null}

                                    {hideMenu(
                                      PERMISSION_RFQ_SELLER_REQUESTS,
                                    ) ? (
                                      <Link href="/seller-rfq-list">
                                        <DropdownMenuItem
                                          dir={langDir}
                                          translate="no"
                                        >
                                          {t("rfq_seller_requests")}
                                        </DropdownMenuItem>
                                      </Link>
                                    ) : null}

                                    {hideMenu(PERMISSION_MESSAGE_SYSTEM) ? (
                                      <Link href="/seller-rfq-request?tab=product-messages">
                                        <DropdownMenuItem
                                          dir={langDir}
                                          translate="no"
                                        >
                                          {t("product_messages")}
                                        </DropdownMenuItem>
                                      </Link>
                                    ) : null}

                                    {/* {hideMenu(PERMISSION_SELLER_REWARDS) ? (
                                      <Link href="/seller-rewards">
                                        <DropdownMenuItem
                                          dir={langDir}
                                          translate="no"
                                        >
                                          {t("seller_rewards")}
                                        </DropdownMenuItem>
                                      </Link>
                                    ) : null} */}
                                  </>
                                ) : null}

                                {/* {hideMenu(PERMISSION_SHARE_LINKS) ? (
                                  <Link href="/share-links">
                                    <DropdownMenuItem
                                      dir={langDir}
                                      translate="no"
                                    >
                                      {t("share_links")}
                                    </DropdownMenuItem>
                                  </Link>
                                ) : null} */}

                                {/* My Settings - Available for all authenticated users */}
                                {accessControl.canAccessSettings && (
                                  <Link href="/my-settings/address">
                                    <DropdownMenuItem
                                      dir={langDir}
                                      translate="no"
                                    >
                                      {t("my_settings")}
                                    </DropdownMenuItem>
                                  </Link>
                                )}

                                {/* Transactions - Only for ACTIVE users */}
                                {accessControl.canAccessTransactions && (
                                  <Link href="/transactions">
                                    <DropdownMenuItem
                                      dir={langDir}
                                      translate="no"
                                    >
                                      {t("transactions")}
                                    </DropdownMenuItem>
                                  </Link>
                                )}

                                {/* Queries - Only for ACTIVE users */}
                                {accessControl.canAccessQueries && (
                                  <Link href="/queries">
                                    <DropdownMenuItem
                                      dir={langDir}
                                      translate="no"
                                    >
                                      {t("queries")}
                                    </DropdownMenuItem>
                                  </Link>
                                )}

                                <DropdownMenuSeparator />

                                <DropdownMenuItem
                                  onClick={handleLogout}
                                  className="cursor-pointer"
                                  dir={langDir}
                                  translate="no"
                                >
                                  {t("logout")}
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ) : (
                      <div dir={langDir} className="flex items-center gap-2">
                        <Link
                          href="/login"
                          className="flex items-center justify-center gap-2 rounded-lg bg-white/10 px-4 py-2 transition-all hover:bg-white/20 active:scale-95"
                          translate="no"
                        >
                          <Image
                            src={UnAuthUserIcon}
                            height={20}
                            width={20}
                            alt=""
                            className="h-5 w-5 flex-shrink-0"
                          />
                          <span className="text-sm leading-none font-semibold text-white">
                            {t("login")}
                          </span>
                        </Link>
                        <Link
                          href="/register"
                          className="flex items-center justify-center rounded-lg bg-gradient-to-r from-primary to-primary/90 px-4 py-2 shadow-lg transition-all hover:from-primary hover:to-primary/80 active:scale-95"
                          translate="no"
                        >
                          <span className="text-sm leading-none font-semibold text-white">
                            {t("register")}
                          </span>
                        </Link>
                      </div>
                    )}
                  </li>
                </ul>
              </div>
            </div>

            <nav
              aria-label="Site navigation"
              className={`me menu w-full overflow-hidden px-3 md:flex md:h-auto md:px-0 ${isActive ? "show_menu" : ""}`}
            >
              <div className="close" onClick={handleClick} role="button" aria-label="Close menu">
                <IoCloseOutline />
              </div>
              <div
                className="flex w-full flex-col items-start justify-start gap-x-1 py-1 md:flex-row md:flex-nowrap md:items-center md:justify-between"
                dir={langDir}
              >
                <ButtonLink
                  key={0}
                  onClick={() => {
                    router.push("/home");
                  }}
                  href="/home"
                  className={`transition-colors ${homeButtonClasses}`}
                  style={{
                    color: pathname === "/home" ? "#2563eb" : "#ffffff",
                    fontWeight: pathname === "/home" ? "700" : "400",
                  }}
                >
                  <div
                    className="flex gap-x-3"
                    onClick={handleClick}
                    translate="no"
                  >
                    {langDir === "rtl" ? (
                      <>
                        {t("home")}
                        <Image
                          src={menuBarIconList[0]}
                          alt={t("home")}
                          height={0}
                          width={0}
                          className={`h-7 w-7 ${pathname === "/home" ? "brightness-0 saturate-100" : ""}`}
                          style={{
                            filter:
                              pathname === "/home"
                                ? "brightness(0) saturate(100%) invert(27%) sepia(51%) saturate(2878%) hue-rotate(346deg) brightness(104%) contrast(97%)"
                                : "none",
                          }}
                        />
                      </>
                    ) : (
                      <>
                        <Image
                          src={menuBarIconList[0]}
                          alt={t("home")}
                          height={0}
                          width={0}
                          className={`h-7 w-7 ${pathname === "/home" ? "brightness-0 saturate-100" : ""}`}
                          style={{
                            filter:
                              pathname === "/home"
                                ? "brightness(0) saturate(100%) invert(27%) sepia(51%) saturate(2878%) hue-rotate(346deg) brightness(104%) contrast(97%)"
                                : "none",
                          }}
                        />{" "}
                        {t("home")}
                      </>
                    )}
                  </div>
                </ButtonLink>
                {STATIC_NAV_ITEMS.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      (pathname?.startsWith(item.href) && item.href !== "/");

                    return (
                      <ButtonLink
                        key={item.id}
                        href={item.href}
                        className={`transition-colors ${isActive ? "active-nav-item" : "inactive-nav-item"}`}
                      >
                        <div className="flex gap-x-3" onClick={handleClick}>
                          {langDir === "rtl" ? (
                            <>
                              <p>{t(item.translationKey)}</p>
                              <Image
                                src={item.icon}
                                alt={t(item.translationKey)}
                                height={0}
                                width={0}
                                className={`h-7 w-7 ${isActive ? "brightness-0 saturate-100" : ""}`}
                                style={{
                                  filter: isActive
                                    ? "brightness(0) saturate(100%) invert(27%) sepia(51%) saturate(2878%) hue-rotate(346deg) brightness(104%) contrast(97%)"
                                    : "none",
                                }}
                              />
                            </>
                          ) : (
                            <>
                              <Image
                                src={item.icon}
                                alt={t(item.translationKey)}
                                height={0}
                                width={0}
                                className={`h-7 w-7 ${isActive ? "brightness-0 saturate-100" : ""}`}
                                style={{
                                  filter: isActive
                                    ? "brightness(0) saturate(100%) invert(27%) sepia(51%) saturate(2878%) hue-rotate(346deg) brightness(104%) contrast(97%)"
                                    : "none",
                                }}
                              />{" "}
                              <p>{t(item.translationKey)}</p>
                            </>
                          )}
                        </div>
                      </ButtonLink>
                    );
                  })}
              </div>
          </nav>
          </div>
        </div>

        {isLoggedIn && (
          <div className="w-full border-b border-solid border-gray-300 bg-white">
            <div className="w-full px-8 lg:px-12">
              <div className="relative flex flex-row flex-wrap md:flex-nowrap">
                <div className="flex w-full flex-1 flex-wrap gap-x-3 md:w-auto md:gap-x-5">
                  <div className="dropdown">
                    {/* {pathname == "/trending" || pathname == "/buygroup" ? (
                    <button className="dropbtn flex items-center">
                      <div>
                        <Image src={HamburgerIcon} alt="hamburger-icon" />
                      </div>
                      <p
                        className="mx-3 text-sm font-normal capitalize text-color-dark sm:text-base md:text-lg"
                        translate="no"
                      >
                        {t("all_categories")}
                      </p>
                      <div>
                        <Image
                          src={HamburgerDownIcon}
                          alt="hamburger-down-icon"
                        />
                      </div>
                    </button>
                  ) : null} */}

                    {(pathname == "/trending" || pathname == "/buygroup") &&
                    memoizedSubCategory?.length ? (
                      <div className="dropdown-content">
                        {memoizedSubCategory?.map(
                          (item: CategoryProps, index: number) => (
                            <div
                              key={item?.id}
                              className={cn(
                                "dropdown-content-child flex cursor-pointer items-center justify-start gap-2 p-3",
                                memoizedSubCategory?.length
                                  ? index === subCategoryIndex
                                    ? "dropdown-active-child"
                                    : null
                                  : null,
                              )}
                              dir={langDir}
                              onMouseEnter={() => setSubCategoryIndex(index)}
                              onClick={() => {
                                setSubCategoryIndex(index);
                                category.setSubCategories(
                                  memoizedSubCategory?.[subCategoryIndex]
                                    ?.children,
                                );
                                // category.setSubSubCategories([]);
                                category.setCategoryId(item?.id.toString());
                                // save index to check for child categories part of parent or not
                                category.setSubCategoryIndex(index);
                                category.setSubCategoryParentName(item?.name);
                                category.setSubSubCategoryParentName(
                                  memoizedSubCategory?.[subCategoryIndex]
                                    ?.children?.[0]?.name,
                                );
                                category.setSubSubCategories(
                                  memoizedSubCategory?.[subCategoryIndex]
                                    ?.children?.[0]?.children,
                                );

                                //reset for second level category active index
                                category.setSecondLevelCategoryIndex(0);

                                category.setCategoryIds(item?.id.toString());
                              }}
                            >
                              {item?.icon ? (
                                <Image
                                  src={item.icon}
                                  alt={item?.name}
                                  height={24}
                                  width={24}
                                />
                              ) : (
                                <MdOutlineImageNotSupported size={24} />
                              )}
                              <p
                                title={item?.name}
                                className="text-beat text-start text-sm"
                              >
                                {item?.name}
                              </p>
                            </div>
                          ),
                        )}
                      </div>
                    ) : null}

                    {pathname == "/trending" || pathname == "/buygroup" ? (
                      memoizedSubCategory?.[subCategoryIndex]?.children
                        ?.length ? (
                        <div className="dropdown-content-second">
                          {memoizedSubCategory?.[
                            subCategoryIndex
                          ]?.children?.map(
                            (item: CategoryProps, index: number) => (
                              <div
                                key={item?.id}
                                className={cn(
                                  "dropdown-content-child flex cursor-pointer items-center justify-start gap-2 p-3",
                                  memoizedSubCategory?.[subCategoryIndex]
                                    ?.children?.length
                                    ? index === subSubCategoryIndex
                                      ? "dropdown-active-child"
                                      : null
                                    : null,
                                )}
                                onMouseEnter={() =>
                                  setSubSubCategoryIndex(index)
                                }
                                onClick={() => {
                                  setSubSubCategoryIndex(index);
                                  category.setSubSubCategories(
                                    memoizedSubCategory?.[subCategoryIndex]
                                      ?.children?.[subSubCategoryIndex]
                                      ?.children,
                                  );
                                  category.setCategoryId(item?.id.toString());
                                  category.setSecondLevelCategoryIndex(index);
                                  category.setSubSubCategoryParentName(
                                    item?.name,
                                  );
                                  //FIXME: need condition
                                  if (
                                    category.subCategoryIndex !==
                                    subCategoryIndex
                                  ) {
                                    category.setSubCategories([]);
                                    category.setSubCategoryParentName("");
                                  }
                                  category.setCategoryIds(
                                    [
                                      memoizedSubCategory?.[
                                        subCategoryIndex
                                      ]?.id.toString(),
                                      item?.id.toString(),
                                    ].join(","),
                                  );
                                }}
                                dir={langDir}
                              >
                                {item?.icon ? (
                                  <Image
                                    src={item.icon}
                                    alt={item?.name}
                                    height={24}
                                    width={24}
                                  />
                                ) : (
                                  <MdOutlineImageNotSupported size={24} />
                                )}
                                <p
                                  title={item?.name}
                                  className="text-beat text-start text-sm"
                                >
                                  {item?.name}
                                </p>
                              </div>
                            ),
                          )}
                        </div>
                      ) : null
                    ) : null}

                    {(pathname == "/trending" || pathname == "/buygroup") &&
                    memoizedSubCategory?.[subCategoryIndex]?.children?.[
                      subSubCategoryIndex
                    ]?.children?.length ? (
                      <div className="dropdown-content-third p-3">
                        <h4 className="mb-2 text-sm" dir={langDir}>
                          {memoizedSubCategory?.[subCategoryIndex]?.children?.[
                            subSubCategoryIndex
                          ]?.name || ""}
                        </h4>
                        <div className="flex flex-col sm:grid sm:grid-cols-5">
                          {memoizedSubCategory?.[subCategoryIndex]?.children?.[
                            subSubCategoryIndex
                          ]?.children?.map(
                            (item: CategoryProps, index: number) => (
                              <div
                                key={item?.id}
                                className={cn(
                                  "dropdown-content-child flex cursor-pointer flex-row items-center justify-start gap-2 p-3 sm:flex-col",
                                  memoizedSubCategory?.[subCategoryIndex]
                                    ?.children?.[subSubCategoryIndex]?.children
                                    ?.length
                                    ? index === subSubSubCategoryIndex
                                      ? "dropdown-active-child"
                                      : null
                                    : null,
                                )}
                                onMouseEnter={() =>
                                  setSubSubSubCategoryIndex(index)
                                }
                                onClick={() => {
                                  setSubSubSubCategoryIndex(index);
                                  category.setCategoryId(item?.id.toString());
                                  category.setCategoryIds(
                                    [
                                      memoizedSubCategory?.[
                                        subCategoryIndex
                                      ]?.id.toString(),
                                      memoizedSubCategory?.[
                                        subCategoryIndex
                                      ]?.children?.[
                                        subSubCategoryIndex
                                      ]?.id.toString(),
                                      item?.id.toString(),
                                    ].join(","),
                                  );
                                }}
                                dir={langDir}
                              >
                                <div className="relative h-8 w-8">
                                  {item?.icon ? (
                                    <Image
                                      src={item.icon}
                                      alt={item?.name}
                                      // height={30}
                                      // width={30}
                                      fill
                                      className="object-contain"
                                    />
                                  ) : (
                                    <MdOutlineImageNotSupported size={30} />
                                  )}
                                </div>
                                <p
                                  title={item?.name}
                                  className="text-beat text-center text-sm"
                                >
                                  {item?.name}
                                </p>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    ) : null}
                  </div>

                </div>

                <div className="flex w-full items-center py-1">
                  {/* Hamburger Menu Button - On trending/buygroup/home pages - Left end */}
                  {(pathname === "/trending" ||
                    pathname === "/buygroup" ||
                    pathname === "/home" ||
                    pathname === "/") &&
                    false && <div />}

                  <ul className="ml-auto flex items-center justify-end gap-x-4">
                    {getRoleBasedHeaderOptions()}
                    {/* <li className="py-1.5 text-sm font-normal capitalize sm:text-base md:text-lg">
                    <a
                      href="#"
                      className="text-light-gray transition-colors hover:text-primary/70"
                      onClick={handleToggleQueryModal}
                      translate="no"
                    >
                      {t("help_center")}
                    </a>
                  </li> */}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      <Dialog open={isQueryModalOpen} onOpenChange={handleToggleQueryModal}>
        <DialogContent
          className="add-new-address-modal add_member_modal gap-0 p-0 md:!max-w-2xl"
          ref={wrapperRef}
        >
          <QueryForm onClose={handleToggleQueryModal} />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Header;
