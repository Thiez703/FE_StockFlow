import { createElement, useState, useMemo } from 'react';
import { Badge, Avatar, Dropdown, Drawer } from 'antd';
import {
  BellOutlined,
  DownOutlined,
  LockOutlined,
  LogoutOutlined,
  MenuOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Logo from '@/components/ui/Logo';
import ChangePasswordModal from '@/features/auth/components/ChangePasswordModal';
import { getVisibleSidebarGroups } from '@/constants/navigation';
import { useLogout } from '@/features/auth/hooks/useLogout';

const USER_MENU_ITEMS = [
  { key: 'change-pw', icon: <LockOutlined />, label: 'Đổi mật khẩu' },
  { type: 'divider' },
  { key: 'logout', icon: <LogoutOutlined />, label: 'Đăng xuất', danger: true },
];

export default function TopNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [pwOpen, setPwOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const handleLogout = useLogout();
  const user = useSelector((state) => state.auth.user);
  const visibleGroups = useMemo(() => getVisibleSidebarGroups(user?.role), [user?.role]);

  const onUserMenuClick = ({ key }) => {
    if (key === 'change-pw') setPwOpen(true);
    if (key === 'logout') {
      handleLogout();
    }
  };

  const pageTitle = useMemo(() => {
    for (const group of visibleGroups) {
      const found = group.items.find(
        (i) => pathname === i.path || pathname.startsWith(`${i.path}/`)
      );
      if (found) return found.label;
    }
    return '';
  }, [pathname, visibleGroups]);

  return (
    <header className="sticky top-0 z-30 h-16 w-full bg-navy-900 text-white shadow-[0_2px_12px_rgba(10,30,63,0.35)]">
      <div className="flex h-full w-full items-center gap-2 px-3 sm:gap-4 sm:px-4 xl:px-6 2xl:px-8">
        <button
          type="button"
          aria-label="Mở menu điều hướng"
          onClick={() => setMenuOpen(true)}
          className="-ml-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-0 bg-transparent text-white/90 transition-colors hover:bg-white/10 lg:hidden"
        >
          <MenuOutlined className="text-[18px]" />
        </button>

        <Logo variant="dark" />

        <div className="ml-6 hidden h-6 w-px bg-white/15 lg:block" />
        
        {pageTitle && (
          <div className="ml-4 hidden lg:block">
            <h1 className="text-lg font-bold text-white m-0 leading-none">
              {pageTitle}
            </h1>
          </div>
        )}

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2.5">
          <Badge count={4} size="small" offset={[-2, 3]}>
            <button
              type="button"
              aria-label="Thông báo"
              className="flex h-9 w-9 items-center justify-center rounded-lg border-0 bg-transparent text-white/85 transition-colors hover:bg-white/10 hover:text-white"
            >
              <BellOutlined className="text-[18px]" />
            </button>
          </Badge>

          <div className="mx-0.5 hidden h-6 w-px bg-white/15 sm:block" />

          <Dropdown
            menu={{ items: USER_MENU_ITEMS, onClick: onUserMenuClick }}
            trigger={['click']}
            placement="bottomRight"
          >
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg border-0 bg-transparent px-1 py-1 transition-colors hover:bg-white/10"
            >
              <Avatar
                size={34}
                style={{ background: 'linear-gradient(135deg,#1E5AF0,#0A1E3F)' }}
              >
                {user?.fullName?.charAt(0) || '?'}
              </Avatar>
              <span className="hidden flex-col items-start leading-tight lg:flex">
                <span className="text-[13px] font-semibold text-white">{user?.fullName || 'Chưa đăng nhập'}</span>
                <span className="text-[11px] text-[#8fa8d8]">{user?.role || ''}</span>
              </span>
              <DownOutlined className="hidden text-[9px] text-white/60 lg:block" />
            </button>
          </Dropdown>
        </div>
      </div>

      <Drawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        placement="left"
        width={300}
        title={<span className="text-[15px] font-bold text-ink">Điều hướng</span>}
        styles={{ body: { padding: 12 } }}
      >
        <nav className="flex flex-col gap-4">
          {visibleGroups.map((group) => (
            <div key={group.key}>
              <div className="px-2 pb-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                {group.label}
              </div>
              <div className="flex flex-col gap-1">
                {group.items.map((item) => {
                  const itemActive =
                    pathname === item.path || pathname.startsWith(`${item.path}/`);
                  return (
                    <button
                      key={item.path}
                      type="button"
                      onClick={() => {
                        navigate(item.path);
                        setMenuOpen(false);
                      }}
                      className={`flex w-full items-start gap-3 rounded-xl border-0 p-2.5 text-left transition-colors ${
                        itemActive ? 'bg-blue-50' : 'bg-transparent hover:bg-slate-50'
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[15px] ${
                          itemActive ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {createElement(item.icon)}
                      </span>
                      <span className="min-w-0">
                        <span className={`block truncate text-[13.5px] font-semibold ${itemActive ? 'text-blue-700' : 'text-slate-700'}`}>
                          {item.label}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-slate-500">{item.desc}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </Drawer>

      <ChangePasswordModal open={pwOpen} onClose={() => setPwOpen(false)} />
    </header>
  );
}

