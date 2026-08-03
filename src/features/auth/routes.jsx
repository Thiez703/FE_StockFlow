import LoginPage from '@/features/auth/pages/LoginPage';
import ForgotPasswordPage from '@/features/auth/pages/ForgotPasswordPage';
import ChangePasswordPage from '@/features/auth/pages/ChangePasswordPage';

// Route riêng của feature auth. Được routes/index.jsx spread vào AuthLayout.
export const authRoutes = [
  { path: 'login', element: <LoginPage /> },
  { path: 'forgot-password', element: <ForgotPasswordPage /> },
];

// Đường dẫn đổi mật khẩu — ProtectedRoute và LoginForm cùng dùng hằng này.
export const CHANGE_PASSWORD_PATH = '/change-password';

/**
 * Đổi mật khẩu nằm sau ProtectedRoute (phải đăng nhập rồi) nhưng vẫn dùng
 * AuthLayout: tài khoản còn cờ mustChangePassword chưa được vào khu làm việc
 * nên chưa hiện TopNav.
 */
export const changePasswordRoutes = [
  { path: CHANGE_PASSWORD_PATH.slice(1), element: <ChangePasswordPage /> },
];
