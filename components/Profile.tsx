"use client";

import { useEffect, useMemo, useState } from "react";
import PostCard from "./Post";
import { Post, UserPostsResponse } from "@/types/postType";
import gql from "graphql-tag";
import { usePathname } from "next/navigation";
import { useLazyQuery, useMutation, useQuery } from "@apollo/client/react";
import { PostSkeleton } from "./loading/HomeSkeleton";
import {
  GetFollowerResponse,
  GetFollowingResponse,
  GetUserResponse,
  UserUpdateResponse,
} from "@/types/userTypes";
import ProfileSkeleton from "./loading/ProfileSkelton";
import { FollowBtn } from "./Buttons";
import Spinner from "./loading/Spinner";
import { Lock, Upload } from "lucide-react";
import ImageCropper from "./ImageCropper";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AppDispatch, RootState } from "@/redux/store";
import { useDispatch, useSelector } from "react-redux";
import { setcurrentUser } from "@/redux/slices/currentUserSlice";

interface EditProfileProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    name: string,
    imgUrl: string,
    designation?: string,
    accountType?: "PUBLIC" | "PRIVATE"
  ) => void;
  loading: boolean;
  defaultData: {
    id: string;
    name: string;
    imgUrl: string;
    designation?: string;
    accountType?: "PUBLIC" | "PRIVATE";
  };
}

const USER_POSTS = gql`
  query GetUserPosts($userId: String!) {
    getUserPosts(userId: $userId) {
      success
      message
      posts {
        body
        commentsCount
        createdAt
        id
        imgUrls
        title
        user {
          name
          imgUrl
          id
          email
        }
        community {
          description
          id
          imgUrl
          membersCount
          name
        }
        likesCount
        isLiked
        isDisliked
      }
    }
  }
`;

const USER_INFO = gql`
  query GetUser($userId: String!, $loggedInUserId: String!) {
    getUser(userId: $userId, loggedInUserId: $loggedInUserId) {
      success
      message
      user {
        id
        name
        designation
        imgUrl
        accountType
        followersCount
        followingCount
        postsCount
        followStatus
      }
    }
  }
`;

const GET_FOLLOWINGS = gql`
  query GetFollowings($userId: String!) {
    getFollowings(userId: $userId) {
      success
      message
      data {
        id
        name
        imgUrl
      }
    }
  }
`;

const GET_FOLLOWERS = gql`
  query GetFollowers($userId: String!) {
    getFollowers(userId: $userId) {
      success
      message
      data {
        id
        name
        imgUrl
        isFollowBack
      }
    }
  }
`;

const UPDATE_PROFILE = gql`
  mutation UpdateUser($id: String!, $data: UpdateUserInput!) {
    updateUser(id: $id, data: $data) {
      success
      message
    }
  }
`;

