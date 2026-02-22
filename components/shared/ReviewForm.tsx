import React, { useEffect, useState } from "react";
import { DialogHeader, DialogTitle } from "../ui/dialog";
import { Form } from "../ui/form";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "../ui/button";
import Image from "next/image";
import ControlledTextInput from "./Forms/ControlledTextInput";
import {
  useAddReview,
  useReviewById,
  useUpdateReview,
} from "@/apis/queries/review.queries";
import ControlledTextareaInput from "./Forms/ControlledTextareaInput";
import Ratings from "./Ratings";
import { useToast } from "../ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

type ReviewFormProps = {
  onClose: () => void;
  reviewId?: number;
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

const ReviewForm: React.FC<ReviewFormProps> = ({ onClose, reviewId }) => {
  const t = useTranslations();
  const searchParams = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const defaultValues = {
    description: "",
    title: "",
    rating: 0,
  };
  const form = useForm({
    resolver: zodResolver(formSchema(t)),
    defaultValues: defaultValues,
  });
  const reviewByIdQuery = useReviewById(
    { productReviewId: reviewId ? reviewId : 0 },
    !!reviewId,
  );
  const addReview = useAddReview();
  const updateReview = useUpdateReview();

  const onSubmit = async (formData: typeof defaultValues) => {
    const updatedFormData = {
      ...formData,
      productId: Number(searchParams?.id),
    };

    // return;

    if (reviewId) {
      const response = await updateReview.mutateAsync(
        {
          productReviewId: reviewId,
          ...updatedFormData,
        },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({
              queryKey: ["product-by-id", searchParams?.id],
            });
            queryClient.refetchQueries({
              queryKey: ["existing-products", { page: 1, limit: 40 }],
            });
            queryClient.refetchQueries({
              queryKey: ["review-by-id", { productReviewId: reviewId }],
            });
            queryClient.refetchQueries({
              queryKey: ["reviews"],
            });
          },
        },
      );
      if (response.status) {
        toast({
          title: t("review_update_successful"),
          description: response.message,
          variant: "success",
        });
        form.reset();
        onClose();
      } else {
        toast({
          title: t("review_update_failed"),
          description: response.message,
          variant: "danger",
        });
      }
    } else {
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
    }
  };

  useEffect(() => {
    if (reviewByIdQuery?.data?.data) {
      form.reset({
        description: reviewByIdQuery?.data?.data?.description,
        title: reviewByIdQuery?.data?.data?.title,
        rating: reviewByIdQuery?.data?.data?.rating,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewId, reviewByIdQuery?.data?.data]);

  return (
    <div className="w-full">
      <DialogHeader className="pb-6">
        <DialogTitle className="text-center text-2xl font-bold text-foreground">
          {reviewId ? "Edit Your Review" : "Give Your Rating & Review"}
        </DialogTitle>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Share your experience with this product
        </p>
      </DialogHeader>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6"
        >
          {/* Rating Section */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-foreground">
              Rate this product
            </label>
            <Controller
              name="rating"
              control={form.control}
              render={({ field }) => (
                <div className="flex items-center gap-2 rounded-lg border border-border bg-muted p-4">
                  <Ratings
                    rating={field.value}
                    onRatingChange={(rating) => {
                      field.onChange(rating);
                    }}
                  />
                  {field.value > 0 && (
                    <span className="text-sm font-medium text-muted-foreground">
                      {field.value}/5
                    </span>
                  )}
                </div>
              )}
            />
          </div>

          {/* Review Section */}
          <div className="space-y-4">
            <label className="text-sm font-semibold text-foreground">
              Review this product
            </label>
            
            <ControlledTextareaInput
              label="Description"
              name="description"
              placeholder="Share your thoughts about this product..."
              rows={5}
            />

            <ControlledTextInput
              label="Review Title"
              name="title"
              placeholder="Give your review a title"
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              disabled={addReview.isPending || updateReview.isPending}
              type="submit"
              className="flex-1 rounded-lg bg-primary text-base font-semibold text-white shadow-md transition-all hover:bg-primary/90 hover:shadow-lg"
            >
              {addReview.isPending || updateReview.isPending ? (
                <>
                  <Image
                    src="/images/load.png"
                    alt="loader-icon"
                    width={20}
                    height={20}
                    className="mr-2 animate-spin"
                  />
                  Submitting...
                </>
              ) : (
                "Submit Review"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default ReviewForm;
