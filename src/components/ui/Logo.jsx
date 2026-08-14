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
      <img 
        src="/StockFlowLogo.png" 
        alt="StockFlow Logo" 
        className="h-10 w-auto object-contain rounded-xl"
      />
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
