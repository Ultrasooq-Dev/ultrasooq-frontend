"use client";

import { Mail, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

export function HomeNewsletter() {
  const t = useTranslations();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
    setEmail("");
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <section className="bg-muted/40 w-full px-4 py-12 sm:px-8 sm:py-16 lg:px-12 lg:py-20">
      <div className="mx-auto w-full max-w-[1400px]">
        <div className="bg-primary relative overflow-hidden rounded-3xl px-6 py-12 sm:px-12 sm:py-16 lg:px-20 lg:py-20">
          <div className="bg-primary-foreground/10 absolute -end-20 -top-20 h-64 w-64 rounded-full blur-3xl" />
          <div className="bg-primary-foreground/5 absolute -bottom-20 -start-20 h-64 w-64 rounded-full blur-3xl" />

          <div className="relative flex flex-col items-center gap-8 text-center">
            <div className="bg-card/15 flex h-16 w-16 items-center justify-center rounded-2xl text-white backdrop-blur-sm">
              <Mail className="h-8 w-8" />
            </div>
            <div className="max-w-2xl">
              <h2 className="mb-3 text-2xl font-bold text-white sm:text-3xl lg:text-4xl">
                {t("get_10_off_first_order")}
              </h2>
              <p className="text-sm text-white/80 sm:text-base">
                {t("newsletter_description")}
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex w-full max-w-xl flex-col gap-3 sm:flex-row"
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("enter_your_email")}
                className="bg-card text-foreground placeholder:text-muted-foreground flex-1 rounded-xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-white/40 sm:text-base"
                required
              />
              <button
                type="submit"
                className="bg-card text-primary hover:bg-card/90 inline-flex items-center justify-center gap-2 rounded-xl px-6 py-4 text-sm font-bold transition-colors sm:text-base"
              >
                {submitted ? t("subscribed") : t("subscribe")}
                <Send className="h-4 w-4 rtl:rotate-180" />
              </button>
            </form>
            <p className="text-xs text-white/60">{t("no_spam_unsubscribe")}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
