"use client";

import NextImage from "next/image";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ThumbsUp,
  ThumbsDown,
  MessageSquareText,
  Flag,
  CornerDownRight,
  ChevronsRight,
  ChevronsLeft,
  SendHorizontal,
  MoreVertical,
} from "lucide-react";
import { cn } from "../lib/utils";
import { timeAgo } from "@/lib/timeAgo";
import {
  AddCommentResponse,
  Comment,
  CommentsResponse,
  DeleteCommentResponse,
  EditCommentResponse,
  Post,
  ReportResponse,
} from "@/types/postType";
import gql from "graphql-tag";
import { useLazyQuery, useMutation } from "@apollo/client/react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { manageHighValue } from "@/lib/manageHighValue";
import { CommunityBtn, FollowBtn } from "./Buttons";
import WarningModal from "./WarningAlert";

const LIKE_DISLIKE_ACTIONS = gql`
  mutation LikeDislikeActions(
    $postId: String!
    $commentId: String
    $userId: String!
    $type: String!
  ) {
    likeDislikeActions(
      postId: $postId
      commentId: $commentId
      userId: $userId
      type: $type
    ) {
      success
      message
    }
  }
`;

const ADD_COMMENTS = gql`
  mutation AddComment(
    $postId: String!
    $userId: String!
    $parentCommentId: String
    $content: String!
  ) {
    addComment(
      postId: $postId
      userId: $userId
      parentCommentId: $parentCommentId
      content: $content
    ) {
      success
      message
      warnAI
      comments {
        id
        content
        createdAt
        isLiked
        likeCount
        parentCommentId
        user {
          id
          name
          imgUrl
        }
      }
    }
  }
`;

const GET_COMMENTS = gql`
  query GetComments(
    $postId: String!
    $userId: String
    $parentCommentId: String
  ) {
    getComments(
      postId: $postId
      userId: $userId
      parentCommentId: $parentCommentId
    ) {
      success
      comments {
        id
        content
        createdAt
        isLiked
        likeCount
        parentCommentId
        user {
          id
          name
          imgUrl
        }
      }
    }
  }
`;

const DELETE_COMMENT = gql`
  mutation DeleteComment($commentId: String!, $userId: String!) {
    deleteComment(commentId: $commentId, userId: $userId) {
      success
      message
    }
  }
`;

const EDIT_COMMENT = gql`
  mutation EditComment(
    $commentId: String!
    $userId: String!
    $content: String!
  ) {
    editComment(commentId: $commentId, userId: $userId, content: $content) {
      success
      message
    }
  }
`;

const REPORT = gql`
  mutation Report(
    $commentId: String
    $postId: String
    $reportedUserId: String!
    $reason: String!
  ) {
    report(
      commentId: $commentId
      postId: $postId
      reportedUserId: $reportedUserId
      reason: $reason
    ) {
      success
      message
    }
  }
`;

const DELETE_POSTS = gql`
  mutation DeletePost($postId: String!, $userId: String!) {
    deletePost(postId: $postId, userId: $userId) {
      success
      message
    }
  }
`;

type ReportProps = {
  label: string;
  postId: string | null;
  commentId: string | null;
  reportedUserId: string;
};

//Report Modal

