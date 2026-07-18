import LoginPage from '@/features/auth/pages/LoginPage';

// Route riêng của feature auth. Được routes/index.jsx spread vào AuthLayout.
export const authRoutes = [{ path: 'login', element: <LoginPage /> }];
