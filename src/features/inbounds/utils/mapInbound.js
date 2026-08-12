/**
 * InboundResponse của backend -> khuôn bản ghi mà lớp UI phiếu đang dùng
 * (toVoucher, VoucherItemsTable layout 'money').
 *
 * Khác biệt tên gọi: createdAt -> date, details -> items, lotCode -> lot.
 *
 * Backend KHÔNG trả createdBy (người lập), warehouse, unit (ĐVT),
 * nên cố tình để trống thay vì bịa.
 */
export function toInboundRecord(res) {
  if (!res) return null;

  const details = res.details ?? [];

  return {
    id: res.id,
    code: res.code,
    date: res.createdAt,
    status: res.status,
    supplierId: res.supplierId,
    supplierName: res.supplierName,
    voidReason: res.voidReason,
    note: res.note,
    items: details.map((d) => ({
      productName: d.productName,
      lot: d.lotCode,
      location: d.locationCode,
      unit: '',
      quantity: d.quantity,
      unitPrice: Number(d.unitPrice) || 0,
    })),
    total: details.reduce(
      (sum, d) => sum + (Number(d.totalAmount) || (d.quantity ?? 0) * (Number(d.unitPrice) || 0)),
      0,
    ),
  };
}
