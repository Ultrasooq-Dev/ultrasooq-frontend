"use client";
import React from "react";
import BasicInformationSection from "../BasicInformationSection";
import dynamic from "next/dynamic";

const DescriptionAndSpecificationSection = dynamic(
  () => import("../DescriptionAndSpecificationSection"),
  {
    loading: () => (
      <div className="animate-pulse h-64 bg-gray-200 rounded-lg" />
    ),
    ssr: false,
  }
);

interface Step2Props {
  tagsList: any;
  activeProductType?: string;
  selectedCategoryIds?: string[];
  copy?: boolean;
}

const Step2ProductDetails: React.FC<Step2Props> = ({
  tagsList,
  activeProductType,
  selectedCategoryIds,
  copy = false,
}) => {
  return (
    <div className="space-y-6">
      {/* Category, Brand, Condition, Tags */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 bg-primary/5 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <svg
                className="h-5 w-5 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                Category & Basic Details
              </h2>
              <p className="text-sm text-gray-500">
                Category, brand, condition, and tags
              </p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <BasicInformationSection
            tagsList={tagsList}
            activeProductType={activeProductType}
            selectedCategoryIds={selectedCategoryIds}
            copy={copy}
            wizardMode
          />
        </div>
      </div>

      {/* Description, Specifications, Variants */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 bg-success/5 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/10">
              <svg
                className="h-5 w-5 text-success"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                Description & Specifications
              </h2>
              <p className="text-sm text-gray-500">
                Product details, specs, and variants
              </p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <DescriptionAndSpecificationSection
            activeProductType={activeProductType}
            wizardMode
          />
        </div>
      </div>
    </div>
  );
};

export default Step2ProductDetails;
