import React from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export const OrderSkeleton = () => {
  return (
    <div className="border p-4 mb-2 rounded bg-white shadow-sm">
      <div className="font-medium">
        <Skeleton width="40%" height={18} />
      </div>
      <div className="mt-2 text-sm">
        <Skeleton width="30%" height={14} />
      </div>
      <div className="mt-1 text-sm">
        <Skeleton width="25%" height={14} />
      </div>
      <div className="mt-3">
        <Skeleton width={100} height={36} borderRadius={4} />
      </div>
    </div>
  );
};

export const OrderListSkeleton = ({ count = 3 }) => {
  return (
    <div className="flex flex-col gap-2">
      {Array(count)
        .fill(0)
        .map((_, i) => (
          <OrderSkeleton key={i} />
        ))}
    </div>
  );
};
