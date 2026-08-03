import { createElement, useCallback, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Tooltip } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined, DownOutlined, RightOutlined } from '@ant-design/icons';
import { SIDEBAR_GROUPS } from '@/constants/navigation';

const COLLAPSE_STORAGE_KEY = 'stockflow.sidebar.collapsed';

export default function AppSidebar() {
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(COLLAPSE_STORAGE_KEY) === '1',
  );

  const [expandedGroups, setExpandedGroups] = useState(() =>
    SIDEBAR_GROUPS.map((g) => g.key)
  );

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
      className={`hidden shrink-0 bg-white border-r border-slate-200 transition-[width] duration-200 lg:block sticky top-16 h-[calc(100vh-4rem)] z-20 ${
        collapsed ? 'w-[72px]' : 'w-[240px]'
      }`}
    >
      <div className="nav-scroll flex h-full flex-col gap-1 overflow-y-auto p-3">
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
          className={`mb-2 flex h-9 shrink-0 items-center gap-2 rounded-lg border-0 bg-transparent px-2.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          {!collapsed && (
            <span className="truncate text-[12px] font-bold uppercase tracking-wide">
              Điều hướng
            </span>
          )}
        </button>

        {SIDEBAR_GROUPS.map((group) => {
          const isExpanded = expandedGroups.includes(group.key);
          return (
            <div key={group.key} className="flex shrink-0 flex-col gap-1 mb-2">
              {collapsed ? (
                <div className="mx-2 my-2 h-px bg-slate-200" />
              ) : (
                <button
                  type="button"
                  onClick={() => toggleGroup(group.key)}
                  className="flex items-center justify-between px-2.5 pb-1 pt-2 w-full bg-transparent border-0 text-left transition-colors cursor-pointer group-btn"
                >
                  <span className="text-[11.5px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-slate-800 transition-colors">
                    {group.label}
                  </span>
                  <span className="text-[10px] text-slate-400 group-hover:text-slate-600 transition-colors">
                    {isExpanded ? <DownOutlined /> : <RightOutlined />}
                  </span>
                </button>
              )}

              {(collapsed || isExpanded) &&
                group.items.map((item) => (
                  <Tooltip key={item.path} title={collapsed ? item.label : ''} placement="right">
                    <NavLink
                      to={item.path}
                      className={({ isActive }) =>
                        `relative flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-[14px] font-semibold no-underline transition-all ${
                          collapsed ? 'justify-center' : ''
                        } ${
                          isActive
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-blue-600" />
                          )}
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center text-[16px] transition-colors ${
                              isActive ? 'text-blue-600' : 'text-slate-500'
                            }`}
                          >
                            {createElement(item.icon)}
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
    </aside>
  );
}

