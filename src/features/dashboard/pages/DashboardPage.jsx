import { useState } from 'react';
import { Popover, Spin, Alert, Button } from 'antd';
import { WarningOutlined, FileSyncOutlined, AppstoreOutlined, ExportOutlined, PlusOutlined, ImportOutlined, SettingOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '@/components/ui/PageHeader';
import AlertsPanel from '@/features/dashboard/components/AlertsPanel';
import RecentActivities from '@/features/dashboard/components/RecentActivities';
import StatCard from '@/features/dashboard/components/StatCard';
import WarehouseMapConfig from '@/features/dashboard/components/WarehouseMapConfig';
import { formatNumber } from '@/utils/formatCurrency';
import { dashboardApi } from '@/api/dashboard';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { DEFAULT_WAREHOUSE_ID } from '@/constants/warehouse';
import { usePermissions } from '@/hooks/usePermissions';
import { getErrorMessage } from '@/utils/getErrorMessage';
import AccountantDashboard from '@/features/dashboard/pages/AccountantDashboard';
import StaffDashboard from '@/features/dashboard/pages/StaffDashboard';

// Style theo trạng thái ô (enum trả về từ BE). Giữ nguyên bảng màu đã có sẵn
// của khối sơ đồ (emerald/rose/amber) khi còn 4 state; EXPIRED là state mới,
// dùng tông đỏ đậm (red-600/700, tương đương semantic.danger #DC2626) để phân
// biệt rõ với NEAR_EXPIRY (cam).
const STATUS_THEME = {
  EMPTY: {
    wrapper: 'border-2 border-dashed border-slate-300 bg-slate-50/70 hover:bg-slate-100 cursor-default',
    header: '',
    highlight: 'text-slate-400',
  },
  NORMAL: {
    wrapper: 'border border-emerald-200 bg-white shadow-md hover:shadow-xl hover:-translate-y-1.5 cursor-pointer ring-1 ring-emerald-100',
    header: 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-b border-emerald-600',
    highlight: 'text-emerald-600',
  },
  BELOW_MIN: {
    wrapper: 'border border-rose-200 bg-white shadow-md hover:shadow-xl hover:-translate-y-1.5 cursor-pointer ring-1 ring-rose-100',
    header: 'bg-gradient-to-r from-rose-500 to-pink-500 text-white border-b border-rose-600',
    highlight: 'text-rose-600',
  },
  NEAR_EXPIRY: {
    wrapper: 'border border-amber-200 bg-white shadow-md hover:shadow-xl hover:-translate-y-1.5 cursor-pointer ring-1 ring-amber-100',
    header: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-b border-amber-600',
    highlight: 'text-amber-600',
  },
  EXPIRED: {
    wrapper: 'border border-red-300 bg-white shadow-md hover:shadow-xl hover:-translate-y-1.5 cursor-pointer ring-1 ring-red-200',
    header: 'bg-gradient-to-r from-red-600 to-red-700 text-white border-b border-red-800',
    highlight: 'text-red-700',
  },
};

function getCapacityInfo(used, capacity) {
  if (capacity == null) return null;
  const pct = Math.min(100, Math.round((used / capacity) * 100));
  const color = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-emerald-500';
  const label = pct >= 90 ? 'Gần đầy' : pct >= 70 ? 'Khá đầy' : pct >= 40 ? 'Vừa phải' : 'Còn trống';
  const bgFill = pct >= 90 ? 'from-red-500/10' : pct >= 70 ? 'from-amber-500/10' : 'from-emerald-500/10';
  return { pct, color, label, bgFill };
}

function CapacityBar({ used, capacity }) {
  if (capacity == null) return null;
  const info = getCapacityInfo(used, capacity);
  return (
    <div className="mt-2">
      <div className="flex justify-between text-[10px] text-slate-400 font-bold mb-0.5">
        <span>{formatNumber(used)}/{formatNumber(capacity)} Thùng</span>
        <span className={info.pct >= 90 ? 'text-red-500 font-black' : info.pct >= 70 ? 'text-amber-500 font-black' : ''}>{info.pct}%</span>
      </div>
      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${info.color}`} style={{ width: `${info.pct}%` }} />
      </div>
      <div className={`text-[9px] font-bold mt-0.5 text-center ${info.pct >= 90 ? 'text-red-500' : info.pct >= 70 ? 'text-amber-500' : 'text-emerald-500'}`}>
        {info.label}
      </div>
    </div>
  );
}

function OccupantStatusBadge({ status }) {
  if (status === 'NEAR_EXPIRY') return <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">Sắp HH</span>;
  if (status === 'EXPIRED') return <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">Hết hạn</span>;
  if (status === 'BELOW_MIN') return <span className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">Dưới min</span>;
  return null;
}

function DashboardWarehouseMap() {
  const navigate = useNavigate();
  const { canManageMasterData } = usePermissions();
  const expirySoonDays = useSelector((state) => state.settings.expirySoonDays);
  const [showConfig, setShowConfig] = useState(false);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['dashboard', 'storage-map', DEFAULT_WAREHOUSE_ID],
    queryFn: () => dashboardApi.getStorageMap(DEFAULT_WAREHOUSE_ID),
  });

  const renderCell = (cell) => {
    const occupants = cell.occupants ?? [];
    const isEmpty = !occupants.length;
    const theme = STATUS_THEME[cell.status] ?? STATUS_THEME.EMPTY;
    const firstOcc = occupants[0];

    const popoverContent = !isEmpty ? (
      <div className="w-[340px] p-1 max-h-[400px] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
          <div className="text-sm font-bold text-slate-700">Vị trí {cell.locationCode}</div>
          <div className="text-[11px] text-slate-400 font-medium">
            {occupants.length} lô &middot; {formatNumber(cell.usedQuantity)} Thùng
            {cell.capacity != null && ` / ${formatNumber(cell.capacity)}`}
          </div>
        </div>

        {occupants.map((occ, idx) => {
          const occTheme = STATUS_THEME[occ.status] ?? STATUS_THEME.NORMAL;
          return (
            <div key={occ.lotId} className={`${idx > 0 ? 'mt-3 pt-3 border-t border-slate-100' : ''}`}>
              <div className="flex items-center justify-between mb-1">
                <div className="font-mono font-medium bg-slate-100 px-2 py-0.5 rounded text-[12px]">{occ.lotCode}</div>
                <OccupantStatusBadge status={occ.status} />
              </div>
              <div className="text-[13px] font-bold text-slate-800 leading-snug mb-2">{occ.productName}</div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <div className="text-[10px] text-slate-400 mb-0.5">Tồn kho</div>
                  <div className={`text-base font-bold ${occTheme.highlight}`}>{formatNumber(occ.quantity)}</div>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <div className="text-[10px] text-slate-400 mb-0.5">Tối thiểu</div>
                  <div className="text-base font-bold text-slate-600">{occ.minStock == null ? '-' : formatNumber(occ.minStock)}</div>
                </div>
              </div>
              {occ.status === 'NEAR_EXPIRY' && (
                <div className="mt-2 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded flex items-center gap-1">
                  <WarningOutlined /> HSD: {occ.expDate} (còn {occ.daysToExpiry} ngày)
                </div>
              )}
              {occ.status === 'EXPIRED' && (
                <div className="mt-2 text-[11px] text-red-700 bg-red-50 border border-red-200 px-2 py-1 rounded flex items-center gap-1">
                  <WarningOutlined /> HSD: {occ.expDate} — đã hết hạn
                </div>
              )}
              {occ.status === 'EXPIRED' ? (
                <Button size="small" block icon={<DeleteOutlined />} type="primary" danger className="mt-2"
                  onClick={() => navigate('/outbounds/create/disposal', { state: { prefill: [{ lotId: occ.lotId, lotCode: occ.lotCode, productId: occ.productId, productName: occ.productName, locationId: cell.locationId, quantity: occ.quantity }] } })}>
                  Hủy lô
                </Button>
              ) : (
                <div className="mt-2 flex gap-2">
                  <Button size="small" type="primary" icon={<ExportOutlined />}
                    onClick={() => navigate('/outbounds/create/retail', { state: { prefill: [{ cellKey: `${occ.lotId}-${cell.locationId}` }] } })}>
                    Xuất
                  </Button>
                  <Button size="small" icon={<ImportOutlined />}
                    className="border-emerald-500 text-emerald-600 hover:text-emerald-500"
                    onClick={() => navigate('/inbounds/create/old', { state: { prefill: [{ productId: occ.productId, lotCode: occ.lotCode, lotId: occ.lotId, locationId: cell.locationId }] } })}>
                    Nhập thêm
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    ) : (
      <div className="w-[220px] p-2 text-center">
        <div className="text-[13px] font-medium text-slate-600 mb-3">Vị trí {cell.locationCode} đang trống</div>
        <Button type="primary" block icon={<PlusOutlined />}
          onClick={() => navigate('/inbounds/create/new', { state: { prefill: [{ locationId: cell.locationId }] } })}>
          Nhập kho vào vị trí này
        </Button>
      </div>
    );

    const capInfo = !isEmpty ? getCapacityInfo(cell.usedQuantity, cell.capacity) : null;

    const cellContent = (
      <div className={`min-h-[135px] rounded-xl transition-all duration-300 flex flex-col relative overflow-hidden group ${theme.wrapper}`}>
        {/* Fill overlay - visual fullness indicator */}
        {capInfo && (
          <div
            className="absolute bottom-0 left-0 right-0 transition-all duration-500 opacity-20 pointer-events-none"
            style={{
              height: `${capInfo.pct}%`,
              background: capInfo.pct >= 90
                ? 'linear-gradient(to top, rgb(239 68 68), transparent)'
                : capInfo.pct >= 70
                  ? 'linear-gradient(to top, rgb(245 158 11), transparent)'
                  : 'linear-gradient(to top, rgb(16 185 129), transparent)',
            }}
          />
        )}

        {!isEmpty ? (
          <>
            <div className={`flex justify-between items-center px-3 py-2 shadow-sm relative z-10 ${theme.header}`}>
              <span className="text-[13px] font-mono font-bold tracking-wider drop-shadow-sm">
                {cell.locationCode}
              </span>
              {occupants.length === 1 ? (
                <span className="text-[11px] font-bold bg-black/20 px-2 py-0.5 rounded-full truncate max-w-[65%] shadow-inner tracking-wide" title={`Lô: ${firstOcc.lotCode}`}>
                  {firstOcc.lotCode}
                </span>
              ) : (
                <span className="text-[11px] font-bold bg-black/20 px-2 py-0.5 rounded-full shadow-inner tracking-wide">
                  {occupants.length} lô
                </span>
              )}
            </div>

            <div className="flex flex-col flex-1 p-3 bg-white/80 relative z-10">
              {occupants.length === 1 ? (
                <div className="text-[13.5px] font-bold text-slate-800 leading-tight line-clamp-2 mb-2" title={firstOcc.productName}>
                  {firstOcc.productName}
                </div>
              ) : (
                <div className="text-[12px] text-slate-600 leading-tight mb-2">
                  {occupants.slice(0, 2).map(o => o.productName).join(', ')}
                  {occupants.length > 2 && ` +${occupants.length - 2}`}
                </div>
              )}

              <div className="mt-auto">
                <div className="flex justify-between items-end">
                  <div className="flex flex-col">
                    <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-0.5">Tổng tồn</span>
                    <span className={`font-black text-[16px] leading-none ${theme.highlight}`}>
                      {formatNumber(cell.usedQuantity)}
                    </span>
                  </div>
                  {cell.capacity != null && (
                    <div className="flex flex-col text-right">
                      <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-0.5">Sức chứa</span>
                      <span className="font-bold text-slate-500 text-[13px] leading-none">{formatNumber(cell.capacity)}</span>
                    </div>
                  )}
                </div>

                <CapacityBar used={cell.usedQuantity} capacity={cell.capacity} />

                {cell.status === 'NEAR_EXPIRY' && (
                  <div className="mt-2 text-[11px] font-bold text-amber-700 flex items-center justify-center gap-1 bg-amber-50 border border-amber-200 w-full py-1 rounded-md shadow-sm">
                    <WarningOutlined /> Sắp hết hạn
                  </div>
                )}
                {cell.status === 'EXPIRED' && (
                  <div className="mt-2 text-[11px] font-bold text-red-700 flex items-center justify-center gap-1 bg-red-50 border border-red-200 w-full py-1 rounded-md shadow-sm">
                    <WarningOutlined /> Đã hết hạn
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center opacity-60">
            <div className="text-[16px] font-mono font-bold text-slate-400">{cell.locationCode}</div>
            <div className="text-[11px] uppercase tracking-widest font-bold text-slate-400 mt-2 border-2 border-slate-300 px-3 py-0.5 rounded-full">Trống</div>
            {cell.capacity != null && (
              <div className="text-[10px] text-slate-400 mt-1">Sức chứa: {formatNumber(cell.capacity)}</div>
            )}
          </div>
        )}
      </div>
    );

    return (
      <Popover key={cell.locationCode} content={popoverContent} title={!isEmpty ? `Chi tiết vị trí: ${cell.locationCode}` : 'Trạng thái vị trí'} trigger="click" placement="right">
        <div className="cursor-pointer h-full">{cellContent}</div>
      </Popover>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[400px] w-full bg-slate-50 border border-slate-200 rounded-xl shadow-inner">
        <Spin size="large" tip="Đang tải dữ liệu bản đồ lưu trữ..." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-3 md:p-6 bg-slate-50 border border-slate-200 rounded-xl shadow-inner flex-1 w-full">
        <Alert type="error" showIcon message="Không tải được bản đồ lưu trữ" description={getErrorMessage(error)} />
      </div>
    );
  }

  // Recalculate occupant status based on FE expirySoonDays setting
  const rows = (data?.rows ?? []).map((row) => ({
    ...row,
    cells: row.cells.map((cell) => {
      const occupants = (cell.occupants ?? []).map((occ) => {
        let status = occ.status;
        if (occ.daysToExpiry != null) {
          if (occ.daysToExpiry < 0) status = 'EXPIRED';
          else if (occ.daysToExpiry <= expirySoonDays && status !== 'EXPIRED') status = 'NEAR_EXPIRY';
          else if (status === 'NEAR_EXPIRY' && occ.daysToExpiry > expirySoonDays) status = 'NORMAL';
        }
        return { ...occ, status };
      });
      // Recalc cell status = worst among occupants
      let cellStatus = 'EMPTY';
      if (occupants.length > 0) {
        const priority = { EXPIRED: 4, NEAR_EXPIRY: 3, BELOW_MIN: 2, NORMAL: 1 };
        cellStatus = occupants.reduce((worst, o) => (priority[o.status] || 0) > (priority[worst] || 0) ? o.status : worst, 'NORMAL');
      }
      return { ...cell, occupants, status: cellStatus };
    }),
  }));

  return (
    <div className="p-3 md:p-6 bg-slate-50 border border-slate-200 rounded-xl shadow-inner flex-1 w-full">
      <div className="w-full bg-white p-3 md:p-6 rounded-lg shadow-sm border border-slate-300 relative mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex-1" />
          <div className="inline-block px-4 md:px-8 py-1.5 bg-slate-100 rounded-b-lg border-b-2 border-x-2 border-slate-200 font-bold text-slate-400 tracking-widest uppercase text-[10px] md:text-xs -mt-3 md:-mt-6">
            Sơ đồ vị trí lô hàng
          </div>
          <div className="flex-1 flex justify-end">
            {canManageMasterData && (
              <Button
                type="default"
                icon={<SettingOutlined />}
                size="small"
                onClick={() => setShowConfig(true)}
              >
                Cấu hình
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-6 md:gap-4">
          {rows.map(row => {
            const cellCount = row.cells.length;
            const half = Math.ceil(cellCount / 2);
            const leftCells = row.cells.slice(0, half);
            const rightCells = row.cells.slice(half);

            return (
              <div key={row.rowLabel} className="flex flex-col lg:flex-row gap-3 lg:gap-4 bg-slate-50 lg:bg-transparent p-3 lg:p-0 rounded-xl lg:rounded-none border lg:border-none border-slate-200">
                <div className="w-full lg:w-8 flex lg:flex-col items-center justify-center font-black text-slate-500 lg:bg-slate-50 rounded-xl border-b lg:border border-slate-200 text-sm shadow-sm py-2 lg:py-0 bg-white">
                  <span className="lg:hidden mr-2">DÃY</span>
                  <span>{row.rowLabel}</span>
                </div>
                <div className="flex-1 flex flex-col lg:flex-row gap-4 lg:gap-8 relative">
                  {rightCells.length > 0 && (
                    <div className="hidden lg:flex absolute left-1/2 top-0 bottom-0 w-6 -ml-3 items-center justify-center border-x-2 border-dashed border-slate-200 bg-slate-50/50" />
                  )}
                  <div className="flex-1 flex flex-wrap gap-3">
                    {leftCells.map((cell) => (
                      <div key={cell.locationCode} className="flex-1 min-w-[160px]">
                        {renderCell(cell)}
                      </div>
                    ))}
                  </div>
                  {rightCells.length > 0 && (
                    <>
                      <div className="lg:hidden flex items-center justify-center text-[10px] uppercase text-slate-400 font-bold border-y border-dashed border-slate-200 py-1.5 bg-white rounded-lg">
                        Lối đi giữa
                      </div>
                      <div className="flex-1 flex flex-wrap gap-3">
                        {rightCells.map((cell) => (
                          <div key={cell.locationCode} className="flex-1 min-w-[160px]">
                            {renderCell(cell)}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-inner">
          <div className="flex flex-wrap items-center justify-center gap-6 text-[13px] font-medium text-slate-700">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 border-2 border-dashed border-slate-300 bg-slate-50/70 rounded shadow-sm" />
              <span>Vị trí trống</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-emerald-500 to-teal-500 rounded shadow-sm ring-2 ring-emerald-100" />
              <span>Bình thường</span>
            </div>
            <div className="flex items-center gap-2 text-rose-700 font-bold">
              <div className="w-6 h-6 bg-gradient-to-br from-rose-500 to-pink-500 rounded shadow-sm ring-2 ring-rose-100" />
              <span>Dưới Min</span>
            </div>
            <div className="flex items-center gap-2 text-amber-700 font-bold">
              <div className="w-6 h-6 bg-gradient-to-br from-amber-500 to-orange-500 rounded shadow-sm ring-2 ring-amber-100" />
              <span>Sắp hết hạn</span>
            </div>
            <div className="flex items-center gap-2 text-red-700 font-bold">
              <div className="w-6 h-6 bg-gradient-to-br from-red-600 to-red-700 rounded shadow-sm ring-2 ring-red-200" />
              <span>Đã quá hạn</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 text-[12px] font-medium text-slate-500 mt-3 pt-3 border-t border-slate-200">
            <span className="text-slate-400 uppercase text-[10px] font-bold tracking-wider">Mức độ đầy:</span>
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded border border-emerald-200 relative overflow-hidden">
                <div className="absolute bottom-0 left-0 right-0 h-[30%] bg-emerald-400/30" />
              </div>
              <span>&lt;40%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded border border-emerald-200 relative overflow-hidden">
                <div className="absolute bottom-0 left-0 right-0 h-[60%] bg-emerald-400/30" />
              </div>
              <span>40-69%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded border border-amber-200 relative overflow-hidden">
                <div className="absolute bottom-0 left-0 right-0 h-[80%] bg-amber-400/30" />
              </div>
              <span>70-89%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded border border-red-200 relative overflow-hidden">
                <div className="absolute bottom-0 left-0 right-0 h-full bg-red-400/30" />
              </div>
              <span>&ge;90%</span>
            </div>
          </div>
        </div>
      </div>

      {canManageMasterData && (
        <WarehouseMapConfig
          open={showConfig}
          onClose={() => setShowConfig(false)}
          rows={rows}
          warehouseId={DEFAULT_WAREHOUSE_ID}
        />
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { role, canViewStorageMap } = usePermissions();

  if (role === 'ACCOUNTANT' || role === 'ROLE_ACCOUNTANT') {
    return <AccountantDashboard />;
  }

  console.log('[DashboardPage] Current role:', role);

  if (role === 'STAFF' || role === 'ROLE_STAFF') {
    return <StaffDashboard />;
  }

  return (
    <>
      <PageHeader
        title="Bảng điều khiển"
        subtitle="Tổng quan hoạt động kho hàng hôm nay, 18/07/2026"
        breadcrumb={[{ title: 'Tổng quan' }, { title: 'Bảng điều khiển' }]}
      />

      <div className="mt-4 flex flex-col gap-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="flex flex-col gap-4">
            <StatCard
              title="Phiếu chờ duyệt"
              value={formatNumber(0)}
              suffix="phiếu"
              icon={<FileSyncOutlined />}
              tone="blue"
              hint="Nhập / xuất / kiểm kê cần xử lý"
            />
            <div className="flex-1">
              <AlertsPanel />
            </div>
          </div>
          
          <div className="lg:col-span-2">
            <RecentActivities />
          </div>
        </div>

        {/* Sơ đồ vị trí lưu trữ — ADMIN/MANAGER/ACCOUNTANT only, STAFF nhận 403 nên ẩn hẳn khối */}
        {canViewStorageMap && (
          <div className="hidden w-full lg:block">
            <h3 className="mb-3 text-base font-semibold text-ink flex items-center gap-2">
              <AppstoreOutlined className="text-blue-600" /> Bản đồ lưu trữ & Tình trạng lô
            </h3>
            <DashboardWarehouseMap />
          </div>
        )}
      </div>
    </>
  );
}
