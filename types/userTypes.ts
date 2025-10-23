import { string } from "zod";

export interface UserCreateResponse {
  createUser: {
    success: boolean;
    message: string;
    user: {
      id: string;
      isVerified: boolean;
    };
  };
}

export interface UserGetResponse {
  listUserByEmail: {
    success: boolean;
    message: string;
    data: {
      id: string;
      verificationToken: string;
      verificationTokenTime: Date | string;
    }[];
  };
}

export interface UserUpdateResponse {
  updateUser: {
    success: boolean;
    message: string;
  };
}

export interface VerifyResetPasswordResponse {
  verifyResetPassword: {
    success: boolean;
    message: string;
  };
}
export interface ResetPasswordResponse {
  resetPassword: {
    success: boolean;
    message: string;
  };
}

export interface LoginResponse {
  loginUser: {
    success: boolean;
    message: string;
  };
}

export interface FollowResponse {
  followUnfollowAction: {
    success: boolean;
    message: string;
    status?: "Follow" | "Following" | "Requested" | "Follow Back";
  };
}
export interface AcceptRequestResponse {
  acceptRequest: {
    success: boolean;
    message: string;
  };
}
export interface SignoutResponse {
  signout: {
    success: boolean;
    message: string;
  };
}

export interface GetFollowerResponse {
  getFollowers: {
    success: boolean;
    message: string;
    data: {
      id: string;
      name: string;
      imgUrl: string;
      isFollowBack: boolean;
    }[];
  };
}

export interface GetFollowingResponse {
  getFollowings: {
    success: boolean;
    message: string;
    data: {
      id: string;
      name: string;
      imgUrl: string;
    }[];
  };
}

export interface JoinCommunityResponse {
  joinLeaveCommunity: {
    success: boolean;
    message: string;
    status?: "Join" | "Joined" | "Requested";
    communityName?: string;
  };
}

export type Notification = {
  id: string;
  type:
    | "FOLLOW_REQUEST"
    | "FOLLOWED"
    | "JOIN_REQUEST_COMMUNITY"
    | "JOINED_COMMUNITY"
    | "LIKE_POST"
    | "COMMENT_POST"
    | "PROFILE_VIEW"
    | "REPORT";
  sender: {
    id: string;
    name: string;
    imgUrl: string;
  };
  receiver: {
    id: string;
    name: string;
    imgUrl: string;
  };
  status: "READ" | "UNREAD";
  createdAt: string | Date;
  postId: string | null;
  communityId: string | null;
  commentId: string | null;
};

export interface GetNotificationsResponse {
  getNotifications: {
    success: boolean;
    message: string;
    data: Notification[];
  };
}

export interface Community {
  id: string;
  name: string;
}

export type LoggedInUser = {
  id: string;
  name: string;
  email: string;
  imgUrl: string;
  _count: {
    follower: number;
    following: number;
  };
  communityMemberships: { community: Community }[];
} | null;

export interface GetUserResponse {
  getUser: {
    success: boolean;
    message: string;
    user: {
      id: string;
      name: string;
      imgUrl: string;
      designation?: string;
      accountType: "PUBLIC" | "PRIVATE";
      followersCount: number;
      followingCount: number;
      postsCount: number;
      followStatus: "Following" | "Follow Back" | "Follow";
    };
  };
}

export interface SearchResponse {
  handleSearch: {
    success: boolean;
    message: string;
    data: {
      id: string;
      name: string;
      imgUrl: string;
      designation?: string;
      _count?: { members: number };
    }[];
    nextCursor: string;
  };
}
