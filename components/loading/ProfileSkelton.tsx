import React from "react";
import Skeleton from "react-loading-skeleton";

export default function ProfileSkeleton() {
  return (
    <div className="w-full absolute top-0  max-w-3xl border border-[hsl(var(--border))] overflow-hidden">
      {/* Banner */}
      <div className="relative h-72">
        <Skeleton height="100%" />
      </div>

      {/* Profile section */}
      <div className="relative px-8 pb-6 -mt-14">
        {/* Profile Image */}
        <div className="absolute -top-4 left-8">
          <Skeleton circle width={112} height={112} />
        </div>

        <div className="lg:ml-40 ml-32 flex lg:flex-row flex-col lg:items-start justify-between items-center gap-4">
          <div className="flex flex-col gap-2">
            <Skeleton width={160} height={24} />
            <Skeleton width={120} height={18} />

            <div className="flex justify-evenly gap-6 mt-4">
              <div className="flex flex-col items-center gap-1">
                <Skeleton width={40} height={20} />
                <Skeleton width={50} height={12} />
              </div>
              <div className="flex flex-col items-center gap-1">
                <Skeleton width={40} height={20} />
                <Skeleton width={50} height={12} />
              </div>
            </div>
          </div>

          <div>
            <Skeleton width={96} height={32} borderRadius={8} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-t border-[hsl(var(--border))] flex">
        <div className="flex-1 px-6 py-4 flex flex-col items-center">
          <Skeleton width={40} height={16} />
          <Skeleton width={24} height={12} />
        </div>
        <div className="flex-1 px-6 py-4 flex flex-col items-center">
          <Skeleton width={60} height={16} />
          <Skeleton width={24} height={12} />
        </div>
        <div className="flex-1 px-6 py-4 flex flex-col items-center">
          <Skeleton width={50} height={16} />
          <Skeleton width={24} height={12} />
        </div>
      </div>
    </div>
  );
}
