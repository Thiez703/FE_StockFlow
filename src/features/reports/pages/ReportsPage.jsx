import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DatePicker, Button, Input, Tabs, Alert, App, Spin } from 'antd';
import {
  FileExcelOutlined,
  SearchOutlined,
  ImportOutlined,
  ExportOutlined,
  WalletOutlined,
  SwapOutlined,
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
import { getErrorMessage } from '@/utils/getErrorMessage';
import { formatNumber, formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/date';

import DateRangeSelectGroup from '@/components/ui/DateRangeSelectGroup';

const DEFAULT_FROM = dayjs().subtract(1, 'month');
const DEFAULT_TO = dayjs();
const BIG_PAGE = { page: 0, size: 500 };

function toISO(d) {
  return d?.toISOString?.() ?? d;
}

export default function ReportsPage() {
  const { message } = App.useApp();
  const { canViewReports } = usePermissions();
  const [range, setRange] = useState([DEFAULT_FROM, DEFAULT_TO]);
  const [varKeyword, setVarKeyword] = useState('');
  const [varPage, setVarPage] = useState(0);
  const [exporting, setExporting] = useState(false);
  const { sortableTitle } = useColumnSort(null, null);

  const from = toISO(range?.[0]?.startOf('day'));
  const to = toISO(range?.[1]?.endOf('day'));

  // NXT data
  const nxtQuery = useQuery({
    queryKey: ['reports', 'inventory-summary', from, to],
    queryFn: () => reportApi.getInventorySummary({ from, to, ...BIG_PAGE }),
    enabled: !!from && !!to,
  });
  // Variance data
  const varianceQuery = useQuery({
    queryKey: ['reports', 'stocktake-variance', from, to, varPage],
    queryFn: () => reportApi.getStocktakeVariance({ from, to, page: varPage, size: 20 }),
    enabled: !!from && !!to,
  });
  const varianceTotalElements = varianceQuery.data?.totalElements ?? 0;

  const nxtItems = useMemo(() => nxtQuery.data?.content ?? [], [nxtQuery.data?.content]);
  const varianceItems = useMemo(() => varianceQuery.data?.content ?? [], [varianceQuery.data?.content]);

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

  // Filtered variance (client-side keyword)
  const filteredVariance = useMemo(() => {
    const kw = varKeyword.trim().toLowerCase();
    if (!kw) return varianceItems;
    return varianceItems.filter((r) =>
      [r.stocktakeCode, r.productName, r.productCode, r.lotCode].some(
        (v) => String(v ?? '').toLowerCase().includes(kw),
      ),
    );
  }, [varianceItems, varKeyword]);

  const isMobile = useIsMobile();

  if (!canViewReports) return <AccessDenied />;

  const handleRangeChange = (dates) => {
    if (dates?.[0] && dates?.[1]) {
      setRange(dates);
      setVarPage(0);
    }
  };

  const exportExcel = async () => {
    if (!from || !to) {
      message.warning('Vui lòng chọn khoảng thời gian trước khi xuất.');
      return;
    }
    setExporting(true);
    try {
      const res = await reportApi.exportInventorySummary({ from, to });
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
    { title: 'Thực tế', dataIndex: 'actualQty', align: 'right', width: 70, render: (v) => <span className="mono">{formatNumber(v)}</span> },
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

                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                  <StatCard title="Tồn đầu kỳ" value={formatCurrency(aggregates.totalOpeningValue)} icon={<WalletOutlined />} tone="blue" compact />
                  <StatCard title="Tổng nhập" value={formatCurrency(aggregates.totalInboundValue)} icon={<ImportOutlined />} tone="green" compact />
                  <StatCard title="Tổng xuất" value={formatCurrency(aggregates.totalOutboundValue)} icon={<ExportOutlined />} tone="amber" compact />
                  <StatCard title="Tồn cuối kỳ" value={formatCurrency(aggregates.totalClosingValue)} icon={<WalletOutlined />} tone="blue" compact />
                </div>

                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                  <StatCard title="SL nhập" value={formatNumber(aggregates.totalInboundQty)} suffix="đơn vị" icon={<ImportOutlined />} tone="green" compact />
                  <StatCard title="SL xuất" value={formatNumber(aggregates.totalOutboundQty)} suffix="đơn vị" icon={<ExportOutlined />} tone="amber" compact />
                  <StatCard
                    title="Biến động ròng"
                    value={`${aggregates.netValue >= 0 ? '+' : ''}${formatCurrency(aggregates.netValue)}`}
                    icon={<SwapOutlined />}
                    tone={aggregates.netValue >= 0 ? 'green' : 'red'}
                    cardTone={aggregates.netValue < 0 ? 'red' : undefined}
                    compact
                  />
                  <StatCard title="SL tồn cuối" value={formatNumber(aggregates.totalClosingQty)} suffix="đơn vị" icon={<WalletOutlined />} tone="blue" compact />
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
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                  <StatCard title="Tổng nhập" value={formatCurrency(aggregates.totalInboundValue)} icon={<ImportOutlined />} tone="green" compact />
                  <StatCard title="Tổng xuất" value={formatCurrency(aggregates.totalOutboundValue)} icon={<ExportOutlined />} tone="amber" compact />
                  <StatCard
                    title="Biến động ròng"
                    value={`${aggregates.netValue >= 0 ? '+' : ''}${formatCurrency(aggregates.netValue)}`}
                    icon={<SwapOutlined />}
                    tone={aggregates.netValue >= 0 ? 'green' : 'red'}
                    compact
                  />
                  <StatCard title="Tồn cuối kỳ" value={formatCurrency(aggregates.totalClosingValue)} icon={<WalletOutlined />} tone="blue" compact />
                </div>

                <div>
                  <h3 className="mb-3 text-base font-semibold text-ink">
                    Bảng Nhập – Xuất – Tồn · {rangeLabel}
                  </h3>
                  <FadeSection dataKey={`nxt-${from}-${to}`}>
                    <DataTable
                      columns={nxtColumns}
                      dataSource={nxtItems.map((item, i) => ({ ...item, id: `${item.productId}-${item.lotId ?? i}` }))}
                      scroll={isMobile ? { x: 700 } : undefined}
                      locale={{ emptyText: <TableEmptyState message="Không có dữ liệu NXT trong kỳ" /> }}
                    />
                  </FadeSection>
                </div>
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

                <FadeSection dataKey={`var-${from}-${to}-${varPage}`}>
                  <DataTable
                    columns={varianceColumns}
                    dataSource={filteredVariance.map((item, i) => ({
                      ...item,
                      id: `${item.stocktakeId}-${item.productId}-${item.lotId}-${item.locationId ?? i}`,
                    }))}
                    scroll={isMobile ? { x: 600 } : undefined}
                    pagination={{
                      current: varPage + 1,
                      pageSize: 20,
                      total: varianceTotalElements,
                      onChange: (p) => setVarPage(p - 1),
                      simple: isMobile,
                    }}
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
