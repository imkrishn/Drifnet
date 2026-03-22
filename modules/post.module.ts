import { contentFilter } from "@/lib/contentFilterAI";
import { prisma } from "@/lib/prisma";
import { sendNotification } from "@/lib/sendNotification";

export interface PostInput {
  title: string;
  body: string;
  communityId?: string;
  userId: string;
  imgUrls: string[];
}

class Post {
  //create post
  public static async create(data: PostInput) {
    const { title, body, communityId, userId, imgUrls } = data;

    if (!title.trim() || !body.trim() || !userId) {
      return { success: false, message: "Required fields are missing" };
    }

    try {
      const isSafeContent = await contentFilter(title + " " + body);

      if (isSafeContent === false) {
        return {
          success: true,
          warnAI:
            "AI detected your's post content seems intense. Let’s keep the conversation respectful.",
          message: "Content is intense",
        };
      }

      if (communityId) {
        const community = await prisma.communityMember.findFirst({
          where: {
            userId,
            communityId,
          },
        });

        if (!community) {
          return {
            success: false,
            message: "User is not a member of this community",
          };
        }

        await prisma.communityMember.update({
          where: {
            id: community.id,
          },
          data: {
            lastActive: new Date(),
          },
        });

        await prisma.post.create({
          data: {
            title,
            body,
            imgUrls: imgUrls.length > 0 ? imgUrls : [],
            userId,
            communityId,
          },
        });

        return { success: true, message: "Post created successfully" };
      }

      //  personal post
      await prisma.post.create({
        data: {
          title,
          body,
          imgUrls: imgUrls.length > 0 ? imgUrls : [],
          userId,
        },
      });

      return { success: true, message: "Post created successfully" };
    } catch (err) {
      console.error(err);
      return { success: false, message: "Failed to create post" };
    }
  }

