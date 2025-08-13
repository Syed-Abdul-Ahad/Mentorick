import { createSlice } from '@reduxjs/toolkit';

// Simple initial state - only what we really need
const initialState = {
  user: null,
  isAuthenticated: false,
};

// Simple auth slice - no async thunks, just actions
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
    },
    clearUser: (state) => {
      state.user = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setUser, clearUser } = authSlice.actions;
export default authSlice.reducer;
