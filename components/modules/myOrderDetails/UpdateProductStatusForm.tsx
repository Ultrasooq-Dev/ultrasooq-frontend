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
  shippingType?: string; // PICKUP, SELLERDROP, THIRDPARTY, PLATFORM
};

const createFormSchema = (t: any) => {
  return z
    .object({
      status: z
        .string()
        .trim()
        .min(2, { message: t("status_is_required") })
        .max(50),
      cancelReason: z.string().trim().optional(),
    })
    .superRefine(({ status, cancelReason }, ctx) => {
      if (status === "CANCELLED" && !cancelReason) {
        ctx.addIssue({
          code: "custom",
          message: t("cancel_reason_is_required"),
          path: ["cancelReason"],
        });
      }
    });
};

const UpdateProductStatusForm: React.FC<UpdateProductStatusFormProps> = ({
  orderProductId,
  onClose,
  orderProductStatus,
  orderProductDate,
  deliveryAfter,
  tradeRole,
  shippingType,
}) => {
  const t = useTranslations();
  const { langDir } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const form = useForm({
    resolver: zodResolver(createFormSchema(t)),
    defaultValues: {
      status: "",
    },
  });

  const updateProductStatusQuery = useUpdateProductStatus();
  const updateCancelReason = useUpdateCancelReason();

  const watchStatus = form.watch("status");

  const onSubmit = async (values: any) => {
    if (values.status === "") return;

    if (values.status === "DELIVERED" && tradeRole != 'BUYER') {
      // Skip deliveryAfter check for PICKUP orders (pickup can happen same day)
      if (shippingType !== 'PICKUP' && moment().diff(moment(orderProductDate), 'days') <= deliveryAfter) {
        toast({
          title: t("delivery_too_early"),
          description: t("delivery_too_early_description", { days: deliveryAfter }),
          variant: "danger",
        });
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
      // Buyer can confirm receipt (RECEIVED) when order is DELIVERED
      if (tradeRole == "BUYER") {
        if (orderProductStatus == "DELIVERED") {
          return STATUS_LIST.filter((item) => item.value == "RECEIVED");
        }
        return STATUS_LIST.filter((item) => item.value == "DELIVERED");
      }

      if (orderProductStatus == "CANCELLED" || orderProductStatus == "RECEIVED") {
        return [];
      }

      // PICKUP orders: skip SHIPPED and OFD (not applicable)
      if (shippingType === "PICKUP") {
        if (orderProductStatus == "CONFIRMED") {
          return STATUS_LIST.filter((item) => item.value == "CANCELLED");
          // Pickup completion happens via code verification, not manual status update
        }
        if (orderProductStatus == "DELIVERED") {
          return STATUS_LIST.filter((item) => item.value == "CANCELLED");
        }
        return STATUS_LIST.filter((item) => item.value == "CONFIRMED" || item.value == "CANCELLED");
      }

      if (orderProductStatus == "CONFIRMED") {
        return STATUS_LIST.filter((item) => item.value == "SHIPPED" || item.value == "CANCELLED");
      }

      if (orderProductStatus == "SHIPPED") {
        return STATUS_LIST.filter((item) => item.value == "OFD" || item.value == "CANCELLED");
      }

      if (orderProductStatus == "OFD") {
        if (shippingType !== 'PICKUP' && moment().diff(moment(orderProductDate), 'days') <= deliveryAfter) {
          return STATUS_LIST.filter((item) => item.value == "CANCELLED");
        }
        return STATUS_LIST.filter((item) => item.value == "DELIVERED" || item.value == "CANCELLED");
      }

      if (orderProductStatus == "DELIVERED") {
        return STATUS_LIST.filter((item) => item.value == "CANCELLED");
      }

      return STATUS_LIST.filter((item) => item.value == "CONFIRMED" || item.value == "CANCELLED");
    }, [orderProductStatus, shippingType],
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
                <option value="">{t("select_status")}</option>
                {(formattedStatusList || []).map((item) => (
                  <option
                    key={item.value}
                    value={item.value}
                  >
                    {t(item.label)}
                  </option>
                ))}
              </select>
            )}
          />
          <p className="text-[13px] text-destructive" dir={langDir}>
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
