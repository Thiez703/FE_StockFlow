import { createElement, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Badge, Drawer } from 'antd';
import { motion } from 'framer-motion';
import WarehouseScene from '@/components/illustrations/WarehouseScene';
import {
  HomeOutlined,
  PlusCircleOutlined,
  UnorderedListOutlined,
  SearchOutlined,
  UserOutlined,
  ImportOutlined,
  ExportOutlined,
  AuditOutlined,
  ShoppingCartOutlined,
  RollbackOutlined,
  DeleteOutlined,
  LockOutlined,
  LogoutOutlined,
  BellOutlined,
  DatabaseOutlined,
} from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { useLogout } from '@/features/auth/hooks/useLogout';
import { usePermissions } from '@/hooks/usePermissions';
import { MASTER_DATA_ITEMS } from '@/features/master-data/constants/masterDataSections';
import ChangePasswordModal from '@/features/auth/components/ChangePasswordModal';

const CREATE_MENU_ITEMS = [
  {
    key: '/outbounds/create/retail',
    label: 'Xuất bán',
    icon: ShoppingCartOutlined,
    color: 'text-blue-600',
    permission: 'canCreateOutbound',
  },
  {
    key: '/outbounds/create/return_supplier',
    label: 'Trả NCC',
    icon: RollbackOutlined,
    color: 'text-amber-600',
    permission: 'canCreateOutbound',
  },
  {
    key: '/outbounds/create/disposal',
    label: 'Xuất hủy',
    icon: DeleteOutlined,
    color: 'text-red-600',
    permission: 'canCreateOutbound',
  },
  {
    key: '/inbounds/create',
    label: 'Nhập kho',
    icon: ImportOutlined,
    color: 'text-green-600',
    permission: 'canCreateInbound',
  },
  {
    key: '/stocktakes/create',
    label: 'Kiểm kê',
    icon: AuditOutlined,
    color: 'text-purple-600',
    permission: 'canCreateStocktake',
  },
];

const VOUCHER_LIST_ITEMS = [
  {
    key: '/outbounds',
    label: 'Phiếu xuất',
    icon: ExportOutlined,
    color: 'text-blue-600',
  },
  {
    key: '/inbounds',
    label: 'Phiếu nhập',
    icon: ImportOutlined,
    color: 'text-green-600',
  },
  {
    key: '/stocktakes',
    label: 'Phiếu kiểm kê',
    icon: AuditOutlined,
    color: 'text-purple-600',
  },
];

