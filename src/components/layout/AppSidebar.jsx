import { createElement, useCallback, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Tooltip, Badge, Dropdown, Avatar } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DownOutlined,
  RightOutlined,
  BellOutlined,
  LockOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { SIDEBAR_GROUPS, getVisibleSidebarGroups } from '@/constants/navigation';
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

  const [expandedGroups, setExpandedGroups] = useState(() =>
    SIDEBAR_GROUPS.map((g) => g.key)
  );

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

  const toggleGroup = (key) => {
    setExpandedGroups((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  return (
    <aside
      className={`hidden shrink-0 flex-col bg-slate-900 border-r border-slate-800 transition-[width] duration-200 lg:flex sticky top-0 h-screen z-20 text-white ${
        collapsed ? 'w-[72px]' : 'w-[256px]'
      }`}
    >
      {/* Header: Logo & Toggle */}
      <div className="flex h-16 shrink-0 items-center justify-between px-4 mt-2">
        {!collapsed && <div className="scale-90 origin-left"><Logo variant="dark" /></div>}
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
          className={`flex h-8 w-8 items-center justify-center rounded-md border-0 bg-transparent text-slate-400 transition-colors hover:bg-slate-800 hover:text-white ${
            collapsed ? 'mx-auto' : ''
          }`}
        >
          {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        </button>
      </div>

      {/* Nav items */}
      <div className="nav-scroll flex-1 flex flex-col gap-1 overflow-y-auto px-3 py-2">
        {visibleGroups.map((group) => {
          const isExpanded = expandedGroups.includes(group.key);
          return (
            <div key={group.key} className="flex shrink-0 flex-col gap-1 mb-2">
              {collapsed ? (
                <div className="mx-2 my-2 h-px bg-slate-800" />
              ) : (
                <button
                  type="button"
                  onClick={() => toggleGroup(group.key)}
                  className="flex items-center justify-between px-2.5 pb-1 pt-2 w-full bg-transparent border-0 text-left transition-colors cursor-pointer group-btn"
                >
                  <span className="text-[11.5px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-slate-200 transition-colors">
                    {group.label}
                  </span>
                  <span className="text-[10px] text-slate-500 group-hover:text-slate-300 transition-colors">
                    {isExpanded ? <DownOutlined /> : <RightOutlined />}
                  </span>
                </button>
              )}

              {(collapsed || isExpanded) &&
                group.items.map((item) => (
                  <Tooltip key={item.path} title={collapsed ? item.label : ''} placement="right">
                    <NavLink
                      to={item.path}
                      end={item.end}
                      className={({ isActive }) =>
                        `relative flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-[14px] font-semibold no-underline transition-all ${
                          collapsed ? 'justify-center' : ''
                        } ${
                          isActive
                            ? 'bg-blue-900/50 !text-white shadow-inner border border-blue-500/30'
                            : '!text-slate-300 hover:bg-slate-800 hover:!text-white'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-blue-500" />
                          )}
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center text-[16px] transition-colors ${
                              isActive ? '!text-white' : '!text-slate-400'
                            }`}
                          >
                            {item.icon && createElement(item.icon)}
                          </span>
                          {!collapsed && <span className="truncate">{item.label}</span>}
                        </>
                      )}
                    </NavLink>
                  </Tooltip>
                ))}
            </div>
          );
        })}
      </div>

      {/* Footer: Notifications & Avatar */}
      <div className={`flex shrink-0 border-t border-slate-800 p-3 mb-2 ${collapsed ? 'flex-col items-center gap-3' : 'items-center justify-between'}`}>
        <Dropdown
          menu={{ items: USER_MENU_ITEMS, onClick: onUserMenuClick }}
          trigger={['click']}
          placement={collapsed ? "bottomLeft" : "top"}
        >
          <button
            type="button"
            className={`flex items-center gap-2 rounded-xl border border-transparent bg-transparent p-1 transition-colors hover:bg-slate-800 cursor-pointer ${collapsed ? '' : 'w-full min-w-0 justify-start'}`}
          >
            <Avatar
              size={36}
              style={{ background: 'linear-gradient(135deg,#1E5AF0,#0A1E3F)', flexShrink: 0 }}
              className="border border-slate-700 shadow-sm"
            >
              {user?.fullName?.charAt(0) || '?'}
            </Avatar>
            {!collapsed && (
              <span className="flex flex-col items-start leading-tight min-w-0 flex-1 ml-1">
                <span className="truncate w-full text-left text-[13.5px] font-bold text-white">{user?.fullName || 'Chưa đăng nhập'}</span>
                <span className="truncate w-full text-left text-[11px] text-slate-400 mt-0.5">{user?.role || ''}</span>
              </span>
            )}
          </button>
        </Dropdown>
        
        <Badge count={4} size="small" offset={[-2, 3]}>
          <button
            type="button"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-slate-300 transition-colors hover:bg-slate-700 hover:text-white cursor-pointer"
          >
            <BellOutlined className="text-[17px]" />
          </button>
        </Badge>
      </div>

      <ChangePasswordModal open={pwOpen} onClose={() => setPwOpen(false)} />
    </aside>
  );
}
