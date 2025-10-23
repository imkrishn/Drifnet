export const postTypeDefs = `
  scalar DateTime

  extend type Query {
    getUserPosts(userId: String!): PostResponse!
    getComments(postId: String!, userId: String,parentCommentId:String): CommentResponse!
    getTrendingPosts(lastPostId:String,userId:String,type:String):PostResponse!
  }

  extend type Mutation {
    createPost(data: PostInput!): PostResponse!
    deletePost(postId:String!,userId:String!):PostResponse!
    likeDislikeActions(postId: String!, userId: String!, commentId: String, type: String!): CommentResponse!
    addComment(postId: String!, userId: String!, parentCommentId: String, content: String!): CommentResponse!
    deleteComment(commentId:String!,userId:String!):CommentResponse!
    editComment(commentId:String!,userId:String!,content:String!):CommentResponse!
    report(commentId:String,postId:String,reportedUserId:String!,reason:String!):CommentResponse!
  }

  type PostResponse {
    success: Boolean!
    message: String!
    warnAI:String
    posts: [Post!]
    hasNextPage:Boolean
    nextCursor:String
  }

  type CommentResponse {
    success: Boolean!
    message: String!
    warnAI:String
    comments: [Comment!]
  }
  

  type Comment {
    id: ID!
    content: String!
    user: User!
    parentCommentId: String
    likeCount: Int!
    isLiked: Boolean!
    createdAt: DateTime!
  }


  type Post {
    id: ID!
    title: String!
    body: String!
    imgUrls: [String!]
    createdAt: DateTime!
    community: Community
    user: User!
    commentsCount: Int!
    likesCount:Int!
    isLiked:Boolean
    isDisliked:Boolean
  }

  type Community {
    id: ID
    name: String
    description: String
    imgUrl: String
    membersCount: Int
    isCommunityMember :Boolean
    isRequested :Boolean
  }

  type User {
    id: ID!
    name: String!
    imgUrl: String!
    email: String
    isRequested:Boolean!
    isFollowedByCurrentUser:Boolean!
    followsCurrentUser:Boolean!
  }

  input PostInput {
    title: String!
    body: String!
    communityId: String
    userId: String!
    imgUrls: [String!]
  }
`;