export default function MobileBottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const user = useSelector((state) => state.auth.user);
  const handleLogout = useLogout();
  const permissions = usePermissions();
  const [createOpen, setCreateOpen] = useState(false);
  const [vouchersOpen, setVouchersOpen] = useState(false);
  const [masterDataOpen, setMasterDataOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);

  const visibleCreateItems = useMemo(
    () => CREATE_MENU_ITEMS.filter((item) => !item.permission || permissions[item.permission]),
    [permissions],
  );

  const canCreate = visibleCreateItems.length > 0;
  const canViewInventory = permissions.canViewInventory;
  const canManageMasterData = permissions.canManageMasterData;

  const bottomTabs = useMemo(() => {
    const tabs = [
      { key: '/dashboard', label: 'Trang chủ', icon: HomeOutlined },
    ];
    if (canCreate) {
      tabs.push({ key: 'create', label: 'Lập phiếu', icon: PlusCircleOutlined });
    }
    tabs.push({ key: 'vouchers', label: 'Phiếu', icon: UnorderedListOutlined });
    if (canManageMasterData) {
      tabs.push({ key: 'master-data', label: 'Dữ liệu', icon: DatabaseOutlined });
    }
    if (canViewInventory) {
      tabs.push({ key: '/inventory', label: 'Tra cứu', icon: SearchOutlined });
    }
    tabs.push({ key: 'account', label: 'Tài khoản', icon: UserOutlined });
    return tabs;
  }, [canCreate, canViewInventory, canManageMasterData]);

  const isTabActive = (key) => {
    if (key === 'create' || key === 'account') return false;
    if (key === 'vouchers') {
      return (
        pathname.startsWith('/outbounds') ||
        pathname.startsWith('/inbounds') ||
        pathname.startsWith('/stocktakes') ||
        pathname.startsWith('/transfers')
      );
    }
    if (key === 'master-data') {
      return pathname.startsWith('/master-data');
    }
    return pathname === key || pathname.startsWith(`${key}/`);
  };

  const handleTabClick = (key) => {
    if (key === 'create') {
      setCreateOpen(true);
      return;
    }
    if (key === 'vouchers') {
      setVouchersOpen(true);
      return;
    }
    if (key === 'master-data') {
      setMasterDataOpen(true);
      return;
    }
    if (key === 'account') {
      setAccountOpen(true);
      return;
    }
    navigate(key);
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 overflow-hidden border-t border-[#12356B] bg-[linear-gradient(150deg,#0A1E3F_0%,#12356B_55%,#1E5AF0_120%)] md:hidden">
        {/* Background animations */}
        <motion.div
          className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-white/10 z-0"
          animate={{ x: [0, 10, 0], y: [0, 5, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="pointer-events-none absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-white/5 z-0"
          animate={{ x: [0, -10, 0], y: [0, -5, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
        <WarehouseScene
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[150%] w-full opacity-40 mask-[linear-gradient(to_bottom,transparent,black_30%)] z-0"
        />

        {/* Safe area padding for devices with home indicator */}
        <div className="relative z-10 flex items-stretch justify-around pb-[env(safe-area-inset-bottom)]">
          {bottomTabs.map((tab) => {
            const active = isTabActive(tab.key);
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleTabClick(tab.key)}
                className={`flex min-h-[56px] min-w-[44px] flex-1 flex-col items-center justify-center gap-0.5 border-0 bg-transparent px-1 pt-1.5 pb-1 transition-colors ${
                  active
                    ? 'text-white font-semibold'
                    : 'text-[#8fa8d8] active:text-white'
                }`}
              >
                {tab.key === 'create' ? (
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-blue-600 shadow-md">
                    {createElement(tab.icon, { className: 'text-[18px]' })}
                  </span>
                ) : (
                  createElement(tab.icon, { className: 'text-[20px]' })
                )}
                <span className="text-[10px] font-medium leading-tight">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Drawer: Lập phiếu */}
      <Drawer
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        placement="bottom"
        height="auto"
        title={
          <span className="text-base font-bold text-ink">Lập phiếu mới</span>
        }
        styles={{ body: { padding: '8px 16px 16px' } }}
        className="rounded-t-2xl"
      >
        <div className="flex flex-col gap-2">
          {visibleCreateItems.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => {
                navigate(item.key);
                setCreateOpen(false);
              }}
              className="flex w-full items-center gap-3 rounded-xl border-0 bg-transparent p-3 text-left transition-colors active:bg-slate-50"
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 ${item.color}`}
              >
                {createElement(item.icon, { className: 'text-[18px]' })}
              </span>
              <span className="text-[15px] font-semibold text-ink">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </Drawer>

      {/* Drawer: Danh sách phiếu */}
      <Drawer
        open={vouchersOpen}
        onClose={() => setVouchersOpen(false)}
        placement="bottom"
        height="auto"
        title={
          <span className="text-base font-bold text-ink">Danh sách phiếu</span>
        }
        styles={{ body: { padding: '8px 16px 16px' } }}
        className="rounded-t-2xl"
      >
        <div className="flex flex-col gap-2">
          {VOUCHER_LIST_ITEMS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => {
                navigate(item.key);
                setVouchersOpen(false);
              }}
              className="flex w-full items-center gap-3 rounded-xl border-0 bg-transparent p-3 text-left transition-colors active:bg-slate-50"
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 ${item.color}`}
              >
                {createElement(item.icon, { className: 'text-[18px]' })}
              </span>
              <span className="text-[15px] font-semibold text-ink">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </Drawer>

      {/* Drawer: Dữ liệu nền */}
      <Drawer
        open={masterDataOpen}
        onClose={() => setMasterDataOpen(false)}
        placement="bottom"
        height="auto"
        title={
          <span className="text-base font-bold text-ink">Dữ liệu nền</span>
        }
        styles={{ body: { padding: '8px 16px 16px' } }}
        className="rounded-t-2xl"
      >
        <div className="flex flex-col gap-2">
          {MASTER_DATA_ITEMS.map((item) => (
            <button
              key={item.path}
              type="button"
              onClick={() => {
                navigate(item.path);
                setMasterDataOpen(false);
              }}
              className="flex w-full items-center gap-3 rounded-xl border-0 bg-transparent p-3 text-left transition-colors active:bg-slate-50"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-600">
                {createElement(item.icon, { className: 'text-[18px]' })}
              </span>
              <div className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold text-ink">
                  {item.label}
                </span>
                <span className="block text-xs text-ink-sub mt-0.5">
                  {item.desc}
                </span>
              </div>
            </button>
          ))}
        </div>
      </Drawer>

      {/* Drawer: Tài khoản */}
      <Drawer
        open={accountOpen}
        onClose={() => setAccountOpen(false)}
        placement="bottom"
        height="auto"
        title={
          <span className="text-base font-bold text-ink">Tài khoản</span>
        }
        styles={{ body: { padding: '8px 16px 16px' } }}
        className="rounded-t-2xl"
      >
        <div className="flex flex-col gap-1">
          {/* User info */}
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 mb-2">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#E4E6EB] text-[#B0B3B8] text-[24px]">
              <UserOutlined />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[15px] font-bold text-ink">
                {user?.fullName || 'Chưa đăng nhập'}
              </span>
              <span className="block text-xs text-ink-sub mt-0.5">
                {user?.role || ''}
              </span>
            </span>
          </div>

          {/* Alerts - chỉ hiện nếu có quyền xem tồn kho */}
          {canViewInventory && (
            <button
              type="button"
              onClick={() => {
                navigate('/alerts');
                setAccountOpen(false);
              }}
              className="flex w-full items-center gap-3 rounded-xl border-0 bg-transparent p-3 text-left transition-colors active:bg-slate-50"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <BellOutlined className="text-[18px]" />
              </span>
              <span className="flex-1 text-[15px] font-semibold text-ink">
                Cảnh báo tồn kho
              </span>
              <Badge count={0} showZero={false} size="small" />
            </button>
          )}

          {/* Thẻ kho - chỉ hiện nếu có quyền xem tồn kho */}
          {canViewInventory && (
            <button
              type="button"
              onClick={() => {
                navigate('/stock-card');
                setAccountOpen(false);
              }}
              className="flex w-full items-center gap-3 rounded-xl border-0 bg-transparent p-3 text-left transition-colors active:bg-slate-50"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <UnorderedListOutlined className="text-[18px]" />
              </span>
              <span className="text-[15px] font-semibold text-ink">
                Thẻ kho
              </span>
            </button>
          )}

          {/* Báo cáo - chỉ hiện nếu có quyền xem báo cáo */}
          {permissions.canViewReports && (
            <button
              type="button"
              onClick={() => {
                navigate('/reports');
                setAccountOpen(false);
              }}
              className="flex w-full items-center gap-3 rounded-xl border-0 bg-transparent p-3 text-left transition-colors active:bg-slate-50"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <ExportOutlined className="text-[18px]" />
              </span>
              <span className="text-[15px] font-semibold text-ink">
                Báo cáo
              </span>
            </button>
          )}

          {/* Change password */}
          <button
            type="button"
            onClick={() => {
              setAccountOpen(false);
              setPwOpen(true);
            }}
            className="flex w-full items-center gap-3 rounded-xl border-0 bg-transparent p-3 text-left transition-colors active:bg-slate-50"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <LockOutlined className="text-[18px]" />
            </span>
            <span className="text-[15px] font-semibold text-ink">
              Đổi mật khẩu
            </span>
          </button>

          {/* Logout */}
          <button
            type="button"
            onClick={() => {
              setAccountOpen(false);
              handleLogout();
            }}
            className="flex w-full items-center gap-3 rounded-xl border-0 bg-transparent p-3 text-left transition-colors active:bg-red-50"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <LogoutOutlined className="text-[18px]" />
            </span>
            <span className="text-[15px] font-semibold text-red-600">
              Đăng xuất
            </span>
          </button>
        </div>
      </Drawer>

      <ChangePasswordModal open={pwOpen} onClose={() => setPwOpen(false)} />
    </>
  );
}
