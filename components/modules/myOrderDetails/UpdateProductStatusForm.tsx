import React, { useEffect, useMemo } from "react";
// import ControlledSelectInput from "@/components/shared/Forms/ControlledSelectInput";
import { Form } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Controller, useForm } from "react-hook-form";
import {
  useUpdateCancelReason,
  useUpdateProductStatus,
} from "@/apis/queries/orders.queries";
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { STATUS_LIST } from "@/utils/constants";
import ControlledTextareaInput from "@/components/shared/Forms/ControlledTextareaInput";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import moment from "moment";

type UpdateProductStatusFormProps = {
  orderProductId: string;
  onClose: () => void;
  orderProductStatus?: string;
  orderProductDate: string;
  deliveryAfter: number;
  tradeRole?: string;
};

const formSchema = z
  .object({
    status: z
      .string()
      .trim()
      .min(2, { message: "Status is required" })
      .max(50, { message: "Status must be less than 50 characters" }),
    cancelReason: z.string().trim().optional(),
  })
  .superRefine(({ status, cancelReason }, ctx) => {
    if (status === "CANCELLED" && !cancelReason) {
      ctx.addIssue({
        code: "custom",
        message: "Cancel Reason is required",
        path: ["cancelReason"],
      });
    }
  });

const UpdateProductStatusForm: React.FC<UpdateProductStatusFormProps> = ({
  orderProductId,
  onClose,
  orderProductStatus,
  orderProductDate,
  deliveryAfter,
  tradeRole
}) => {
  const t = useTranslations();
  const { langDir } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: "",
    },
  });

  const updateProductStatusQuery = useUpdateProductStatus();
  const updateCancelReason = useUpdateCancelReason();

  const watchStatus = form.watch("status");

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (values.status === "") return;

    if (values.status === "DELIVERED" && tradeRole != 'BUYER') {
      if (moment().diff(moment(orderProductDate), 'days') <= deliveryAfter) {
        return;
      }
    }

    const updatedData = {
      orderProductId: Number(orderProductId),
      status: values.status,
    };
    const response = await updateProductStatusQuery.mutateAsync(updatedData, {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["order-by-seller-id", { orderProductId }],
        });
        queryClient.invalidateQueries({
          queryKey: ["order-by-id", { orderProductId }],
        });
      },
    });

    if (response.status) {
      toast({
        title: t("status_update_successful"),
        description: response.message,
        variant: "success",
      });
      if (values.status !== "CANCELLED") {
        form.reset();
        onClose();
      }
    } else {
      toast({
        title: t("status_update_failed"),
        description: response.message,
        variant: "danger",
      });
    }

    if (values.status === "CANCELLED") {
      const response = await updateCancelReason.mutateAsync(
        {
          orderProductId: Number(orderProductId),
          cancelReason: values.cancelReason ? values.cancelReason : "",
        },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({
              queryKey: ["order-by-seller-id", { orderProductId }],
            });
          },
        },
      );

      if (response.status) {
        toast({
          title: t("cancel_reason_updated"),
          description: t("cancelled_successfully"),
          variant: "success",
        });
        form.reset();
        onClose();
      } else {
        toast({
          title: t("cancel_reason_update_failed"),
          description: t("cancelation_failed"),
          variant: "danger",
        });
      }
    }
  };

  const formattedStatusList = useMemo(
    () => {
      if (tradeRole == "BUYER") {
        return STATUS_LIST.filter((item) => item.value == "DELIVERED");
      }

      if (orderProductStatus == "CANCELLED") {
        return [];
      }

      if (orderProductStatus == "CONFIRMED") {
        return STATUS_LIST.filter((item) => item.value == "SHIPPED" || item.value == "CANCELLED");
      }

      if (orderProductStatus == "SHIPPED") {
        return STATUS_LIST.filter((item) => item.value == "OFD" || item.value == "CANCELLED");
      }

      if (orderProductStatus == "OFD") {
        if (moment().diff(moment(orderProductDate), 'days') <= deliveryAfter) {
          return STATUS_LIST.filter((item) => item.value == "CANCELLED");
        }
        return STATUS_LIST.filter((item) => item.value == "DELIVERED" || item.value == "CANCELLED");
      }

      if (orderProductStatus == "DELIVERED") {
        return STATUS_LIST.filter((item) => item.value == "CANCELLED");
      }

      return STATUS_LIST.filter((item) => item.value == "CONFIRMED" || item.value == "CANCELLED");
    }, [orderProductStatus],
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="modal-body">
          {/* <ControlledSelectInput
            label="Status"
            name="status"
            options={STATUS_LIST}
          /> */}
          <Controller
            name="status"
            control={form.control}
            render={({ field }) => (
              <select
                {...field}
                className="custom-form-control-s1 select1"
                name="status"
              >
                <option value="">Select Status</option>
                {(formattedStatusList || []).map((item) => (
                  <option
                    key={item.value}
                    value={item.value}
                  >
                    {item.label}
                  </option>
                ))}
              </select>
            )}
          />
          <p className="text-[13px] text-red-500" dir={langDir}>
            {form.formState.errors.status?.message}
          </p>
          <div className="mb-4"></div>
          {watchStatus === "CANCELLED" ? (
            <ControlledTextareaInput
              label="Cancel Reason"
              name="cancelReason"
            />
          ) : null}
        </div>
        <div className="modal-footer">
          <button 
            type="submit" 
            className="theme-primary-btn submit-btn" 
            disabled={updateProductStatusQuery?.isPending || updateCancelReason?.isPending}
            dir={langDir} 
            translate="no"
          >
            {t("save")}
          </button>
        </div>
      </form>
    </Form>
  );
};

export default UpdateProductStatusForm;
