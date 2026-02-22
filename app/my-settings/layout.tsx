"use client";
import React, { useMemo } from "react";
import Image from "next/image";
import PackageIcon from "@/components/icons/PackageIcon";
import ChevronDownIcon from "@/components/icons/ChevronDownIcon";
import UserIcon from "@/components/icons/UserIcon";
import { useMe } from "@/apis/queries/user.queries";
import Link from "next/link";
import { getInitials } from "@/utils/helper";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";

const MySettingsLayout = ({ children }: { children: React.ReactNode }) => {
  const t = useTranslations();
  const { langDir } = useAuth();
  const pathname = usePathname();
  const isActivePath = (path: string) => path === pathname;

  const me = useMe();
  const memoizedInitials = useMemo(
    () => getInitials(me.data?.data?.firstName, me.data?.data?.lastName),
    [me.data?.data?.firstName, me.data?.data?.lastName],
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl" translate="no">
            {t("account_settings")}
          </h1>
          <p className="mt-2 text-sm text-gray-600" translate="no">
            {t("manage_your_account_settings_and_preferences")}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Sidebar Navigation */}
          <aside className="lg:col-span-3">
            <div className="space-y-4">
              {/* User Profile Card */}
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
                <div className="flex items-center gap-4" dir={langDir}>
                  <div className="flex-shrink-0">
                    {me?.data?.data?.profilePicture ? (
                      <Image
                        alt="Profile picture"
                        src={me?.data?.data?.profilePicture}
                        height={64}
                        width={64}
                        className="rounded-full object-cover ring-2 ring-gray-100"
                      />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary via-blue-600 to-info/90 text-xl font-bold text-white shadow-lg ring-2 ring-white">
                        {memoizedInitials}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500" translate="no">
                      {t("hello")}
                    </p>
                    <h3 className="truncate text-lg font-semibold text-gray-900">
                      {me.data?.data?.firstName} {me.data?.data?.lastName}
                    </h3>
                  </div>
                </div>
              </div>

              {/* Navigation Menu */}
              <nav className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <ul className="divide-y divide-gray-100" dir={langDir}>
                  <li>
                    <Link
                      href="/my-orders"
                      className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 hover:text-gray-900"
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-600 transition-colors group-hover:bg-gray-200">
                        <PackageIcon />
                      </span>
                      <span className="flex-1" translate="no">
                        {t("my_orders")}
                      </span>
                    </Link>
                  </li>
                  <li>
                    <div className="space-y-0">
                      <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3 text-sm font-semibold text-gray-900 bg-gradient-to-r from-primary/5 to-info/5">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <UserIcon />
                        </span>
                        <span className="flex-1" translate="no">
                          {t("account_settings")}
                        </span>
                        <span className="flex h-5 w-5 items-center justify-center text-primary">
                          <span className="h-4 w-4">
                            <ChevronDownIcon />
                          </span>
                        </span>
                      </div>
                      <div className="bg-gray-50/50">
                        <Link
                          href="/my-settings/address"
                          className={cn(
                            "relative block px-4 py-3 pl-12 pr-4 text-sm font-medium transition-all",
                            langDir === 'rtl' && "pl-4 pr-12",
                            isActivePath("/my-settings/address")
                              ? "bg-primary/5 text-primary"
                              : "text-gray-600 hover:bg-white hover:text-gray-900"
                          )}
                          translate="no"
                        >
                          {isActivePath("/my-settings/address") && (
                            <span className={cn(
                              "absolute top-0 h-full w-1 bg-primary",
                              langDir === 'rtl' ? 'right-0' : 'left-0'
                            )} />
                          )}
                          {t("manage_address")}
                        </Link>
                        {me.data?.data?.loginType === "MANUAL" ? (
                          <>
                            <Link
                              href="/my-settings/change-password"
                              className={cn(
                                "relative block px-4 py-3 pl-12 pr-4 text-sm font-medium transition-all",
                                langDir === 'rtl' && "pl-4 pr-12",
                                isActivePath("/my-settings/change-password")
                                  ? "bg-primary/5 text-primary"
                                  : "text-gray-600 hover:bg-white hover:text-gray-900"
                              )}
                              translate="no"
                            >
                              {isActivePath("/my-settings/change-password") && (
                                <span className={cn(
                                  "absolute top-0 h-full w-1 bg-primary",
                                  langDir === 'rtl' ? 'right-0' : 'left-0'
                                )} />
                              )}
                              {t("change_password")}
                            </Link>
                            <Link
                              href="/my-settings/change-email"
                              className={cn(
                                "relative block px-4 py-3 pl-12 pr-4 text-sm font-medium transition-all",
                                langDir === 'rtl' && "pl-4 pr-12",
                                isActivePath("/my-settings/change-email")
                                  ? "bg-primary/5 text-primary"
                                  : "text-gray-600 hover:bg-white hover:text-gray-900"
                              )}
                              translate="no"
                            >
                              {isActivePath("/my-settings/change-email") && (
                                <span className={cn(
                                  "absolute top-0 h-full w-1 bg-primary",
                                  langDir === 'rtl' ? 'right-0' : 'left-0'
                                )} />
                              )}
                              {t("change_email")}
                            </Link>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </li>
                </ul>
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-9">{children}</main>
        </div>
      </div>
    </div>
  );
};

export default MySettingsLayout;
