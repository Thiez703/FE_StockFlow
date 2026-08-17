/**
 * StocktakeResponse của backend -> khuôn bản ghi mà lớp UI phiếu đang dùng
 * (toVoucher, VoucherItemsTable layout 'count', StocktakeItemsDetail).
 *
 * Đây là chỗ duy nhất phải sửa nếu backend đổi tên field.
 * Khác biệt tên gọi đáng chú ý:
 *   createdAt -> date, details -> items, lotCode -> lot, actualQty -> countedQty.
 */
export function toStocktakeRecord(res) {
  if (!res) return null;

  const details = res.details ?? [];

  return {
    id: res.id,
    code: res.code,
    // Backend chỉ có thời điểm tạo, không có "ngày kiểm kê" riêng.
    date: res.createdAt,
    status: res.status,
    createdBy: res.createdBy,
    approvedBy: res.approvedBy,
    approvedAt: res.approvedAt,
    rejectReason: res.rejectReason,
    note: res.note,
    warehouse: res.warehouseCode,
    // Tổng chênh lệch, ưu tiên diffQty do backend tính.
    diff: details.reduce((sum, d) => sum + (d.diffQty ?? d.actualQty - d.systemQty), 0),
    items: details.map((d) => ({
      productCode: d.productCode,
      productName: d.productName,
      lotId: d.lotId,
      locationId: d.locationId,
      lot: d.lotCode,
      location: d.locationCode,
      unit: '',
      systemQty: d.systemQty,
      actualQty: d.actualQty,
      countedQty: d.actualQty,
      damagedQty: d.damagedQty ?? 0,
      remainingQty: d.remainingQty ?? (d.actualQty - (d.damagedQty ?? 0)),
      note: d.note ?? '',
    })),
  };
}
