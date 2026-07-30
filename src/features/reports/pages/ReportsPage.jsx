import { useEffect, useMemo, useRef, useState } from 'react';
import { DatePicker, Button, Input, Select, Segmented, Modal, Tabs, App } from 'antd';
import { FileExcelOutlined, SearchOutlined, ImportOutlined, ExportOutlined } from '@ant-design/icons';
import PageHeader from '@/components/ui/PageHeader';
import FilterBar from '@/components/ui/FilterBar';
import { usePermissions } from '@/hooks/usePermissions';
import { useColumnSort } from '@/hooks/useColumnSort';
import AccessDenied from '@/components/feedback/AccessDenied';
import DataTable from '@/components/ui/DataTable';
import DocCode from '@/components/ui/DocCode';
import StatusPill from '@/components/ui/StatusPill';
import TableEmptyState from '@/components/ui/TableEmptyState';
import FadeSection from '@/components/ui/FadeSection';
import DocDetailModal from '@/components/ui/DocDetailModal';
import InventoryTrendChart from '@/features/dashboard/components/InventoryTrendChart';
import StatCard from '@/features/dashboard/components/StatCard';
import StocktakeItemsDetail, { DiffValue } from '@/features/stocktakes/components/StocktakeItemsDetail';
import { TREND } from '@/mock/dashboard';
import { STOCKTAKES } from '@/mock/stocktakes';
import { INBOUNDS } from '@/mock/inbounds';
import { OUTBOUNDS } from '@/mock/outbounds';
import { statusOptions, APPROVAL_STATUSES } from '@/constants/status';
import { formatNumber, formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/date';

const { RangePicker } = DatePicker;

const totalDiff = (items) => items.reduce((s, it) => s + (it.countedQty - it.systemQty), 0);

// Nhóm phiếu nhập/xuất theo kỳ (tháng hoặc tuần) dựa trên field `date`, `total` sẵn có.
const getMonthKey = (date) => date.slice(0, 7); // 'YYYY-MM'
const getMonthLabel = (key) => {
  const [y, m] = key.split('-');
  return `Tháng ${Number(m)}/${y}`;
};

const getWeekStart = (date) => {
  const d = new Date(date);
  const diffToMonday = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - diffToMonday);
  return d;
};
const getWeekKey = (date) => getWeekStart(date).toISOString().slice(0, 10);
const getWeekLabel = (key) => {
  const monday = new Date(key);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return `Tuần ${formatDate(monday)} – ${formatDate(sunday)}`;
};

function groupDocsByPeriod(inbounds, outbounds, keyFn, labelFn) {
  const map = new Map();
  const ensure = (key) => {
    if (!map.has(key)) {
      map.set(key, { key, label: labelFn(key), inboundCount: 0, inboundTotal: 0, outboundCount: 0, outboundTotal: 0, docs: [] });
    }
    return map.get(key);
  };
  inbounds.forEach((doc) => {
    const g = ensure(keyFn(doc.date));
    g.inboundCount += 1;
    g.inboundTotal += doc.total;
    g.docs.push({ ...doc, kind: 'inbound', partner: doc.supplierName });
  });
  outbounds.forEach((doc) => {
    const g = ensure(keyFn(doc.date));
    g.outboundCount += 1;
    g.outboundTotal += doc.total;
    g.docs.push({ ...doc, kind: 'outbound', partner: doc.partnerName });
  });
  map.forEach((g) => g.docs.sort((a, b) => b.date.localeCompare(a.date)));
  return Array.from(map.values()).sort((a, b) => a.key.localeCompare(b.key));
}

const monthlyDocStats = groupDocsByPeriod(INBOUNDS, OUTBOUNDS, getMonthKey, getMonthLabel);
const weeklyDocStats = groupDocsByPeriod(INBOUNDS, OUTBOUNDS, getWeekKey, getWeekLabel);

const periodDocColumns = [
  { title: 'Mã phiếu', dataIndex: 'code', width: 120, render: (c) => <DocCode>{c}</DocCode> },
  { title: 'Ngày', dataIndex: 'date', align: 'center', width: 90, render: (d) => <span className="mono text-ink-sub">{formatDate(d)}</span> },
  { title: 'Đối tác', dataIndex: 'partner', render: (v) => <span className="text-ink-sub">{v}</span> },
  { title: 'Trạng thái', dataIndex: 'status', align: 'center', width: 100, render: (s) => <StatusPill status={s} /> },
  { title: 'Tổng tiền', dataIndex: 'total', align: 'right', width: 120, render: (v) => <span className="font-semibold text-ink">{formatCurrency(v)}</span> },
];

