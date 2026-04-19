"use client";
import React, { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useDynamicTranslation } from "@/hooks/useDynamicTranslation";
import { getSaleStartLabel } from "./buygroupHelpers";

interface BuygroupCarouselProps {
  list: any[];
}

const BuygroupCarousel: React.FC<BuygroupCarouselProps> = ({ list }) => {
  const t = useTranslations();
  const { translate } = useDynamicTranslation();
  const [index, setIndex] = useState(0);
  const auto = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!list?.length) return;
    auto.current = setInterval(() => {
      setIndex((prev) => (prev + 1) % list.length);
    }, 4000);
    return () => {
      if (auto.current) clearInterval(auto.current);
    };
  }, [list?.length]);

  if (!list?.length) return null;

  return (
    <div className="relative w-full overflow-hidden rounded-lg bg-card shadow-sm sm:rounded-xl">
      <div
        className="flex transition-transform duration-500"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {list.map((p: any) => {
          const img =
            p?.product_productPrice?.[0]?.productPrice_productSellerImage?.[0]
              ?.image || p?.productImages?.[0]?.image;
          const startLabel = getSaleStartLabel(
            p?.product_productPrice?.[0]?.dateOpen,
            p?.product_productPrice?.[0]?.startTime,
          );
          return (
            <div
              key={p.id}
              className="relative h-48 min-w-full sm:h-56 md:h-64 lg:h-72"
            >
              <a href={`/trending/${p.id}`} className="absolute inset-0">
                <img
                  src={img || "/images/product-placeholder.png"}
                  alt={p.productName}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/10" />
                <div className="absolute right-2 bottom-2 left-2 flex flex-col items-start justify-between gap-2 sm:right-4 sm:bottom-4 sm:left-4 sm:flex-row sm:items-center">
                  <div className="text-white">
                    <h3 className="mb-1 line-clamp-1 text-sm font-semibold sm:text-lg md:text-xl">
                      {translate(p.productName)}
                    </h3>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <span className="rounded-full bg-warning px-1.5 py-0.5 text-[9px] font-bold text-white shadow sm:px-2 sm:text-[10px] md:text-xs">
                        {t("sale_starts_on")}
                      </span>
                      <span className="rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-semibold text-white shadow sm:px-2 sm:text-[10px] md:text-xs">
                        {startLabel}
                      </span>
                    </div>
                  </div>
                  <span className="rounded-full bg-warning px-2 py-0.5 text-[10px] font-bold text-white shadow sm:px-3 sm:py-1 sm:text-xs md:text-sm">
                    {t("coming_soon")}
                  </span>
                </div>
              </a>
            </div>
          );
        })}
      </div>
      {/* Dots */}
      <div className="absolute right-0 bottom-1 left-0 flex justify-center gap-1 sm:bottom-2 sm:gap-1.5">
        {list.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`h-1 rounded-full transition-all sm:h-1.5 ${i === index ? "w-4 bg-card sm:w-6" : "w-2 bg-card/60 sm:w-3"}`}
          />
        ))}
      </div>
    </div>
  );
};

export default BuygroupCarousel;
