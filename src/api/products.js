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

// Đơn vị quy đổi riêng của từng sản phẩm, VD 1 Thùng = 24 Lon (Lon là đơn vị cơ sở).
//
// ProductUnitResponse { id, unitId, unitCode, unitName, conversionRate }
// ProductUnitRequest  { unitId*, conversionRate* }
// Backend từ chối 4 trường hợp: tỷ lệ < 1, đơn vị chưa ACTIVE, đơn vị trùng đơn
// vị cơ sở của sản phẩm, và đơn vị đã được khai báo cho sản phẩm đó.
export const productUnitApi = {
  getByProduct: (productId) => axiosClient.get(`/products/${productId}/units`),
  create: (productId, data) => axiosClient.post(`/products/${productId}/units`, data),
  update: (productId, id, data) => axiosClient.put(`/products/${productId}/units/${id}`, data),
  remove: (productId, id) => axiosClient.delete(`/products/${productId}/units/${id}`),
};
