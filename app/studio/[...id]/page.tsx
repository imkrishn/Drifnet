import StudioDocument from "@/components/StudioDocument";
import StudioSidebar from "@/components/StudioSidebar";
import { Collection } from "@/modules/studio.module";
import React from "react";

const Studio = async ({ params }: { params: any }) => {
  const { id } = await params;

  const userId = id[0];
  const contentType: Collection = id[1];

  return (
    <div className="flex h-full w-full overflow-hidden">
      <StudioSidebar loggedInUserId={userId} collection={contentType} />
      {contentType ? (
        <StudioDocument collection={contentType} loggedInUserId={userId} />
      ) : (
        <div className="flex items-center justify-center min-w-1/2 w-full h-full  font-medium text-[hsl(var(--muted-foreground))]">
          Select a collection
        </div>
      )}
    </div>
  );
};

export default Studio;