function ReportModal({
  open,
  onClose,
  targetLabel,
}: {
  open: boolean;
  onClose: () => void;
  targetLabel: ReportProps;
}) {
  const [reason, setReason] = useState<string>("");
  const [details, setDetails] = useState<string>("");
  const [report, { loading }] = useMutation<ReportResponse>(REPORT);

  useEffect(() => {
    if (!open) {
      setReason("");
      setDetails("");
    }
  }, [open]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const { reportedUserId, commentId, postId } = targetLabel;

    if (!reason.trim() || !reportedUserId) return;

    try {
      const res = await report({
        variables: {
          reason,
          reportedUserId,
          commentId,
          postId,
        },
      });

      const result = res.data?.report;

      if (result?.success) {
        toast.success(`${commentId ? "Comment" : "Post"} Reported`);
        onClose();
      }
    } catch (err) {
      console.error("Error reporting ", err);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative w-[92%] max-w-md rounded-xl border p-5 bg-[hsl(var(--card))] text-[hsl(var(--card-foreground))] shadow-xl">
        <h3 className="text-lg font-semibold">Report {targetLabel.label}</h3>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          Tell us what’s wrong.
        </p>

        <form className="mt-4 space-y-3" onSubmit={onSubmit}>
          {["Spam", "Harassment", "Misinformation", "Hate or abuse"].map(
            (label) => (
              <label key={label} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="reason"
                  value={label}
                  checked={reason === label}
                  onChange={() => setReason(label)}
                  className="h-4 w-4 accent-[hsl(var(--primary))]"
                />
                {label}
              </label>
            )
          )}

          <textarea
            placeholder="Additional details (optional)"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            className="mt-2 w-full rounded-lg border p-3 text-sm outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
            rows={3}
          />

          <div className="mt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-sm rounded-lg border hover:bg-[hsl(var(--popover))]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 text-sm rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:brightness-110"
              disabled={!reason}
            >
              {loading ? "Submitting" : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

//Timeline Group
function TimelineGroup({
  children,
  offsetPx = 12,
}: {
  children: React.ReactNode;
  offsetPx?: number;
}) {
  return (
    <div className="relative" style={{ paddingLeft: offsetPx + 12 }}>
      <div
        className="absolute top-0 bottom-0 border-l"
        style={{ left: offsetPx, borderColor: "hsl(var(--border))" }}
      />
      {children}
    </div>
  );
}

function CommentItem({
  data,
  postId,
  loggedInUserId,
  depth = 0,
  onToggleCommentLike,
  onOpenReport,
  handleDeleteSuccess,
}: {
  data: Comment;
  loggedInUserId: string | null;
  depth?: number;
  postId: string;
  onToggleCommentLike: (commentId: string, action: "LIKE") => void;
  onOpenReport: (targetLabel: ReportProps) => void;
  handleDeleteSuccess: (id: string) => void;
}) {
  const [liked, setLiked] = useState(Boolean(data.isLiked));
  const [likes, setLikes] = useState<number>(data.likeCount ?? 0);
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [showEditBox, setShowEditBox] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [replies, setReplies] = useState<Comment[]>([]);
  const [replyValue, setReplyValue] = useState("");
  const [editValue, setEditValue] = useState(data.content);

  const [addReply, { loading }] = useMutation<AddCommentResponse>(ADD_COMMENTS);
  const [deleteComment, { loading: deleteLoading }] =
    useMutation<DeleteCommentResponse>(DELETE_COMMENT);
  const [editComment, { loading: editLoading }] =
    useMutation<EditCommentResponse>(EDIT_COMMENT);
  const [getReply] = useLazyQuery<CommentsResponse>(GET_COMMENTS, {
    fetchPolicy: "network-only",
  });

  const menuRef = useRef<HTMLDivElement>(null);

  // Sync props to state
  useEffect(() => setLiked(Boolean(data.isLiked)), [data.isLiked]);
  useEffect(() => setLikes(Number(data.likeCount ?? 0)), [data.likeCount]);

  // Close menu when clicking outside

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // like action
  const handleLike = () => {
    if (!loggedInUserId)
      return (window.location.href = `${process.env.NEXT_PUBLIC_URL}/auth/login`);
    const action = "LIKE";
    if (liked) {
      setLiked(false);
      setLikes((n) => Math.max(0, n - 1));
    } else {
      setLiked(true);
      setLikes((n) => n + 1);
    }
    onToggleCommentLike(data.id, action as "LIKE");
  };

  //add reply
  const submitReply = async () => {
    if (!replyValue.trim()) return;
    if (!loggedInUserId)
      return (window.location.href = `${process.env.NEXT_PUBLIC_URL}/auth/login`);
    try {
      const res = await addReply({
        variables: {
          userId: loggedInUserId,
          postId,
          parentCommentId: data.id,
          content: replyValue,
        },
      });
      const result = res.data?.addComment;
      if (result?.success) {
        setReplyValue("");
        setReplies((prev) => [result.comments[0], ...prev]);
        setShowReplyBox(false);
        setShowReplies(true);
      }
    } catch (err) {
      console.error("Error Adding Comment Reply:", err);
    }
  };

  // fetch replies
  const getReplies = async () => {
    if (showReplies) return setShowReplies(false);
    try {
      const res = await getReply({
        variables: { postId, userId: data.user.id, parentCommentId: data.id },
      });
      const result = res.data?.getComments;
      if (result?.success) {
        setReplies(result.comments);
        setShowReplies(true);
      }
    } catch (err) {
      console.error("Error fetching comment replies:", err);
    }
  };

  //remove reply from ui
  const handleRepliesDeleteSuccess = (id: string) => {
    setReplies((prev) => prev.filter((c) => c.id !== id));
  };

  //edit comment
  const commentEdit = async () => {
    if (!editValue.trim()) return;
    if (!loggedInUserId)
      window.location.href = `${process.env.NEXT_PUBLIC_URL}/auth/login`;
    try {
      const res = await editComment({
        variables: {
          commentId: data.id,
          userId: loggedInUserId,
          content: editValue,
        },
      });
      const result = res.data?.editComment;
      if (result?.success) {
        setShowEditBox(false);
        toast.success("Comment updated");
      }
    } catch (err) {
      console.error("Error editing comment:", err);
    }
  };

  // delete comment
  const commentDelete = async () => {
    try {
      const res = await deleteComment({
        variables: { commentId: data.id, userId: loggedInUserId },
      });
      const result = res.data?.deleteComment;
      if (result?.success) {
        handleDeleteSuccess(data.id);
        toast.success(result.message);
      }
    } catch (err) {
      console.error("Error deleting comment:", err);
      toast.error("Failed to delete comment");
    }
  };

  return (
    <div className="relative pl-2">
      <div className="flex items-start gap-3">
        <img
          src={data.user.imgUrl}
          alt={data.user.name}
          className="lg:h-10 lg:w-10 h-6 w-6 rounded-full object-cover"
        />
        <div className="flex-1">
          {/* header */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 group">
            <p className="font-medium">{data.user.name}</p>
            <span className="text-xs text-[hsl(var(--muted-foreground))]">
              {timeAgo(data.createdAt)}
            </span>

            {loggedInUserId === data.user.id && (
              <div className="ml-2" ref={menuRef}>
                <MoreVertical
                  onClick={() => setMenuOpen((o) => !o)}
                  className="h-4 w-4 cursor-pointer absolute right-0"
                />
                {menuOpen && (
                  <div className="absolute right-2 mt-1 w-32 p-1 rounded-md shadow-lg border border-[hsl(var(--border))] z-20 bg-[hsl(var(--sidebar-background))]">
                    <button
                      onClick={() => setShowEditBox(true)}
                      className="block w-full text-left px-3 py-2 my-1 rounded text-sm hover:text-[hsl(var(--background))] hover:bg-[hsl(var(--sidebar-hover))]"
                    >
                      Edit
                    </button>
                    <button
                      disabled={deleteLoading}
                      onClick={commentDelete}
                      className="block w-full text-left px-3 py-2 my-1 rounded text-sm text-red-600 hover:bg-[hsl(var(--sidebar-hover))]"
                    >
                      {deleteLoading ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* content */}
          {!showEditBox && (
            <p className="mt-1 lg:text-base text-sm text-[hsl(var(--card-foreground))]">
              {editValue}
            </p>
          )}

          {/* actions */}
          <div className="mt-2 flex items-center gap-4 lg:text-sm text-xs">
            <button
              onClick={handleLike}
              className={cn(
                "inline-flex items-center gap-1 hover:underline",
                liked
                  ? "text-[hsl(var(--primary))]"
                  : "text-[hsl(var(--muted-foreground))]"
              )}
            >
              <ThumbsUp size={16} />
              <span>{likes > 0 ? manageHighValue(likes) : "Like"}</span>
            </button>

            <button
              onClick={() => setShowReplyBox((v) => !v)}
              className="inline-flex items-center gap-1 text-[hsl(var(--muted-foreground))] hover:underline"
            >
              <CornerDownRight size={16} />
              Reply
            </button>

            <button
              onClick={getReplies}
              className="text-blue-600 hover:text-blue-800"
            >
              Replies
            </button>

            <button
              onClick={() =>
                onOpenReport({
                  label: "this Comment",
                  postId: null,
                  commentId: data.id,
                  reportedUserId: data.user.id,
                })
              }
              className="inline-flex items-center gap-1 text-[hsl(var(--muted-foreground))] hover:text-red-500"
            >
              <Flag size={16} />
              Report
            </button>
          </div>

          {/* Reply box */}
          {showReplyBox && (
            <div className="mt-3 flex lg:flex-row flex-col items-start gap-2">
              <textarea
                disabled={loading}
                value={replyValue}
                onChange={(e) => setReplyValue(e.target.value)}
                rows={2}
                placeholder="Write a reply..."
                className="flex-1 rounded-md border p-2 text-sm outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
              />
              <button
                disabled={loading}
                onClick={submitReply}
                className="self-end rounded-md bg-[hsl(var(--primary))] px-3 py-1.5 text-sm text-[hsl(var(--primary-foreground))] hover:brightness-110"
              >
                {loading ? "Replying..." : "Reply"}
              </button>
            </div>
          )}

          {/* Edit box */}
          {showEditBox && (
            <div className="mt-3 flex lg:flex-row flex-col items-start gap-2">
              <textarea
                disabled={editLoading}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                rows={2}
                placeholder="Edit your comment..."
                className="flex-1 rounded-md border p-2 text-sm outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
              />
              <button
                disabled={editLoading}
                onClick={commentEdit}
                className="self-end rounded-md bg-[hsl(var(--primary))] px-3 py-1.5 text-sm text-[hsl(var(--primary-foreground))] hover:brightness-110"
              >
                {editLoading ? "Updating..." : "Update"}
              </button>
            </div>
          )}

          {/* Replies */}
          {showReplies && replies?.length > 0 && (
            <div className="mt-4">
              <TimelineGroup offsetPx={depth + 1}>
                <div className="space-y-6">
                  {replies.map((r) => (
                    <CommentItem
                      key={r.id}
                      data={r}
                      loggedInUserId={loggedInUserId}
                      postId={postId}
                      depth={depth + 1}
                      onToggleCommentLike={onToggleCommentLike}
                      handleDeleteSuccess={handleRepliesDeleteSuccess}
                      onOpenReport={onOpenReport}
                    />
                  ))}
                </div>
              </TimelineGroup>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// PostCard

export default function PostCard({
  postData,
  userId,
  showBtn,
  onDelete,
}: {
  postData: Post;
  userId: string | null;
  showBtn?: boolean;
  onDelete?: (id: string) => void;
}) {
  const initialLikeCount = Number(
    (postData as any).likeCount ?? (postData as any).likesCount ?? 0
  );
  const initialIsLiked = Boolean((postData as any).isLiked);
  const initialIsDisliked = Boolean((postData as any).isDisliked);
  const route = useRouter();

  const loggedInUserId = useSelector(
    (state: RootState) => state.loggedInUserId
  );
  const dispatchedUser = useSelector((state: RootState) => state.currentUser);

  const [likeCount, setLikeCount] = useState<number>(initialLikeCount);
  const [like, setLike] = useState<boolean>(initialIsLiked);
  const [dislike, setDislike] = useState<boolean>(initialIsDisliked);
  const [followStatus, setFollowStatus] = useState<
    "Follow" | "Following" | "Requested" | "Follow Back"
  >();
  const [communityJoinedStatus, setCommunityJoinedStatus] = useState<
    "Join" | "Requested" | "Joined"
  >();

  const [comments, setComments] = useState<Comment[] | undefined>(undefined);
  const [isCommentsOpen, setIsCommentsOpen] = useState<boolean>(false);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [commentContent, setCommentContent] = useState<string>("");
  const [logoUrl, setLogoUrl] = useState("");
  const [userName, setUserName] = useState("");
  const [loadingComment, setLoadingComment] = useState<boolean>(false);
  const [truncate, setTruncate] = useState<boolean>(false);
  const [warningAlert, setWarningAlert] = useState<boolean>(false);
  const [warnAIMessage, setWarnAIMessage] = useState<string | null>(null);

  const [reportOpen, setReportOpen] = useState(false);
  const [reportTargetLabel, setReportTargetLabel] = useState<ReportProps>({
    label: "this post",
    postId: postData.id,
    commentId: null,
    reportedUserId: postData.user.id,
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const divRef = useRef<HTMLDivElement | null>(null);

  const [likeDislikeActions] = useMutation(LIKE_DISLIKE_ACTIONS);
  const [addComment] = useMutation<AddCommentResponse>(ADD_COMMENTS);
  const [getCommentsQuery, { loading: commentsLoading }] =
    useLazyQuery<CommentsResponse>(GET_COMMENTS, {
      fetchPolicy: "network-only",
    });

  const [deletePost, { loading: deleteLoading }] = useMutation<{
    deletePost: { success: boolean; message: string };
  }>(DELETE_POSTS);

  const focusDiv = useCallback(() => {
    divRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, []);

  //load prev and next images
  useEffect(() => {
    const images = postData.imgUrls ?? [];
    if (!images.length) return;
    const next = new Image();
    next.src = images[(currentIndex + 1) % images.length];
    const prev = new Image();
    prev.src = images[(currentIndex - 1 + images.length) % images.length];
  }, [currentIndex, postData.imgUrls]);

  useEffect(() => {
    setLike(Boolean(postData?.isLiked));
    setDislike(Boolean(postData?.isDisliked));
    setLikeCount(Number(postData?.likesCount ?? postData?.likesCount ?? 0));

    if (postData?.user) {
      const { isRequested, isFollowedByCurrentUser, followsCurrentUser } =
        postData.user;
      if (isRequested) setFollowStatus("Requested");
      else if (followsCurrentUser && !isFollowedByCurrentUser)
        setFollowStatus("Follow Back");
      else if (isFollowedByCurrentUser) setFollowStatus("Following");
      else setFollowStatus("Follow");
    }

    if (postData?.community) {
      if (postData.community.isRequested) setCommunityJoinedStatus("Requested");
      else if (postData.community.isCommunityMember)
        setCommunityJoinedStatus("Joined");
      else setCommunityJoinedStatus("Join");
    }
  }, [
    postData?.isLiked,
    postData?.isDisliked,
    postData?.likesCount,
    postData?.likesCount,
    postData?.user?.isRequested,
    postData?.user?.isFollowedByCurrentUser,
    postData?.user?.followsCurrentUser,
    postData?.community?.isRequested,
    postData?.community?.isCommunityMember,
  ]);

  useEffect(() => {
    if (loggedInUserId === postData.user.id) {
      setLogoUrl(dispatchedUser.url);
      setUserName(dispatchedUser.name);
    }
  }, [dispatchedUser]);

  // handle post like/dislike actions
  const handlePostEngagement = useCallback(
    async (action: "LIKE" | "DISLIKE") => {
      if (!loggedInUserId)
        return (window.location.href = `${process.env.NEXT_PUBLIC_URL}/auth/login`);
      try {
        if (action === "LIKE") {
          if (like) {
            setLike(false);
            setLikeCount((c) => Math.max(0, c - 1));
          } else {
            setLike(true);
            setDislike(false);
            setLikeCount((c) => c + 1);
          }
        } else {
          if (dislike) {
            setDislike(false);
          } else {
            setDislike(true);
            if (like) {
              setLike(false);
              setLikeCount((c) => Math.max(0, c - 1));
            }
          }
        }

        await likeDislikeActions({
          variables: {
            postId: postData.id,
            userId,
            type: action,
          },
        });
      } catch (err) {
        console.error("Like/Dislike error:", err);
      }
    },
    [like, dislike, likeDislikeActions, postData.id, userId]
  );

  // handle comment like action
  const toggleCommentEngagement = useCallback(
    async (commentId: string, action: "LIKE") => {
      if (!loggedInUserId)
        return (window.location.href = `${process.env.NEXT_PUBLIC_URL}/auth/login`);
      try {
        await likeDislikeActions({
          variables: {
            commentId,
            userId,
            postId: postData.id,
            type: action,
          },
        });
      } catch (err) {
        console.error("Comment like error:", err);
      }
    },
    [likeDislikeActions, userId]
  );

  // fetch Comments
  const getAllComments = useCallback(async () => {
    if (!postData.id) return;
    if (isCommentsOpen) return setIsCommentsOpen(false);

    try {
      const res = await getCommentsQuery({
        variables: { postId: postData.id, userId, parentCommentId: null },
      });

      const payload = res.data?.getComments;
      if (payload?.success) {
        setComments(payload.comments);
      }

      setIsCommentsOpen(true);
      setTimeout(() => focusDiv(), 60);
    } catch (err) {
      console.error("Error while fetching Comments:", err);
    }
  }, [getCommentsQuery, postData.id, userId, isCommentsOpen, focusDiv]);

  //add Comment
  const addTheComment = useCallback(
    async ({
      parentCommentId,
      content,
    }: {
      parentCommentId?: string;
      content: string;
    }) => {
      if (!postData.id || !userId || !content.trim()) return;
      if (!loggedInUserId)
        return (window.location.href = `${process.env.NEXT_PUBLIC_URL}/auth/login`);
      if (loadingComment) return;
      setLoadingComment(true);

      try {
        const res = await addComment({
          variables: {
            postId: postData.id,
            userId,
            parentCommentId: parentCommentId ?? null,
            content,
          },
        });

        const commentRes = res.data?.addComment;
        if (commentRes?.success) {
          const newComments = commentRes.comments ?? [];
          if (commentRes.warnAI) {
            setWarningAlert(true);
            setWarnAIMessage(commentRes.warnAI);
            return;
          }
          setCommentContent("");
          setComments((prev) =>
            prev ? [...newComments, ...prev] : newComments
          );
        }
      } catch (err) {
        console.error("Error while adding comment:", err);
      } finally {
        setLoadingComment(false);
      }
    },
    [addComment, postData.id, userId, loadingComment]
  );

  //delete post

  async function handlePostDelete() {
    if (!loggedInUserId) return;
    if (!postData.id) return;
    try {
      const res = await deletePost({
        variables: { postId: postData.id, userId: loggedInUserId },
      });
      const result = res.data?.deletePost;
      if (result?.success) {
        toast.success("Post deleted");
        if (onDelete) onDelete(postData.id);
      } else {
        toast.error(result?.message || "Failed to delete post");
      }
    } catch (err) {
      console.error("Error deleting post:", err);
      toast.error("Failed to delete post");
    }
  }

  // Report Handler
  const handleOpenReport = (targetLabel: ReportProps) => {
    if (!loggedInUserId)
      return (window.location.href = `${process.env.NEXT_PUBLIC_URL}/auth/login`);
    setReportTargetLabel(targetLabel);
    setReportOpen(true);
  };

  const handleDeleteSuccess = (id: string) => {
    setComments((prev) => prev?.filter((comment) => comment.id !== id));
  };

  const images = postData.imgUrls ?? [];

  return (
    <div className="mx-auto min-w-full max-w-2xl my-3 rounded  bg-[hsl(var(--card))] text-[hsl(var(--card-foreground))] shadow-sm p-6">
      <div className="flex items-center gap-3">
        <WarningModal
          open={warningAlert}
          onClose={() => {
            setWarningAlert(false);
            setWarnAIMessage(null);
          }}
          onConfirm={() => {
            setWarningAlert(false);
            setWarnAIMessage(null);
          }}
          message={warnAIMessage as string}
        />
        <div className="relative">
          {/* Community Avatar */}
          {postData.community?.imgUrl && (
            <img
              src={postData.community.imgUrl}
              alt={postData.community.name}
              className="w-14  rounded-full  object-cover border border-[hsl(var(--border))] shadow-sm"
            />
          )}
          <img
            src={logoUrl || postData.user.imgUrl}
            alt={postData.user.name}
            className={cn(
              "  rounded-full border-2 border-[hsl(var(--border))] shadow-md",
              postData.community?.imgUrl
                ? "absolute -bottom-2 w-8 -right-2"
                : "w-11"
            )}
          />
        </div>

        <div className="flex w-full flex-col">
          <div className="text-sm  font-medium">
            <span
              onClick={() => route.push(`/view/${postData.user.id}`)}
              className="hover:opacity-80 cursor-pointer"
            >
              {userName || postData.user.name}
            </span>
            {postData.community?.id && (
              <span className=" font-semibold text-indigo-600">
                <span className=" inline text-[hsl(var(--primary))]"> in </span>{" "}
                <span
                  className="hover:opacity-80 cursor-pointer"
                  onClick={() =>
                    route.push(`/community/${postData.community?.id}`)
                  }
                >
                  {postData.community?.name}
                </span>
              </span>
            )}
          </div>
          <div className="text-xs w-full flex gap-2">
            {postData.community?.id && postData.community?.membersCount && (
              <span>
                {manageHighValue(postData.community.membersCount)} members •{" "}
              </span>
            )}

            <span>{timeAgo(postData.createdAt)}</span>
          </div>
        </div>

        {loggedInUserId === postData.user.id ? (
          <div className="ml-2 relative">
            <MoreVertical
              onClick={() => setMenuOpen((o) => !o)}
              className="h-4 w-4 cursor-pointer "
            />
            {menuOpen && (
              <div className="absolute right-2 mt-1 w-32 p-1 rounded-md shadow-lg border border-[hsl(var(--border))] z-20 bg-[hsl(var(--sidebar-background))]">
                <button
                  disabled={deleteLoading}
                  onClick={handlePostDelete}
                  className="block w-full text-left px-3 py-2 my-1 rounded text-sm text-red-600 hover:bg-[hsl(var(--destructive-foreground))]"
                >
                  {deleteLoading ? "Deleting..." : "Delete"}
                </button>
              </div>
            )}
          </div>
        ) : (
          showBtn &&
          (postData.community?.id ? (
            <CommunityBtn
              loggedInUserId={loggedInUserId}
              userId={userId}
              communityId={postData.community.id}
              communityJoinedStatus={communityJoinedStatus}
              setCommunityJoinedStatus={setCommunityJoinedStatus}
            />
          ) : (
            <FollowBtn
              loggedInUserId={loggedInUserId}
              followerId={userId}
              followingId={postData.user.id}
              followStatus={followStatus}
              setFollowStatus={setFollowStatus}
            />
          ))
        )}
      </div>

      {/* Title & Body */}
      <h1 className="mt-4 lg:text-2xl text-xl font-extrabold tracking-tight">
        {postData.title}
      </h1>
      <p
        className={cn(
          "mt-3  lg:text-[15px] text-[12px] lg:leading-7 leading-4 text-[hsl(var(--muted-foreground))]",
          !truncate && "truncate h-6"
        )}
        onClick={() => setTruncate(true)}
      >
        {postData.body}
      </p>

      {/* Image Carousel */}
      {images.length > 0 && (
        <div className="mt-4 overflow-hidden">
          <NextImage
            width={1000}
            height={600}
            src={images[currentIndex]}
            alt="Post Banner"
            className="h-60 w-full object-cover hover:opacity-80 rounded-md border border-[hsl(var(--border))] transition-all"
            onClick={() => window.open(images[currentIndex], "_blank")}
          />
          <div className="flex items-center gap-5 justify-center my-3 text-[hsl(var(--sidebar-text))]">
            <ChevronsLeft
              onClick={() => currentIndex > 0 && setCurrentIndex((i) => i - 1)}
              size={25}
              className="cursor-pointer active:text-black"
            />
            {images.map((_, index) => (
              <div
                key={index}
                className={cn(
                  "rounded-full h-2 w-2",
                  index === currentIndex
                    ? "bg-[hsl(var(--foreground))]/80"
                    : "bg-[hsl(var(--foreground))]/20"
                )}
              />
            ))}
            <ChevronsRight
              onClick={() =>
                currentIndex < images.length - 1 &&
                setCurrentIndex((i) => i + 1)
              }
              size={25}
              className="cursor-pointer active:text-black"
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center lg:gap-6 gap-2 lg:text-base text-xs">
          <button
            onClick={() => handlePostEngagement("LIKE")}
            className={cn(
              "inline-flex items-center gap-2  hover:opacity-80",
              like
                ? "text-[hsl(var(--primary))]"
                : "text-[hsl(var(--card-foreground))]"
            )}
            title="LIKE"
          >
            <ThumbsUp size={18} />
            <span className="text-base">
              {likeCount > 0 ? manageHighValue(likeCount) : ""}
            </span>
          </button>

          <button
            onClick={() => handlePostEngagement("DISLIKE")}
            className={cn(
              "inline-flex items-center gap-2  hover:opacity-80",
              dislike
                ? "text-[hsl(var(--primary))]"
                : "text-[hsl(var(--card-foreground))]"
            )}
            title="DISLIKE"
          >
            <ThumbsDown size={18} />
          </button>

          <div
            className="inline-flex items-center gap-2 text-[hsl(var(--card-foreground))]"
            title="Comments"
            onClick={() => getAllComments()}
          >
            <MessageSquareText size={17} className="hover:text-blue-600" />
            <span className="text-base ">
              {comments ? comments?.length : postData.commentsCount}
            </span>
          </div>
        </div>

        <button
          onClick={() =>
            handleOpenReport({
              label: "this post",
              postId: postData.id,
              commentId: null,
              reportedUserId: postData.user.id,
            })
          }
          className="inline-flex items-center gap-2 text-[hsl(var(--muted-foreground))] hover:text-red-500"
        >
          <Flag size={18} />
          <span className="lg:text-[15px] text-[12px] ml-2">Report</span>
        </button>
      </div>

      {/* Comments Section */}
      {isCommentsOpen && (
        <>
          <hr className="my-5 border-[hsl(var(--border))]" />
          <h3 className="lg:text-lg text-sm font-semibold">Comments</h3>

          <div className="mt-4">
            <div className="mb-3 flex items-center gap-3">
              <input
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                disabled={loadingComment}
                type="text"
                placeholder="Comment here"
                className="outline-none rounded-lg px-4 py-1 border border-[hsl(var(--border))] bg-transparent w-full"
              />
              <SendHorizontal
                size={28}
                className={cn(
                  "cursor-pointer text-[hsl(var(--primary))]",
                  loadingComment && "opacity-25"
                )}
                onClick={() =>
                  addTheComment({
                    parentCommentId: undefined,
                    content: commentContent,
                  })
                }
              />
            </div>

            <div className="lg:space-y-6 space-y-2" ref={divRef}>
              {comments && comments.length > 0 ? (
                comments.map((c: Comment) => (
                  <CommentItem
                    loggedInUserId={loggedInUserId}
                    key={c.id}
                    postId={postData.id}
                    data={c}
                    depth={0}
                    onToggleCommentLike={toggleCommentEngagement}
                    handleDeleteSuccess={handleDeleteSuccess}
                    onOpenReport={handleOpenReport}
                  />
                ))
              ) : commentsLoading ? (
                <p>Loading comments...</p>
              ) : (
                <p className="text-[hsl(var(--muted-foreground))]">
                  No comments yet
                </p>
              )}
            </div>
          </div>
        </>
      )}

      <ReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        targetLabel={reportTargetLabel}
      />
    </div>
  );
}
