import { useId, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Select, Tag, Tooltip, Input, DatePicker, Spin, Alert, Modal, Descriptions } from 'antd';
import { SearchOutlined, AppstoreOutlined, InboxOutlined, SwapOutlined, WalletOutlined, EyeOutlined } from '@ant-design/icons';
import PageHeader from '@/components/ui/PageHeader';
import FilterBar from '@/components/ui/FilterBar';
import DocCode from '@/components/ui/DocCode';
import TableEmptyState from '@/components/ui/TableEmptyState';
import FadeSection from '@/components/ui/FadeSection';
import { StaggerList, StaggerItem } from '@/components/ui/StaggerList';
import StatCard from '@/features/dashboard/components/StatCard';
import AccessDenied from '@/components/feedback/AccessDenied';
import VoucherPreviewModal from '@/components/ui/VoucherPreviewModal';
import { usePermissions } from '@/hooks/usePermissions';
import { useIsMobile } from '@/hooks/useIsMobile';
import { inventoryApi } from '@/api/inventory';
import { productApi } from '@/api/products';
import { inboundApi } from '@/api/inbounds';
import { outboundApi } from '@/api/outbounds';
import { stocktakeApi } from '@/api/stocktakes';
import { toInboundRecord } from '@/features/inbounds/utils/mapInbound';
import { toOutboundRecord } from '@/features/outbounds/utils/mapOutbound';
import { toStocktakeRecord } from '@/features/stocktakes/utils/mapStocktake';
import { getErrorMessage } from '@/utils/getErrorMessage';
import { formatDate } from '@/utils/date';
import { formatNumber } from '@/utils/formatCurrency';
import { toVoucher } from '@/utils/voucher';

import DateRangeSelectGroup from '@/components/ui/DateRangeSelectGroup';
import dayjs from 'dayjs';

// refType → label hiển thị + màu Tag
const REF_TYPE_MAP = {
  INBOUND: { label: 'Nhập', color: 'blue' },
  INBOUND_VOID: { label: 'Huỷ nhập', color: 'red' },
  OUTBOUND: { label: 'Xuất', color: 'gold' },
  OUTBOUND_VOID: { label: 'Huỷ xuất', color: 'red' },
  STOCKTAKE: { label: 'Kiểm kê', color: 'purple' },
  TRANSFER: { label: 'Điều chuyển', color: 'cyan' },
  TRANSFER_VOID: { label: 'Huỷ điều chuyển', color: 'red' },
};

// refType → đường dẫn chi tiết phiếu gốc
const REF_TYPE_PATH = {
  INBOUND: '/inbounds',
  INBOUND_VOID: '/inbounds',
  OUTBOUND: '/outbounds',
  OUTBOUND_VOID: '/outbounds',
  STOCKTAKE: '/stocktakes',
  TRANSFER: '/transfers',
  TRANSFER_VOID: '/transfers',
};

const TYPE_HEX = {
  INBOUND: '#1e5af0',
  INBOUND_VOID: '#dc2626',
  OUTBOUND: '#f59e0b',
  OUTBOUND_VOID: '#dc2626',
  STOCKTAKE: '#7c3aed',
  TRANSFER: '#0891b2',
  TRANSFER_VOID: '#dc2626',
};
const OPENING_HEX = '#12356b';

const ALL_REF_TYPES = Object.keys(REF_TYPE_MAP);

const TYPE_CHIP_ACTIVE_CLASS = {
  blue: 'border-royal/30 bg-tint text-royal',
  gold: 'border-amber/40 bg-amber/10 text-amber',
  purple: 'border-purple-300 bg-purple-100 text-purple-700',
  red: 'border-danger/40 bg-danger/10 text-danger',
  cyan: 'border-cyan-300 bg-cyan-100 text-cyan-700',
};

const CHART_PAD_X = 4;
const CHART_PAD_Y = 16;

