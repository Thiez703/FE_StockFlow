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

// Số ngày còn lại tới `value` so với TODAY (âm nếu đã quá hạn).
export function daysUntil(value) {
  const d = value instanceof Date ? value : new Date(value);
  return Math.round((d - TODAY) / 86400000);
}
