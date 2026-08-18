import { Spin, Alert } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/api/dashboard';
import { DEFAULT_WAREHOUSE_ID } from '@/constants/warehouse';
import { getErrorMessage } from '@/utils/getErrorMessage';
import { formatNumber } from '@/utils/formatCurrency';
import { CheckCircleFilled } from '@ant-design/icons';

const MAX_PRODUCTS_PER_LOCATION = 4;

const STATUS_THEME = {
  EMPTY: 'border-dashed border-slate-300 bg-slate-50/50 text-slate-400',
  NORMAL: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:ring-1 hover:ring-emerald-400',
  BELOW_MIN: 'border-rose-200 bg-rose-50 text-rose-700 hover:ring-1 hover:ring-rose-400',
  NEAR_EXPIRY: 'border-amber-200 bg-amber-50 text-amber-700 hover:ring-1 hover:ring-amber-400',
  EXPIRED: 'border-red-300 bg-red-50 text-red-700 hover:ring-1 hover:ring-red-400',
};

// Rotating colors for "already picked" badges — each row gets a distinct color
const PICK_COLORS = [
  { bg: 'bg-blue-500', text: 'text-white', border: 'border-blue-400', ring: 'ring-blue-300/40', label: 'text-blue-600' },
  { bg: 'bg-violet-500', text: 'text-white', border: 'border-violet-400', ring: 'ring-violet-300/40', label: 'text-violet-600' },
  { bg: 'bg-teal-500', text: 'text-white', border: 'border-teal-400', ring: 'ring-teal-300/40', label: 'text-teal-600' },
  { bg: 'bg-orange-500', text: 'text-white', border: 'border-orange-400', ring: 'ring-orange-300/40', label: 'text-orange-600' },
  { bg: 'bg-pink-500', text: 'text-white', border: 'border-pink-400', ring: 'ring-pink-300/40', label: 'text-pink-600' },
  { bg: 'bg-cyan-500', text: 'text-white', border: 'border-cyan-400', ring: 'ring-cyan-300/40', label: 'text-cyan-600' },
  { bg: 'bg-lime-600', text: 'text-white', border: 'border-lime-400', ring: 'ring-lime-300/40', label: 'text-lime-600' },
  { bg: 'bg-indigo-500', text: 'text-white', border: 'border-indigo-400', ring: 'ring-indigo-300/40', label: 'text-indigo-600' },
];

/**
 * Shared warehouse map selector used across all voucher create pages.
 *
 * Props:
 * - selectionMode: 'cell' | 'location'
 * - onSelect(value): callback with cellKey or locationId
 * - currentValue: current selected cellKey or locationId
 * - productIdFilter: only show cells matching this product (cell mode)
 * - highlightEmpty: show empty locations as selectable green cells
 * - excludeLocationIds: Set of locationIds to grey out
 * - inventoryCells: external inventory data for context display
 * - pickedLocations: Array of { locationId, cellKey?, rowIndex, productName?, productId? }
 *   Marks cells that are already selected by other rows in the voucher.
 * - currentProductId: the productId being placed (location mode) — used to
 *   enforce max 4 distinct products per location.
 */
