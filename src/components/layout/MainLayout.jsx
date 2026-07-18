import { Outlet } from 'react-router-dom';
import TopNav from '@/components/layout/TopNav';

/**
 * Layout chính (đã đăng nhập): TopNav ngang trên cùng, phần dưới là vùng nội dung
 * nền xám rất nhạt, khung căn giữa max-width. Dùng cho toàn bộ trang nội bộ.
 */
export default function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-page">
      <TopNav />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-[1440px] px-4 py-6 xl:px-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
