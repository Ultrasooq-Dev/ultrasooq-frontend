import React from "react";
import PlateEditor from "@/components/shared/Plate/PlateEditor";
import { handleDescriptionParse } from "@/utils/helper";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";

type VendorMoreInformationSectionProps = {
  vendor: any;
};

const VendorMoreInformationSection: React.FC<
  VendorMoreInformationSectionProps
> = ({ vendor }) => {
  const t = useTranslations();
  const { langDir } = useAuth();

  return (
    <div className="w-full py-4">
      <div className="flex w-full flex-wrap items-center justify-between pb-5">
        <div className="mb-4 flex w-full items-center justify-between">
          <h2 className="text-lg font-bold text-color-dark" dir={langDir} translate="no">
            {t("more_information")}
          </h2>
        </div>
      </div>
      <div className="w-full">
        <div className="flex w-full flex-wrap">
          <div className="w-7/12">
            <div className="flex w-full flex-wrap py-4">
              <div className="mr-1 flex w-4/12 items-center justify-start sm:mr-0">
                <span className="text-sm font-normal capitalize leading-4 text-gray-500" dir={langDir} translate="no">
                  {t("year_of_establishment")}:
                </span>
              </div>
              <div className="mr-1 flex w-8/12  items-center justify-start sm:mr-0">
                <p className="text-base font-medium leading-4 text-color-dark">
                  {vendor?.userProfile?.[0]?.yearOfEstablishment || "NA"}
                </p>
              </div>
            </div>
          </div>
          <div className="w-5/12">
            <div className="flex w-full flex-wrap py-4">
              <div className="mr-1 flex w-5/12 items-center justify-start sm:mr-0">
                <span className="text-sm font-normal capitalize leading-4 text-gray-500" dir={langDir} translate="no">
                  {t("no_of_employees")}:
                </span>
              </div>
              <div className="mr-1 flex w-7/12  items-center justify-start sm:mr-0">
                <p className="text-base font-medium leading-4 text-color-dark">
                  {vendor?.userProfile?.[0]?.totalNoOfEmployee || "NA"}
                </p>
              </div>
            </div>
          </div>
          <div className="w-full">
            <div className="flex w-full flex-wrap items-start py-4">
              <div className="mr-1 flex w-2/12 items-center justify-start sm:mr-0">
                <span className="text-sm font-normal capitalize leading-4 text-gray-500" dir={langDir} translate="no">
                  {t("about_us")}:
                </span>
              </div>
              <div className="mr-1 flex w-10/12  items-center justify-start pl-7 sm:mr-0">
                <PlateEditor
                  description={
                    vendor?.userProfile?.[0]?.aboutUs
                      ? handleDescriptionParse(
                          vendor?.userProfile?.[0]?.aboutUs,
                        )
                      : undefined
                  }
                  readOnly
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorMoreInformationSection;
