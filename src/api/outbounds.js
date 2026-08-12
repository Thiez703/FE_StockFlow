import axiosClient from './axiosClient';

// Phiếu xuất kho. Khác biên bản kiểm kê / hàng bất thường: lưu là ghi sổ ngay
// (status = POSTED), KHÔNG có bước duyệt. Sai thì huỷ phiếu kèm lý do — backend
// không có endpoint sửa hay xoá phiếu.
//
// OutboundResponse { id, code, issueType: RETAIL | RETURN_SUPPLIER | DISPOSAL,
//                    customerId, customerName, warehouseId,
//                    status: POSTED | VOIDED, voidReason, note, createdAt, details }
//   details: [{ id, productId, productName, lotId, lotCode, locationId, locationCode,
//               quantity, overrideReason, unitPrice, totalAmount }]
//   Backend KHÔNG trả người lập, mã kho, mã sản phẩm, đơn vị tính hay tổng tiền
//   cấp phiếu — FE tự cộng từ `totalAmount` của các dòng.
//
// OutboundCreateRequest { warehouseId*, issueType*, customerId, note (<=255),
//                         details*: [{ lotId*, locationId*, quantity*,
//                                      overrideReason, unitPrice }] }
//   `customerId` chỉ được gửi khi issueType = RETAIL; hai loại còn lại gửi lên
//   là backend trả 400. Không có chỗ lưu nhà cung cấp (phiếu trả NCC) hay lý do
//   huỷ (phiếu xuất huỷ), nên FE ghép hai thông tin đó vào `note`.
//   Dòng chi tiết nhận cặp (lotId, locationId) chứ không nhận productId.
export const outboundApi = {
  // warehouseId là tham số BẮT BUỘC, không có biến thể lấy tất cả kho.
  // Backend bắt buộc lọc theo kho và chưa hỗ trợ tìm kiếm / phân trang, trả thẳng mảng.
  getAll: (warehouseId, params) => axiosClient.get('/outbounds', { params: { warehouseId, ...params } }),
  getById: (id) => axiosClient.get(`/outbounds/${id}`),
  create: (data) => axiosClient.post('/outbounds', data),
  // Huỷ bắt buộc kèm lý do, backend trả 400 nếu để trống, và không trả lại phiếu
  // nên phải tải lại danh sách sau khi gọi.
  void: (id, reason) => axiosClient.patch(`/outbounds/${id}/void`, { reason }),
};
