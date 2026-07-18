import { createBrowserRouter, Navigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import AuthLayout from '@/components/layout/AuthLayout';
import ComingSoon from '@/components/feedback/ComingSoon';
import { authRoutes } from '@/features/auth/routes';
import { dashboardRoutes } from '@/features/dashboard/routes';
import { goodsReceiptRoutes } from '@/features/goods-receipt/routes';

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
      ...goodsReceiptRoutes,
      // Các mục menu chưa xây dựng -> màn hình "đang phát triển".
      { path: '*', element: <ComingSoon /> },
    ],
  },
]);
