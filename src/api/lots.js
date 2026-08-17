import axiosClient from './axiosClient';

// LotResponse { id, productId, productName, lotCode, mfgDate, expDate, status }
// Tạo cần { productId*, lotCode*, expDate*, mfgDate } — hiện chưa dùng được vì
// backend chưa có API sản phẩm để đổ danh sách chọn.
// Sửa chỉ nhận { expDate*, mfgDate }, không đổi được mã lô và sản phẩm.
export const lotApi = {
  getAll: () => axiosClient.get('/lots'),
  getByProduct: (productId) => axiosClient.get(`/lots/product/${productId}`),
  create: (data) => axiosClient.post('/lots', data),
  update: (id, data) => axiosClient.put(`/lots/${id}`, data),
  remove: (id) => axiosClient.delete(`/lots/${id}`),
  getLatestInboundPrice: (lotId) => axiosClient.get(`/lots/${lotId}/latest-inbound-price`),
};
