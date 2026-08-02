/**
 * Bản đồ trạng thái dùng chung: mã -> nhãn tiếng Việt + tone màu.
 * Dùng bởi <StatusPill/> và các Select lọc trạng thái ở trang danh sách.
 */
export const STATUS_MAP = {
  POSTED: { label: 'Đã ghi sổ', tone: 'blue' },
  PENDING: { label: 'Chờ duyệt', tone: 'amber' },
  APPROVED: { label: 'Đã duyệt', tone: 'green' },
  REJECTED: { label: 'Từ chối', tone: 'red' },
  VOIDED: { label: 'Đã huỷ', tone: 'gray' },
  DRAFT: { label: 'Nháp', tone: 'gray' },
  active: { label: 'Hoạt động', tone: 'green' },
  inactive: { label: 'Ngừng', tone: 'gray' },
  locked: { label: 'Đã khoá', tone: 'red' },
  expired: { label: 'Quá hạn', tone: 'red' },
  maintenance: { label: 'Bảo trì', tone: 'amber' },
  // Backend trả enum viết hoa. Giữ song song với bộ chữ thường của UI mock
  // để hai bên cùng hiển thị được trong lúc chuyển dần sang API thật.
  ACTIVE: { label: 'Hoạt động', tone: 'green' },
  INACTIVE: { label: 'Ngừng', tone: 'gray' },
  EXPIRED: { label: 'Quá hạn', tone: 'red' },
};

// Tạo nhanh options cho Select lọc trạng thái từ danh sách mã.
export const statusOptions = (codes) =>
  codes.map((code) => ({ value: code, label: STATUS_MAP[code]?.label ?? code }));

// Bộ mã hay dùng.
export const DOC_STATUSES = ['POSTED', 'PENDING', 'VOIDED'];
export const APPROVAL_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'];
