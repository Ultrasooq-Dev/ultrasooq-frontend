'use client';

import { useEffect } from 'react';
import { useTranslations } from "next-intl";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations();

  useEffect(() => {
    console.error('Page error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <h1 className="text-6xl font-bold text-destructive mb-4">500</h1>
      <h2 className="text-2xl font-semibold text-muted-foreground mb-4">{t("something_went_wrong")}</h2>
      <p className="text-muted-foreground mb-8 text-center max-w-md">
        {t("unexpected_error_description")}
      </p>
      <button
        onClick={() => reset()}
        className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
      >
        {t("try_again")}
      </button>
    </div>
  );
}
