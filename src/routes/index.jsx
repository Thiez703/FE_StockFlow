import { createBrowserRouter, Navigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import AuthLayout from '@/components/layout/AuthLayout';
import ComingSoon from '@/components/feedback/ComingSoon';
import { authRoutes } from '@/features/auth/routes';
import { dashboardRoutes } from '@/features/dashboard/routes';
import { inboundRoutes } from '@/features/inbounds/routes';
import { outboundRoutes } from '@/features/outbounds/routes';
import { retailRoutes } from '@/features/retail/routes';
import { stocktakeRoutes } from '@/features/stocktakes/routes';
import { abnormalRoutes } from '@/features/abnormal-stocks/routes';
import { inventoryRoutes } from '@/features/inventory/routes';
import { stockCardRoutes } from '@/features/stock-card/routes';
import { alertRoutes } from '@/features/alerts/routes';
import { reportRoutes } from '@/features/reports/routes';
import { userRoutes } from '@/features/users/routes';
import { logRoutes } from '@/features/logs/routes';
import { masterDataRoutes } from '@/features/master-data/routes';

/**
 * Router trung tâm. Quy tắc: chỉ import và spread `routes.jsx` của từng feature,
 * không khai báo trực tiếp trang ở đây. Thêm màn hình mới => sửa trong feature.
 */
export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [...authRoutes],
  },
  {
    element: <MainLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      ...dashboardRoutes,
      // Dữ liệu nền
      ...masterDataRoutes,
      // Nghiệp vụ kho
      ...inboundRoutes,
      ...outboundRoutes,
      ...retailRoutes,
      // Kiểm soát
      ...stocktakeRoutes,
      ...abnormalRoutes,
      // Tồn kho & Báo cáo
      ...inventoryRoutes,
      ...stockCardRoutes,
      ...alertRoutes,
      ...reportRoutes,
      // Hệ thống
      ...userRoutes,
      ...logRoutes,
      // Đường dẫn không khớp -> trang 404 tối giản.
      { path: '*', element: <ComingSoon /> },
    ],
  },
]);
