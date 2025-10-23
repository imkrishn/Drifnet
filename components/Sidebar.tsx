"use client";

import React, { useEffect, useRef, useState } from "react";
import Logo from "./Logo";
import {
  Bell,
  ChevronsLeft,
  Home,
  Plus,
  Search,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../redux/store";
import { toggleSidebar } from "../redux/slices/sidebarCollapseSlice";
import CreatePostModal from "./NewPost";
import CreateCommunity from "./NewCommunity";
import {
  Community,
  GetNotificationsResponse,
  LoggedInUser,
  Notification,
} from "@/types/userTypes";
import SearchBar from "./Search";
import NotificationPanel from "./Notification";
import gql from "graphql-tag";
import { useQuery } from "@apollo/client/react";
import {
  onChildAdded,
  orderByChild,
  query,
  ref,
  startAfter,
} from "firebase/database";
import { database } from "@/lib/firebase";

const GET_NOTIFICATIONS = gql`
  query GetNotifications($loggedInUserId: ID!) {
    getNotifications(loggedInUserId: $loggedInUserId) {
      message
      success
      data {
        commentId
        communityId
        createdAt
        postId
        receiver {
          id
          imgUrl
          name
        }
        id
        status
        type
        sender {
          id
          imgUrl
          name
        }
      }
    }
  }
`;

const Sidebar = ({
  isAuthorized,
  userInfo,
}: {
  isAuthorized: "true" | "false" | null;
  userInfo: LoggedInUser;
}) => {
  const pathname = usePathname();

  const { data, loading } = useQuery<GetNotificationsResponse>(
    GET_NOTIFICATIONS,
    {
      variables: {
        loggedInUserId: userInfo?.id,
      },
      skip: !userInfo?.id,
      fetchPolicy: "network-only",
    }
  );

  const [communities, setCommunities] = useState<{ community: Community }[]>(
    []
  );
  const [isOpenCreateCommunity, setIsOpenCreateCommunity] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpenNewPost, setIsOpenNewPost] = useState<boolean>(false);
  const [openNotification, setOpenNotification] = useState<boolean>(false);
  const [isOpenSearch, setIsOpenSearch] = useState<boolean>(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState<
    number | undefined
  >(() => {
    const storedData = localStorage.getItem("notificationCount");
    const result = storedData ? JSON.parse(storedData) : undefined;
    return result;
  });

  const lastTimeRef = useRef<number>(Date.now());

  const dispatch = useDispatch<AppDispatch>();

  const newCommunity: Community = useSelector(
    (state: RootState) => state.joinCommunity
  );
  const leavedCommunityId = useSelector(
    (state: RootState) => state.leaveCommunity
  );

  const menuBtns = [
    { icon: Home, text: "Home", path: `/home/${userInfo?.id}` },
    { icon: TrendingUp, text: "Trending", path: "/" },
    {
      icon: Plus,
      text: "Create Post",
      path: "",
      onClick: () => setIsOpenNewPost(true),
    },
    {
      icon: Bell,
      text: "Notifications",
      path: "",
      onClick: () => {
        setOpenNotification(true);
        localStorage.removeItem("notificationCount");
        setUnreadNotificationCount(undefined);
      },
    },
  ];

  //realtime notifications

  useEffect(() => {
    if (!userInfo?.id) return;

    const notifRef = ref(database, `notifications/${userInfo?.id}`);

    const notifQuery = query(
      notifRef,
      orderByChild("createdAt"),
      startAfter(lastTimeRef.current)
    );

    const unsubscribe = onChildAdded(notifQuery, (snapshot) => {
      const notif = snapshot.val();
      setNotifications((prev) => [notif, ...prev]);
      const count = unreadNotificationCount ? unreadNotificationCount + 1 : 1;

      localStorage.setItem("notificationCount", JSON.stringify(count)),
        setUnreadNotificationCount(count);
    });

    return () => unsubscribe();
  }, [userInfo?.id]);

  //sync intial data

  useEffect(() => {
    if (data?.getNotifications.success) {
      setNotifications(data.getNotifications.data);
    }
  }, [data?.getNotifications.data]);

  useEffect(() => {
    if (
      !userInfo?.communityMemberships ||
      userInfo?.communityMemberships.length === 0
    )
      return;
    setCommunities(userInfo?.communityMemberships.reverse());
  }, [userInfo?.communityMemberships]);

  useEffect(() => {
    if (!newCommunity.id && !newCommunity.name) return;

    setCommunities((prev) => [{ community: newCommunity }, ...prev]);
  }, [newCommunity.id]);

  useEffect(() => {
    if (leavedCommunityId) {
      setCommunities(
        communities.filter(
          ({ community }) => community.id !== leavedCommunityId
        )
      );
    }
  }, [leavedCommunityId]);

  useEffect(() => {
    if (isOpenNewPost) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpenNewPost]);

  function handleSidebarCollapse() {
    dispatch(toggleSidebar());
  }

  return (
    <aside className="lg:w-100 w-full h-screen">
      <div className="fixed top-0 min-h-screen left-0 z-40 bg-[hsl(var(--sidebar-background))] text-[hsl(var(--sidebar-text))] shadow-sm lg:w-80 w-full  p-6 ">
        {/* Logo */}
        <div className="flex items-center justify-between">
          <Logo />
          <ChevronsLeft
            className="cursor-pointer "
            onClick={handleSidebarCollapse}
          />
        </div>
        {/* Search Bar*/}
        <div
          onClick={() => setIsOpenSearch(true)}
          className="flex items-center gap-2 my-3 text-sm  p-2 rounded bg-white shadow-sm"
        >
          <Search size={18} />
          <input
            type="text"
            placeholder="Find Community"
            className="w-full  bg-transparent outline-none"
          />
        </div>

        <SearchBar open={isOpenSearch} onClose={() => setIsOpenSearch(false)} />

        {isAuthorized === "true" && (
          <>
            {/* Menu */}
            <div className="flex flex-col text-sm  gap-1 w-full">
              {menuBtns.map((btn, idx) => {
                const Icon = btn.icon;
                const isActive = pathname === btn.path;

                return (
                  <Link
                    key={idx}
                    href={btn.path}
                    onClick={btn.onClick}
                    className={`flex relative items-center gap-3 px-3 py-1 rounded transition-colors ${
                      isActive
                        ? " bg-[hsl(var(--sidebar-hover))] text-white font-medium"
                        : "  hover:bg-[hsl(var(--sidebar-hover))] hover:text-white"
                    }`}
                  >
                    <Icon size={18} />
                    <span>{btn.text}</span>
                    {btn.text === "Notifications" &&
                      unreadNotificationCount &&
                      unreadNotificationCount > 0 && (
                        <span className="bg-green-600 w-6 h-6 p-1 absolute right-2 -top-2 text-center text-white rounded-full text-xs flex items-center justify-center font-semibold">
                          {unreadNotificationCount > 99
                            ? "99+"
                            : unreadNotificationCount}
                        </span>
                      )}
                  </Link>
                );
              })}
            </div>

            <button
              onClick={() => setIsOpenCreateCommunity(true)}
              className="rounded px-4 py-1 text-sm w-full  bg-[#FF5722] text-white font-semibold mt-2 hover:bg-[#FF3D00] transition-colors"
            >
              + Create Community
            </button>
            <CreatePostModal
              isOpen={isOpenNewPost}
              onClose={() => setIsOpenNewPost(false)}
              userId={userInfo?.id || ""}
              communities={communities.map(({ community }) => community)}
            />

            <CreateCommunity
              open={isOpenCreateCommunity}
              onClose={() => setIsOpenCreateCommunity(false)}
              userId={userInfo?.id || ""}
              setCommunities={setCommunities}
            />

            <NotificationPanel
              open={openNotification}
              onClose={() => setOpenNotification(false)}
              notifications={notifications}
              setNotifications={setNotifications}
              loading={loading}
            />

            {/* Communities */}

            <h1 className="font-extralight  mt-4 px-3">Your Communities</h1>
            <div className=" text-sm font-semibold  px-6 overflow-scroll h-56">
              {communities.map(({ community }) => (
                <Link
                  key={community.id}
                  href={`/community/${community.id}`}
                  className="block py-1 hover:text-[hsl(var(--secondary-foreground))]"
                >
                  {community.name}
                </Link>
              ))}
            </div>
          </>
        )}
        {isAuthorized === "false" && (
          <a href={`${process.env.NEXT_PUBLIC_URL}/auth/login`}>
            <button className="rounded px-4 py-1 text-sm w-full  bg-[#FF5722] text-white font-semibold mt-2 hover:bg-[#FF3D00] transition-colors">
              Sign in to create post
            </button>
          </a>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
