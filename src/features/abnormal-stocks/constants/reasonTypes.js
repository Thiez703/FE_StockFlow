/**
 * Nguyên nhân ghi nhận hàng bất thường — enum `reasonType` của backend
 * (DAMAGED | LOST | EXPIRED | OTHER).
 */
export const REASON_TYPES = {
  DAMAGED: { label: 'Hư hỏng', tone: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
  LOST: { label: 'Mất hàng', tone: 'text-rose-600', bg: 'bg-rose-50 border-rose-200' },
  EXPIRED: { label: 'Hết hạn', tone: 'text-red-700', bg: 'bg-red-50 border-red-200' },
  OTHER: { label: 'Khác', tone: 'text-slate-600', bg: 'bg-slate-50 border-slate-200' },
};

export const reasonLabel = (code) => REASON_TYPES[code]?.label ?? code ?? '—';

export const REASON_OPTIONS = Object.entries(REASON_TYPES).map(([value, { label }]) => ({
  value,
  label,
}));
