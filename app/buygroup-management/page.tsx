"use client";
import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "next-intl";
import { withActiveUserGuard } from "@/components/shared/withRouteGuard";
import { cn } from "@/lib/utils";
import { T } from "./_components/theme";
import { BuyGroupOpsTab } from "./_components/BuyGroupOpsTab";

const TABS = [
  { id: "operations", label: "BuyGroup Operations" },
  { id: "history", label: "History" },
  { id: "settings", label: "Settings" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function BuygroupManagementPage() {
  const t = useTranslations();
  const { langDir } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("operations");

  return (
    <div className={cn("min-h-screen", T.bg)} dir={langDir}>
      {/* Page header */}
      <div className={cn("border-b", T.border, "bg-card px-6 py-5")}>
        <h1 className={cn("text-2xl font-bold", T.text)} translate="no">
          {t("buygroup_management") || "BuyGroup Operations Center"}
        </h1>
        <p className={cn("mt-1 text-sm", T.muted)} translate="no">
          {t("buygroup_management_subtitle") || "Manage your active deals, monitor thresholds, and take action"}
        </p>
      </div>

      {/* Tab bar */}
      <div className={cn("border-b", T.border, "bg-card px-6")}>
        <div className="flex gap-0">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-5 py-3 text-sm font-medium border-b-2 transition-colors",
                activeTab === tab.id
                  ? cn("border-primary", T.accentText)
                  : cn("border-transparent", T.muted, "hover:text-foreground"),
              )}
              translate="no"
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="px-6 py-8">
        {activeTab === "operations" && (
          <BuyGroupOpsTab langDir={langDir} t={t} />
        )}

        {activeTab === "history" && (
          <div className={cn("rounded-2xl border p-8 text-center", T.card, T.border)}>
            <p className={cn("text-sm", T.muted)}>
              {t("deal_history_coming_soon") || "Deal history — coming soon."}
            </p>
          </div>
        )}

        {activeTab === "settings" && (
          <div className={cn("rounded-2xl border p-8 text-center", T.card, T.border)}>
            <p className={cn("text-sm", T.muted)}>
              {t("buygroup_settings_coming_soon") || "BuyGroup settings — coming soon."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default withActiveUserGuard(BuygroupManagementPage);
