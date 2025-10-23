import { createSlice } from "@reduxjs/toolkit";

const loggedInUserIdSlice = createSlice({
  name: "loggedInUserId",
  initialState: null,
  reducers: {
    setLoggedInUserId: (state, action) => {
      return action.payload;
    },
  },
});

export const { setLoggedInUserId } = loggedInUserIdSlice.actions;
export default loggedInUserIdSlice.reducer;
