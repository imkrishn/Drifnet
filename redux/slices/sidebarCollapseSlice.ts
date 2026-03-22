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
    setCollapsed: (state, action) => {
      state.isCollapsed = action.payload;
    },
  },
});

export const { toggleSidebar, setCollapsed } = sidebarCollapseSlice.actions;
export default sidebarCollapseSlice.reducer;
