import axiosClient from './axiosClient';

// Toàn bộ /api/users yêu cầu quyền ADMIN (@PreAuthorize ở backend).
//
// UserManagementResponse { id, fullName, email, role, phone, active, mustChangePassword, createdAt }
//   `active` là boolean, không phải chuỗi trạng thái như các module khác.
// CreateUserRequest { fullName*, email*, role*, phone } — không có mật khẩu:
//   backend tự sinh rồi gửi qua email cho người dùng.
// UpdateUserRequest { fullName*, phone } — không sửa được email; đổi vai trò
//   phải gọi assignRole().
export const userApi = {
  // Trả Page<T> của Spring: { content, totalElements, totalPages, number, size, ... }
  // params: { keyword, role, isActive, page, size, sort }
  search: (params) => axiosClient.get('/users', { params }),
  getById: (id) => axiosClient.get(`/users/${id}`),
  create: (data) => axiosClient.post('/users', data),
  update: (id, data) => axiosClient.put(`/users/${id}`, data),
  lock: (id) => axiosClient.patch(`/users/${id}/lock`),
  unlock: (id) => axiosClient.patch(`/users/${id}/unlock`),
  assignRole: (id, role) => axiosClient.patch(`/users/${id}/role`, { role }),
  // Sinh mật khẩu mới, gửi mail và bật cờ mustChangePassword của tài khoản đó.
  resetPassword: (id) => axiosClient.post(`/users/${id}/reset-password`),
};
