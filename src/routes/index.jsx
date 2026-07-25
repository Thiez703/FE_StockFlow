import { createBrowserRouter, Navigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import AuthLayout from '@/components/layout/AuthLayout';
import ComingSoon from '@/components/feedback/ComingSoon';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import { authRoutes } from '@/features/auth/routes';
import { dashboardRoutes } from '@/features/dashboard/routes';
import { inboundRoutes } from '@/features/inbounds/routes';
import { outboundRoutes } from '@/features/outbounds/routes';
import { stocktakeRoutes } from '@/features/stocktakes/routes';
import { abnormalRoutes } from '@/features/abnormal-stocks/routes';
import { inventoryRoutes } from '@/features/inventory/routes';
import { stockCardRoutes } from '@/features/stock-card/routes';
import { alertRoutes } from '@/features/alerts/routes';
import { reportRoutes } from '@/features/reports/routes';
import { userRoutes } from '@/features/users/routes';
import { logRoutes } from '@/features/logs/routes';
import { masterDataRoutes } from '@/features/master-data/routes';

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [...authRoutes],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <MainLayout />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          ...dashboardRoutes,
          ...masterDataRoutes,
          ...inboundRoutes,
          ...outboundRoutes,
          ...stocktakeRoutes,
          ...abnormalRoutes,
          ...inventoryRoutes,
          ...stockCardRoutes,
          ...alertRoutes,
          ...reportRoutes,
          ...userRoutes,
          ...logRoutes,
          { path: '*', element: <ComingSoon /> },
        ],
      },
    ],
  },
]);
