"use client"; // Add this at the top
import React, { useEffect, useMemo, useState } from "react";
import { useShareLinksBySellerReward } from "@/apis/queries/seller-reward.queries";
import Pagination from "@/components/shared/Pagination";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PERMISSION_SELLER_REWARDS, checkPermission } from "@/helpers/permission";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";

const SellerRewardDetailPage = () => {
    const t = useTranslations();
    const { langDir } = useAuth();
    const router = useRouter();
    const hasPermission = checkPermission(PERMISSION_SELLER_REWARDS);
    const searchParams = useParams();
    const [page, setPage] = useState<number>(1);
    const [limit] = useState<number>(10);

    const sharedLinksBySellerRewardQuery = useShareLinksBySellerReward({
        page: page,
        limit: limit,
        sellerRewardId: searchParams?.id ? (searchParams.id as string) : "",
        sortType: "desc"
    }, hasPermission);

    const sharedLinks = useMemo(() => {
        return (sharedLinksBySellerRewardQuery?.data?.data || []).map((link: any) => {
            link.userName = '---';
            if (link.linkGeneratedByDetail) {
                link.userName = `${link?.linkGeneratedByDetail?.firstName} ${link?.linkGeneratedByDetail?.lastName}`;
            }
            return link;
        });
    }, [
        sharedLinksBySellerRewardQuery?.data?.data,
        page,
        limit
    ]);

    useEffect(() => {
        if (!hasPermission) router.push("/home");
    });

    if (!hasPermission) return <div></div>;

    return (
        <section className="team_members_section">
            <div className="container relative z-10 m-auto px-3">
                <div className="flex w-full flex-wrap">
                    <div className="team_members_heading w-full">
                        <h1 dir={langDir} translate="no">{t("share_links")}</h1>
                        <div className="flex justify-end gap-3">
                            <Link
                                href={"/seller-rewards"}
                                className="flex items-center rounded-md border-0 bg-dark-orange px-3 py-2 text-sm font-medium capitalize leading-6 text-white"
                                dir={langDir}
                                translate="no"
                            >
                                {t("back")}
                            </Link>
                        </div>
                    </div>

                    <div className="team_members_table w-full">
                        {!sharedLinksBySellerRewardQuery?.isLoading && sharedLinks.length ? (
                            <>
                                <table cellPadding={0} cellSpacing={0} border={0}>
                                    <thead>
                                        <tr>
                                            <th dir={langDir} translate="no">{t("name")}</th>
                                            <th dir={langDir} translate="no">{t("phone_number")}</th>
                                            <th dir={langDir} translate="no">{t("total_sell")}</th>
                                            <th dir={langDir} translate="no">{t("orders_placed")}</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {sharedLinks?.map((item: any) => {
                                            return (
                                                <tr key={item.id}>
                                                    <td>{item.userName}</td>
                                                    <td>{item?.linkGeneratedByDetail?.phoneNumber}</td>
                                                    <td>{item.myTotalSell || 0}</td>
                                                    <td>{item.ordersPlaced || 0}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </>
                        ) : null}

                        {!sharedLinksBySellerRewardQuery?.isLoading && !sharedLinks.length ? (
                            <p className="py-10 text-center text-sm font-medium" dir={langDir} translate="no">
                                {t("no_data_found")}
                            </p>
                        ) : null}

                        {sharedLinksBySellerRewardQuery.data?.totalCount > limit ? (
                            <Pagination
                                page={page}
                                setPage={setPage}
                                totalCount={sharedLinksBySellerRewardQuery.data?.totalCount}
                                limit={limit}
                            />
                        ) : null}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default SellerRewardDetailPage;