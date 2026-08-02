import axiosClient from './axiosClient';

// CategoryResponse { id, name, parentId, status, children, createdAt, updatedAt, ... }
// CategoryRequest  { name (bắt buộc), parentId, status: ACTIVE | INACTIVE | EXPIRED }
export const categoryApi = {
  getAll: () => axiosClient.get('/categories'),
  // Dạng lồng nhau qua field `children` — dùng cho bảng cây.
  getTree: () => axiosClient.get('/categories/tree'),
  getById: (id) => axiosClient.get(`/categories/${id}`),
  create: (data) => axiosClient.post('/categories', data),
  update: (id, data) => axiosClient.put(`/categories/${id}`, data),
  remove: (id) => axiosClient.delete(`/categories/${id}`),
  activate: (id) => axiosClient.patch(`/categories/${id}/activate`),
  deactivate: (id) => axiosClient.patch(`/categories/${id}/deactivate`),
};
