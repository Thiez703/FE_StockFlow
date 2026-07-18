import { createBrowserRouter, Navigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import AuthLayout from '@/components/layout/AuthLayout';
import ComingSoon from '@/components/feedback/ComingSoon';
import { authRoutes } from '@/features/auth/routes';
import { dashboardRoutes } from '@/features/dashboard/routes';
import { inboundRoutes } from '@/features/inbounds/routes';
import { outboundRoutes } from '@/features/outbounds/routes';
import { retailRoutes } from '@/features/retail/routes';
import { categoryRoutes } from '@/features/categories/routes';
import { productRoutes } from '@/features/products/routes';
import { unitRoutes } from '@/features/units/routes';
import { lotRoutes } from '@/features/lots/routes';
import { partnerRoutes } from '@/features/partners/routes';
import { locationRoutes } from '@/features/locations/routes';

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
      ...categoryRoutes,
      ...productRoutes,
      ...unitRoutes,
      ...lotRoutes,
      ...partnerRoutes,
      ...locationRoutes,
      // Nghiệp vụ kho
      ...inboundRoutes,
      ...outboundRoutes,
      ...retailRoutes,
      // Các mục menu chưa xây dựng -> màn hình "đang phát triển".
      { path: '*', element: <ComingSoon /> },
    ],
  },
]);
