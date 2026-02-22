import React, { useMemo, useState } from "react";
import Image from "next/image";
import UserRatingCard from "./UserRatingCard";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "../ui/button";
import ReviewForm from "./ReviewForm";
import { useReviews } from "@/apis/queries/review.queries";
import { FaStar } from "react-icons/fa";
import { FaRegStar } from "react-icons/fa";
import { useMe } from "@/apis/queries/user.queries";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";

type ReviewSectionProps = {
  productId?: string;
  hasAccessToken?: boolean;
  productReview: { rating: number }[];
  isCreator: boolean;
};

const ReviewSection: React.FC<ReviewSectionProps> = ({
  productId,
  hasAccessToken,
  productReview,
  isCreator,
}) => {
  const t = useTranslations();
  const { langDir } = useAuth();
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [sortType, setSortType] = useState<"highest" | "lowest" | "newest">(
    "newest",
  );
  const [reviewId, setReviewId] = useState<number>();
  const me = useMe();
  const handleToggleReviewModal = () =>
    setIsReviewModalOpen(!isReviewModalOpen);

  const reviewsQuery = useReviews(
    { page: 1, limit: 20, productId: productId ?? "", sortType },
    !!productId,
  );

  const calculateAvgRating = useMemo(() => {
    const totalRating = productReview?.reduce(
      (acc: number, item: { rating: number }) => {
        return acc + item.rating;
      },
      0,
    );

    const result = totalRating / productReview?.length;
    return !isNaN(result) ? Math.floor(result) : 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productReview?.length]);

  const calculateRatings = useMemo(
    () => (rating: number) => {
      const stars = [];
      for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
          stars.push(<FaStar key={i} color="#FFC107" size={20} />);
        } else {
          stars.push(<FaRegStar key={i} color="#FFC107" size={20} />);
        }
      }
      return stars;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [productReview?.length],
  );

  const reviewExists = useMemo(() => {
    return reviewsQuery?.data?.data?.some(
      (item: { userId: string }) => item.userId === me?.data?.data?.id,
    );
  }, [me?.data?.data?.id, reviewsQuery?.data?.data]);

  return (
    <div className="w-full space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        {/* Ratings Summary - Row Format */}
        <div className="flex items-center gap-6">
          <h3 className="text-5xl font-bold text-foreground">
            {calculateAvgRating ? `${calculateAvgRating}.0` : "0"}
          </h3>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1">
              {calculateRatings(calculateAvgRating)}
            </div>
            <p className="text-sm text-muted-foreground" dir={langDir} translate="no">
              ({t("based_on_n_reviews", {
                n: reviewsQuery.data?.data?.length || 0,
              })})
            </p>
          </div>
        </div>

        {/* Write Review Button */}
        {hasAccessToken && !isCreator && !reviewExists && (
          <Button
            onClick={handleToggleReviewModal}
            className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-primary/90 hover:shadow-lg"
            dir={langDir}
            translate="no"
          >
            <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            {t("write_a_review")}
          </Button>
        )}
      </div>

      {/* Sort By Section */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <h4 className="text-lg font-semibold text-foreground" dir={langDir} translate="no">
          {t("reviews")}
        </h4>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground" dir={langDir} translate="no">
            {t("sort_by")}:
          </span>
          <div className="flex gap-2">
            <Button
              variant={sortType === "newest" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortType("newest")}
              className={`rounded-full px-4 text-sm font-medium transition-all ${
                sortType === "newest"
                  ? "bg-warning text-white hover:bg-warning"
                  : "border-border text-muted-foreground hover:bg-muted"
              }`}
              dir={langDir}
              translate="no"
            >
              {t("newest")}
            </Button>
            <Button
              variant={sortType === "highest" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortType("highest")}
              className={`rounded-full px-4 text-sm font-medium transition-all ${
                sortType === "highest"
                  ? "bg-warning text-white hover:bg-warning"
                  : "border-border text-muted-foreground hover:bg-muted"
              }`}
              dir={langDir}
              translate="no"
            >
              {t("highest")}
            </Button>
            <Button
              variant={sortType === "lowest" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortType("lowest")}
              className={`rounded-full px-4 text-sm font-medium transition-all ${
                sortType === "lowest"
                  ? "bg-warning text-white hover:bg-warning"
                  : "border-border text-muted-foreground hover:bg-muted"
              }`}
              dir={langDir}
              translate="no"
            >
              {t("lowest")}
            </Button>
          </div>
        </div>
      </div>

      {/* Reviews Grid */}
      {!reviewsQuery?.data?.data?.length ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted py-12">
          <svg className="h-16 w-16 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          <p className="mt-4 text-lg font-semibold text-foreground" dir={langDir} translate="no">
            {t("no_reviews_found")}
          </p>
          <p className="mt-2 text-sm text-muted-foreground" dir={langDir} translate="no">
            Be the first to review this product
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reviewsQuery.data?.data?.length
            ? reviewsQuery.data?.data.map(
                (review: {
                  id: number;
                  rating: number;
                  title: string;
                  description: string;
                  createdAt: string;
                  reviewByUserDetail: {
                    firstName: string;
                    lastName: string;
                    accountName: string;
                    profilePicture: string;
                  };
                  userId: number;
                }) => {
                  const displayName = review?.reviewByUserDetail?.accountName ||
                    `${review?.reviewByUserDetail?.firstName || ''} ${review?.reviewByUserDetail?.lastName || ''}`.trim() ||
                    'Anonymous User';
                  
                  // Remove "-BUYER" suffix if present
                  const cleanName = displayName.replace(/\s*-\s*BUYER$/i, '');
                  
                  return (
                    <UserRatingCard
                      key={review?.id}
                      rating={review?.rating}
                      name={cleanName}
                      title={review.title}
                      review={review.description}
                      date={review.createdAt}
                      profilePicture={review?.reviewByUserDetail?.profilePicture}
                      isBuyer={
                        me.data?.data?.tradeRole === "BUYER" &&
                        me.data?.data?.id === review?.userId
                      }
                      onEdit={() => {
                        setReviewId(review?.id);
                        handleToggleReviewModal();
                      }}
                    />
                  );
                },
              )
            : null}
        </div>
      )}
      {/* <div className="flex w-full items-center justify-center text-center text-sm font-bold text-dark-orange">
        <span className="flex">
          <Image
            src="/images/loader.png"
            className="mr-1.5"
            height={20}
            width={20}
            alt="loader-icon"
          />
          Load More
        </span>
      </div> */}

      <Dialog open={isReviewModalOpen} onOpenChange={handleToggleReviewModal}>
        <DialogContent>
          <ReviewForm
            onClose={() => {
              setReviewId(undefined);
              handleToggleReviewModal();
            }}
            reviewId={reviewId}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReviewSection;
