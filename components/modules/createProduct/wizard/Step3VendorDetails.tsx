"use client";
import React, { useMemo } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import PriceSection from "../PriceSection";
import ProductLocationAndCustomizationSection from "../ProductLocationAndCustomizationSection";
import VariantPricingSection from "../VariantPricingSection";

interface Step3Props {
  activeProductType?: string;
}

const Step3VendorDetails: React.FC<Step3Props> = ({ activeProductType }) => {
  const form = useFormContext();

  // Watch variant definitions from Step 2 to conditionally show Variant Pricing
  const productVariants = useWatch({
    control: form.control,
    name: "productVariants",
  });

  const hasVariants = useMemo(() => {
    if (!productVariants || !Array.isArray(productVariants)) return false;
    return productVariants.some(
      (vt: any) =>
        vt.type?.trim() &&
        vt.variants?.some((v: any) => v.value?.trim()),
    );
  }, [productVariants]);

  return (
    <div className="space-y-6">
      {/* Pricing Section */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 bg-orange-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-100">
              <svg
                className="h-5 w-5 text-orange-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                Pricing & Sales
              </h2>
              <p className="text-sm text-gray-500">
                Set prices, discounts, and stock
              </p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <PriceSection activeProductType={activeProductType} />
        </div>
      </div>

      {/* Variant Pricing Section — only visible when variants are defined in Step 2 */}
      {hasVariants && (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 bg-purple-50 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100">
                <svg
                  className="h-5 w-5 text-purple-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  Variant Pricing
                </h2>
                <p className="text-sm text-gray-500">
                  Set price and stock for each variant combination
                </p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <VariantPricingSection />
          </div>
        </div>
      )}

      {/* Location & Customization Section */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 bg-teal-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-100">
              <svg
                className="h-5 w-5 text-teal-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                Location & Customization
              </h2>
              <p className="text-sm text-gray-500">
                Sell locations and product customization
              </p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <ProductLocationAndCustomizationSection
            activeProductType={activeProductType}
          />
        </div>
      </div>
    </div>
  );
};

export default Step3VendorDetails;
