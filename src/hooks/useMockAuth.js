import { useSelector } from 'react-redux';

export function useMockAuth() {
  return useSelector((state) => state.auth.user);
}
