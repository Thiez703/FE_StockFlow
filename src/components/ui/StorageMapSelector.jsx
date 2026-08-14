import { Spin, Alert } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/api/dashboard';
import { DEFAULT_WAREHOUSE_ID } from '@/constants/warehouse';
import { getErrorMessage } from '@/utils/getErrorMessage';
import { formatNumber } from '@/utils/formatCurrency';
import { CheckCircleFilled } from '@ant-design/icons';

const STATUS_THEME = {
  EMPTY: 'border-dashed border-slate-300 bg-slate-50/50 text-slate-400 opacity-60',
  NORMAL: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:ring-1 hover:ring-emerald-400',
  BELOW_MIN: 'border-rose-200 bg-rose-50 text-rose-700 hover:ring-1 hover:ring-rose-400',
  NEAR_EXPIRY: 'border-amber-200 bg-amber-50 text-amber-700 hover:ring-1 hover:ring-amber-400',
  EXPIRED: 'border-red-300 bg-red-50 text-red-700 hover:ring-1 hover:ring-red-400',
};

export default function StorageMapSelector({ onSelect, currentCellKey, productIdFilter }) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['dashboard', 'storage-map', DEFAULT_WAREHOUSE_ID],
    queryFn: () => dashboardApi.getStorageMap(DEFAULT_WAREHOUSE_ID),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Spin tip="Đang tải sơ đồ..." />
      </div>
    );
  }

  if (isError) {
    return <Alert type="error" message="Lỗi tải sơ đồ" description={getErrorMessage(error)} />;
  }

  const rows = data?.rows ?? [];

  const renderCell = (cell) => {
    const isEmpty = cell.status === 'EMPTY';
    const isMatchingProduct = productIdFilter ? cell.productId === productIdFilter : true;
    const isSelectable = !isEmpty && isMatchingProduct;
    const cellKey = `${cell.lotId}-${cell.locationId}`;
    const isSelected = currentCellKey === cellKey;

    let theme = STATUS_THEME[cell.status] || STATUS_THEME.EMPTY;
    if (!isMatchingProduct && !isEmpty) {
      theme = 'border-slate-200 bg-slate-100 text-slate-400 opacity-50 cursor-not-allowed';
    }

    return (
      <div
        key={cell.locationCode}
        onClick={() => {
          if (isSelectable) onSelect(cellKey);
        }}
        className={`relative flex min-h-[80px] flex-col rounded-xl border-2 p-2 transition-all ${theme} ${
          isSelectable ? 'cursor-pointer' : 'cursor-not-allowed'
        } ${isSelected ? '!border-royal !bg-blue-50/50 ring-2 ring-royal/30 shadow-md' : ''}`}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="font-mono text-sm font-bold">{cell.locationCode}</span>
          {isSelected && <CheckCircleFilled className="text-royal text-base" />}
        </div>
        {!isEmpty && isMatchingProduct && (
          <div className="mt-auto flex flex-col gap-0.5 text-[11px]">
            <span className="font-bold truncate" title={cell.lotCode}>Lô: {cell.lotCode}</span>
            <span className="opacity-90">Tồn: {formatNumber(cell.quantity)}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full bg-slate-50 p-3 md:p-5 rounded-xl border border-slate-200 shadow-inner">
      <div className="flex flex-col gap-4">
        {rows.map((row) => (
          <div key={row.rowLabel} className="flex flex-col lg:flex-row gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
            <div className="w-full lg:w-8 flex lg:flex-col items-center justify-center font-black text-slate-400 bg-slate-50 rounded-lg py-1 lg:py-0 border border-slate-100">
              <span className="lg:hidden mr-2">DÃY</span>
              <span>{row.rowLabel}</span>
            </div>
            
            <div className="flex-1 flex flex-col lg:flex-row gap-4 relative">
              {/* Lối đi ở giữa (Desktop) */}
              <div className="hidden lg:flex absolute left-1/2 top-0 bottom-0 w-6 -ml-3 items-center justify-center border-x border-dashed border-slate-200 bg-slate-50/30"></div>

              <div className="flex-1 grid grid-cols-3 gap-2">
                {row.cells.slice(0, 3).map(renderCell)}
              </div>

              {/* Lối đi ở giữa (Mobile) */}
              <div className="lg:hidden flex items-center justify-center text-[10px] uppercase text-slate-300 font-bold border-y border-dashed border-slate-100 py-1 bg-slate-50 rounded">
                Lối đi
              </div>

              <div className="flex-1 grid grid-cols-3 gap-2">
                {row.cells.slice(3, 6).map(renderCell)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
