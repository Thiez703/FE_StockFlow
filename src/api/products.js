import axiosClient from './axiosClient';

// ProductResponse { id, code, name, categoryId, baseUnitId, minStock, status }
// ProductRequest  { code*, name*, baseUnitId*, categoryId, minStock, status }
export const productApi = {
  getAll: () => axiosClient.get('/products'),
  getById: (id) => axiosClient.get(`/products/${id}`),
  create: (data) => axiosClient.post('/products', data),
  update: (id, data) => axiosClient.put(`/products/${id}`, data),
  remove: (id) => axiosClient.delete(`/products/${id}`),
  // Đổi riêng trạng thái. Dùng thay cho update() để khỏi phải gửi lại toàn bộ
  // body — tránh vô tình ghi đè field khác khi chỉ muốn bật/tắt.
  activate: (id) => axiosClient.patch(`/products/${id}/activate`),
  deactivate: (id) => axiosClient.patch(`/products/${id}/deactivate`),
};