export default function StorageMapSelector({
  onSelect,
  currentValue,
  productIdFilter,
  selectionMode = 'cell',
  highlightEmpty = false,
  excludeLocationIds,
  inventoryCells,
  pickedLocations = [],
  currentProductId,
}) {
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

  // Build lookup: locationId → picked entries
  const pickedByLocation = {};
  const pickedByCellKey = {};
  pickedLocations.forEach((p) => {
    if (p.locationId) {
      if (!pickedByLocation[p.locationId]) pickedByLocation[p.locationId] = [];
      pickedByLocation[p.locationId].push(p);
    }
    if (p.cellKey) {
      if (!pickedByCellKey[p.cellKey]) pickedByCellKey[p.cellKey] = [];
      pickedByCellKey[p.cellKey].push(p);
    }
  });

  // Build inventory lookup for inbound context
  const invByLocation = {};
  if (inventoryCells) {
    inventoryCells.forEach((c) => {
      if (!invByLocation[c.locationId]) invByLocation[c.locationId] = [];
      invByLocation[c.locationId].push(c);
    });
  }

  // Build product and occupant sets per location for max enforcement (location mode)
  const productsAtLocation = {};
  const occupantsAtLocation = {};
  
  if (selectionMode === 'location') {
    // Fill existing occupants from map data
    rows.forEach(r => {
      r.cells.forEach(c => {
        if (!occupantsAtLocation[c.locationId]) occupantsAtLocation[c.locationId] = new Set();
        if (c.occupants) {
          c.occupants.forEach(occ => {
            if (occ.lotId) occupantsAtLocation[c.locationId].add(`lot-${occ.lotId}`);
          });
        }
      });
    });

    if (inventoryCells) {
      inventoryCells.forEach((c) => {
        if (!productsAtLocation[c.locationId]) productsAtLocation[c.locationId] = new Set();
        if (c.productId) productsAtLocation[c.locationId].add(c.productId);
      });
    }

    // Also count from pickedLocations (other rows being added in this voucher)
    pickedLocations.forEach((p) => {
      if (p.locationId) {
        if (!productsAtLocation[p.locationId]) productsAtLocation[p.locationId] = new Set();
        if (p.productId) productsAtLocation[p.locationId].add(p.productId);

        if (!occupantsAtLocation[p.locationId]) occupantsAtLocation[p.locationId] = new Set();
        if (p.lotId) {
          occupantsAtLocation[p.locationId].add(`lot-${p.lotId}`);
        } else {
          occupantsAtLocation[p.locationId].add(`row-${p.rowIndex}`);
        }
      }
    });
  }

  const renderCell = (cell) => {
    const isEmpty = cell.status === 'EMPTY';
    const isExcluded = excludeLocationIds?.has(cell.locationId);
    
    // Determine which occupant to display/select
    const occupants = cell.occupants || [];
    let displayOcc = null;
    if (selectionMode === 'cell') {
      displayOcc = productIdFilter 
        ? occupants.find(o => o.productId === productIdFilter)
        : occupants[0];
    } else {
      displayOcc = occupants[0];
    }

    const cellLotId = displayOcc?.lotId;
    const cellLotCode = displayOcc?.lotCode || displayOcc?.lot;
    const cellQuantity = displayOcc?.quantity || cell.usedQuantity;
    const cellProductId = displayOcc?.productId;

    const cellKey = cellLotId ? `${cellLotId}-${cell.locationId}` : `empty-${cell.locationId}`;

    // Find picks for this cell
    const picksHere = selectionMode === 'cell'
      ? (pickedByCellKey[cellKey] || [])
      : (pickedByLocation[cell.locationId] || []);

    let isSelectable = false;
    let isSelected = false;
    let theme = STATUS_THEME[cell.status] || STATUS_THEME.EMPTY;
    let subtitle = '';

    if (selectionMode === 'cell') {
      const isMatchingProduct = productIdFilter ? cellProductId === productIdFilter : true;
      isSelectable = !isEmpty && isMatchingProduct && !isExcluded && !!displayOcc;
      isSelected = currentValue === cellKey;

      if (!isMatchingProduct && !isEmpty) {
        theme = 'border-slate-200 bg-slate-100 text-slate-400 opacity-50';
      }
      if (isExcluded) {
        theme = 'border-slate-200 bg-slate-100 text-slate-300 opacity-40';
      }

      if (!isEmpty && isMatchingProduct && displayOcc) {
        const lotInfo = cellLotCode ? `Lô: ${cellLotCode} · ` : '';
        subtitle = `${lotInfo}Tồn: ${formatNumber(cellQuantity)}`;
      }
    } else {
      isSelected = currentValue === cell.locationId;

      // Check max products and lots per location
      const existingProducts = productsAtLocation[cell.locationId];
      const productCount = existingProducts ? existingProducts.size : 0;
      const isCurrentProductAlreadyHere = currentProductId && existingProducts?.has(currentProductId);
      
      const existingOccupants = occupantsAtLocation[cell.locationId];
      const occupantCount = existingOccupants ? existingOccupants.size : 0;
      
      // Full if it reaches max lots, OR if it reaches max products and we are adding a NEW product
      const isFull = occupantCount >= MAX_PRODUCTS_PER_LOCATION || (productCount >= MAX_PRODUCTS_PER_LOCATION && !isCurrentProductAlreadyHere);

      if (isExcluded || isFull) {
        isSelectable = false;
        theme = 'border-slate-200 bg-slate-100 text-slate-300 opacity-40';
        subtitle = isFull ? `Đã đầy (${occupantCount}/${MAX_PRODUCTS_PER_LOCATION} lô)` : 'Không chọn được';
      } else if (isEmpty) {
        if (highlightEmpty) {
          isSelectable = true;
          theme = 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:ring-1 hover:ring-emerald-400';
          subtitle = 'Trống';
        } else {
          isSelectable = true;
          theme = 'border-dashed border-slate-300 bg-slate-50/50 text-slate-400 hover:ring-1 hover:ring-slate-300';
          subtitle = 'Trống';
        }
      } else {
        isSelectable = true;
        const invHere = invByLocation[cell.locationId];
        if (invHere) {
          subtitle = occupantCount > 1
            ? `${occupantCount}/${MAX_PRODUCTS_PER_LOCATION} lô`
            : invHere[0]?.productName?.slice(0, 15) || '';
        } else {
          subtitle = occupantCount > 0
            ? `${occupantCount}/${MAX_PRODUCTS_PER_LOCATION} lô`
            : cellLotCode ? `Lô: ${cellLotCode}` : 'Có hàng';
        }
      }
    }

    const handleClick = () => {
      if (!isSelectable) return;
      onSelect(selectionMode === 'cell' ? cellKey : cell.locationId);
    };

    return (
      <div key={cell.locationCode} className="flex-1 min-w-[90px]">
        <div
          onClick={handleClick}
          className={`relative flex min-h-[80px] flex-col rounded-xl border-2 p-2 transition-all ${theme} ${
            isSelectable ? 'cursor-pointer' : 'cursor-not-allowed'
          } ${isSelected ? '!border-royal !bg-blue-50/50 ring-2 ring-royal/30 shadow-md' : ''} ${
            picksHere.length > 0 && !isSelected ? 'ring-1 ' + PICK_COLORS[picksHere[0].rowIndex % PICK_COLORS.length].ring : ''
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-mono text-sm font-bold">{cell.locationCode}</span>
            {isSelected && <CheckCircleFilled className="text-royal text-base" />}
          </div>

          {/* Already-picked badges */}
          {picksHere.length > 0 && !isSelected && (
            <div className="flex flex-wrap gap-0.5 mb-1">
              {picksHere.map((p) => {
                const color = PICK_COLORS[p.rowIndex % PICK_COLORS.length];
                return (
                  <span
                    key={p.rowIndex}
                    className={`inline-flex items-center gap-0.5 text-[8px] font-bold px-1 py-px rounded ${color.bg} ${color.text} leading-none`}
                    title={p.productName || `Dòng ${p.rowIndex + 1}`}
                  >
                    #{p.rowIndex + 1}
                    {p.productName && <span className="max-w-[40px] truncate">{p.productName.split(' ').pop()}</span>}
                  </span>
                );
              })}
            </div>
          )}

          {subtitle && (
            <div className="mt-auto text-[11px] leading-tight truncate" title={subtitle}>
              {subtitle}
            </div>
          )}
        </div>
      </div>
    );
  };


  // Collect unique pick colors for legend
  const pickIndices = [...new Set(pickedLocations.map((p) => p.rowIndex))];

  return (
    <div className="w-full bg-slate-50 p-3 md:p-5 rounded-xl border border-slate-200 shadow-inner">
      {/* Picked summary bar */}
      {pickIndices.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 px-2 py-2 bg-white rounded-lg border border-slate-200 text-[11px]">
          <span className="text-slate-400 font-bold uppercase tracking-wide mr-1">Đã chọn:</span>
          {pickedLocations.map((p) => {
            const color = PICK_COLORS[p.rowIndex % PICK_COLORS.length];
            return (
              <span key={`${p.rowIndex}-${p.locationId}`} className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-bold ${color.bg} ${color.text}`}>
                #{p.rowIndex + 1} {p.productName ? `— ${p.productName.slice(0, 20)}` : ''}
              </span>
            );
          })}
        </div>
      )}

      <div className="flex flex-col gap-4">
        {rows.map((row) => {
          const cellCount = row.cells.length;
          const half = Math.ceil(cellCount / 2);
          const leftCells = row.cells.slice(0, half);
          const rightCells = row.cells.slice(half);

          return (
            <div key={row.rowLabel} className="flex flex-col lg:flex-row gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
              <div className="w-full lg:w-8 flex lg:flex-col items-center justify-center font-black text-slate-400 bg-slate-50 rounded-lg py-1 lg:py-0 border border-slate-100">
                <span className="lg:hidden mr-2">DÃY</span>
                <span>{row.rowLabel}</span>
              </div>

              <div className="flex-1 flex flex-col lg:flex-row gap-4 relative">
                {rightCells.length > 0 && (
                  <div className="hidden lg:flex absolute left-1/2 top-0 bottom-0 w-6 -ml-3 items-center justify-center border-x border-dashed border-slate-200 bg-slate-50/30" />
                )}

                <div className="flex-1 flex flex-wrap gap-2">
                  {leftCells.map(renderCell)}
                </div>

                {rightCells.length > 0 && (
                  <>
                    <div className="lg:hidden flex items-center justify-center text-[10px] uppercase text-slate-300 font-bold border-y border-dashed border-slate-100 py-1 bg-slate-50 rounded">
                      Lối đi
                    </div>
                    <div className="flex-1 flex flex-wrap gap-2">
                      {rightCells.map(renderCell)}
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-500">
        {selectionMode === 'location' && highlightEmpty && (
          <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded border-2 border-emerald-400 bg-emerald-50" /> Trống</span>
        )}
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded border-2 border-emerald-200 bg-emerald-50" /> Bình thường</span>
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded border-2 border-amber-200 bg-amber-50" /> Sắp hết hạn</span>
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded border-2 border-red-300 bg-red-50" /> Hết hạn</span>
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded border-2 border-royal bg-blue-50" /> Đang chọn</span>
        {selectionMode === 'location' && (
          <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded border-2 border-slate-200 bg-slate-100 opacity-40" /> Đã đầy (tối đa {MAX_PRODUCTS_PER_LOCATION} lô)</span>
        )}
        {pickIndices.length > 0 && (
          <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-blue-500" /> Đã chọn (dòng khác)</span>
        )}
      </div>
    </div>
  );
}
