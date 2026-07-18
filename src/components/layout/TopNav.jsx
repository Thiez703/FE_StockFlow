import { createElement, useMemo, useState } from 'react';
import { Badge, Avatar, Dropdown } from 'antd';
import {
  BellOutlined,
  DownOutlined,
  LockOutlined,
  LogoutOutlined,
  ShopOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import Logo from '@/components/ui/Logo';
import ChangePasswordModal from '@/features/auth/components/ChangePasswordModal';
import { NAV_GROUPS, WAREHOUSES, FLAT_NAV_KEYS } from '@/constants/navigation';

const USER_MENU_ITEMS = [
  { key: 'change-pw', icon: <LockOutlined />, label: 'Đổi mật khẩu' },
  { type: 'divider' },
  { key: 'logout', icon: <LogoutOutlined />, label: 'Đăng xuất', danger: true },
];

const WAREHOUSE_MENU_ITEMS = WAREHOUSES.map((w) => ({ key: w.value, label: w.label }));

/**
 * Thanh điều hướng ngang trên cùng (thay Sidebar). Dải navy full-width:
 * [logo] · [6 nhóm menu, hover sổ mega-dropdown] · [chọn kho + chuông + avatar].
 * Nhóm đang active có gạch chân accent (royal → amber).
 */
export default function TopNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [warehouse, setWarehouse] = useState(WAREHOUSES[0].value);
  const [pwOpen, setPwOpen] = useState(false);

  // Item khớp path dài nhất -> suy ra nhóm đang active.
  const activeItemKey = useMemo(() => {
    return FLAT_NAV_KEYS.filter(
      (k) => pathname === k || pathname.startsWith(`${k}/`),
    ).sort((a, b) => b.length - a.length)[0];
  }, [pathname]);

  const warehouseLabel = WAREHOUSES.find((w) => w.value === warehouse)?.label;

  const onUserMenuClick = ({ key }) => {
    if (key === 'change-pw') setPwOpen(true);
    if (key === 'logout') navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 h-16 w-full bg-navy-900 text-white shadow-[0_2px_12px_rgba(10,30,63,0.35)]">
      <div className="mx-auto flex h-full max-w-[1440px] items-center gap-4 px-4 xl:px-6">
        <Logo variant="dark" />

        {/* Menu nhóm — hover sổ mega-dropdown */}
        <nav className="hidden h-full flex-1 items-stretch justify-center gap-0.5 lg:flex">
          {NAV_GROUPS.map((group) => {
            const isMulti = group.items.length > 1;
            const isActive = group.items.some((i) => i.key === activeItemKey);
            const cols = group.items.length > 3 ? 2 : 1;

            return (
              <div key={group.key} className="group relative flex items-stretch">
                <button
                  type="button"
                  onClick={() => navigate(group.items[0].key)}
                  className={`relative flex items-center gap-1.5 px-3 text-[14px] font-medium transition-colors xl:px-4 ${
                    isActive ? 'text-white' : 'text-[#c7d6f5] hover:text-white'
                  }`}
                >
                  {group.label}
                  {isMulti && (
                    <DownOutlined className="text-[9px] opacity-70 transition-transform group-hover:rotate-180" />
                  )}
                  {isActive && (
                    <span className="absolute inset-x-3 bottom-0 h-[3px] rounded-full bg-[linear-gradient(90deg,#3B74F5,#F59E0B)]" />
                  )}
                </button>

                {isMulti && (
                  <div className="pointer-events-none absolute left-1/2 top-full z-40 -translate-x-1/2 pt-2 opacity-0 transition-opacity duration-150 group-hover:pointer-events-auto group-hover:opacity-100">
                    <div
                      className={`grid gap-1 rounded-2xl border border-hair bg-white p-2 text-ink shadow-[0_16px_40px_rgba(10,30,63,0.18)] ${
                        cols === 2 ? 'w-[540px] grid-cols-2' : 'w-72 grid-cols-1'
                      }`}
                    >
                      {group.items.map((item) => {
                        const itemActive = item.key === activeItemKey;
                        return (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => navigate(item.key)}
                            className={`flex items-start gap-3 rounded-xl p-3 text-left transition-colors ${
                              itemActive ? 'bg-tint' : 'hover:bg-slate-50'
                            }`}
                          >
                            <span
                              className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[16px] ${
                                itemActive
                                  ? 'bg-royal text-white'
                                  : 'bg-tint text-royal'
                              }`}
                            >
                              {createElement(item.icon)}
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate text-[13.5px] font-semibold text-ink">
                                {item.label}
                              </span>
                              <span className="mt-0.5 block truncate text-xs text-ink-sub">
                                {item.desc}
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Cụm bên phải: chọn kho + chuông + avatar */}
        <div className="ml-auto flex items-center gap-1.5 sm:gap-2.5">
          <Dropdown
            menu={{
              items: WAREHOUSE_MENU_ITEMS,
              selectable: true,
              selectedKeys: [warehouse],
              onClick: ({ key }) => setWarehouse(key),
            }}
            trigger={['click']}
            placement="bottomRight"
          >
            <button
              type="button"
              className="flex h-9 items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-2.5 text-sm text-white transition-colors hover:bg-white/10"
            >
              <ShopOutlined className="text-[#8fa8d8]" />
              <span className="hidden max-w-[150px] truncate xl:inline">{warehouseLabel}</span>
              <DownOutlined className="text-[9px] text-white/60" />
            </button>
          </Dropdown>

          <Badge count={4} size="small" offset={[-2, 3]}>
            <button
              type="button"
              aria-label="Thông báo"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-white/85 transition-colors hover:bg-white/10 hover:text-white"
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
              className="flex items-center gap-2 rounded-lg px-1 py-1 transition-colors hover:bg-white/10"
            >
              <Avatar
                size={34}
                style={{ background: 'linear-gradient(135deg,#1E5AF0,#0A1E3F)' }}
              >
                TN
              </Avatar>
              <span className="hidden flex-col items-start leading-tight lg:flex">
                <span className="text-[13px] font-semibold text-white">Thiên Nguyễn</span>
                <span className="text-[11px] text-[#8fa8d8]">Quản lý kho</span>
              </span>
              <DownOutlined className="hidden text-[9px] text-white/60 lg:block" />
            </button>
          </Dropdown>
        </div>
      </div>

      <ChangePasswordModal open={pwOpen} onClose={() => setPwOpen(false)} />
    </header>
  );
}
