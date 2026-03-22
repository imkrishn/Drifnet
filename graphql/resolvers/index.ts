import { mergeResolvers } from "@graphql-tools/merge";
import { userResolvers } from "./user.resolver";
import { studioResolvers } from "./studio.resolver";
import { communityResolver } from "./community.resolver";
import { postResolver } from "./post.resolver";

const resolvers = mergeResolvers([
  userResolvers,
  communityResolver,
  postResolver,
  studioResolvers,
]);

export default resolvers;
