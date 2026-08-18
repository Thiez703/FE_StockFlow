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
  CHANGE_PASSWORD: 'Đổi mật khẩu',
  STOCKTAKE_APPROVE: 'Duyệt phiếu kiểm kê',
  STOCKTAKE_REJECT: 'Từ chối phiếu kiểm kê',
  ABNORMAL_STOCK_APPROVE: 'Duyệt xuất hủy/nhập bù',
  ABNORMAL_STOCK_REJECT: 'Từ chối xuất hủy/nhập bù',
  INBOUND_CREATE: 'Tạo phiếu nhập',
  INBOUND_VOID: 'Hủy phiếu nhập',
  OUTBOUND_CREATE: 'Tạo phiếu xuất',
  OUTBOUND_VOID: 'Hủy phiếu xuất',
  API_POST: 'Tạo mới',
  API_PUT: 'Cập nhật',
  API_PATCH: 'Sửa đổi',
  API_DELETE: 'Xóa'
};

export const AUDIT_ACTION_COLOR = {
  CREATE_USER: 'blue',
  UPDATE_USER: 'cyan',
  LOCK_USER: 'volcano',
  UNLOCK_USER: 'green',
  CHANGE_ROLE: 'purple',
  RESET_PASSWORD: 'gold',
  CHANGE_PASSWORD: 'gold',
  STOCKTAKE_APPROVE: 'green',
  STOCKTAKE_REJECT: 'red',
  ABNORMAL_STOCK_APPROVE: 'green',
  ABNORMAL_STOCK_REJECT: 'red',
  INBOUND_CREATE: 'blue',
  INBOUND_VOID: 'red',
  OUTBOUND_CREATE: 'blue',
  OUTBOUND_VOID: 'red',
  API_POST: 'blue',
  API_PUT: 'orange',
  API_PATCH: 'orange',
  API_DELETE: 'red'
};

export const AUDIT_ACTION_OPTIONS = Object.entries(AUDIT_ACTION_LABEL).map(([value, label]) => ({
  value,
  label,
}));

// entityType backend gửi lên là tên bảng, đổi sang nhãn đọc được.
export const ENTITY_TYPE_LABEL = {
  users: 'Người dùng',
  stocktakes: 'Phiếu kiểm kê',
  inbounds: 'Phiếu nhập',
  outbounds: 'Phiếu xuất',
  transfers: 'Phiếu chuyển',
  products: 'Sản phẩm',
  categories: 'Danh mục',
  suppliers: 'Nhà cung cấp',
  locations: 'Vị trí lưu trữ',
  roles: 'Vai trò',
  API_CALL: 'Hệ thống'
};
