import { Notification } from "@/types/userTypes";
import { ref, push, set } from "firebase/database";
import { database } from "@/lib/firebase";

export const sendNotification = async (
  userId: string,
  notifData: Notification
) => {
  const notifRef = ref(database, `notifications/${userId}`);
  const newNotifRef = push(notifRef);
  await set(newNotifRef, {
    id: notifData.id,
    postId: notifData.postId,
    commentId: notifData.commentId,
    communityId: notifData.communityId,
    sender: notifData.sender,
    receiver: notifData.receiver,
    createdAt: new Date(notifData.createdAt).getTime(),
    type: notifData.type,
    status: notifData.status,
  });
};
