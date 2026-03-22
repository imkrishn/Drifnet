import { Community } from "./userTypes";

export interface CommunityResponse {
  createCommunity: {
    success: boolean;
    message: string;
    data: Community;
  };
}

export interface GetCommunityResponse {
  getCommunityData: {
    success: boolean;
    message: string;
    community: {
      id: string;
      name: string;
      description: string;
      ownerId: string;
      communityType: "PRIVATE" | "PUBLIC";
      bannerUrl: string;
      imgUrl: string;
      isMember: "Join" | "Joined" | "Requested";
      membersCount: number;
      postsCount: number;
    };
  };
}

export type Post = {
  id: string;
  title: string;
  body: string;
  imgUrls: string[];
  isLiked: boolean;
  isDisliked: boolean;
  commentsCount: number;
  likesCount: number;
  createdAt: string;
  user: {
    id: string;
    name: string;
    imgUrl: string;
    isRequested: boolean;
    isFollowedByCurrentUser: boolean;
    followsCurrentUser: boolean;
  };
};

export interface GetCommunityPostsResponse {
  getCommunityPosts: {
    success: boolean;
    message: string;
    posts: Post[];
    nextCursor: string;
    hasMore: boolean;
  };
}

export type User = {
  id: string;
  name: string;
  imgUrl: string;
  followStatus: "Follow" | "Follow Back" | "Following" | "Requested";
};

export interface GetCommunityMembersResponse {
  getCommunityMembers: {
    success: boolean;
    message: string;
    members: User[];
  };
}

export interface UpdateCommunityResponse {
  updateCommunity: {
    success: boolean;
    message: string;
  };
}

export interface LeaveCommunityResponse {
  leaveCommunity: {
    success: boolean;
    message: string;
  };
}
export interface RemoveCommunityResponse {
  removeMember: {
    success: boolean;
    message: string;
  };
}
