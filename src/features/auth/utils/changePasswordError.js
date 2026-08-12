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

  if (msg) return msg;

  if (!error?.response) return 'Không kết nối được tới máy chủ.';

  return 'Có lỗi xảy ra, vui lòng thử lại.';
}
