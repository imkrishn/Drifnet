import gql from "graphql-tag";

export const studioTypeDef = gql`
  #Studio Type
  type StudioDocumentsResponse {
    success: Boolean!
    message: String!
    data: [CollectionDocuments!]
  }

  type StudioDocumentResponse {
    success: Boolean!
    message: String!
    data: Document!
  }

  type StudioUpdateDocumentResponse {
    success: Boolean!
    message: String!
  }

  input UpdateInput {
    id: ID!
    title: String
    name: String
    content: String
    imgUrls: [String]
    isDeleted: Boolean
  }

  type Document {
    id: ID!
    name: String
    title: String
    content: String
    imgUrl: String
    imgUrls: [String!]
    owner: User
    type: String
    isReported: Boolean
    isDeleted: Boolean
    reportCount: Int
    createdAt: DateTime
  }

  type User {
    id: ID!
    name: String!
    imgUrl: String!
  }

  type CollectionDocuments {
    id: ID!
    name: String
    title: String
    content: String
    description: String
    imgUrl: String
    type: String
    createdAt: DateTime
  }

  #Query

  extend type Query {
    getDocuments(
      collection: String!
      loggedInUserId: ID!
    ): StudioDocumentsResponse!
    getDocumentById(
      collection: String!
      loggedInUserId: ID!
      documentId: ID!
    ): StudioDocumentResponse!
  }

  extend type Mutation {
    updateDocument(
      contentType: String!
      loggedInUserId: ID!
      data: UpdateInput!
    ): StudioUpdateDocumentResponse!
  }
`;
