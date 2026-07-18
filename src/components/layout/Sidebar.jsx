import { createElement, useMemo } from 'react';
import { Layout, Menu, Button } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { NAV_GROUPS } from '@/constants/navigation';

const { Sider } = Layout;

// Chuyển NAV_GROUPS -> cấu trúc items của AntD Menu (icon là component => render JSX ở đây).
function buildMenuItems(groups) {
  return groups.map((group) => ({
    key: group.key,
    type: 'group',
    label: group.label,
    children: group.items.map((item) => ({
      key: item.key,
      icon: item.icon ? createElement(item.icon) : null,
      label: item.label,
    })),
  }));
}

// Danh sách các key (đường dẫn) phẳng để dò key đang active.
const FLAT_KEYS = NAV_GROUPS.flatMap((g) => g.items.map((i) => i.key));

export default function Sidebar({ collapsed }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const items = useMemo(() => buildMenuItems(NAV_GROUPS), []);

  // Chọn key khớp dài nhất với path hiện tại (vd: /goods-receipt/create).
  const selectedKey = useMemo(() => {
    const matches = FLAT_KEYS.filter(
      (key) => pathname === key || pathname.startsWith(`${key}/`),
    );
    return matches.sort((a, b) => b.length - a.length)[0] ?? '/dashboard';
  }, [pathname]);

  return (
    <Sider
      theme="light"
      width={248}
      collapsedWidth={80}
      collapsed={collapsed}
      breakpoint="lg"
      className="border-r border-slate-200"
      style={{
        position: 'sticky',
        top: 64,
        height: 'calc(100vh - 64px)',
      }}
    >
      <div className="app-scroll flex h-full flex-col overflow-y-auto py-3">
        <Menu
          mode="inline"
          items={items}
          selectedKeys={[selectedKey]}
          onClick={({ key }) => navigate(key)}
          style={{ borderInlineEnd: 'none', flex: 1 }}
        />

        {!collapsed && (
          <div className="mx-3 mt-2 rounded-2xl bg-[linear-gradient(135deg,#1d4ed8,#3b82f6)] p-4 text-white">
            <p className="m-0 text-sm font-semibold">Cần hỗ trợ?</p>
            <p className="mt-1 mb-3 text-xs text-blue-100">
              Xem tài liệu hướng dẫn sử dụng hệ thống.
            </p>
            <Button
              size="small"
              icon={<QuestionCircleOutlined />}
              className="!border-none !bg-white/95 !text-blue-700"
              block
            >
              Trung tâm trợ giúp
            </Button>
          </div>
        )}
      </div>
    </Sider>
  );
}
