import React, { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { IoCloseSharp } from "react-icons/io5";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import ControlledTextInput from "@/components/shared/Forms/ControlledTextInput";
import { Form } from "@/components/ui/form";
import ControlledTextareaInput from "@/components/shared/Forms/ControlledTextareaInput";
import { useSubmitQuery } from "@/apis/queries/help-center.queries";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useMe } from "@/apis/queries/user.queries";
import { useTranslations } from "next-intl";

type QueryFormProps = {
    onClose: () => void;
};

const queryFormSchema = (t: any) => {
    return z.object({
        email: z.string()
            .trim()
            .min(2, { message: t("email_is_required") })
            .email({ message: t("invalid_email_address") }),
    
        query: z.string()
            .trim()
            .min(5, { message: t("query_is_required") }),
    })
};

const QueryForm: React.FC<QueryFormProps> = ({ onClose }) => {
    const t = useTranslations();
    const { langDir } = useAuth();

    const form = useForm({
        resolver: zodResolver(queryFormSchema(t)),
        defaultValues: { email: '', query: '' },
    });

    const me = useMe();

    const submitQuery = useSubmitQuery();

    const onSubmit = async (formData: any) => {
        if (me?.data?.data?.id) {
            if (formData.email != me?.data?.data?.email) {
                toast({
                    title: t("email_mismatch"),
                    description: t("email_must_be_equal_to_", { email: me?.data?.data?.email }),
                    variant: "danger"
                });
                return;
            }

            formData.userId = me?.data?.data?.id;
        }
        const response = await submitQuery.mutateAsync(formData);

        if (response.status) {
            onClose();
            form.reset();
            toast({
                title: t("query_submit_successful"),
                description: response.message,
                variant: "success",
            });
        } else {
            toast({
                title: t("query_submit_failed"),
                description: response.message,
                variant: "danger",
            });
        }
    };

    useEffect(() => {
        if (me?.data?.data?.email) form.setValue('email', me?.data?.data?.email);
    }, [me?.data?.data?.id])

    return (
        <>
            <div className="modal-header justify-between!" dir={langDir}>
                <DialogTitle className="text-center text-xl font-bold" dir={langDir} translate="no">
                    {t("submit_your_query")}
                </DialogTitle>
                <Button
                    onClick={onClose}
                    className={`${langDir == 'ltr' ? 'absolute' : ''} right-2 top-2 z-10 bg-card! text-foreground! shadow-none`}
                >
                    <IoCloseSharp size={20} />
                </Button>
            </div>

            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="card-item card-payment-form px-5 pb-5 pt-3"
                >
                    <div dir={langDir}>
                        <label className="text-sm font-medium leading-none text-color-dark" translate="no">
                            {t("email")}
                        </label>
                    </div>
                    <ControlledTextInput
                        label={t("email")}
                        name="email"
                        placeholder={t("enter_email")}
                        type="email"
                        disabled={!!me?.data?.data?.id}
                        dir={langDir}
                        translate="no"
                    />

                    <ControlledTextareaInput
                        label={t("query")}
                        name="query"
                        placeholder={t("enter_your_query")}
                        dir={langDir}
                        translate="no"
                    />

                    <Button
                        type="submit"
                        className="theme-primary-btn mt-2 h-12 w-full rounded bg-dark-orange text-center text-lg font-bold leading-6"
                        disabled={submitQuery?.isPending}
                        dir={langDir}
                        translate="no"
                    >
                        {submitQuery?.isPending ? t("processing") : t("submit")}
                    </Button>
                </form>
            </Form>
        </>
    );
};

export default QueryForm;