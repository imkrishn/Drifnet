"use client";

import { Lock, LogOut, Upload } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import ImageCropper from "./ImageCropper";
import gql from "graphql-tag";
import { useLazyQuery, useMutation, useQuery } from "@apollo/client/react";
import {
  GetCommunityMembersResponse,
  GetCommunityPostsResponse,
  GetCommunityResponse,
  LeaveCommunityResponse,
  Post,
  RemoveCommunityResponse,
  UpdateCommunityResponse,
  User,
} from "@/types/communityTypes";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { manageHighValue } from "@/lib/manageHighValue";
import { CommunityBtn, FollowBtn } from "./Buttons";
import PostCard from "./Post";
import Spinner from "./loading/Spinner";
import ProfileSkeleton from "./loading/ProfileSkelton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface EditCommunityProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    name: string,
    imgUrl: string,
    description?: string,
    communityType?: "PUBLIC" | "PRIVATE"
  ) => void;
  onImageCrop: (croppedFile: File) => Promise<string | null>;
  loading: boolean;
  defaultData: {
    id: string;
    name: string;
    imgUrl: string;
    description?: string;
    communityType?: "PUBLIC" | "PRIVATE";
  };
}

// Queries
const FETCH_COMMUNITY_DATA = gql`
  query getCommunityData($communityId: String!, $loggedInUserId: String!) {
    getCommunityData(
      communityId: $communityId
      loggedInUserId: $loggedInUserId
    ) {
      success
      message
      community {
        id
        name
        description
        ownerId
        communityType
        imgUrl
        bannerUrl
        isMember
        membersCount
        postsCount
      }
    }
  }
`;

const FETCH_COMMUNITY_POSTS = gql`
  query GetCommunityPosts(
    $communityId: String!
    $loggedInUserId: String!
    $cursor: String
    $limit: Int
  ) {
    getCommunityPosts(
      communityId: $communityId
      loggedInUserId: $loggedInUserId
      cursor: $cursor
      limit: $limit
    ) {
      success
      message
      posts {
        id
        title
        body
        imgUrls
        commentsCount
        likesCount
        isLiked
        isDisliked
        createdAt
        user {
          id
          name
          imgUrl
          isRequested
          isFollowedByCurrentUser
          followsCurrentUser
        }
      }
      hasMore
      nextCursor
    }
  }
`;

const FETCH_COMMUNITY_MEMBERS = gql`
  query GetCommunityMembers($communityId: String!, $loggedInUserId: String!) {
    getCommunityMembers(
      communityId: $communityId
      loggedInUserId: $loggedInUserId
    ) {
      success
      message
      members {
        id
        name
        imgUrl
        followStatus
      }
    }
  }
`;

const UPDATE_COMMUNITY_DATA = gql`
  mutation UpdateCommunity(
    $communityId: String!
    $data: UpdateCommunityInput!
  ) {
    updateCommunity(communityId: $communityId, data: $data) {
      success
      message
    }
  }
`;

const REMOVE_MEMBER = gql`
  mutation RemoveMember(
    $ownerId: String!
    $userId: String!
    $communityId: String!
  ) {
    removeMember(
      ownerId: $ownerId
      userId: $userId
      communityId: $communityId
    ) {
      success
      message
    }
  }
`;
const LEAVE_COMMUNITY = gql`
  mutation LeaveCommunity($userId: String!, $communityId: String!) {
    leaveCommunity(userId: $userId, communityId: $communityId) {
      success
      message
    }
  }
`;

