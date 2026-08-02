import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Spin } from 'antd';
import { useAuthBootstrap } from '@/features/auth/hooks/useAuthBootstrap';

/** Chặn route khi chưa đăng nhập, ghi lại vị trí để login xong quay lại. */
export default function ProtectedRoute() {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
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

  return <Outlet />;
}
