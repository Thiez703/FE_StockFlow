/**
 * Loại phiếu xuất — enum `issueType` của backend.
 * Chỉ RETAIL mới được gắn khách hàng, hai loại còn lại backend bắt buộc
 * customerId = null (gửi lên sẽ nhận 400).
 */
export const ISSUE_TYPES = {
  RETAIL: { label: 'Xuất bán', color: 'blue' },
  RETURN_SUPPLIER: { label: 'Trả NCC', color: 'gold' },
  DISPOSAL: { label: 'Xuất hủy', color: 'red' },
};

export const issueTypeLabel = (code) => ISSUE_TYPES[code]?.label ?? code ?? '—';

export const ISSUE_TYPE_OPTIONS = Object.entries(ISSUE_TYPES).map(([value, { label }]) => ({
  value,
  label,
}));

// Trạng thái phiếu xuất chỉ có hai giá trị — lưu xuống là ghi sổ luôn.
export const OUTBOUND_STATUSES = ['POSTED', 'VOIDED'];

/**
 * Lý do xuất huỷ. Backend chưa có cột riêng cho thông tin này, nên FE ghép nhãn
 * đã chọn vào `note` của phiếu (xem buildNote trong OutboundCreatePage).
 */
export const DISPOSAL_REASON_OPTIONS = [
  { value: 'Hết hạn sử dụng', label: 'Hết hạn sử dụng' },
  { value: 'Hư hỏng / vỡ', label: 'Hư hỏng / vỡ' },
  { value: 'Không đạt chất lượng', label: 'Không đạt chất lượng' },
  { value: 'Khác', label: 'Khác' },
];
