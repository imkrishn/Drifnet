export interface PostResponse {
  createPost: {
    success: boolean;
    message: string;
    warnAI: string;
  };
}

export type Community = {
  id: string;
  name: string;
  description: string;
  imgUrl: string;
  membersCount: number;
  isRequested: boolean;
  isCommunityMember: boolean;
};

export type User = {
  id: string;
  name: string;
  imgUrl: string;
  designation?: string;
  email?: string;
  followersCount?: number;
  followingCount?: number;
  isRequested: boolean;
  followsCurrentUser: boolean;
  isFollowedByCurrentUser: boolean;
};

export type Post = {
  id: string;
  title: string;
  body: string;
  imgUrls: string[];
  community?: Community;
  user: User;
  commentsCount: number;
  likesCount?: number;
  isLiked: Boolean;
  isDisliked: Boolean;
  createdAt: string;
};

export interface Comment {
  id: string;
  content: string;
  user: User;
  parentCommentId?: string;
  likeCount: number;
  isLiked: Boolean;
  createdAt: string;
}

export interface UserPostsResponse {
  getUserPosts: {
    success: boolean;
    message: string;
    posts: Post[];
  };
}

export interface CommentsResponse {
  getComments: {
    success: boolean;
    message: string;
    comments: Comment[];
  };
}

export interface AddCommentResponse {
  addComment: {
    success: boolean;
    message: string;
    warnAI: string;
    comments: Comment[];
  };
}

export interface EditCommentResponse {
  editComment: {
    success: boolean;
    message: string;
  };
}

export interface DeleteCommentResponse {
  deleteComment: {
    success: boolean;
    message: string;
  };
}

export interface DeletePostResponse {
  deletePost: {
    success: boolean;
    message: string;
  };
}

export interface ReportResponse {
  report: {
    success: boolean;
    message: string;
  };
}

export interface TrendingPostResponse {
  getTrendingPosts: {
    success: boolean;
    message: string;
    posts: Post[];
    nextCursor: string;
    hasNextPage: boolean;
  };
}
