import React, { useMemo, useState } from "react";
import { getAmPm, parsedDays } from "@/utils/helper";
import Image from "next/image";
import { cn } from "@/lib/utils";
import ViewMultiTagSection from "./ViewMultiTagSection";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { ChevronDownIcon, ChevronUpIcon } from "@radix-ui/react-icons";

type VendorBranchSectionProps = {
  branchDetails: any;
};

const VendorBranchSection: React.FC<VendorBranchSectionProps> = ({ branchDetails }) => {
  const t = useTranslations();
  const { langDir } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);

  const memoizedParsedDays = useMemo(
    () => parsedDays(branchDetails?.workingDays),
    [branchDetails?.workingDays],
  );

  return (
    <div className="mb-5 w-full overflow-hidden rounded-lg border border-solid border-gray-300 bg-white">
      {/* Header Section - Clickable */}
      <div 
        className="flex w-full cursor-pointer items-center justify-between bg-[#FAFAFA] px-3 py-4 transition-colors hover:bg-gray-100"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex w-auto items-center text-base font-medium text-color-dark">
          <div className="flex items-start">
            {branchDetails?.userBranchBusinessType?.map(
              (item: any, index: number, array: any[]) => (
                <span className="mr-1.5" key={item?.id}>
                  {`${item?.userBranch_BusinessType_Tag?.tagName}${index !== array.length - 1 ? ", " : ""}`}
                </span>
              ),
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <p
            className={cn(
              branchDetails?.mainOffice === 1
                ? "text-red-600"
                : "text-dark-cyan",
              "text-base font-semibold leading-5",
            )}
          >
            {branchDetails?.mainOffice === 1 ? t("main_branch") : t("sub_branch")}
          </p>
          {/* Dropdown Icon */}
          <div className="flex items-center text-gray-600">
            {isExpanded ? (
              <ChevronUpIcon className="h-5 w-5" />
            ) : (
              <ChevronDownIcon className="h-5 w-5" />
            )}
          </div>
        </div>
      </div>

      {/* Branch Information Section - Collapsible */}
      {isExpanded && (
        <div className="w-full border-t border-solid border-gray-300 bg-white px-5 py-4">
          <div className="mb-4 w-full">
            <h2 className="left-8 text-lg font-semibold text-color-dark" dir={langDir} translate="no">
              {t("branch_information")}
            </h2>
          </div>
          
          <div className="flex w-full flex-wrap">
            <div className="sm:w-7/12">
              <div className="flex w-full flex-wrap py-4">
                <div className="mr-1 flex w-4/12 items-center justify-start sm:mr-0">
                  <span
                    className="text-sm font-normal capitalize leading-4 text-gray-500"
                    dir={langDir}
                    translate="no"
                  >
                    {t("address")}:
                  </span>
                </div>
                <div className="mr-1 flex w-8/12  items-center justify-start sm:mr-0">
                  <p
                    className="text-base font-medium leading-4 text-color-dark"
                    dir={langDir}
                  >
                    {branchDetails?.address || "NA"}
                  </p>
                </div>
              </div>
            </div>
            <div className="w-5/12">
              <div className="flex w-full flex-wrap py-4">
                <div className="mr-1 flex w-5/12 items-center justify-start sm:mr-0">
                  <span
                    className="text-sm font-normal capitalize leading-4 text-gray-500"
                    dir={langDir}
                    translate="no"
                  >
                    {t("country")}:
                  </span>
                </div>
                <div className="mr-1 flex w-7/12  items-center justify-start sm:mr-0">
                  <p
                    className="text-base font-medium capitalize leading-4 text-color-dark"
                    dir={langDir}
                  >
                    {branchDetails?.country || "NA"}
                  </p>
                </div>
              </div>
            </div>
            <div className="w-7/12">
              <div className="flex w-full flex-wrap py-4">
                <div className="mr-1 flex w-4/12 items-center justify-start sm:mr-0">
                  <span
                    className="text-sm font-normal capitalize leading-4 text-gray-500"
                    dir={langDir}
                    translate="no"
                  >
                    {t("city")}:
                  </span>
                </div>
                <div className="mr-1 flex w-8/12  items-center justify-start sm:mr-0">
                  <p
                    className="text-base font-medium leading-4 text-color-dark"
                    dir={langDir}
                  >
                    {branchDetails?.city || "NA"}
                  </p>
                </div>
              </div>
            </div>
            <div className="w-5/12">
              <div className="flex w-full flex-wrap py-4">
                <div className="mr-1 flex w-5/12 items-center justify-start sm:mr-0">
                  <span
                    className="text-sm font-normal capitalize leading-4 text-gray-500"
                    dir={langDir}
                    translate="no"
                  >
                    {t("branch_contact_number")}:
                  </span>
                </div>
                <div className="mr-1 flex w-7/12  items-center justify-start sm:mr-0">
                  <p
                    className="text-base font-medium leading-4 text-color-dark"
                    dir={langDir}
                  >
                    {branchDetails?.contactNumber || "NA"}
                  </p>
                </div>
              </div>
            </div>
            <div className="w-7/12">
              <div className="flex w-full flex-wrap py-4">
                <div className="mr-1 flex w-4/12 items-center justify-start sm:mr-0">
                  <span
                    className="text-sm font-normal capitalize leading-4 text-gray-500"
                    dir={langDir}
                    translate="no"
                  >
                    {t("province")}:
                  </span>
                </div>
                <div className="mr-1 flex w-8/12  items-center justify-start sm:mr-0">
                  <p
                    className="text-base font-medium leading-4 text-color-dark"
                    dir={langDir}
                  >
                    {branchDetails?.province || "NA"}
                  </p>
                </div>
              </div>
            </div>
            <div className="w-5/12">
              <div className="flex w-full flex-wrap py-4">
                <div className="mr-1 flex w-5/12 items-center justify-start sm:mr-0">
                  <span
                    className="text-sm font-normal capitalize leading-4 text-gray-500"
                    dir={langDir}
                    translate="no"
                  >
                    {t("branch_contact_name")}:
                  </span>
                </div>
                <div className="mr-1 flex w-7/12  items-center justify-start sm:mr-0">
                  <p
                    className="text-base font-medium leading-4 text-color-dark"
                    dir={langDir}
                  >
                    {branchDetails?.contactName || "NA"}
                  </p>
                </div>
              </div>
            </div>
            <div className="w-7/12">
              <div className="flex w-full flex-wrap py-4">
                <div className="mr-1 flex w-4/12 items-center justify-start sm:mr-0">
                  <span
                    className="text-sm font-normal capitalize leading-4 text-gray-500"
                    dir={langDir}
                    translate="no"
                  >
                    {t("start_time")}:
                  </span>
                </div>
                <div className="mr-1 flex w-8/12  items-center justify-start sm:mr-0">
                  <p
                    className="text-base font-medium leading-4 text-color-dark"
                    dir={langDir}
                  >
                    {getAmPm(branchDetails?.startTime) || "NA"}
                  </p>
                </div>
              </div>
            </div>
            <div className="w-5/12">
              <div className="flex w-full flex-wrap py-4">
                <div className="mr-1 flex w-5/12 items-center justify-start sm:mr-0">
                  <span
                    className="text-sm font-normal capitalize leading-4 text-gray-500"
                    dir={langDir}
                    translate="no"
                  >
                    {t("end_time")}:
                  </span>
                </div>
                <div className="mr-1 flex w-7/12  items-center justify-start sm:mr-0">
                  <p
                    className="text-base font-medium leading-4 text-color-dark"
                    dir={langDir}
                  >
                    {getAmPm(branchDetails?.endTime) || "NA"}
                  </p>
                </div>
              </div>
            </div>
            <div className="w-7/12">
              <div className="flex w-full flex-wrap py-4">
                <div className="mr-1 flex w-4/12 items-center justify-start sm:mr-0">
                  <span
                    className="text-sm font-normal capitalize leading-4 text-gray-500"
                    dir={langDir}
                    translate="no"
                  >
                    {t("working_days")}:
                  </span>
                </div>
                <div className="mr-1 flex w-8/12  items-center justify-start sm:mr-0">
                  <p
                    className="text-base font-medium leading-4 text-color-dark"
                    dir={langDir}
                  >
                    {memoizedParsedDays || "NA"}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Images Section */}
            <div className="flex w-full flex-wrap">
              <div className="w-7/12">
                <div className="flex w-full flex-wrap py-4">
                  <div className="mb-3 mr-1 flex w-full items-center justify-start sm:mr-0">
                    <span
                      className="text-sm font-normal capitalize leading-4 text-gray-500"
                      dir={langDir}
                      translate="no"
                    >
                      {t("branch_front_picture")}:
                    </span>
                  </div>
                  <div className="mr-1 flex w-full  items-center justify-start sm:mr-0">
                    <div
                      className="relative h-32 w-36 rounded-2xl border border-gray-300"
                      dir={langDir}
                    >
                      <Image
                        src={
                          branchDetails?.branchFrontPicture
                            ? branchDetails.branchFrontPicture
                            : "/images/no-image.jpg"
                        }
                        alt="branch-image"
                        className="object-contain"
                        fill
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="w-5/12">
                <div className="flex w-full flex-wrap py-4">
                  <div className="mb-3 mr-1 flex w-full items-center justify-start sm:mr-0">
                    <span
                      className="text-sm font-normal capitalize leading-4 text-gray-500"
                      dir={langDir}
                      translate="no"
                    >
                      {t("address_proof")}
                    </span>
                  </div>
                  <div className="mr-1 flex w-full  items-center justify-start sm:mr-0">
                    <div
                      className="relative h-32 w-36 rounded-2xl border border-gray-300"
                      dir={langDir}
                    >
                      <Image
                        src={
                          branchDetails?.proofOfAddress
                            ? branchDetails.proofOfAddress
                            : "/images/no-image.jpg"
                        }
                        alt="branch-image"
                        className="object-contain"
                        fill
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Categories Section */}
          <div className="mt-6 w-full">
            <h3 className="mb-3 text-lg font-bold text-color-dark" dir={langDir} translate="no">
              {t("categories")}
            </h3>
            <ViewMultiTagSection
              categoryDetails={branchDetails?.userBranch_userBranchCategory}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorBranchSection;