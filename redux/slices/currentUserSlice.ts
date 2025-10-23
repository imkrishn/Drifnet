import { createSlice } from "@reduxjs/toolkit";

const currentUserSlice = createSlice({
  name: "currentUser",
  initialState: {
    name: "",
    url: "",
  },
  reducers: {
    setcurrentUser: (state, action) => {
      state.name = action.payload.name;
      state.url = action.payload.url;
    },
  },
});

export const { setcurrentUser } = currentUserSlice.actions;
export default currentUserSlice.reducer;
