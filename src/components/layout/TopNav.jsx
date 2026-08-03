import { createElement, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
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
import { NAV_GROUPS, FLAT_NAV_KEYS } from '@/constants/navigation';
import { useLogout } from '@/features/auth/hooks/useLogout';

const USER_MENU_ITEMS = [
  { key: 'change-pw', icon: <LockOutlined />, label: 'Đổi mật khẩu' },
  { type: 'divider' },
  { key: 'logout', icon: <LogoutOutlined />, label: 'Đăng xuất', danger: true },
];

/**
 * Thanh điều hướng ngang trên cùng (thay Sidebar). Dải navy full-width:
 * [logo] · [6 nhóm menu, hover sổ mega-dropdown] · [chuông + avatar].
 * Nhóm đang active có gạch chân accent (royal → amber).
 */
export default function TopNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [pwOpen, setPwOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const handleLogout = useLogout();
  const user = useSelector((state) => state.auth.user);

  // Item khớp path dài nhất -> suy ra nhóm đang active.
  const activeItemKey = useMemo(() => {
    return FLAT_NAV_KEYS.filter(
      (k) => pathname === k || pathname.startsWith(`${k}/`),
    ).sort((a, b) => b.length - a.length)[0];
  }, [pathname]);

  // Nhóm đang chứa item active — dùng để xác định nút nào cần gạch chân.
  const activeGroupKey = useMemo(
    () => NAV_GROUPS.find((g) => g.items.some((i) => i.key === activeItemKey))?.key,
    [activeItemKey],
  );

  // Gạch chân dùng 1 phần tử duy nhất, luôn tồn tại trong DOM — chỉ đo lại vị trí/kích
  // thước của nút đang active rồi animate x/width. Tránh dùng layoutId (mount/unmount
  // qua lại giữa các nút) vì gây lỗi "bay" sai vị trí khi chuyển nhóm cách xa nhau.
  const navRef = useRef(null);
  const itemRefs = useRef({});
  const [underline, setUnderline] = useState({ left: 0, width: 0, ready: false });

  const measureUnderline = useCallback(() => {
    const navEl = navRef.current;
    const activeEl = activeGroupKey ? itemRefs.current[activeGroupKey] : null;
    if (!navEl || !activeEl) {
      setUnderline((prev) => ({ ...prev, ready: false }));
      return;
    }
    const navRect = navEl.getBoundingClientRect();
    const elRect = activeEl.getBoundingClientRect();
    setUnderline({ left: elRect.left - navRect.left + 12, width: elRect.width - 24, ready: true });
  }, [activeGroupKey]);

  useLayoutEffect(() => {
    measureUnderline();
  }, [measureUnderline]);

  useEffect(() => {
    window.addEventListener('resize', measureUnderline);
    return () => window.removeEventListener('resize', measureUnderline);
  }, [measureUnderline]);

  const onUserMenuClick = ({ key }) => {
    if (key === 'change-pw') setPwOpen(true);
    if (key === 'logout') {
      handleLogout();
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 w-full bg-navy-900 text-white shadow-[0_2px_12px_rgba(10,30,63,0.35)]">
      <div className="mx-auto flex h-full max-w-[1440px] items-center gap-2 px-3 sm:gap-4 sm:px-4 xl:px-6">
        {/* Dưới lg không đủ chỗ cho dải menu ngang -> mở bằng ngăn kéo. */}
        <button
          type="button"
          aria-label="Mở menu điều hướng"
          onClick={() => setMenuOpen(true)}
          className="-ml-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-0 bg-transparent text-white/90 transition-colors hover:bg-white/10 lg:hidden"
        >
          <MenuOutlined className="text-[18px]" />
        </button>

        <Logo variant="dark" />

        {/* Menu nhóm — hover sổ mega-dropdown */}
        <nav ref={navRef} className="relative hidden h-full flex-1 items-stretch justify-center gap-0.5 lg:flex">
          {NAV_GROUPS.map((group) => {
            const isMulti = group.items.length > 1;
            const isActive = group.items.some((i) => i.key === activeItemKey);

            return (
              <div key={group.key} className="group relative flex items-stretch">
                <button
                  ref={(el) => {
                    itemRefs.current[group.key] = el;
                  }}
                  type="button"
                  onClick={() => navigate(group.items[0].key)}
                  className={`relative flex items-center gap-1.5 border-0 bg-transparent px-3 text-[14px] font-medium transition-colors xl:px-4 ${
                    isActive ? 'text-white' : 'text-[#c7d6f5] hover:text-white'
                  }`}
                >
                  {group.label}
                  {isMulti && (
                    <DownOutlined className="text-[9px] opacity-70 transition-transform group-hover:rotate-180" />
                  )}
                </button>

                {isMulti && (
                  <div className="pointer-events-none absolute left-1/2 top-full z-40 -translate-x-1/2 pt-2 opacity-0 transition-opacity duration-150 group-hover:pointer-events-auto group-hover:opacity-100">
                    <div className="grid w-72 grid-cols-1 gap-1 rounded-2xl border border-hair bg-white p-2 text-ink shadow-[0_16px_40px_rgba(10,30,63,0.18)]">
                      {group.items.map((item) => {
                        const itemActive = item.key === activeItemKey;
                        return (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => navigate(item.key)}
                            className={`flex items-start gap-3 rounded-xl border-0 p-3 text-left transition-colors ${
                              itemActive ? 'bg-tint' : 'bg-transparent hover:bg-slate-50'
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

          <motion.span
            className="pointer-events-none absolute bottom-0 h-[3px] rounded-full bg-[linear-gradient(90deg,#3B74F5,#F59E0B)]"
            initial={false}
            animate={{ left: underline.left, width: underline.width, opacity: underline.ready ? 1 : 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          />
        </nav>

        {/* Cụm bên phải: chuông + avatar */}
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

      {/* Menu cho màn hình hẹp: đủ cả 6 nhóm và mọi mục con, kèm mô tả như mega-dropdown. */}
      <Drawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        placement="left"
        width={300}
        title={<span className="text-[15px] font-bold text-ink">Điều hướng</span>}
        styles={{ body: { padding: 12 } }}
      >
        <nav className="flex flex-col gap-4">
          {NAV_GROUPS.map((group) => (
            <div key={group.key}>
              <div className="px-2 pb-1.5 text-[11px] font-bold uppercase tracking-wide text-ink-sub">
                {group.label}
              </div>
              <div className="flex flex-col gap-1">
                {group.items.map((item) => {
                  const itemActive = item.key === activeItemKey;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => {
                        navigate(item.key);
                        setMenuOpen(false);
                      }}
                      className={`flex w-full items-start gap-3 rounded-xl border-0 p-2.5 text-left transition-colors ${
                        itemActive ? 'bg-tint' : 'bg-transparent hover:bg-slate-50'
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[15px] ${
                          itemActive ? 'bg-royal text-white' : 'bg-tint text-royal'
                        }`}
                      >
                        {createElement(item.icon)}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-[13.5px] font-semibold text-ink">
                          {item.label}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-ink-sub">{item.desc}</span>
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
