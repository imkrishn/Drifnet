import { createSlice } from "@reduxjs/toolkit";

const sidebarCollapseSlice = createSlice({
  name: "sidebarCollapse",
  initialState: {
    isCollapsed: false,
  },
  reducers: {
    toggleSidebar: (state) => {
      state.isCollapsed = !state.isCollapsed;
    },
  },
});

export const { toggleSidebar } = sidebarCollapseSlice.actions;
export default sidebarCollapseSlice.reducer;
