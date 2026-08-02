import { createSlice } from '@reduxjs/toolkit';
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from '@/api/axiosClient';

// Token chỉ sống ở localStorage — axiosClient tự đọc/ghi khi refresh. Không giữ
// bản sao trong store để tránh có hai nguồn sự thật lệch nhau.
const AuthSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    isAuthenticated: !!localStorage.getItem(ACCESS_TOKEN_KEY),
  },
  reducers: {
    loginSuccess: (state, action) => {
      const { user, accessToken, refreshToken } = action.payload;
      state.user = user ?? null;
      state.isAuthenticated = true;
      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      if (refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      }
    },
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    // Chỉ dọn phía client, việc gọi API logout do useLogout lo.
    logout(state) {
      state.user = null;
      state.isAuthenticated = false;
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    },
  },
});

export const { loginSuccess, setUser, logout } = AuthSlice.actions;
export default AuthSlice.reducer;
