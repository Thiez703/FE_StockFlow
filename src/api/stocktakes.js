import axiosClient from './axiosClient';

// StocktakeResponse { id, code, warehouseId, warehouseCode, createdBy, approvedBy,
//                     status: PENDING | APPROVED | REJECTED, rejectReason, note,
//                     createdAt, approvedAt, details }
//   details: [{ id, productId, productCode, productName, lotId, lotCode,
//               locationId, locationCode, systemQty, actualQty, diffQty }]
//   diffQty do backend tính = actualQty - systemQty.
//   Dòng chi tiết KHÔNG có đơn vị tính, nên biên bản in để trống cột ĐVT.
//
// StocktakeCreateRequest { warehouseId*, note, details: [{ lotId*, locationId*, actualQty* }] }
//   Mã biên bản do backend sinh, FE không gửi lên.
export const stocktakeApi = {
  // warehouseId là tham số BẮT BUỘC, không có biến thể lấy tất cả kho.
  getAll: (warehouseId, params) => axiosClient.get('/stocktakes', { params: { warehouseId, ...params } }),
  getById: (id) => axiosClient.get(`/stocktakes/${id}`),
  create: (data) => axiosClient.post('/stocktakes', data),
  approve: (id) => axiosClient.patch(`/stocktakes/${id}/approve`),
  // Từ chối bắt buộc kèm lý do, backend trả 400 nếu để trống.
  reject: (id, rejectReason) => axiosClient.patch(`/stocktakes/${id}/reject`, { rejectReason }),

  // Ảnh chụp tồn theo từng ô vị trí tại thời điểm gọi — dùng làm bảng đếm gốc
  // khi lập biên bản. Trả về mảng StorageMapCellResponse (cùng kiểu ô của
  // /dashboard/storage-map), gồm cả ô EMPTY nên FE phải tự lọc bỏ.
  getInventorySnapshot: (warehouseId) =>
    axiosClient.get('/stocktakes/inventory-snapshot', { params: { warehouseId } }),
};
