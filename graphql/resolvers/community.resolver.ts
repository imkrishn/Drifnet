import Community, {
  CommunityUpdate,
  CreateCommunityInput,
} from "@/modules/community.module";

export const communityResolver = {
  Query: {
    //get community data

    getCommunityData: async (
      _: unknown,
      {
        communityId,
        loggedInUserId,
      }: { communityId: string; loggedInUserId: string }
    ) => {
      return await Community.getCommunity({ communityId, loggedInUserId });
    },

    //get community posts

    getCommunityPosts: async (
      _: unknown,
      {
        communityId,
        loggedInUserId,
      }: { communityId: string; loggedInUserId: string }
    ) => {
      return await Community.getCommunityPosts({ communityId, loggedInUserId });
    },

    //get community members

    getCommunityMembers: async (
      _: unknown,
      {
        communityId,
        loggedInUserId,
      }: { communityId: string; loggedInUserId: string }
    ) => {
      return await Community.getCommunityMembers({
        communityId,
        loggedInUserId,
      });
    },
    //get top communitites

    getTopCommunities: async (
      _: unknown,
      { loggedInUserId }: { loggedInUserId: string }
    ) => {
      return await Community.getTopCommunities({ loggedInUserId });
    },
  },
  Mutation: {
    //create community
    createCommunity: async (
      _: unknown,
      { data }: { data: CreateCommunityInput }
    ) => {
      return await Community.create({ data });
    },

    //update Community

    updateCommunity: async (
      _: unknown,
      { communityId, data }: { communityId: string; data: CommunityUpdate }
    ) => {
      return await Community.updateCommunityData({ communityId, data });
    },

    //leave Community

    leaveCommunity: async (
      _: unknown,
      { communityId, userId }: { communityId: string; userId: string }
    ) => {
      return await Community.leaveCommunity({ communityId, userId });
    },

    //member remove

    removeMember: async (
      _: unknown,
      {
        communityId,
        userId,
        ownerId,
      }: { communityId: string; userId: string; ownerId: string }
    ) => {
      return await Community.removeMember({ communityId, userId, ownerId });
    },
  },
};
