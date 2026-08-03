import { Link } from 'react-router-dom';

/**
 * Logo thương hiệu StockFlow. Dùng ở TopNav (nền navy) và trang đăng nhập.
 * Biểu tượng: khối hàng xếp chồng (gợi kho) trên nền royal blue.
 *
 * @param {('light'|'dark')} [variant]  'dark' cho nền tối (TopNav), 'light' cho nền sáng.
 * @param {boolean} [showText]          Ẩn/hiện chữ.
 * @param {string}  [to]                Đường dẫn khi bấm; null => không phải link.
 */
export default function Logo({ variant = 'light', showText = true, to = '/dashboard' }) {
  const onDark = variant === 'dark';
  const titleColor = onDark ? 'text-white' : 'text-ink';
  const subColor = onDark ? 'text-[#8fa8d8]' : 'text-ink-sub';

  const content = (
    <span className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#1E5AF0,#0A1E3F)] shadow-md shadow-royal/30">
        <svg viewBox="0 0 48 48" className="h-5 w-5" fill="none" aria-hidden="true">
          {/* Khối hàng trên (nắp thùng) */}
          <path d="M14 17l10-5 10 5-10 5-10-5z" fill="#fff" />
          {/* Thân khối trái/phải tạo cảm giác 3D */}
          <path d="M14 17v13l10 5V22L14 17z" fill="#fff" opacity="0.6" />
          <path d="M34 17v13l-10 5V22l10-5z" fill="#fff" opacity="0.85" />
          {/* Vạch kệ kho */}
          <rect x="9" y="37" width="30" height="2.4" rx="1.2" fill="#F59E0B" />
        </svg>
      </span>
      {showText && (
        <span className="flex flex-col leading-none">
          <span className={`text-[17px] font-bold tracking-tight ${titleColor}`}>
            Stock<span className="text-royal-500">Flow</span>
          </span>
          {/* Máy rất hẹp (≤360px) thì bỏ dòng mô tả, tránh xuống 3 dòng làm
              tràn chiều cao cố định của thanh điều hướng. */}
          <span
            className={`mt-0.5 hidden whitespace-nowrap text-[11px] font-medium min-[360px]:block ${subColor}`}
          >
            Quản lý kho phân phối
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
