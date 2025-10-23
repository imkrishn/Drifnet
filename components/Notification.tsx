import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect } from "react";
import { Bell } from "lucide-react";
import {
  User,
  Users,
  ThumbsUp,
  MessageSquare,
  Eye,
  AlertCircle,
  Check,
  X,
} from "lucide-react";
import { timeAgo } from "@/lib/timeAgo";
import { AcceptRequestResponse, Notification } from "@/types/userTypes";
import Spinner from "./loading/Spinner";
import gql from "graphql-tag";
import { useMutation } from "@apollo/client/react";
import Image from "next/image";

const ACCEPT_REQUEST = gql`
  mutation AcceptRequest(
    $communityId: ID
    $followingId: ID
    $userId: ID!
    $id: ID!
    $action: String!
  ) {
    acceptRequest(
      communityId: $communityId
      followingId: $followingId
      userId: $userId
      id: $id
      action: $action
    ) {
      success
      message
    }
  }
`;

export default function NotificationPanel({
  open,
  onClose,
  loading,
  notifications,
  setNotifications,
}: {
  open: boolean;
  loading: boolean;
  onClose: () => void;
  notifications: Notification[];
  setNotifications: (notifications: Notification[]) => void;
}) {
  const [acceptRequest] = useMutation<AcceptRequestResponse>(ACCEPT_REQUEST);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  async function handleAcceptRequest(
    id: string,
    communityId: string,
    followingId: string,
    userId: string,
    action: "accept" | "reject"
  ) {
    if (!userId || !action) return;
    try {
      const { data } = await acceptRequest({
        variables: {
          communityId,
          userId,
          id,
          action,
          followingId,
        },
      });

      if (data?.acceptRequest.success) {
        setNotifications(notifications.filter((notify) => notify.id !== id));
      }
    } catch (Err) {
      console.error("Error while acceptig request :", Err);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-[380px] h-full bg-[hsl(var(--background))] text-[hsl(var(--foreground))]  shadow-2xl flex flex-col"
            initial={{ x: 300 }}
            animate={{ x: 0 }}
            exit={{ x: 300 }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
          >
            <div className="flex items-center justify-between p-4 border-b border-[hsl(var(--border))]">
              <div className="flex items-center gap-2">
                <Bell size={22} className="text-[hsl(var(--primary))]" />
                <h2 className="font-semibold text-lg">Notifications</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-[hsl(var(--muted))] transition"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 justify-center items-center scrollbar-thin p-3 space-y-3">
              {loading ? (
                <div className="flex justify-center items-center">
                  <Spinner size={40} />
                </div>
              ) : notifications.length > 0 ? (
                notifications.map((n) => (
                  <NotificationCard
                    key={n.id}
                    notification={n}
                    onAction={handleAcceptRequest}
                  />
                ))
              ) : (
                <p className="text-sm text-[hsl(var(--muted-foreground))] text-center mt-10">
                  No notifications 🎉
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface NotificationCardProps {
  notification: Notification;
  onAction?: (
    id: string,
    communityId: string,
    followingId: string,
    userId: string,
    action: "accept" | "reject"
  ) => void;
}

export const NotificationCard = ({
  notification,
  onAction,
}: NotificationCardProps) => {
  const { type, sender, status, createdAt, communityId, id, receiver } =
    notification;

  const typeConfig: Record<
    string,
    {
      icon: React.ReactNode;
      text: (senderName: string, targetName?: string) => string;
    }
  > = {
    FOLLOW_REQUEST: {
      icon: <User size={22} className="text-[var(--icon-follow)]" />,
      text: (name) => `${name} requested to follow you`,
    },
    FOLLOWED: {
      icon: <User size={22} className="text-[var(--icon-follow)]" />,
      text: (name) => `${name} started following you`,
    },
    JOIN_REQUEST_COMMUNITY: {
      icon: <Users size={22} className="text-[var(--icon-community)]" />,
      text: (name, targetName) =>
        `${name} requested to join ${targetName || "your community"}`,
    },
    JOINED_COMMUNITY: {
      icon: <Users size={22} className="text-[var(--icon-community)]" />,
      text: (name, targetName) =>
        `${name} joined ${targetName || "your community"}`,
    },
    LIKE_POST: {
      icon: <ThumbsUp size={22} className="text-[var(--icon-like)]" />,
      text: (name) => `${name} liked your post`,
    },
    COMMENT_POST: {
      icon: <MessageSquare size={22} className="text-[var(--icon-comment)]" />,
      text: (name) => `${name} commented on your post`,
    },
    PROFILE_VIEW: {
      icon: <Eye size={22} className="text-[var(--icon-profile)]" />,
      text: (name) => `${name} viewed your profile`,
    },
    REPORT: {
      icon: <AlertCircle size={22} className="text-red-500" />,
      text: (name) => `${name} reported your content`,
    },
  };

  const config = typeConfig[type];

  return (
    <motion.div
      className={`flex items-center gap-4 p-4 rounded-sm hover:border border-[hsl(var(--border))] transition ${
        status === "UNREAD"
          ? "bg-[var(--accent)]"
          : "bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)]"
      }`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Avatar */}
      <Image
        width={100}
        height={100}
        src={sender.imgUrl || "/default-avatar.png"}
        alt={sender.name}
        className="w-12 h-12 rounded-full object-cover border border-[var(--border)]"
      />

      {/* Content */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center gap-2 text-sm">
          {config.icon}
          <p className="font-semibold text-[var(--text-primary)]">
            {sender.name}
          </p>
        </div>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          {config.text(sender.name)}
        </p>
        <p className="text-[10px] text-[var(--text-secondary)] mt-1">
          {timeAgo(createdAt)}
        </p>
      </div>

      {/* Accept / Reject Buttons */}
      {(type === "FOLLOW_REQUEST" || type === "JOIN_REQUEST_COMMUNITY") &&
        status === "UNREAD" &&
        onAction && (
          <div className="flex flex-col gap-2">
            <button
              onClick={() =>
                onAction(
                  id,
                  communityId!,
                  receiver.id,
                  notification.sender.id,
                  "accept"
                )
              }
              className="p-2 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition shadow"
            >
              <Check size={18} />
            </button>
            <button
              onClick={() =>
                onAction(
                  id,
                  communityId!,
                  receiver.id,
                  notification.sender.id,
                  "reject"
                )
              }
              className="p-2 rounded-xl bg-[var(--destructive)] text-[var(--destructive-foreground)] hover:opacity-90 transition shadow"
            >
              <X size={18} />
            </button>
          </div>
        )}
    </motion.div>
  );
};
