"use client";

import { Collection } from "@/modules/studio.module";
import {
  Document,
  GetDocumentResponse,
  GetDocumentsResponse,
  UpdateDocumentResponse,
} from "@/types/studioTypes";
import { useLazyQuery, useMutation } from "@apollo/client/react";
import gql from "graphql-tag";
import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import {
  MessageSquare,
  Users,
  FileText,
  ThumbsUp,
  ImageOff,
  ToggleRight,
  ToggleLeft,
  X,
} from "lucide-react";
import StudioDocumentsSkeleton from "./loading/StudioDocumentsSkelton";
import { timeAgo } from "@/lib/timeAgo";
import Spinner from "./loading/Spinner";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface DocumentProps {
  data: Document;
  loggedInUserId: string;
}

interface CardProps {
  item: Document;
  type: "post" | "comment" | "community" | "engage";
  clickedCardId?: string;
  onClick?: (id: string, contentType: "post" | "comment" | "community") => void;
}

const getTypeIcon = (type: CardProps["type"]) => {
  switch (type) {
    case "post":
      return <FileText className="w-6 h-6 text-[hsl(var(--primary))]" />;
    case "comment":
      return <MessageSquare className="w-6 h-6 text-[hsl(var(--ring))]" />;
    case "community":
      return <Users className="w-6 h-6 text-[hsl(var(--accent-foreground))]" />;
    case "engage":
      return <ThumbsUp className="w-6 h-6 text-[hsl(var(--ring))]" />;

    default:
      return (
        <ImageOff className="w-6 h-6 text-[hsl(var(--muted-foreground))]" />
      );
  }
};

const FETCH_COLLECTION_DOCUMENTS = gql`
  query getDocuments($collection: String!, $loggedInUserId: ID!) {
    getDocuments(collection: $collection, loggedInUserId: $loggedInUserId) {
      success
      message
      data {
        id
        name
        title
        content
        description
        imgUrl
        type
        createdAt
      }
    }
  }
`;

const FETCH_DOCUMENT = gql`
  query GetDocumentById(
    $collection: String!
    $loggedInUserId: ID!
    $documentId: ID!
  ) {
    getDocumentById(
      collection: $collection
      loggedInUserId: $loggedInUserId
      documentId: $documentId
    ) {
      success
      message
      data {
        id
        name
        title
        content
        imgUrl
        type
        imgUrls
        reportCount
        isReported
        isDeleted
        owner {
          id
          name
          imgUrl
        }
        createdAt
      }
    }
  }
`;

const UPDATE_DOCUMENT = gql`
  mutation UpdateDocument(
    $contentType: String!
    $loggedInUserId: ID!
    $data: UpdateInput!
  ) {
    updateDocument(
      contentType: $contentType
      loggedInUserId: $loggedInUserId
      data: $data
    ) {
      success
      message
    }
  }
`;

