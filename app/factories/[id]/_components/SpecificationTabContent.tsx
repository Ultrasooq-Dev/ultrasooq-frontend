"use client";
import React from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { SpecificationItem } from "./types";

interface SpecificationTabContentProps {
  productDetails: any;
}

const SpecificationTabContent: React.FC<SpecificationTabContentProps> = ({
  productDetails,
}) => {
  const t = useTranslations();
  const { langDir } = useAuth();

  const isEmpty =
    !productDetails?.product_productSpecification?.length ||
    productDetails?.isDropshipped;

  return (
    <div className="min-h-[400px] p-8 sm:p-10 lg:p-12">
      {isEmpty ? (
        <div className="flex min-h-[200px] flex-col items-center justify-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <svg className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <h3 className="mb-2 text-lg font-medium text-foreground" dir={langDir} translate="no">
            {productDetails?.isDropshipped ? "Dropship Product" : t("no_specification_available")}
          </h3>
          <p className="max-w-md text-muted-foreground" dir={langDir} translate="no">
            {productDetails?.isDropshipped
              ? "This is a dropship product. Specifications are managed by the dropship vendor."
              : t("specifications_will_be_added_soon")}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-foreground" dir={langDir} translate="no">
            {t("technical_specifications")}
          </h2>
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="divide-y divide-border">
              {productDetails?.product_productSpecification?.map(
                (item: SpecificationItem, index: number) => (
                  <div
                    key={item?.id}
                    className={`p-6 ${index % 2 === 0 ? "bg-card" : "bg-muted/50"}`}
                  >
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                      <dt className="text-sm font-semibold text-foreground">
                        {item?.label}
                      </dt>
                      <dd className="text-sm text-muted-foreground">
                        {item?.specification}
                      </dd>
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpecificationTabContent;
