import { Breadcrumb } from 'antd';
import { Link } from 'react-router-dom';

/**
 * Tiêu đề đầu trang dùng chung: breadcrumb nhỏ + tiêu đề lớn + mô tả 1 dòng, kèm
 * dải accent mảnh (gợi thanh kệ kho) dưới tiêu đề; vùng nút hành động bên phải.
 *
 * @param {string} title
 * @param {string} [subtitle]
 * @param {Array<{title: string, href?: string}>} [breadcrumb]
 * @param {React.ReactNode} [extra]   Nút/hành động hiển thị bên phải.
 */
export default function PageHeader({ title, subtitle, breadcrumb, extra }) {
  const breadcrumbItems = breadcrumb?.map((item) => ({
    title: item.href ? <Link to={item.href}>{item.title}</Link> : item.title,
  }));

  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        {breadcrumbItems?.length > 0 && (
          <Breadcrumb className="mb-2" items={breadcrumbItems} />
        )}
        <h1 className="m-0 truncate text-2xl font-bold tracking-tight text-ink">
          {title}
        </h1>
        <div className="shelf-line mt-2.5" />
        {subtitle && <p className="mt-2 mb-0 text-sm text-ink-sub">{subtitle}</p>}
      </div>
      {extra && <div className="flex shrink-0 flex-wrap items-center gap-2">{extra}</div>}
    </div>
  );
}
