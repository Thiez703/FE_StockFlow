import { Link } from 'react-router-dom';

/**
 * Logo thương hiệu StockFlow. Dùng ở Header, Sidebar và trang đăng nhập.
 *
 * @param {('light'|'dark')} [variant]  'light' cho nền sáng, 'dark' cho nền tối.
 * @param {boolean} [showText]          Ẩn/hiện chữ (ẩn khi sidebar thu gọn).
 * @param {string}  [to]                Đường dẫn khi bấm; null => không phải link.
 */
export default function Logo({ variant = 'light', showText = true, to = '/dashboard' }) {
  const textColor = variant === 'dark' ? 'text-white' : 'text-slate-900';

  const content = (
    <span className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#3b82f6,#1d4ed8)] shadow-md shadow-blue-500/30">
        <svg viewBox="0 0 48 48" className="h-5 w-5" fill="none" aria-hidden="true">
          <path d="M14 18l10-5 10 5-10 5-10-5z" fill="#fff" />
          <path d="M14 18v12l10 5V23L14 18z" fill="#fff" opacity="0.65" />
          <path d="M34 18v12l-10 5V23l10-5z" fill="#fff" opacity="0.85" />
        </svg>
      </span>
      {showText && (
        <span className="flex flex-col leading-none">
          <span className={`text-[17px] font-bold tracking-tight ${textColor}`}>
            Stock<span className="text-blue-600">Flow</span>
          </span>
          <span className="mt-0.5 text-[11px] font-medium text-slate-400">
            Quản lý kho
          </span>
        </span>
      )}
    </span>
  );

  if (!to) return content;

  return (
    <Link to={to} className="inline-flex select-none">
      {content}
    </Link>
  );
}
