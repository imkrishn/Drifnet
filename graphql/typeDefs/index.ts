import { communityTypeDefs } from "./community.typeDefs";
import { postTypeDefs } from "./post.typeDefs";
import { studioTypeDef } from "./studio.typeDefs";
import { userTypeDef } from "./user.typeDef";

export const typeDefs = [
  userTypeDef,
  communityTypeDefs,
  postTypeDefs,
  studioTypeDef,
];
