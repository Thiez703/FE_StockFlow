import { Outlet, useLocation } from 'react-router-dom';
import PageHeader from '@/components/ui/PageHeader';
import { MASTER_DATA_ITEMS } from '@/features/master-data/constants/masterDataSections';

/**
 * Khung trang Dữ liệu nền: tiêu đề + nội dung mục con render qua <Outlet/>.
 *
 * Việc chọn mục do MasterDataSidebar lo (hiện ở mọi trang, dựng trong
 * MainLayout), nên trang này không tự vẽ điều hướng nữa.
 *
 * Trước đây 6 mục nằm trong <Tabs> với state cục bộ; giờ mỗi mục là một route
 * con (/master-data/products, /master-data/lots...) nên F5 giữ nguyên mục đang
 * xem và có thể gửi link thẳng tới một mục.
 */
export default function MasterDataPage() {
  const { pathname } = useLocation();

  // /master-data/<slug> -> phần tử thứ 3 sau khi tách; dùng để đổi tiêu đề, mô
  // tả và breadcrumb theo đúng mục đang xem thay vì liệt kê cả 6 mục như trước.
  const slug = pathname.split('/')[2];
  const current = MASTER_DATA_ITEMS.find((i) => i.slug === slug);

  return (
    <>
      <PageHeader
        title={current?.label || 'Dữ liệu nền'}
        subtitle={current?.desc}
        breadcrumb={[
          { title: 'Dữ liệu nền' },
          ...(current ? [{ title: current.label }] : []),
        ]}
      />

      <Outlet />
    </>
  );
}
