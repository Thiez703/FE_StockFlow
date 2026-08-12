import { issueTypeLabel } from '@/features/outbounds/constants/issueTypes';

/**
 * OutboundResponse của backend -> khuôn bản ghi mà lớp UI phiếu đang dùng
 * (toVoucher, VoucherItemsTable layout 'money').
 *
 * Đây là chỗ duy nhất phải sửa nếu backend đổi tên field.
 * Khác biệt tên gọi đáng chú ý:
 *   createdAt -> date, details -> items, lotCode -> lot, issueType -> type.
 *
 * Ba field mặt phiếu backend KHÔNG trả nên cố tình để trống thay vì bịa:
 *   createdBy (người lập), warehouse (toVoucher tự điền kho mặc định),
 *   unit (đơn vị tính của từng dòng).
 */
export function toOutboundRecord(res) {
  if (!res) return null;

  const details = res.details ?? [];

  return {
    id: res.id,
    code: res.code,
    // Backend chỉ có thời điểm tạo, không có "ngày xuất" riêng.
    date: res.createdAt,
    status: res.status,
    issueType: res.issueType,
    // toVoucher đọc `type` để in ở dòng "Loại xuất".
    type: issueTypeLabel(res.issueType),
    // Chỉ phiếu xuất bán mới có đối tác. Phiếu trả NCC / xuất huỷ không lưu tên
    // nào ở backend nên hiện nhãn loại phiếu cho khỏi trống.
    partnerName: res.customerName ?? issueTypeLabel(res.issueType),
    customerId: res.customerId,
    voidReason: res.voidReason,
    note: res.note,
    items: details.map((d) => ({
      productName: d.productName,
      lot: d.lotCode,
      location: d.locationCode,
      // OutboundDetailResponse không trả đơn vị tính; cột ĐVT của phiếu in để
      // trống thay vì bịa dữ liệu.
      unit: '',
      quantity: d.quantity,
      unitPrice: Number(d.unitPrice) || 0,
      overrideReason: d.overrideReason,
    })),
    // Ưu tiên totalAmount do backend tính cho từng dòng.
    total: details.reduce(
      (sum, d) => sum + (Number(d.totalAmount) || (d.quantity ?? 0) * (Number(d.unitPrice) || 0)),
      0,
    ),
  };
}
