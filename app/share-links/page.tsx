"use client"; // Add this at the top
import React, { useEffect, useMemo, useRef, useState } from "react";
import Pagination from "@/components/shared/Pagination";
import { useShareLinks } from "@/apis/queries/seller-reward.queries";
import { toast } from "@/components/ui/use-toast";
import { PERMISSION_SHARE_LINKS, checkPermission } from "@/helpers/permission";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";

const ShareLinksPage = () => {
    const t = useTranslations();
    const { langDir } = useAuth();
    const router = useRouter();
    const hasPermission = checkPermission(PERMISSION_SHARE_LINKS);
    const [page, setPage] = useState(1);
    const [limit] = useState(10);

    const shareLinksQuery = useShareLinks({
        page: page,
        limit: limit,
        sortType: "desc"
    }, hasPermission);

    const shareLinks = useMemo(() => {
        return shareLinksQuery?.data?.data || [];
    }, [
        shareLinksQuery?.data?.data,
        page,
        limit,
    ]);

    const copyShareLink = (id: number, productId: number) => {
        // navigator.clipboard.writeText();
        var textField = document.createElement('textarea')
        textField.innerText = `${location.origin}/trending/${productId}?sharedLinkId=${id}`;
        document.body.appendChild(textField);
        textField.select()
        document.execCommand('copy')
        textField.remove()
        toast({
            title: t("copied"),
            description: '',
            variant: "success",
        });
    };

    useEffect(() => {
        if (!hasPermission) router.push("/home");
    }, []);
    
    if (!hasPermission) return <div></div>;

    return (
        <section className="team_members_section">
            <div className="container relative z-10 m-auto px-3">
                <div className="flex w-full flex-wrap">
                    <div className="team_members_heading w-full" dir={langDir}>
                        <h1 translate="no">{t("share_links")}</h1>
                    </div>
                    <div className="team_members_table w-full">
                        {!shareLinksQuery?.isLoading && shareLinks.length ? (
                            <>
                                <table cellPadding={0} cellSpacing={0} border={0}>
                                    <thead>
                                        <tr>
                                            <th dir={langDir} translate="no">{t("product")}</th>
                                            <th></th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {shareLinks?.filter((item: any) => item.productDetail).map((item: any) => {
                                            return (
                                                <tr key={item.id}>
                                                    <td>
                                                        {item?.productDetail?.productName}
                                                    </td>
                                                    <td>
                                                        <button type="button" onClick={() => copyShareLink(item.id, item.productId)} dir={langDir} translate="no">
                                                            {t("copy_share_link")}
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </>
                        ) : null}

                        {!shareLinksQuery?.isLoading && !shareLinks.length ? (
                            <p className="py-10 text-center text-sm font-medium" dir={langDir} translate="no">
                                {t("no_data_found")}
                            </p>
                        ) : null}

                        {shareLinksQuery.data?.totalCount > limit ? (
                            <Pagination
                                page={page}
                                setPage={setPage}
                                totalCount={shareLinksQuery.data?.totalCount}
                                limit={limit}
                            />
                        ) : null}
                    </div>
                </div>
            </div>
        </section>
    );
}

export default ShareLinksPage;