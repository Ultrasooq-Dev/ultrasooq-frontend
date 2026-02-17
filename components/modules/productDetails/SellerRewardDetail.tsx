import React, { useEffect, useMemo, useRef, useState } from "react";
import { DialogTitle } from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { IoCloseSharp } from "react-icons/io5";
import { Input } from "@/components/ui/input";
import { useCreateShareLink } from "@/apis/queries/seller-reward.queries";
import { toast } from "@/components/ui/use-toast";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { convertDateTime } from "@/utils/helper";

type SellerRewardDetailProps = {
    reward: { [key: string]: string };
    onClose: () => void;
};

const SellerRewardDetail: React.FC<SellerRewardDetailProps> = ({ reward, onClose }) => {
    const t = useTranslations();
    const { langDir } = useAuth();
    const createShareLink = useCreateShareLink();

    const generateShareLink = async () => {
        const response = await createShareLink.mutateAsync({
            sellerRewardId: Number(reward.id),
        });

        if (response.status) {
            onClose();
            toast({
                title: t("share_link_create_success"),
                description: response.message,
                variant: "success",
            });
        } else {
            toast({
                title: t("share_link_create_failed"),
                description: response.message,
                variant: "danger",
            });
        }
    };
    return (
        <>
            <div className="modal-header justify-between!">
                <DialogTitle className="text-center text-xl font-bold" dir={langDir} translate="no">
                    {t("seller_reward")}
                </DialogTitle>
                <Button
                    onClick={onClose}
                    className="absolute right-2 top-2 z-10 bg-white! text-black! shadow-none"
                >
                    <IoCloseSharp size={20} />
                </Button>
            </div>
            <div className="card-item card-payment-form px-5 pb-5">
                <label className="text-sm font-medium leading-none text-color-dark" dir={langDir} translate="no">
                    {t("start_time")}
                </label>
                <Input
                    value={convertDateTime(reward.startTime)}
                    disabled={true}
                />

                <label className="text-sm font-medium leading-none text-color-dark" dir={langDir} translate="no">
                    {t("end_time")}
                </label>
                <Input
                    value={convertDateTime(reward.endTime)}
                    disabled={true}
                />

                <label className="text-sm font-medium leading-none text-color-dark" dir={langDir} translate="no">
                    {t("reward_percentage")}
                </label>
                <Input
                    value={reward.rewardPercentage}
                    disabled={true}
                />

                <label className="text-sm font-medium leading-none text-color-dark" dir={langDir} translate="no">
                    {t("reward_fix_amount")}
                </label>
                <Input
                    value={reward.rewardFixAmount}
                    disabled={true}
                />

                <label className="text-sm font-medium leading-none text-color-dark" dir={langDir} translate="no">
                    {t("minimum_order")}
                </label>
                <Input
                    value={reward.minimumOrder}
                    disabled={true}
                />

                <label className="text-sm font-medium leading-none text-color-dark" dir={langDir} translate="no">
                    {t("stock")}
                </label>
                <Input
                    value={reward.stock}
                    disabled={true}
                />

                <Button
                    type="button"
                    disabled={createShareLink?.isPending}
                    className="theme-primary-btn mt-2 h-12 w-full rounded bg-dark-orange text-center text-lg font-bold leading-6"
                    onClick={generateShareLink}
                    dir={langDir}
                    translate="no"
                >
                    {!createShareLink?.isPending ? t("generate_link") : t("processing")}
                </Button>
            </div>
        </>
    );
};

export default SellerRewardDetail;