export default function ReportsPage() {
  const { message } = App.useApp();
  const { canViewReports } = usePermissions();
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState(null);
  const [range, setRange] = useState(null);
  const [detailRecord, setDetailRecord] = useState(null);
  const [periodMode, setPeriodMode] = useState('month');
  const [periodDetail, setPeriodDetail] = useState(null);
  const { sortableTitle, sortRows } = useColumnSort();

  const periodStats = periodMode === 'month' ? monthlyDocStats : weeklyDocStats;

  // AntD tự focus khung dialog khi mở, khiến trình duyệt cuộn window lên đầu trang
  // để đưa dialog vào tầm nhìn — khôi phục lại vị trí cuộn ngay sau đó để tránh giật.
  const periodScrollYRef = useRef(0);
  useEffect(() => {
    if (!periodDetail) return;
    periodScrollYRef.current = window.scrollY;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => window.scrollTo(0, periodScrollYRef.current));
    });
  }, [periodDetail]);

  const variance = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    const filtered = STOCKTAKES.filter((r) => {
      const okKw = !kw || r.code.toLowerCase().includes(kw);
      const okStatus = !status || r.status === status;
      const okDate = !range || (r.date >= range[0].format('YYYY-MM-DD') && r.date <= range[1].format('YYYY-MM-DD'));
      return okKw && okStatus && okDate;
    });
    const withDiff = filtered.map((r) => ({ ...r, diff: totalDiff(r.items) }));
    return sortRows(withDiff);
  }, [keyword, status, range, sortRows]);

  // FIX 5f — STAFF không được xem báo cáo.
  if (!canViewReports) return <AccessDenied />;

  const nxtColumns = [
    { title: 'Kỳ', dataIndex: 'label', render: (l) => <span className="font-medium text-ink">Tháng {l.replace('T', '')}</span> },
    { title: 'Nhập (tr.đ)', dataIndex: 'inbound', align: 'right', render: (v) => <span className="mono text-[#15803d]">{formatNumber(v)}</span> },
    { title: 'Xuất (tr.đ)', dataIndex: 'outbound', align: 'right', render: (v) => <span className="mono text-[#b45309]">{formatNumber(v)}</span> },
    { title: 'Tồn cuối (tr.đ)', dataIndex: 'stock', align: 'right', render: (v) => <span className="mono font-semibold text-navy-700">{formatNumber(v)}</span> },
  ];

  const varianceColumns = [
    { title: 'Mã phiếu', dataIndex: 'code', width: 150, render: (c) => <DocCode>{c}</DocCode> },
    {
      title: sortableTitle('Ngày', 'date'),
      dataIndex: 'date',
      align: 'center',
      width: 120,
      render: (d) => <span className="mono text-ink-sub">{formatDate(d)}</span>,
    },
    { title: 'Số dòng', dataIndex: 'items', align: 'center', width: 90, render: (i) => i.length },
    { title: 'Người kiểm', dataIndex: 'createdBy', width: 140, render: (v) => <span className="text-ink-sub">{v}</span> },
    {
      title: sortableTitle('Tổng chênh lệch', 'diff'),
      dataIndex: 'diff',
      align: 'right',
      width: 140,
      render: (diff) => <DiffValue value={diff} />,
    },
    { title: 'Trạng thái', dataIndex: 'status', align: 'center', width: 130, render: (s) => <StatusPill status={s} /> },
    {
      title: '',
      key: 'detail',
      align: 'center',
      width: 100,
      render: (_, r) =>
        r.items?.length > 0 && (
          <Button size="small" onClick={() => setDetailRecord(r)}>
            Chi tiết
          </Button>
        ),
    },
  ];

  const periodColumns = [
    { title: 'Kỳ', dataIndex: 'label', render: (l) => <span className="font-medium text-ink">{l}</span> },
    { title: 'Số phiếu nhập', dataIndex: 'inboundCount', align: 'center', render: (v) => <span className="mono text-[#15803d]">{v}</span> },
    { title: 'Số phiếu xuất', dataIndex: 'outboundCount', align: 'center', render: (v) => <span className="mono text-[#b45309]">{v}</span> },
    {
      title: '',
      key: 'detail',
      align: 'center',
      width: 100,
      render: (_, r) => (
        <Button size="small" onClick={() => setPeriodDetail(r)}>
          Chi tiết
        </Button>
      ),
    },
  ];

  const exportExcel = () => message.info('Tính năng xuất Excel chỉ khả dụng trong bản đầy đủ.');

  return (
    <>
      <PageHeader
        title="Báo cáo"
        subtitle="Nhập – Xuất – Tồn theo kỳ và chênh lệch kiểm kê"
        breadcrumb={[{ title: 'Tồn kho & Báo cáo' }, { title: 'Báo cáo' }]}
        extra={
          canViewReports && (
            <Button icon={<FileExcelOutlined />} onClick={exportExcel}>
              Xuất Excel
            </Button>
          )
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard
          title="Tổng phiếu nhập"
          value={formatNumber(INBOUNDS.length)}
          suffix="phiếu"
          icon={<ImportOutlined />}
          tone="green"
          hint="Toàn bộ phiếu nhập hiện có"
        />
        <StatCard
          title="Tổng phiếu xuất"
          value={formatNumber(OUTBOUNDS.length)}
          suffix="phiếu"
          icon={<ExportOutlined />}
          tone="amber"
          hint="Toàn bộ phiếu xuất hiện có"
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <InventoryTrendChart />
        <div>
          <h3 className="mb-3 text-base font-semibold text-ink">Bảng Nhập – Xuất – Tồn</h3>
          <FadeSection dataKey={TREND.map((t) => t.label).join(',')}>
            <DataTable columns={nxtColumns} dataSource={TREND.map((t, i) => ({ id: i, ...t }))} pagination={false} />
          </FadeSection>
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h3 className="m-0 text-base font-semibold text-ink">Phiếu Nhập – Xuất theo kỳ</h3>
          <Segmented
            value={periodMode}
            onChange={setPeriodMode}
            options={[
              { label: 'Theo tháng', value: 'month' },
              { label: 'Theo tuần', value: 'week' },
            ]}
          />
        </div>
        <DataTable columns={periodColumns} dataSource={periodStats} rowKey="key" pagination={false} />
      </div>

      <div className="mt-4">
        <h3 className="mb-3 text-base font-semibold text-ink">Chênh lệch kiểm kê</h3>

        <FilterBar extra={<span className="text-sm text-ink-sub">{variance.length} phiếu</span>}>
          <Input
            allowClear
            prefix={<SearchOutlined className="text-slate-400" />}
            placeholder="Tìm mã phiếu..."
            className="w-full sm:w-64"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <Select
            allowClear
            placeholder="Trạng thái"
            className="w-full sm:w-44"
            options={statusOptions(APPROVAL_STATUSES)}
            value={status}
            onChange={setStatus}
          />
          <RangePicker format="DD/MM/YYYY" className="w-full sm:w-auto" onChange={(dates) => setRange(dates)} />
        </FilterBar>

        <FadeSection dataKey={variance.map((r) => r.id).join(',')}>
          <DataTable
            columns={varianceColumns}
            dataSource={variance}
            pagination={false}
            locale={{ emptyText: <TableEmptyState message="Không tìm thấy phiếu kiểm kê phù hợp" /> }}
          />
        </FadeSection>
      </div>

      <DocDetailModal
        open={!!detailRecord}
        onClose={() => setDetailRecord(null)}
        title={detailRecord?.code}
        fields={
          detailRecord && [
            { label: 'Ngày', value: formatDate(detailRecord.date) },
            { label: 'Người kiểm', value: detailRecord.createdBy },
            { label: 'Tổng chênh lệch', value: <DiffValue value={totalDiff(detailRecord.items)} /> },
            { label: 'Trạng thái', value: <StatusPill status={detailRecord.status} /> },
          ]
        }
      >
        {detailRecord && <StocktakeItemsDetail items={detailRecord.items} note={detailRecord.note} />}
      </DocDetailModal>

      <Modal
        open={!!periodDetail}
        onCancel={() => setPeriodDetail(null)}
        footer={null}
        title={periodDetail && `Phiếu Nhập – Xuất · ${periodDetail.label}`}
        width={800}
        destroyOnHidden
      >
        <Tabs
          size="small"
          className="text-xs"
          items={[
            {
              key: 'inbound',
              label: 'Phiếu nhập',
              children: (
                <DataTable
                  size="small"
                  columns={periodDocColumns}
                  dataSource={periodDetail?.docs.filter((d) => d.kind === 'inbound') ?? []}
                  rowKey="id"
                  pagination={false}
                  locale={{ emptyText: <TableEmptyState message="Không có phiếu nhập trong kỳ" /> }}
                />
              ),
            },
            {
              key: 'outbound',
              label: 'Phiếu xuất',
              children: (
                <DataTable
                  size="small"
                  columns={periodDocColumns}
                  dataSource={periodDetail?.docs.filter((d) => d.kind === 'outbound') ?? []}
                  rowKey="id"
                  pagination={false}
                  locale={{ emptyText: <TableEmptyState message="Không có phiếu xuất trong kỳ" /> }}
                />
              ),
            },
          ]}
        />
      </Modal>
    </>
  );
}
