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
      const userPayload = action.payload;
      if (userPayload) {
        // Chuẩn hóa cờ đổi mật khẩu nếu BE trả về snake_case hoặc chuỗi
        userPayload.mustChangePassword = 
          userPayload.mustChangePassword === true || 
          userPayload.must_change_password === true ||
          userPayload.mustChangePassword === 'true' || 
          userPayload.mustChangePassword === 1 || 
          userPayload.must_change_password === 1;
      }
      state.user = userPayload;
      state.isAuthenticated = true;
    },
    // Hạ cờ mustChangePassword sau khi người dùng đổi xong, để ProtectedRoute
    // thôi chặn mà không phải gọi lại /auth/me.
    passwordChanged: (state) => {
      if (state.user) state.user.mustChangePassword = false;
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

export const { loginSuccess, setUser, passwordChanged, logout } = AuthSlice.actions;
export default AuthSlice.reducer;
