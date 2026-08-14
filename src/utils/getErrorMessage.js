/** Rút câu lỗi dễ đọc từ error của axios, tránh lặp chuỗi error.response?.data?.… */
const ERROR_MAPPING = [
  { match: /access\s*(is\s*)?denied|forbidden/i, vi: 'Bạn không có quyền thực hiện thao tác này.' },
  { match: /unauthorized|bad credentials/i, vi: 'Tài khoản hoặc mật khẩu không đúng.' },
  { match: /jwt expired/i, vi: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.' },
  { match: /already exists|duplicate/i, vi: 'Dữ liệu đã tồn tại trong hệ thống.' },
  { match: /not found/i, vi: 'Không tìm thấy dữ liệu yêu cầu.' },
  { match: /not enough stock|insufficient stock|exceeds/i, vi: 'Số lượng vượt quá tồn kho cho phép.' },
  { match: /must not be null|must not be empty|required/i, vi: 'Vui lòng nhập đầy đủ thông tin bắt buộc.' },
  { match: /validation failed/i, vi: 'Dữ liệu không hợp lệ, vui lòng kiểm tra lại.' },
  { match: /has transactions/i, vi: 'Sản phẩm đã phát sinh giao dịch, không thể sửa đổi thông tin này.' },
  { match: /network error/i, vi: 'Lỗi kết nối mạng, vui lòng kiểm tra internet.' },
  { match: /timeout/i, vi: 'Kết nối máy chủ bị quá hạn, vui lòng thử lại.' },
  { match: /invalid/i, vi: 'Dữ liệu nhập vào không hợp lệ.' },
  { match: /cannot be deleted|in use/i, vi: 'Không thể xóa do dữ liệu đang được sử dụng ở nơi khác.' },
  { match: /out of stock/i, vi: 'Sản phẩm đã hết hàng trong kho.' },
  { match: /server error/i, vi: 'Máy chủ đang gặp sự cố, vui lòng thử lại sau.' },
  { match: /failed to fetch/i, vi: 'Không thể tải dữ liệu, vui lòng kiểm tra kết nối mạng.' },
  { match: /unique constraint/i, vi: 'Dữ liệu này đã tồn tại (bị trùng lặp).' },
  { match: /foreign key constraint/i, vi: 'Dữ liệu đang được liên kết ở nơi khác, không thể thao tác.' },
  { match: /data integrity/i, vi: 'Lỗi toàn vẹn dữ liệu, thao tác bị từ chối.' },
  { match: /not allowed|method not supported/i, vi: 'Thao tác này không được hệ thống cho phép.' },
  { match: /missing/i, vi: 'Thiếu thông tin bắt buộc, vui lòng bổ sung.' },
  { match: /expired/i, vi: 'Dữ liệu hoặc phiên làm việc đã hết hạn.' },
  { match: /too large/i, vi: 'Kích thước dữ liệu quá lớn so với mức cho phép.' },
  { match: /bad request/i, vi: 'Yêu cầu gửi đi không hợp lệ.' }
];

function translateError(msg) {
  if (typeof msg !== 'string') return null;
  for (const { match, vi } of ERROR_MAPPING) {
    if (match.test(msg)) return vi;
  }
  return msg;
}

export function getErrorMessage(error, fallback = 'Đã xảy ra lỗi hệ thống, vui lòng thử lại sau.') {
  const data = error?.response?.data;
  const baseMsg = error?.message;

  if (typeof data === 'string' && data.trim()) return translateError(data);
  if (data?.message) return translateError(data.message);
  if (data?.error) return translateError(data.error);
  if (data?.detail) return translateError(data.detail);

  // Lỗi validate theo field: { errors: [{ field, message }] }
  if (Array.isArray(data?.errors) && data.errors.length) {
    return data.errors.map((e) => {
      const fieldName = e.field ? `[${e.field}] ` : '';
      const errMsg = e.message ?? e.defaultMessage;
      const transMsg = translateError(errMsg) || errMsg;
      return `${fieldName}${transMsg}`;
    }).filter(Boolean).join(', ');
  }

  if (!error?.response) {
    if (baseMsg === 'Network Error') return 'Lỗi kết nối mạng, không thể kết nối tới máy chủ.';
    if (baseMsg?.includes('timeout')) return 'Kết nối tới máy chủ bị quá hạn.';
    return `Không kết nối được tới máy chủ. ${baseMsg ? `(Chi tiết: ${baseMsg})` : ''}`;
  }

  if (error.response?.status === 403) return 'Bạn không có quyền thực hiện thao tác này.';
  if (error.response?.status === 404) return 'Không tìm thấy dữ liệu yêu cầu.';
  if (error.response?.status === 401) return 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ.';
  if (error.response?.status === 500) return 'Máy chủ đang gặp sự cố nội bộ, vui lòng thử lại sau.';

  if (baseMsg) {
    const trans = translateError(baseMsg);
    if (trans !== baseMsg) return trans;
    return `${fallback} (Chi tiết: ${baseMsg})`;
  }

  return fallback;
}
