"use client";

import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../redux/store";
import Navbar from "./Navbar";
import { verifyUser } from "@/lib/verifyUser";
import { HomeSkeleton } from "./loading/HomeSkeleton";
import { LoggedInUser } from "@/types/userTypes";
import { setLoggedInUserId } from "@/redux/slices/loggedInUserId";
import gql from "graphql-tag";
import { useQuery } from "@apollo/client/react";
import { Community } from "@/types/postType";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { set } from "zod";
import {
  setCollapsed,
  toggleSidebar,
} from "@/redux/slices/sidebarCollapseSlice";

const TOP_COMMUNITIES = gql`
  query GetNotifications($loggedInUserId: String!) {
    getTopCommunities(loggedInUserId: $loggedInUserId) {
      message
      success
      communities {
        id
        imgUrl
        membersCount
        name
      }
    }
  }
`;

const Main = ({ children }: { children: React.ReactNode }) => {
  const sidebarCollapsed = useSelector(
    (state: RootState) => state.sidebarCollapse.isCollapsed
  );
  const [isAuthorized, setIsAuthorized] = useState<"true" | "false">("false");
  const [userInfo, setUserInfo] = useState<LoggedInUser>(null);

  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch<AppDispatch>();

  const router = useRouter();

  useEffect(() => {
    async function getLoggedInUser() {
      setLoading(true);
      try {
        const user = await verifyUser();

        if (!user) return;

        const { valid } = user;
        setIsAuthorized(valid ? "true" : "false");
        if (valid) {
          dispatch(setLoggedInUserId(user.user.id));
          setUserInfo(user.user);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    getLoggedInUser();
  }, []);

  //resize for mobile view

  useEffect(() => {
    if (window.innerWidth < 768) {
      dispatch(setCollapsed(true));
    }
  }, [dispatch]);

  const { data: topCommunities } = useQuery<{
    getTopCommunities: { success: boolean; communities: Community[] };
  }>(TOP_COMMUNITIES, {
    variables: {
      loggedInUserId: userInfo?.id,
    },
    skip: !userInfo?.id,
  });

  return (
    <div>
      {loading ? (
        <HomeSkeleton />
      ) : (
        <>
          <Navbar isAuthorized={isAuthorized} userInfo={userInfo} />
          <main className="flex">
            {!sidebarCollapsed && (
              <Sidebar isAuthorized={isAuthorized} userInfo={userInfo} />
            )}
            {children}

            <div className="lg:block hidden text-[hsl(var(--secondary-foreground))]  sticky top-20 right-10 self-start text-sm">
              <h1 className="text-3xl font-bold">Suggested Communities</h1>
              {topCommunities?.getTopCommunities?.communities?.map(
                (community: Community) => (
                  <div
                    key={community.id}
                    onClick={() => router.push(`/community/${community.id}`)}
                    className="flex items-center gap-3 mt-4 p-2 hover:bg-[hsl(var(--muted))] rounded-lg"
                  >
                    <Image
                      width={100}
                      height={100}
                      src={
                        community.imgUrl ||
                        "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y"
                      }
                      alt={community.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-semibold">
                        {community.name.split("")[0].toUpperCase() +
                          community.name.slice(1)}
                      </p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        {community.membersCount} members
                      </p>
                    </div>
                  </div>
                )
              )}
            </div>
          </main>
        </>
      )}
    </div>
  );
};

export default Main;
