import { manageHighValue } from "@/lib/manageHighValue";
import { prisma } from "@/lib/prisma";

export interface CreateCommunityInput {
  ownerId: string;
  name: string;
  description: string;
  imgUrl: string;
}

export interface CommunityUpdate {
  name?: string;
  imgUrl?: string;
  description?: string;
  bannerUrl?: string;
  communityType?: "PRIVATE" | "PUBLIC";
}

class Community {
  //create comunity
  public static async create({ data }: { data: CreateCommunityInput }) {
    const { ownerId, name, description, imgUrl } = data;

    if (!ownerId || !name.trim() || !description.trim() || !imgUrl.trim()) {
      return {
        success: false,
        message: "Requirements missing to create community",
      };
    }

    try {
      const community = await prisma.community.create({
        data: {
          ownerId,
          name,
          description,
          imgUrl,
        },
      });

      await prisma.communityMember.create({
        data: {
          userId: ownerId,
          communityId: community.id,
        },
      });

      return {
        success: true,
        message: "Community created successfully.",
        data: {
          id: community.id,
          name: community.name,
          ownerId: community.ownerId,
        },
      };
    } catch (Err) {
      console.error(Err);
      return { success: false, message: "Failed to create community." };
    }
  }

  // get community data
  public static async getCommunity({
    communityId,
    loggedInUserId,
  }: {
    communityId: string;
    loggedInUserId: string;
  }) {
    try {
      if (!communityId || !loggedInUserId)
        return {
          success: false,
          message: "Required is missing to fetch community data",
          community: {},
        };

      const community = await prisma.community.findUnique({
        where: { id: communityId },
        select: {
          id: true,
          name: true,
          description: true,
          communityType: true,
          ownerId: true,
          imgUrl: true,
          bannerUrl: true,
          _count: {
            select: {
              posts: {
                where: {
                  isDeleted: false,
                },
              },
              members: true,
            },
          },
          members: {
            where: { userId: loggedInUserId },
            select: { id: true },
          },
          notifications: {
            where: {
              senderId: loggedInUserId,
              type: "JOIN_REQUEST_COMMUNITY",
              status: "UNREAD",
            },
            select: { id: true },
          },
        },
      });

      if (!community)
        return {
          success: false,
          message: "Community not found.",
          community: {},
        };

      const formattedCommunity = {
        id: community.id,
        name: community.name,
        description: community.description,
        imgUrl: community.imgUrl,
        ownerId: community.ownerId,
        communityType: community.communityType,
        bannerUrl: community.bannerUrl,
        membersCount: community._count.members ?? 0,
        postsCount: community._count.posts ?? 0,
        isMember:
          community.members?.length > 0
            ? "Joined"
            : community.notifications?.length > 0
            ? "Requested"
            : "Join",
      };

      return {
        success: true,
        message: "Community fetched successfully",
        community: formattedCommunity,
      };
    } catch (err) {
      console.error("Failed to get community data : ", err);
      return {
        success: false,
        message: "Failed to get community data",
        community: {},
      };
    }
  }