// Profile card
export default function ProfileCard() {
  const [activeTab, setActiveTab] = useState<
    "posts" | "followers" | "following"
  >("posts");
  const pathname = usePathname();
  const userId = pathname.split("/")[2];

  const loggedInUserId = useSelector(
    (state: RootState) => state.loggedInUserId
  );

  const dispatch = useDispatch<AppDispatch>();

  // Queries
  const [getUserPosts, { loading: postsLoading }] =
    useLazyQuery<UserPostsResponse>(USER_POSTS, {
      fetchPolicy: "network-only",
    });
  const { data, loading: userLoading } = useQuery<GetUserResponse>(USER_INFO, {
    variables: { userId, loggedInUserId },
    skip: !userId,
    fetchPolicy: "cache-and-network",
  });

  const [getFollowers, { loading: followersLoading }] =
    useLazyQuery<GetFollowerResponse>(GET_FOLLOWERS, {
      fetchPolicy: "network-only",
    });
  const [getFollowings, { loading: followingsLoading }] =
    useLazyQuery<GetFollowingResponse>(GET_FOLLOWINGS, {
      fetchPolicy: "network-only",
    });

  const [updateProfileData, { loading: profileUpdateLoading }] =
    useMutation<UserUpdateResponse>(UPDATE_PROFILE);

  const isOwnProfile = data?.getUser.user.id === loggedInUserId;

  const [openEditProfile, setOpenEditProfile] = useState<boolean>(false);

  const [name, setName] = useState("");
  const [designation, setDesignation] = useState<string | undefined>("");
  const [imgUrl, setImgUrl] = useState("");
  const [accountType, setAccountType] = useState<"PUBLIC" | "PRIVATE">();
  const [followStatus, setFollowStatus] = useState<
    "Follow Back" | "Following" | "Follow" | "Requested"
  >();

  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [postsCount, setPostsCount] = useState(0);

  const [posts, setPosts] = useState<Post[]>([]);
  const [followings, setFollowings] = useState<
    { id: string; name: string; imgUrl: string }[]
  >([]);
  const [followers, setFollowers] = useState<
    { id: string; name: string; imgUrl: string; isFollowBack: boolean }[]
  >([]);

  //sync intial data

  useEffect(() => {
    if (data?.getUser.success && data?.getUser.user) {
      const {
        name,
        designation,
        accountType,
        imgUrl,
        postsCount,
        followersCount,
        followingCount,
        followStatus,
      } = data.getUser.user;
      setFollowerCount(followersCount);
      setFollowingCount(followingCount);
      setPostsCount(postsCount);
      setName(name);
      setImgUrl(imgUrl);
      setDesignation(designation);
      setAccountType(accountType);
      setFollowStatus(followStatus);
    }
  }, [data]);

  // Fetch user posts
  const fetchUserPosts = async () => {
    if (!userId) return;
    setActiveTab("posts");
    try {
      const res = await getUserPosts({ variables: { userId } });
      if (res.data?.getUserPosts?.success) {
        setPosts(res.data.getUserPosts.posts);
      }
    } catch (err) {
      console.error("Error fetching user posts:", err);
    }
  };

  // Fetch followers
  const getFollowersList = async () => {
    if (!userId) return;
    setActiveTab("followers");
    try {
      const res = await getFollowers({ variables: { userId } });
      if (res.data?.getFollowers?.success) {
        setFollowers(res.data.getFollowers.data);
        setFollowerCount(res.data.getFollowers.data.length);
      }
    } catch (err) {
      console.error("Error fetching user followers:", err);
    }
  };

  // Fetch followings
  const getFollowingsList = async () => {
    if (!userId) return;
    setActiveTab("following");
    try {
      const res = await getFollowings({ variables: { userId } });
      if (res.data?.getFollowings?.success) {
        setFollowings(res.data.getFollowings.data);
        setFollowingCount(res.data.getFollowings.data.length);
      }
    } catch (err) {
      console.error("Error fetching user followings:", err);
    }
  };

  // Tabs
  const tabs = useMemo(
    () => [
      {
        id: "posts",
        label: "Posts",
        count: postsCount,
        onClick: fetchUserPosts,
      },
      {
        id: "followers",
        label: "Followers",
        count: followerCount,
        onClick: getFollowersList,
      },
      {
        id: "following",
        label: "Followings",
        count: followingCount,
        onClick: getFollowingsList,
      },
    ],
    [followerCount, followingCount, data?.getUser.user?.postsCount]
  );
  const activeIndex = tabs.findIndex((t) => t.id === activeTab);

  function updateFollowingUI(id: string) {
    const updated = followings.filter((f) => f.id !== id);
    setFollowings(updated);
    setFollowingCount(updated.length);
  }

  //update on edit

  const handleProfileUpdate = async (
    name: string,
    imgUrl: string,
    designation?: string,
    accountType?: "PRIVATE" | "PUBLIC"
  ) => {
    if (!name.trim() || !imgUrl)
      return toast.warning("Required fields are missing");

    try {
      const res = await updateProfileData({
        variables: {
          id: loggedInUserId,
          data: {
            name,
            imgUrl,
            designation,
            accountType,
          },
        },
      });

      const ok = res.data?.updateUser.success;

      if (ok) {
        setName(name);
        setImgUrl(imgUrl);
        setDesignation(designation);
        setAccountType(accountType);
        setOpenEditProfile(false);
        dispatch(
          setcurrentUser({
            name,
            url: imgUrl,
          })
        );
      }
    } catch (err) {
      console.error("Error updating profile :", err);
      toast.error("Failed to update profile");
    }
  };

  //update follow btn ui

  function onFollowBtnClick() {
    if (followStatus === "Following") {
      console.log("unfollow");
      setFollowerCount(followerCount - 1);
    } else if (followStatus === "Follow Back" || followStatus === "Follow") {
      console.log("follow");
      setFollowerCount(followerCount + 1);
    }
  }

  useEffect(() => {
    if (userId) fetchUserPosts();
  }, [userId]);

  if (userLoading) return <ProfileSkeleton />;
  if (!data?.getUser.user || !data?.getUser.success)
    return <div className="m-auto">Not found</div>;

  return (
    <div className="w-full min-h-[700px]  lg:-mt-32 border border-[hsl(var(--border))] overflow-hidden">
      {/* Banner */}
      <div className="relative h-72 bg-gradient-to-r from-indigo-600 via-sky-500 to-cyan-400" />

      {/* Header */}
      <div className="relative px-8 pb-6 -mt-14">
        <div className="absolute -top-4 left-8">
          {imgUrl && (
            <img
              src={imgUrl}
              alt={name}
              className="w-28 h-28 rounded-full ring-4 bg-white ring-[hsl(var(--popover))] shadow-lg object-cover"
            />
          )}
        </div>

        <div className="lg:ml-40 ml-32 flex lg:flex-row flex-col lg:items-start justify-between items-center gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-white">{name}</h2>
            {
              <p className="text-sm min-h-6 text-[hsl(var(--user-designation))] mt-1 lg:text-left text-center">
                {designation}
              </p>
            }
            <div className="flex justify-evenly gap-4 text-center mb-4">
              <div className="flex-1">
                <p className="text-lg font-semibold">{followerCount}</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  Followers
                </p>
              </div>
              <div className="flex-1">
                <p className="text-lg font-semibold">{followingCount}</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  Followings
                </p>
              </div>
            </div>
          </div>

          <div>
            {isOwnProfile ? (
              <button
                onClick={() => setOpenEditProfile(true)}
                className="px-4 py-2 rounded-lg bg-[hsl(var(--input))] text-[hsl(var(--popover))] font-medium hover:opacity-90 transition"
              >
                Edit Profile
              </button>
            ) : (
              <FollowBtn
                loggedInUserId={loggedInUserId}
                followerId={loggedInUserId}
                followingId={data.getUser.user.id}
                followStatus={followStatus}
                setFollowStatus={setFollowStatus}
                onClick={onFollowBtnClick}
              />
            )}
            <EditProfile
              loading={profileUpdateLoading}
              onSave={handleProfileUpdate}
              isOpen={openEditProfile}
              onClose={() => setOpenEditProfile(false)}
              defaultData={{
                id: loggedInUserId!,
                name: name,
                imgUrl: imgUrl,
                designation: designation,
                accountType: accountType,
              }}
            />
          </div>
        </div>
      </div>
      {data.getUser.user.accountType === "PRIVATE" &&
      !isOwnProfile &&
      followStatus !== "Following" ? (
        <div className="w-full min-h-[50vh] flex items-center justify-center border-t border-[hsl(var(--border))]">
          <div className="flex flex-col items-center justify-center gap-3 ">
            <Lock size={48} />
            <p className="text-lg font-semibold text-[hsl(var(--input))]">
              Account is Private
            </p>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Follow this account to see their posts
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="border-t border-[hsl(var(--border))]">
            <div className="relative">
              <div className="flex">
                {tabs.map((t) => (
                  <button
                    key={t.id}
                    onClick={t.onClick}
                    className={`flex-1 px-6 py-4 text-center ${
                      activeTab === t.id
                        ? "text-[hsl(var(--input))] font-semibold"
                        : "text-gray-500"
                    }`}
                  >
                    <div className="text-sm">{t.label}</div>
                    <div className="text-xs mt-1 text-gray-400">{t.count}</div>
                  </button>
                ))}
              </div>
              <div
                className="absolute bottom-0 left-0 h-0.5 bg-indigo-600 transition-transform duration-300"
                style={{
                  width: `${100 / tabs.length}%`,
                  transform: `translateX(${activeIndex * 100}%)`,
                }}
              />
            </div>
          </div>

          {/* Content */}
          <div className="px-8 py-6 min-h-[60vh]">
            {activeTab === "posts" &&
              (postsLoading ? (
                <PostSkeleton />
              ) : posts.length > 0 ? (
                posts.map((post) => (
                  <PostCard
                    key={post.id}
                    postData={post}
                    userId={loggedInUserId}
                    onDelete={() => {
                      setPosts((prev) => prev.filter((p) => p.id !== post.id));
                      setPostsCount(postsCount - 1);
                    }}
                  />
                ))
              ) : (
                <div className="text-[hsl(var(--sidebar-text))] flex items-center justify-center w-full h-[50vh]">
                  No Posts Yet. Create a new Post
                </div>
              ))}

            {activeTab === "followers" && (
              <div className="space-y-3">
                {followersLoading ? (
                  <div className="flex justify-center items-center">
                    <Spinner size={28} />
                  </div>
                ) : followers.length > 0 ? (
                  followers.map((f) => <UserListItem key={f.id} user={f} />)
                ) : (
                  <div className="text-[hsl(var(--sidebar-text))] flex items-center justify-center w-full h-[50vh]">
                    None had followed you
                  </div>
                )}
              </div>
            )}

            {activeTab === "following" && (
              <div className="space-y-3">
                {followingsLoading ? (
                  <div className="flex justify-center items-center">
                    <Spinner size={28} />
                  </div>
                ) : followings.length > 0 ? (
                  followings.map((f) => (
                    <UserListItem
                      key={f.id}
                      user={f}
                      showFollowButton
                      loggedInUserId={loggedInUserId!}
                      followerId={userId}
                      followingId={f.id}
                      updateUI={() => updateFollowingUI(f.id)}
                    />
                  ))
                ) : (
                  <div className="text-[hsl(var(--sidebar-text))] flex items-center justify-center w-full h-[50vh]">
                    None had you follow
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// Follow Card
function UserListItem({
  user,
  showFollowButton = false,
  loggedInUserId,
  followerId,
  followingId,
  updateUI,
}: {
  user: { id: string; name: string; imgUrl: string; isFollowBack?: boolean };
  showFollowButton?: boolean;
  loggedInUserId?: string;
  followerId?: string;
  followingId?: string;
  updateUI?: () => void;
}) {
  const [followStatus, setFollowStatus] = useState<
    "Follow" | "Following" | "Requested" | "Follow Back" | undefined
  >("Following");

  return (
    <div className="flex items-center justify-between p-3 hover:shadow-sm transition">
      <div className="flex items-center gap-3">
        <img
          src={user.imgUrl}
          alt={user.name}
          className="w-12 h-12 rounded-full object-cover"
        />
        <div className="font-medium text-[hsl(var(--input))]">{user.name}</div>
      </div>
      {showFollowButton && (
        <FollowBtn
          onClick={updateUI}
          loggedInUserId={loggedInUserId!}
          followerId={followerId!}
          followingId={followingId!}
          followStatus={followStatus}
          setFollowStatus={setFollowStatus}
        />
      )}
    </div>
  );
}

function EditProfile({
  isOpen,
  loading,
  onClose,
  onSave,
  defaultData,
}: EditProfileProps) {
  const [name, setName] = useState("");
  const [designation, setDesignation] = useState<string | undefined>("");
  const [imgUrl, setImgUrl] = useState("");
  const [imageSrc, setImageSrc] = useState<string>("");
  const [accountType, setAccountType] = useState<"PUBLIC" | "PRIVATE">();
  const [showCropper, setShowCropper] = useState<boolean>(false);
  const [cropLoading, setCropLoading] = useState<boolean>(false);

  useEffect(() => {
    setName(defaultData.name);
    setImgUrl(defaultData.imgUrl);
    setDesignation(defaultData.designation);
    setAccountType(defaultData.accountType);
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

  const updateProfilePicture = async (croppedFile: File) => {
    try {
      setCropLoading(true);
      const resImage = await fetch(
        `${process.env.NEXT_PUBLIC_URL}/api/upload`,
        {
          method: "POST",
          body: (() => {
            const formData = new FormData();

            formData.append("files", croppedFile, croppedFile.name);

            return formData;
          })(),
        }
      );
      if (!resImage.ok) return toast.error("Image cropped failed");
      const result = await resImage.json();

      setImgUrl(result.files[0].original);
      setShowCropper(false);
    } catch (err) {
      console.error("Failed to upload image :", err);
      toast.error("Image cropped Failed");
    } finally {
      setCropLoading(false);
    }
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
              <img
                src={imgUrl}
                alt="Profile Preview"
                className="w-24 h-24 rounded-full object-cover border-2 border-[hsl(var(--border))]"
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
          className="w-full p-2 rounded-lg border border-[hsl(var(--border))]  outline-none mb-3"
        />

        {/* Designation input */}
        <textarea
          placeholder="Enter designation"
          disabled={loading}
          value={designation}
          onChange={(e) => setDesignation(e.target.value)}
          className="w-full min-h-28 resize-none p-2 rounded-lg border border-[hsl(var(--border))] outline-none mb-5"
        />

        <div className="px-2 text-sm">
          <label>Account Mode : </label>
          <select
            onChange={(e) =>
              setAccountType(e.target.value as "PUBLIC" | "PRIVATE")
            }
            value={accountType}
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
            onClick={() => onSave(name, imgUrl, designation, accountType)}
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
              shape="round"
              onClose={() => setShowCropper(false)}
              onCropDone={updateProfilePicture}
              loading={cropLoading}
            />
          </div>
        )}
      </div>
    </div>
  );
}
