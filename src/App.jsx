import { ConfigProvider, App as AntdApp } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import antdTheme from '@/constants/antdTheme';
import { router } from '@/routes';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false, // app nội bộ, không cần tải lại mỗi lần đổi tab
      staleTime: 30_000, // trong 30s coi dữ liệu còn mới, lấy thẳng từ cache
    },
  },
});

/**
 * Gốc ứng dụng. Các màn hình đang chuyển dần từ mock sang API thật; module nào
 * đã nối API thì dùng React Query, module còn lại vẫn đọc src/mock/*.js.
 * Bọc theme (ConfigProvider), context AntD (message/modal), React Query và router.
 */
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider theme={antdTheme} locale={viVN}>
        <AntdApp>
          <RouterProvider router={router} />
        </AntdApp>
      </ConfigProvider>
    </QueryClientProvider>
  );
}
