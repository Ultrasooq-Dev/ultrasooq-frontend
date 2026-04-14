"use client";
import React from "react";
import { useTranslations } from "next-intl";

const MyServicesTab: React.FC = () => {
  const t = useTranslations();

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold">{t("my_services")}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t("manage_your_services") || "Manage your services from here"}
          </p>
        </div>
        <a
          href="/manage-services"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary/90 transition-colors"
        >
          {t("open_full_page") || "Open Full Page"}
        </a>
      </div>
      <iframe
        src="/manage-services"
        className="w-full border rounded-xl min-h-[600px]"
        style={{ height: "calc(100vh - 300px)" }}
        title="My Services"
      />
    </div>
  );
};

export default MyServicesTab;
