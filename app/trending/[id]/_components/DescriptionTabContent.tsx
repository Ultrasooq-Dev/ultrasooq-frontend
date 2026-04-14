"use client";
import React from "react";
import { sanitizeHtml } from "@/utils/sanitize";
import { handleDescriptionParse } from "@/utils/helper";
import PlateEditor from "@/components/shared/Plate/PlateEditor";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "next-intl";

interface DescriptionTabContentProps {
  productDetails: any;
}

export default function DescriptionTabContent({ productDetails }: DescriptionTabContentProps) {
  const t = useTranslations();
  const { langDir } = useAuth();

  const desc =
    productDetails?.isDropshipped && productDetails?.customMarketingContent?.marketingText
      ? productDetails?.customMarketingContent?.marketingText
      : productDetails?.description;

  const renderDescription = () => {
    if (typeof desc === "object" && desc !== null) {
      return <PlateEditor description={desc} readOnly={true} fixedToolbar={false} />;
    }
    if (typeof desc === "string") {
      if (productDetails?.isDropshipped && productDetails?.customMarketingContent?.marketingText) {
        return (
          <div className="leading-relaxed text-muted-foreground" dir={langDir} translate="no">
            {desc}
          </div>
        );
      }
      try {
        const parsed = JSON.parse(desc);
        const extractText = (node: any): string => {
          if (typeof node === "string") return node;
          if (node?.text) return node.text;
          if (node?.children && Array.isArray(node.children)) {
            return node.children.map(extractText).join("");
          }
          return "";
        };
        const textContent = parsed.map(extractText).join("\n\n");
        if (textContent.trim()) {
          return (
            <div
              className="leading-relaxed text-muted-foreground"
              dir={langDir}
              translate="no"
              dangerouslySetInnerHTML={{
                __html: sanitizeHtml(textContent.replace(/\n/g, "<br/>")),
              }}
            />
          );
        }
        return <PlateEditor description={parsed} readOnly={true} fixedToolbar={false} />;
      } catch {
        try {
          const parsed = handleDescriptionParse(desc);
          return <PlateEditor description={parsed} readOnly={true} fixedToolbar={false} />;
        } catch {
          return (
            <div className="text-muted-foreground" dir={langDir} translate="no">
              {desc}
            </div>
          );
        }
      }
    }
    return (
      <div className="text-muted-foreground" dir={langDir} translate="no">
        {String(desc)}
      </div>
    );
  };

  const hasContent =
    (productDetails?.isDropshipped && productDetails?.customMarketingContent?.marketingText) ||
    productDetails?.description;

  return (
    <div className="min-h-[400px] p-8 sm:p-10 lg:p-12">
      {hasContent ? (
        <div className="space-y-4">
          <div className="prose prose-gray max-w-none">{renderDescription()}</div>
        </div>
      ) : (
        <div className="flex min-h-[200px] flex-col items-center justify-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <svg className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="mb-2 text-lg font-medium text-foreground" dir={langDir} translate="no">
            {productDetails?.isDropshipped ? "Dropship Product" : t("no_description_available")}
          </h3>
          <p className="max-w-md text-muted-foreground" dir={langDir} translate="no">
            {productDetails?.isDropshipped
              ? t("dropship_description_managed")
              : t("product_description_will_be_added_soon")}
          </p>
        </div>
      )}
    </div>
  );
}
