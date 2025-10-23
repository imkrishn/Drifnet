import Studio, { Collection, UpdateInput } from "@/modules/studio.module";

export const studioResolvers = {
  Query: {
    // Get collection by id

    getDocuments: async (
      _: unknown,
      {
        collection,
        loggedInUserId,
      }: { collection: Collection; loggedInUserId: string }
    ) => {
      return await Studio.getDocuments({ loggedInUserId, collection });
    },

    //get documents by id

    getDocumentById: async (
      _: unknown,
      {
        documentId,
        collection,
        loggedInUserId,
      }: { documentId: string; collection: Collection; loggedInUserId: string }
    ) => {
      return await Studio.getDocumentById({
        documentId,
        loggedInUserId,
        collection,
      });
    },
  },
  Mutation: {
    // Update studio settings

    updateDocument: async (
      _: unknown,
      {
        data,
        loggedInUserId,
        contentType,
      }: {
        data: UpdateInput;
        loggedInUserId: string;
        contentType: "post" | "comment" | "community";
      }
    ) => {
      return await Studio.updateDocument({ data, loggedInUserId, contentType });
    },
  },
};
