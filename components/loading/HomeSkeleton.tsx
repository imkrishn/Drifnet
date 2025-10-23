import React from "react";

const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-200 rounded-md ${className}`} />
);

export const PostSkeleton = () => {
  return (
    <div className="flex-1 p-6 space-y-4">
      {/* Post Card */}
      {[...Array(2)].map((_, i) => (
        <div key={i} className=" rounded-lg p-4 space-y-3 shadow-sm ">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-6 w-6 rounded-full" /> {/* Community icon */}
            <Skeleton className="h-4 w-28" /> {/* Community name */}
            <Skeleton className="h-6 w-12 ml-auto" /> {/* Join btn */}
          </div>
          <div className="flex items-center space-x-2">
            <Skeleton className="h-8 w-8 rounded-full" /> {/* User avatar */}
            <Skeleton className="h-4 w-32" /> {/* User + time */}
          </div>
          <Skeleton className="h-6 w-48" /> {/* Post title */}
          <Skeleton className="h-4 w-full" /> {/* Post desc */}
          <Skeleton className="h-40 w-full rounded-md" /> {/* Post image */}
        </div>
      ))}
    </div>
  );
};

export const HomeSkeleton = () => {
  return (
    <div className="flex w-full h-full ">
      {/* Sidebar */}
      <div className="w-64  p-4 space-y-4">
        <Skeleton className="h-8 w-32" /> {/* Logo */}
        <Skeleton className="h-10 w-full" /> {/* Search bar */}
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-8 w-24" />
          ))}
        </div>
        <Skeleton className="h-10 w-full" /> {/* New Post button */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" /> {/* Section title */}
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-5 w-28" />
          ))}
        </div>
      </div>

      {/* Main Feed */}
      <PostSkeleton />

      {/* Right Sidebar */}
      <div className="w-64  p-4 space-y-4">
        <Skeleton className="h-6 w-40" /> {/* Suggested Communities title */}
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center space-x-2">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-4 w-28" />
          </div>
        ))}
        <Skeleton className="h-10 w-full" /> {/* Create Community btn */}
      </div>
    </div>
  );
};
