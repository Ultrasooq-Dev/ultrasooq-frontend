import React, { useEffect, useMemo, useRef, useState } from "react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { IoCloseSharp } from "react-icons/io5";
import ControlledTextInput from "@/components/shared/Forms/ControlledTextInput";
import { Controller, useForm, useFormContext } from "react-hook-form";
import { date, z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast, useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/plate-ui/input";
import { useAddSellerReward } from "@/apis/queries/seller-reward.queries";
import { useMe } from "@/apis/queries/user.queries";
import { useAllManagedProducts } from "@/apis/queries/product.queries";
import ControlledSelectInput from "@/components/shared/Forms/ControlledSelectInput";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import ControlledDatePicker from "@/components/shared/Forms/ControlledDatePicker";
import ControlledTimePicker from "@/components/shared/Forms/ControlledTimePicker";

const addFormSchema = (t: any) => {
    return z.object({
        productId: z.string().min(1, t("product_required")),
        startDate: z.date({ required_error: t("start_date_required") }),
        startTime: z.string().min(2, { message: t("start_time_required") }),
        endDate: z.date({ required_error: t("end_date_required") }),
        endTime: z.string().min(2, { message: t("end_time_required") }),
        rewardPercentage: z.coerce.number().min(1, { message: t("minimum_value_must_be_n", { n: 1 }) }),
        rewardFixAmount: z.coerce.number().min(1, { message: t("minimum_value_must_be_n", { n: 1 }) }),
        minimumOrder: z.coerce.number().min(1, { message: t("minimum_order_must_be_n", { n: 1 }) }),
        stock: z.coerce.number().min(1, { message: t("minimum_stock_must_be_n", { n: 1 }) })
    });
};

type CreateSellerRewardFormProps = {
    onClose: () => void;
};

const CreateSellerRewardForm: React.FC<CreateSellerRewardFormProps> = ({ onClose }) => {

    const t = useTranslations();
    const { langDir } = useAuth();

    const me = useMe();

    // Default values based on whether editing or adding a new member
    const addDefaultValues = {
        productId: "",
        startDate: undefined as unknown as Date,
        startTime: "",
        endDate: undefined as unknown as Date,
        endTime: "",
        rewardPercentage: 1,
        rewardFixAmount: 1,
        minimumOrder: 1,
        stock: 1
    };

    const form = useForm({
        resolver: zodResolver(addFormSchema(t)),
        defaultValues: addDefaultValues,
    });

    const addSellerReward = useAddSellerReward();

    const [products, setProducts] = useState<any[]>([]);

    const productsQuery = useAllManagedProducts(
        {
            page: 1,
            limit: 50,
            selectedAdminId: me?.data?.data?.tradeRole == 'MEMBER' ? me?.data?.data?.addedBy : undefined
        },
        true,
    );

    useEffect(() => {
        setProducts((productsQuery?.data?.data || []).filter((item: any) => {
            return item?.productPrice_product?.id;
        }));
    }, [productsQuery?.data?.data]);

    const onSubmit = async (values: typeof addDefaultValues) => {
        let startDateTime = values.startDate;
        let endDateTime = values.endDate;

        if (startDateTime.getTime() > endDateTime.getTime()) {
            toast({
                title: t("datetime_error"),
                description: t("start_date_cant_be_greater_than_end_date"),
                variant: "danger",
            });
            return;
        }

        if (startDateTime.getTime() == endDateTime.getTime() && values.startTime >= values.endTime) {
            toast({
                title: t("datetime_error"),
                description: t("start_time_must_be_less_than_end_time"),
                variant: "danger",
            });
            return;
        }

        let startTime = values.startTime.split(':');
        startDateTime.setHours(Number(startTime[0]));
        startDateTime.setMinutes(Number(startTime[1]));

        let endTime = values.endTime.split(':');
        endDateTime.setHours(Number(endTime[0]));
        endDateTime.setMinutes(Number(endTime[1]));

        if (startDateTime.getTime() < new Date().getTime()) {
            toast({
                title: t("datetime_error"),
                description: t("start_datetime_cant_be_in_past"),
                variant: "danger",
            });
            return;
        }

        const response = await addSellerReward.mutateAsync({
            productId: Number(values.productId),
            startTime: startDateTime.toISOString(),
            endTime: endDateTime.toISOString(),
            rewardPercentage: values.rewardPercentage,
            rewardFixAmount: values.rewardFixAmount,
            minimumOrder: values.minimumOrder,
            stock: values.stock
        });

        if (response.status) {
            toast({
                title: t("seller_reward_add_successful"),
                description: response.message,
                variant: "success",
            });

            form.reset();
            onClose();
        } else {
            toast({
                title: t("seller_reward_add_failed"),
                description: response.message,
                variant: "danger",
            });
        }
    };

    return (
        <>
            <div className="modal-header justify-between!">
                <DialogTitle className="text-center text-xl font-bold" dir={langDir} translate="no">
                    {t("create_seller_reward")}
                </DialogTitle>
                <Button
                    onClick={onClose}
                    className="absolute right-2 top-2 z-10 bg-card! text-foreground! shadow-none"
                >
                    <IoCloseSharp size={20} />
                </Button>
            </div>

            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="card-item card-payment-form px-5 pb-5"
                >
                    <ControlledSelectInput
                      label={t("product")}
                      name="productId"
                      options={products.map((item: any) => ({
                        value: item.productId?.toString(),
                        label: item.productPrice_product?.productName,
                      }))}
                    />
                    
                    <ControlledDatePicker
                        label={t("start_date")}
                        name="startDate"
                        isFuture
                    />

                    <ControlledTimePicker
                        label={t("start_time")}
                        name="startTime"
                    />

                    <ControlledDatePicker
                        label={t("end_date")}
                        name="endDate"
                        isFuture
                    />

                    <ControlledTimePicker
                        label={t("end_time")}
                        name="endTime"
                    />

                    <FormField
                        control={form.control}
                        name="rewardPercentage"
                        render={({ field }) => (
                            <FormItem dir={langDir}>
                                <FormLabel translate="no">{t("reward_percentage")}</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        className="h-[48px]! rounded border-border focus-visible:ring-0!"
                                        {...field}
                                        dir={langDir}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="rewardFixAmount"
                        render={({ field }) => (
                            <FormItem dir={langDir}>
                                <FormLabel translate="no">{t("reward_fix_amount")}</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        className="h-[48px]! rounded border-border focus-visible:ring-0!"
                                        {...field}
                                        dir={langDir}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="minimumOrder"
                        render={({ field }) => (
                            <FormItem dir={langDir}>
                                <FormLabel translate="no">{t("minimum_order")}</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        className="h-[48px]! rounded border-border focus-visible:ring-0!"
                                        {...field}
                                        dir={langDir}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="stock"
                        render={({ field }) => (
                            <FormItem dir={langDir}>
                                <FormLabel translate="no">{t("stock")}</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        className="h-[48px]! rounded border-border focus-visible:ring-0!"
                                        {...field}
                                        dir={langDir}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <Button
                        type="submit"
                        disabled={addSellerReward?.isPending}
                        className="theme-primary-btn mt-2 h-12 w-full rounded bg-dark-orange text-center text-lg font-bold leading-6"
                        translate="no"
                    >
                        {!addSellerReward?.isPending ? t("create_reward") : t("processing")}
                    </Button>
                </form>
            </Form>
        </>
    );
}

export default CreateSellerRewardForm;