"use client";
import React, { useMemo } from "react";
import Image from "next/image";
import { getCurrentDay, getCurrentTime, parsedDays } from "@/utils/helper";
import { COMPANY_UNIQUE_ID } from "@/utils/constants";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import {
  Pencil,
  MapPin,
  Package,
  Star,
  Building2,
  Globe,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  CheckCircle2,
} from "lucide-react";

type ProfileCardProps = {
  userDetails: any;
};

const SOCIAL_ICON: Record<string, React.ComponentType<any>> = {
  facebook: Facebook,
  instagram: Instagram,
  twitter: Twitter,
  x: Twitter,
  linkedin: Linkedin,
  youtube: Youtube,
};

const normalizeSocialType = (type?: string) =>
  (type || "").toLowerCase().replace(/[^a-z]/g, "");

const ProfileCard: React.FC<ProfileCardProps> = ({ userDetails }) => {
  const t = useTranslations();
  const { langDir, currency } = useAuth();

  const isOnlineToday = useMemo(() => {
    const getActiveDays = userDetails?.userBranch
      ?.map((item: any) => parsedDays(item?.workingDays)?.includes(getCurrentDay()))
      .includes(true);
    const isActiveInCurrentDay = userDetails?.userBranch
      ?.map(
        (item: any) =>
          item?.startTime <= getCurrentTime && item?.endTime >= getCurrentTime,
      )
      .includes(true);
    return getActiveDays && isActiveInCurrentDay;
  }, [
    userDetails?.userBranch,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    userDetails?.userBranch?.map((item: any) => item?.workingDays),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    userDetails?.userBranch?.map((item: any) => item?.startTime),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    userDetails?.userBranch?.map((item: any) => item?.endTime),
  ]);

  const fullName = `${userDetails?.firstName || ""} ${userDetails?.lastName || ""}`.trim();
  const companyName =
    userDetails?.companyName || userDetails?.accountName || fullName || "NA";
  const branchCount = userDetails?.userBranch?.length || 0;
  const productCount =
    userDetails?.productCount ?? userDetails?._count?.userProduct ?? null;
  const rating = userDetails?.averageRating ?? userDetails?.rating ?? null;
  const memberSince = userDetails?.createdAt
    ? new Date(userDetails.createdAt).toLocaleDateString(undefined, {
        month: "short",
        year: "numeric",
      })
    : null;
  const isVerified = userDetails?.isVerified || userDetails?.verified;
  const socialLinks: { type: string; link: string; id: any }[] =
    userDetails?.userSocialLink || [];
  const categories: any[] = userDetails?.userBusinesCategoryDetail || [];
  const tagCategories: any[] =
    userDetails?.userProfile?.[0]?.userProfileBusinessType || [];
  const annualVolume = userDetails?.userProfile?.[0]?.annualPurchasingVolume;

  return (
    <div className="w-full overflow-hidden rounded-3xl border border-border bg-card shadow-lg">
      {/* Gradient hero banner */}
      <div className="relative h-28 w-full bg-gradient-to-r from-primary/20 via-info/15 to-primary/10 sm:h-36" />

      <div className="px-4 pb-6 sm:px-8 sm:pb-8">
        <div className="-mt-16 flex flex-col gap-6 sm:-mt-20 sm:flex-row sm:items-end">
          {/* Logo */}
          <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-2xl border-4 border-card bg-card shadow-md sm:h-40 sm:w-40">
            <Image
              src={userDetails?.profilePicture || "/images/no-image.jpg"}
              alt={companyName}
              fill
              sizes="160px"
              className="object-cover"
            />
          </div>

          {/* Name, badge, actions */}
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0" dir={langDir}>
              <div className="flex flex-wrap items-center gap-2">
                <h2
                  className="text-2xl font-bold leading-tight text-foreground sm:text-3xl"
                  translate="no"
                >
                  {companyName}
                </h2>
                {isVerified && (
                  <CheckCircle2 className="h-6 w-6 shrink-0 text-primary" />
                )}
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
                    isOnlineToday
                      ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
                      : "bg-muted text-muted-foreground",
                  )}
                  translate="no"
                >
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full",
                      isOnlineToday ? "bg-green-500" : "bg-muted-foreground/50",
                    )}
                  />
                  {isOnlineToday ? t("online") || "Online" : t("offline") || "Offline"}
                </span>
              </div>
              {userDetails?.uniqueId && (
                <p
                  className="mt-1 font-mono text-xs text-muted-foreground"
                  translate="no"
                >
                  {COMPANY_UNIQUE_ID}
                  {userDetails.uniqueId}
                </p>
              )}

              {/* Social icons */}
              {socialLinks.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {socialLinks.map((s) => {
                    const Icon =
                      SOCIAL_ICON[normalizeSocialType(s.type || (s as any).linkType)] ||
                      Globe;
                    return (
                      <a
                        key={s.id}
                        href={s.link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-primary hover:text-white"
                        aria-label={s.type || (s as any).linkType}
                      >
                        <Icon className="h-4 w-4" />
                      </a>
                    );
                  })}
                </div>
              )}
            </div>

            {branchCount > 0 && (
              <Link
                href="/profile"
                className="inline-flex items-center gap-2 self-start rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 sm:self-auto"
                dir={langDir}
                translate="no"
              >
                <Pencil className="h-4 w-4" />
                {t("edit")}
              </Link>
            )}
          </div>
        </div>

        {/* Quick-stat tiles */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <StatTile
            icon={MapPin}
            label={t("branches")}
            value={branchCount}
          />
          {productCount != null && (
            <StatTile
              icon={Package}
              label={t("products")}
              value={productCount}
            />
          )}
          {rating != null && (
            <StatTile
              icon={Star}
              label={t("rating") || "Rating"}
              value={Number(rating).toFixed(1)}
              accent="text-yellow-500"
            />
          )}
          {annualVolume && (
            <StatTile
              icon={Building2}
              label={t("annual_purchasing_volume")}
              value={`${currency.symbol}${Number(annualVolume).toLocaleString()}`}
            />
          )}
          {memberSince && !annualVolume && (
            <StatTile
              icon={Building2}
              label={t("member_since") || "Member since"}
              value={memberSince}
            />
          )}
        </div>

        {/* Categories / business types */}
        {(categories.length > 0 || tagCategories.length > 0) && (
          <div className="mt-6" dir={langDir}>
            <p
              className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              translate="no"
            >
              {t("business_type")}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {categories.map((item) => (
                <span
                  key={item?.id}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary"
                >
                  {item?.category?.name ||
                    item?.categoryDetail?.name ||
                    `Category ${item?.categoryId}`}
                </span>
              ))}
              {categories.length === 0 &&
                tagCategories.map((item) => (
                  <span
                    key={item?.id}
                    className="inline-flex items-center rounded-full bg-muted px-3 py-1.5 text-sm font-semibold text-foreground"
                  >
                    {item?.userProfileBusinessTypeTag?.tagName}
                  </span>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const StatTile = ({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<any>;
  label: string;
  value: string | number;
  accent?: string;
}) => (
  <div className="rounded-xl border border-border bg-muted/40 p-3 sm:p-4">
    <div className="flex items-center gap-2 text-muted-foreground">
      <Icon className={cn("h-4 w-4", accent)} />
      <span className="text-xs font-medium uppercase tracking-wide" translate="no">
        {label}
      </span>
    </div>
    <p className="mt-1 truncate text-lg font-bold text-foreground sm:text-xl">
      {value}
    </p>
  </div>
);

export default ProfileCard;
