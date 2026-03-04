"use client";
import Link from 'next/link';
import { useTranslations } from "next-intl";

export default function NotFound() {
  const t = useTranslations();
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <h1 className="text-6xl font-bold text-foreground mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-muted-foreground mb-4">{t("page_not_found")}</h2>
      <p className="text-muted-foreground mb-8 text-center max-w-md">
        {t("page_not_found_description")}
      </p>
      <div className="flex gap-4">
        <Link
          href="/"
          className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          {t("go_home")}
        </Link>
        <Link
          href="/products"
          className="px-6 py-3 border border-border rounded-lg hover:bg-muted transition-colors"
        >
          {t("browse_products")}
        </Link>
      </div>
    </div>
  );
}
