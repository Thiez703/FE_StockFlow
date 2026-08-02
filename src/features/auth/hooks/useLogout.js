import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/api/auth';
import { REFRESH_TOKEN_KEY } from '@/api/axiosClient';
import { logout } from '@/store/authSlice';

/** Gọi /auth/logout để server thu hồi token, rồi dọn state và về trang login. */
export function useLogout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  return async function handleLogout() {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

    try {
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } catch {
      // API lỗi cũng kệ, phía client vẫn phải đăng xuất được.
    } finally {
      dispatch(logout());
      navigate('/login', { replace: true });
    }
  };
}
