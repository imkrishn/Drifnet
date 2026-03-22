import { configureStore } from "@reduxjs/toolkit";
import sidebarCollapse from "./slices/sidebarCollapseSlice";
import loggedInUserId from "./slices/loggedInUserId";
import currentUserSlice from "./slices/currentUserSlice";
import joinCommunitySlice from "./slices/joinCommunitySlice";
import leaveCommunitySlice from "./slices/leaveCommunity";
import socketSlice from "./slices/socketSlice";

export const store = configureStore({
  reducer: {
    sidebarCollapse,
    loggedInUserId,
    currentUser: currentUserSlice,
    joinCommunity: joinCommunitySlice,
    leaveCommunity: leaveCommunitySlice,
    socket: socketSlice,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
