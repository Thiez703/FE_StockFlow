/**
 * Hành động ghi trong nhật ký hệ thống — khớp AuditAction của backend.
 * Hiện backend mới ghi log cho module người dùng; các nghiệp vụ kho
 * (nhập/xuất/kiểm kê) chưa có API nên chưa sinh log.
 */
export const AUDIT_ACTION_LABEL = {
  CREATE_USER: 'Tạo người dùng',
  UPDATE_USER: 'Cập nhật người dùng',
  LOCK_USER: 'Khoá tài khoản',
  UNLOCK_USER: 'Mở khoá tài khoản',
  CHANGE_ROLE: 'Đổi vai trò',
  RESET_PASSWORD: 'Đặt lại mật khẩu',
};

export const AUDIT_ACTION_COLOR = {
  CREATE_USER: 'blue',
  UPDATE_USER: 'cyan',
  LOCK_USER: 'volcano',
  UNLOCK_USER: 'green',
  CHANGE_ROLE: 'purple',
  RESET_PASSWORD: 'gold',
};

export const AUDIT_ACTION_OPTIONS = Object.entries(AUDIT_ACTION_LABEL).map(([value, label]) => ({
  value,
  label,
}));

// entityType backend gửi lên là tên bảng, đổi sang nhãn đọc được.
export const ENTITY_TYPE_LABEL = {
  users: 'Người dùng',
};
