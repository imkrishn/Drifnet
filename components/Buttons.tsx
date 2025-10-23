"use client";

import { cn } from "@/lib/utils";
import { setJoinCommunity } from "@/redux/slices/joinCommunitySlice";
import { setLeaveCommunity } from "@/redux/slices/leaveCommunity";
import { AppDispatch } from "@/redux/store";
import { FollowResponse, JoinCommunityResponse } from "@/types/userTypes";
import { useMutation } from "@apollo/client/react";
import gql from "graphql-tag";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import { Dispatch, SetStateAction, useCallback } from "react";
import { useDispatch } from "react-redux";
import Spinner from "./loading/Spinner";

const FOLLOW_UNFOLLOW = gql`
  mutation FollowUnfollowAction($followerId: String!, $followingId: String!) {
    followUnfollowAction(followerId: $followerId, followingId: $followingId) {
      success
      message
      status
    }
  }
`;

const JOIN_LEAVE_COMMUNITY = gql`
  mutation JoinLeaveCommunity($userId: String!, $communityId: String!) {
    joinLeaveCommunity(userId: $userId, communityId: $communityId) {
      success
      message
      status
      communityName
    }
  }
`;

export function LoginBtn() {
  return (
    <a href={`${process.env.NEXT_PUBLIC_URL}/auth/login`}>
      <button className="font-bold hover:scale-[.99]  cursor-pointer transition-colors">
        Login
      </button>
    </a>
  );
}

export function RegisterBtn({ complete }: { complete?: boolean }) {
  return (
    <a href={`${process.env.NEXT_PUBLIC_URL}/auth/register`}>
      <button className="rounded-md whitespace-nowrap px-3 py-2  text-white cursor-pointer  bg-[#FF5722] hover:bg-[#ff4322] transition-colors">
        Get Started{" "}
        {complete && (
          <span className="inline">
            for free <ArrowRight className="inline" size={20} />
          </span>
        )}
      </button>
    </a>
  );
}

export function GithubBtn() {
  const handleLogin = () => {
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID}&redirect_uri=${process.env.NEXT_PUBLIC_URL}/auth/github/callback&scope=user:email`;
    window.location.href = githubAuthUrl;
  };
  return (
    <button
      onClick={handleLogin}
      className="flex gap-2 items-center border bg-white text-[#524f4f]  shadow rounded cursor-pointer active:scale-[.97] px-4 py-2"
    >
      <Image src="/github.png" width={40} height={40} alt="#github_icon" />
      Continue with Github
    </button>
  );
}

export function StudioBtn() {
  return (
    <button className="rounded-md px-4 py-2 whitespace-nowrap text-white bg-[#2289FF] text-sm hover:bg-[#225dff] m-4 cursor-pointer font-semibold transition-colors">
      {" "}
      Manage Studio
    </button>
  );
}

export function FollowBtn({
  loggedInUserId,
  followerId,
  followingId,
  followStatus,
  setFollowStatus,
  onClick,
}: {
  loggedInUserId: string | null;
  followerId: string | null;
  followingId: string;
  followStatus?: "Follow" | "Following" | "Requested" | "Follow Back";
  setFollowStatus: Dispatch<
    SetStateAction<
      "Follow" | "Following" | "Requested" | "Follow Back" | undefined
    >
  >;
  onClick?: () => void;
}) {
  const [followUnfollow, { loading }] =
    useMutation<FollowResponse>(FOLLOW_UNFOLLOW);

  // handle follow/unfollow actions
  const handleFollowUnfollow = useCallback(async () => {
    if (!loggedInUserId)
      return (window.location.href = `${process.env.NEXT_PUBLIC_URL}/auth/login`);
    if (followStatus === "Requested") return;
    try {
      const res = await followUnfollow({
        variables: {
          followerId,
          followingId,
        },
      });

      const status = res.data?.followUnfollowAction.status;

      if (res.data?.followUnfollowAction.success && status) {
        setFollowStatus(status);

        if (onClick) {
          onClick();
        }
      }
    } catch (err) {
      console.error("Follow/Unfollow error:", err);
    }
  }, [followerId, followingId]);

  return (
    <button
      onClick={handleFollowUnfollow}
      disabled={loading}
      className={cn(
        " lg:min-w-24 max-h-8 flex justify-center items-center min-w-20 whitespace-nowrap text-sm border border-[hsl(var(--border))]  rounded-md  px-3 py-1.5 cursor-pointer active:opacity-90",
        followStatus !== "Requested"
          ? "bg-blue-600 active:bg-blue-500 text-white"
          : "bg-white text-black"
      )}
    >
      {loading ? <Spinner size={11} color="#ffffff" /> : followStatus}
    </button>
  );
}

export function CommunityBtn({
  loggedInUserId,
  userId,
  communityId,
  communityJoinedStatus,
  setCommunityJoinedStatus,
}: {
  loggedInUserId: string | null;
  userId: string | null;
  communityId: string;
  communityJoinedStatus?: "Join" | "Requested" | "Joined";
  setCommunityJoinedStatus: Dispatch<
    SetStateAction<"Join" | "Requested" | "Joined" | undefined>
  >;
}) {
  const [joinExitCommunity, { loading }] =
    useMutation<JoinCommunityResponse>(JOIN_LEAVE_COMMUNITY);
  const dispatch = useDispatch<AppDispatch>();

  // handle join/exit actions
  const handleJoinExitCommunity = useCallback(async () => {
    if (!loggedInUserId)
      return (window.location.href = `${process.env.NEXT_PUBLIC_URL}/auth/login`);
    if (communityJoinedStatus === "Requested") return;
    try {
      const res = await joinExitCommunity({
        variables: {
          userId,
          communityId,
        },
      });

      const status = res.data?.joinLeaveCommunity.status;

      if (res.data?.joinLeaveCommunity.success && status) {
        setCommunityJoinedStatus(status);
        if (status === "Joined") {
          dispatch(
            setJoinCommunity({
              id: communityId,
              name: res.data.joinLeaveCommunity.communityName,
            })
          );
        } else if (status === "Join") {
          dispatch(setLeaveCommunity(communityId));
        }
      }
    } catch (err) {
      console.error("Join/Exit Community error:", err);
    }
  }, [communityId, userId]);
  return (
    <button
      onClick={handleJoinExitCommunity}
      disabled={loading}
      className={cn(
        "border border-[hsl(var(--border))] lg:min-w-24 min-w-20 max-h-8 flex justify-center items-center   text-sm rounded-md  px-3 py-1.5 cursor-pointer active:opacity-90",
        communityJoinedStatus !== "Requested"
          ? "bg-[hsl(var(--primary))] text-white"
          : "text-black"
      )}
    >
      {loading ? <Spinner size={11} color="#ffffff" /> : communityJoinedStatus}
    </button>
  );
}
