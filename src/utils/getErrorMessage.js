/** Rút câu lỗi dễ đọc từ error của axios, tránh lặp chuỗi error.response?.data?.… */
export function getErrorMessage(error, fallback = 'Có lỗi xảy ra, vui lòng thử lại.') {
  const data = error?.response?.data;

  if (typeof data === 'string' && data.trim()) return data;
  if (data?.message) return data.message;
  if (data?.error) return data.error;
  if (data?.detail) return data.detail;

  // Lỗi validate theo field: { errors: [{ field, message }] }
  if (Array.isArray(data?.errors) && data.errors.length) {
    return data.errors.map((e) => e.message ?? e.defaultMessage).filter(Boolean).join(', ');
  }

  // Không có response nghĩa là request không tới được server.
  if (!error?.response) {
    return 'Không kết nối được tới máy chủ.';
  }

  return fallback;
}
