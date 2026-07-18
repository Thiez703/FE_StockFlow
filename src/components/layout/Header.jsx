import { Layout, Input, Badge, Avatar, Dropdown, Button } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SearchOutlined,
  BellOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  DownOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import Logo from '@/components/ui/Logo';

const { Header: AntHeader } = Layout;

const userMenuItems = [
  { key: 'profile', icon: <UserOutlined />, label: 'Thông tin cá nhân' },
  { key: 'settings', icon: <SettingOutlined />, label: 'Cài đặt tài khoản' },
  { type: 'divider' },
  { key: 'logout', icon: <LogoutOutlined />, label: 'Đăng xuất', danger: true },
];

export default function Header({ collapsed, onToggle }) {
  const navigate = useNavigate();

  const onUserMenuClick = ({ key }) => {
    if (key === 'logout') navigate('/login');
    if (key === 'settings') navigate('/settings');
  };

  return (
    <AntHeader
      className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-200 bg-white px-4 sm:px-6"
      style={{ height: 64, lineHeight: 'normal' }}
    >
      {/* Trái: logo + nút thu gọn sidebar */}
      <div className="flex items-center gap-2">
        <div className="hidden md:block">
          <Logo />
        </div>
        <Button
          type="text"
          aria-label="Thu gọn menu"
          onClick={onToggle}
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          className="!text-slate-500"
        />
      </div>

      {/* Giữa: ô tìm kiếm */}
      <div className="hidden flex-1 justify-center px-4 lg:flex">
        <Input
          allowClear
          size="large"
          prefix={<SearchOutlined className="text-slate-400" />}
          placeholder="Tìm sản phẩm, phiếu nhập, nhà cung cấp..."
          className="!max-w-md !rounded-full !bg-slate-50"
          variant="filled"
        />
      </div>

      {/* Phải: hành động + tài khoản */}
      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        <Button
          type="text"
          aria-label="Tìm kiếm"
          icon={<SearchOutlined />}
          className="!text-slate-500 lg:!hidden"
        />
        <Badge count={5} size="small" offset={[-2, 4]}>
          <Button
            type="text"
            aria-label="Thông báo"
            icon={<BellOutlined style={{ fontSize: 18 }} />}
            className="!text-slate-500"
          />
        </Badge>

        <div className="mx-1 hidden h-6 w-px bg-slate-200 sm:block" />

        <Dropdown
          menu={{ items: userMenuItems, onClick: onUserMenuClick }}
          trigger={['click']}
          placement="bottomRight"
        >
          <button className="flex cursor-pointer items-center gap-2 rounded-full border-none bg-transparent p-1 pr-2 hover:bg-slate-100">
            <Avatar
              size={34}
              style={{ background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)' }}
            >
              TN
            </Avatar>
            <span className="hidden flex-col items-start leading-tight sm:flex">
              <span className="text-sm font-semibold text-slate-800">Thiên Nguyễn</span>
              <span className="text-xs text-slate-400">Quản lý kho</span>
            </span>
            <DownOutlined className="hidden text-[10px] text-slate-400 sm:block" />
          </button>
        </Dropdown>
      </div>
    </AntHeader>
  );
}