const StudioDocument = ({
  collection,
  loggedInUserId,
}: {
  collection: Collection;
  loggedInUserId: string;
}) => {
  const [getDocuments, { loading }] = useLazyQuery<GetDocumentsResponse>(
    FETCH_COLLECTION_DOCUMENTS,
    {
      fetchPolicy: "network-only",
    }
  );

  const [getDocument, { loading: documentLoading }] =
    useLazyQuery<GetDocumentResponse>(FETCH_DOCUMENT);

  const [clickedCardId, setClickedCardId] = useState<string>("");
  const [documents, setDocuments] = React.useState<Document[]>([]);
  const [documentData, setDocumentData] = React.useState<Document | null>(null);

  // get document by id
  async function fetchDocument(
    documentId: string,
    contentType: "post" | "comment" | "community"
  ) {
    if (!loggedInUserId) return;

    try {
      const { data } = await getDocument({
        variables: {
          collection: contentType,
          loggedInUserId,
          documentId: documentId,
        },
      });

      const res = data?.getDocumentById;

      if (res?.success && res.data) {
        setClickedCardId(documentId);
        setDocumentData(res.data);
      }
    } catch (err) {
      console.error("Error fetching document:", err);
    }
  }

  //get all documents of user
  useEffect(() => {
    async function fetchData() {
      try {
        const { data } = await getDocuments({
          variables: {
            collection,
            loggedInUserId,
          },
        });
        const res = data?.getDocuments;

        if (res?.success && res.data) {
          setDocuments(res.data);
        }
      } catch (err) {
        console.error("Error fetching documents:", err);
      }
    }
    if (loggedInUserId) fetchData();

    document.body.style.overflow = "hidden";
  }, [collection, loggedInUserId]);

  return (
    <div className="w-full flex justify-center">
      <div className="overflow-auto w-1/2 pb-11 px-4 border-r border-[hsl(var(--border))] text-[hsl(var(--input))]">
        <h1 className="text-sm font-bold my-4 p-4">
          Documents{" "}
          <p className="inline text-xs">
            &gt; {collection[0].toUpperCase() + collection.slice(1)}
          </p>
        </h1>

        {loading ? (
          <StudioDocumentsSkeleton />
        ) : documents.length > 0 ? (
          <div>
            {documents.map((doc) => (
              <Card
                key={doc.id}
                item={doc}
                type={collection}
                clickedCardId={clickedCardId}
                onClick={fetchDocument}
              />
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center w-full h-full  font-medium text-[hsl(var(--muted-foreground))]">
            No documents found
          </div>
        )}
      </div>
      {documentData && !documentLoading ? (
        <DocumentView data={documentData} loggedInUserId={loggedInUserId} />
      ) : documentLoading ? (
        <div className="flex items-center justify-center w-full h-full ">
          {" "}
          <Spinner size={48} />
        </div>
      ) : (
        <div className="flex items-center justify-center w-full h-full  font-medium text-[hsl(var(--muted-foreground))]">
          Select a document
        </div>
      )}
    </div>
  );
};

export default StudioDocument;

const Card: React.FC<CardProps> = ({ item, type, clickedCardId, onClick }) => {
  const itemType =
    type === "post" || item.type === "post"
      ? "post"
      : type === "community"
      ? "community"
      : "comment";

  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.02 }}
      transition={{ duration: 0.2 }}
      onClick={() => {
        onClick?.(item.id, itemType);
      }}
      className={cn(
        "flex w-full rounded    transition-all duration-300 cursor-pointer overflow-hidden group",
        clickedCardId === item.id
          ? " bg-[hsl(var(--sidebar-hover))] text-white font-medium"
          : "  hover:bg-[hsl(var(--sidebar-hover))] hover:text-white"
      )}
    >
      {/* Top: Image or Icon */}
      <div className="relative flex justify-center items-center p-2 h-18 w-18  overflow-hidden">
        {item.imgUrl ? (
          <img
            src={item.imgUrl}
            alt={item.title || item.name}
            className=" h-full w-full  object-cover transition-transform duration-500 hover:scale-105"
          />
        ) : (
          <div className="flex items-center justify-center  h-full w-full ">
            {getTypeIcon(type)}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-1 p-3 w-full">
        <h3 className="font-semibold text-sm truncate">
          {item.title || item.name || "Untitled"}
        </h3>
        <p
          className={cn(
            "text-xs  line-clamp-2",
            clickedCardId === item.id
              ? "text-white/70"
              : "text-[hsl(var(--muted-foreground))] group-hover:text-white/70"
          )}
        >
          {item.description || item.content || "No content available."}
        </p>

        <div className="flex justify-between items-center mt-1">
          {type === "engage" && (
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full capitalize font-medium
              ${
                itemType === "post"
                  ? "bg-[hsl(var(--primary))]/15 text-[hsl(var(--primary))]"
                  : itemType === "community"
                  ? "bg-[hsl(var(--secondary))]/20 text-[hsl(var(--secondary-foreground))]"
                  : "text-[hsl(var(--comment-tag-text))] border border-[hsl(var(--comment-tag))]"
              }`}
            >
              {itemType}
            </span>
          )}

          {item.createdAt && (
            <span className="text-[10px] w-full text-right text-[hsl(var(--muted-foreground))]">
              {timeAgo(item.createdAt)}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

function DocumentView({ data, loggedInUserId }: DocumentProps) {
  const [documentData, setDocumentData] = useState<Document>(data);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const [updateDocument, { loading }] =
    useMutation<UpdateDocumentResponse>(UPDATE_DOCUMENT);

  // documentData in sync
  useEffect(() => {
    setDocumentData(data);
  }, [data]);

  // Controlled inputs
  const handleChange = (key: keyof Document, value: string) => {
    setDocumentData((prev) => ({ ...prev, [key]: value }));
  };

  //update document

  async function updateTheDocument() {
    if (!loggedInUserId) return;
    const { id, name, title, content, type, isDeleted, imgUrls } = documentData;

    if (!content.trim()) return toast.warning("Fields are required");

    try {
      const { data } = await updateDocument({
        variables: {
          data: {
            id,
            name,
            title,
            content,
            isDeleted,
            imgUrls,
          },
          loggedInUserId,
          contentType: type,
        },
      });

      if (data?.updateDocument.success) {
        toast.success("Document updated successfully");
        window.location.reload();
      }
    } catch (Err) {
      console.error(Err);
    }
  }

  // type color
  const getTypeColor = () => {
    switch (documentData.type) {
      case "post":
        return "text-[hsl(var(--primary))] border border-[hsl(var(--primary))]";
      case "comment":
        return "text-[hsl(var(--comment-tag-text))] border border-[hsl(var(--comment-tag))]";
      case "community":
        return "text-[hsl(var(--active))] border border-[hsl(var(--active))]";
      default:
        return "border border-[hsl(var(--muted))]";
    }
  };

  if (!documentData) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className=" w-full h-full overflow-auto pb-20  bg-[hsl(var(--card))] text-[hsl(var(--card-foreground))]  p-6  transition-all duration-300"
    >
      {/* Type Badge */}
      <div
        className={`px-3 py-1 w-fit rounded-full text-sm font-medium mb-3 ${getTypeColor()}`}
      >
        {documentData.type === "post" && (
          <div className="flex items-center gap-1">
            <FileText className="w-4 h-4" /> Post
          </div>
        )}
        {documentData.type === "comment" && (
          <div className="flex items-center gap-1">
            <MessageSquare className="w-4 h-4" /> Comment
          </div>
        )}
        {documentData.type === "community" && (
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" /> Community
          </div>
        )}
      </div>

      {/* Owner Info */}
      {documentData.owner && (
        <>
          <p className="text-xs font-light my-2">Created by</p>
          <div className="flex items-center gap-3 mb-4">
            {documentData.owner?.imgUrl ? (
              <img
                src={documentData.owner.imgUrl}
                alt={documentData.owner.name}
                className="w-12 h-12 rounded-full object-cover border border-[hsl(var(--border))]"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center text-[hsl(var(--muted-foreground))] font-bold">
                {documentData.owner.name[0].toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-semibold text-[hsl(var(--foreground))]">
                {documentData.owner.name}
              </p>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                {new Date(documentData.createdAt).toDateString()}
              </p>
            </div>
          </div>
        </>
      )}

      {/* Title & Content */}
      <div className="mb-4 space-y-3">
        <p className="text-xs font-light my-2">Content</p>
        <input
          type="text"
          value={documentData.title || documentData.name || "Untitled"}
          disabled={
            documentData.type !== "post" &&
            loggedInUserId !== documentData.owner?.id
          }
          onChange={(e) => handleChange("title", e.target.value)}
          placeholder="Title"
          className="w-full border border-[hsl(var(--border))] rounded bg-[hsl(var(--popover))] text-[hsl(var(--popover-foreground))] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--active-ring))]"
        />
        <textarea
          value={documentData.content || ""}
          disabled={
            documentData.type !== "post" &&
            loggedInUserId !== documentData.owner?.id
          }
          onChange={(e) => handleChange("content", e.target.value)}
          placeholder="Description"
          className="w-full border border-[hsl(var(--border))] text-sm rounded bg-[hsl(var(--popover))] text-[hsl(var(--popover-foreground))] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--active-ring))] resize-none min-h-[150px]"
        />
      </div>

      {/* Images */}
      {documentData.imgUrls && documentData.imgUrls?.length > 0 && (
        <>
          <p className="text-xs font-light my-2">Images</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4 ">
            {documentData.imgUrls.map((url, i) => (
              <div
                onMouseOver={() => setHoverIndex(i)}
                onMouseLeave={() => setHoverIndex(null)}
                key={i}
                className="relative border border-[hsl(var(--border))] group rounded-[var(--radius)]  overflow-hidden"
              >
                <img
                  src={url}
                  alt={`img-${i}`}
                  className="object-cover w-full h-32 group-hover:opacity-60 sm:h-40 transition-transform"
                />

                {hoverIndex === i && (
                  <X
                    onClick={() =>
                      setDocumentData({
                        ...documentData,
                        imgUrls: documentData.imgUrls?.filter(
                          (_, index) => index !== i
                        ),
                      })
                    }
                    size={48}
                    className="absolute top-1/3 left-1/3 group-hover:opacity-100"
                    stroke="#ce0606"
                  />
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Status Badges */}

      {data.type !== "community" && (
        <>
          <p className="text-xs font-light my-2">Status</p>
          <div className="m-5">
            <div className="flex items-center gap-2 my-2">
              {documentData.isReported ? (
                <ToggleRight size={26} stroke="#ce0606" />
              ) : (
                <ToggleLeft size={26} stroke="gray" />
              )}

              <span
                className={cn(
                  " font-medium ",
                  documentData.isReported && "text-[#ce0606]"
                )}
              >
                Reported
              </span>
              {documentData.isReported && (
                <span className="text-xs text-[#d80606]">
                  {"("}
                  {documentData.reportCount}{" "}
                  {documentData.reportCount > 1
                    ? "users reported )"
                    : "user reported )"}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {documentData.isDeleted ? (
                <ToggleRight
                  onClick={() =>
                    setDocumentData({ ...documentData, isDeleted: false })
                  }
                  size={26}
                  stroke="#ce0606"
                />
              ) : (
                <ToggleLeft
                  onClick={() =>
                    setDocumentData({ ...documentData, isDeleted: true })
                  }
                  size={26}
                  stroke="gray"
                />
              )}

              <span
                className={cn(
                  " font-medium",
                  documentData.isDeleted && "text-[#ce0606]"
                )}
              >
                Deleted
              </span>
            </div>
          </div>
        </>
      )}

      {/* Update Button */}
      {(data.owner?.id === loggedInUserId || data.type === "post") && (
        <div className="flex justify-end">
          <button
            disabled={loading}
            onClick={updateTheDocument}
            className="px-4 py-1 rounded-md bg-[hsl(var(--primary))] text-white active:opacity-100 hover:opacity-80 flex items-center gap-2 font-medium transition-all"
          >
            {loading ? "Updating" : "Update"}
          </button>
        </div>
      )}
    </motion.div>
  );
}
