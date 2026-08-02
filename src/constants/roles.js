/**
 * Vai trò người dùng — khớp RoleEnum của backend (ADMIN | MANAGER | ACCOUNTANT | STAFF).
 * Backend chỉ nhận/trả mã viết hoa; nhãn tiếng Việt chỉ để hiển thị.
 * Bảng phân quyền theo từng vai trò nằm ở hooks/usePermissions.js.
 */
export const ROLE_LABEL = {
  ADMIN: 'Quản trị',
  MANAGER: 'Quản lý kho',
  ACCOUNTANT: 'Kế toán',
  STAFF: 'Nhân viên',
};

export const ROLE_COLOR = {
  ADMIN: 'red',
  MANAGER: 'blue',
  ACCOUNTANT: 'green',
  STAFF: 'gold',
};

export const ROLE_OPTIONS = Object.entries(ROLE_LABEL).map(([value, label]) => ({ value, label }));