function smoothLinePath(points) {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x},${points[0].y}`;
  let d = `M ${points[0].x},${points[0].y}`;
  for (let i = 1; i < points.length - 1; i++) {
    const xc = (points[i].x + points[i + 1].x) / 2;
    const yc = (points[i].y + points[i + 1].y) / 2;
    d += ` Q ${points[i].x},${points[i].y} ${xc},${yc}`;
  }
  const last = points[points.length - 1];
  d += ` Q ${last.x},${last.y} ${last.x},${last.y}`;
  return d;
}

// Lấy tổng trang lớn để có toàn bộ lịch sử
const BIG_PAGE = { page: 0, size: 500 };

export default function StockCardPage() {
  const { canViewInventory } = usePermissions();
  const [searchParams] = useSearchParams();
  const paramProductId = searchParams.get('productId');

  const [productId, setProductId] = useState(paramProductId ? Number(paramProductId) : null);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [dateRange, setDateRange] = useState([dayjs().subtract(1, 'month'), dayjs()]);
  const [keyword, setKeyword] = useState('');
  const [hoverIndex, setHoverIndex] = useState(null);
  const [detailTx, setDetailTx] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);

  const { data: previewVoucher } = useQuery({
    queryKey: ['doc-preview', previewDoc?.type, previewDoc?.id],
    queryFn: async () => {
      if (!previewDoc) return null;
      const { type, id } = previewDoc;
      let res;
      if (type.startsWith('INBOUND')) {
        res = await inboundApi.getById(id);
        return toVoucher('inbound', toInboundRecord(res.data ?? res));
      } else if (type.startsWith('OUTBOUND')) {
        res = await outboundApi.getById(id);
        return toVoucher('outbound', toOutboundRecord(res.data ?? res));
      } else if (type === 'STOCKTAKE') {
        res = await stocktakeApi.getById(id);
        return toVoucher('stocktake', toStocktakeRecord(res.data ?? res));
      }
      return null;
    },
    enabled: !!previewDoc,
  });

  // Danh sách sản phẩm cho selector
  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => productApi.getAll(),
  });

  const productOptions = useMemo(
    () => products.map((p) => ({ value: p.id, label: `${p.code} – ${p.name}` })),
    [products],
  );

  const effectiveProductId = productId;
  const selectedProduct = products.find((p) => p.id === effectiveProductId);

  // Lịch sử biến động
  const {
    data: txPage,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['inventory-transactions', effectiveProductId],
    queryFn: () => effectiveProductId 
      ? inventoryApi.getTransactionsByProduct(effectiveProductId, BIG_PAGE)
      : inventoryApi.getTransactions(BIG_PAGE),
    enabled: true,
  });

  // Map API → UI row shape
  const mappedRows = useMemo(() => {
    const rows = (txPage?.content ?? []).map((tx) => {
      const change = tx.quantityChange ?? 0;
      return {
        key: `tx-${tx.id}`,
        id: tx.id,
        date: tx.performedAt,
        refType: tx.refType,
        refId: tx.refId,
        refCode: tx.refCode,
        type: REF_TYPE_MAP[tx.refType]?.label ?? tx.refType,
        typeColor: REF_TYPE_MAP[tx.refType]?.color ?? 'default',
        inQty: change > 0 ? change : 0,
        outQty: change < 0 ? Math.abs(change) : 0,
        balance: tx.balanceAfter,
        note: `${tx.lotCode ?? ''} · ${tx.locationCode ?? ''}`.trim().replace(/^·\s*/, '').replace(/\s*·$/, '') || tx.performedBy || '',
        productName: tx.productName,
        raw: tx,
      };
    });
    
    // Đảm bảo mảng luôn được sắp xếp cũ -> mới (tăng dần theo thời gian) để logic tính đầu kỳ / cuối kỳ hoạt động đúng
    return rows.sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf());
  }, [txPage?.content]);

  // Tính số dư đầu kỳ (ngay trước thời điểm dateRange[0])
  const opening = useMemo(() => {
    if (mappedRows.length === 0) return 0;

    if (dateRange?.[0]) {
      const startString = dateRange[0].format('YYYY-MM-DD');
      let lastBefore = null;
      for (let i = 0; i < mappedRows.length; i++) {
        const txDay = dayjs(mappedRows[i].date).format('YYYY-MM-DD');
        if (txDay < startString) {
          lastBefore = mappedRows[i];
        } else {
          break; // Vì mappedRows đã được sắp xếp cũ -> mới
        }
      }
      if (lastBefore) return lastBefore.balance;
    }

    // Fallback: nếu không có giao dịch nào trước ngày lọc, tính số dư nguyên thủy
    const first = mappedRows[0];
    return first.balance - (first.inQty > 0 ? first.inQty : -first.outQty);
  }, [mappedRows, dateRange]);

  // Client-side filter
  const filteredRows = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return mappedRows.filter((r) => {
      const okType = selectedTypes.length === 0 || selectedTypes.includes(r.refType);
      
      const txDay = dayjs(r.date).format('YYYY-MM-DD');
      const okDate =
        !dateRange ||
        (txDay >= dateRange[0].format('YYYY-MM-DD') && txDay <= dateRange[1].format('YYYY-MM-DD'));
        
      const okKw = !kw || [r.refCode, r.note].some((v) => v.toLowerCase().includes(kw));
      return okType && okDate && okKw;
    });
  }, [mappedRows, selectedTypes, dateRange, keyword]);

  // Dòng "Số dư đầu kỳ" + các dòng biến động đã lọc
  const rows = useMemo(() => {
    // Chỉ hiển thị dòng Số dư đầu kỳ khi đang xem một sản phẩm cụ thể
    if (effectiveProductId) {
      return [{ key: 'opening', opening: true, balance: opening }, ...filteredRows];
    }
    // Nếu xem "Tất cả sản phẩm", chỉ hiện danh sách biến động (nhật ký chung)
    return filteredRows;
  }, [opening, filteredRows, effectiveProductId]);

  // Tính số dư cuối kỳ (ngay tại hoặc trước thời điểm dateRange[1])
  const closing = useMemo(() => {
    if (mappedRows.length === 0) return 0;
    
    if (dateRange?.[1]) {
      const endString = dateRange[1].format('YYYY-MM-DD');
      let lastInPeriod = null;
      for (let i = 0; i < mappedRows.length; i++) {
        const txDay = dayjs(mappedRows[i].date).format('YYYY-MM-DD');
        if (txDay <= endString) {
          lastInPeriod = mappedRows[i];
        } else {
          break;
        }
      }
      if (lastInPeriod) return lastInPeriod.balance;
      return opening;
    }
    
    return mappedRows[mappedRows.length - 1].balance;
  }, [mappedRows, dateRange, opening]);

  // Toạ độ cho biểu đồ
  const { chartPoints, balanceMin, balanceMax, zeroY } = useMemo(() => {
    const balances = rows.map((r) => r.balance);
    const min = Math.min(...balances);
    const max = Math.max(...balances);
    const span = max - min || 1;
    const n = rows.length;
    const usableX = 100 - CHART_PAD_X * 2;
    const usableY = 100 - CHART_PAD_Y * 2;
    const toY = (balance) => CHART_PAD_Y + (1 - (balance - min) / span) * usableY;
    const points = rows.map((r, i) => ({
      ...r,
      x: n === 1 ? 50 : CHART_PAD_X + (i / (n - 1)) * usableX,
      y: toY(r.balance),
      color: r.opening ? OPENING_HEX : TYPE_HEX[r.refType] ?? '#94a3b8',
    }));
    return {
      chartPoints: points,
      balanceMin: min,
      balanceMax: max,
      zeroY: min < 0 && max > 0 ? toY(0) : null,
    };
  }, [rows]);

  const linePath = useMemo(() => smoothLinePath(chartPoints), [chartPoints]);
  const areaPath = useMemo(() => {
    if (chartPoints.length === 0) return '';
    const first = chartPoints[0];
    const last = chartPoints[chartPoints.length - 1];
    return `${smoothLinePath(chartPoints)} L ${last.x},100 L ${first.x},100 Z`;
  }, [chartPoints]);
  const gradientId = useId();
  const hovered = hoverIndex !== null ? chartPoints[hoverIndex] : null;
  const lastPoint = chartPoints[chartPoints.length - 1];

  // Nhóm các loại refType có cùng chip style
  const chipColorMap = {};
  for (const rt of ALL_REF_TYPES) {
    chipColorMap[rt] = REF_TYPE_MAP[rt].color;
  }

  const isMobile = useIsMobile();

  if (!canViewInventory) return <AccessDenied />;

  return (
    <>
      <PageHeader
        title="Thẻ kho"
        subtitle={!isMobile ? 'Sổ cái biến động nhập – xuất với số dư chạy dồn' : undefined}
        breadcrumb={[{ title: 'Tồn kho & Báo cáo' }, { title: 'Thẻ kho' }]}
        extra={
          !isMobile && (
            <Select
              className="w-72"
              options={[{ value: null, label: 'Tất cả sản phẩm' }, ...productOptions]}
              value={effectiveProductId}
              onChange={(v) => setProductId(v)}
              showSearch
              optionFilterProp="label"
              placeholder="Tất cả sản phẩm"
            />
          )
        }
      />

      {isMobile && (
        <Select
          className="w-full mb-3"
          options={[{ value: null, label: 'Tất cả sản phẩm' }, ...productOptions]}
          value={effectiveProductId}
          onChange={(v) => setProductId(v)}
          showSearch
          optionFilterProp="label"
          placeholder="Tất cả sản phẩm"
          size="large"
        />
      )}

      {isError && (
        <Alert className="mb-4" type="error" showIcon message="Không tải được dữ liệu thẻ kho" description={getErrorMessage(error)} />
      )}

      {isLoading ? (
        <div className="flex justify-center py-20"><Spin size="large" /></div>
      ) : (
        <>
          <div className={`mb-4 grid gap-3 ${isMobile ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-4 gap-4'}`}>
            {!isMobile && (
              <StatCard
                title="Sản phẩm"
                value={
                  <Tooltip title={selectedProduct?.name || 'Tất cả sản phẩm'}>
                    <span className="line-clamp-2 block text-base font-bold leading-snug text-ink">
                      {selectedProduct?.name || 'Tất cả sản phẩm'}
                    </span>
                  </Tooltip>
                }
                icon={<AppstoreOutlined />}
                tone="blue"
                compact
              />
            )}
            {effectiveProductId && (
              <StatCard title="Đầu kỳ" value={formatNumber(opening)} icon={<InboxOutlined />} tone="blue" compact />
            )}
            <StatCard title="Biến động" value={formatNumber(filteredRows.length)} suffix="dòng" icon={<SwapOutlined />} tone="blue" compact />
            {effectiveProductId && (
              <StatCard
                title="Cuối kỳ"
                value={formatNumber(closing)}
                icon={<WalletOutlined />}
                tone={closing < 0 ? 'red' : 'green'}
                cardTone={closing < 0 ? 'red' : undefined}
                compact
              />
            )}
          </div>

          <FilterBar>
            <Input
              allowClear
              prefix={<SearchOutlined className="text-slate-400" />}
              placeholder="Tìm mã chứng từ..."
              className="w-full sm:min-w-[200px] sm:max-w-[300px] sm:flex-1"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            {!isMobile && (
              <DateRangeSelectGroup
                className="w-full sm:w-auto"
                value={dateRange}
                onChange={(dates) => setDateRange(dates?.[0] && dates?.[1] ? dates : null)}
              />
            )}
            <div className="flex flex-wrap items-center gap-1.5">
              {ALL_REF_TYPES.map((rt) => {
                const active = selectedTypes.includes(rt);
                const color = chipColorMap[rt];
                return (
                  <button
                    key={rt}
                    type="button"
                    onClick={() =>
                      setSelectedTypes((prev) => (active ? prev.filter((x) => x !== rt) : [...prev, rt]))
                    }
                    className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                      active ? TYPE_CHIP_ACTIVE_CLASS[color] : 'border-slate-300 bg-white text-ink-sub'
                    }`}
                  >
                    {REF_TYPE_MAP[rt].label}
                  </button>
                );
              })}
            </div>
          </FilterBar>
          {isMobile && (
            <div className="mb-3">
              <DateRangeSelectGroup
                className="w-full"
                value={dateRange}
                onChange={(dates) => setDateRange(dates?.[0] && dates?.[1] ? dates : null)}
              />
            </div>
          )}

          <FadeSection dataKey={rows.map((r) => r.key).join(',')}>
            {/* Biểu đồ số dư */}
            {effectiveProductId && (
              <div className="mb-4 rounded-2xl border border-hair bg-surface p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="m-0 text-sm font-semibold text-ink">Số dư tồn kho theo thời gian</h3>
                <span className="rounded-full bg-tint px-3 py-1 text-xs font-semibold text-royal">
                  Hiện tại: {formatNumber(lastPoint?.balance ?? 0)}
                </span>
              </div>

              <div className={`flex ${isMobile ? 'h-40' : 'h-60'}`} onMouseLeave={() => setHoverIndex(null)} onTouchEnd={() => setHoverIndex(null)}>
                <div className="relative w-16 shrink-0 pr-2">
                  <span className="absolute right-2 -translate-y-1/2 text-[11px] font-medium text-ink-sub" style={{ top: `${CHART_PAD_Y}%` }}>
                    {formatNumber(balanceMax)}
                  </span>
                  {zeroY !== null && (
                    <span className="absolute right-2 -translate-y-1/2 text-[11px] text-ink-sub/70" style={{ top: `${zeroY}%` }}>
                      0
                    </span>
                  )}
                  <span className="absolute right-2 -translate-y-1/2 text-[11px] font-medium text-ink-sub" style={{ top: `${100 - CHART_PAD_Y}%` }}>
                    {formatNumber(balanceMin)}
                  </span>
                </div>

                <div className="relative flex-1">
                  <div className="absolute inset-x-0 border-t border-dashed border-hair" style={{ top: `${CHART_PAD_Y}%` }} />
                  <div className="absolute inset-x-0 border-t border-dashed border-hair" style={{ top: `${100 - CHART_PAD_Y}%` }} />
                  {zeroY !== null && (
                    <div className="absolute inset-x-0 border-t border-dashed border-slate-300" style={{ top: `${zeroY}%` }} />
                  )}

                  <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#1e5af0" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#1e5af0" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
                    <path
                      d={linePath}
                      fill="none"
                      stroke="#1e5af0"
                      strokeWidth="2.2"
                      vectorEffect="non-scaling-stroke"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      style={{ filter: 'drop-shadow(0 3px 4px rgba(30, 90, 240, 0.25))' }}
                    />
                  </svg>

                  {chartPoints.map((p, i) => (
                    <span
                      key={p.key}
                      className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full border-2 border-white shadow-sm transition-all"
                      style={{
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        backgroundColor: p.color,
                        width: hoverIndex === i ? 13 : isMobile ? 10 : 8,
                        height: hoverIndex === i ? 13 : isMobile ? 10 : 8,
                      }}
                      onMouseEnter={() => setHoverIndex(i)}
                      onTouchStart={() => setHoverIndex(i)}
                    />
                  ))}

                  {lastPoint && (
                    <motion.span
                      className="pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
                      style={{ left: `${lastPoint.x}%`, top: `${lastPoint.y}%`, backgroundColor: lastPoint.color }}
                      initial={{ opacity: 0.55, scale: 1 }}
                      animate={{ opacity: 0, scale: 2.4 }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
                    />
                  )}

                  {hovered && (
                    <motion.div
                      className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg border border-hair bg-white px-3 py-2 text-xs shadow-lg"
                      initial={false}
                      animate={{ left: `${hovered.x}%`, top: `${Math.max(hovered.y, 12)}%` }}
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    >
                      <p className="m-0 mb-1 font-semibold text-ink">
                        {hovered.opening ? 'Số dư đầu kỳ' : `${formatDate(hovered.date)} · ${hovered.type}`}
                      </p>
                      {!hovered.opening && <p className="m-0 mb-1 text-ink-sub">{hovered.refCode} — {hovered.note}</p>}
                      <p className="m-0 font-semibold text-navy-700">Số dư: {formatNumber(hovered.balance)}</p>
                      <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-white" />
                    </motion.div>
                  )}
                </div>
              </div>

              <div className="mt-2 flex justify-between pl-16 text-[11px] text-ink-sub">
                <span>{formatDate(filteredRows[0]?.date ?? '')}</span>
                <span>{formatDate(chartPoints[chartPoints.length - 1]?.date ?? '')}</span>
              </div>
              </div>
            )}

            {/* Dòng thời gian biến động */}
            <div className="rounded-2xl border border-hair bg-surface p-5">
              <h3 className="m-0 mb-4 text-sm font-semibold text-ink">Lịch sử biến động ({filteredRows.length})</h3>
              <div className="relative">
                <div className="absolute bottom-2 left-[15px] top-2 w-px bg-hair" />
                <StaggerList as="ul" className="m-0 flex list-none flex-col gap-0 p-0">
                  {rows.map((r) => (
                    <StaggerItem key={r.key} as="li" className="relative flex gap-4 py-3">
                      <span className="relative z-10 mt-1 flex h-8 w-8 shrink-0 items-center justify-center">
                        <span
                          className="h-3 w-3 rounded-full border-2 border-white shadow-sm"
                          style={{ backgroundColor: r.opening ? OPENING_HEX : TYPE_HEX[r.refType] ?? '#94a3b8' }}
                        />
                      </span>
                      {r.opening ? (
                        <div className="flex flex-1 flex-wrap items-center justify-between gap-2">
                          <div>
                            <span className="font-semibold text-ink">Số dư đầu kỳ</span>
                            <div className="mt-0.5 text-sm text-ink-sub">Tồn kho mang sang</div>
                          </div>
                          <span className="mono shrink-0 font-bold text-navy-700">{formatNumber(r.balance)}</span>
                        </div>
                      ) : (
                        <div className="flex flex-1 flex-wrap items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="mono text-xs text-ink-sub">{formatDate(r.date)}</span>
                              <Tag bordered={false} color={r.typeColor} className="!m-0">{r.type}</Tag>
                              {REF_TYPE_PATH[r.refType] && r.refId ? (
                                <button
                                  type="button"
                                  onClick={() => setPreviewDoc({ type: r.refType, id: r.refId })}
                                  className="cursor-pointer border-none bg-transparent p-0 transition-opacity hover:opacity-80"
                                  title="Xem chi tiết phiếu"
                                >
                                  <DocCode>{r.refCode}</DocCode>
                                </button>
                              ) : (
                                <DocCode>{r.refCode}</DocCode>
                              )}
                              <button
                                type="button"
                                className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md border-none bg-transparent text-slate-400 transition-colors hover:bg-tint hover:text-royal"
                                onClick={() => setDetailTx(r)}
                                title="Xem chi tiết"
                              >
                                <EyeOutlined />
                              </button>
                            </div>
                            <div className="mt-1 text-sm text-ink-sub">{r.note}</div>
                          </div>
                          <div className="shrink-0 text-right">
                            {r.inQty > 0 && <div className="mono font-semibold text-ok">+{formatNumber(r.inQty)}</div>}
                            {r.outQty > 0 && <div className="mono font-semibold text-danger">-{formatNumber(r.outQty)}</div>}
                            <div className={`mono font-bold ${r.balance < 0 ? 'text-danger' : 'text-navy-700'}`}>
                              {formatNumber(r.balance)}
                            </div>
                          </div>
                        </div>
                      )}
                    </StaggerItem>
                  ))}
                </StaggerList>
                {filteredRows.length === 0 && <TableEmptyState message="Không tìm thấy biến động phù hợp" />}
              </div>
            </div>
          </FadeSection>
        </>
      )}
      {/* Modal chi tiết biến động */}
      <Modal
        title="Chi tiết biến động thẻ kho"
        open={!!detailTx}
        onCancel={() => setDetailTx(null)}
        footer={null}
        width={600}
      >
        {detailTx && (
          <Descriptions column={1} bordered size="small" className="mt-4">
            <Descriptions.Item label="Sản phẩm">
              <span className="font-semibold">{detailTx.raw.productCode}</span> - {detailTx.raw.productName}
            </Descriptions.Item>
            <Descriptions.Item label="Thời gian">
              {dayjs(detailTx.raw.performedAt).format('DD/MM/YYYY HH:mm:ss')}
            </Descriptions.Item>
            <Descriptions.Item label="Loại biến động">
              <Tag bordered={false} color={detailTx.typeColor}>{detailTx.type}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Mã chứng từ">
              {REF_TYPE_PATH[detailTx.refType] && detailTx.refId ? (
                <button
                  type="button"
                  onClick={() => setPreviewDoc({ type: detailTx.refType, id: detailTx.refId })}
                  className="cursor-pointer border-none bg-transparent p-0 text-royal hover:underline"
                >
                  {detailTx.refCode}
                </button>
              ) : (
                detailTx.refCode
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Số lượng thay đổi">
              {detailTx.inQty > 0 ? (
                <span className="text-ok font-semibold">+{formatNumber(detailTx.inQty)}</span>
              ) : detailTx.outQty > 0 ? (
                <span className="text-danger font-semibold">-{formatNumber(detailTx.outQty)}</span>
              ) : '0'}
            </Descriptions.Item>
            <Descriptions.Item label="Số dư sau biến động">
              <span className="font-bold text-navy-700">{formatNumber(detailTx.balance)}</span>
            </Descriptions.Item>
            <Descriptions.Item label="Số lô">
              {detailTx.raw.lotCode || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Vị trí">
              {detailTx.raw.locationCode || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Người thực hiện">
              {detailTx.raw.performedBy || '-'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      <VoucherPreviewModal
        open={!!previewDoc}
        voucher={previewVoucher}
        onClose={() => setPreviewDoc(null)}
      />
    </>
  );
}
