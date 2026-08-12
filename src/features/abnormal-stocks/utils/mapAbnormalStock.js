import { reasonLabel } from '@/features/abnormal-stocks/constants/reasonTypes';

/**
 * AbnormalStockResponse của backend -> khuôn bản ghi mà lớp UI phiếu đang dùng
 * (toVoucher, VoucherItemsTable layout 'incident').
 *
 * Bảng 'incident' đọc hai cột riêng: `condition` (tình trạng) lấy từ reasonType
 * đã dịch, `reason` (diễn giải) lấy từ ghi chú của dòng.
 * Phiếu không có ghi chú cấp phiếu — mỗi dòng tự mang ghi chú riêng.
 */
export function toAbnormalRecord(res) {
  if (!res) return null;

  const details = res.details ?? [];

  return {
    id: res.id,
    code: res.code,
    date: res.createdAt,
    status: res.status,
    createdBy: res.createdBy,
    approvedBy: res.approvedBy,
    approvedAt: res.approvedAt,
    rejectReason: res.rejectReason,
    warehouse: res.warehouseCode,
    totalQty: details.reduce((sum, d) => sum + (d.quantity ?? 0), 0),
    // Các loại bất thường có mặt trên phiếu, in ở dòng "Loại bất thường".
    reasonSummary: [...new Set(details.map((d) => d.reasonType))].map(reasonLabel).join(', '),
    items: details.map((d) => ({
      productCode: d.productCode,
      productName: d.productName,
      lot: d.lotCode,
      location: d.locationCode,
      // AbnormalStockDetailResponse không trả đơn vị tính.
      unit: '',
      quantity: d.quantity,
      reasonType: d.reasonType,
      condition: reasonLabel(d.reasonType),
      reason: d.note,
    })),
  };
}
