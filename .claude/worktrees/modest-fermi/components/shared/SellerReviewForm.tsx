import React from "react";
import { DialogHeader, DialogTitle } from "../ui/dialog";
import { Form } from "../ui/form";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "../ui/button";
import ControlledTextInput from "./Forms/ControlledTextInput";
import {
  useAddSellerReview,
  useSellerReviewById,
  useUpdateSellerReview,
} from "@/apis/queries/review.queries";
import ControlledTextareaInput from "./Forms/ControlledTextareaInput";
import Ratings from "./Ratings";
import { useToast } from "../ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import LoaderWithMessage from "./LoaderWithMessage";
import { useTranslations } from "next-intl";

type ReviewFormProps = {
  onClose: () => void;
  reviewId?: number;
  productPriceId?: number;
  adminId?: number;
  productId?: number;
};

const formSchema = (t: any) => {
  return z.object({
    description: z
      .string()
      .trim()
      .min(2, {
        message: t("description_required"),
      })
      .max(100, {
        message: t("description_must_be_less_than_n_chars", { n: 100 }),
      }),
    title: z.string()
      .trim()
      .min(2, { message: t("title_required") })
      .max(50, {
        message: t("title_must_be_less_than_n_chars", { n: 50 }),
      }),
    rating: z.number(),
  });
};

const SellerReviewForm: React.FC<ReviewFormProps> = ({
  onClose,
  reviewId,
  productPriceId,
  adminId,
  productId,
}) => {
  const t = useTranslations();
  const searchParams = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const form = useForm({
    resolver: zodResolver(formSchema(t)),
    defaultValues: {
      description: "",
      title: "",
      rating: 0,
    },
  });

  const addReview = useAddSellerReview();
  const updateReview = useUpdateSellerReview();

  const onSubmit = async (formData: any) => {
    const updatedFormData = {
      ...formData,
      productPriceId,
      adminId,
      productId,
    };

    const response = await addReview.mutateAsync(updatedFormData, {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["product-by-id", searchParams?.id],
        });
        queryClient.refetchQueries({
          queryKey: ["existing-products", { page: 1, limit: 40 }],
        });
      },
    });

    if (response.status) {
      toast({
        title: t("review_add_successful"),
        description: response.message,
        variant: "success",
      });
      form.reset();
      onClose();
    } else {
      toast({
        title: t("review_add_failed"),
        description: response.message,
        variant: "danger",
      });
    }
    // }
  };

  return (
    <div>
      <DialogHeader>
        <DialogTitle className="text-center text-xl font-semibold">
          Give your Ratings and Reviews
        </DialogTitle>
      </DialogHeader>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="card-item card-payment-form pt-3"
        >
          <div className="mb-5 space-y-2">
            <p>Rate this product</p>

            <Controller
              name="rating"
              control={form.control}
              render={({ field }) => (
                <Ratings
                  rating={field.value}
                  onRatingChange={(rating) => {
                    field.onChange(rating);
                  }}
                />
              )}
            />
          </div>

          <p className="mb-3">Review this product</p>

          <ControlledTextareaInput
            label="Description"
            name="description"
            placeholder="Description"
            rows={6}
          />

          <ControlledTextInput
            label="Title"
            name="title"
            placeholder="Review Title"
          />

          <Button
            disabled={addReview.isPending}
            type="submit"
            className="theme-primary-btn h-12 w-full rounded bg-dark-orange text-center text-lg font-bold leading-6"
          >
            {addReview.isPending ? (
              <LoaderWithMessage message="Please wait" />
            ) : (
              "Submit"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default SellerReviewForm;
