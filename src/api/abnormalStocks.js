import axiosClient from './axiosClient';

// Biên bản ghi nhận hàng bất thường (hư hỏng / mất / hết hạn) tại một ô vị trí.
//
// AbnormalStockResponse { id, code, warehouseId, warehouseCode, createdBy, approvedBy,
//                         status: PENDING | APPROVED | REJECTED, rejectReason,
//                         createdAt, approvedAt, details }
//   details: [{ id, productId, productCode, productName, lotId, lotCode,
//               locationId, locationCode, quantity, reasonType, note }]
//   reasonType: DAMAGED | LOST | EXPIRED | OTHER
//   Khác biên bản kiểm kê: KHÔNG có field `note` ở cấp phiếu, ghi chú nằm ở
//   từng dòng chi tiết.
//
// AbnormalStockCreateRequest { warehouseId*, details: [{ lotId*, locationId*,
//                              quantity*, reasonType*, note }] }
export const abnormalStockApi = {
  // warehouseId là tham số BẮT BUỘC, không có biến thể lấy tất cả kho.
  getAll: (warehouseId, params) => axiosClient.get('/abnormal-stocks', { params: { warehouseId, ...params } }),
  getById: (id) => axiosClient.get(`/abnormal-stocks/${id}`),
  create: (data) => axiosClient.post('/abnormal-stocks', data),
  approve: (id) => axiosClient.patch(`/abnormal-stocks/${id}/approve`),
  // Từ chối bắt buộc kèm lý do, backend trả 400 nếu để trống.
  reject: (id, rejectReason) => axiosClient.patch(`/abnormal-stocks/${id}/reject`, { rejectReason }),
};
