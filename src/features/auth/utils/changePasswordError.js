/**
 * Trích thông báo lỗi tiếng Việt từ response của POST /auth/change-password.
 * Backend trả message string hoặc lỗi validate theo field.
 */
export function getChangePasswordError(error) {
  const status = error?.response?.status;
  const data = error?.response?.data;
  const msg = typeof data === 'string' ? data : data?.message ?? data?.error ?? '';
  const lower = msg.toLowerCase();

  if (status === 401 || lower.includes('old password') || lower.includes('incorrect') || lower.includes('wrong')) {
    return 'Mật khẩu hiện tại không đúng.';
  }

  if (lower.includes('same') || lower.includes('must not be the same') || lower.includes('trùng')) {
    return 'Mật khẩu mới không được trùng mật khẩu cũ.';
  }

  if (lower.includes('at least') || lower.includes('minimum') || lower.includes('too short') || lower.includes('minlength')) {
    return 'Mật khẩu mới phải có tối thiểu 8 ký tự.';
  }

  // Lỗi validate theo field: { errors: [{ field, message }] }
  if (Array.isArray(data?.errors) && data.errors.length) {
    return data.errors.map((e) => e.message ?? e.defaultMessage).filter(Boolean).join(', ');
  }

  // Nếu không map được các lỗi cụ thể, gọi hàm getErrorMessage dùng chung
  // Cần import getErrorMessage từ utils
  if (!error?.response) {
    const baseMsg = error?.message;
    if (baseMsg === 'Network Error') return 'Lỗi kết nối mạng, không thể kết nối tới máy chủ.';
    if (baseMsg?.includes('timeout')) return 'Kết nối tới máy chủ bị quá hạn.';
    return `Không kết nối được tới máy chủ. ${baseMsg ? `(Chi tiết: ${baseMsg})` : ''}`;
  }

  if (msg) {
    // Nếu có msg, ta bọc nó lại thành tiếng Việt
    return `Đổi mật khẩu thất bại (Chi tiết: ${msg})`;
  }

  const baseErr = error?.message;
  return `Đã xảy ra lỗi hệ thống, vui lòng thử lại sau. ${baseErr ? `(Chi tiết: ${baseErr})` : ''}`;
}
