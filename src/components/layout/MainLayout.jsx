import { useState } from 'react';
import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';

const { Content } = Layout;

/**
 * Layout chính: Header full-width trên cùng, Sidebar bên trái phía dưới header,
 * vùng nội dung cuộn độc lập. Dùng cho toàn bộ trang nội bộ (đã đăng nhập).
 */
export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
      <Layout hasSider>
        <Sidebar collapsed={collapsed} />
        <Content className="app-scroll min-w-0 p-4 sm:p-6">
          <div className="mx-auto w-full max-w-[1440px]">
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
