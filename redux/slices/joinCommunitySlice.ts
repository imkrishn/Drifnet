import { createSlice } from "@reduxjs/toolkit";

const joinCommunitySlice = createSlice({
  name: "joinCommunity",
  initialState: {
    id: "",
    name: "",
  },
  reducers: {
    setJoinCommunity: (state, action) => {
      state.id = action.payload.id;
      state.name = action.payload.name;
    },
  },
});

export const { setJoinCommunity } = joinCommunitySlice.actions;
export default joinCommunitySlice.reducer;
