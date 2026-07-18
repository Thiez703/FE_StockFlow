/**
 * Mã chứng từ / mã lô hiển thị font mono — tạo cảm giác "hệ thống kho".
 * Ví dụ: <DocCode>PN-2026-0142</DocCode> hoặc <DocCode value="L2405-SG" muted />.
 */
export default function DocCode({ children, value, muted = false, className = '' }) {
  return (
    <span
      className={`mono text-[13px] font-medium ${muted ? 'text-ink-sub' : 'text-navy-700'} ${className}`}
    >
      {value ?? children}
    </span>
  );
}
