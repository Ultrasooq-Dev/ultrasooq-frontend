"use client"; // Add this at the top
import React, { useMemo, useRef, useState, useEffect } from "react";
import Pagination from "@/components/shared/Pagination";
import { useCreateShareLink, useSellerRewards } from "@/apis/queries/seller-reward.queries";
import PlaceholderImage from "@/public/images/product-placeholder.png";
import { toast } from "@/components/ui/use-toast";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import CreateSellerRewardForm from "@/components/modules/productDetails/CreateSellerRewardForm";
import { Info } from "lucide-react";
import Link from "next/link";
import { PERMISSION_SELLER_REWARDS, checkPermission } from "@/helpers/permission";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";

const SellerRewardsPage = () => {
    const t = useTranslations();
    const { langDir } = useAuth();
    const router = useRouter();
    const hasPermission = checkPermission(PERMISSION_SELLER_REWARDS);
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [isSellerRewardFormModalOpen, setIsSellerRewardFormModalOpen] = useState<boolean>(false);

    const wrapperRef = useRef(null);

    const sellerRewardsQuery = useSellerRewards({
        page: page,
        limit: limit,
        sortType: "desc"
    }, hasPermission);

    const sellerRewards = useMemo(() => {
        return sellerRewardsQuery?.data?.data || [];
    }, [
        sellerRewardsQuery?.data?.data,
        page,
        limit,
    ]);

    const handleSellerRewardFormModal = () => setIsSellerRewardFormModalOpen(!isSellerRewardFormModalOpen);

    useEffect(() => {
        if (!hasPermission) router.push("/home");
    }, []);

    if (!hasPermission) return <div></div>;

    return (
        <section className="team_members_section">
            <div className="container relative z-10 m-auto px-3">
                <div className="flex w-full flex-wrap">
                    <div className="team_members_heading w-full" dir={langDir}>
                        <h1 translate="no">{t("seller_rewards")}</h1>
                        <div className="flex justify-end gap-3">
                            <button type="button" onClick={() => setIsSellerRewardFormModalOpen(true)} translate="no">
                                {t("create_seller_reward")}
                            </button>
                        </div>
                    </div>
                    
                    <div className="team_members_table w-full">
                        {!sellerRewardsQuery?.isLoading && sellerRewards.length ? (
                            <>
                                <table cellPadding={0} cellSpacing={0} border={0}>
                                    <thead>
                                        <tr>
                                            <th translate="no">{t("product")}</th>
                                            <th translate="no">{t("start_time")}</th>
                                            <th translate="no">{t("end_time")}</th>
                                            <th translate="no">{t("reward_amount")}</th>
                                            <th translate="no">{t("reward_percentage")}</th>
                                            <th translate="no">{t("minimum_order")}</th>
                                            <th translate="no">{t("stock")}</th>
                                            <th translate="no">{t("action")}</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {sellerRewards?.filter((item: any) => item.productDetail).map((item: any) => {

                                            const image = item.productDetail?.productImages?.[0]?.image || PlaceholderImage;
                                            return (
                                                <tr key={item.id}>
                                                    <td>
                                                        {item?.productDetail?.productName}
                                                    </td>
                                                    <td>{item.startTime}</td>
                                                    <td>{item.endTime}</td>
                                                    <td>{item.rewardFixAmount}</td>
                                                    <td>{item.rewardPercentage}</td>
                                                    <td>{item.minimumOrder}</td>
                                                    <td>{item.stock}</td>
                                                    <td>
                                                        <Link
                                                            href={`/seller-rewards/${item.id}`}
                                                        >
                                                            <Info
                                                                className="h-4 w-4 cursor-pointer text-muted-foreground"
                                                            />
                                                        </Link>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </>
                        ) : null}

                        {!sellerRewardsQuery?.isLoading && !sellerRewards.length ? (
                            <p className="py-10 text-center text-sm font-medium" dir={langDir} translate="no">
                                {t("no_data_found")}
                            </p>
                        ) : null}

                        {sellerRewardsQuery.data?.totalCount > limit ? (
                            <Pagination
                                page={page}
                                setPage={setPage}
                                totalCount={sellerRewardsQuery.data?.totalCount}
                                limit={limit}
                            />
                        ) : null}
                    </div>
                </div>
            </div>
            <Dialog open={isSellerRewardFormModalOpen} onOpenChange={handleSellerRewardFormModal}>
                <DialogContent
                    className="add-new-address-modal add_member_modal gap-0 p-0 md:max-w-2xl!"
                    ref={wrapperRef}
                >
                    <CreateSellerRewardForm
                        onClose={handleSellerRewardFormModal}
                    />
                </DialogContent>
            </Dialog>
        </section>
    );
};

export default SellerRewardsPage;