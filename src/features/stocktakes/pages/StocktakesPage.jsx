import { useMemo, useState } from 'react';
import { Button, Input, Select, Tag, App } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/ui/PageHeader';
import { usePermissions } from '@/hooks/usePermissions';
import FilterBar from '@/components/ui/FilterBar';
import DataTable from '@/components/ui/DataTable';
import DocCode from '@/components/ui/DocCode';
import StatusPill from '@/components/ui/StatusPill';
import ApprovalActions from '@/components/ui/ApprovalActions';
import { STOCKTAKES } from '@/mock/stocktakes';
import { statusOptions, APPROVAL_STATUSES } from '@/constants/status';
import { formatDate } from '@/utils/date';

// Tổng chênh lệch (counted - system) của 1 phiếu.
const totalDiff = (items) => items.reduce((s, it) => s + (it.countedQty - it.systemQty), 0);

function DiffValue({ value }) {
  const cls = value === 0 ? 'text-ink-sub' : value > 0 ? 'text-[#15803d]' : 'text-[#b91c1c]';
  return (
    <span className={`mono font-semibold ${cls}`}>
      {value > 0 ? `+${value}` : value}
    </span>
  );
}

function ItemsDetail({ items }) {
  return (
    <div className="rounded-lg bg-slate-50/70 p-1">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-ink-sub">
            <th className="px-3 py-2 font-semibold">Sản phẩm</th>
            <th className="px-3 py-2 font-semibold">Lô</th>
            <th className="px-3 py-2 text-right font-semibold">Tồn hệ thống</th>
            <th className="px-3 py-2 text-right font-semibold">Đếm thực tế</th>
            <th className="px-3 py-2 text-right font-semibold">Chênh lệch</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, i) => (
            <tr key={i} className="border-t border-slate-200/70">
              <td className="px-3 py-2 text-ink">{it.productName}</td>
              <td className="px-3 py-2"><DocCode muted>{it.lot}</DocCode></td>
              <td className="px-3 py-2 text-right mono">{it.systemQty}</td>
              <td className="px-3 py-2 text-right mono">{it.countedQty}</td>
              <td className="px-3 py-2 text-right"><DiffValue value={it.countedQty - it.systemQty} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function StocktakesPage() {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const { canCreateStocktake, canApproveDocs } = usePermissions();
  const [rows, setRows] = useState(STOCKTAKES);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState(null);

  const data = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return rows.filter((r) => {
      const okKw = !kw || [r.code, r.warehouse].some((v) => v.toLowerCase().includes(kw));
      const okStatus = !status || r.status === status;
      return okKw && okStatus;
    });
  }, [rows, keyword, status]);

  const setStatusOf = (id, next, msg) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: next } : r)));
    message.success(msg);
  };

  const columns = [
    { title: 'Mã phiếu', dataIndex: 'code', width: 150, render: (c) => <DocCode>{c}</DocCode> },
    { title: 'Kho', dataIndex: 'warehouse', render: (w) => <span className="font-medium text-ink">{w}</span> },
    { title: 'Ngày', dataIndex: 'date', align: 'center', width: 120, render: (d) => <span className="mono text-ink-sub">{formatDate(d)}</span> },
    { title: 'Số dòng', dataIndex: 'items', align: 'center', width: 90, render: (items) => items.length },
    {
      title: 'Chênh lệch',
      dataIndex: 'items',
      key: 'diff',
      align: 'right',
      width: 120,
      render: (items) => <DiffValue value={totalDiff(items)} />,
    },
    { title: 'Trạng thái', dataIndex: 'status', align: 'center', width: 130, render: (s) => <StatusPill status={s} /> },
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
          placeholder="Tìm mã phiếu, kho..."
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

      <DataTable
        columns={columns}
        dataSource={data}
        expandable={{
          expandedRowRender: (r) => <ItemsDetail items={r.items} />,
          rowExpandable: (r) => r.items?.length > 0,
        }}
      />
    </>
  );
}
