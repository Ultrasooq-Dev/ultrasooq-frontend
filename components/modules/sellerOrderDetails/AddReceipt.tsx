import React, { useEffect, useMemo, useRef, useState } from "react";
import { Form } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { Controller, useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { useUploadFile } from "@/apis/queries/upload.queries";
import { useUpdateOrderShippingStatus } from "@/apis/queries/orders.queries";

type AddReceiptProps = {
    orderProductId: number;
    orderShippingId: number;
    onClose: () => void;
}

const formSchema = z.object({
    receipt: z.string().trim().optional(),
});

const AddReceipt: React.FC<AddReceiptProps> = ({
    orderProductId,
    orderShippingId,
    onClose
}) => {
    const t = useTranslations();
    const { langDir } = useAuth();
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            receipt: ""
        },
    });

    const [receipt, setReceipt] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const allowedFileTypes = ["image/png", "image/jpg", "image/jpeg", "application/pdf"];
    const allowedFileExtensions = ["png", "jpg", "jpeg", "pdf"];
    const upload = useUploadFile();

    const updateOrderShippingStatus = useUpdateOrderShippingStatus();

    const onCloseModal = () => {
        if (fileInputRef.current) fileInputRef.current.value = '';
        onClose();
    };

    const uploadReceipt = async () => {
        if (receipt) {
            const formData = new FormData();
            formData.append("content", receipt);
            const response = await upload.mutateAsync(formData);
            if (response.status && response.data) {
                return response.data;
            }
        }
        return null;
    };

    const onSubmit = async () => {
        let data = form.getValues();
        data.receipt = (await uploadReceipt()) || '';

        const response = await updateOrderShippingStatus?.mutateAsync({
            ...{ orderShippingId },
            ...data
        });

        if (response?.status) {
            toast({
                title: response.message,
                description: response.message,
                variant: "success"
            });

            queryClient.invalidateQueries({
                queryKey: ["order-by-seller-id", { orderProductId: String(orderProductId) }]
            });

            onCloseModal();

        } else {
            toast({
                title: response.message,
                description: response.message,
                variant: "danger"
            });
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <div className="modal-body">
                    <Input
                        type="file"
                        accept={allowedFileTypes.join(", ")}
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                                if (file.size > 5 * 1024 * 1024) {
                                    toast({
                                        description: "File size must be less than or equal to 5MB",
                                        variant: "danger",
                                    })
                                    if (fileInputRef?.current) fileInputRef.current.value = '';
                                    return;
                                }

                                if (!allowedFileTypes.includes(file.type)) {
                                    toast({
                                        description: "Allowed file types: " + allowedFileExtensions.join(", "),
                                        variant: "danger",
                                    });
                                    if (fileInputRef?.current) fileInputRef.current.value = '';
                                    return;
                                }

                                setReceipt(file);
                            } else {
                                setReceipt(null);
                            }
                        }}
                        ref={fileInputRef}
                    />
                </div>
                <div className="modal-footer">
                    <button 
                        type="submit" 
                        className="theme-primary-btn submit-btn" 
                        disabled={upload?.isPending || updateOrderShippingStatus?.isPending}
                        dir={langDir}
                        translate="no"
                    >
                        {upload?.isPending || updateOrderShippingStatus?.isPending ? t("processing") : t("save")}
                    </button>
                </div>
            </form>
        </Form>
    );
}

export default AddReceipt;