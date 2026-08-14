/** Luôn trả ngày hiện tại — không cache để tránh stale khi user mở app qua đêm. */
export function today() {
  return new Date();
}

// Chuẩn hoá 'yyyy-mm-dd' | Date | dayjs (DatePicker của AntD trả về dayjs) -> Date.
export function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value.toDate === 'function') return value.toDate();
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

// Định dạng 'yyyy-mm-dd' | Date | dayjs -> 'dd/mm/yyyy'.
export function formatDate(value) {
  const d = toDate(value);
  if (!d) return '—';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

/**
 * Tách ngày thành 3 mảnh cho dòng "Ngày ... tháng ... năm ..." trên mặt phiếu.
 * Chưa có ngày thì trả về dấu chấm lửng như phiếu giấy chưa điền.
 */
export function dateParts(value) {
  const d = toDate(value);
  if (!d) return { day: '.....', month: '.....', year: '.........' };
  return {
    day: String(d.getDate()).padStart(2, '0'),
    month: String(d.getMonth() + 1).padStart(2, '0'),
    year: String(d.getFullYear()),
  };
}

// LocalDateTime ISO của backend (VD '2026-08-02T14:30:05') -> 'dd/mm/yyyy HH:MM'.
export function formatDateTime(value) {
  if (!value) return '—';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${formatDate(d)} ${hh}:${mi}`;
}

// Số ngày còn lại tới `value` so với ngày hiện tại (âm nếu đã quá hạn).
export function daysUntil(value) {
  const d = value instanceof Date ? new Date(value) : new Date(value);
  d.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((d - today) / 86400000);
}
