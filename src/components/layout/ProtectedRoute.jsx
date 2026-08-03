import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Spin } from 'antd';
import { useAuthBootstrap } from '@/features/auth/hooks/useAuthBootstrap';
import { CHANGE_PASSWORD_PATH } from '@/features/auth/routes';

/** Chặn route khi chưa đăng nhập, ghi lại vị trí để login xong quay lại. */
export default function ProtectedRoute() {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const user = useSelector((state) => state.auth.user);
  const location = useLocation();
  const isLoadingUser = useAuthBootstrap();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (isLoadingUser) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spin size="large" tip="Đang tải..." />
      </div>
    );
  }

  // Tài khoản mới cấp hoặc vừa được admin đặt lại mật khẩu: giữ ở trang đổi mật
  // khẩu, kể cả khi gõ thẳng URL khác hay F5. Cờ lấy từ /auth/me.
  if (user?.mustChangePassword && location.pathname !== CHANGE_PASSWORD_PATH) {
    return <Navigate to={CHANGE_PASSWORD_PATH} state={{ from: location }} replace />;
  }

  return <Outlet />;
}
