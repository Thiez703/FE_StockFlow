import { createSlice } from '@reduxjs/toolkit';

const token = localStorage.getItem('token') ?? null;
const raw = localStorage.getItem('user');
const user = raw && raw !== 'undefined' ? JSON.parse(raw) : null;

const authSlice = createSlice({
  name: 'auth',
  initialState: { user, token },
  reducers: {
    setCredentials: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      localStorage.setItem('token', action.payload.token);
      localStorage.setItem('user', JSON.stringify(action.payload.user));
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
