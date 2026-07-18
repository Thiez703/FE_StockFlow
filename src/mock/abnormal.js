/**
 * Phiếu hàng bất thường: Hỏng / Vỡ / Mất / Hết hạn.
 * Trạng thái: PENDING / APPROVED / REJECTED. Mã dạng BT-2026-0xxx.
 */
export const ABNORMAL_TYPES = ['Hỏng', 'Vỡ', 'Mất', 'Hết hạn'];

export const ABNORMAL_STOCKS = [
  { id: 'AB-011', code: 'BT-2026-0011', type: 'Hết hạn', productName: 'Sting Dâu chai 330ml', lot: 'L2311-ST', unit: 'Chai', quantity: 120, reason: 'Quá hạn sử dụng 12/07', date: '2026-07-16', status: 'PENDING', createdBy: 'Thủ kho B' },
  { id: 'AB-010', code: 'BT-2026-0010', type: 'Vỡ', productName: 'Bia Tiger Nâu chai 330ml', lot: 'L2404-TG', unit: 'Chai', quantity: 18, reason: 'Rơi kệ trong lúc bốc xếp', date: '2026-07-15', status: 'APPROVED', createdBy: 'Thủ kho A' },
  { id: 'AB-009', code: 'BT-2026-0009', type: 'Hỏng', productName: 'Coca-Cola lon 330ml', lot: 'L2401-CC', unit: 'Lon', quantity: 24, reason: 'Móp lon, phồng đáy', date: '2026-07-13', status: 'APPROVED', createdBy: 'Thủ kho A' },
  { id: 'AB-008', code: 'BT-2026-0008', type: 'Mất', productName: 'Red Bull lon 250ml', lot: 'L2403-RB', unit: 'Lon', quantity: 12, reason: 'Thất thoát chưa rõ nguyên nhân', date: '2026-07-11', status: 'REJECTED', createdBy: 'Bán hàng D' },
  { id: 'AB-007', code: 'BT-2026-0007', type: 'Vỡ', productName: 'Trà Ô Long TEA+ chai 455ml', lot: 'L2401-TEA', unit: 'Chai', quantity: 9, reason: 'Vỡ do va đập khi vận chuyển', date: '2026-07-08', status: 'APPROVED', createdBy: 'Thủ kho B' },
  { id: 'AB-006', code: 'BT-2026-0006', type: 'Hết hạn', productName: '7Up lon 330ml', lot: 'L2404-7UP', unit: 'Lon', quantity: 36, reason: 'Cận hạn, không đạt tiêu chuẩn bán', date: '2026-07-06', status: 'PENDING', createdBy: 'Thủ kho A' },
];
