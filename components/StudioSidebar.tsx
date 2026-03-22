"use client";

import { cn } from "@/lib/utils";
import { Collection } from "@/modules/studio.module";
import {
  ChevronRight,
  NotepadText,
  MessageCircleMore,
  ThumbsUp,
  Component,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";

const collections = [
  {
    icon: NotepadText,
    name: "Post",
    path: "/post",
  },
  {
    icon: Component,
    name: "Community",
    path: "/community",
  },
  {
    icon: MessageCircleMore,
    name: "Comment",
    path: "/comment",
  },
  {
    icon: ThumbsUp,
    name: "Engage",
    path: "/engage",
  },
];

const StudioSidebar = ({
  loggedInUserId,
  collection,
}: {
  loggedInUserId: string;
  collection: Collection;
}) => {
  const router = useRouter();

  return (
    <div className="lg:w-76 lg:min-w-56 w-full h-full p-4 select-none border-r border-[hsl(var(--border))] text-[hsl(var(--input))]">
      <b className="mb-1 block text-sm font-bold p-4">Collections</b>

      {collections.map((item, index) => (
        <div
          key={index}
          onClick={() => router.push(`/studio/${loggedInUserId}/${item.path}`)}
          className={cn(
            "flex items-center cursor-pointer hover:bg-[hsl(var(--popover))] active:bg-[hsl(var(--muted))] rounded-md my-1 py-1 px-2",
            collection === item.name.toLowerCase()
              ? " bg-[hsl(var(--sidebar-hover))] text-white font-medium"
              : "  hover:bg-[hsl(var(--sidebar-hover))] hover:text-white"
          )}
        >
          <item.icon size={21} />
          <span className="ml-2 w-full">{item.name}</span>
          <ChevronRight size={20} />
        </div>
      ))}
    </div>
  );
};

export default StudioSidebar;
