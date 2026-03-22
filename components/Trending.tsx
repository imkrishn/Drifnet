"use client";

import { RootState } from "@/redux/store";
import { Post, TrendingPostResponse } from "@/types/postType";
import { useQuery } from "@apollo/client/react";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import PostCard from "./Post";
import gql from "graphql-tag";
import Spinner from "./loading/Spinner";

const TRENDING_POSTS = gql`
  query GetTrendingPosts($lastPostId: String, $userId: String, $type: String) {
    getTrendingPosts(lastPostId: $lastPostId, userId: $userId, type: $type) {
      success
      message
      nextCursor
      hasNextPage
      posts {
        id
        title
        body
        imgUrls
        createdAt
        commentsCount
        likesCount
        isLiked
        isDisliked
        user {
          id
          name
          imgUrl
          isRequested
          isFollowedByCurrentUser
          followsCurrentUser
        }
        community {
          id
          name
          description
          imgUrl
          membersCount
          isRequested
          isCommunityMember
        }
      }
    }
  }
`;

const Trending = () => {
  const loggedInUserId = useSelector(
    (state: RootState) => state.loggedInUserId
  );

  const [posts, setPosts] = useState<Post[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState<boolean>(true);
  const [type, setType] = useState<"top" | "new">("top");

  const { data, loading, fetchMore, refetch } = useQuery<TrendingPostResponse>(
    TRENDING_POSTS,
    {
      variables: { lastPostId: null, userId: loggedInUserId, type },
      notifyOnNetworkStatusChange: true,
      fetchPolicy: "network-only",
    }
  );

  useEffect(() => {
    if (data?.getTrendingPosts?.success) {
      const updatedPosts = data.getTrendingPosts.posts;
      setPosts(updatedPosts);
      setNextCursor(data.getTrendingPosts.nextCursor);
      setHasNextPage(data.getTrendingPosts.hasNextPage);
    }
  }, [data]);

  useEffect(() => {
    setPosts([]);
    setNextCursor(null);
    setHasNextPage(true);
    refetch({ lastPostId: null, userId: loggedInUserId, type });
  }, [type, loggedInUserId, refetch]);

  const loadMorePosts = async () => {
    if (!hasNextPage || !nextCursor || loading) return;

    try {
      const { data: moreData } = await fetchMore({
        variables: { lastPostId: nextCursor, userId: loggedInUserId, type },
      });

      if (moreData?.getTrendingPosts?.posts) {
        setPosts((prev) => [...prev, ...moreData.getTrendingPosts.posts]);
        setNextCursor(moreData.getTrendingPosts.nextCursor);
        setHasNextPage(moreData.getTrendingPosts.hasNextPage);
      }
    } catch (err) {
      console.error("Error fetching more trending posts:", err);
    }
  };

  // Infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >=
          document.body.offsetHeight - 300 &&
        hasNextPage &&
        !loading
      ) {
        loadMorePosts();
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [nextCursor, hasNextPage, loading, loadMorePosts]);

  return (
    <div className="lg:px-14 w-full h-full">
      {/* Header Tabs */}
      {loggedInUserId && (
        <div className="mb-6 flex gap-2  p-1 lg:text-base text-sm  w-fit">
          <button
            onClick={() => setType("top")}
            className={`px-5 py-2.5 rounded font-medium border border-[hsl(var(--border))] transition-all duration-300 ${
              type === "top"
                ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-md shadow-indigo-500/30"
                : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))]"
            }`}
          >
            🔥 Top
          </button>
          <button
            onClick={() => setType("new")}
            className={`px-5 py-2.5 rounded font-medium border border-[hsl(var(--border))] transition-all duration-300 ${
              type === "new"
                ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/30"
                : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))]"
            }`}
          >
            New
          </button>
        </div>
      )}

      {/* Posts */}
      <div className="space-y-6 w-full">
        {posts.map((post) => (
          <PostCard
            postData={post}
            key={post.id}
            userId={loggedInUserId}
            showBtn
            onDelete={() => {
              setPosts((prev) => prev.filter((p) => p.id !== post.id));
            }}
          />
        ))}

        {loading && (
          <div className="flex items-center justify-center w-full h-full  py-4">
            <Spinner size={33} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Trending;
