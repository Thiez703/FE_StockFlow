import { ConfigProvider, App as AntdApp } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { RouterProvider } from 'react-router-dom';
import antdTheme from '@/constants/antdTheme';
import { router } from '@/routes';

/**
 * Gốc ứng dụng. Bản demo là UI TĨNH: không server state, không React Query —
 * mọi dữ liệu lấy từ src/mock/*.js. Chỉ bọc theme (ConfigProvider), context của
 * AntD (message/modal) và router.
 */
export default function App() {
  return (
    <ConfigProvider theme={antdTheme} locale={viVN}>
      <AntdApp>
        <RouterProvider router={router} />
      </AntdApp>
    </ConfigProvider>
  );
}
