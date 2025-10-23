import { gql } from "graphql-tag";

export const userTypeDef = gql`
  # User Type
  type User {
    id: ID!
    name: String
    email: String
    password: String
    imgUrl: String
    isVerified: Boolean
    verificationToken: String
    verificationTokenTime: String
    forgotVerificationToken: String
    forgotVerificationTokenTime: String
  }

  # Responses
  type UserResponse {
    success: Boolean!
    message: String!
    user: CheckUserVerified
  }

  type CheckUserVerified {
    id: ID!
    isVerified: Boolean!
  }

  type FollowResponse {
    success: Boolean!
    message: String!
    status: String
    communityName: String
  }

  type Response {
    id: ID!
    name: String!
    designation: String
    imgUrl: String!
    accountType: String!
    followersCount: Int!
    followingCount: Int!
    postsCount: Int!
    followStatus: String!
  }

  type Notification {
    id: ID!
    type: String!
    sender: User!
    receiver: User!
    status: String!
    createdAt: String!
    postId: String
    communityId: String
    commentId: String
  }

  type NotificationResponse {
    success: Boolean!
    message: String!
    data: [Notification!]
  }

  type UsersResponse {
    success: Boolean!
    message: String!
    data: [User!]
    user: Response
  }

  type FollowData {
    id: ID!
    name: String!
    imgUrl: String!
    isFollowBack: Boolean!
  }

  type FollowResponse {
    success: Boolean!
    message: String!
    data: [FollowData!]
  }

  type membersCount {
    members: Int!
  }

  type SearchData {
    id: ID!
    name: String!
    imgUrl: String!
    designation: String
    _count: membersCount
  }

  type SearchResponse {
    success: Boolean!
    message: String!
    data: [SearchData!]
    nextCursor: String
  }

  type ResetPasswordResponse {
    success: Boolean!
    message: String!
  }

  # Queries
  type Query {
    listUserByEmail(email: String!): UsersResponse!
    getUser(userId: String!, loggedInUserId: String!): UsersResponse!
    getFollowers(userId: String!): FollowResponse!
    getFollowings(userId: String!): FollowResponse!
    getNotifications(loggedInUserId: ID!): NotificationResponse!
    handleSearch(
      query: String!
      searchType: String!
      cursor: String
    ): SearchResponse!
  }

  # Input Types
  input CreateUserInput {
    name: String!
    email: String!
  }

  input UpdateUserInput {
    name: String
    password: String
    imgUrl: String
    designation: String
    accountType: String
    isVerified: Boolean
    verificationToken: String
    verificationTokenTime: String
    forgotVerificationToken: String
    forgotVerificationTokenTime: String
  }

  # Mutations
  type Mutation {
    createUser(email: String!, name: String!): UserResponse!
    updateUser(id: String!, data: UpdateUserInput!): UserResponse!
    loginUser(email: String!, password: String!): UserResponse!
    followUnfollowAction(
      followerId: String!
      followingId: String!
    ): FollowResponse!
    joinLeaveCommunity(userId: String!, communityId: String!): FollowResponse!
    verifyResetPassword(email: String!): ResetPasswordResponse!
    resetPassword(
      email: String!
      otp: String!
      password: String!
    ): ResetPasswordResponse!
    signout(loggedInUserId: ID!): ResetPasswordResponse!
    acceptRequest(
      communityId: ID
      followingId: ID
      userId: ID!
      id: ID!
      action: String!
    ): ResetPasswordResponse!
  }
`;