const CommunityCard = () => {
  const loggedInUserId = useSelector(
    (state: RootState) => state.loggedInUserId
  );
  const pathname = usePathname();
  const communityId = pathname.split("/")[2];

  // fetch community
  const { data, loading } = useQuery<GetCommunityResponse>(
    FETCH_COMMUNITY_DATA,
    {
      variables: { loggedInUserId, communityId },
      skip: !loggedInUserId || !communityId,
      fetchPolicy: "cache-and-network",
    }
  );

  const [getPosts, { loading: postsLoading, fetchMore }] =
    useLazyQuery<GetCommunityPostsResponse>(FETCH_COMMUNITY_POSTS, {
      fetchPolicy: "cache-and-network",
    });

  const [getMembers, { loading: membersLoading }] =
    useLazyQuery<GetCommunityMembersResponse>(FETCH_COMMUNITY_MEMBERS, {
      fetchPolicy: "cache-and-network",
    });

  const [updateCommunity, { loading: updateLoading }] =
    useMutation<UpdateCommunityResponse>(UPDATE_COMMUNITY_DATA);

  const [leaveCommunity, { loading: leaveCommunityLoading }] =
    useMutation<LeaveCommunityResponse>(LEAVE_COMMUNITY);
  const [removeMember, { loading: removeLoading }] =
    useMutation<RemoveCommunityResponse>(REMOVE_MEMBER);

  // local state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imgUrl, setImgUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [communityType, setCommunityType] = useState<"PRIVATE" | "PUBLIC">();
  const [postsCount, setPostsCount] = useState(0);
  const [membersCount, setMembersCount] = useState(0);
  const [isMember, setIsMember] = useState<"Join" | "Joined" | "Requested">();
  const [showBannerCrop, setShowBannerCrop] = useState(false);
  const [activeTab, setActiveTab] = useState<"posts" | "members">("posts");
  const [posts, setPosts] = useState<Post[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [members, setMembers] = useState<User[]>([]);
  const [bannerImageSrc, setBannerImagesrc] = useState<string>("");
  const [cropLoading, setCropLoading] = useState<boolean>(false);
  const [openEdit, setOpenEdit] = useState<boolean>(false);

  const isOwnCommunity =
    loggedInUserId &&
    data?.getCommunityData?.community?.ownerId === loggedInUserId;

  // populate from query

  useEffect(() => {
    if (data?.getCommunityData?.success) {
      const {
        name,
        imgUrl,
        bannerUrl,
        description,
        isMember,
        membersCount,
        postsCount,
        communityType,
      } = data.getCommunityData.community;

      setName(name);
      setImgUrl(imgUrl);
      setBannerUrl(bannerUrl);
      setDescription(description);
      setIsMember(isMember as "Join" | "Joined" | "Requested");
      setMembersCount(membersCount);
      setCommunityType(communityType);
      setPostsCount(postsCount);

      getCommunityPosts();
    }
  }, [data]);

  // initial posts
  async function getCommunityPosts() {
    try {
      const res = await getPosts({
        variables: { communityId, loggedInUserId, limit: 5 },
      });
      if (res.data?.getCommunityPosts.success) {
        setPosts(res.data.getCommunityPosts.posts);
        setNextCursor(res.data.getCommunityPosts.nextCursor);
        setHasMore(res.data.getCommunityPosts.hasMore);
      }
    } catch (err) {
      console.error("Error while getting community posts:", err);
    }
  }

  // load more posts
  async function loadMorePosts() {
    if (!hasMore || !nextCursor) return;
    try {
      const res = await fetchMore({
        variables: {
          communityId,
          loggedInUserId,
          cursor: nextCursor,
          limit: 5,
        },
      });

      const result = res.data?.getCommunityPosts;
      if (result && result.success) {
        setPosts((prev) => [...prev, ...result.posts]);
        setNextCursor(result.nextCursor);
        setHasMore(result.hasMore);
      }
    } catch (err) {
      console.error("Error while loading more posts:", err);
    }
  }

  // get members
  async function getCommunityMembers() {
    try {
      const res = await getMembers({
        variables: { communityId, loggedInUserId },
      });
      if (res.data?.getCommunityMembers.success) {
        setMembers(res.data.getCommunityMembers.members);
        setMembersCount(res.data.getCommunityMembers.members.length);
      }
    } catch (err) {
      console.error("Error while getting community members:", err);
    }
  }

  //handle upload image

  async function uploadImage(file: File): Promise<string | null> {
    if (!file) return null;
    setCropLoading(true);
    try {
      const resImage = await fetch(
        `${process.env.NEXT_PUBLIC_URL}/api/upload`,
        {
          method: "POST",
          body: (() => {
            const formData = new FormData();

            formData.append("files", file, file.name);
            return formData;
          })(),
        }
      );

      if (!resImage.ok) {
        toast.error("Image cropped failed");
        return null;
      }
      const result = await resImage.json();

      return result.files[0].original;
    } catch (err) {
      console.error("Failed to upload image :", err);
      toast.error("Failed to upload image");
      return null;
    } finally {
      setCropLoading(false);
    }
  }

  //on community update
  async function onCommunityUpdate(
    updatedName: string,
    updatedImgUrl: string,
    updatedDescription?: string,
    updatedCommunityType?: "PUBLIC" | "PRIVATE"
  ) {
    if (!isOwnCommunity) return;
    if (!updatedName.trim() || !updatedImgUrl || !updatedCommunityType) {
      return toast.error("All fields are required");
    }
    try {
      const res = await updateCommunity({
        variables: {
          communityId,
          data: {
            name: updatedName,
            imgUrl: updatedImgUrl,
            description: updatedDescription,
            communityType: updatedCommunityType,
          },
        },
      });

      const ok = res.data && res.data.updateCommunity.success;

      if (ok) {
        setName(updatedName);
        setDescription(updatedDescription ? updatedDescription : "");
        setImgUrl(updatedImgUrl);
        setCommunityType(updatedCommunityType);
        setOpenEdit(false);
      }
    } catch (err) {
      console.error("Error while updating community :", err);
      toast.error("Failed to update Community data");
    }
  }

  //remove Member

  async function removeMembership(userId: string, ownerId: string) {
    if (!ownerId || !userId || !communityId) return;

    try {
      const res = await removeMember({
        variables: {
          communityId,
          ownerId,
          userId,
        },
      });

      const ok = res.data?.removeMember.success;

      if (ok) {
        const updatedMembers = members.filter((member) => member.id !== userId);
        setMembers(updatedMembers);
        setMembersCount(updatedMembers.length);
      }
    } catch (err) {
      console.error("Error removing membership : ", err);
      toast.error("Failed to remove member");
    }
  }

  //leave Community

  async function leaveFromCommunity() {
    if (!communityId || !loggedInUserId) return;

    try {
      const res = await leaveCommunity({
        variables: {
          communityId,
          userId: loggedInUserId,
        },
      });

      const ok = res.data?.leaveCommunity.success;

      if (ok) {
        window.location.href = process.env.NEXT_PUBLIC_URL!;
      }
    } catch (Err) {
      console.error("Error leaving community :", Err);
      toast.error("Failed to leave community");
    }
  }

  function confirmLeave() {
    toast("Leave Community?", {
      description: `Do you really want to leave ?`,
      action: {
        label: "Yes, Leave",
        onClick: leaveFromCommunity,
      },
      cancel: {
        label: "Cancel",
        onClick: () => toast.dismiss(),
      },
    });
  }

  // Tabs config
  const tabs = useMemo(
    () => [
      {
        id: "posts",
        label: "Posts",
        count: postsCount,
        onClick: getCommunityPosts,
      },
      {
        id: "members",
        label: "Members",
        count: membersCount,
        onClick: getCommunityMembers,
      },
    ],
    [membersCount, postsCount]
  );

  const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files;

    if (!file) return;
    const reader = new FileReader();

    reader.onload = () => {
      setBannerImagesrc(reader.result as string);
      setShowBannerCrop(true);
    };

    reader.readAsDataURL(file[0]);
  };

  // Infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >=
          document.body.offsetHeight - 300 &&
        hasMore &&
        !loading
      ) {
        loadMorePosts();
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [nextCursor, hasMore, loading]);

  if (loading) return <ProfileSkeleton />;
  if (!data?.getCommunityData.community || !data?.getCommunityData.success)
    return <div className="m-auto">No Community found</div>;

  return (
    <div className="w-full -mt-20 min-h-[700px] border border-[hsl(var(--border))]">
      {/* Banner */}
      <div className="relative w-full lg:h-72 h-48 bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--secondary))] rounded-b-2xl shadow-md">
        {/* Community Logo */}
        <div className="absolute -bottom-12 left-8 flex items-center rounded-full">
          <div className="w-24 h-24 rounded-full bg-[hsl(var(--background))] border-4 border-white shadow-lg flex items-center justify-center text-3xl font-bold text-[hsl(var(--input))]">
            {imgUrl ? (
              <Image
                src={imgUrl}
                alt={name}
                width={100}
                height={100}
                className="rounded-full object-contain"
              />
            ) : (
              <p>C</p>
            )}
          </div>
          <div className="ml-4">
            <h1 className="text-2xl font-bold text-white">{name}</h1>
            <p className="text-sm pt-5 max-w-md">{description}</p>
          </div>
        </div>
        {bannerUrl && (
          <Image
            src={bannerUrl}
            alt={name}
            width={1000}
            height={100}
            className="h-full rounded-b-2xl"
          />
        )}
        {isOwnCommunity && (
          <label
            title="Upload Banner"
            className="absolute bottom-3 right-3 rounded-full cursor-pointer active:scale-95 bg-gray-600"
          >
            <Upload size={33} className="p-2 text-white" />
            <input
              type="file"
              onChange={handleBannerFileChange}
              className="hidden"
              accept="image/*"
            />
          </label>
        )}
        {/* Overlay Cropper */}
        {showBannerCrop && bannerImageSrc && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center overflow-auto bg-black/30 backdrop-blur-sm">
            <ImageCropper
              aspect={16 / 9}
              loading={cropLoading}
              shape="rect"
              onClose={() => setShowBannerCrop(false)}
              imageSrc={bannerImageSrc}
              onCropDone={async (croppedFile) => {
                const url = await uploadImage(croppedFile);
                if (url) {
                  const res = await updateCommunity({
                    variables: {
                      communityId,
                      data: {
                        bannerUrl: url,
                      },
                    },
                  });

                  const ok = res.data && res.data.updateCommunity.success;
                  if (!ok) return;
                  setBannerUrl(url);
                  setShowBannerCrop(false);
                }
              }}
            />
          </div>
        )}
      </div>

      {/* Stats + Actions */}
      <div className=" mt-16 px-8 flex items-center gap-10  text-center">
        <div>
          <p className="text-lg font-semibold text-[hsl(var(--input))]">
            {manageHighValue(membersCount)}
          </p>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Members</p>
        </div>
        <div>
          <p className="text-lg font-semibold text-[hsl(var(--input))]">
            {manageHighValue(postsCount)}
          </p>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Posts</p>
        </div>
        {isOwnCommunity ? (
          <button
            onClick={() => setOpenEdit(true)}
            className="ml-auto px-4 py-2 rounded-lg bg-[hsl(var(--input))] text-[hsl(var(--popover))] font-medium hover:opacity-90 transition"
          >
            Edit Community
          </button>
        ) : (
          <CommunityBtn
            loggedInUserId={loggedInUserId}
            communityId={communityId}
            userId={loggedInUserId}
            communityJoinedStatus={isMember}
            setCommunityJoinedStatus={setIsMember}
          />
        )}
      </div>

      <EditCommunity
        isOpen={openEdit}
        onClose={() => setOpenEdit(false)}
        defaultData={{
          id: data.getCommunityData.community.id,
          name,
          description,
          imgUrl,
          communityType,
        }}
        onSave={onCommunityUpdate}
        loading={updateLoading}
        onImageCrop={uploadImage}
      />

      {data.getCommunityData.community.communityType === "PRIVATE" &&
      isMember !== "Joined" ? (
        <div className="w-full min-h-[50vh] flex items-center justify-center border-t border-[hsl(var(--border))]">
          <div className="flex flex-col items-center justify-center gap-3 ">
            <Lock size={48} />
            <p className="text-lg font-semibold text-[hsl(var(--input))]">
              Community is Private
            </p>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Join this Community to see their posts
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="mt-8 border-b border-[hsl(var(--border))] px-8">
            <div className="relative flex gap-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as "posts" | "members");
                    tab.onClick();
                  }}
                  className={`pb-3 text-sm font-medium ${
                    activeTab === tab.id
                      ? "text-[hsl(var(--input))] border-b-2 border-[hsl(var(--primary))]"
                      : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--input))]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
              {isMember === "Joined" && (
                <div
                  onClick={confirmLeave}
                  className="absolute  right-0 p-2 cursor-pointer text-red-500"
                  title="Exit Community"
                >
                  <LogOut size={18} />
                </div>
              )}
            </div>
          </div>

          {/* Content */}

          <div className="px-8 py-6 min-w-full">
            {activeTab === "posts" && (
              <>
                {postsLoading ? (
                  <div className="flex justify-center items-center">
                    <Spinner size={28} />
                  </div>
                ) : posts.length === 0 ? (
                  <div className="bg-[hsl(var(--background))]  rounded-xl text-center sp-4 mb-4">
                    <h2 className="font-semibold text-[hsl(var(--input))]">
                      Welcome to the community 🎉
                    </h2>
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">
                      Introduce yourself and connect with others.
                    </p>
                  </div>
                ) : (
                  posts.map((post) => (
                    <PostCard
                      postData={post}
                      showBtn
                      key={post.id}
                      userId={loggedInUserId}
                      onDelete={() => {
                        setPosts((prev) =>
                          prev.filter((p) => p.id !== post.id)
                        );
                        setPostsCount(postsCount - 1);
                      }}
                    />
                  ))
                )}
              </>
            )}

            {activeTab === "members" && (
              <>
                {membersLoading ? (
                  <div className="flex justify-center items-center">
                    <Spinner size={28} />
                  </div>
                ) : members.length === 0 ? (
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">
                    No members found.
                  </p>
                ) : (
                  <div className="w-full">
                    {members.map((member) => (
                      <MemberListItem
                        removeMember={() =>
                          removeMembership(
                            member.id,
                            data.getCommunityData.community.ownerId
                          )
                        }
                        removeLoading={removeLoading}
                        member={member}
                        key={member.id}
                        loggedInUserId={loggedInUserId}
                        communityOwnerId={
                          data.getCommunityData.community.ownerId
                        }
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default CommunityCard;

function MemberListItem({
  member,
  loggedInUserId,
  communityOwnerId,
  removeMember,
  removeLoading,
}: {
  member: User;
  loggedInUserId: string | null;
  communityOwnerId: string;
  removeLoading: boolean;
  removeMember: () => void;
}) {
  const router = useRouter();
  const [followStatus, setFollowStatus] = useState<
    "Follow" | "Follow Back" | "Following" | "Requested"
  >();

  useEffect(() => {
    setFollowStatus(member.followStatus);
  }, [member.followStatus]);

  return (
    <div className="flex mt-3 w-full items-center justify-between gap-3 bg-[hsl(var(--background))] hover:shadow-sm p-3 rounded-lg">
      <div className="flex items-center justify-center gap-3">
        <span className="w-10 h-10 rounded-full bg-[hsl(var(--secondary))]  text-white font-bold overflow-hidden">
          {member.imgUrl ? (
            <Image
              src={member.imgUrl}
              alt={member.name}
              width={40}
              height={40}
              className="rounded-full object-cover bg-white"
            />
          ) : (
            member.name.charAt(0)
          )}
        </span>
        <span
          onClick={() => router.push(`/view/${member.id}`)}
          className="text-sm font-medium text-[hsl(var(--input))] "
        >
          {member.name}
          {loggedInUserId === member.id && (
            <span className="inline mx-2 font-semibold">(You)</span>
          )}
        </span>
      </div>

      {loggedInUserId !== member.id &&
        (loggedInUserId === communityOwnerId ? (
          <button
            onClick={removeMember}
            className="rounded-md lg:min-w-24 min-w-20 text-sm border border-red-400 text-red-500 px-3 py-1"
          >
            {removeLoading ? "Removing" : "Remove"}
          </button>
        ) : (
          <FollowBtn
            loggedInUserId={loggedInUserId}
            followerId={loggedInUserId}
            followingId={member.id}
            followStatus={followStatus}
            setFollowStatus={setFollowStatus}
          />
        ))}
    </div>
  );
}

function EditCommunity({
  isOpen,
  loading,
  onClose,
  onSave,
  onImageCrop,
  defaultData,
}: EditCommunityProps) {
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string | undefined>("");
  const [imgUrl, setImgUrl] = useState<string>("");
  const [imageSrc, setImageSrc] = useState<string>("");
  const [communityType, setCommunityType] = useState<"PUBLIC" | "PRIVATE">();
  const [showCropper, setShowCropper] = useState<boolean>(false);
  const [cropLoading, setCropLoading] = useState<boolean>(false);

  useEffect(() => {
    setName(defaultData.name);
    setImgUrl(defaultData.imgUrl);
    setDescription(defaultData.description);
    setCommunityType(defaultData.communityType);
  }, []);

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      setImageSrc(reader.result as string);
      setShowCropper(true);
    };

    reader.readAsDataURL(file);
  };

  const updateImage = async (croppedFile: File) => {
    setCropLoading(true);
    const url = await onImageCrop(croppedFile);

    if (!url) return;

    setImgUrl(url);
    setShowCropper(false);
    setCropLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Blurred background */}
      <div
        className="absolute inset-0 bg-[hsl(var(--background))]/70 backdrop-blur-md"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md p-6 rounded-2xl shadow-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
        <h2 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-4">
          Edit Profile
        </h2>

        {/* Profile Image Upload */}
        <div className="flex flex-col items-center mb-4">
          <label className="relative cursor-pointer" title="Click to edit">
            {imgUrl ? (
              <Image
                width={1000}
                height={1000}
                src={imgUrl}
                alt="community img Preview"
                className="w-24 h-24 p-2 rounded-full object-cover border-2 border-[hsl(var(--border))]"
              />
            ) : (
              <div className="w-24 h-24 rounded-full flex flex-col justify-center items-center bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]">
                <Upload size={21} />
                Upload
              </div>
            )}
            <input
              disabled={loading}
              type="file"
              accept="image/*"
              onChange={handleImage}
              className="hidden"
            />
          </label>
        </div>

        {/* Name input */}
        <input
          type="text"
          disabled={loading}
          placeholder="Enter name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-1 rounded-lg border border-[hsl(var(--border))]  outline-none mb-3"
        />

        {/* Description input */}
        <textarea
          placeholder="Enter description"
          disabled={loading}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full min-h-28 text-sm resize-none p-2 rounded-lg border border-[hsl(var(--border))] outline-none mb-5"
        />

        <div className="px-2 text-sm">
          <label>Community Mode : </label>
          <select
            onChange={(e) =>
              setCommunityType(e.target.value as "PUBLIC" | "PRIVATE")
            }
            value={communityType}
            className="border rounded border-[hsl(var(--border))] p-2 text-[hsl(var(--input))]"
          >
            <option value="PUBLIC">PUBLIC</option>
            <option value="PRIVATE">PRIVATE</option>
          </select>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:opacity-80 transition"
          >
            Cancel
          </button>
          <button
            disabled={loading}
            onClick={() => onSave(name, imgUrl, description, communityType)}
            className={cn(
              "px-4 py-2 rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90 transition",
              loading && "opacity-70"
            )}
          >
            {loading ? "Saving" : "Save"}
          </button>
        </div>

        {/* Overlay Cropper */}
        {showCropper && imageSrc && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <ImageCropper
              imageSrc={imageSrc}
              aspect={1}
              shape="round"
              onClose={() => setShowCropper(false)}
              onCropDone={updateImage}
              loading={cropLoading}
            />
          </div>
        )}
      </div>
    </div>
  );
}
