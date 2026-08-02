import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { authApi } from '@/api/auth';
import { logout, setUser } from '@/store/authSlice';

/**
 * Token sống qua F5 nhưng state Redux thì không. Hook này nạp lại user bằng
 * /auth/me khi có token mà chưa có user. Trả về true trong lúc đang tải.
 */
export function useAuthBootstrap() {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const user = useSelector((state) => state.auth.user);

  const isLoadingUser = isAuthenticated && !user;

  // Chặn gọi 2 lần do StrictMode chạy effect hai lượt.
  const requestedRef = useRef(false);

  useEffect(() => {
    if (!isLoadingUser) {
      requestedRef.current = false;
      return;
    }
    if (requestedRef.current) return;
    requestedRef.current = true;

    authApi
      .getMe()
      .then((me) => dispatch(setUser(me)))
      // Token hỏng: dọn state, ProtectedRoute sẽ đá về /login.
      .catch(() => dispatch(logout()));
  }, [isLoadingUser, dispatch]);

  return isLoadingUser;
}
