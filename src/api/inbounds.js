import axiosClient from './axiosClient';

// Phiếu nhập kho. Phiếu ghi sổ ngay (status = POSTED), sai thì huỷ kèm lý do.
//
// InboundResponse { id, code, supplierId, supplierName, warehouseId,
//                   status: POSTED | VOIDED, voidReason, note, createdAt, details }
//   details: [{ id, productId, productName, lotId, lotCode, locationId, locationCode,
//               quantity, unitPrice, totalAmount }]
//   Backend KHÔNG trả người lập, mã kho, đơn vị tính.
//   Tổng tiền cấp phiếu FE tự cộng từ `totalAmount` của các dòng.
//
// InboundCreateRequest { warehouseId*, supplierId*, note (<=255),
//                        details*: [{ productId*, lotId, lotCode*, mfgDate, expDate,
//                                     locationId*, quantity*, unitPrice* }] }
//   lotId tuỳ chọn: nếu lô đã tồn tại thì gửi lotId, nếu tạo lô mới inline
//   thì gửi lotCode + mfgDate + expDate (backend tự tạo lô).
//
// InboundVoidRequest { reason* }
export const inboundApi = {
  // Hỗ trợ phân trang Page<T> và lọc theo warehouseId, supplierId, status, from, to.
  // `params` nhận { page, size, sort, warehouseId, supplierId, status, from, to }.
  getAll: (params) => axiosClient.get('/inbounds', { params }),
  getById: (id) => axiosClient.get(`/inbounds/${id}`),
  create: (data) => axiosClient.post('/inbounds', data),
  void: (id, reason) => axiosClient.patch(`/inbounds/${id}/void`, { reason }),
};
