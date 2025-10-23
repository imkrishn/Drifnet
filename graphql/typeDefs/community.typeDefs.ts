export const communityTypeDefs = `
 
  type Community {
    success: Boolean!
    message: String!
    data:CommunityData!
    community:FetchCommunityData
  }

  type CommunityData {
    id: String!
    ownerId: String!
    name: String!
    membersCount: String
    imgUrl:String
  }

  type CommunityResponse{
    success:Boolean!
    message:String!
    posts:[CommunityPost!]
    members:[User!]
    nextCursor:String
    hasMore:Boolean
  }

  type User {
    id: ID!
    name: String!
    imgUrl: String!
    followStatus:String
    isRequested:Boolean
    isFollowedByCurrentUser:Boolean
    followsCurrentUser:Boolean
  }

  type CommunityPost{
    id:String!
    title:String!
    body:String!
    imgUrls:[String]
    user:User!
    commentsCount: Int
    likesCount:Int
    isLiked:Boolean
    isDisliked:Boolean
    createdAt:String
    
  }

  type FetchCommunityData{
    id:String!
    name:String!
    description:String!
    bannerUrl:String
    imgUrl:String
    communityType:String!
    ownerId:String!
    membersCount:Int
    postsCount:Int
    isMember:String!
  }

  type CommunityUpdateResponse{
    success:Boolean!
    message:String!
    communities:[CommunityData!]
  }

  extend type Query {
    getCommunityData(communityId:String!,loggedInUserId:String!):Community!
    getCommunityPosts(communityId:String!,loggedInUserId:String!,cursor:String,limit:Int):CommunityResponse!
    getCommunityMembers(communityId:String!,loggedInUserId:String!):CommunityResponse!
    getTopCommunities(loggedInUserId:String!):CommunityUpdateResponse!
  }

  extend type Mutation {
    createCommunity(data: CreateCommunityInput!): Community!
    updateCommunity(communityId:String!,data:UpdateCommunityInput!):CommunityUpdateResponse!
    removeMember(ownerId:String!,userId:String!,communityId:String!):CommunityUpdateResponse!
    leaveCommunity(communityId:String!,userId:String!):CommunityUpdateResponse!
  }

  input CreateCommunityInput {
    ownerId: String!
    name: String!
    description: String!
    imgUrl: String!
  }

  input UpdateCommunityInput{
    name:String
    description:String
    imgUrl:String
    bannerUrl:String
    communityType:String
  }

  
`;