  // get community posts
  public static async getCommunityPosts({
    communityId,
    loggedInUserId,
    cursor,
    limit = 10,
  }: {
    communityId: string;
    loggedInUserId: string;
    cursor?: string;
    limit?: number;
  }) {
    if (!communityId || !loggedInUserId) {
      return {
        success: false,
        message: "Required fields are missing",
        posts: [],
        hasMore: false,
        nextCursor: null,
      };
    }

    try {
      const posts = await prisma.post.findMany({
        where: { communityId, isDeleted: false },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: limit + 1,
        ...(cursor && {
          cursor: { id: cursor },
          skip: 1,
        }),
        select: {
          id: true,
          title: true,
          body: true,
          imgUrls: true,
          createdAt: true,

          user: {
            select: {
              id: true,
              name: true,
              imgUrl: true,

              // logged-in user follows post author?
              follower: loggedInUserId
                ? {
                    where: { followerId: loggedInUserId },
                    select: { id: true },
                  }
                : false,

              // logged-in user requested to follow author?
              notificationsReceived: loggedInUserId
                ? {
                    where: {
                      senderId: loggedInUserId,
                      type: "FOLLOW_REQUEST",
                      status: "UNREAD",
                    },
                    select: { id: true },
                  }
                : false,

              // post author follows logged-in user?
              following: loggedInUserId
                ? {
                    where: { followingId: loggedInUserId },
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

          engagements: loggedInUserId
            ? {
                where: { userId: loggedInUserId },
                select: { type: true },
              }
            : false,
        },
      });

      const hasMore = posts.length > limit;
      const result = hasMore ? posts.slice(0, limit) : posts;

      const formattedPosts = result.map((p) => {
        const engagement = Array.isArray(p.engagements)
          ? p.engagements[0]
          : null;

        const isRequested = Array.isArray(p.user.notificationsReceived)
          ? p.user.notificationsReceived.length > 0
          : false;

        const isFollowedByCurrentUser = Array.isArray(p.user.follower)
          ? p.user.follower.length > 0
          : false;

        const followsCurrentUser = Array.isArray(p.user.following)
          ? p.user.following.length > 0
          : false;

        return {
          id: p.id,
          title: p.title,
          body: p.body,
          imgUrls: p.imgUrls,
          createdAt: p.createdAt.toISOString(),
          user: {
            ...p.user,
            isRequested,
            isFollowedByCurrentUser,
            followsCurrentUser,
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
        hasMore,
        nextCursor: hasMore ? result[result.length - 1].id : null,
      };
    } catch (err) {
      console.error(err);
      return {
        success: false,
        message: "Failed to get community posts",
        posts: [],
        hasMore: false,
        nextCursor: null,
      };
    }
  }

  // get community members
  public static async getCommunityMembers({
    communityId,
    loggedInUserId,
  }: {
    communityId: string;
    loggedInUserId: string;
  }) {
    if (!communityId || !loggedInUserId)
      return {
        success: false,
        message: "Required fields are missing",
        members: [],
      };

    try {
      const members = await prisma.communityMember.findMany({
        where: { communityId },
        take: 1000,
        select: {
          user: {
            select: {
              id: true,
              name: true,
              imgUrl: true,

              // check if logged-in user follows this user
              follower: loggedInUserId
                ? {
                    where: { followerId: loggedInUserId },
                    select: { id: true },
                  }
                : undefined,

              // check if logged-in user has sent a follow request
              notificationsReceived: loggedInUserId
                ? {
                    where: {
                      senderId: loggedInUserId,
                      type: "FOLLOW_REQUEST",
                      status: "UNREAD",
                    },
                    select: { id: true },
                  }
                : undefined,

              // check if this user follows the logged-in user
              following: loggedInUserId
                ? {
                    where: { followingId: loggedInUserId },
                    select: { id: true },
                  }
                : undefined,
            },
          },
        },
        orderBy: [{ user: { name: "asc" } }],
      });

      const formattedMembers = members.map((m) => {
        const user = m.user;
        return {
          id: user.id,
          name: user.name,
          imgUrl: user.imgUrl,
          followStatus:
            user.follower?.length > 0
              ? "Following"
              : user.notificationsReceived?.length > 0
              ? "Requested"
              : user.following?.length > 0
              ? "Follow Back"
              : "Follow",
        };
      });

      const loggedInUser = formattedMembers.filter(
        (user) => user.id === loggedInUserId
      );
      const otherUsers = formattedMembers.filter(
        (user) => user.id !== loggedInUserId
      );

      return {
        success: true,
        message: "Community members fetched successfully",
        members: [...loggedInUser, ...otherUsers],
      };
    } catch (err) {
      console.error("Failed to get community members:", err);
      return {
        success: false,
        message: "Failed to get community members",
        members: [],
      };
    }
  }

  // update data

  public static async updateCommunityData({
    communityId,
    data,
  }: {
    communityId: string;
    data: Partial<CommunityUpdate>;
  }) {
    if (!communityId)
      return { success: false, message: "Required field is missing" };

    try {
      const updated = await prisma.community.update({
        where: { id: communityId },
        data,
        select: {
          ownerId: true,
        },
      });

      if (data && data.communityType === "PUBLIC") {
        await prisma.notification.deleteMany({
          where: {
            communityId,
            receiverId: updated.ownerId,
            type: "JOIN_REQUEST_COMMUNITY",
          },
        });
      }

      return { success: true, message: "Community data updated successfully" };
    } catch (err) {
      console.error("Failed to update community data :", err);
      return { success: false, message: "Failed to update community data" };
    }
  }

  //remove member

  public static async removeMember({
    ownerId,
    userId,
    communityId,
  }: {
    ownerId: string;
    userId: string;
    communityId: string;
  }) {
    if (!ownerId || !userId || !communityId)
      return { success: false, message: "Required field is missing" };

    try {
      const community = await prisma.community.findUnique({
        where: { id: communityId },
      });

      if (!community || community.ownerId !== ownerId) {
        return {
          success: false,
          message: "Unauthorized or community not found",
        };
      }

      await prisma.communityMember.deleteMany({
        where: { communityId, userId },
      });

      return { success: true, message: "Member removed from community" };
    } catch (err) {
      console.error("Error Removing member from community :", err);
      return {
        success: false,
        message: "Failed to remove member from community",
      };
    }
  }

  //leave Member

  public static async leaveCommunity({
    communityId,
    userId,
  }: {
    communityId: string;
    userId: string;
  }) {
    if (!communityId || !userId)
      return { success: false, message: "Required fields are missing" };

    try {
      await prisma.communityMember.deleteMany({
        where: {
          communityId,
          userId,
        },
      });

      return { success: true, message: "Member leave from community" };
    } catch (err) {
      console.error("Error leave from community :", err);
      return { success: false, message: "Failed to leave from community" };
    }
  }

  // get recommended communities
  public static async getTopCommunities({
    loggedInUserId,
  }: {
    loggedInUserId: string;
  }) {
    try {
      const communities = await prisma.community.findMany({
        take: 5,
        where: {
          members: loggedInUserId
            ? {
                none: {
                  id: loggedInUserId,
                },
              }
            : {},
        },
        include: {
          _count: {
            select: {
              members: true,
              posts: true,
            },
          },
          posts: {
            select: {
              _count: {
                select: { comments: true },
              },
            },
          },
          members: {
            select: {
              lastActive: true,
            },
            orderBy: {
              lastActive: "desc",
            },
            take: 10,
          },
        },
        orderBy: [
          {
            posts: { _count: "desc" },
          },
          {
            members: { _count: "desc" },
          },
        ],
      });

      const ranked = communities
        .map((c) => {
          const totalComments = c.posts.reduce(
            (acc, post) => acc + post._count.comments,
            0
          );

          const recentActivityBoost =
            c.members.reduce((acc, m) => {
              if (!m.lastActive) return acc;

              let lastActiveDate: Date;

              // If lastActive is already a Date (Prisma usually returns DateTime as Date)
              if (m.lastActive instanceof Date) {
                lastActiveDate = m.lastActive;
              } else if (typeof m.lastActive === "string") {
                const normalized = (m.lastActive as string).replace(" ", "T");
                lastActiveDate = new Date(normalized);
              } else {
                return acc;
              }

              const hoursAgo =
                (Date.now() - lastActiveDate.getTime()) / (1000 * 60 * 60);

              return acc + Math.max(0, 48 - hoursAgo);
            }, 0) / Math.max(c.members.length, 1);

          return {
            ...c,
            activityScore:
              c._count.members * 0.5 +
              c._count.posts * 2 +
              totalComments * 1.5 +
              recentActivityBoost,
          };
        })
        .sort((a, b) => b.activityScore - a.activityScore)
        .slice(0, 5);

      const finalCommunities = ranked.map((c) => ({
        id: c.id,
        name: c.name,
        membersCount: manageHighValue(c._count.members),
        imgUrl: c.imgUrl,
      }));

      return {
        success: true,
        message: "Most active communities fetched successfully",
        communities: finalCommunities,
      };
    } catch (err) {
      console.error("Failed to get most active communities:", err);
      return {
        success: false,
        message: "Failed to get most active communities",
        communities: [],
      };
    }
  }
}

export default Community;
