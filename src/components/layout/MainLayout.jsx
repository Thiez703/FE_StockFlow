import { Outlet } from 'react-router-dom';
import AppSidebar from '@/components/layout/AppSidebar';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import MobileRouteGuard from '@/components/layout/MobileRouteGuard';
import { useIsMobile } from '@/hooks/useIsMobile';
import FloatingChatWidget from '@/features/ai-copilot/components/FloatingChatWidget';

/**
 * Layout chính (đã đăng nhập):
 * - Desktop (≥768px): Sidebar trái + vùng nội dung phải.
 * - Mobile (<768px): Không sidebar, bottom navigation, padding-bottom cho nav bar.
 */
export default function MainLayout() {
  const isMobile = useIsMobile();

  return (
    <div className="flex min-h-screen bg-page items-stretch">
      {!isMobile && <AppSidebar />}
      <main
        className={`min-w-0 flex-1 px-4 py-6 xl:px-6 2xl:px-8 ${
          isMobile ? 'pb-20' : ''
        }`}
      >
        <MobileRouteGuard>
          <Outlet />
        </MobileRouteGuard>
      </main>
      {isMobile && <MobileBottomNav />}
      
      <FloatingChatWidget />
    </div>
  );
}
