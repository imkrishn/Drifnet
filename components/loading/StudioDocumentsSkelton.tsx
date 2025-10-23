import React from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export default function StudioDocumentsSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="px-4 rounded border border-[hsl(var(--border))] flex flex-col gap-2"
        >
          <div className="flex items-center gap-2 w-full">
            <Skeleton width={48} height={48} />
            <div>
              <Skeleton width={100} height={7} />
              <Skeleton width={170} height={14} />
              <Skeleton width={38} height={8} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
