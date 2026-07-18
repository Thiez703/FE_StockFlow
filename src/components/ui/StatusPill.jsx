import { STATUS_MAP } from '@/constants/status';

/**
 * Nhãn trạng thái dạng "pill" có chấm tròn màu, dùng thống nhất toàn hệ thống.
 * Nhận mã trạng thái (POSTED, PENDING, active...) và tự map ra nhãn tiếng Việt + màu.
 * Có thể override bằng prop `label` / `tone`.
 */
const TONE = {
  blue: 'bg-tint text-royal',
  green: 'bg-[#dcfce7] text-[#15803d]',
  amber: 'bg-[#fef3c7] text-[#b45309]',
  red: 'bg-[#fee2e2] text-[#b91c1c]',
  gray: 'bg-slate-100 text-slate-500',
};

const DOT = {
  blue: 'bg-royal',
  green: 'bg-[#16a34a]',
  amber: 'bg-amber',
  red: 'bg-[#dc2626]',
  gray: 'bg-slate-400',
};

export default function StatusPill({ status, label, tone: toneProp }) {
  const cfg = STATUS_MAP[status] ?? { label: status, tone: 'gray' };
  const tone = toneProp ?? cfg.tone;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${TONE[tone]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${DOT[tone]}`} />
      {label ?? cfg.label}
    </span>
  );
}
