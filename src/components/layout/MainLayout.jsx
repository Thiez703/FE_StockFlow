import { Outlet } from 'react-router-dom';
import TopNav from '@/components/layout/TopNav';
import AppSidebar from '@/components/layout/AppSidebar';

/**
 * Layout chính (đã đăng nhập): TopNav mảnh trên cùng (logo + chuông + tài
 * khoản), dưới là sidebar điều hướng cố định bên trái + vùng nội dung nền xám
 * rất nhạt.
 *
 * Nội dung trải hết bề ngang còn lại (không chặn max-width) để khi zoom out /
 * màn siêu rộng không thừa khoảng trắng hai bên — chỉ chừa padding mép, nới dần
 * theo breakpoint. Dùng cho toàn bộ trang nội bộ.
 */
export default function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-page">
      <TopNav />
      <div className="flex flex-1 items-start">
        <AppSidebar />
        {/* min-w-0: không có nó thì bảng rộng bên trong sẽ đẩy phồng cột flex
            này thay vì tự cuộn ngang, làm cả trang trượt ngang theo. */}
        <main className="min-w-0 flex-1 px-4 py-6 xl:px-6 2xl:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
