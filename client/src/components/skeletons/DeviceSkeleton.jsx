import React from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export const DeviceSkeleton = () => {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-border-muted bg-white shadow-sm">
      <div className="aspect-[4/3] bg-surface-white-subtle">
        <Skeleton height="100%" />
      </div>
      <div className="p-4">
        <Skeleton width="80%" height={20} />
        <Skeleton width="40%" height={14} className="mt-2" />
        <div className="mt-3 flex gap-2">
          <Skeleton width={60} height={24} borderRadius={20} />
          <Skeleton width={80} height={24} borderRadius={20} />
        </div>
        <div className="mt-4 flex items-end justify-between">
          <Skeleton width={100} height={28} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Skeleton height={40} borderRadius={12} />
          <Skeleton height={40} borderRadius={12} />
        </div>
      </div>
    </div>
  );
};

export const DeviceListSkeleton = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {Array(count)
        .fill(0)
        .map((_, i) => (
          <DeviceSkeleton key={i} />
        ))}
    </div>
  );
};
