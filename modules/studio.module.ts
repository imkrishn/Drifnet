import { prisma } from "@/lib/prisma";

export type Collection = "post" | "comment" | "community" | "engage";

export type UpdateInput = {
  id: string;
  title?: string;
  name?: string;
  content?: string;
  imgUrls?: string[];
  isDeleted: boolean;
};

export default class Studio {
  //get all documents for a collection
  public static async getDocuments({
    collection,
    loggedInUserId,
  }: {
    collection: Collection;
    loggedInUserId: string;
  }) {
    if (!loggedInUserId)
      return { success: false, message: "User not authorized" };

    try {
      if (collection === "post") {
        const posts = await prisma.post.findMany({
          where: {
            userId: loggedInUserId,
            deletions: { none: {} },
          },
          select: {
            id: true,
            title: true,
            body: true,
            imgUrls: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        });

        const final = posts.map((p) => ({
          id: p.id,
          title: p.title,
          content: p.body,
          imgUrl: p.imgUrls[0],
          createdAt: p.createdAt.toISOString(),
        }));

        return { success: true, message: "posts fetched", data: final };
      } else if (collection === "comment") {
        const comments = await prisma.comment.findMany({
          where: {
            userId: loggedInUserId,
            deletions: { none: {} },
          },
          select: {
            id: true,
            content: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        });

        const final = comments.flatMap((c) => ({
          id: c.id,
          content: c.content,
          createdAt: c.createdAt.toISOString(),
        }));

        return { success: true, message: "comments fetched", data: final };
      } else if (collection === "community") {
        const communities = await prisma.community.findMany({
          where: {
            members: { some: { userId: loggedInUserId } },
          },
          select: {
            id: true,
            name: true,
            description: true,
            imgUrl: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        });

        return {
          success: true,
          message: "communities fetched",
          data: communities,
        };
      } else if (collection === "engage") {
        const engagements = await prisma.engagement.findMany({
          where: {
            userId: loggedInUserId,
          },
          select: {
            comment: {
              select: {
                id: true,
                content: true,
                createdAt: true,
              },
            },
            post: {
              select: {
                id: true,
                title: true,
                imgUrls: true,
                body: true,
                createdAt: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        });

        const final = engagements.map((e) => ({
          id: e.comment ? e.comment.id : e.post?.id,
          title: e.post?.title,
          content: e.comment ? e.comment.content : e.post?.body,
          imgUrl: e.post?.imgUrls[0],
          type: e.comment ? "comment" : "post",
          createdAt: e.comment
            ? e.comment.createdAt.toISOString()
            : e.post?.createdAt.toISOString(),
        }));

        return {
          success: true,
          message: "engagements data fetched",
          data: final,
        };
      } else {
        return { success: false, message: "No collection exists" };
      }
    } catch (err) {
      console.error(err);
      return { success: false, message: "Failed to fetch collection" };
    }
  }

  //get a document by id

  public static async getDocumentById({
    collection,
    documentId,
    loggedInUserId,
  }: {
    collection: string;
    documentId: string;
    loggedInUserId: string;
  }) {
    if (!collection || !documentId || !loggedInUserId) {
      return { success: false, message: "Required data is missing" };
    }

    try {
      if (collection === "post") {
        const post = await prisma.post.findUnique({
          where: { id: documentId, userId: loggedInUserId },
          select: {
            id: true,
            title: true,
            body: true,
            imgUrls: true,
            createdAt: true,
            reports: {
              select: {
                id: true,
              },
            },
            deletions: {
              select: {
                id: true,
              },
            },
            _count: {
              select: {
                reports: true,
              },
            },
          },
        });

        const final = post
          ? {
              id: post.id,
              title: post.title,
              content: post.body,
              imgUrls: post.imgUrls,
              isReported: post.reports.length > 0,
              isDeleted: post.deletions.length > 0,
              reportCount: post._count.reports,
              type: "post",
              createdAt: post.createdAt.toISOString(),
            }
          : null;

        return { success: true, message: "Post fetched", data: final };
      } else if (collection === "comment") {
        const comment = await prisma.comment.findUnique({
          where: { id: documentId },

          select: {
            id: true,
            content: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                name: true,
                imgUrl: true,
              },
            },
            reports: {
              select: {
                id: true,
              },
            },
            deletions: {
              select: {
                id: true,
              },
            },
            _count: {
              select: {
                reports: true,
              },
            },
          },
        });

        console.log(comment);

        const final = comment
          ? {
              id: comment.id,
              content: comment.content,
              owner: comment.user,
              isReported: comment.reports.length > 0,
              isDeleted: comment.deletions.length > 0,
              reportCount: comment._count.reports,
              type: "comment",
              createdAt: comment.createdAt.toISOString(),
            }
          : null;

        return { success: true, message: "Comment fetched", data: final };
      } else if (collection === "community") {
        const community = await prisma.community.findUnique({
          where: { id: documentId },
          select: {
            id: true,
            name: true,
            description: true,
            imgUrl: true,
            owner: {
              select: {
                id: true,
                name: true,
                imgUrl: true,
                createdAt: true,
              },
            },
          },
        });

        const final = community
          ? {
              id: community.id,
              name: community.name,
              content: community.description,
              imgUrl: community.imgUrl,
              owner: community.owner,
              type: "community",
              createdAt: community.owner.createdAt.toISOString(),
            }
          : null;

        return { success: true, message: "Community fetched", data: final };
      }
    } catch (err) {
      console.error(err);
      return { success: false, message: "Failed to fetch document" };
    }
  }

  // update document

  public static async updateDocument({
    data,
    loggedInUserId,
    contentType,
  }: {
    data: UpdateInput;
    loggedInUserId: string;
    contentType: "post" | "comment" | "community";
  }) {
    if (!loggedInUserId || !contentType || !data) {
      return { success: false, message: "Required fields are missing" };
    }

    try {
      const { id, title, name, content, imgUrls, isDeleted } = data;
      let updatedDoc;

      if (contentType === "post") {
        updatedDoc = await prisma.post.update({
          where: { id },
          data: {
            title,
            body: content,
            imgUrls,
            isDeleted,
            deletions: isDeleted
              ? { create: { userId: loggedInUserId } }
              : undefined,
          },
        });
      } else if (contentType === "comment") {
        updatedDoc = await prisma.comment.update({
          where: { id },
          data: {
            content,
            deletions: isDeleted
              ? { create: { userId: loggedInUserId } }
              : undefined,
          },
        });
      } else if (contentType === "community") {
        updatedDoc = await prisma.community.update({
          where: { id },
          data: {
            name,
            description: content,
          },
        });
      }

      return { success: true, message: "Updated successfully" };
    } catch (err) {
      console.error(err);
      return {
        success: false,
        message: "Failed to update document.",
        error: err,
      };
    }
  }
}
