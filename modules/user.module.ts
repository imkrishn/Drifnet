import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/sendEmail";
import { sendNotification } from "@/lib/sendNotification";
import { Notification } from "@/types/userTypes";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

export interface UserUpdateData {
  name?: string;
  password?: string;
  isVerified: boolean;
  imgUrl?: string;
  accountType?: "PUBLIC" | "PRIVATE";
  verificationToken?: string | null;
  verificationTokenTime?: Date | null;
  forgotVerificationToken?: string | null;
  forgotVerificationTokenTime?: Date | null;
}

class UserService {
  // Create user
  public static async create({ email, name }: { email: string; name: string }) {
    if (!name || !email) {
      return { success: false, message: "User data is missing." };
    }

    try {
      const existingUser = await this.listByEmail({ email });

      if (existingUser.data?.length > 0 && existingUser.data[0].isVerified) {
        return { success: false, message: "Email exists. Proceed to login." };
      }

      const verificationToken = Math.floor(
        100000 + Math.random() * 900000
      ).toString();
      const verificationTokenTime = new Date(Date.now() + 1000 * 60 * 15); // 15 min expiry
      let user;

      if (existingUser.data.length > 0) {
        user = await prisma.user.update({
          where: { id: existingUser.data[0].id },
          data: { name, verificationToken, verificationTokenTime },
        });
      } else {
        user = await prisma.user.create({
          data: {
            name,
            email: email.toLowerCase(),
            verificationToken,
            verificationTokenTime,
          },
        });
      }

      // Send verification email

      try {
        await sendVerificationEmail(email, name, verificationToken, "signup");
      } catch (emailErr) {
        console.error("Failed to send verification email:", emailErr);
      }

      return {
        success: true,
        message: "OTP Sent to mail for verification",
        user,
      };
    } catch (err: any) {
      console.error("User creation error:", err);
      return {
        success: false,
        message: err.message || "Failed to create user",
      };
    }
  }

