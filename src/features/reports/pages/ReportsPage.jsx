import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, Input, Tabs, Alert, App, Spin, Table } from 'antd';
import {
  FileExcelOutlined,
  SearchOutlined,
  ImportOutlined,
  ExportOutlined,
  WalletOutlined,
  AuditOutlined,
  DiffOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import PageHeader from '@/components/ui/PageHeader';
import FilterBar from '@/components/ui/FilterBar';
import { usePermissions } from '@/hooks/usePermissions';
import { useColumnSort } from '@/hooks/useColumnSort';
import { useIsMobile } from '@/hooks/useIsMobile';
import AccessDenied from '@/components/feedback/AccessDenied';
import DataTable from '@/components/ui/DataTable';
import DocCode from '@/components/ui/DocCode';
import TableEmptyState from '@/components/ui/TableEmptyState';
import FadeSection from '@/components/ui/FadeSection';
import StatCard from '@/features/dashboard/components/StatCard';
import { DiffValue } from '@/features/stocktakes/components/StocktakeItemsDetail';
import { reportApi } from '@/api/reports';
import { inboundApi } from '@/api/inbounds';
import { outboundApi } from '@/api/outbounds';
import { DEFAULT_WAREHOUSE_ID } from '@/constants/warehouse';
import { getErrorMessage } from '@/utils/getErrorMessage';
import { formatNumber, formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/date';
import { motion, AnimatePresence } from 'framer-motion';

import DateRangeSelectGroup from '@/components/ui/DateRangeSelectGroup';

const COLORS = ['#1e5af0', '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#64748b'];

// SVG Donut calculation
const getCoordinatesForPercent = (percent) => {
  const x = Math.cos(2 * Math.PI * percent);
  const y = Math.sin(2 * Math.PI * percent);
  return [x, y];
};

const getSmoothPath = (points) => {
  if (!points || points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x},${points[0].y}`;
  let path = `M ${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const curr = points[i];
    const next = points[i + 1];
    const cp1x = curr.x + (next.x - curr.x) / 2;
    const cp1y = curr.y;
    const cp2x = curr.x + (next.x - curr.x) / 2;
    const cp2y = next.y;
    path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${next.x},${next.y}`;
  }
  return path;
};

const DEFAULT_FROM = dayjs().subtract(1, 'month');
const DEFAULT_TO = dayjs();
const BIG_PAGE = { page: 0, size: 500 };

function toISO(d) {
  return d?.toISOString?.() ?? d;
}

const MetricCard = ({ title, value, qty, icon, gradientFrom, gradientTo }) => (
  <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradientFrom} ${gradientTo} p-5 text-white shadow-md transition-transform hover:-translate-y-1`}>
    <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white opacity-10 blur-xl"></div>
    <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-white opacity-10 blur-xl"></div>
    
    <div className="relative z-10 flex items-center justify-between mb-4">
      <span className="text-sm font-medium opacity-90">{title}</span>
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 text-lg backdrop-blur-sm shadow-inner">
        {icon}
      </div>
    </div>
    
    <div className="relative z-10 flex flex-col gap-1">
      <div className="font-mono text-2xl font-bold tracking-tight drop-shadow-sm">{formatCurrency(value)}</div>
      <div className="text-sm font-medium opacity-90 mt-1">
        Số lượng: <span className="font-bold">{formatNumber(qty)}</span> đ.vị
      </div>
    </div>
  </div>
);

export default function ReportsPage() {
  const [activeChartPoint, setActiveChartPoint] = useState(null);
  const { message } = App.useApp();
  const { canViewReports } = usePermissions();
  const [range, setRange] = useState([DEFAULT_FROM, DEFAULT_TO]);
  const [varKeyword, setVarKeyword] = useState('');
  const [nxtKeyword, setNxtKeyword] = useState('');
  const [exporting, setExporting] = useState(false);
  const { sortableTitle } = useColumnSort(null, null);

  const from = toISO(range?.[0]?.startOf('day'));
  const to = toISO(range?.[1]?.endOf('day'));

  // NXT data
  const nxtQuery = useQuery({
    queryKey: ['reports', 'inventory-summary', DEFAULT_WAREHOUSE_ID, from, to],
    queryFn: () => reportApi.getInventorySummary({ warehouseId: DEFAULT_WAREHOUSE_ID, from, to, ...BIG_PAGE }),
    enabled: !!from && !!to,
  });
  
  // Real transactions for Trend Chart
  const inboundsQuery = useQuery({
    queryKey: ['inbounds', DEFAULT_WAREHOUSE_ID, from, to],
    queryFn: () => inboundApi.getAll({ warehouseId: DEFAULT_WAREHOUSE_ID, from, to, size: 500 }),
    enabled: !!from && !!to,
  });
  
  const outboundsQuery = useQuery({
    queryKey: ['outbounds', DEFAULT_WAREHOUSE_ID, from, to],
    queryFn: () => outboundApi.getAll(DEFAULT_WAREHOUSE_ID, { from, to, size: 500 }),
    enabled: !!from && !!to,
  });

  // Variance data
  const varianceQuery = useQuery({
    queryKey: ['reports', 'stocktake-variance', DEFAULT_WAREHOUSE_ID, from, to],
    queryFn: () => reportApi.getStocktakeVariance({ warehouseId: DEFAULT_WAREHOUSE_ID, from, to, ...BIG_PAGE }),
    enabled: !!from && !!to,
  });
  const nxtItems = useMemo(() => {
    let d = nxtQuery.data;
    if (d?.data) d = d.data;
    if (Array.isArray(d)) return d;
    if (d?.content && Array.isArray(d.content)) return d.content;
    if (d?.rows && Array.isArray(d.rows)) return d.rows;
    return [];
  }, [nxtQuery.data]);

  const varianceItems = useMemo(() => {
    let d = varianceQuery.data;
    if (d?.data) d = d.data;
    if (Array.isArray(d)) return d;
    if (d?.content && Array.isArray(d.content)) return d.content;
    if (d?.rows && Array.isArray(d.rows)) return d.rows;
    return [];
  }, [varianceQuery.data]);

  const varianceTotalElements = useMemo(() => {
    let d = varianceQuery.data;
    if (d?.data) d = d.data;
    if (d?.totalElements != null) return d.totalElements;
    if (Array.isArray(d)) return d.length;
    if (d?.content && Array.isArray(d.content)) return d.content.length;
    if (d?.rows && Array.isArray(d.rows)) return d.rows.length;
    return 0;
  }, [varianceQuery.data]);

  console.log('[ReportsPage] varianceData:', varianceQuery.data, 'extractedItems:', varianceItems.length);

  // Aggregates for overview
  const aggregates = useMemo(() => {
    let totalOpeningQty = 0, totalOpeningValue = 0;
    let totalInboundQty = 0, totalInboundValue = 0;
    let totalOutboundQty = 0, totalOutboundValue = 0;
    let totalClosingQty = 0, totalClosingValue = 0;
    for (const item of nxtItems) {
      totalOpeningQty += item.openingQty ?? 0;
      totalOpeningValue += item.openingValue ?? 0;
      totalInboundQty += item.inboundQty ?? 0;
      totalInboundValue += item.inboundValue ?? 0;
      totalOutboundQty += item.outboundQty ?? 0;
      totalOutboundValue += item.outboundValue ?? 0;
      totalClosingQty += item.closingQty ?? 0;
      totalClosingValue += item.closingValue ?? 0;
    }
    const netValue = totalInboundValue - totalOutboundValue;
    return {
      totalOpeningQty, totalOpeningValue,
      totalInboundQty, totalInboundValue,
      totalOutboundQty, totalOutboundValue,
      totalClosingQty, totalClosingValue,
      netValue,
      productCount: new Set(nxtItems.map((i) => i.productId)).size,
    };
  }, [nxtItems]);

  // Variance aggregates
  const varianceAgg = useMemo(() => {
    const totalDiff = varianceItems.reduce((s, r) => s + (r.diffQty ?? 0), 0);
    const withDiff = varianceItems.filter((r) => (r.diffQty ?? 0) !== 0).length;
    const matched = varianceItems.length - withDiff;
    return { totalDiff, withDiff, matched };
  }, [varianceItems]);

  // Filtered variance (client-side keyword & diffQty !== 0)
  const filteredVariance = useMemo(() => {
    const kw = varKeyword.trim().toLowerCase();
    // Chỉ lấy những dòng có chênh lệch
    const withDiffItems = varianceItems.filter((r) => (r.diffQty ?? 0) !== 0);

    if (!kw) return withDiffItems;
    return withDiffItems.filter((r) =>
      [r.stocktakeCode, r.productName, r.productCode, r.lotCode].some(
        (v) => String(v ?? '').toLowerCase().includes(kw),
      ),
    );
  }, [varianceItems, varKeyword]);

  // Filtered NXT
  const filteredNxtItems = useMemo(() => {
    const kw = nxtKeyword.trim().toLowerCase();
    if (!kw) return nxtItems;
    return nxtItems.filter((r) =>
      [r.productName, r.productCode, r.lotCode].some(
        (v) => String(v ?? '').toLowerCase().includes(kw),
      ),
    );
  }, [nxtItems, nxtKeyword]);

  // Chart data
  const chartData = useMemo(() => {
    // 1. Donut Chart Data: Top 5 products by closingValue
    const sortedByValue = [...nxtItems].sort((a, b) => (b.closingValue ?? 0) - (a.closingValue ?? 0));
    const top5Value = sortedByValue.slice(0, 5).map(item => ({
      name: item.productName || item.productCode,
      value: item.closingValue ?? 0,
    }));
    const othersValue = sortedByValue.slice(5).reduce((sum, item) => sum + (item.closingValue ?? 0), 0);
    if (othersValue > 0) {
      top5Value.push({ name: 'Khác', value: othersValue });
    }

    const totalValue = top5Value.reduce((sum, item) => sum + item.value, 0) || 1;
    const donutData = top5Value.reduce((acc, item, index) => {
      const percentage = (item.value / totalValue) * 100;
      const angle = (percentage / 100) * 360;
      const startAngle = acc.currentAngle;
      acc.currentAngle += angle;
      acc.data.push({
        ...item,
        percentage,
        startAngle,
        endAngle: acc.currentAngle,
        color: COLORS[index % COLORS.length]
      });
      return acc;
    }, { currentAngle: 0, data: [] }).data;

    // 2. Bar Chart Data: Top 5 products by total movement
    const sortedByMovement = [...nxtItems].sort((a, b) => 
      ((b.inboundValue ?? 0) + (b.outboundValue ?? 0)) - ((a.inboundValue ?? 0) + (a.outboundValue ?? 0))
    );
    const barData = sortedByMovement.slice(0, 5).map(item => ({
      name: item.productName || item.productCode,
      inbound: item.inboundValue ?? 0,
      outbound: item.outboundValue ?? 0,
    }));

    return { donutData, barData, totalClosingValue: totalValue };
  }, [nxtItems]);

  const varianceChartData = useMemo(() => {
    let matched = 0, short = 0, over = 0;
    varianceItems.forEach(item => {
      const diff = item.diffQty ?? 0;
      if (diff === 0) matched++;
      else if (diff < 0) short++;
      else over++;
    });

    const total = matched + short + over || 1;
    
    const summaryData = [
      { name: 'Khớp', value: matched, color: '#10b981' }, 
      { name: 'Thiếu hụt', value: short, color: '#ef4444' }, 
      { name: 'Dư thừa', value: over, color: '#f59e0b' }
    ].filter(d => d.value > 0);

    const donutData = summaryData.reduce((acc, item) => {
      const percentage = (item.value / total) * 100;
      const angle = (percentage / 100) * 360;
      const startAngle = acc.currentAngle;
      acc.currentAngle += angle;
      acc.data.push({
        ...item,
        percentage,
        startAngle,
        endAngle: acc.currentAngle,
      });
      return acc;
    }, { currentAngle: 0, data: [] }).data;

    const prodDiffMap = {};
    varianceItems.forEach(item => {
      const name = item.productName || item.productCode || 'Unknown';
      if (!prodDiffMap[name]) {
        prodDiffMap[name] = { short: 0, over: 0 };
      }
      const diff = item.diffQty ?? 0;
      if (diff < 0) prodDiffMap[name].short += Math.abs(diff);
      else if (diff > 0) prodDiffMap[name].over += diff;
    });

    const sortedProds = Object.entries(prodDiffMap)
      .map(([name, diffs]) => ({ name, ...diffs, total: diffs.short + diffs.over }))
      .filter(p => p.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    return { donutData, barData: sortedProds, totalLines: total };
  }, [varianceItems]);

  const trendChartData = useMemo(() => {
    // 7 điểm cố định để giữ biểu đồ đẹp và dễ nhìn
    const pointsCount = 7;
    const startDay = dayjs(from);
    const endDay = dayjs(to);
    const daysDiff = endDay.diff(startDay, 'day') || 1;
    const step = daysDiff / (pointsCount - 1);
    
    const buckets = [];
    for (let i = 0; i < pointsCount; i++) {
      const bucketDate = startDay.add(step * i, 'day');
      buckets.push({
        label: bucketDate.format(daysDiff > 90 ? 'MM/YYYY' : 'DD/MM'),
        timestamp: bucketDate.valueOf(),
        inbound: 0,
        outbound: 0,
      });
    }

    const getBucketIndex = (t) => {
      const ms = dayjs(t).valueOf();
      const startMs = startDay.valueOf();
      const endMs = endDay.valueOf();
      if (ms < startMs || ms > endMs) return -1;
      if (endMs === startMs) return 0;
      
      const ratio = (ms - startMs) / (endMs - startMs);
      const idx = Math.round(ratio * (pointsCount - 1));
      return Math.min(Math.max(idx, 0), pointsCount - 1);
    };

    const inbounds = inboundsQuery.data?.content || [];
    inbounds.forEach(inb => {
      if (inb.status === 'VOIDED') return;
      const idx = getBucketIndex(inb.createdAt);
      if (idx !== -1) {
        const val = inb.details?.reduce((sum, d) => sum + (d.totalAmount || 0), 0) || 0;
        buckets[idx].inbound += val;
      }
    });

    const outboundsRaw = outboundsQuery.data;
    let outbounds = [];
    if (Array.isArray(outboundsRaw)) outbounds = outboundsRaw;
    else if (outboundsRaw?.content && Array.isArray(outboundsRaw.content)) outbounds = outboundsRaw.content;

    outbounds.forEach(out => {
      if (out.status === 'VOIDED') return;
      const idx = getBucketIndex(out.createdAt);
      if (idx !== -1) {
        const val = out.details?.reduce((sum, d) => sum + (d.totalAmount || 0), 0) || 0;
        buckets[idx].outbound += val;
      }
    });

    return buckets;
  }, [inboundsQuery.data, outboundsQuery.data, from, to]);

  const isMobile = useIsMobile();

  if (!canViewReports) return <AccessDenied />;

  const handleRangeChange = (dates) => {
    if (dates?.[0] && dates?.[1]) {
      setRange(dates);
    }
  };

  const exportExcel = async () => {
    if (!from || !to) {
      message.warning('Vui lòng chọn khoảng thời gian trước khi xuất.');
      return;
    }
    setExporting(true);
    try {
      const res = await reportApi.exportInventorySummary({ warehouseId: DEFAULT_WAREHOUSE_ID, from, to });
      const blob = new Blob([res.data], {
        type: res.headers['content-type'] || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const fromLabel = range[0].format('DDMMYYYY');
      const toLabel = range[1].format('DDMMYYYY');
      a.href = url;
      a.download = `Bao-cao-NXT_${fromLabel}-${toLabel}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      message.success('Đã tải xuống file Excel.');
    } catch (err) {
      message.error(getErrorMessage(err, 'Không thể xuất file Excel.'));
    } finally {
      setExporting(false);
    }
  };

  const nxtColumns = [
    { title: 'Mã SP', dataIndex: 'productCode', width: 100, fixed: isMobile ? 'left' : undefined, render: (c) => <DocCode>{c}</DocCode> },
    { title: 'Sản phẩm', dataIndex: 'productName', width: isMobile ? 140 : undefined, render: (v) => <span className="font-medium text-ink">{v}</span> },
    { title: 'Lô', dataIndex: 'lotCode', width: 110, render: (v) => <span className="mono text-ink-sub">{v}</span> },
    ...(!isMobile ? [{ title: 'ĐVT', dataIndex: 'unit', width: 70, render: (v) => <span className="text-ink-sub">{v}</span> }] : []),
    { title: 'Tồn đầu', dataIndex: 'openingQty', align: 'right', width: 80, render: (v) => <span className="mono">{formatNumber(v)}</span> },
    { title: 'Nhập', dataIndex: 'inboundQty', align: 'right', width: 70, render: (v) => <span className="mono text-[#15803d]">{formatNumber(v)}</span> },
    { title: 'Xuất', dataIndex: 'outboundQty', align: 'right', width: 70, render: (v) => <span className="mono text-[#b45309]">{formatNumber(v)}</span> },
    { title: 'Tồn cuối', dataIndex: 'closingQty', align: 'right', width: 80, render: (v) => <span className="mono font-semibold text-navy-700">{formatNumber(v)}</span> },
    ...(!isMobile ? [{ title: 'GT tồn cuối', dataIndex: 'closingValue', align: 'right', width: 120, render: (v) => <span className="mono font-semibold text-ink">{formatCurrency(v)}</span> }] : []),
  ];

  const varianceColumns = [
    { title: 'Mã BB', dataIndex: 'stocktakeCode', width: 120, fixed: isMobile ? 'left' : undefined, render: (c) => <DocCode>{c}</DocCode> },
    ...(!isMobile ? [{
      title: sortableTitle('Ngày duyệt', 'approvedAt'),
      dataIndex: 'approvedAt',
      align: 'center',
      width: 120,
      render: (d) => <span className="mono text-ink-sub">{d ? formatDate(d) : '—'}</span>,
    }] : []),
    { title: 'Sản phẩm', dataIndex: 'productName', width: isMobile ? 130 : undefined, render: (v) => <span className="font-medium text-ink">{v}</span> },
    { title: 'Lô', dataIndex: 'lotCode', width: 100, render: (v) => <span className="mono text-ink-sub">{v}</span> },
    ...(!isMobile ? [{ title: 'Vị trí', dataIndex: 'locationCode', width: 100, render: (v) => <span className="mono text-ink-sub">{v}</span> }] : []),
    { title: 'Sổ sách', dataIndex: 'systemQty', align: 'right', width: 70, render: (v) => <span className="mono">{formatNumber(v)}</span> },
    { title: 'Thực tế', dataIndex: 'actualQty', align: 'right', width: 70, render: (v) => <span className="mono">{v == null ? '—' : formatNumber(v)}</span> },
    {
      title: sortableTitle('CL', 'diffQty'),
      dataIndex: 'diffQty',
      align: 'right',
      width: 80,
      render: (v) => <DiffValue value={v} />,
    },
  ];

  const isLoading = nxtQuery.isLoading;
  const isError = nxtQuery.isError || varianceQuery.isError;
  const errorMsg = getErrorMessage(nxtQuery.error || varianceQuery.error);

  const rangeLabel = `${range[0].format('DD/MM/YYYY')} – ${range[1].format('DD/MM/YYYY')}`;

  return (
    <>
      <PageHeader
        title="Báo cáo"
        subtitle="Nhập – Xuất – Tồn theo kỳ và chênh lệch kiểm kê"
        breadcrumb={[{ title: 'Tồn kho & Báo cáo' }, { title: 'Báo cáo' }]}
        extra={
          !isMobile && (
            <div className="flex items-center gap-3">
              <DateRangeSelectGroup
                value={range}
                onChange={handleRangeChange}
              />
              <Button icon={<FileExcelOutlined />} onClick={exportExcel} loading={exporting}>
                Xuất Excel
              </Button>
            </div>
          )
        }
      />

      {isMobile && (
        <div className="mb-4 flex flex-col gap-2">
          <DateRangeSelectGroup
            value={range}
            onChange={handleRangeChange}
            className="w-full"
          />
          <Button icon={<FileExcelOutlined />} onClick={exportExcel} loading={exporting} block>
            Xuất Excel
          </Button>
        </div>
      )}

      {isError && (
        <Alert className="mb-4" type="error" showIcon message="Không tải được dữ liệu báo cáo" description={errorMsg} />
      )}

      <Tabs
        items={[
          {
            key: 'overview',
            label: 'Tổng quan',
            children: isLoading ? (
              <div className="flex justify-center py-20"><Spin size="large" /></div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="rounded-xl border border-hair bg-slate-50 px-4 py-3 text-sm text-ink-sub">
                  Kỳ báo cáo: <span className="font-semibold text-ink">{rangeLabel}</span>
                  {' · '}{aggregates.productCount} sản phẩm
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <MetricCard
                    title="Giá trị Tồn đầu kỳ"
                    value={aggregates.totalOpeningValue}
                    qty={aggregates.totalOpeningQty}
                    icon={<WalletOutlined />}
                    gradientFrom="from-slate-700"
                    gradientTo="to-slate-800"
                  />
                  <MetricCard
                    title="Tổng giá trị Nhập"
                    value={aggregates.totalInboundValue}
                    qty={aggregates.totalInboundQty}
                    icon={<ImportOutlined />}
                    gradientFrom="from-emerald-500"
                    gradientTo="to-teal-600"
                  />
                  <MetricCard
                    title="Tổng giá trị Xuất"
                    value={aggregates.totalOutboundValue}
                    qty={aggregates.totalOutboundQty}
                    icon={<ExportOutlined />}
                    gradientFrom="from-amber-500"
                    gradientTo="to-orange-600"
                  />
                  <MetricCard
                    title="Giá trị Tồn cuối kỳ"
                    value={aggregates.totalClosingValue}
                    qty={aggregates.totalClosingQty}
                    icon={<WalletOutlined />}
                    gradientFrom="from-blue-600"
                    gradientTo="to-indigo-700"
                  />
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 gap-6 mt-2 lg:grid-cols-2">
                  {/* Biểu đồ Cấu trúc Giá trị tồn kho */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col md:flex-row items-center gap-8"
                  >
                    <div className="flex-1 w-full">
                      <h3 className="mb-6 text-base font-semibold text-slate-800">Cơ cấu Giá trị tồn kho</h3>
                      <div className="flex flex-col gap-4">
                        {chartData.donutData.length === 0 ? (
                          <div className="text-sm text-slate-500">Chưa có dữ liệu</div>
                        ) : (
                          chartData.donutData.map((cat, i) => (
                            <div key={i} className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }}></div>
                                <span className="text-sm font-medium text-slate-700 max-w-[140px] truncate" title={cat.name}>{cat.name}</span>
                              </div>
                              <div className="flex items-center gap-4">
                                <span className="text-sm text-slate-500 font-mono">{formatCurrency(cat.value)}</span>
                                <span className="text-xs font-semibold w-10 text-right">{cat.percentage.toFixed(1)}%</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                    
                    <div className="relative w-56 h-56 flex-shrink-0">
                      <svg viewBox="-1 -1 2 2" className="w-full h-full transform -rotate-90">
                        {chartData.donutData.map((slice, i) => {
                          const startPercent = slice.startAngle / 360;
                          const endPercent = slice.endAngle / 360;
                          const [startX, startY] = getCoordinatesForPercent(startPercent);
                          const [endX, endY] = getCoordinatesForPercent(endPercent);
                          const largeArcFlag = endPercent - startPercent > 0.5 ? 1 : 0;
                          const pathData = [
                            `M ${startX} ${startY}`,
                            `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
                          ].join(' ');
                          
                          return (
                            <motion.path
                              key={i}
                              d={pathData}
                              fill="none"
                              stroke={slice.color}
                              strokeWidth="0.45"
                              initial={{ pathLength: 0 }}
                              animate={{ pathLength: 1 }}
                              transition={{ duration: 1.5, delay: 0.3 }}
                            />
                          );
                        })}
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center rounded-full">
                        <span className="text-xs text-slate-500">Tổng</span>
                        <span className="text-sm font-bold text-slate-800 tracking-tighter">
                          {formatNumber(chartData.totalClosingValue / 1000000)}M
                        </span>
                      </div>
                    </div>
                  </motion.div>

                  {/* Biểu đồ Top Sản phẩm Biến động */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col"
                  >
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-base font-semibold text-slate-800">Top 5 SP biến động (Giá trị)</h3>
                      <div className="flex space-x-4 text-sm">
                        <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-emerald-500 mr-2"></div> Nhập</div>
                        <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-amber-500 mr-2"></div> Xuất</div>
                      </div>
                    </div>
                    
                    <div className="relative h-64 mt-2 flex-1">
                      {/* Grid Lines */}
                      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8 text-slate-300 text-xs">
                        <div className="border-b border-slate-100 border-dashed w-full flex-1"></div>
                        <div className="border-b border-slate-100 border-dashed w-full flex-1"></div>
                        <div className="border-b border-slate-100 border-dashed w-full flex-1"></div>
                        <div className="border-b border-slate-200 w-full flex-1"></div>
                      </div>

                      <div className="absolute inset-0 flex items-end justify-between gap-4 pb-8 px-2">
                        {chartData.barData.length === 0 ? (
                           <div className="w-full text-center text-sm text-slate-400 mb-10">Không có dữ liệu</div>
                        ) : chartData.barData.map((d, i) => {
                          const maxVal = Math.max(...chartData.barData.map(m => Math.max(m.inbound, m.outbound))) || 1;
                          const inHeight = Math.max((d.inbound / maxVal) * 100, 0);
                          const outHeight = Math.max((d.outbound / maxVal) * 100, 0);
                          
                          return (
                            <div key={i} className="flex-1 flex flex-col items-center group z-10 h-full justify-end">
                              <div className="w-full flex justify-center items-end gap-1.5 h-full pb-1">
                                <motion.div 
                                  initial={{ height: 0 }}
                                  animate={{ height: `${inHeight}%` }}
                                  transition={{ duration: 1, delay: 0.4 + i * 0.1 }}
                                  className="w-full max-w-[28px] bg-emerald-500 rounded-t-sm relative min-h-[4px] cursor-pointer hover:bg-emerald-400 transition-colors shadow-sm"
                                >
                                  <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs py-1 px-2 rounded whitespace-nowrap z-20 pointer-events-none shadow-md">
                                    {formatCurrency(d.inbound)}
                                  </div>
                                </motion.div>
                                <motion.div 
                                  initial={{ height: 0 }}
                                  animate={{ height: `${outHeight}%` }}
                                  transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                                  className="w-full max-w-[28px] bg-amber-500 rounded-t-sm relative min-h-[4px] cursor-pointer hover:bg-amber-400 transition-colors shadow-sm"
                                >
                                  <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs py-1 px-2 rounded whitespace-nowrap z-20 pointer-events-none shadow-md">
                                    {formatCurrency(d.outbound)}
                                  </div>
                                </motion.div>
                              </div>
                              <div className="text-xs font-medium text-slate-500 mt-2 absolute -bottom-6 w-full text-center truncate px-1" title={d.name}>
                                {d.name.length > 10 ? d.name.substring(0, 10) + '...' : d.name}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            ),
          },
          {
            key: 'nxt',
            label: 'Nhập – Xuất – Tồn',
            children: isLoading ? (
              <div className="flex justify-center py-20"><Spin size="large" /></div>
            ) : (
              <div className="flex flex-col gap-4">
                {trendChartData.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm mb-2"
                  >
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h3 className="text-base font-semibold text-slate-800">Xu hướng Nhập - Xuất</h3>
                        <p className="text-xs text-slate-500 mt-1">Tổng giá trị giao dịch theo thời gian</p>
                      </div>
                      <div className="flex space-x-6 text-sm">
                        <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-emerald-500 mr-2"></div> Nhập</div>
                        <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-amber-500 mr-2"></div> Xuất</div>
                      </div>
                    </div>
                    
                    <div 
                      className="relative h-64 mt-4 w-full pl-12 pr-4"
                      onMouseLeave={() => setActiveChartPoint(null)}
                    >
                      {(() => {
                        const safeData = trendChartData;
                        const maxVal = Math.max(...safeData.map(d => Math.max(d.inbound, d.outbound))) || 1;
                        const n = Math.max(1, safeData.length - 1);
                        
                        const getPointCoord = (val, idx) => ({
                          x: (idx / n) * 100,
                          y: 100 - (val / maxVal) * 90
                        });

                        const inboundPoints = safeData.map((d, i) => getPointCoord(d.inbound, i));
                        const outboundPoints = safeData.map((d, i) => getPointCoord(d.outbound, i));

                        const inboundPath = getSmoothPath(inboundPoints);
                        const outboundPath = getSmoothPath(outboundPoints);
                        
                        const inboundAreaPath = `${inboundPath} L 100,100 L 0,100 Z`;
                        const outboundAreaPath = `${outboundPath} L 100,100 L 0,100 Z`;

                        return (
                          <>
                            {/* Grid Y */}
                            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-6 text-slate-400 text-xs pl-12 pr-4">
                              <div className="border-b border-slate-100 border-dashed w-full flex-1 relative"><span className="absolute -top-2 left-0 transform -translate-x-12 w-10 text-right">{formatNumber(maxVal / 1000000)}M</span></div>
                              <div className="border-b border-slate-100 border-dashed w-full flex-1 relative"><span className="absolute -top-2 left-0 transform -translate-x-12 w-10 text-right">{formatNumber((maxVal * 0.66) / 1000000)}M</span></div>
                              <div className="border-b border-slate-100 border-dashed w-full flex-1 relative"><span className="absolute -top-2 left-0 transform -translate-x-12 w-10 text-right">{formatNumber((maxVal * 0.33) / 1000000)}M</span></div>
                              <div className="border-b border-slate-200 w-full flex-1 relative"><span className="absolute -top-2 left-0 transform -translate-x-12 w-10 text-right">0</span></div>
                            </div>

                            {/* Chart SVG */}
                            <div className="absolute inset-0 pb-6 pl-12 pr-4">
                              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                                <defs>
                                  <linearGradient id="inboundGrad" x1="0" x2="0" y1="0" y2="1">
                                    <stop offset="0%" stopColor="rgba(16, 185, 129, 0.4)" />
                                    <stop offset="100%" stopColor="rgba(16, 185, 129, 0.0)" />
                                  </linearGradient>
                                  <linearGradient id="outboundGrad" x1="0" x2="0" y1="0" y2="1">
                                    <stop offset="0%" stopColor="rgba(245, 158, 11, 0.4)" />
                                    <stop offset="100%" stopColor="rgba(245, 158, 11, 0.0)" />
                                  </linearGradient>
                                </defs>
                                
                                <path d={inboundAreaPath} fill="url(#inboundGrad)" />
                                <path d={inboundPath} fill="none" stroke="#10b981" strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
                                
                                <path d={outboundAreaPath} fill="url(#outboundGrad)" />
                                <path d={outboundPath} fill="none" stroke="#f59e0b" strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />

                                {/* Invisible hover zones */}
                                {safeData.map((d, i) => {
                                  const x = (i / n) * 100;
                                  return (
                                    <rect 
                                      key={i}
                                      x={Math.max(0, x - (50/n))} 
                                      y="0" 
                                      width={100/n} 
                                      height="100" 
                                      fill="transparent"
                                      onMouseEnter={() => setActiveChartPoint({ index: i, data: d, x: x })}
                                      className="cursor-pointer outline-none"
                                    />
                                  );
                                })}

                                {/* Active Indicators */}
                                {activeChartPoint !== null && (
                                  <line 
                                    x1={activeChartPoint.x} y1="0" 
                                    x2={activeChartPoint.x} y2="100" 
                                    stroke="#cbd5e1" strokeWidth="1" strokeDasharray="4" vectorEffect="non-scaling-stroke" 
                                    className="pointer-events-none"
                                  />
                                )}
                              </svg>

                              {/* Perfect HTML Dots overlay */}
                              {activeChartPoint !== null && (
                                <div className="absolute inset-0 pb-6 pl-12 pr-4 pointer-events-none">
                                  <div className="relative w-full h-full">
                                    <div 
                                      className="absolute w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white shadow-sm transform -translate-x-1/2 -translate-y-1/2"
                                      style={{
                                        left: `${activeChartPoint.x}%`,
                                        top: `${100 - (activeChartPoint.data.inbound / maxVal) * 90}%`
                                      }}
                                    />
                                    <div 
                                      className="absolute w-2.5 h-2.5 rounded-full bg-amber-500 border-2 border-white shadow-sm transform -translate-x-1/2 -translate-y-1/2"
                                      style={{
                                        left: `${activeChartPoint.x}%`,
                                        top: `${100 - (activeChartPoint.data.outbound / maxVal) * 90}%`
                                      }}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            {/* X-axis labels */}
                            <div className="absolute bottom-0 left-12 right-4 flex justify-between">
                              {safeData.map((d, i) => (
                                 <div key={i} className="flex-1 flex justify-center text-center">
                                    <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap -ml-4" title={d.label}>
                                       {d.label}
                                    </span>
                                 </div>
                              ))}
                            </div>

                            {/* HTML Tooltip Overlay */}
                            <AnimatePresence>
                              {activeChartPoint !== null && (
                                <motion.div 
                                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                  transition={{ duration: 0.15 }}
                                  className="absolute top-0 z-50 bg-slate-800 text-white text-xs rounded-lg shadow-xl p-3 flex flex-col gap-1 w-max pointer-events-none border border-slate-700"
                                  style={{ 
                                    left: `calc(3rem + ${activeChartPoint.x}% - ${activeChartPoint.x > 50 ? 150 : -10}px)` 
                                  }}
                                >
                                  <div className="font-semibold border-b border-slate-600 pb-1.5 mb-1 text-slate-200">{activeChartPoint.data.label}</div>
                                  <div className="flex justify-between gap-6 items-center">
                                    <span className="text-emerald-400 flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>Nhập:</span> 
                                    <span className="font-mono font-medium">{formatCurrency(activeChartPoint.data.inbound)}</span>
                                  </div>
                                  <div className="flex justify-between gap-6 items-center">
                                    <span className="text-amber-400 flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div>Xuất:</span> 
                                    <span className="font-mono font-medium">{formatCurrency(activeChartPoint.data.outbound)}</span>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </>
                        );
                      })()}
                    </div>
                  </motion.div>
                )}

                <FilterBar extra={<span className="text-sm font-medium text-ink-sub">Kỳ báo cáo: {rangeLabel}</span>}>
                  <Input
                    allowClear
                    prefix={<SearchOutlined className="text-slate-400" />}
                    placeholder="Tìm mã SP, tên SP, số lô..."
                    className="w-full sm:w-64"
                    value={nxtKeyword}
                    onChange={(e) => setNxtKeyword(e.target.value)}
                  />
                </FilterBar>

                <FadeSection dataKey={`nxt-${from}-${to}`}>
                  <DataTable
                    columns={nxtColumns}
                    dataSource={filteredNxtItems.map((item, i) => ({ ...item, id: `${item.productId}-${item.lotId ?? i}` }))}
                    scroll={isMobile ? { x: 700 } : undefined}
                    pagination={{ pageSize: 20, simple: isMobile }}
                    locale={{ emptyText: <TableEmptyState message="Không có dữ liệu NXT trong kỳ" /> }}
                    summary={() => {
                      if (filteredNxtItems.length === 0) return null;
                      let tOpenQty = 0, tInQty = 0, tOutQty = 0, tCloseQty = 0, tCloseVal = 0;
                      filteredNxtItems.forEach(item => {
                        tOpenQty += item.openingQty || 0;
                        tInQty += item.inboundQty || 0;
                        tOutQty += item.outboundQty || 0;
                        tCloseQty += item.closingQty || 0;
                        tCloseVal += item.closingValue || 0;
                      });
                      return (
                        <Table.Summary fixed>
                          <Table.Summary.Row className="bg-slate-50">
                            <Table.Summary.Cell index={0} colSpan={isMobile ? 2 : 4} className="text-right font-semibold text-ink">Tổng cộng trang hiện tại:</Table.Summary.Cell>
                            <Table.Summary.Cell index={1} className="text-right font-mono font-semibold">{formatNumber(tOpenQty)}</Table.Summary.Cell>
                            <Table.Summary.Cell index={2} className="text-right font-mono font-semibold text-[#15803d]">{formatNumber(tInQty)}</Table.Summary.Cell>
                            <Table.Summary.Cell index={3} className="text-right font-mono font-semibold text-[#b45309]">{formatNumber(tOutQty)}</Table.Summary.Cell>
                            <Table.Summary.Cell index={4} className="text-right font-mono font-bold text-navy-700">{formatNumber(tCloseQty)}</Table.Summary.Cell>
                            {!isMobile && (
                              <Table.Summary.Cell index={5} className="text-right font-mono font-bold text-ink">{formatCurrency(tCloseVal)}</Table.Summary.Cell>
                            )}
                          </Table.Summary.Row>
                        </Table.Summary>
                      );
                    }}
                  />
                </FadeSection>
              </div>
            ),
          },
          {
            key: 'variance',
            label: 'Chênh lệch kiểm kê',
            children: varianceQuery.isLoading ? (
              <div className="flex justify-center py-20"><Spin size="large" /></div>
            ) : (
              <div>
                <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
                  <StatCard title="Tổng dòng" value={formatNumber(varianceTotalElements)} suffix="dòng" icon={<AuditOutlined />} tone="blue" compact />
                  <StatCard
                    title="Có chênh lệch"
                    value={formatNumber(varianceAgg.withDiff)}
                    suffix="dòng"
                    icon={<DiffOutlined />}
                    tone="amber"
                    cardTone="amber"
                    compact
                  />
                  <StatCard
                    title="Khớp tuyệt đối"
                    value={formatNumber(varianceAgg.matched)}
                    suffix="dòng"
                    icon={<AuditOutlined />}
                    tone="green"
                    compact
                  />
                  <StatCard
                    title="Tổng chênh lệch"
                    value={<DiffValue value={varianceAgg.totalDiff} />}
                    icon={<DiffOutlined />}
                    tone={varianceAgg.totalDiff < 0 ? 'red' : 'blue'}
                    cardTone={varianceAgg.totalDiff < 0 ? 'red' : undefined}
                    compact
                  />
                </div>

                {/* Variance Charts Grid */}
                <div className="grid grid-cols-1 gap-6 mb-6 lg:grid-cols-2">
                  {/* Biểu đồ Tỷ lệ chênh lệch */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col md:flex-row items-center gap-8"
                  >
                    <div className="flex-1 w-full">
                      <h3 className="mb-6 text-base font-semibold text-slate-800">Tỷ lệ Trạng thái kiểm kê</h3>
                      <div className="flex flex-col gap-4">
                        {varianceChartData.donutData.length === 0 ? (
                          <div className="text-sm text-slate-500">Chưa có dữ liệu</div>
                        ) : (
                          varianceChartData.donutData.map((cat, i) => (
                            <div key={i} className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }}></div>
                                <span className="text-sm font-medium text-slate-700">{cat.name}</span>
                              </div>
                              <div className="flex items-center gap-4">
                                <span className="text-sm text-slate-500 font-mono">{formatNumber(cat.value)}</span>
                                <span className="text-xs font-semibold w-10 text-right">{cat.percentage.toFixed(1)}%</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                    
                    <div className="relative w-48 h-48 flex-shrink-0">
                      <svg viewBox="-1 -1 2 2" className="w-full h-full transform -rotate-90">
                        {varianceChartData.donutData.map((slice, i) => {
                          const startPercent = slice.startAngle / 360;
                          const endPercent = slice.endAngle / 360;
                          const [startX, startY] = getCoordinatesForPercent(startPercent);
                          const [endX, endY] = getCoordinatesForPercent(endPercent);
                          const largeArcFlag = endPercent - startPercent > 0.5 ? 1 : 0;
                          const pathData = [
                            `M ${startX} ${startY}`,
                            `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
                          ].join(' ');
                          
                          return (
                            <motion.path
                              key={i}
                              d={pathData}
                              fill="none"
                              stroke={slice.color}
                              strokeWidth="0.5"
                              initial={{ pathLength: 0 }}
                              animate={{ pathLength: 1 }}
                              transition={{ duration: 1, delay: 0.2 }}
                            />
                          );
                        })}
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center rounded-full">
                        <span className="text-xs text-slate-500">Tổng dòng</span>
                        <span className="text-lg font-bold text-slate-800 tracking-tighter">
                          {formatNumber(varianceChartData.totalLines)}
                        </span>
                      </div>
                    </div>
                  </motion.div>

                  {/* Biểu đồ Top Sản phẩm chênh lệch */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col"
                  >
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-base font-semibold text-slate-800">Top 5 SP chênh lệch lớn nhất</h3>
                      <div className="flex space-x-4 text-sm">
                        <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div> Thiếu</div>
                        <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-amber-500 mr-2"></div> Thừa</div>
                      </div>
                    </div>
                    
                    <div className="relative h-48 mt-2 flex-1">
                      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8 text-slate-300 text-xs">
                        <div className="border-b border-slate-100 border-dashed w-full flex-1"></div>
                        <div className="border-b border-slate-100 border-dashed w-full flex-1"></div>
                        <div className="border-b border-slate-200 w-full flex-1"></div>
                      </div>

                      <div className="absolute inset-0 flex items-end justify-between gap-4 pb-8 px-2">
                        {varianceChartData.barData.length === 0 ? (
                           <div className="w-full text-center text-sm text-slate-400 mb-10">Không có dữ liệu chênh lệch</div>
                        ) : varianceChartData.barData.map((d, i) => {
                          const maxVal = Math.max(...varianceChartData.barData.map(m => Math.max(m.short, m.over))) || 1;
                          const shortHeight = Math.max((d.short / maxVal) * 100, 0);
                          const overHeight = Math.max((d.over / maxVal) * 100, 0);
                          
                          return (
                            <div key={i} className="flex-1 flex flex-col items-center group z-10 h-full justify-end">
                              <div className="w-full flex justify-center items-end gap-1.5 h-full pb-1">
                                <motion.div 
                                  initial={{ height: 0 }}
                                  animate={{ height: `${shortHeight}%` }}
                                  transition={{ duration: 0.8, delay: 0.3 + i * 0.1 }}
                                  className="w-full max-w-[24px] bg-red-500 rounded-t-sm relative min-h-[4px] cursor-pointer hover:bg-red-400 transition-colors shadow-sm"
                                >
                                  <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs py-1 px-2 rounded whitespace-nowrap z-20 pointer-events-none shadow-md">
                                    {formatNumber(d.short)}
                                  </div>
                                </motion.div>
                                <motion.div 
                                  initial={{ height: 0 }}
                                  animate={{ height: `${overHeight}%` }}
                                  transition={{ duration: 0.8, delay: 0.4 + i * 0.1 }}
                                  className="w-full max-w-[24px] bg-amber-500 rounded-t-sm relative min-h-[4px] cursor-pointer hover:bg-amber-400 transition-colors shadow-sm"
                                >
                                  <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs py-1 px-2 rounded whitespace-nowrap z-20 pointer-events-none shadow-md">
                                    {formatNumber(d.over)}
                                  </div>
                                </motion.div>
                              </div>
                              <div className="text-xs font-medium text-slate-500 mt-2 absolute -bottom-6 w-full text-center truncate px-1" title={d.name}>
                                {d.name.length > 10 ? d.name.substring(0, 10) + '...' : d.name}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                </div>

                <FilterBar extra={<span className="text-sm text-ink-sub">{filteredVariance.length} dòng</span>}>
                  <Input
                    allowClear
                    prefix={<SearchOutlined className="text-slate-400" />}
                    placeholder="Tìm mã biên bản, sản phẩm, lô..."
                    className="w-full sm:w-64"
                    value={varKeyword}
                    onChange={(e) => setVarKeyword(e.target.value)}
                  />
                </FilterBar>

                <FadeSection dataKey={`var-${from}-${to}`}>
                  <DataTable
                    columns={varianceColumns}
                    dataSource={filteredVariance.map((item, i) => ({
                      ...item,
                      id: `${item.stocktakeId}-${item.productId}-${item.lotId}-${item.locationId ?? i}`,
                    }))}
                    scroll={isMobile ? { x: 600 } : undefined}
                    pagination={{ pageSize: 20, simple: isMobile }}
                    locale={{ emptyText: <TableEmptyState message="Không có dữ liệu chênh lệch kiểm kê trong kỳ" /> }}
                  />
                </FadeSection>
              </div>
            ),
          },
        ]}
      />
    </>
  );
}
