import React, { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { FaStar } from "react-icons/fa";
import { FaRegStar } from "react-icons/fa";

type RatingProps = {
  rating?: number;
  onRatingChange?: (rating: number) => void;
};

const Ratings: React.FC<RatingProps> = ({ rating, onRatingChange }) => {
  const [activeRating, setActiveRating] = useState(0);

  const handleStarClick = (starValue: number) => {
    setActiveRating(starValue);
    onRatingChange?.(starValue);
  };

  useEffect(() => {
    if (rating) {
      setActiveRating(rating);
    }
  }, [rating]);

  return (
    <div className="flex">
      {Array.from({ length: 5 }, (_, i) => i + 1).map((item) => (
        <Button
          type="button"
          variant="ghost"
          key={item}
          onClick={() => handleStarClick(item)}
          className="flex items-center space-x-1 px-2"
        >
          {activeRating >= item ? <FaStar color="#FFC107" /> : <FaRegStar />}
        </Button>
      ))}
    </div>
  );
};

export default Ratings;
