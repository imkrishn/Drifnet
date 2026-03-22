import Post, { PostInput } from "@/modules/post.module";

export const postResolver = {
  Query: {
    //get user posts

    getUserPosts: async (_: unknown, { userId }: { userId: string }) => {
      return await Post.getUserPosts(userId);
    },

    // getComments

    getComments: async (
      _: unknown,
      {
        postId,
        userId,
        parentCommentId,
      }: { postId: string; userId?: string; parentCommentId?: string }
    ) => {
      return await Post.getComments({ postId, userId, parentCommentId });
    },

    //getTrendingPosts

    getTrendingPosts: async (
      _: unknown,
      {
        lastPostId,
        userId,
        type,
      }: { lastPostId?: string; userId?: string; type: "top" | "new" }
    ) => {
      return await Post.getTrendingPosts({ lastPostId, userId, type });
    },
  },
  Mutation: {
    //create post
    createPost: async (_: unknown, { data }: { data: PostInput }) => {
      return await Post.create(data);
    },

    //actions like/dislike post

    likeDislikeActions: async (
      _: unknown,
      {
        postId,
        userId,
        commentId,
        type,
      }: {
        postId: string;
        userId: string;
        commentId?: string;
        type: "LIKE" | "DISLIKE";
      }
    ) => {
      return await Post.likeDislikeActions({ postId, userId, commentId, type });
    },

    //add comments

    addComment: async (
      _: unknown,
      {
        postId,
        userId,
        parentCommentId,
        content,
      }: {
        postId: string;
        userId: string;
        parentCommentId?: string;
        content: string;
      }
    ) => {
      return await Post.addComment({
        postId,
        userId,
        parentCommentId,
        content,
      });
    },

    //edit comment

    editComment: async (
      _: unknown,
      {
        commentId,
        userId,
        content,
      }: { commentId: string; userId: string; content: string }
    ) => {
      return await Post.editComment({ commentId, userId, content });
    },

    //delete comment

    deleteComment: async (
      _: unknown,
      { commentId, userId }: { commentId: string; userId: string }
    ) => {
      return await Post.deleteComment({ commentId, userId });
    },

    //report user

    report: async (
      _: unknown,
      {
        commentId,
        postId,
        reportedUserId,
        reason,
      }: {
        commentId?: string;
        postId?: string;
        reportedUserId: string;
        reason: string;
      }
    ) => {
      return await Post.report({ commentId, reportedUserId, postId, reason });
    },

    //delete post

    deletePost: async (
      _: unknown,
      { postId, userId }: { postId: string; userId: string }
    ) => {
      return await Post.deletePost({ postId, userId });
    },
  },
};