  // get user posts
  public static async getUserPosts(userId: string) {
    if (!userId)
      return { success: false, message: "UserId is required", posts: [] };

    try {
      const posts = await prisma.post.findMany({
        where: { userId, isDeleted: false },
        select: {
          id: true,
          title: true,
          body: true,
          imgUrls: true,
          createdAt: true,
          community: {
            select: {
              id: true,
              name: true,
              description: true,
              imgUrl: true,
              _count: { select: { members: true } },
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              imgUrl: true,
              email: true,
            },
          },
          _count: {
            select: {
              comments: { where: { parentCommentId: null } },
              engagements: { where: { type: "LIKE", commentId: null } },
            },
          },
          engagements: {
            where: { userId },
            select: { type: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      const formattedPosts = posts.map((p) => {
        const engagement = p.engagements?.[0];
        return {
          id: p.id,
          title: p.title,
          body: p.body,
          imgUrls: p.imgUrls,
          createdAt: p.createdAt.toISOString(),
          community: {
            ...p.community,
            membersCount: p.community ? p.community._count.members : 0,
          },
          user: p.user,
          commentsCount: p._count.comments,
          likesCount: p._count.engagements,
          isLiked: engagement?.type === "LIKE",
          isDisliked: engagement?.type === "DISLIKE",
        };
      });

      return {
        success: true,
        message: "Posts fetched successfully",
        posts: formattedPosts,
      };
    } catch (err) {
      console.error("Error while fetching users posts :", err);
      return { success: false, message: "Failed to get user posts", posts: [] };
    }
  }

  // get trending posts
  public static async getTrendingPosts({
    lastPostId,
    userId,
    type = "top",
  }: {
    lastPostId?: string;
    userId?: string;
    type: "top" | "new";
  }) {
    try {
      const limit = 5;

      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

      const whereFilter =
        type === "top"
          ? { createdAt: { gte: twoWeeksAgo }, isDeleted: false }
          : { isDeleted: false };

      const orderByFilter =
        type === "top"
          ? [
              { engagements: { _count: "desc" } },
              { comments: { _count: "desc" } },
            ]
          : [
              { createdAt: "desc" },
              { engagements: { _count: "desc" } },
              { comments: { _count: "desc" } },
            ];

      const posts = await prisma.post.findMany({
        take: limit + 1,
        skip: lastPostId ? 1 : 0,
        cursor: lastPostId ? { id: lastPostId } : undefined,
        orderBy: orderByFilter as any,
        where: whereFilter,
        select: {
          id: true,
          title: true,
          body: true,
          imgUrls: true,
          createdAt: true,
          community: {
            select: {
              id: true,
              name: true,
              description: true,
              imgUrl: true,
              _count: { select: { members: true } },
              members: userId
                ? {
                    where: { userId },
                    select: { id: true },
                  }
                : false,
              notifications: userId
                ? {
                    where: {
                      senderId: userId,
                      type: "JOIN_REQUEST_COMMUNITY",
                      status: "UNREAD",
                    },
                    select: { id: true },
                  }
                : false,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              imgUrl: true,
              // check if logged-in user follows this post's author
              follower: userId
                ? {
                    where: { followerId: userId },
                    select: { id: true },
                  }
                : false,

              //check if logged-in-user requested to follow author

              notificationsReceived: userId
                ? {
                    where: {
                      senderId: userId,
                      type: "FOLLOW_REQUEST",
                      status: "UNREAD",
                    },
                    select: { id: true },
                  }
                : false,

              // check if post author follows logged-in user

              following: userId
                ? {
                    where: { followingId: userId },
                    select: { id: true },
                  }
                : false,
            },
          },
          _count: {
            select: {
              comments: { where: { parentCommentId: null } },
              engagements: { where: { type: "LIKE", commentId: null } },
            },
          },
          engagements: userId
            ? {
                where: { userId },
                select: { type: true },
              }
            : false,
        },
      });

      const hasNextPage = posts.length > limit;
      const paginatedPosts = hasNextPage ? posts.slice(0, limit) : posts;

      const formattedPosts = paginatedPosts.map((p) => {
        const engagement = Array.isArray(p.engagements)
          ? p.engagements[0]
          : null;

        return {
          id: p.id,
          title: p.title,
          body: p.body,
          imgUrls: p.imgUrls,
          createdAt: p.createdAt.toISOString(),
          community: {
            ...p.community,
            membersCount: p.community ? p.community._count.members : 0,
            isCommunityMember: Array.isArray(p.community?.members)
              ? p.community.members.length > 0
              : false,
            isRequested: Array.isArray(p.community?.notifications)
              ? p.community.notifications.length > 0
              : false,
          },
          user: {
            ...p.user,
            isRequested: Array.isArray(p.user.notificationsReceived)
              ? p.user.notificationsReceived.length > 0
              : false,
            isFollowedByCurrentUser: Array.isArray(p.user.follower)
              ? p.user.follower.length > 0
              : false,
            followsCurrentUser: Array.isArray(p.user.following)
              ? p.user.following.length > 0
              : false,
          },
          commentsCount: p._count.comments,
          likesCount: p._count.engagements,
          isLiked: engagement?.type === "LIKE",
          isDisliked: engagement?.type === "DISLIKE",
        };
      });

      return {
        success: true,
        message: "Posts fetched successfully",
        posts: formattedPosts,
        hasNextPage,
        nextCursor: hasNextPage
          ? formattedPosts[formattedPosts.length - 1].id
          : null,
      };
    } catch (err) {
      console.error("Error fetching trending posts : ", err);
      return {
        success: false,
        message: "Failed to fetch trending posts",
        posts: [],
      };
    }
  }

  //delete post

  public static async deletePost({
    postId,
    userId,
  }: {
    postId: string;
    userId: string;
  }) {
    if (!userId || !postId) {
      return { success: false, message: "Required fields are missing" };
    }

    try {
      await prisma.post.update({
        where: {
          id: postId,
          userId,
        },
        data: {
          isDeleted: true,
        },
      });

      await prisma.isDeleted.create({
        data: {
          postId,
          commentId: null,
          userId,
        },
      });

      return { success: true, message: "Post deleted" };
    } catch (Err) {
      console.error("Error deleting post : ", Err);
      return { success: false, message: "Failed to delete post" };
    }
  }

  //perform like/dislike actions

  public static async likeDislikeActions({
    postId,
    userId,
    commentId,
    type,
  }: {
    postId: string;
    userId: string;
    commentId?: string;
    type: "LIKE" | "DISLIKE";
  }) {
    if (!postId || !userId) {
      return { success: false, message: "Required fields are missing" };
    }

    try {
      const existing = await prisma.engagement.findFirst({
        where: {
          userId,
          postId,
          commentId: commentId ?? null,
        },
      });

      if (!existing) {
        const res = await prisma.engagement.create({
          data: { userId, postId, commentId: commentId ?? null, type },
          select: {
            post: { select: { userId: true } },
            comment: commentId ? { select: { userId: true } } : undefined,
          },
        });
        const theUserId = commentId ? res.comment?.userId : res.post?.userId;

        if (userId !== theUserId) {
          const newNotif = await prisma.notification.create({
            data: {
              type: "LIKE_POST",
              senderId: userId,
              receiverId: theUserId!,
              status: "UNREAD",
            },
            select: {
              id: true,
              createdAt: true,
              type: true,
              status: true,
              commentId: true,
              communityId: true,
              postId: true,
              sender: {
                select: {
                  id: true,
                  name: true,
                  imgUrl: true,
                },
              },
              receiver: {
                select: {
                  id: true,
                  name: true,
                  imgUrl: true,
                },
              },
            },
          });

          await sendNotification(res.post?.userId!, newNotif);
        }

        return { success: true, message: `${type} added` };
      }

      if (existing.type === type) {
        await prisma.engagement.delete({ where: { id: existing.id } });
        return { success: true, message: `Action removed` };
      }

      const res = await prisma.engagement.update({
        where: { id: existing.id },
        data: { type },
        select: { post: { select: { userId: true } } },
      });

      return { success: true, message: `Changed to ${type}` };
    } catch (err) {
      console.error("Error while performing like/dislike actions:", err);
      return {
        success: false,
        message: "Failed to perform like/dislike actions",
      };
    }
  }

  //add comments

  public static async addComment({
    postId,
    userId,
    parentCommentId,
    content,
  }: {
    postId: string;
    userId: string;
    parentCommentId?: string;
    content: string;
  }) {
    if (!postId || !userId || !content.trim())
      return {
        success: false,
        message: "Requireds fields are missing to add comments",
        comments: [],
      };

    try {
      const isSafeContent = await contentFilter(content);

      if (isSafeContent === false) {
        return {
          success: true,
          warnAI:
            "AI detected your's comment seems intense. Let’s keep the conversation respectful.",
          message: "Content is intense",
        };
      }

      const res = await prisma.comment.create({
        data: {
          userId,
          postId,
          parentCommentId,
          content,
        },
        select: {
          user: {
            select: {
              id: true,
              name: true,
              imgUrl: true,
            },
          },
          post: { select: { userId: true } },
          content: true,
          id: true,
          parentCommentId: true,
          createdAt: true,
        },
      });

      const comment = { ...res, isLiked: false, likeCount: 0, replies: [] };

      await prisma.notification.create({
        data: {
          type: "COMMENT_POST",
          senderId: userId,
          receiverId: res.post.userId,
          status: "UNREAD",
        },
      });

      if (userId !== res.post.userId) {
        const newNotif = await prisma.notification.create({
          data: {
            type: "COMMENT_POST",
            senderId: userId,
            receiverId: res.post.userId,
            status: "UNREAD",
          },
          select: {
            id: true,
            createdAt: true,
            type: true,
            status: true,
            commentId: true,
            communityId: true,
            postId: true,
            sender: {
              select: {
                id: true,
                name: true,
                imgUrl: true,
              },
            },
            receiver: {
              select: {
                id: true,
                name: true,
                imgUrl: true,
              },
            },
          },
        });

        await sendNotification(res.post?.userId!, newNotif);
      }

      return {
        success: true,
        message: "Commented created successfully",
        comments: [comment],
      };
    } catch (err) {
      console.error("Error while adding comment", err);
      return { success: false, message: "Failed to add comment", comments: [] };
    }
  }

  //get comments

  public static async getComments({
    postId,
    userId,
    parentCommentId,
  }: {
    postId: string;
    userId?: string;
    parentCommentId?: string;
  }) {
    if (!postId) {
      return {
        success: false,
        message: "Required fields are missing to get comments",
        comments: [],
      };
    }

    try {
      const comments = await prisma.comment.findMany({
        where: {
          postId,
          parentCommentId: parentCommentId ?? null,
          deletions: { none: {} },
        },
        select: {
          id: true,
          content: true,
          parentCommentId: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              imgUrl: true,
              name: true,
            },
          },
          _count: {
            select: {
              engagements: { where: { type: "LIKE" } },
            },
          },
          ...(userId
            ? {
                engagements: {
                  where: { userId, type: "LIKE" },
                  select: { id: true },
                },
              }
            : {}),
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      const formattedComments = comments.map((comment) => ({
        id: comment.id,
        content: comment.content,
        parentCommentId: comment.parentCommentId,
        user: comment.user,
        likeCount: comment._count.engagements,
        isLiked: userId ? comment.engagements.length > 0 : false,
        createdAt: comment.createdAt,
      }));

      return {
        success: true,
        message: "Comments fetched successfully",
        comments: formattedComments,
      };
    } catch (err) {
      console.error("Error while fetching comments of post:", err);
      return {
        success: false,
        message: "Failed to fetch comments",
        comments: [],
      };
    }
  }

  //delete comment

  public static async deleteComment({
    commentId,
    userId,
  }: {
    commentId: string;
    userId: string;
  }) {
    if (!commentId || !userId) {
      return { success: false, message: "Required fields are missing" };
    }

    try {
      const alreadyDeleted = await prisma.isDeleted.findFirst({
        where: { commentId },
      });

      if (alreadyDeleted) {
        return { success: false, message: "Comment already deleted" };
      }

      await prisma.isDeleted.create({
        data: {
          postId: null,
          commentId,
          userId,
        },
      });

      return { success: true, message: "Comment deleted successfully" };
    } catch (err) {
      console.error("Error deleting comment:", err);
      return { success: false, message: "Failed to delete comment" };
    }
  }

  //edit comment

  public static async editComment({
    commentId,
    userId,
    content,
  }: {
    commentId: string;
    userId: string;
    content: string;
  }) {
    if (!userId || !commentId || !content.trim()) {
      return { success: false, message: "Required fields are missing" };
    }

    try {
      await prisma.comment.update({
        where: {
          id: commentId,
          userId,
        },
        data: {
          content,
        },
      });

      return { success: true, message: "Comment edited successfully " };
    } catch (err) {
      console.error("Error edit comment : ", err);
      return { success: false, message: "Failed to edit comment" };
    }
  }

  //report Modal

  public static async report({
    commentId,
    postId,
    reportedUserId,
    reason,
  }: {
    commentId?: string;
    postId?: string;
    reportedUserId: string;
    reason: string;
  }) {
    if (!reportedUserId || !reason.trim()) {
      return { success: false, message: "Required fields are missing" };
    }

    try {
      await prisma.report.create({
        data: {
          reason,
          userId: reportedUserId,
          postId,
          commentId,
        },
      });

      const newNotif = await prisma.notification.create({
        data: {
          type: "REPORT",
          senderId: "none",
          commentId,
          postId,
          receiverId: reportedUserId,
          status: "UNREAD",
        },
        select: {
          id: true,
          createdAt: true,
          type: true,
          status: true,
          commentId: true,
          communityId: true,
          postId: true,
          sender: {
            select: {
              id: true,
              name: true,
              imgUrl: true,
            },
          },
          receiver: {
            select: {
              id: true,
              name: true,
              imgUrl: true,
            },
          },
        },
      });

      await sendNotification(reportedUserId, newNotif);

      return { success: true, message: "User reported " };
    } catch (err) {
      console.error("Error report user : ", err);
      return { success: false, message: "Failed to report user" };
    }
  }
}

export default Post;
