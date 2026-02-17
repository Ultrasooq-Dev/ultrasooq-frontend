import React from "react";
import { Skeleton } from "../ui/skeleton";

const SkeletonProductCardLoader = () => {
  return (
    <div className="h-80 w-full space-y-2">
      <Skeleton className="h-36 w-full" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-5 w-full" />
    </div>
  );
};

export default SkeletonProductCardLoader;
