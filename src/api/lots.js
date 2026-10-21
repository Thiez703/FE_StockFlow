import axiosClient from './axiosClient';

// LotResponse { id, productId, productName, lotCode, mfgDate, expDate, status }
// Tạo cần { productId*, lotCode*, expDate*, mfgDate }
// Sửa nhận { expDate*, mfgDate, quantity }, không đổi được mã lô và sản phẩm.
// quantity lấy từ inventory API (gộp theo lotId), không nằm trong lot response.
export const lotApi = {
  getAll: () => axiosClient.get('/lots'),
  getByProduct: (productId) => axiosClient.get(`/lots/product/${productId}`),
  create: (data) => axiosClient.post('/lots', data),
  update: (id, data) => axiosClient.put(`/lots/${id}`, data),
  remove: (id) => axiosClient.delete(`/lots/${id}`),
  getLatestInboundPrice: (lotId) => axiosClient.get(`/lots/${lotId}/latest-inbound-price`),
};
