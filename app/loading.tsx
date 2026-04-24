"use client";

import { useTranslations } from "next-intl";

export default function Loading() {
  const t = useTranslations();
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-border border-t-primary" />
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      </div>
    </div>
  );
}
