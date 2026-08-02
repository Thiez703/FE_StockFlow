/**
 * Tiện ích ngày tháng cho demo. "Hôm nay" được CỐ ĐỊNH để số liệu cận hạn ổn định,
 * không đổi theo thời gian thực (bản demo tĩnh).
 */
export const TODAY = new Date('2026-07-18T00:00:00');

// Định dạng 'yyyy-mm-dd' hoặc Date -> 'dd/mm/yyyy'.
export function formatDate(value) {
  if (!value) return '—';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
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

// Số ngày còn lại tới `value` so với TODAY (âm nếu đã quá hạn).
export function daysUntil(value) {
  const d = value instanceof Date ? value : new Date(value);
  return Math.round((d - TODAY) / 86400000);
}
