import axiosClient from './axiosClient';

// baseURL đã có "/api" nên không lặp lại ở đây.
// /auth/refresh không khai báo ở đây: nó được gọi trong axiosClient.js bằng một
// instance riêng không có interceptor, nếu gọi qua axiosClient sẽ lặp vô hạn.
export const authApi = {
  // Trả { accesstoken, refreshtoken } — chữ thường, không kèm user.
  login: (data) => axiosClient.post('/auth/login', data),

  logout: (refreshToken) => axiosClient.post('/auth/logout', { refreshToken }),

  // Trả { id, fullName, email, role, phone }
  getMe: () => axiosClient.get('/auth/me'),

  // Đổi mật khẩu cho chính mình. Body: { oldPassword*, newPassword* (>=8 ký tự) }.
  // Backend trả 200 với message string khi thành công, hoặc 400/401 khi sai.
  changePassword: (data) => axiosClient.post('/auth/change-password', data),
};