  // Verify user
  public static async verifyUser({ token }: { token: string }) {
    if (!token) return { success: false, message: "Token missing." };

    try {
      const user = await prisma.user.findFirst({
        where: { verificationToken: token },
      });
      if (!user)
        return { success: false, message: "Invalid verification token." };

      if (
        user.verificationTokenTime &&
        user.verificationTokenTime < new Date()
      ) {
        return { success: false, message: "Verification token expired." };
      }

      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          isVerified: true,
          verificationToken: null,
          verificationTokenTime: null,
        },
      });

      return {
        success: true,
        message: "User verified successfully",
        user: updatedUser,
      };
    } catch (err: any) {
      console.error("Verification error:", err);
      return {
        success: false,
        message: err.message || "Failed to verify user",
      };
    }
  }

  // Update user
  public static async update({
    id,
    data,
  }: {
    id: string;
    data: Partial<UserUpdateData>;
  }) {
    if (!id || !data)
      return { success: false, message: "Data missing for update." };

    try {
      const user = await prisma.user.update({ where: { id }, data });

      if (data.accountType && data.accountType === "PUBLIC") {
        await prisma.notification.deleteMany({
          where: {
            receiverId: id,
            type: "FOLLOW_REQUEST",
          },
        });
      }
      return { success: true, message: "User updated successfully", user };
    } catch (err: any) {
      console.error("Update error:", err);
      return {
        success: false,
        message: err.message || "Failed to update user",
      };
    }
  }

  // Delete user
  public static async delete({ id }: { id: string }) {
    if (!id) return { success: false, message: "Id missing." };

    try {
      await prisma.user.delete({ where: { id } });
      return { success: true, message: "User deleted successfully." };
    } catch (err: any) {
      console.error("Delete error:", err);
      return {
        success: false,
        message: err.message || "Failed to delete user",
      };
    }
  }

  // Get user by id
  public static async get({
    userId,
    loggedInUserId,
  }: {
    userId: string;
    loggedInUserId: string;
  }) {
    if (!userId || !loggedInUserId)
      return { success: false, message: "Id missing.", user: {} };

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          designation: true,
          accountType: true,
          imgUrl: true,
          _count: {
            select: {
              follower: true,
              following: true,
              posts: {
                where: {
                  isDeleted: false,
                },
              },
            },
          },
          follower: {
            where: { followerId: loggedInUserId },
            select: { id: true },
          },
          following: {
            where: { followingId: loggedInUserId },
            select: { id: true },
          },
          notificationsSent: {
            where: {
              senderId: loggedInUserId,
              type: "FOLLOW_REQUEST",
              status: "UNREAD",
            },
            select: { id: true },
          },
        },
      });
      if (!user)
        return { success: false, message: "User not found.", user: {} };

      //send notification

      if (userId !== loggedInUserId) {
        const newNotif = await prisma.notification.create({
          data: {
            type: "PROFILE_VIEW",
            senderId: userId,
            receiverId: userId,
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

        await sendNotification(userId, newNotif);
      }

      const isFollowBack =
        user.follower.length > 0 && user.following.length === 0;
      const isRequested = user.notificationsSent.length > 0;
      const isFollowing = user.follower.length > 0;

      const formattedUser = {
        id: user.id,
        name: user.name,
        designation: user.designation,
        accountType: user.accountType,
        imgUrl: user.imgUrl,
        followersCount: user._count.follower ?? 0,
        followingCount: user._count.following ?? 0,
        postsCount: user._count.posts ?? 0,
        followStatus: isFollowBack
          ? "Follow Back"
          : isRequested
          ? "Requested"
          : isFollowing
          ? "Following"
          : "Follow",
      };

      return {
        success: true,
        message: "User fetched successfully.",
        user: formattedUser,
      };
    } catch (err: any) {
      console.error("Get error:", err);
      return {
        success: false,
        message: err.message || "Failed to fetch user.",
        user: {},
      };
    }
  }

  // List users by email
  public static async listByEmail({ email }: { email: string }) {
    if (!email) return { success: false, message: "Email missing.", data: [] };

    try {
      const users = await prisma.user.findMany({
        where: { email: email.toLowerCase() },
      });
      return { success: true, message: "Users fetched.", data: users };
    } catch (err: any) {
      console.error("ListByEmail error:", err);
      return {
        success: false,
        message: err.message || "Failed to fetch users.",
        data: [],
      };
    }
  }

  // Get followers of a user
  public static async getFollowers({ userId }: { userId: string }) {
    if (!userId) {
      return { success: false, message: "Id missing.", data: [] };
    }

    try {
      const followers = await prisma.follows.findMany({
        where: {
          followingId: userId,
        },
        select: {
          follower: {
            select: {
              id: true,
              name: true,
              imgUrl: true,
            },
          },
        },
      });

      const following = await prisma.follows.findMany({
        where: {
          followerId: userId,
        },
        select: {
          followingId: true,
        },
      });

      const followingSet = new Set(following.map((f) => f.followingId));

      const formattedFollowers = followers.map(({ follower }) => ({
        id: follower.id,
        name: follower.name,
        imgUrl: follower.imgUrl,
        isFollowBack: followingSet.has(follower.id),
      }));

      return {
        success: true,
        message: "Followers fetched successfully.",
        data: formattedFollowers,
      };
    } catch (err: any) {
      console.error("Get followers error:", err);
      return {
        success: false,
        message: err.message || "Failed to fetch followers.",
        data: [],
      };
    }
  }

  // Get followings of a user

  public static async getFollowings({ userId }: { userId: string }) {
    if (!userId) {
      return { success: false, message: "Id missing.", data: [] };
    }

    try {
      const followings = await prisma.follows.findMany({
        where: {
          followerId: userId,
        },
        select: {
          following: {
            select: {
              id: true,
              name: true,
              imgUrl: true,
            },
          },
        },
      });

      const finalFollowings = followings.map(({ following }) => ({
        id: following.id,
        name: following.name,
        imgUrl: following.imgUrl,
      }));

      return {
        success: true,
        message: "Followings fetched successfully.",
        data: finalFollowings,
      };
    } catch (err: any) {
      console.error("Get followings error:", err);
      return {
        success: false,
        message: err.message || "Failed to fetch followings.",
        data: [],
      };
    }
  }

  // follow/unfollow user
  public static async followUnfollowAction({
    followingId,
    followerId,
  }: {
    followingId: string;
    followerId: string;
  }) {
    if (!followerId || !followingId) {
      return {
        success: false,
        message: "Required parameters are missing",
        status: undefined,
      };
    }

    try {
      // check if already followed
      const existingFollow = await prisma.follows.findFirst({
        where: { followerId, followingId },
        select: {
          id: true,
          following: { select: { accountType: true } },
        },
      });

      if (existingFollow) {
        const existingFollowBack = await prisma.follows.findFirst({
          where: { followerId: followingId, followingId: followerId },
          select: {
            id: true,
          },
        });
        // unfollow action
        await prisma.follows.delete({ where: { id: existingFollow.id } });
        return {
          success: true,
          message: "User unfollowed successfully",
          status: existingFollowBack ? "Follow Back" : "Follow",
        };
      }

      const followingUser = await prisma.user.findUnique({
        where: { id: followingId },
        select: { accountType: true },
      });

      if (!followingUser) {
        return { success: false, message: "User not found", status: undefined };
      }

      // PUBLIC account: follow directly
      if (followingUser.accountType === "PUBLIC") {
        await prisma.follows.create({ data: { followerId, followingId } });

        // create notification
        const newNotif = await prisma.notification.create({
          data: {
            type: "FOLLOWED",
            senderId: followerId,
            receiverId: followingId,
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

        await sendNotification(followingId, newNotif);

        return {
          success: true,
          message: "User followed successfully",
          status: "Following",
        };
      }

      // PRIVATE account: follow request pending

      // create notification
      const newNotif = await prisma.notification.create({
        data: {
          type: "FOLLOW_REQUEST",
          senderId: followerId,
          receiverId: followingId,
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

      await sendNotification(followingId, newNotif);

      return {
        success: true,
        message: "Follow request sent (private account)",
        status: "Requested",
      };
    } catch (err) {
      console.error("Error while follow/unfollow action:", err);
      return {
        success: false,
        message: "Failed to follow/unfollow user",
        status: undefined,
      };
    }
  }

  // join/leave community
  public static async joinLeaveCommunityAction({
    userId,
    communityId,
  }: {
    userId: string;
    communityId: string;
  }) {
    if (!userId || !communityId) {
      return { success: false, message: "Required parameters are missing" };
    }

    try {
      // check if already member
      const existingMembership = await prisma.communityMember.findFirst({
        where: { userId, communityId },
        select: {
          id: true,
          community: { select: { communityType: true } },
        },
      });

      if (existingMembership) {
        // leave community action
        await prisma.communityMember.delete({
          where: { id: existingMembership.id },
        });

        return {
          success: true,
          message: "User left community successfully",
          status: "Join",
        };
      }

      const joinCommunity = await prisma.community.findUnique({
        where: { id: communityId },
        select: { communityType: true, ownerId: true, name: true },
      });

      if (!joinCommunity) {
        return { success: false, message: "Community not found" };
      }

      // PUBLIC community: join directly
      if (joinCommunity.communityType === "PUBLIC") {
        await prisma.communityMember.create({
          data: { userId, communityId, lastActive: new Date() },
        });

        // create notification

        const newNotif = await prisma.notification.create({
          data: {
            type: "JOINED_COMMUNITY",
            senderId: userId,
            receiverId: joinCommunity.ownerId,
            communityId,
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

        await sendNotification(joinCommunity.ownerId, newNotif);

        return {
          success: true,
          message: "Community joined successfully",
          status: "Joined",
          communityName: joinCommunity.name,
        };
      }

      // PRIVATE COMMUNITY: join request pending

      const newNotif = await prisma.notification.create({
        data: {
          type: "JOIN_REQUEST_COMMUNITY",
          senderId: userId,
          receiverId: joinCommunity.ownerId,
          communityId,
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

      await sendNotification(joinCommunity.ownerId, newNotif);

      return {
        success: true,
        message: "Join request sent (private community)",
        status: "Requested",
      };
    } catch (err) {
      console.error("Error while join/leave community action:", err);
      return { success: false, message: "Failed to join/leave community" };
    }
  }

  // handle search Action
  public static async handleSearch({
    query,
    searchType,
    cursor,
  }: {
    query: string;
    searchType: "people" | "community";
    cursor?: string;
  }) {
    if (!query.trim() || !searchType)
      return { success: false, message: "Required fields are missing" };

    try {
      if (searchType === "people") {
        const users = await prisma.user.findMany({
          where: {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { designation: { contains: query, mode: "insensitive" } },
            ],
          },
          select: {
            id: true,
            name: true,
            designation: true,
            imgUrl: true,
          },
          take: 20,
          cursor: cursor ? { id: cursor } : undefined, // start from cursor
          orderBy: { id: "asc" },
        });

        const nextCursor =
          users.length === 20 ? users[users.length - 1].id : null;

        return {
          success: true,
          message: "Fetched query result",
          data: users,
          nextCursor,
        };
      }

      if (searchType === "community") {
        const communities = await prisma.community.findMany({
          where: {
            name: { contains: query, mode: "insensitive" },
          },
          select: {
            id: true,
            name: true,
            imgUrl: true,
            _count: {
              select: {
                members: true,
              },
            },
          },
          take: 20,
          skip: cursor ? 1 : 0,
          cursor: cursor ? { id: cursor } : undefined,
          orderBy: { id: "asc" },
        });

        const nextCursor =
          communities.length === 20
            ? communities[communities.length - 1].id
            : null;

        return {
          success: true,
          message: "Fetched query result",
          data: communities,
          nextCursor,
        };
      }

      return { success: false, message: "Invalid search type" };
    } catch (err) {
      console.error("Error while searching :", err);
      return { success: false, message: "Failed to get the searched result" };
    }
  }

  //get All user Notifications

  public static async getAllNotifications({
    loggedInUserId,
  }: {
    loggedInUserId: string;
  }) {
    if (!loggedInUserId)
      return { success: false, message: "User not authorized" };

    try {
      const notifications = await prisma.notification.findMany({
        where: {
          receiverId: loggedInUserId,
          sender: {
            id: { not: loggedInUserId },
          },
        },
        select: {
          id: true,
          type: true,
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
          status: true,
          createdAt: true,
          postId: true,
          communityId: true,
          commentId: true,
        },
        orderBy: { createdAt: "desc" },
      });

      const notificationsWithISO = notifications.map((n) => ({
        ...n,
        createdAt: n.createdAt.toISOString(),
      }));

      return {
        success: true,
        message: "Fetched notifications",
        data: notificationsWithISO,
      };
    } catch (err) {
      console.error("Error getting notifications :", err);
      return { success: false, message: "Failed to get notifications" };
    }
  }

  //verify forgot password

  public static async verifyForgotPassword({ email }: { email: string }) {
    if (!email)
      return {
        success: false,
        message: "Email required to verify forgot password",
      };

    try {
      const existingUser = await this.listByEmail({ email });

      if (existingUser.data?.length === 0) {
        return { success: false, message: "User not exist with this email." };
      }

      const verificationToken = Math.floor(
        100000 + Math.random() * 900000
      ).toString();
      const verificationTokenTime = new Date(Date.now() + 1000 * 60 * 15); // 15 min expiry

      await prisma.user.update({
        where: { id: existingUser.data[0].id },
        data: {
          forgotVerificationToken: verificationToken,
          forgotVerificationTokenTime: verificationTokenTime,
        },
      });

      // Send verification email

      try {
        await sendVerificationEmail(
          email,
          existingUser.data[0].name,
          verificationToken,
          "reset"
        );
      } catch (emailErr) {
        console.error("Failed to send verification email:", emailErr);
      }

      return {
        success: true,
        message: "OTP Sent to mail for password verification",
      };
    } catch (Err) {
      console.error(Err);
      return {
        success: false,
        message: "Failed to verify user for forgot password",
      };
    }
  }

  //reset password

  public static async resetPassword({
    email,
    password,
    otp,
  }: {
    email: string;
    password: string;
    otp: string;
  }) {
    if (!email || !password.trim() || !otp) {
      return { success: false, message: "Required fields are missing" };
    }

    try {
      const user = await this.listByEmail({ email });

      if (user.data.length === 0)
        return { success: false, message: "User not exist with this email" };

      if (user.success) {
        const verified =
          user.data[0].forgotVerificationToken === otp &&
          user.data[0].forgotVerificationTokenTime &&
          user.data[0].forgotVerificationTokenTime > new Date();

        if (verified) {
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(password, salt);

          await prisma.user.update({
            where: { email },
            data: {
              forgotVerificationToken: null,
              forgotVerificationTokenTime: null,
              password: hashedPassword,
            },
          });

          return { success: true, message: "Password updated successfully" };
        }

        return { success: false, message: "Token is invalid or expired" };
      }
    } catch (err) {
      console.error(err);
      return { success: false, message: "Failed Updated sucessfully" };
    }
  }

  //accept request

  public static async acceptRequest({
    communityId,
    id,
    followingId,
    userId,
    action,
  }: {
    communityId?: string;
    id: string;
    followingId?: string;
    userId: string;
    action: "accept" | "reject";
  }) {
    if (!userId)
      return { success: false, message: "Required fields are missing" };

    try {
      if (communityId && action === "accept") {
        await prisma.communityMember.create({
          data: {
            userId,
            communityId,
          },
        });
      }

      if (followingId && action === "accept") {
        await prisma.follows.create({
          data: {
            followerId: userId,
            followingId,
          },
        });
      }

      await prisma.notification.delete({
        where: {
          id,
        },
      });

      return { success: true, message: "Request accepted" };
    } catch (err) {
      console.error(err);
      return { success: false, message: "failed to accept request" };
    }
  }

  //sign out user

  public static async signout({ loggedInUserId }: { loggedInUserId: string }) {
    if (!loggedInUserId) {
      return { success: false, message: "User is not signed in" };
    }

    const cookieStore = await cookies();

    try {
      //Delete user's session from DB
      await prisma.session.deleteMany({
        where: { userId: loggedInUserId },
      });

      // Clear session cookie
      cookieStore.set("drifnet_session", "", {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      });

      return { success: true, message: "User signed out successfully" };
    } catch (err) {
      console.error("Logout failed:", err);
      return { success: false, message: "Failed to logout the user" };
    }
  }
}

export default UserService;
