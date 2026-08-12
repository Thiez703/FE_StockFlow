/** Rút câu lỗi dễ đọc từ error của axios, tránh lặp chuỗi error.response?.data?.… */
const ERROR_MAPPING = [
  { match: /access is denied|forbidden/i, vi: 'Bạn không có quyền thực hiện thao tác này.' },
  { match: /unauthorized|bad credentials/i, vi: 'Tài khoản hoặc mật khẩu không đúng.' },
  { match: /jwt expired/i, vi: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.' },
  { match: /already exists|duplicate/i, vi: 'Dữ liệu đã tồn tại trong hệ thống.' },
  { match: /not found/i, vi: 'Không tìm thấy dữ liệu yêu cầu.' },
  { match: /not enough stock|insufficient stock|exceeds/i, vi: 'Số lượng vượt quá tồn kho cho phép.' },
  { match: /must not be null|must not be empty|required/i, vi: 'Vui lòng nhập đầy đủ thông tin bắt buộc.' },
  { match: /validation failed/i, vi: 'Dữ liệu không hợp lệ, vui lòng kiểm tra lại.' },
  { match: /has transactions/i, vi: 'Sản phẩm đã phát sinh giao dịch, không thể sửa đổi thông tin này.' },
];

function translateError(msg) {
  if (typeof msg !== 'string') return null;
  for (const { match, vi } of ERROR_MAPPING) {
    if (match.test(msg)) return vi;
  }
  return msg;
}
export function getErrorMessage(error, fallback = 'Có lỗi xảy ra, vui lòng thử lại.') {
  const data = error?.response?.data;

  if (typeof data === 'string' && data.trim()) return translateError(data);
  if (data?.message) return translateError(data.message);
  if (data?.error) return translateError(data.error);
  if (data?.detail) return translateError(data.detail);

  // Lỗi validate theo field: { errors: [{ field, message }] }
  if (Array.isArray(data?.errors) && data.errors.length) {
    return data.errors.map((e) => translateError(e.message ?? e.defaultMessage)).filter(Boolean).join(', ');
  }

  if (!error?.response) {
    return 'Không kết nối được tới máy chủ.';
  }

  if (error.response?.status === 403) return 'Bạn không có quyền thực hiện thao tác này.';
  if (error.response?.status === 404) return 'Không tìm thấy dữ liệu yêu cầu.';
  if (error.response?.status === 401) return 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ.';
  if (error.response?.status === 500) return 'Có lỗi hệ thống xảy ra, vui lòng thử lại sau.';

  return fallback;
}
