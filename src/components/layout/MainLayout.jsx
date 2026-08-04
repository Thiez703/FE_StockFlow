import { Outlet } from 'react-router-dom';
import AppSidebar from '@/components/layout/AppSidebar';

/**
 * Layout chính (đã đăng nhập): 
 * Sidebar điều hướng toàn màn hình bên trái chứa Logo, Nav, Notifications và User Profile.
 * Vùng nội dung bên phải.
 */
export default function MainLayout() {
  return (
    <div className="flex min-h-screen bg-page items-stretch">
      <AppSidebar />
      <main className="min-w-0 flex-1 px-4 py-6 xl:px-6 2xl:px-8">
        <Outlet />
      </main>
    </div>
  );
}
