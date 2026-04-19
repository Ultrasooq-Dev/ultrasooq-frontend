"use client";

import { Quote, Star } from "lucide-react";
import { useTranslations } from "next-intl";

export function HomeTestimonials() {
  const t = useTranslations();

  const testimonials = [
    {
      name: t("testimonial_ahmed_name"),
      role: t("testimonial_ahmed_role"),
      content: t("testimonial_ahmed_content"),
      rating: 5,
      initial: t("testimonial_ahmed_name").charAt(0),
    },
    {
      name: t("testimonial_fatima_name"),
      role: t("testimonial_fatima_role"),
      content: t("testimonial_fatima_content"),
      rating: 5,
      initial: t("testimonial_fatima_name").charAt(0),
    },
    {
      name: t("testimonial_omar_name"),
      role: t("testimonial_omar_role"),
      content: t("testimonial_omar_content"),
      rating: 5,
      initial: t("testimonial_omar_name").charAt(0),
    },
  ];

  return (
    <section className="bg-card w-full px-4 py-12 sm:px-8 sm:py-16 lg:px-12 lg:py-20">
      <div className="mx-auto w-full max-w-[1400px]">
        <div className="mb-8 text-center sm:mb-12">
          <h2 className="text-foreground mb-3 text-2xl font-bold sm:text-3xl lg:text-4xl">
            {t("what_our_customers_say")}
          </h2>
          <p className="text-muted-foreground mx-auto max-w-2xl text-sm sm:text-base">
            {t("customer_testimonials_subtitle")}
          </p>
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3 lg:gap-6">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.name}
              className="bg-muted/40 border-border relative flex flex-col rounded-2xl border p-6 sm:p-7"
            >
              <Quote className="text-primary/20 absolute end-5 top-5 h-10 w-10" />
              <div className="mb-4 flex gap-1">
                {Array.from({ length: testimonial.rating }).map((_, index) => (
                  <Star
                    key={index}
                    className="text-warning h-4 w-4 fill-current"
                  />
                ))}
              </div>
              <p className="text-foreground mb-6 flex-1 text-sm leading-relaxed sm:text-base">
                {`"${testimonial.content}"`}
              </p>
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 text-primary flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-base font-bold">
                  {testimonial.initial}
                </div>
                <div>
                  <p className="text-foreground text-sm font-semibold">
                    {testimonial.name}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {testimonial.role}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
