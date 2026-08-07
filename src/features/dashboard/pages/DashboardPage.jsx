import { Popover, Spin, Alert } from 'antd';
import { WarningOutlined, FileSyncOutlined, AppstoreOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '@/components/ui/PageHeader';
import QuickActionsBar from '@/features/dashboard/components/QuickActionsBar';
import AlertsPanel from '@/features/dashboard/components/AlertsPanel';
import RecentActivities from '@/features/dashboard/components/RecentActivities';
import StatCard from '@/features/dashboard/components/StatCard';
import { formatNumber } from '@/utils/formatCurrency';
import { KPIS } from '@/mock/dashboard';
import { dashboardApi } from '@/api/dashboard';
import { DEFAULT_WAREHOUSE_ID } from '@/constants/warehouse';
import { usePermissions } from '@/hooks/usePermissions';
import { getErrorMessage } from '@/utils/getErrorMessage';

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

function DashboardWarehouseMap() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['dashboard', 'storage-map', DEFAULT_WAREHOUSE_ID],
    queryFn: () => dashboardApi.getStorageMap(DEFAULT_WAREHOUSE_ID),
  });

  const renderCell = (cell) => {
    const theme = STATUS_THEME[cell.status];
    const isEmpty = cell.status === 'EMPTY';

    const popoverContent = !isEmpty ? (
      <div className="w-[300px] p-1">
        <div className="border-b border-slate-100 pb-3 mb-3">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Mã sản phẩm: {cell.productCode}</div>
          <div className="text-base font-bold text-slate-800 leading-snug">{cell.productName}</div>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <div className="text-[11px] text-slate-500 mb-1">Mã Lô</div>
            <div className="font-mono font-medium bg-slate-100 px-2 py-1 rounded inline-block text-[13px]">{cell.lotCode}</div>
          </div>
          <div>
            <div className="text-[11px] text-slate-500 mb-1">Đơn vị tính</div>
            <div className="font-medium text-[13px]">{cell.unit}</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-1">
          <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
            <div className="text-[11px] text-slate-500 mb-1">Tồn kho hiện tại</div>
            <div className={`text-lg font-bold ${theme.highlight}`}>
              {formatNumber(cell.quantity)}
            </div>
          </div>
          <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
            <div className="text-[11px] text-slate-500 mb-1">Định mức tối thiểu</div>
            <div className="text-lg font-bold text-slate-600">{cell.minStock == null ? '-' : formatNumber(cell.minStock)}</div>
          </div>
        </div>
        {cell.status === 'NEAR_EXPIRY' && (
          <div className="mt-3 bg-amber-50 border border-amber-200 text-amber-700 px-3 py-2 rounded-lg flex items-start gap-2">
            <WarningOutlined className="mt-0.5" />
            <div>
              <div className="font-bold text-[13px]">Lô hàng sắp hết hạn!</div>
              <div className="text-[12px] opacity-90 mt-0.5">HSD: {cell.expDate} (còn {cell.daysToExpiry} ngày)</div>
            </div>
          </div>
        )}
        {cell.status === 'EXPIRED' && (
          <div className="mt-3 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg flex items-start gap-2">
            <WarningOutlined className="mt-0.5" />
            <div>
              <div className="font-bold text-[13px]">Lô hàng đã hết hạn!</div>
              <div className="text-[12px] opacity-90 mt-0.5">HSD: {cell.expDate}</div>
            </div>
          </div>
        )}
      </div>
    ) : null;

    const cellContent = (
      <div
        className={`min-h-[135px] rounded-xl transition-all duration-300 flex flex-col relative overflow-hidden group ${theme.wrapper}`}
      >
        {!isEmpty ? (
          <>
            <div className={`flex justify-between items-center px-3 py-2 shadow-sm ${theme.header}`}>
              <span className="text-[13px] font-mono font-bold tracking-wider drop-shadow-sm">
                {cell.locationCode}
              </span>
              <span className="text-[11px] font-bold bg-black/20 px-2 py-0.5 rounded-full truncate max-w-[65%] shadow-inner tracking-wide" title={`Lô: ${cell.lotCode}`}>
                {cell.lotCode}
              </span>
            </div>

            <div className="flex flex-col flex-1 p-3 bg-white">
              <div className="text-[13.5px] font-bold text-slate-800 leading-tight line-clamp-2 mb-3" title={cell.productName}>
                {cell.productName}
              </div>

              <div className="mt-auto">
                <div className="flex justify-between items-end">
                  <div className="flex flex-col">
                    <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-0.5">Tồn kho</span>
                    <span className={`font-black text-[16px] leading-none ${theme.highlight}`}>
                      {formatNumber(cell.quantity)}
                    </span>
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-0.5">Tối thiểu</span>
                    <span className="font-bold text-slate-500 text-[13px] leading-none">{cell.minStock == null ? '-' : formatNumber(cell.minStock)}</span>
                  </div>
                </div>

                {cell.status === 'NEAR_EXPIRY' && (
                  <div className="mt-3 text-[11px] font-bold text-amber-700 flex items-center justify-center gap-1 bg-amber-50 border border-amber-200 w-full py-1 rounded-md shadow-sm">
                    <WarningOutlined /> Sắp hết hạn
                  </div>
                )}
                {cell.status === 'EXPIRED' && (
                  <div className="mt-3 text-[11px] font-bold text-red-700 flex items-center justify-center gap-1 bg-red-50 border border-red-200 w-full py-1 rounded-md shadow-sm">
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
          </div>
        )}
      </div>
    );

    if (isEmpty) return <div key={cell.locationCode}>{cellContent}</div>;

    return (
      <Popover key={cell.locationCode} content={popoverContent} title={`Chi tiết vị trí: ${cell.locationCode}`} trigger="click" placement="right">
        {cellContent}
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

  const rows = data?.rows ?? [];

  return (
    <div className="p-3 md:p-6 bg-slate-50 border border-slate-200 rounded-xl shadow-inner flex-1 w-full">
      <div className="w-full bg-white p-3 md:p-6 rounded-lg shadow-sm border border-slate-300 relative mx-auto">
        <div className="text-center mb-6">
          <div className="inline-block px-4 md:px-8 py-1.5 bg-slate-100 rounded-b-lg border-b-2 border-x-2 border-slate-200 font-bold text-slate-400 tracking-widest uppercase text-[10px] md:text-xs -mt-3 md:-mt-6">
            Sơ đồ vị trí lô hàng
          </div>
        </div>

        <div className="flex flex-col gap-6 md:gap-4">
          {rows.map(row => (
            <div key={row.rowLabel} className="flex flex-col lg:flex-row gap-3 lg:gap-4 bg-slate-50 lg:bg-transparent p-3 lg:p-0 rounded-xl lg:rounded-none border lg:border-none border-slate-200">
              <div className="w-full lg:w-8 flex lg:flex-col items-center justify-center font-black text-slate-500 lg:bg-slate-50 rounded-xl border-b lg:border border-slate-200 text-sm shadow-sm py-2 lg:py-0 bg-white">
                <span className="lg:hidden mr-2">DÃY</span>
                <span>{row.rowLabel}</span>
              </div>
              <div className="flex-1 flex flex-col lg:flex-row gap-4 lg:gap-8 relative">
                {/* Lối đi ở giữa (Desktop) */}
                <div className="hidden lg:flex absolute left-1/2 top-0 bottom-0 w-6 -ml-3 items-center justify-center border-x-2 border-dashed border-slate-200 bg-slate-50/50">
                </div>

                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {row.cells.slice(0, 3).map(renderCell)}
                </div>

                {/* Lối đi ở giữa (Mobile) */}
                <div className="lg:hidden flex items-center justify-center text-[10px] uppercase text-slate-400 font-bold border-y border-dashed border-slate-200 py-1.5 bg-white rounded-lg">
                  Lối đi giữa
                </div>

                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {row.cells.slice(3, 6).map(renderCell)}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-[13px] font-medium text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-inner">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 border-2 border-dashed border-slate-300 bg-slate-50/70 rounded shadow-sm"></div>
            <span>Vị trí trống</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-emerald-500 to-teal-500 rounded shadow-sm ring-2 ring-emerald-100"></div>
            <span>Đang lưu trữ (Bình thường)</span>
          </div>
          <div className="flex items-center gap-2 text-rose-700 font-bold">
            <div className="w-6 h-6 bg-gradient-to-br from-rose-500 to-pink-500 rounded shadow-sm ring-2 ring-rose-100"></div>
            <span>Tồn kho dưới mức Min</span>
          </div>
          <div className="flex items-center gap-2 text-amber-700 font-bold">
            <div className="w-6 h-6 bg-gradient-to-br from-amber-500 to-orange-500 rounded shadow-sm ring-2 ring-amber-100"></div>
            <span>Lô hàng sắp hết hạn</span>
          </div>
          <div className="flex items-center gap-2 text-red-700 font-bold">
            <div className="w-6 h-6 bg-gradient-to-br from-red-600 to-red-700 rounded shadow-sm ring-2 ring-red-200"></div>
            <span>Lô đã quá hạn</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { canViewStorageMap } = usePermissions();

  return (
    <>
      <PageHeader
        title="Bảng điều khiển"
        subtitle="Tổng quan hoạt động kho hàng hôm nay, 18/07/2026"
        breadcrumb={[{ title: 'Tổng quan' }, { title: 'Bảng điều khiển' }]}
      />

      <div className="mb-4">
        <QuickActionsBar />
      </div>

      <div className="flex flex-col gap-6">
        {/* Sơ đồ vị trí lưu trữ — ADMIN/MANAGER/ACCOUNTANT only, STAFF nhận 403 nên ẩn hẳn khối */}
        {canViewStorageMap && (
          <div className="w-full">
            <h3 className="mb-3 text-base font-semibold text-ink flex items-center gap-2">
              <AppstoreOutlined className="text-blue-600" /> Bản đồ lưu trữ & Tình trạng lô
            </h3>
            <DashboardWarehouseMap />
          </div>
        )}

        {/* Cột thông tin phụ (chuyển xuống dưới) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="flex flex-col gap-4">
            <StatCard
              title="Phiếu chờ duyệt"
              value={formatNumber(KPIS.pendingDocs)}
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
      </div>
    </>
  );
}
