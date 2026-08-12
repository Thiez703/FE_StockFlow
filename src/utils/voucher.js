import { DEFAULT_WAREHOUSE } from '@/constants/voucher';

/**
 * Chuẩn hoá bản ghi của mọi loại phiếu về một khuôn chung để các component
 * "giấy" (VoucherPaper, VoucherCard) chỉ phải biết một hình dạng dữ liệu.
 * Nối API thật thì đây là chỗ duy nhất phải chỉnh nếu backend đặt tên khác.
 *
 * @param {'inbound'|'outbound'|'stocktake'|'abnormal'} kind
 * @param {object} record  Bản ghi từ mock/API.
 */
export function toVoucher(kind, record) {
  if (!record) return null;

  const base = {
    kind,
    id: record.id,
    code: record.code,
    date: record.date,
    status: record.status,
    createdBy: record.createdBy,
    warehouse: record.warehouse ?? DEFAULT_WAREHOUSE,
    note: record.note,
    items: record.items ?? [],
    total: 0,
    rejectReason: record.rejectReason,
    voidReason: record.voidReason,
  };

  // Hai loại biên bản dưới đây do người trong kho lập, không có đối tác bên
  // ngoài nên "đối tác" chính là người lập.
  if (kind === 'stocktake') {
    return { ...base, partnerName: record.createdBy };
  }

  if (kind === 'abnormal') {
    // subType in ở dòng "Loại bất thường"; diễn giải của từng dòng nằm trong bảng.
    return { ...base, partnerName: record.createdBy, subType: record.reasonSummary };
  }

  const items = record.items ?? [];
  return {
    ...base,
    subType: record.type, // loại xuất: Sỉ / Trả NCC / Hủy / Nội bộ
    partnerName: kind === 'inbound' ? record.supplierName : record.partnerName,
    total:
      record.total ??
      items.reduce((sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), 0),
  };
}

// Tổng số lượng trên phiếu (dùng ở dòng "Cộng" và ở thẻ tóm tắt).
export function totalQuantity(items = []) {
  return items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);
}

/**
 * Cộng các cột của biên bản kiểm kê: theo sổ sách, thực tế đếm được, và tách
 * chênh lệch thành thừa / thiếu như hai cột riêng của mẫu 05-VT.
 */
export function stocktakeTotals(items = []) {
  return items.reduce(
    (acc, it) => {
      const system = Number(it.systemQty) || 0;
      const counted = Number(it.countedQty) || 0;
      const diff = counted - system;
      acc.system += system;
      acc.counted += counted;
      if (diff > 0) acc.surplus += diff;
      if (diff < 0) acc.shortage += -diff;
      return acc;
    },
    { system: 0, counted: 0, surplus: 0, shortage: 0 },
  );
}
