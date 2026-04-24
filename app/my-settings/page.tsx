"use client";
import React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useMe } from "@/apis/queries/user.queries";
import { useAuth } from "@/context/AuthContext";
import { Pencil } from "lucide-react";

const SettingsPage = () => {
  const t = useTranslations();
  const { langDir } = useAuth();
  const me = useMe();
  const u = me.data?.data;

  const rows: { label: string; value: React.ReactNode }[] = [
    { label: t("first_name"), value: u?.firstName || "—" },
    { label: t("last_name"), value: u?.lastName || "—" },
    { label: t("email"), value: u?.email || "—" },
    {
      label: t("phone"),
      value: u?.phoneNumber ? `${u?.cc || ""} ${u.phoneNumber}` : "—",
    },
    { label: t("gender"), value: u?.gender || "—" },
    { label: t("date_of_birth"), value: u?.dateOfBirth?.slice(0, 10) || "—" },
  ];

  return (
    <div
      className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
      dir={langDir}
    >
      <div className="flex items-center justify-between gap-2 border-b border-border px-6 py-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground" translate="no">
            {t("profile_info")}
          </h2>
          <p className="text-sm text-muted-foreground" translate="no">
            {t("manage_your_account_settings_and_preferences")}
          </p>
        </div>
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          translate="no"
        >
          <Pencil className="h-4 w-4" />
          {t("edit")}
        </Link>
      </div>

      <dl className="divide-y divide-border">
        {rows.map((r) => (
          <div
            key={r.label}
            className="grid grid-cols-1 gap-1 px-6 py-4 sm:grid-cols-3"
          >
            <dt
              className="text-sm font-medium text-muted-foreground"
              translate="no"
            >
              {r.label}
            </dt>
            <dd className="text-sm text-foreground sm:col-span-2">{r.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
};

export default SettingsPage;
