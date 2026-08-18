import { createElement, useCallback, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Tooltip, Dropdown, Avatar } from 'antd';
import { motion } from 'framer-motion';
import WarehouseScene from '@/components/illustrations/WarehouseScene';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  RightOutlined,
  CustomerServiceOutlined,
  LockOutlined,
  LogoutOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { getVisibleSidebarGroups } from '@/constants/navigation';
import Logo from '@/components/ui/Logo';
import { useLogout } from '@/features/auth/hooks/useLogout';
import ChangePasswordModal from '@/features/auth/components/ChangePasswordModal';

const COLLAPSE_STORAGE_KEY = 'stockflow.sidebar.collapsed';

const USER_MENU_ITEMS = [
  { key: 'change-pw', icon: <LockOutlined />, label: 'Đổi mật khẩu' },
  { type: 'divider' },
  { key: 'logout', icon: <LogoutOutlined />, label: 'Đăng xuất', danger: true },
];

export default function AppSidebar() {
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(COLLAPSE_STORAGE_KEY) === '1',
  );

  const location = useLocation();
  const user = useSelector((state) => state.auth.user);
  
  const handleLogout = useLogout();
  const [pwOpen, setPwOpen] = useState(false);
  
  const visibleGroups = getVisibleSidebarGroups(user?.role);

  const onUserMenuClick = ({ key }) => {
    if (key === 'change-pw') setPwOpen(true);
    if (key === 'logout') {
      handleLogout();
    }
  };

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(COLLAPSE_STORAGE_KEY, next ? '1' : '0');
      return next;
    });
  }, []);

  return (
    <aside
      className={`relative flex shrink-0 flex-col overflow-hidden bg-[linear-gradient(150deg,#0A1E3F_0%,#12356B_55%,#1E5AF0_120%)] border-r border-[#12356B] transition-[width] duration-200 sticky top-0 h-screen z-20 text-white ${
        collapsed ? 'w-[72px]' : 'w-[256px]'
      }`}
    >
      {/* Background animations */}
      <motion.div
        className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-white/10 z-0"
        animate={{ x: [0, 20, 0], y: [0, 15, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-white/5 z-0"
        animate={{ x: [0, -15, 0], y: [0, -10, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      <WarehouseScene
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[52%] w-full opacity-50 mask-[linear-gradient(to_bottom,transparent,black_30%)] z-0"
      />

      {/* Header: Logo & Toggle */}
      <div className="relative z-10 flex h-16 shrink-0 items-center justify-between px-4 mt-2">
        {!collapsed && <div className="scale-90 origin-left"><Logo variant="dark" /></div>}
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
          className={`flex h-8 w-8 items-center justify-center rounded-md border-0 bg-transparent text-[#c7d6f5] transition-colors hover:bg-white/10 hover:text-white ${
            collapsed ? 'mx-auto' : ''
          }`}
        >
          {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        </button>
      </div>

      {/* Nav items */}
      <div className="relative z-10 nav-scroll flex-1 flex flex-col gap-1 overflow-y-auto px-3 py-2">
        {visibleGroups.map((group) => {
          if (group.items.length === 1) {
            const item = group.items[0];
            return (
              <div key={group.key} className={`mb-1 shrink-0 ${group.highlight ? 'mt-auto pt-2 border-t border-slate-700/50' : ''}`}>
                <Tooltip title={collapsed ? item.label : ''} placement="right">
                  <NavLink
                    to={item.path}
                    end={item.end}
                    className={({ isActive }) =>
                      `relative flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-[14px] font-semibold no-underline transition-all ${
                        collapsed ? 'justify-center' : ''
                      } ${
                        group.highlight
                          ? isActive
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 !text-white shadow-md shadow-blue-900/50 border border-transparent'
                            : 'bg-gradient-to-r from-slate-800 to-slate-800/80 !text-blue-300 hover:from-blue-600 hover:to-indigo-600 hover:!text-white border border-blue-500/30 hover:border-transparent hover:shadow-md'
                          : isActive
                            ? 'bg-blue-900/50 !text-white shadow-inner border border-blue-500/30'
                            : '!text-slate-300 hover:bg-slate-800 hover:!text-white border border-transparent'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && !group.highlight && (
                          <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-blue-500" />
                        )}
                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center text-[16px] transition-colors ${
                            isActive || group.highlight ? '!text-white' : '!text-slate-400'
                          }`}
                        >
                          {item.icon ? createElement(item.icon) : (group.icon ? createElement(group.icon) : null)}
                        </span>
                        {!collapsed && <span className="truncate">{item.label}</span>}
                      </>
                    )}
                  </NavLink>
                </Tooltip>
              </div>
            );
          }

          const isActiveGroup = group.items.some(item => 
            item.path === '/' 
              ? location.pathname === '/' 
              : location.pathname.startsWith(item.path)
          );

          const menuProps = {
            items: group.items.map(item => ({
              key: item.path,
              label: (
                <NavLink to={item.path} end={item.end} className={({isActive}) => `flex items-center gap-3 py-1.5 px-1 !no-underline ${isActive ? '!text-blue-600 font-bold' : '!text-slate-700 hover:!text-blue-600'}`}>
                  {({isActive}) => (
                    <>
                      <span className={`text-[16px] ${isActive ? '!text-blue-600' : '!text-slate-400'}`}>{item.icon && createElement(item.icon)}</span>
                      <span>{item.label}</span>
                    </>
                  )}
                </NavLink>
              ),
            }))
          };

          return (
            <div key={group.key} className="mb-1 shrink-0">
              <Dropdown menu={menuProps} placement="rightTop" trigger={['hover']}>
                <div className={`relative flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-[14px] font-semibold transition-all cursor-pointer select-none ${
                  collapsed ? 'justify-center' : ''
                } ${
                  isActiveGroup
                    ? 'bg-blue-900/50 text-white shadow-inner border border-blue-500/30'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}>
                  {isActiveGroup && (
                    <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-blue-500" />
                  )}
                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center text-[16px] transition-colors ${
                    isActiveGroup ? 'text-white' : 'text-slate-400'
                  }`}>
                    {group.icon ? createElement(group.icon) : (group.items[0]?.icon ? createElement(group.items[0].icon) : null)}
                  </span>
                  {!collapsed && (
                    <>
                      <span className="truncate flex-1">{group.label}</span>
                      <RightOutlined className={`text-[10px] transition-colors ${isActiveGroup ? 'text-white' : 'text-slate-500'}`} />
                    </>
                  )}
                </div>
              </Dropdown>
            </div>
          );
        })}
      </div>

      {/* Footer: Notifications & Avatar */}
      <div className={`relative z-10 flex shrink-0 border-t border-white/10 p-3 mb-2 ${collapsed ? 'flex-col items-center gap-3' : 'items-center justify-between'}`}>
        <Dropdown
          menu={{ items: USER_MENU_ITEMS, onClick: onUserMenuClick }}
          trigger={['click']}
          placement={collapsed ? "bottomLeft" : "top"}
        >
          <button
            type="button"
            className={`flex items-center gap-2 rounded-xl border border-transparent bg-transparent p-1 transition-colors hover:bg-white/10 cursor-pointer ${collapsed ? '' : 'w-full min-w-0 justify-start'}`}
          >
            <Avatar
              size={36}
              style={{ backgroundColor: '#E4E6EB', color: '#B0B3B8', flexShrink: 0 }}
              className="border border-white/20 shadow-sm"
              icon={<UserOutlined />}
            />
            {!collapsed && (
              <span className="flex flex-col items-start leading-tight min-w-0 flex-1 ml-1">
                <span className="truncate w-full text-left text-[13.5px] font-bold text-white">{user?.fullName || 'Chưa đăng nhập'}</span>
                <span className="truncate w-full text-left text-[11px] text-[#c7d6f5] mt-0.5">{user?.role || ''}</span>
              </span>
            )}
          </button>
        </Dropdown>
        
        <Tooltip title="Thông tin liên hệ" placement="top">
          <NavLink
            to="/contact"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-[#c7d6f5] transition-colors hover:bg-white/20 hover:text-white cursor-pointer"
          >
            <CustomerServiceOutlined className="text-[17px]" />
          </NavLink>
        </Tooltip>
      </div>

      <ChangePasswordModal open={pwOpen} onClose={() => setPwOpen(false)} />
    </aside>
  );
}
