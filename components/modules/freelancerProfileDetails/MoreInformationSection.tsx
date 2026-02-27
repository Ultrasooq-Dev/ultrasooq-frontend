import React, { useMemo } from "react";
import Image from "next/image";
import { getAmPm, handleDescriptionParse, parsedDays } from "@/utils/helper";
import PlateEditor from "@/components/shared/Plate/PlateEditor";
import EditIcon from "@/public/images/edit-icon.svg";
import Link from "next/link";
import ViewMultiTagSection from "../companyProfileDetails/ViewMultiTagSection";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";

type MoreInformationSectionProps = {
  userDetails: any;
};

const MoreInformationSection: React.FC<MoreInformationSectionProps> = ({
  userDetails,
}) => {
  const t = useTranslations();
  const { langDir } = useAuth();
  const workingDays = userDetails?.userBranch?.[0]?.workingDays;
  const memoizedParsedDays = useMemo(
    () => parsedDays(userDetails?.userBranch?.[0]?.workingDays),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [workingDays],
  );

  return (
    <div className="w-full py-4">
      <div className="flex w-full flex-wrap items-center justify-between pb-5">
        <h2 className="left-8 text-2xl font-semibold text-color-dark" dir={langDir} translate="no">
          {t("freelancer_information")}
        </h2>
        {userDetails?.userBranch?.length ? (
          <div className="w-auto">
            <Link
              href="/freelancer-profile/edit-profile"
              className="flex items-center rounded-md border-0 bg-dark-orange px-3 py-2 text-sm font-medium capitalize leading-6 text-white"
              dir={langDir}
              translate="no"
            >
              <Image
                src={EditIcon}
                height={18}
                width={18}
                className="mr-1"
                alt="edit-icon"
              />
              {t("edit")}
            </Link>
          </div>
        ) : null}
      </div>
      <div className="w-full">
        <div className="w-full">
          <div className="flex w-full flex-col border-b-2 border-dashed border-border py-3.5 pb-5 text-base font-medium text-color-dark">
            <label className="mb-3 text-lg font-semibold leading-5 text-color-dark" dir={langDir} translate="no">
              {t("about_me")}
            </label>
            <PlateEditor
              description={
                userDetails?.userProfile?.[0]?.aboutUs
                  ? handleDescriptionParse(
                      userDetails?.userProfile?.[0]?.aboutUs,
                    )
                  : undefined
              }
              readOnly
            />
          </div>
        </div>
        <div className="mt-6 w-full border-b-2 border-dashed border-border pb-3.5">
          <div className="flex w-full flex-wrap items-center justify-between pb-5">
            <label className="mb-3.5 block text-lg font-semibold leading-5 text-color-dark" dir={langDir} translate="no">
              {t("address")}
            </label>
            {userDetails?.userBranch?.length ? (
              <div className="w-auto">
                <Link
                  href={`/freelancer-profile/edit-branch?branchId=${userDetails?.userBranch?.[0]?.id}`}
                  className="flex items-center rounded-md border-0 bg-dark-orange px-3 py-2 text-sm font-medium capitalize leading-6 text-white"
                >
                  <Image
                    src={EditIcon}
                    height={18}
                    width={18}
                    className="mr-1"
                    alt="edit-icon"
                  />
                  {t("edit")}
                </Link>
              </div>
            ) : null}
          </div>
          <div className="flex w-full flex-wrap">
            <div className="w-full md:w-7/12">
              <div className="flex w-full py-2.5 md:py-3.5">
                <div className="w-3/12 text-sm font-normal capitalize leading-4 text-muted-foreground md:w-3/12" dir={langDir} translate="no">
                  <span>{t("address")}:</span>
                </div>
                <div className="w-9/12 text-base font-medium leading-4 text-color-dark md:w-9/12" dir={langDir}>
                  <p>{userDetails?.userBranch?.[0]?.address || "NA"}</p>
                </div>
              </div>
            </div>
            <div className="w-full md:w-5/12">
              <div className="flex w-full py-2.5 md:py-3.5">
                <div className="w-3/12 text-sm font-normal capitalize leading-4 text-muted-foreground md:w-6/12" dir={langDir} translate="no">
                  <span>{t("country")}:</span>
                </div>
                <div className="w-9/12 text-base font-medium leading-4 text-color-dark md:w-6/12" dir={langDir}>
                  <p>{userDetails?.userBranch?.[0]?.country || "NA"}</p>
                </div>
              </div>
            </div>
            <div className="w-full md:w-7/12">
              <div className="flex w-full py-2.5 md:py-3.5">
                <div className="w-3/12 text-sm font-normal capitalize leading-4 text-muted-foreground md:w-3/12" dir={langDir} translate="no">
                  <span>{t("city")}:</span>
                </div>
                <div className="w-9/12 text-base font-medium leading-4 text-color-dark md:w-9/12" dir={langDir}>
                  <p>{userDetails?.userBranch?.[0]?.city || "NA"}</p>
                </div>
              </div>
            </div>
            <div className="w-full md:w-5/12">
              <div className="flex w-full py-2.5 md:py-3.5">
                <div className="w-3/12 text-sm font-normal capitalize leading-4 text-muted-foreground md:w-6/12" dir={langDir} translate="no">
                  <span>{t("branch_contact_number")}:</span>
                </div>
                <div className="w-9/12 text-base font-medium leading-4 text-color-dark md:w-6/12" dir={langDir}>
                  <p>{userDetails?.userBranch?.[0]?.contactNumber || "NA"}</p>
                </div>
              </div>
            </div>
            <div className="w-full md:w-7/12">
              <div className="flex w-full py-2.5 md:py-3.5">
                <div className="w-3/12 text-sm font-normal capitalize leading-4 text-muted-foreground md:w-3/12" dir={langDir} translate="no">
                  <span>{t("province")}:</span>
                </div>
                <div className="w-9/12 text-base font-medium leading-4 text-color-dark md:w-9/12" dir={langDir}>
                  <p>{userDetails?.userBranch?.[0]?.province || "NA"}</p>
                </div>
              </div>
            </div>
            <div className="w-full md:w-5/12">
              <div className="flex w-full py-2.5 md:py-3.5">
                <div className="w-3/12 text-sm font-normal capitalize leading-4 text-muted-foreground md:w-6/12" dir={langDir} translate="no">
                  <span>{t("branch_contact_name")}:</span>
                </div>
                <div className="w-9/12 text-base font-medium leading-4 text-color-dark md:w-6/12" dir={langDir}>
                  <p>{userDetails?.userBranch?.[0]?.contactName}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 w-full border-b-2 border-dashed border-border pb-3.5">
          <label className="mb-3 block text-lg font-semibold leading-5 text-color-dark" dir={langDir} translate="no">
            {t("working_hours")}
          </label>
          <div className="flex w-full flex-wrap">
            <div className="w-full md:w-6/12 lg:w-4/12">
              <div className="flex w-full py-2.5 md:py-3.5">
                <div className="w-3/12 text-sm font-normal capitalize leading-4 text-muted-foreground md:w-6/12" dir={langDir} translate="no">
                  <span>{t("start_time")}:</span>
                </div>
                <div className="w-9/12 text-base font-medium leading-4 text-color-dark md:w-6/12" dir={langDir}>
                  <span>
                    {getAmPm(userDetails?.userBranch?.[0]?.startTime)}
                  </span>
                </div>
              </div>
            </div>
            <div className="w-full md:w-6/12 lg:w-4/12">
              <div className="flex w-full py-2.5 md:py-3.5">
                <div className="w-3/12 text-sm font-normal capitalize leading-4 text-muted-foreground md:w-6/12" dir={langDir} translate="no">
                  <span>{t("end_time")}:</span>
                </div>
                <div className="w-9/12 text-base font-medium leading-4 text-color-dark md:w-6/12" dir={langDir}>
                  <span>{getAmPm(userDetails?.userBranch?.[0]?.endTime)}</span>
                </div>
              </div>
            </div>
            <div className="w-full md:w-6/12 lg:w-4/12">
              <div className="flex w-full py-2.5 md:py-3.5">
                <div className="w-3/12 text-sm font-normal capitalize leading-4 text-muted-foreground md:w-6/12" dir={langDir} translate="no">
                  <span>{t("working_days")}:</span>
                </div>
                <div className="w-9/12 text-base font-medium leading-4 text-color-dark md:w-6/12" dir={langDir}>
                  <span>{memoizedParsedDays ? memoizedParsedDays.map((d: string) => t(d)).join(", ") : "NA"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* <div className="mt-6 w-full">
          <label className="mb-3 block text-lg font-semibold leading-5 text-color-dark">
            Tag
          </label>
          <div className="flex w-full flex-wrap">
            {userDetails?.userBranch?.[0]?.userBranchTags?.map((item: any) => (
              <span
                key={item.id}
                className="mr-4 mt-4 inline-block rounded bg-muted p-4 py-2.5 text-base font-medium leading-5 text-dark-cyan"
              >
                {item?.userBranchTagsTag?.tagName}
              </span>
            ))}
          </div>
        </div> */}
        <ViewMultiTagSection
          categoryDetails={
            userDetails?.userBranch?.[0]?.userBranch_userBranchCategory
          }
        />
      </div>
    </div>
  );
};

export default MoreInformationSection;
