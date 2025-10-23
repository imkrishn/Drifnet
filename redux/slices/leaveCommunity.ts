import { createSlice } from "@reduxjs/toolkit";

const leaveCommunitySlice = createSlice({
  name: "leaveCommunity",
  initialState: null,
  reducers: {
    setLeaveCommunity: (state, action) => {
      return action.payload;
    },
  },
});

export const { setLeaveCommunity } = leaveCommunitySlice.actions;
export default leaveCommunitySlice.reducer;
