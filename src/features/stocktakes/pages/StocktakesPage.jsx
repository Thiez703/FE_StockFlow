import { useMemo, useState } from 'react';
import { Button, Input, Select, Tag, App } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/ui/PageHeader';
import { usePermissions } from '@/hooks/usePermissions';
import { useColumnSort } from '@/hooks/useColumnSort';
import FilterBar from '@/components/ui/FilterBar';
import DataTable from '@/components/ui/DataTable';
import DocCode from '@/components/ui/DocCode';
import StatusPill from '@/components/ui/StatusPill';
import TableEmptyState from '@/components/ui/TableEmptyState';
import FadeSection from '@/components/ui/FadeSection';
import ApprovalActions from '@/components/ui/ApprovalActions';
import DocDetailModal from '@/components/ui/DocDetailModal';
import StocktakeItemsDetail, { DiffValue } from '@/features/stocktakes/components/StocktakeItemsDetail';
import { STOCKTAKES } from '@/mock/stocktakes';
import { statusOptions, APPROVAL_STATUSES } from '@/constants/status';
import { formatDate } from '@/utils/date';

// Tổng chênh lệch (counted - system) của 1 phiếu.
const totalDiff = (items) => items.reduce((s, it) => s + (it.countedQty - it.systemQty), 0);

export default function StocktakesPage() {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const { canCreateStocktake, canApproveDocs } = usePermissions();
  const [rows, setRows] = useState(STOCKTAKES);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState(null);
  const [detailRecord, setDetailRecord] = useState(null);
  const { sortableTitle, sortRows } = useColumnSort();

  const data = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    const filtered = rows.filter((r) => {
      const okKw = !kw || r.code.toLowerCase().includes(kw);
      const okStatus = !status || r.status === status;
      return okKw && okStatus;
    });
    const withDiff = filtered.map((r) => ({ ...r, diff: totalDiff(r.items) }));
    return sortRows(withDiff);
  }, [rows, keyword, status, sortRows]);

  const setStatusOf = (id, next, msg) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: next } : r)));
    message.success(msg);
  };

  const columns = [
    { title: 'Mã phiếu', dataIndex: 'code', width: 150, render: (c) => <DocCode>{c}</DocCode> },
    {
      title: sortableTitle('Ngày', 'date'),
      dataIndex: 'date',
      align: 'center',
      width: 130,
      render: (d) => <span className="mono text-ink-sub">{formatDate(d)}</span>,
    },
    { title: 'Số dòng', dataIndex: 'items', align: 'center', width: 90, render: (items) => items.length },
    { title: 'Người kiểm', dataIndex: 'createdBy', width: 140, render: (v) => <span className="text-ink-sub">{v}</span> },
    {
      title: sortableTitle('Chênh lệch', 'diff'),
      dataIndex: 'diff',
      align: 'right',
      width: 130,
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
    // FIX 5b: Ẩn cột Duyệt nếu không có quyền
    ...(canApproveDocs ? [{
      title: 'Duyệt',
      key: 'action',
      align: 'center',
      width: 110,
      render: (_, r) => (
        <ApprovalActions
          record={r}
          onApprove={(id) => setStatusOf(id, 'APPROVED', 'Đã duyệt phiếu kiểm kê')}
          onReject={(id) => setStatusOf(id, 'REJECTED', 'Đã từ chối phiếu kiểm kê')}
        />
      ),
    }] : []),
  ];

  return (
    <>
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            Kiểm kê
            {!canCreateStocktake && <Tag color="default">Chỉ xem</Tag>}
          </span>
        }
        subtitle="Đối chiếu tồn hệ thống với số đếm thực tế"
        breadcrumb={[{ title: 'Kiểm soát' }, { title: 'Kiểm kê' }]}
        extra={
          canCreateStocktake && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/stocktakes/create')}>
              Lập phiếu kiểm kê
            </Button>
          )
        }
      />

      <FilterBar extra={<span className="text-sm text-ink-sub">{data.length} phiếu</span>}>
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
      </FilterBar>

      <FadeSection dataKey={data.map((r) => r.id).join(',')}>
        <DataTable
          columns={columns}
          dataSource={data}
          rowClassName={(r) => (r.diff !== 0 ? '!bg-[#fffbeb]' : '')}
          locale={{ emptyText: <TableEmptyState message="Không tìm thấy phiếu kiểm kê phù hợp" /> }}
        />
      </FadeSection>

      <DocDetailModal
        open={!!detailRecord}
        onClose={() => setDetailRecord(null)}
        title={detailRecord?.code}
        fields={
          detailRecord && [
            { label: 'Ngày', value: formatDate(detailRecord.date) },
            { label: 'Người kiểm', value: detailRecord.createdBy },
            { label: 'Chênh lệch', value: <DiffValue value={totalDiff(detailRecord.items)} /> },
            { label: 'Trạng thái', value: <StatusPill status={detailRecord.status} /> },
          ]
        }
      >
        {detailRecord && <StocktakeItemsDetail items={detailRecord.items} note={detailRecord.note} />}
      </DocDetailModal>
    </>
  );
}
