import Session from "@/modules/session.module";
import UserService, { UserUpdateData } from "@/modules/user.module";
import bcrypt from "bcryptjs";

export const userResolvers = {
  Query: {
    //Get user by email

    listUserByEmail: async (_: unknown, { email }: { email: string }) => {
      return await UserService.listByEmail({ email });
    },

    //get user by id

    getUser: async (
      _: unknown,
      { userId, loggedInUserId }: { userId: string; loggedInUserId: string }
    ) => {
      return await UserService.get({ userId, loggedInUserId });
    },

    //get followers

    getFollowers: async (_: unknown, { userId }: { userId: string }) => {
      return await UserService.getFollowers({ userId });
    },

    //get followings

    getFollowings: async (_: unknown, { userId }: { userId: string }) => {
      return await UserService.getFollowings({ userId });
    },

    //handle search

    handleSearch: async (
      _: unknown,
      {
        query,
        searchType,
        cursor,
      }: { query: string; searchType: "people" | "community"; cursor?: string }
    ) => {
      return await UserService.handleSearch({ query, searchType, cursor });
    },

    //get User Notifications

    getNotifications: async (
      _: unknown,
      { loggedInUserId }: { loggedInUserId: string }
    ) => {
      return await UserService.getAllNotifications({ loggedInUserId });
    },
  },

  Mutation: {
    // Create a user
    createUser: async (
      _: unknown,
      { name, email }: { name: string; email: string }
    ) => {
      return await UserService.create({ email, name });
    },

    //update User

    updateUser: async (
      _: unknown,
      { id, data }: { id: string; data: UserUpdateData }
    ) => {
      return await UserService.update({ id, data });
    },

    //logged in user

    loginUser: async (
      _: unknown,
      { email, password }: { email: string; password: string },
      { req }: { req: Request }
    ) => {
      const userExists = await UserService.listByEmail({ email });

      if (userExists.data.length === 0) {
        return { success: false, message: "User not found" };
      }

      const user = userExists.data[0];

      if (!user.isVerified)
        return { success: false, message: "User not Verified" };
      if (!user.password)
        return { success: false, message: "Password is wrong" };

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return { success: false, message: "Password is Wrong" };
      }

      const ip =
        req.headers.get("x-forwarded-for") ||
        req.headers.get("remote-addr") ||
        "unknown";

      const userAgent = req.headers.get("user-agent") || "unknown";

      await Session.handleSessions({
        userId: user.id,
        ip,
        userAgent,
      });

      return {
        success: true,
        message: "Logged In Succesfully",
      };
    },

    //follow unfollow user

    followUnfollowAction: async (
      _: unknown,
      { followerId, followingId }: { followerId: string; followingId: string }
    ) => {
      return await UserService.followUnfollowAction({
        followerId,
        followingId,
      });
    },

    //join or leave community

    joinLeaveCommunity: async (
      _: unknown,
      { userId, communityId }: { userId: string; communityId: string }
    ) => {
      return await UserService.joinLeaveCommunityAction({
        userId,
        communityId,
      });
    },

    //verify reset password

    verifyResetPassword: async (_: unknown, { email }: { email: string }) => {
      return await UserService.verifyForgotPassword({ email });
    },

    //reset password

    resetPassword: async (
      _: unknown,
      { email, otp, password }: { email: string; otp: string; password: string }
    ) => {
      return await UserService.resetPassword({ email, otp, password });
    },

    //accept requests

    acceptRequest: async (
      _: unknown,
      {
        communityId,
        followingId,
        userId,
        id,
        action,
      }: {
        communityId?: string;
        followingId?: string;
        id: string;
        userId: string;
        action: "accept" | "reject";
      }
    ) => {
      return await UserService.acceptRequest({
        communityId,
        id,
        action,
        followingId,
        userId,
      });
    },

    //logout user

    signout: async (
      _: unknown,
      { loggedInUserId }: { loggedInUserId: string }
    ) => {
      return await UserService.signout({ loggedInUserId });
    },
  },
};
