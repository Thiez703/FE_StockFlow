import DashboardPage from '@/features/dashboard/pages/DashboardPage';

// Route riêng của feature dashboard. Được routes/index.jsx spread vào MainLayout.
export const dashboardRoutes = [{ path: 'dashboard', element: <DashboardPage /> }];
